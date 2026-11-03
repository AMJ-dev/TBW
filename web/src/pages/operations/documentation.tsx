import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	Check,
	Clock3,
	Download,
	Eye,
	FileCheck2,
	FileText,
	Filter,
	FolderOpen,
	Plus,
	Search,
	ShieldCheck,
	UploadCloud,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DocumentStatus = "Verified" | "Pending review" | "Missing" | "Rejected";
type ShipmentStatus = "Awaiting documents" | "Under review" | "Documents complete" | "Returned";

type CargoDocument = {
	id: string;
	name: string;
	category: string;
	reference: string;
	fileName?: string;
	uploadedAt: string;
	status: DocumentStatus;
	required: boolean;
	reviewNote?: string;
};

type Shipment = {
	id: string;
	reference: string;
	billOfLading: string;
	consignee: string;
	organisation: string;
	cargo: string;
	containers: number;
	storageLocation: string;
	storedAt: string;
	status: ShipmentStatus;
	documents: CargoDocument[];
};

const initialShipments: Shipment[] = [
	{
		id: "1",
		reference: "TRN-SHP-2026-001284",
		billOfLading: "MAEU-ABJ-784512",
		consignee: "Northstar Industrial Supplies Ltd",
		organisation: "Northstar Logistics",
		cargo: "Industrial generator parts",
		containers: 2,
		storageLocation: "Yard A · A-014 / A-015",
		storedAt: "03 Nov 2026, 09:42",
		status: "Under review",
		documents: [
			{ id: "d1", name: "Bill of Lading", category: "Shipping document", reference: "MAEU-ABJ-784512", fileName: "bill-of-lading.pdf", uploadedAt: "03 Nov 2026 · 09:51", status: "Verified", required: true },
			{ id: "d2", name: "Commercial Invoice", category: "Commercial document", reference: "INV-NS-2026-441", fileName: "commercial-invoice.pdf", uploadedAt: "03 Nov 2026 · 09:54", status: "Pending review", required: true },
			{ id: "d3", name: "Packing List", category: "Cargo details", reference: "PL-NS-2026-441", fileName: "packing-list.pdf", uploadedAt: "03 Nov 2026 · 09:55", status: "Verified", required: true },
			{ id: "d4", name: "Import Permit", category: "Regulatory document", reference: "IMP-2026-0931", fileName: "import-permit.pdf", uploadedAt: "03 Nov 2026 · 09:58", status: "Pending review", required: true },
			{ id: "d5", name: "Insurance Certificate", category: "Supporting document", reference: "—", uploadedAt: "—", status: "Missing", required: false },
		],
	},
	{
		id: "2",
		reference: "TRN-SHP-2026-001279",
		billOfLading: "CMAU-ABJ-229104",
		consignee: "Meridian Foods & Beverages",
		organisation: "Meridian Cargo Services",
		cargo: "Packaged food products",
		containers: 4,
		storageLocation: "Warehouse · WH-B02",
		storedAt: "03 Nov 2026, 08:16",
		status: "Awaiting documents",
		documents: [
			{ id: "d6", name: "Bill of Lading", category: "Shipping document", reference: "CMAU-ABJ-229104", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d7", name: "Commercial Invoice", category: "Commercial document", reference: "—", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d8", name: "Packing List", category: "Cargo details", reference: "—", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d9", name: "Regulatory Approval", category: "Regulatory document", reference: "—", uploadedAt: "—", status: "Missing", required: true },
		],
	},
	{
		id: "3",
		reference: "TRN-SHP-2026-001263",
		billOfLading: "OOLU-ABJ-610382",
		consignee: "Apex Building Materials",
		organisation: "Apex Freight Partners",
		cargo: "Ceramic tiles",
		containers: 3,
		storageLocation: "Yard C · C-022 / C-024",
		storedAt: "02 Nov 2026, 16:30",
		status: "Documents complete",
		documents: [
			{ id: "d10", name: "Bill of Lading", category: "Shipping document", reference: "OOLU-ABJ-610382", fileName: "bol-apex.pdf", uploadedAt: "02 Nov 2026 · 16:42", status: "Verified", required: true },
			{ id: "d11", name: "Commercial Invoice", category: "Commercial document", reference: "APX-INV-8871", fileName: "invoice-apex.pdf", uploadedAt: "02 Nov 2026 · 16:43", status: "Verified", required: true },
			{ id: "d12", name: "Packing List", category: "Cargo details", reference: "APX-PL-8871", fileName: "packing-apex.pdf", uploadedAt: "02 Nov 2026 · 16:44", status: "Verified", required: true },
		],
	},
	{
		id: "4",
		reference: "TRN-SHP-2026-001251",
		billOfLading: "HLCU-ABJ-501729",
		consignee: "Crestline Automotive Ltd",
		organisation: "Crestline Shipping",
		cargo: "Vehicle spare parts",
		containers: 1,
		storageLocation: "Yard B · B-008",
		storedAt: "02 Nov 2026, 13:05",
		status: "Returned",
		documents: [
			{ id: "d13", name: "Bill of Lading", category: "Shipping document", reference: "HLCU-ABJ-501729", fileName: "crestline-bol.pdf", uploadedAt: "02 Nov 2026 · 13:21", status: "Verified", required: true },
			{ id: "d14", name: "Commercial Invoice", category: "Commercial document", reference: "CR-INV-2026-102", fileName: "crestline-invoice.pdf", uploadedAt: "02 Nov 2026 · 13:22", status: "Rejected", required: true, reviewNote: "Invoice total does not match the declared cargo value." },
			{ id: "d15", name: "Packing List", category: "Cargo details", reference: "CR-PL-2026-102", fileName: "crestline-packing.pdf", uploadedAt: "02 Nov 2026 · 13:23", status: "Verified", required: true },
		],
	},
];

const shipmentTone: Record<ShipmentStatus, ReturnType<typeof statusTone>> = {
	"Awaiting documents": "warning",
	"Under review": "info",
	"Documents complete": "success",
	Returned: "critical",
};

const documentTone: Record<DocumentStatus, ReturnType<typeof statusTone>> = {
	Verified: "success",
	"Pending review": "warning",
	Missing: "info",
	Rejected: "critical",
};

const labelClass = "block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function OperationsDocumentationRoute() {
	const [shipments, setShipments] = useState(initialShipments);
	const [activeTab, setActiveTab] = useState<"management" | "verification">("management");
	const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [showUpload, setShowUpload] = useState(false);
	const [uploadName, setUploadName] = useState("");
	const [uploadType, setUploadType] = useState("Commercial Invoice");
	const [uploadReference, setUploadReference] = useState("");
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [reviewNote, setReviewNote] = useState("");

	const selected = shipments.find((shipment) => shipment.id === selectedShipmentId) ?? null;

	const allDocuments = useMemo(
		() => shipments.flatMap((shipment) => shipment.documents.map((document) => ({ document, shipment }))),
		[shipments]
	);

	const pendingCount = allDocuments.filter(({ document }) => document.status === "Pending review").length;
	const verifiedCount = allDocuments.filter(({ document }) => document.status === "Verified").length;
	const rejectedCount = allDocuments.filter(({ document }) => document.status === "Rejected").length;
	const readyCount = shipments.filter((shipment) => shipment.status === "Documents complete").length;

	const filteredShipments = shipments.filter((shipment) => {
		const query = search.toLowerCase();
		const matchesSearch = `${shipment.reference} ${shipment.billOfLading} ${shipment.consignee} ${shipment.organisation}`.toLowerCase().includes(query);
		return matchesSearch && (statusFilter === "ALL" || shipment.status === statusFilter);
	});

	const filteredDocuments = allDocuments.filter(({ document, shipment }) => {
		const query = search.toLowerCase();
		const matchesSearch = `${document.name} ${document.reference} ${document.fileName ?? ""} ${shipment.reference} ${shipment.consignee}`.toLowerCase().includes(query);
		return matchesSearch && (statusFilter === "ALL" || document.status === statusFilter);
	});

	const recalculateStatus = (documents: CargoDocument[]): ShipmentStatus => {
		const required = documents.filter((document) => document.required);
		if (required.length && required.every((document) => document.status === "Verified")) return "Documents complete";
		if (required.some((document) => document.status === "Rejected")) return "Returned";
		if (required.every((document) => document.status === "Missing")) return "Awaiting documents";
		return "Under review";
	};

	const updateDocument = (documentId: string, status: DocumentStatus, note = "") => {
		if (!selected) return;

		setShipments((current) =>
			current.map((shipment) => {
				if (shipment.id !== selected.id) return shipment;
				const documents = shipment.documents.map((document) =>
					document.id === documentId
						? { ...document, status, ...(note ? { reviewNote: note } : {}) }
						: document
				);
				return { ...shipment, documents, status: recalculateStatus(documents) };
			})
		);

		setRejectingId(null);
		setReviewNote("");
		toast.success(status === "Verified" ? "Document verified." : "Document rejected.");
	};

	const addDocument = () => {
		if (!selected || !uploadName) return;

		const document: CargoDocument = {
			id: `new-${Date.now()}`,
			name: uploadType,
			category: "Uploaded document",
			reference: uploadReference || "Not provided",
			fileName: uploadName,
			uploadedAt: "Just now",
			status: "Pending review",
			required: true,
		};

		setShipments((current) =>
			current.map((shipment) =>
				shipment.id === selected.id
					? { ...shipment, documents: [...shipment.documents, document], status: "Under review" }
					: shipment
			)
		);

		setUploadName("");
		setUploadReference("");
		setShowUpload(false);
		toast.success("Document added to register.");
	};

	const openShipment = (id: string) => {
		setSelectedShipmentId(id);
		setRejectingId(null);
		setReviewNote("");
	};

	const selectedRequired = selected?.documents.filter((document) => document.required) ?? [];
	const selectedVerified = selectedRequired.filter((document) => document.status === "Verified").length;
	const selectedCompletion = selectedRequired.length
		? Math.round((selectedVerified / selectedRequired.length) * 100)
		: 0;
	const canClear = selectedRequired.length > 0 && selectedRequired.every((document) => document.status === "Verified");

	const completeVerification = () => {
		if (!selected || !canClear) return;
		setShipments((current) =>
			current.map((shipment) =>
				shipment.id === selected.id ? { ...shipment, status: "Documents complete" } : shipment
			)
		);
		toast.success("Documentation complete. Shipment is ready for Examination.");
		setSelectedShipmentId(null);
	};

	return (
		<AppShell title="Document Management" eyebrow="Operations · Document Control">
			<div className="space-y-5">
				{selected ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<Button variant="outline" className="border-line" onClick={() => setSelectedShipmentId(null)}>
								<ArrowLeft className="mr-2 size-4" />
								Back to documents
							</Button>
							<StatusBadge label={selected.status} tone={shipmentTone[selected.status]} />
						</div>

						<div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<p className={labelClass}>Shipment documentation file</p>
									<h2 className="mt-1 font-display text-xl font-bold text-ink">{selected.reference}</h2>
									<p className="mt-1 text-xs text-ink-soft">B/L: {selected.billOfLading} · Stored {selected.storedAt}</p>
								</div>
								<div className="w-full max-w-xs">
									<div className="flex justify-between text-xs">
										<span className="font-medium text-ink">Required documents</span>
										<span className="font-mono font-semibold text-orange-deep">{selectedCompletion}%</span>
									</div>
									<div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
										<div className="h-full rounded-full bg-orange" style={{ width: `${selectedCompletion}%` }} />
									</div>
									<p className="mt-1 text-[10px] text-ink-soft">{selectedVerified} of {selectedRequired.length} verified</p>
								</div>
							</div>

							<div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
								<div><p className={labelClass}>Organisation</p><p className="mt-1 text-xs font-semibold text-ink">{selected.organisation}</p></div>
								<div><p className={labelClass}>Consignee</p><p className="mt-1 text-xs font-semibold text-ink">{selected.consignee}</p></div>
								<div><p className={labelClass}>Cargo</p><p className="mt-1 text-xs font-semibold text-ink">{selected.cargo}</p></div>
								<div><p className={labelClass}>Storage location</p><p className="mt-1 text-xs font-semibold text-ink">{selected.storageLocation}</p></div>
							</div>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 className="font-display text-lg font-bold text-ink">Document verification</h3>
								<p className="mt-1 text-xs text-ink-soft">Review and verify each submitted document.</p>
							</div>
							<Button onClick={() => setShowUpload(true)} className="bg-orange text-white hover:bg-orange-deep">
								<Plus className="mr-1.5 size-4" /> Add document
							</Button>
						</div>

						<div className="overflow-hidden rounded-xl border border-line bg-paper">
							<div className="hidden grid-cols-[1.2fr_1fr_1fr_120px_180px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft md:grid">
								<span>Document</span><span>Reference / File</span><span>Submitted</span><span>Status</span><span>Actions</span>
							</div>
							{selected.documents.map((document) => (
								<div key={document.id} className="border-b border-line p-4 last:border-0">
									<div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_120px_180px] md:items-center">
										<div className="flex items-center gap-3">
											<span className="flex size-9 items-center justify-center rounded-lg bg-sand text-ink-soft"><FileText className="size-4" /></span>
											<div>
												<p className="text-xs font-semibold text-ink">{document.name}{document.required && <span className="ml-1 text-orange">*</span>}</p>
												<p className="text-[10px] text-ink-soft">{document.category}</p>
											</div>
										</div>
										<div>
											<p className="text-xs text-ink">{document.reference}</p>
											<p className="text-[10px] text-ink-soft">{document.fileName ?? "No file submitted"}</p>
										</div>
										<p className="text-[11px] text-ink">{document.uploadedAt}</p>
										<StatusBadge label={document.status} tone={documentTone[document.status]} />
										<div className="flex flex-wrap gap-1.5">
											{document.fileName && (
												<Button size="sm" variant="outline" className="h-8 border-line" onClick={() => toast.info(`Previewing ${document.fileName}`)}>
													<Eye className="mr-1 size-3" /> View
												</Button>
											)}
											{document.fileName && document.status !== "Verified" && (
												<Button size="sm" className="h-8 bg-orange text-white hover:bg-orange-deep" onClick={() => updateDocument(document.id, "Verified")}>
													<Check className="mr-1 size-3" /> Verify
												</Button>
											)}
											{document.fileName && document.status !== "Rejected" && document.status !== "Verified" && (
												<Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-700" onClick={() => setRejectingId(document.id)}>
													<X className="mr-1 size-3" /> Reject
												</Button>
											)}
										</div>
									</div>

									{document.reviewNote && (
										<div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
											<span className="font-semibold">Review note:</span> {document.reviewNote}
										</div>
									)}

									{rejectingId === document.id && (
										<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3">
											<label className={labelClass}>Reason for rejection</label>
											<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={2} className="mt-2 w-full rounded-md border border-rose-200 bg-paper px-3 py-2 text-xs text-ink outline-none" placeholder="Explain what needs to be corrected..." />
											<div className="mt-2 flex justify-end gap-2">
												<Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
												<Button size="sm" disabled={!reviewNote.trim()} className="bg-rose-700 text-white" onClick={() => updateDocument(document.id, "Rejected", reviewNote.trim())}>Confirm rejection</Button>
											</div>
										</div>
									)}
								</div>
							))}
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-start gap-3">
									<ShieldCheck className="mt-1 size-5 text-orange-deep" />
									<div>
										<h3 className="text-sm font-semibold text-ink">Documentation clearance</h3>
										<p className="mt-1 max-w-2xl text-xs leading-5 text-ink-soft">All required documents must be verified before this shipment can proceed to Examination.</p>
									</div>
								</div>
								<span className={cn("text-xs font-semibold", canClear ? "text-emerald-700" : "text-orange-deep")}>
									{canClear ? "Ready for Examination" : "Verification outstanding"}
								</span>
							</div>
							<div className="mt-4 flex justify-end">
								<Button disabled={!canClear} onClick={completeVerification} className="bg-orange text-white hover:bg-orange-deep disabled:opacity-50">
									<BadgeCheck className="mr-2 size-4" /> Complete verification <ArrowRight className="ml-2 size-4" />
								</Button>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Terminal operations · Document control</p>
								<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Document Management & Verification</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Manage shipment documents, track submissions and verify records before cargo proceeds to Examination.</p>
							</div>
							<Button variant="outline" className="border-line" onClick={() => toast.success("Document register exported in this UI preview.")}>
								<Download className="mr-2 size-4" /> Export
							</Button>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric label="Shipments in storage" value={String(shipments.length)} detail="Cargo documentation files" tone="info" icon={FolderOpen} />
							<Metric label="Documents received" value={String(allDocuments.length)} detail="Across stored shipments" tone="default" icon={FileText} />
							<Metric label="Awaiting verification" value={String(pendingCount)} detail="Submitted documents" tone="warning" icon={Clock3} />
							<Metric label="Verified documents" value={String(verifiedCount)} detail={`${readyCount} shipments cleared for Examination`} tone="success" icon={FileCheck2} />
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
							<div className="flex gap-6">
								<button onClick={() => { setActiveTab("management"); setSearch(""); setStatusFilter("ALL"); }} className={cn("border-b-2 px-1 pb-3 text-xs font-semibold", activeTab === "management" ? "border-orange text-orange-deep" : "border-transparent text-ink-soft")}>
									Document Management
								</button>
								<button onClick={() => { setActiveTab("verification"); setSearch(""); setStatusFilter("ALL"); }} className={cn("border-b-2 px-1 pb-3 text-xs font-semibold", activeTab === "verification" ? "border-orange text-orange-deep" : "border-transparent text-ink-soft")}>
									Document Verification <span className="ml-1 rounded bg-sand px-1.5 py-0.5 font-mono text-[9px]">{pendingCount + rejectedCount}</span>
								</button>
							</div>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative w-full sm:max-w-md">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shipment, document, reference..." className="pl-9" />
							</div>
							<div className="flex items-center gap-2">
								<Filter className="size-4 text-ink-soft" />
								<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border border-line bg-paper px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25">
									<option value="ALL">All statuses</option>
									{activeTab === "management" ? (
										<>
											<option>Awaiting documents</option><option>Under review</option><option>Documents complete</option><option>Returned</option>
										</>
									) : (
										<>
											<option>Pending review</option><option>Verified</option><option>Missing</option><option>Rejected</option>
										</>
									)}
								</select>
							</div>
						</div>

						{activeTab === "management" ? (
							<div className="overflow-hidden rounded-xl border border-line bg-paper">
								<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
									<div>
										<h3 className="text-sm font-semibold text-ink">Shipment document register</h3>
										<p className="mt-1 text-[11px] text-ink-soft">All shipments currently in Storage and their documentation records.</p>
									</div>
									<span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">{filteredShipments.length} SHIPMENTS</span>
								</div>
								<div className="hidden grid-cols-[1.2fr_1fr_1fr_110px_130px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft md:grid">
									<span>Shipment / B/L</span><span>Consignee / Organisation</span><span>Storage location</span><span>Documents</span><span>Status</span>
								</div>
								{filteredShipments.map((shipment) => {
									const required = shipment.documents.filter((document) => document.required);
									const verified = required.filter((document) => document.status === "Verified").length;
									return (
										<button key={shipment.id} onClick={() => openShipment(shipment.id)} className="grid w-full gap-3 border-b border-line px-4 py-4 text-left transition hover:bg-sand/40 last:border-0 md:grid-cols-[1.2fr_1fr_1fr_110px_130px] md:items-center">
											<div>
												<p className="font-mono text-xs font-bold text-ink">{shipment.reference}</p>
												<p className="mt-1 text-[10px] text-ink-soft">B/L: {shipment.billOfLading} · {shipment.containers} container(s)</p>
											</div>
											<div>
												<p className="text-xs font-medium text-ink">{shipment.consignee}</p>
												<p className="mt-1 text-[10px] text-ink-soft">{shipment.organisation}</p>
											</div>
											<div>
												<p className="text-xs text-ink">{shipment.storageLocation}</p>
												<p className="mt-1 text-[10px] text-ink-soft">Stored {shipment.storedAt}</p>
											</div>
											<div>
												<p className="text-xs font-semibold text-ink">{verified}/{required.length} verified</p>
												<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand">
													<div className="h-full rounded-full bg-orange" style={{ width: `${required.length ? (verified / required.length) * 100 : 0}%` }} />
												</div>
											</div>
											<div className="flex items-center justify-between gap-2">
												<StatusBadge label={shipment.status} tone={shipmentTone[shipment.status]} />
												<ArrowRight className="size-4 shrink-0 text-ink-soft" />
											</div>
										</button>
									);
								})}
								{filteredShipments.length === 0 && <div className="p-12 text-center text-xs text-ink-soft">No shipments found.</div>}
								<div className="border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">Showing {filteredShipments.length} of {shipments.length} shipments</div>
							</div>
						) : (
							<div className="overflow-hidden rounded-xl border border-line bg-paper">
								<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
									<div>
										<h3 className="text-sm font-semibold text-ink">Document verification queue</h3>
										<p className="mt-1 text-[11px] text-ink-soft">Review submitted documents and resolve outstanding verification.</p>
									</div>
									<span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">{filteredDocuments.length} DOCUMENTS</span>
								</div>
								<div className="hidden grid-cols-[1.1fr_1fr_1.2fr_120px_130px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft md:grid">
									<span>Document</span><span>Reference / File</span><span>Shipment / Consignee</span><span>Submitted</span><span>Status</span>
								</div>
								{filteredDocuments.map(({ document, shipment }) => (
									<button key={`${shipment.id}-${document.id}`} onClick={() => openShipment(shipment.id)} className="grid w-full gap-3 border-b border-line px-4 py-3.5 text-left transition hover:bg-sand/40 last:border-0 md:grid-cols-[1.1fr_1fr_1.2fr_120px_130px] md:items-center">
										<div className="flex items-center gap-2.5">
											<FileText className="size-4 shrink-0 text-ink-soft" />
											<div>
												<p className="text-xs font-semibold text-ink">{document.name}</p>
												<p className="text-[10px] text-ink-soft">{document.fileName ?? "No file submitted"}</p>
											</div>
										</div>
										<p className="text-[11px] text-ink">{document.reference}</p>
										<div>
											<p className="font-mono text-[10px] font-semibold text-ink">{shipment.reference}</p>
											<p className="text-[10px] text-ink-soft">{shipment.consignee}</p>
										</div>
										<p className="text-[10px] text-ink-soft">{document.uploadedAt}</p>
										<StatusBadge label={document.status} tone={documentTone[document.status]} />
									</button>
								))}
								{filteredDocuments.length === 0 && <div className="p-12 text-center text-xs text-ink-soft">No documents found.</div>}
								<div className="border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">Showing {filteredDocuments.length} of {allDocuments.length} documents</div>
							</div>
						)}

						<div className="flex flex-col justify-between gap-3 rounded-xl bg-paper p-4 ring-1 ring-line sm:flex-row sm:items-center">
							<div className="flex items-start gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep"><FileCheck2 className="size-4" /></span>
								<div>
									<p className="text-xs font-semibold text-ink">Next stage: Examination</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">Only shipments with all required documents verified should proceed to Examination.</p>
								</div>
							</div>
							<div className="flex items-center gap-2 text-xs font-semibold text-orange-deep">{readyCount} shipments cleared <ArrowRight className="size-4" /></div>
						</div>
					</>
				)}
			</div>

			{showUpload && selected && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setShowUpload(false)}>
					<div className="w-full max-w-md rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line" onClick={(event) => event.stopPropagation()}>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold text-ink">Add document</h3>
								<p className="mt-1 text-xs text-ink-soft">Add a document to {selected.reference}.</p>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}><X className="size-4" /></Button>
						</div>
						<label className={cn(labelClass, "mt-5")}>Document type</label>
						<select value={uploadType} onChange={(event) => setUploadType(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink">
							<option>Bill of Lading</option><option>Commercial Invoice</option><option>Packing List</option><option>Import Permit</option><option>Regulatory Approval</option><option>Insurance Certificate</option><option>Other supporting document</option>
						</select>
						<label className={cn(labelClass, "mt-4")}>Document reference</label>
						<Input value={uploadReference} onChange={(event) => setUploadReference(event.target.value)} placeholder="Enter document reference" className="mt-1.5" />
						<label className={cn(labelClass, "mt-4")}>Select file</label>
						<label className="mt-1.5 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-line bg-sand/50 px-4 py-7 text-center hover:border-orange">
							<UploadCloud className="size-6 text-orange" />
							<span className="mt-2 text-xs font-semibold text-ink">Choose a file</span>
							<span className="mt-1 text-[10px] text-ink-soft">PDF, JPG or PNG · UI preview only</span>
							<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setUploadName(event.target.files?.[0]?.name ?? "")} />
						</label>
						{uploadName && <p className="mt-2 truncate text-[11px] font-medium text-emerald-700">Selected: {uploadName}</p>}
						<div className="mt-5 flex gap-2">
							<Button variant="outline" className="flex-1 border-line" onClick={() => setShowUpload(false)}>Cancel</Button>
							<Button className="flex-1 bg-orange text-white hover:bg-orange-deep disabled:opacity-50" disabled={!uploadName} onClick={addDocument}>Add to register</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}