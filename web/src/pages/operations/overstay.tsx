import { useMemo, useState } from "react";
import {
	AlertCircle,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Download,
	Eye,
	FileText,
	Filter,
	MapPin,
	Package,
	Search,
	ShieldAlert,
	Truck,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OverstayStatus =
	| "Overstayed"
	| "Charges pending"
	| "Invoice issued"
	| "Charges settled"
	| "On hold";

type OverstayRecord = {
	id: string;
	shipmentReference: string;
	billOfLading: string;
	containerNo: string;
	consignee: string;
	organisation: string;
	cargo: string;
	storageLocation: string;
	storageDate: string;
	freeDays: number;
	daysInStorage: number;
	daysOverstayed: number;
	dailyRate: number;
	estimatedCharges: number;
	status: OverstayStatus;
	invoiceReference?: string;
	lastUpdated: string;
	notes?: string;
};

const initialRecords: OverstayRecord[] = [
	{
		id: "1",
		shipmentReference: "TRN-SHP-2026-001184",
		billOfLading: "MAEU-ABJ-784512",
		containerNo: "MSCU7281940",
		consignee: "Northstar Industrial Supplies Ltd",
		organisation: "Northstar Logistics",
		cargo: "Industrial generator parts",
		storageLocation: "Yard A · A-014",
		storageDate: "2026-10-18",
		freeDays: 7,
		daysInStorage: 16,
		daysOverstayed: 9,
		dailyRate: 25000,
		estimatedCharges: 225000,
		status: "Charges pending",
		lastUpdated: "03 Nov 2026, 09:42",
		notes: "Awaiting overstay charge assessment.",
	},
	{
		id: "2",
		shipmentReference: "TRN-SHP-2026-001162",
		billOfLading: "CMAU-ABJ-229104",
		containerNo: "CMAU4819203",
		consignee: "Meridian Foods & Beverages",
		organisation: "Meridian Cargo Services",
		cargo: "Packaged food products",
		storageLocation: "Warehouse · WH-B02",
		storageDate: "2026-10-10",
		freeDays: 5,
		daysInStorage: 24,
		daysOverstayed: 19,
		dailyRate: 18000,
		estimatedCharges: 342000,
		status: "Invoice issued",
		invoiceReference: "INV-OVS-2026-0021",
		lastUpdated: "03 Nov 2026, 08:16",
		notes: "Invoice issued. Payment confirmation pending.",
	},
	{
		id: "3",
		shipmentReference: "TRN-SHP-2026-001139",
		billOfLading: "OOLU-ABJ-610382",
		containerNo: "OOLU9021845",
		consignee: "Apex Building Materials",
		organisation: "Apex Freight Partners",
		cargo: "Ceramic tiles",
		storageLocation: "Yard C · C-022",
		storageDate: "2026-10-05",
		freeDays: 7,
		daysInStorage: 29,
		daysOverstayed: 22,
		dailyRate: 25000,
		estimatedCharges: 550000,
		status: "On hold",
		invoiceReference: "INV-OVS-2026-0018",
		lastUpdated: "02 Nov 2026, 16:30",
		notes: "Collection restricted pending outstanding charges.",
	},
	{
		id: "4",
		shipmentReference: "TRN-SHP-2026-001102",
		billOfLading: "HLCU-ABJ-501729",
		containerNo: "HLCU7812390",
		consignee: "Crestline Automotive Ltd",
		organisation: "Crestline Shipping",
		cargo: "Vehicle spare parts",
		storageLocation: "Yard B · B-008",
		storageDate: "2026-10-28",
		freeDays: 7,
		daysInStorage: 6,
		daysOverstayed: 0,
		dailyRate: 25000,
		estimatedCharges: 0,
		status: "Overstayed",
		lastUpdated: "02 Nov 2026, 13:05",
		notes: "Recently entered storage. Free storage period has not expired.",
	},
	{
		id: "5",
		shipmentReference: "TRN-SHP-2026-001087",
		billOfLading: "EGLV-ABJ-328104",
		containerNo: "EGLV6192840",
		consignee: "Bluepeak Trading Company",
		organisation: "Bluepeak Logistics",
		cargo: "Electrical equipment",
		storageLocation: "Yard D · D-011",
		storageDate: "2026-10-12",
		freeDays: 7,
		daysInStorage: 22,
		daysOverstayed: 15,
		dailyRate: 25000,
		estimatedCharges: 375000,
		status: "Charges settled",
		invoiceReference: "INV-OVS-2026-0015",
		lastUpdated: "01 Nov 2026, 11:20",
		notes: "Overstay charges settled. Awaiting collection arrangements.",
	},
];

const statusTones: Record<OverstayStatus, ReturnType<typeof statusTone>> = {
	Overstayed: "warning",
	"Charges pending": "warning",
	"Invoice issued": "info",
	"Charges settled": "success",
	"On hold": "critical",
};

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

const formatDate = (date: string) =>
	new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

export default function OperationsOverstayPage() {
	const [records, setRecords] = useState(initialRecords);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [locationFilter, setLocationFilter] = useState("ALL");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [showChargeModal, setShowChargeModal] = useState(false);
	const [chargeNote, setChargeNote] = useState("");

	const selected = records.find((record) => record.id === selectedId) ?? null;

	const overdueRecords = records.filter(
		(record) => record.daysOverstayed > 0
	);

	const totalEstimated = overdueRecords
		.filter((record) => record.status !== "Charges settled")
		.reduce((sum, record) => sum + record.estimatedCharges, 0);

	const pendingCharges = overdueRecords.filter(
		(record) =>
			record.status === "Charges pending" ||
			record.status === "Overstayed"
	).length;

	const invoicedCount = records.filter(
		(record) => record.status === "Invoice issued"
	).length;

	const heldCount = records.filter(
		(record) => record.status === "On hold"
	).length;

	const filteredRecords = useMemo(() => {
		return records.filter((record) => {
			const query = search.toLowerCase();

			const matchesSearch = [
				record.shipmentReference,
				record.billOfLading,
				record.containerNo,
				record.consignee,
				record.organisation,
				record.cargo,
			]
				.join(" ")
				.toLowerCase()
				.includes(query);

			const matchesStatus =
				statusFilter === "ALL" || record.status === statusFilter;

			const matchesLocation =
				locationFilter === "ALL" ||
				record.storageLocation.toLowerCase().includes(
					locationFilter.toLowerCase()
				);

			return matchesSearch && matchesStatus && matchesLocation;
		});
	}, [records, search, statusFilter, locationFilter]);

	const updateRecord = (
		id: string,
		updates: Partial<OverstayRecord>
	) => {
		setRecords((current) =>
			current.map((record) =>
				record.id === id ? { ...record, ...updates } : record
			)
		);
	};

	const createInvoice = () => {
		if (!selected) return;

		const reference = `INV-OVS-2026-${String(
			records.length + 1
		).padStart(4, "0")}`;

		updateRecord(selected.id, {
			status: "Invoice issued",
			invoiceReference: reference,
			lastUpdated: "Just now",
		});

		setShowChargeModal(false);
		setChargeNote("");
		toast.success("Overstay invoice recorded in this UI preview.");
	};

	const markSettled = () => {
		if (!selected) return;

		updateRecord(selected.id, {
			status: "Charges settled",
			lastUpdated: "Just now",
		});

		toast.success("Charges marked as settled.");
	};

	const toggleHold = () => {
		if (!selected) return;

		const nextStatus =
			selected.status === "On hold" ? "Charges pending" : "On hold";

		updateRecord(selected.id, {
			status: nextStatus,
			lastUpdated: "Just now",
		});

		toast.success(
			nextStatus === "On hold"
				? "Shipment marked as on hold."
				: "Hold removed in this UI preview."
		);
	};

	const exportRegister = () => {
		toast.success("Overstay register export is a UI preview.");
	};

	return (
		<AppShell title="Overstay Management" eyebrow="Operations · Storage Control">
			<div className="space-y-5">
				{selected ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Button
								variant="outline"
								className="border-line"
								onClick={() => setSelectedId(null)}
							>
								<ArrowLeft className="mr-2 size-4" />
								Back to overstay register
							</Button>

							<StatusBadge
								label={selected.status}
								tone={statusTones[selected.status]}
							/>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<p className={labelClass}>Shipment reference</p>
									<h2 className="mt-1 font-display text-xl font-bold text-ink">
										{selected.shipmentReference}
									</h2>
									<p className="mt-1 font-mono text-xs text-ink-soft">
										B/L: {selected.billOfLading}
									</p>
								</div>

								<div className="rounded-lg bg-orange/10 px-4 py-3">
									<p className={labelClass}>Estimated overstay charges</p>
									<p className="mt-1 font-display text-xl font-bold text-orange-deep">
										{formatCurrency(selected.estimatedCharges)}
									</p>
								</div>
							</div>

							<div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
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
									<p className={labelClass}>Container number</p>
									<p className="mt-1 font-mono text-xs font-semibold text-ink">
										{selected.containerNo}
									</p>
								</div>

								<div>
									<p className={labelClass}>Cargo description</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.cargo}
									</p>
								</div>

								<div>
									<p className={labelClass}>Storage location</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.storageLocation}
									</p>
								</div>

								<div>
									<p className={labelClass}>Storage date</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{formatDate(selected.storageDate)}
									</p>
								</div>

								<div>
									<p className={labelClass}>Free storage allowance</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.freeDays} days
									</p>
								</div>

								<div>
									<p className={labelClass}>Days in storage</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{selected.daysInStorage} days
									</p>
								</div>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric
								label="Days overstayed"
								value={String(selected.daysOverstayed)}
								detail="Beyond free storage period"
								tone={selected.daysOverstayed > 0 ? "warning" : "success"}
								icon={Clock3}
							/>

							<Metric
								label="Daily tariff"
								value={formatCurrency(selected.dailyRate)}
								detail="Sample tariff rate"
								tone="default"
								icon={ArrowUpRight}
							/>

							<Metric
								label="Estimated charges"
								value={formatCurrency(selected.estimatedCharges)}
								detail="Before final assessment"
								tone="warning"
								icon={FileText}
							/>

							<Metric
								label="Invoice reference"
								value={selected.invoiceReference ?? "Not issued"}
								detail="Overstay invoice"
								tone={selected.invoiceReference ? "success" : "default"}
								icon={FileText}
							/>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<h3 className="font-display text-lg font-bold text-ink">
										Overstay assessment
									</h3>
									<p className="mt-1 text-xs text-ink-soft">
										Storage duration and charge assessment details.
									</p>
								</div>

								<StatusBadge
									label={selected.status}
									tone={statusTones[selected.status]}
								/>
							</div>

							<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
								<div className="rounded-lg bg-sand/60 p-3">
									<p className={labelClass}>Storage started</p>
									<p className="mt-2 text-sm font-semibold text-ink">
										{formatDate(selected.storageDate)}
									</p>
								</div>

								<div className="rounded-lg bg-sand/60 p-3">
									<p className={labelClass}>Free period</p>
									<p className="mt-2 text-sm font-semibold text-ink">
										{selected.freeDays} days
									</p>
								</div>

								<div className="rounded-lg bg-sand/60 p-3">
									<p className={labelClass}>Overstay duration</p>
									<p className="mt-2 text-sm font-semibold text-orange-deep">
										{selected.daysOverstayed} days
									</p>
								</div>

								<div className="rounded-lg bg-sand/60 p-3">
									<p className={labelClass}>Last updated</p>
									<p className="mt-2 text-sm font-semibold text-ink">
										{selected.lastUpdated}
									</p>
								</div>
							</div>

							{selected.notes && (
								<div className="mt-4 flex gap-2 rounded-lg border border-line bg-sand/40 p-3">
									<AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
									<div>
										<p className="text-xs font-semibold text-ink">
											Operations note
										</p>
										<p className="mt-1 text-xs leading-5 text-ink-soft">
											{selected.notes}
										</p>
									</div>
								</div>
							)}
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<h3 className="font-display text-lg font-bold text-ink">
								Charge management
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Review the overstay assessment and record the current charge status.
							</p>

							<div className="mt-4 flex flex-wrap gap-2">
								{!selected.invoiceReference && (
									<Button
										onClick={() => setShowChargeModal(true)}
										className="bg-orange text-white hover:bg-orange-deep"
									>
										<FileText className="mr-2 size-4" />
										Generate invoice
									</Button>
								)}

								{selected.status === "Invoice issued" && (
									<Button
										onClick={markSettled}
										className="bg-emerald-700 text-white hover:bg-emerald-800"
									>
										<CheckCircle2 className="mr-2 size-4" />
										Mark charges settled
									</Button>
								)}

								<Button
									variant="outline"
									className="border-line"
									onClick={toggleHold}
								>
									<ShieldAlert className="mr-2 size-4" />
									{selected.status === "On hold"
										? "Remove hold"
										: "Place on hold"}
								</Button>

								<Button
									variant="outline"
									className="border-line"
									onClick={() => toast.info("Shipment details are available in the shipment register.")}
								>
									<Eye className="mr-2 size-4" />
									View shipment
								</Button>
							</div>

							<p className="mt-4 text-[10px] leading-5 text-ink-soft">
								Charge assessment and invoice generation are demonstrations in this UI.
								Actual charges should be calculated using the approved terminal tariff,
								applicable free-storage rules and any authorized exemptions.
							</p>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
									Terminal operations · Storage control
								</p>

								<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
									Overstay Management
								</h2>

								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
									Monitor cargo exceeding its free storage period, assess overstay
									charges and manage outstanding storage obligations.
								</p>
							</div>

							<Button
								variant="outline"
								className="border-line"
								onClick={exportRegister}
							>
								<Download className="mr-2 size-4" />
								Export register
							</Button>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric
								label="Overstay records"
								value={String(overdueRecords.length)}
								detail="Cargo beyond free storage"
								tone="warning"
								icon={Clock3}
							/>

							<Metric
								label="Pending assessment"
								value={String(pendingCharges)}
								detail="Awaiting charge processing"
								tone="warning"
								icon={FileText}
							/>

							<Metric
								label="Estimated outstanding"
								value={formatCurrency(totalEstimated)}
								detail="Excluding settled charges"
								tone="info"
								icon={ArrowUpRight}
							/>

							<Metric
								label="Shipments on hold"
								value={String(heldCount)}
								detail="Restricted collection"
								tone="critical"
								icon={ShieldAlert}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<button
								onClick={() => {
									setStatusFilter("Charges pending");
									setSearch("");
								}}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<div className="flex items-center justify-between">
									<span className={labelClass}>Charges pending</span>
									<Clock3 className="size-4 text-orange-deep" />
								</div>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{records.filter((record) => record.status === "Charges pending").length}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Awaiting charge assessment
								</p>
							</button>

							<button
								onClick={() => {
									setStatusFilter("Invoice issued");
									setSearch("");
								}}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<div className="flex items-center justify-between">
									<span className={labelClass}>Invoices issued</span>
									<FileText className="size-4 text-ink-soft" />
								</div>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{invoicedCount}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Awaiting settlement
								</p>
							</button>

							<button
								onClick={() => {
									setStatusFilter("Charges settled");
									setSearch("");
								}}
								className="rounded-xl border border-line bg-paper p-4 text-left transition hover:border-orange/50"
							>
								<div className="flex items-center justify-between">
									<span className={labelClass}>Charges settled</span>
									<CheckCircle2 className="size-4 text-emerald-700" />
								</div>
								<p className="mt-2 font-display text-2xl font-bold text-ink">
									{records.filter((record) => record.status === "Charges settled").length}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									Payment recorded
								</p>
							</button>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative w-full sm:max-w-md">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search shipment, B/L, container or consignee..."
									className="pl-9"
								/>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Filter className="size-4 text-ink-soft" />

								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="h-9 rounded-md border border-line bg-paper px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
								>
									<option value="ALL">All statuses</option>
									<option value="Overstayed">Overstayed</option>
									<option value="Charges pending">Charges pending</option>
									<option value="Invoice issued">Invoice issued</option>
									<option value="Charges settled">Charges settled</option>
									<option value="On hold">On hold</option>
								</select>

								<select
									value={locationFilter}
									onChange={(event) => setLocationFilter(event.target.value)}
									className="h-9 rounded-md border border-line bg-paper px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
								>
									<option value="ALL">All locations</option>
									<option value="Yard">Yard</option>
									<option value="Warehouse">Warehouse</option>
								</select>
							</div>
						</div>

						<div className="overflow-hidden rounded-xl border border-line bg-paper">
							<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
								<div>
									<h3 className="text-sm font-semibold text-ink">
										Overstay register
									</h3>
									<p className="mt-1 text-[11px] text-ink-soft">
										Stored shipments and containers exceeding their free storage period.
									</p>
								</div>

								<span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">
									{filteredRecords.length} RECORDS
								</span>
							</div>

							<div className="hidden grid-cols-[1.2fr_1fr_1fr_110px_110px_140px_120px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft xl:grid">
								<span>Shipment / Container</span>
								<span>Consignee</span>
								<span>Storage location</span>
								<span>Storage days</span>
								<span>Overstay days</span>
								<span>Estimated charges</span>
								<span>Status</span>
							</div>

							{filteredRecords.map((record) => (
								<button
									key={record.id}
									onClick={() => setSelectedId(record.id)}
									className="grid w-full gap-3 border-b border-line px-4 py-4 text-left transition hover:bg-sand/40 last:border-0 xl:grid-cols-[1.2fr_1fr_1fr_110px_110px_140px_120px] xl:items-center"
								>
									<div>
										<p className="font-mono text-xs font-bold text-ink">
											{record.shipmentReference}
										</p>
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											{record.containerNo}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											B/L: {record.billOfLading}
										</p>
									</div>

									<div>
										<p className="text-xs font-medium text-ink">
											{record.consignee}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{record.organisation}
										</p>
									</div>

									<div>
										<p className="flex items-center gap-1 text-xs text-ink">
											<MapPin className="size-3 text-ink-soft" />
											{record.storageLocation}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											Since {formatDate(record.storageDate)}
										</p>
									</div>

									<div>
										<p className="text-xs font-semibold text-ink">
											{record.daysInStorage} days
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											Free: {record.freeDays} days
										</p>
									</div>

									<div>
										<p
											className={cn(
												"text-xs font-bold",
												record.daysOverstayed > 0
													? "text-orange-deep"
													: "text-emerald-700"
											)}
										>
											{record.daysOverstayed} days
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{record.daysOverstayed > 0 ? "Overdue" : "Within free period"}
										</p>
									</div>

									<div>
										<p className="text-xs font-semibold text-ink">
											{formatCurrency(record.estimatedCharges)}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{record.invoiceReference ?? "Not invoiced"}
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
										No overstay records found
									</p>
									<p className="mt-1 text-xs text-ink-soft">
										Try changing your search or filters.
									</p>
								</div>
							)}

							<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
								<p className="font-mono text-[10px] text-ink-soft">
									Showing {filteredRecords.length} of {records.length} records
								</p>
								<p className="font-mono text-[10px] text-ink-soft">
									Last updated: 03 Nov 2026
								</p>
							</div>
						</div>

						<div className="flex flex-col justify-between gap-3 rounded-xl bg-paper p-4 ring-1 ring-line sm:flex-row sm:items-center">
							<div className="flex items-start gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep">
									<ShieldAlert className="size-4" />
								</span>
								<div>
									<p className="text-xs font-semibold text-ink">
										Overstay monitoring
									</p>
									<p className="mt-1 max-w-2xl text-[11px] leading-5 text-ink-soft">
										Overstay records should be generated from actual storage dates,
										approved free-time rules and the applicable tariff.
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 text-xs font-semibold text-orange-deep">
								{heldCount} shipments on hold
								<ArrowRight className="size-4" />
							</div>
						</div>
					</>
				)}
			</div>

			{showChargeModal && selected && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
					onClick={() => setShowChargeModal(false)}
				>
					<div
						className="w-full max-w-md rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold text-ink">
									Generate overstay invoice
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Review the charge assessment before recording the invoice.
								</p>
							</div>

							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowChargeModal(false)}
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-5 rounded-lg bg-sand/60 p-4">
							<p className={labelClass}>Shipment reference</p>
							<p className="mt-1 font-mono text-xs font-semibold text-ink">
								{selected.shipmentReference}
							</p>

							<div className="mt-4 grid grid-cols-2 gap-3">
								<div>
									<p className={labelClass}>Overstay days</p>
									<p className="mt-1 text-sm font-bold text-ink">
										{selected.daysOverstayed}
									</p>
								</div>

								<div>
									<p className={labelClass}>Daily rate</p>
									<p className="mt-1 text-sm font-bold text-ink">
										{formatCurrency(selected.dailyRate)}
									</p>
								</div>
							</div>

							<div className="mt-4 border-t border-line pt-3">
								<p className={labelClass}>Estimated total</p>
								<p className="mt-1 font-display text-2xl font-bold text-orange-deep">
									{formatCurrency(selected.estimatedCharges)}
								</p>
							</div>
						</div>

						<label className={cn(labelClass, "mt-4")}>
							Assessment note
						</label>

						<textarea
							value={chargeNote}
							onChange={(event) => setChargeNote(event.target.value)}
							rows={3}
							className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
							placeholder="Enter assessment details..."
						/>

						<div className="mt-5 flex gap-2">
							<Button
								variant="outline"
								className="flex-1 border-line"
								onClick={() => setShowChargeModal(false)}
							>
								Cancel
							</Button>

							<Button
								className="flex-1 bg-orange text-white hover:bg-orange-deep"
								onClick={createInvoice}
							>
								<FileText className="mr-2 size-4" />
								Confirm invoice
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}