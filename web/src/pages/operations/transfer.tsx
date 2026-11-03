import { useMemo, useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	BadgeCheck,
	CalendarDays,
	Check,
	CheckCircle2,
	Clock3,
	Download,
	Eye,
	FileCheck2,
	FileText,
	Filter,
	MapPin,
	Package,
	Plus,
	Search,
	ShieldCheck,
	Truck,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TransferStatus =
	| "Transfer requested"
	| "Under review"
	| "Approved"
	| "Vehicle assigned"
	| "Loading"
	| "Dispatched"
	| "Received"
	| "Transferred out"
	| "Returned / Re-exported"
	| "Rejected";

type TransferType = "Terminal transfer" | "Warehouse transfer" | "Return" | "Re-export";

type TransferRecord = {
	id: string;
	reference: string;
	shipmentReference: string;
	billOfLading: string;
	containerNo: string;
	consignee: string;
	organisation: string;
	cargo: string;
	transferType: TransferType;
	origin: string;
	destination: string;
	reason: string;
	requestedDate: string;
	expectedDate: string;
	transporter: string;
	vehicle: string;
	driver: string;
	status: TransferStatus;
	authorisedBy?: string;
	dispatchDate?: string;
	receivedDate?: string;
	notes?: string;
};

const initialTransfers: TransferRecord[] = [
	{
		id: "1",
		reference: "TRN-TRF-2026-0018",
		shipmentReference: "TRN-SHP-2026-001184",
		billOfLading: "MAEU-ABJ-784512",
		containerNo: "MSCU7281940",
		consignee: "Northstar Industrial Supplies Ltd",
		organisation: "Northstar Logistics",
		cargo: "Industrial generator parts",
		transferType: "Terminal transfer",
		origin: "Trinu Terminal · Yard A",
		destination: "Lagos Inland Container Terminal",
		reason: "Terminal capacity arrangement",
		requestedDate: "2026-11-01",
		expectedDate: "2026-11-05",
		transporter: "Prime Haulage Services",
		vehicle: "ABC-482-KD",
		driver: "Samuel Okafor",
		status: "Approved",
		authorisedBy: "Operations Supervisor",
		notes: "Transfer approved. Awaiting vehicle assignment confirmation.",
	},
	{
		id: "2",
		reference: "TRN-TRF-2026-0017",
		shipmentReference: "TRN-SHP-2026-001162",
		billOfLading: "CMAU-ABJ-229104",
		containerNo: "CMAU4819203",
		consignee: "Meridian Foods & Beverages",
		organisation: "Meridian Cargo Services",
		cargo: "Packaged food products",
		transferType: "Warehouse transfer",
		origin: "Trinu Terminal · Warehouse B",
		destination: "Approved Off-dock Warehouse · Abuja",
		reason: "Off-dock storage arrangement",
		requestedDate: "2026-10-30",
		expectedDate: "2026-11-04",
		transporter: "Meridian Transport",
		vehicle: "ABC-921-XY",
		driver: "Ibrahim Musa",
		status: "Loading",
		authorisedBy: "Terminal Manager",
		notes: "Cargo preparation and loading in progress.",
	},
	{
		id: "3",
		reference: "TRN-TRF-2026-0016",
		shipmentReference: "TRN-SHP-2026-001139",
		billOfLading: "OOLU-ABJ-610382",
		containerNo: "OOLU9021845",
		consignee: "Apex Building Materials",
		organisation: "Apex Freight Partners",
		cargo: "Ceramic tiles",
		transferType: "Terminal transfer",
		origin: "Trinu Terminal · Yard C",
		destination: "Port Harcourt Terminal",
		reason: "Consignee transfer request",
		requestedDate: "2026-10-27",
		expectedDate: "2026-11-02",
		transporter: "Westline Haulage",
		vehicle: "ABJ-208-KA",
		driver: "David Eze",
		status: "Dispatched",
		authorisedBy: "Operations Supervisor",
		dispatchDate: "2026-11-02",
		notes: "Vehicle departed. Awaiting destination confirmation.",
	},
	{
		id: "4",
		reference: "TRN-TRF-2026-0015",
		shipmentReference: "TRN-SHP-2026-001102",
		billOfLading: "HLCU-ABJ-501729",
		containerNo: "HLCU7812390",
		consignee: "Crestline Automotive Ltd",
		organisation: "Crestline Shipping",
		cargo: "Vehicle spare parts",
		transferType: "Re-export",
		origin: "Trinu Terminal · Yard B",
		destination: "Apapa Port · Export Terminal",
		reason: "Approved re-export",
		requestedDate: "2026-10-22",
		expectedDate: "2026-10-29",
		transporter: "Oceanlink Logistics",
		vehicle: "LAG-552-RT",
		driver: "Peter James",
		status: "Returned / Re-exported",
		authorisedBy: "Customs / Operations",
		dispatchDate: "2026-10-28",
		receivedDate: "2026-10-29",
		notes: "Re-export movement completed.",
	},
	{
		id: "5",
		reference: "TRN-TRF-2026-0014",
		shipmentReference: "TRN-SHP-2026-001087",
		billOfLading: "EGLV-ABJ-328104",
		containerNo: "EGLV6192840",
		consignee: "Bluepeak Trading Company",
		organisation: "Bluepeak Logistics",
		cargo: "Electrical equipment",
		transferType: "Return",
		origin: "Trinu Terminal · Yard D",
		destination: "Origin Port · Lagos",
		reason: "Return to carrier",
		requestedDate: "2026-10-31",
		expectedDate: "2026-11-07",
		transporter: "Bluepeak Transport",
		vehicle: "ABJ-710-XY",
		driver: "John Ibrahim",
		status: "Transfer requested",
		notes: "Awaiting transfer authorization.",
	},
];

const statusTones: Record<TransferStatus, ReturnType<typeof statusTone>> = {
	"Transfer requested": "warning",
	"Under review": "info",
	Approved: "success",
	"Vehicle assigned": "info",
	Loading: "warning",
	Dispatched: "info",
	Received: "success",
	"Transferred out": "success",
	"Returned / Re-exported": "success",
	Rejected: "critical",
};

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const formatDate = (date?: string) => {
	if (!date) return "—";

	return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const workflowSteps = [
	"Transfer requested",
	"Under review",
	"Approved",
	"Vehicle assigned",
	"Loading",
	"Dispatched",
	"Received",
];

export default function OperationsTransferPage() {
	const [records, setRecords] = useState(initialTransfers);
	const [activeTab, setActiveTab] = useState<"all" | "requests" | "completed">("all");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [typeFilter, setTypeFilter] = useState("ALL");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [showAssignment, setShowAssignment] = useState(false);
	const [showReject, setShowReject] = useState(false);

	const [newTransfer, setNewTransfer] = useState({
		shipmentReference: "",
		containerNo: "",
		transferType: "Terminal transfer" as TransferType,
		destination: "",
		reason: "",
		expectedDate: "",
	});

	const [assignment, setAssignment] = useState({
		transporter: "",
		vehicle: "",
		driver: "",
	});

	const [rejectionReason, setRejectionReason] = useState("");

	const selected = records.find((record) => record.id === selectedId) ?? null;

	const pendingCount = records.filter(
		(record) =>
			record.status === "Transfer requested" ||
			record.status === "Under review"
	).length;

	const activeCount = records.filter((record) =>
		["Approved", "Vehicle assigned", "Loading", "Dispatched"].includes(record.status)
	).length;

	const completedCount = records.filter((record) =>
		["Received", "Transferred out", "Returned / Re-exported"].includes(record.status)
	).length;

	const filteredRecords = useMemo(() => {
		return records.filter((record) => {
			const query = search.toLowerCase();

			const matchesSearch = [
				record.reference,
				record.shipmentReference,
				record.billOfLading,
				record.containerNo,
				record.consignee,
				record.organisation,
				record.destination,
			]
				.join(" ")
				.toLowerCase()
				.includes(query);

			const matchesStatus =
				statusFilter === "ALL" || record.status === statusFilter;

			const matchesType =
				typeFilter === "ALL" || record.transferType === typeFilter;

			const matchesTab =
				activeTab === "all" ||
				(activeTab === "requests" &&
					["Transfer requested", "Under review", "Approved"].includes(record.status)) ||
				(activeTab === "completed" &&
					["Received", "Transferred out", "Returned / Re-exported"].includes(record.status));

			return matchesSearch && matchesStatus && matchesType && matchesTab;
		});
	}, [records, search, statusFilter, typeFilter, activeTab]);

	const updateRecord = (
		id: string,
		updates: Partial<TransferRecord>
	) => {
		setRecords((current) =>
			current.map((record) =>
				record.id === id ? { ...record, ...updates } : record
			)
		);
	};

	const approveTransfer = () => {
		if (!selected) return;

		updateRecord(selected.id, {
			status: "Approved",
			authorisedBy: "Operations Supervisor",
			notes: "Transfer request approved.",
		});

		toast.success("Transfer request approved.");
	};

	const assignVehicle = () => {
		if (!selected || !assignment.transporter || !assignment.vehicle || !assignment.driver) {
			toast.error("Complete all vehicle and driver details.");
			return;
		}

		updateRecord(selected.id, {
			status: "Vehicle assigned",
			transporter: assignment.transporter,
			vehicle: assignment.vehicle,
			driver: assignment.driver,
			notes: "Vehicle and driver assigned.",
		});

		setShowAssignment(false);
		toast.success("Transport details assigned.");
	};

	const startLoading = () => {
		if (!selected) return;

		updateRecord(selected.id, {
			status: "Loading",
			notes: "Loading operation started.",
		});

		toast.success("Loading started.");
	};

	const confirmDispatch = () => {
		if (!selected) return;

		updateRecord(selected.id, {
			status: "Dispatched",
			dispatchDate: new Date().toISOString().slice(0, 10),
			notes: "Transfer dispatched from origin terminal.",
		});

		toast.success("Transfer dispatch recorded.");
	};

	const confirmReceipt = () => {
		if (!selected) return;

		updateRecord(selected.id, {
			status:
				selected.transferType === "Re-export" || selected.transferType === "Return"
					? "Returned / Re-exported"
					: "Received",
			receivedDate: new Date().toISOString().slice(0, 10),
			notes: "Destination receipt confirmed.",
		});

		toast.success("Destination receipt confirmed.");
	};

	const completeTransfer = () => {
		if (!selected || selected.status !== "Received") return;

		updateRecord(selected.id, {
			status: "Transferred out",
			notes: "Transfer completed and destination receipt recorded.",
		});

		toast.success("Transfer marked as completed.");
	};

	const rejectTransfer = () => {
		if (!selected || !rejectionReason.trim()) return;

		updateRecord(selected.id, {
			status: "Rejected",
			notes: rejectionReason.trim(),
		});

		setShowReject(false);
		setRejectionReason("");
		toast.success("Transfer request rejected.");
	};

	const createTransfer = () => {
		if (
			!newTransfer.shipmentReference ||
			!newTransfer.containerNo ||
			!newTransfer.destination ||
			!newTransfer.reason ||
			!newTransfer.expectedDate
		) {
			toast.error("Complete all required fields.");
			return;
		}

		const record: TransferRecord = {
			id: `new-${Date.now()}`,
			reference: `TRN-TRF-2026-${String(records.length + 1).padStart(4, "0")}`,
			shipmentReference: newTransfer.shipmentReference,
			billOfLading: "To be confirmed",
			containerNo: newTransfer.containerNo,
			consignee: "Existing shipment consignee",
			organisation: "Existing shipment organisation",
			cargo: "Existing shipment cargo",
			transferType: newTransfer.transferType,
			origin: "Trinu Terminal",
			destination: newTransfer.destination,
			reason: newTransfer.reason,
			requestedDate: new Date().toISOString().slice(0, 10),
			expectedDate: newTransfer.expectedDate,
			transporter: "Not assigned",
			vehicle: "Not assigned",
			driver: "Not assigned",
			status: "Transfer requested",
		};

		setRecords((current) => [record, ...current]);
		setShowCreate(false);
		setNewTransfer({
			shipmentReference: "",
			containerNo: "",
			transferType: "Terminal transfer",
			destination: "",
			reason: "",
			expectedDate: "",
		});

		toast.success("Transfer request added to the register.");
	};

	const getCurrentStep = (status: TransferStatus) => {
		if (status === "Rejected") return -1;
		if (status === "Transferred out" || status === "Returned / Re-exported") return 6;
		return workflowSteps.indexOf(status);
	};

	const currentStep = selected ? getCurrentStep(selected.status) : -1;

	return (
		<AppShell title="Transfer Management" eyebrow="Operations · Cargo Movement">
			<div className="space-y-5">
				{selected ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Button
								variant="outline"
								className="border-line"
								onClick={() => {
									setSelectedId(null);
									setShowAssignment(false);
								}}
							>
								<ArrowLeft className="mr-2 size-4" />
								Back to transfer register
							</Button>

							<StatusBadge
								label={selected.status}
								tone={statusTones[selected.status]}
							/>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<p className={labelClass}>Transfer reference</p>
									<h2 className="mt-1 font-display text-xl font-bold text-ink">
										{selected.reference}
									</h2>
									<p className="mt-1 font-mono text-xs text-ink-soft">
										{selected.shipmentReference}
									</p>
								</div>

								<div className="rounded-lg bg-orange/10 px-4 py-3">
									<p className={labelClass}>Transfer type</p>
									<p className="mt-1 text-sm font-semibold text-orange-deep">
										{selected.transferType}
									</p>
								</div>
							</div>

							<div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
								<div>
									<p className={labelClass}>Bill of Lading</p>
									<p className="mt-1 font-mono text-xs font-semibold text-ink">
										{selected.billOfLading}
									</p>
								</div>
								<div>
									<p className={labelClass}>Container number</p>
									<p className="mt-1 font-mono text-xs font-semibold text-ink">
										{selected.containerNo}
									</p>
								</div>
								<div>
									<p className={labelClass}>Consignee</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.consignee}
									</p>
								</div>
								<div>
									<p className={labelClass}>Organisation</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.organisation}
									</p>
								</div>
								<div>
									<p className={labelClass}>Cargo</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.cargo}
									</p>
								</div>
								<div>
									<p className={labelClass}>Requested date</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.requestedDate)}
									</p>
								</div>
								<div>
									<p className={labelClass}>Expected arrival</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.expectedDate)}
									</p>
								</div>
								<div>
									<p className={labelClass}>Authorised by</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.authorisedBy ?? "Awaiting approval"}
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<h3 className="font-display text-lg font-bold text-ink">
								Transfer route
							</h3>

							<div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
								<div className="rounded-lg bg-sand/60 p-4">
									<div className="flex items-center gap-2 text-ink-soft">
										<MapPin className="size-4" />
										<span className={labelClass}>Origin</span>
									</div>
									<p className="mt-2 text-sm font-semibold text-ink">
										{selected.origin}
									</p>
								</div>

								<div className="hidden text-orange-deep md:block">
									<ArrowRight className="size-6" />
								</div>

								<div className="rounded-lg bg-sand/60 p-4">
									<div className="flex items-center gap-2 text-ink-soft">
										<MapPin className="size-4" />
										<span className={labelClass}>Destination</span>
									</div>
									<p className="mt-2 text-sm font-semibold text-ink">
										{selected.destination}
									</p>
								</div>
							</div>

							<div className="mt-4 rounded-lg border border-line p-3">
								<p className={labelClass}>Reason for transfer</p>
								<p className="mt-1 text-xs leading-5 text-ink">
									{selected.reason}
								</p>
							</div>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h3 className="font-display text-lg font-bold text-ink">
										Transfer progress
									</h3>
									<p className="mt-1 text-xs text-ink-soft">
										Track the transfer from request through destination receipt.
									</p>
								</div>
								<span className="font-mono text-[10px] text-ink-soft">
									{currentStep < 0
										? "REJECTED"
										: `${Math.min(currentStep + 1, 7)} / 7 STEPS`}
								</span>
							</div>

							<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
								{workflowSteps.map((step, index) => {
									const completed = currentStep >= index;
									const active = currentStep === index;

									return (
										<div key={step} className="relative">
											<div
												className={cn(
													"flex size-8 items-center justify-center rounded-full border",
													completed
														? "border-orange bg-orange text-white"
														: "border-line bg-sand text-ink-soft",
													active && "ring-4 ring-orange/10"
												)}
											>
												{completed ? (
													<Check className="size-4" />
												) : (
													<span className="font-mono text-[10px]">{index + 1}</span>
												)}
											</div>
											<p
												className={cn(
													"mt-2 text-[10px] leading-4",
													completed ? "font-semibold text-ink" : "text-ink-soft"
												)}
											>
												{step}
											</p>
										</div>
									);
								})}
							</div>

							{selected.status === "Rejected" && (
								<div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
									<strong>Transfer rejected:</strong> {selected.notes}
								</div>
							)}
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<div>
								<h3 className="font-display text-lg font-bold text-ink">
									Transport and dispatch details
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Vehicle, driver and destination movement information.
								</p>
							</div>

							<div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
								<div>
									<p className={labelClass}>Transporter</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.transporter}
									</p>
								</div>
								<div>
									<p className={labelClass}>Vehicle registration</p>
									<p className="mt-1 font-mono text-xs font-semibold text-ink">
										{selected.vehicle}
									</p>
								</div>
								<div>
									<p className={labelClass}>Driver</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.driver}
									</p>
								</div>
								<div>
									<p className={labelClass}>Dispatch date</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.dispatchDate)}
									</p>
								</div>
								<div>
									<p className={labelClass}>Destination receipt</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.receivedDate)}
									</p>
								</div>
								<div>
									<p className={labelClass}>Expected arrival</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.expectedDate)}
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<h3 className="font-display text-lg font-bold text-ink">
								Transfer actions
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Available actions depend on the current transfer stage.
							</p>

							<div className="mt-4 flex flex-wrap gap-2">
								{selected.status === "Transfer requested" && (
									<>
										<Button
											className="bg-orange text-white hover:bg-orange-deep"
											onClick={() => updateRecord(selected.id, { status: "Under review" })}
										>
											<Eye className="mr-2 size-4" />
											Start review
										</Button>
										<Button
											variant="outline"
											className="border-rose-200 text-rose-700"
											onClick={() => setShowReject(true)}
										>
											<X className="mr-2 size-4" />
											Reject request
										</Button>
									</>
								)}

								{selected.status === "Under review" && (
									<>
										<Button
											className="bg-orange text-white hover:bg-orange-deep"
											onClick={approveTransfer}
										>
											<ShieldCheck className="mr-2 size-4" />
											Approve transfer
										</Button>
										<Button
											variant="outline"
											className="border-rose-200 text-rose-700"
											onClick={() => setShowReject(true)}
										>
											<X className="mr-2 size-4" />
											Reject request
										</Button>
									</>
								)}

								{selected.status === "Approved" && (
									<Button
										className="bg-orange text-white hover:bg-orange-deep"
										onClick={() => setShowAssignment(true)}
									>
										<Truck className="mr-2 size-4" />
										Assign vehicle
									</Button>
								)}

								{selected.status === "Vehicle assigned" && (
									<Button
										className="bg-orange text-white hover:bg-orange-deep"
										onClick={startLoading}
									>
										<Package className="mr-2 size-4" />
										Start loading
									</Button>
								)}

								{selected.status === "Loading" && (
									<Button
										className="bg-orange text-white hover:bg-orange-deep"
										onClick={confirmDispatch}
									>
										<Truck className="mr-2 size-4" />
										Confirm dispatch
									</Button>
								)}

								{selected.status === "Dispatched" && (
									<Button
										className="bg-orange text-white hover:bg-orange-deep"
										onClick={confirmReceipt}
									>
										<CheckCircle2 className="mr-2 size-4" />
										Confirm destination receipt
									</Button>
								)}

								{selected.status === "Received" && (
									<Button
										className="bg-emerald-700 text-white hover:bg-emerald-800"
										onClick={completeTransfer}
									>
										<BadgeCheck className="mr-2 size-4" />
										Complete transfer
									</Button>
								)}

								<Button
									variant="outline"
									className="border-line"
									onClick={() => toast.info("Transfer document preview is UI-only.")}
								>
									<FileText className="mr-2 size-4" />
									View documents
								</Button>
							</div>

							{selected.notes && (
								<div className="mt-4 rounded-lg bg-sand/60 p-3">
									<p className={labelClass}>Latest operations note</p>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										{selected.notes}
									</p>
								</div>
							)}
						</div>
					</>
				) : (
					<>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
									Terminal operations · Cargo movement
								</p>
								<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
									Transfer Management
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
									Manage authorised cargo transfers, returns and re-exports from
									the terminal through to destination confirmation.
								</p>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									className="border-line"
									onClick={() => toast.success("Transfer register export is UI-only.")}
								>
									<Download className="mr-2 size-4" />
									Export
								</Button>
								<Button
									className="bg-orange text-white hover:bg-orange-deep"
									onClick={() => setShowCreate(true)}
								>
									<Plus className="mr-2 size-4" />
									New transfer
								</Button>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric
								label="Total transfers"
								value={String(records.length)}
								detail="All transfer records"
								tone="info"
								icon={Package}
							/>
							<Metric
								label="Awaiting approval"
								value={String(pendingCount)}
								detail="Requests requiring review"
								tone="warning"
								icon={Clock3}
							/>
							<Metric
								label="Active transfers"
								value={String(activeCount)}
								detail="Approved or in transit"
								tone="info"
								icon={Truck}
							/>
							<Metric
								label="Completed"
								value={String(completedCount)}
								detail="Destination confirmed"
								tone="success"
								icon={CheckCircle2}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<button
								onClick={() => setActiveTab("requests")}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<p className={labelClass}>Transfer requests</p>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{pendingCount}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Awaiting review or approval
								</p>
							</button>

							<button
								onClick={() => setStatusFilter("Dispatched")}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<p className={labelClass}>In transit</p>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{records.filter((record) => record.status === "Dispatched").length}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Awaiting destination confirmation
								</p>
							</button>

							<button
								onClick={() => setActiveTab("completed")}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<p className={labelClass}>Completed movements</p>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{completedCount}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Transferred, returned or re-exported
								</p>
							</button>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
							<div className="flex gap-6">
								{([
									["all", "All transfers"],
									["requests", "Transfer requests"],
									["completed", "Completed"],
								] as const).map(([key, label]) => (
									<button
										key={key}
										onClick={() => setActiveTab(key)}
										className={cn(
											"border-b-2 px-1 pb-3 text-xs font-semibold",
											activeTab === key
												? "border-orange text-orange-deep"
												: "border-transparent text-ink-soft"
										)}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative w-full sm:max-w-md">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search transfer, shipment, B/L or container..."
									className="pl-9"
								/>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Filter className="size-4 text-ink-soft" />

								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="h-9 rounded-md border border-line bg-paper px-3 text-xs text-ink outline-none"
								>
									<option value="ALL">All statuses</option>
									{Object.keys(statusTones).map((status) => (
										<option key={status}>{status}</option>
									))}
								</select>

								<select
									value={typeFilter}
									onChange={(event) => setTypeFilter(event.target.value)}
									className="h-9 rounded-md border border-line bg-paper px-3 text-xs text-ink outline-none"
								>
									<option value="ALL">All transfer types</option>
									<option>Terminal transfer</option>
									<option>Warehouse transfer</option>
									<option>Return</option>
									<option>Re-export</option>
								</select>
							</div>
						</div>

						<div className="overflow-hidden rounded-xl border border-line bg-paper">
							<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
								<div>
									<h3 className="text-sm font-semibold text-ink">
										Transfer register
									</h3>
									<p className="mt-1 text-[11px] text-ink-soft">
										All cargo transfer requests and movements.
									</p>
								</div>

								<span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">
									{filteredRecords.length} RECORDS
								</span>
							</div>

							<div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_130px_120px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft xl:grid">
								<span>Transfer / Shipment</span>
								<span>Consignee</span>
								<span>Origin</span>
								<span>Destination</span>
								<span>Expected date</span>
								<span>Status</span>
							</div>

							{filteredRecords.map((record) => (
								<button
									key={record.id}
									onClick={() => setSelectedId(record.id)}
									className="grid w-full gap-3 border-b border-line px-4 py-4 text-left transition hover:bg-sand/40 last:border-0 xl:grid-cols-[1.1fr_1fr_1fr_1fr_130px_120px] xl:items-center"
								>
									<div>
										<p className="font-mono text-xs font-bold text-ink">
											{record.reference}
										</p>
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											{record.shipmentReference}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{record.containerNo}
										</p>
									</div>

									<div>
										<p className="text-xs font-medium text-ink">
											{record.consignee}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{record.transferType}
										</p>
									</div>

									<div>
										<p className="flex items-start gap-1 text-xs text-ink">
											<MapPin className="mt-0.5 size-3 shrink-0 text-ink-soft" />
											{record.origin}
										</p>
									</div>

									<div>
										<p className="flex items-start gap-1 text-xs text-ink">
											<MapPin className="mt-0.5 size-3 shrink-0 text-orange-deep" />
											{record.destination}
										</p>
									</div>

									<div>
										<p className="text-xs font-semibold text-ink">
											{formatDate(record.expectedDate)}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											Requested {formatDate(record.requestedDate)}
										</p>
									</div>

									<div className="flex items-center justify-between gap-2">
										<StatusBadge
											label={record.status}
											tone={statusTones[record.status]}
										/>
										<ArrowRight className="size-4 shrink-0 text-ink-soft" />
									</div>
								</button>
							))}

							{filteredRecords.length === 0 && (
								<div className="p-12 text-center">
									<Package className="mx-auto size-8 text-ink-soft" />
									<p className="mt-3 text-sm font-semibold text-ink">
										No transfers found
									</p>
									<p className="mt-1 text-xs text-ink-soft">
										Change your search or filters.
									</p>
								</div>
							)}

							<div className="border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
								Showing {filteredRecords.length} of {records.length} transfer records
							</div>
						</div>

						<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep">
									<ShieldCheck className="size-4" />
								</span>
								<div>
									<p className="text-xs font-semibold text-ink">
										Transfer control
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Transfers should only be dispatched after the required
										authorisations, documentation and movement checks have been
										completed. Destination receipt should be recorded before
										closing the transfer.
									</p>
								</div>
							</div>
						</div>
					</>
				)}
			</div>

			{showCreate && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
					onClick={() => setShowCreate(false)}
				>
					<div
						className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold text-ink">
									New transfer request
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Create a transfer request for an existing shipment.
								</p>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-5 space-y-4">
							<div>
								<label className={labelClass}>Shipment reference</label>
								<Input
									value={newTransfer.shipmentReference}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											shipmentReference: event.target.value,
										}))
									}
									placeholder="Enter existing shipment reference"
									className="mt-1.5"
								/>
							</div>

							<div>
								<label className={labelClass}>Container number</label>
								<Input
									value={newTransfer.containerNo}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											containerNo: event.target.value,
										}))
									}
									placeholder="Enter container number"
									className="mt-1.5"
								/>
							</div>

							<div>
								<label className={labelClass}>Transfer type</label>
								<select
									value={newTransfer.transferType}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											transferType: event.target.value as TransferType,
										}))
									}
									className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink"
								>
									<option>Terminal transfer</option>
									<option>Warehouse transfer</option>
									<option>Return</option>
									<option>Re-export</option>
								</select>
							</div>

							<div>
								<label className={labelClass}>Destination</label>
								<Input
									value={newTransfer.destination}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											destination: event.target.value,
										}))
									}
									placeholder="Enter destination terminal or facility"
									className="mt-1.5"
								/>
							</div>

							<div>
								<label className={labelClass}>Transfer reason</label>
								<textarea
									value={newTransfer.reason}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											reason: event.target.value,
										}))
									}
									rows={3}
									className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
									placeholder="Explain why this cargo needs to be transferred..."
								/>
							</div>

							<div>
								<label className={labelClass}>Expected arrival date</label>
								<Input
									type="date"
									value={newTransfer.expectedDate}
									onChange={(event) =>
										setNewTransfer((current) => ({
											...current,
											expectedDate: event.target.value,
										}))
									}
									className="mt-1.5"
								/>
							</div>
						</div>

						<div className="mt-5 flex gap-2">
							<Button
								variant="outline"
								className="flex-1 border-line"
								onClick={() => setShowCreate(false)}
							>
								Cancel
							</Button>
							<Button
								className="flex-1 bg-orange text-white hover:bg-orange-deep"
								onClick={createTransfer}
							>
								Create request
							</Button>
						</div>
					</div>
				</div>
			)}

			{showAssignment && selected && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
					onClick={() => setShowAssignment(false)}
				>
					<div
						className="w-full max-w-md rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold text-ink">
									Assign transport
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Assign a vehicle and driver to this transfer.
								</p>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setShowAssignment(false)}>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-5 space-y-4">
							<div>
								<label className={labelClass}>Transporter</label>
								<Input
									value={assignment.transporter}
									onChange={(event) =>
										setAssignment((current) => ({
											...current,
											transporter: event.target.value,
										}))
									}
									placeholder="Select or enter transporter"
									className="mt-1.5"
								/>
							</div>

							<div>
								<label className={labelClass}>Vehicle registration</label>
								<Input
									value={assignment.vehicle}
									onChange={(event) =>
										setAssignment((current) => ({
											...current,
											vehicle: event.target.value,
										}))
									}
									placeholder="Enter vehicle registration"
									className="mt-1.5"
								/>
							</div>

							<div>
								<label className={labelClass}>Driver</label>
								<Input
									value={assignment.driver}
									onChange={(event) =>
										setAssignment((current) => ({
											...current,
											driver: event.target.value,
										}))
									}
									placeholder="Enter driver name"
									className="mt-1.5"
								/>
							</div>
						</div>

						<div className="mt-5 flex gap-2">
							<Button
								variant="outline"
								className="flex-1 border-line"
								onClick={() => setShowAssignment(false)}
							>
								Cancel
							</Button>
							<Button
								className="flex-1 bg-orange text-white hover:bg-orange-deep"
								onClick={assignVehicle}
							>
								Assign vehicle
							</Button>
						</div>
					</div>
				</div>
			)}

			{showReject && selected && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
					onClick={() => setShowReject(false)}
				>
					<div
						className="w-full max-w-md rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-base font-semibold text-ink">
								Reject transfer request
							</h3>
							<Button variant="ghost" size="icon" onClick={() => setShowReject(false)}>
								<X className="size-4" />
							</Button>
						</div>

						<p className="mt-2 text-xs text-ink-soft">
							Provide the reason for rejecting {selected.reference}.
						</p>

						<textarea
							value={rejectionReason}
							onChange={(event) => setRejectionReason(event.target.value)}
							rows={4}
							className="mt-4 w-full rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
							placeholder="Enter rejection reason..."
						/>

						<div className="mt-4 flex gap-2">
							<Button
								variant="outline"
								className="flex-1 border-line"
								onClick={() => setShowReject(false)}
							>
								Cancel
							</Button>
							<Button
								disabled={!rejectionReason.trim()}
								className="flex-1 bg-rose-700 text-white hover:bg-rose-800"
								onClick={rejectTransfer}
							>
								Confirm rejection
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}