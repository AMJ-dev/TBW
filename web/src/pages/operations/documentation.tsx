import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Check,
	CheckCircle2,
	Clock3,
	Download,
	Eye,
	FileCheck2,
	FileText,
	Filter,
	FolderOpen,
	Package,
	Search,
	ShieldCheck,
	UploadCloud,
	X,
	XCircle,
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
	uploadedAt: string;
	status: DocumentStatus;
	required: boolean;
	fileName?: string;
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
		id: "1", reference: "TRN-SHP-2026-001284", billOfLading: "MAEU-ABJ-784512", consignee: "Northstar Industrial Supplies Ltd", organisation: "Northstar Logistics", cargo: "Industrial generator parts", containers: 2, storageLocation: "Yard A · A-014 / A-015", storedAt: "03 Nov 2026, 09:42", status: "Under review",
		documents: [
			{ id: "d1", name: "Bill of Lading", category: "Shipping document", reference: "MAEU-ABJ-784512", uploadedAt: "03 Nov 2026 · 09:51", status: "Verified", required: true, fileName: "bill-of-lading.pdf" },
			{ id: "d2", name: "Commercial Invoice", category: "Commercial document", reference: "INV-NS-2026-441", uploadedAt: "03 Nov 2026 · 09:54", status: "Pending review", required: true, fileName: "commercial-invoice.pdf" },
			{ id: "d3", name: "Packing List", category: "Cargo details", reference: "PL-NS-2026-441", uploadedAt: "03 Nov 2026 · 09:55", status: "Verified", required: true, fileName: "packing-list.pdf" },
			{ id: "d4", name: "Import Permit", category: "Regulatory document", reference: "IMP-2026-0931", uploadedAt: "03 Nov 2026 · 09:58", status: "Pending review", required: true, fileName: "import-permit.pdf" },
			{ id: "d5", name: "Insurance Certificate", category: "Supporting document", reference: "—", uploadedAt: "—", status: "Missing", required: false },
		],
	},
	{
		id: "2", reference: "TRN-SHP-2026-001279", billOfLading: "CMAU-ABJ-229104", consignee: "Meridian Foods & Beverages", organisation: "Meridian Cargo Services", cargo: "Packaged food products", containers: 4, storageLocation: "Warehouse · WH-B02", storedAt: "03 Nov 2026, 08:16", status: "Awaiting documents",
		documents: [
			{ id: "d6", name: "Bill of Lading", category: "Shipping document", reference: "CMAU-ABJ-229104", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d7", name: "Commercial Invoice", category: "Commercial document", reference: "—", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d8", name: "Packing List", category: "Cargo details", reference: "—", uploadedAt: "—", status: "Missing", required: true },
			{ id: "d9", name: "Regulatory Approval", category: "Regulatory document", reference: "—", uploadedAt: "—", status: "Missing", required: true },
		],
	},
	{
		id: "3", reference: "TRN-SHP-2026-001263", billOfLading: "OOLU-ABJ-610382", consignee: "Apex Building Materials", organisation: "Apex Freight Partners", cargo: "Ceramic tiles", containers: 3, storageLocation: "Yard C · C-022 / C-024", storedAt: "02 Nov 2026, 16:30", status: "Documents complete",
		documents: [
			{ id: "d10", name: "Bill of Lading", category: "Shipping document", reference: "OOLU-ABJ-610382", uploadedAt: "02 Nov 2026 · 16:42", status: "Verified", required: true, fileName: "bol-apex.pdf" },
			{ id: "d11", name: "Commercial Invoice", category: "Commercial document", reference: "APX-INV-8871", uploadedAt: "02 Nov 2026 · 16:43", status: "Verified", required: true, fileName: "invoice-apex.pdf" },
			{ id: "d12", name: "Packing List", category: "Cargo details", reference: "APX-PL-8871", uploadedAt: "02 Nov 2026 · 16:44", status: "Verified", required: true, fileName: "packing-apex.pdf" },
		],
	},
	{
		id: "4", reference: "TRN-SHP-2026-001251", billOfLading: "HLCU-ABJ-501729", consignee: "Crestline Automotive Ltd", organisation: "Crestline Shipping", cargo: "Vehicle spare parts", containers: 1, storageLocation: "Yard B · B-008", storedAt: "02 Nov 2026, 13:05", status: "Returned",
		documents: [
			{ id: "d13", name: "Bill of Lading", category: "Shipping document", reference: "HLCU-ABJ-501729", uploadedAt: "02 Nov 2026 · 13:21", status: "Verified", required: true, fileName: "crestline-bol.pdf" },
			{ id: "d14", name: "Commercial Invoice", category: "Commercial document", reference: "CR-INV-2026-102", uploadedAt: "02 Nov 2026 · 13:22", status: "Rejected", required: true, fileName: "crestline-invoice.pdf" },
			{ id: "d15", name: "Packing List", category: "Cargo details", reference: "CR-PL-2026-102", uploadedAt: "02 Nov 2026 · 13:23", status: "Verified", required: true, fileName: "crestline-packing.pdf" },
		],
	},
];

const shipmentStatusTone: Record<ShipmentStatus, ReturnType<typeof statusTone>> = {
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

export default function OperationsDocumentationRoute() {
	const [shipments, setShipments] = useState(initialShipments);
	const [selectedId, setSelectedId] = useState("1");
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<ShipmentStatus | "ALL">("ALL");
	const [activeTab, setActiveTab] = useState<"documents" | "activity">("documents");
	const [reviewNote, setReviewNote] = useState("");
	const [showUpload, setShowUpload] = useState(false);
	const [uploadName, setUploadName] = useState("");
	const [uploadType, setUploadType] = useState("Commercial Invoice");

	const selected = (shipments.find((item) => item.id === selectedId) ?? shipments[0]) as Shipment;
	const filteredShipments = useMemo(() => shipments.filter((item) => {
		const query = search.trim().toLowerCase();
		const matchesSearch = !query || `${item.reference} ${item.billOfLading} ${item.consignee} ${item.organisation} ${item.cargo}`.toLowerCase().includes(query);
		return matchesSearch && (filter === "ALL" || item.status === filter);
	}), [shipments, search, filter]);

	const counts = useMemo(() => ({
		total: shipments.length,
		awaiting: shipments.filter((item) => item.status === "Awaiting documents").length,
		review: shipments.filter((item) => item.status === "Under review").length,
		complete: shipments.filter((item) => item.status === "Documents complete").length,
		returned: shipments.filter((item) => item.status === "Returned").length,
	}), [shipments]);

	const requiredDocs = selected.documents.filter((doc) => doc.required);
	const verifiedDocs = requiredDocs.filter((doc) => doc.status === "Verified").length;
	const completion = requiredDocs.length ? Math.round((verifiedDocs / requiredDocs.length) * 100) : 0;
	const canComplete = requiredDocs.length > 0 && requiredDocs.every((doc) => doc.status === "Verified");

	const updateDocument = (documentId: string, status: DocumentStatus) => {
		setShipments((current) => current.map((item) => {
			if (item.id !== selected.id) return item;
			const documents = item.documents.map((doc) => doc.id === documentId ? { ...doc, status } : doc);
			const required = documents.filter((doc) => doc.required);
			const nextStatus: ShipmentStatus = required.every((doc) => doc.status === "Verified") ? "Documents complete" : required.some((doc) => doc.status === "Rejected") ? "Returned" : required.every((doc) => doc.status === "Missing") ? "Awaiting documents" : "Under review";
			return { ...item, documents, status: nextStatus };
		}));
	};

	const completeReview = () => {
		if (!canComplete) return;
		setShipments((current) => current.map((item) => item.id === selected.id ? { ...item, status: "Documents complete" } : item));
		toast.success("Documentation completed. Shipment is ready for examination.");
	};

	const returnForCorrection = () => {
		if (!reviewNote.trim()) {
			toast.error("Add a reason before returning this shipment.");
			return;
		}
		setShipments((current) => current.map((item) => item.id === selected.id ? { ...item, status: "Returned" } : item));
		setReviewNote("");
		toast.success("Shipment returned for document correction.");
	};

	const addDocument = () => {
		if (!uploadName.trim()) return;
		const document: CargoDocument = { id: `new-${Date.now()}`, name: uploadType, category: "Uploaded document", reference: "Awaiting reference", uploadedAt: "Just now", status: "Pending review", required: true, fileName: uploadName };
		setShipments((current) => current.map((item) => item.id === selected.id ? { ...item, documents: [...item.documents, document], status: "Under review" } : item));
		setUploadName("");
		setShowUpload(false);
		toast.success("Document added to the review list.");
	};

	return (
		<AppShell title="Documentation" eyebrow="Operations · Cargo Processing">
			<div className="space-y-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Terminal operations · Document verification</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Cargo documentation</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Review documents for cargo received into storage. Verify required records before releasing a shipment to the Examination workflow.</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<div className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-[11px] font-medium text-ink-soft"><Package className="size-3.5 text-orange" /> Storage <ArrowRight className="size-3 text-ink-soft" /> <span className="font-semibold text-orange-deep">Documentation</span> <ArrowRight className="size-3 text-ink-soft" /> Examination</div>
						<Button variant="outline" className="border-line bg-paper text-ink" onClick={() => toast.success("Documentation list exported in this preview.")}><Download className="mr-1.5 size-4" /> Export</Button>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric label="Shipments in queue" value={String(counts.total)} detail="Cargo already recorded in storage" tone="info" icon={FolderOpen} />
					<Metric label="Awaiting documents" value={String(counts.awaiting)} detail="Required files not yet submitted" tone="warning" icon={FileText} />
					<Metric label="Under review" value={String(counts.review)} detail="Documents awaiting verification" tone="info" icon={Clock3} />
					<Metric label="Ready for examination" value={String(counts.complete)} detail="All required documents verified" tone="success" icon={BadgeCheck} />
				</div>

				<div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)]">
					<section className="min-w-0 overflow-hidden rounded-xl bg-paper ring-1 ring-line">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
							<div><h3 className="text-sm font-semibold text-ink">Stored cargo queue</h3><p className="mt-1 text-xs text-ink-soft">Select a shipment to review its document checklist.</p></div>
							<span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">{filteredShipments.length} RECORDS</span>
						</div>
						<div className="space-y-3 border-b border-line p-4">
							<div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shipment, B/L, consignee..." className="h-10 border-line bg-sand pl-9 text-sm text-ink" /></div>
							<div className="flex flex-wrap items-center gap-2"><Filter className="size-4 text-ink-soft" /><select value={filter} onChange={(event) => setFilter(event.target.value as ShipmentStatus | "ALL")} className="h-9 min-w-0 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"><option value="ALL">All documentation statuses</option><option>Awaiting documents</option><option>Under review</option><option>Documents complete</option><option>Returned</option></select></div>
						</div>
						<div className="divide-y divide-line">
							{filteredShipments.length === 0 ? <div className="p-10 text-center"><FolderOpen className="mx-auto size-7 text-ink-soft" /><p className="mt-3 text-sm font-medium text-ink">No shipments found</p><p className="mt-1 text-xs text-ink-soft">Try another search term or status.</p></div> : filteredShipments.map((shipment) => {
								const required = shipment.documents.filter((doc) => doc.required);
								const verified = required.filter((doc) => doc.status === "Verified").length;
								const percent = required.length ? Math.round((verified / required.length) * 100) : 0;
								return <button key={shipment.id} onClick={() => { setSelectedId(shipment.id); setActiveTab("documents"); }} className={cn("w-full p-4 text-left transition-colors hover:bg-sand/50", selected.id === shipment.id && "bg-orange/5 ring-1 ring-inset ring-orange/30")}>
									<div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-mono text-xs font-semibold text-ink">{shipment.reference}</p><p className="mt-1 truncate text-xs text-ink-soft">{shipment.consignee}</p></div><StatusBadge label={shipment.status} tone={shipmentStatusTone[shipment.status]} /></div>
									<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft"><span className="font-mono">B/L: {shipment.billOfLading}</span><span>{shipment.containers} container{shipment.containers === 1 ? "" : "s"}</span><span>{shipment.storageLocation}</span></div>
									<div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-2"><div className="h-full rounded-full bg-orange transition-all" style={{ width: `${percent}%` }} /></div><span className="font-mono text-[10px] text-ink-soft">{verified}/{required.length} verified</span></div>
								</button>;
							})}
						</div>
						<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft"><span>Showing {filteredShipments.length} of {shipments.length} shipments</span><span>{counts.returned} returned for correction</span></div>
					</section>

					<section className="min-w-0 overflow-hidden rounded-xl bg-paper ring-1 ring-line">
						<div className="border-b border-line p-4">
							<div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Selected shipment</p><h3 className="mt-1 truncate font-mono text-sm font-bold text-ink">{selected.reference}</h3><p className="mt-1 text-xs text-ink-soft">{selected.billOfLading} · {selected.containers} container{selected.containers === 1 ? "" : "s"}</p></div><StatusBadge label={selected.status} tone={shipmentStatusTone[selected.status]} /></div>
							<div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-sand/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-ink-soft">Consignee</p><p className="mt-1 text-xs font-semibold text-ink">{selected.consignee}</p></div><div className="rounded-lg bg-sand/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-ink-soft">Storage location</p><p className="mt-1 text-xs font-semibold text-ink">{selected.storageLocation}</p></div></div>
							<div className="mt-4 flex items-center justify-between gap-3"><div className="flex gap-1 rounded-lg bg-sand p-1"><button onClick={() => setActiveTab("documents")} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition", activeTab === "documents" ? "bg-paper text-orange-deep shadow-sm" : "text-ink-soft hover:text-ink")}>Documents</button><button onClick={() => setActiveTab("activity")} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition", activeTab === "activity" ? "bg-paper text-orange-deep shadow-sm" : "text-ink-soft hover:text-ink")}>Activity</button></div><span className="font-mono text-[10px] text-ink-soft">{verifiedDocs}/{requiredDocs.length} REQUIRED VERIFIED</span></div>
						</div>

						{activeTab === "documents" ? <div className="p-4">
							<div className="mb-3 flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-ink">Document checklist</h4><p className="mt-1 text-xs text-ink-soft">Required documents are marked with an asterisk.</p></div><Button size="sm" className="bg-orange text-white hover:bg-orange-deep" onClick={() => setShowUpload(true)}><UploadCloud className="mr-1.5 size-3.5" /> Add document</Button></div>
							<div className="mb-4 rounded-lg border border-line bg-sand/50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-ink">Required document completion</span><span className="font-mono text-xs font-semibold text-orange-deep">{completion}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-2"><div className="h-full rounded-full bg-orange transition-all" style={{ width: `${completion}%` }} /></div></div>
							<div className="space-y-2.5">{selected.documents.map((doc) => <div key={doc.id} className="rounded-lg border border-line p-3"><div className="flex items-start gap-3"><span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", doc.status === "Verified" ? "bg-emerald-50 text-emerald-700" : doc.status === "Rejected" ? "bg-rose-50 text-rose-700" : doc.status === "Pending review" ? "bg-orange/10 text-orange-deep" : "bg-sand text-ink-soft")}><FileText className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-ink">{doc.name}{doc.required && <span className="ml-1 text-orange">*</span>}</p><StatusBadge label={doc.status} tone={documentTone[doc.status]} /></div><p className="mt-1 text-[10px] text-ink-soft">{doc.category} · Ref: {doc.reference}</p><p className="mt-1 truncate text-[10px] text-ink-soft">{doc.fileName || "No file submitted"} · {doc.uploadedAt}</p></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5"><span className="flex items-center gap-1.5 text-[10px] text-ink-soft">{doc.status === "Verified" ? <><CheckCircle2 className="size-3 text-emerald-600" /> Verified by Operations</> : doc.status === "Rejected" ? <><XCircle className="size-3 text-rose-600" /> Correction required</> : doc.status === "Missing" ? <><AlertTriangle className="size-3" /> Awaiting submission</> : <><Clock3 className="size-3 text-orange" /> Awaiting verification</>}</span><div className="flex flex-wrap gap-1.5">{doc.fileName && <Button size="sm" variant="outline" className="h-7 border-line px-2 text-[10px]" onClick={() => toast.info(`Previewing ${doc.fileName} in this UI preview.`)}><Eye className="mr-1 size-3" /> Preview</Button>}{doc.fileName && doc.status !== "Verified" && <Button size="sm" variant="outline" className="h-7 border-emerald-200 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50" onClick={() => updateDocument(doc.id, "Verified")}><Check className="mr-1 size-3" /> Verify</Button>}{doc.fileName && doc.status !== "Rejected" && doc.status !== "Verified" && <Button size="sm" variant="outline" className="h-7 border-rose-200 px-2 text-[10px] text-rose-700 hover:bg-rose-50" onClick={() => updateDocument(doc.id, "Rejected")}><X className="mr-1 size-3" /> Reject</Button>}</div></div></div>)}</div>
							<div className="mt-4 rounded-lg border border-line bg-sand/50 p-3"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" /><div><p className="text-xs font-semibold text-ink">Documentation clearance</p><p className="mt-1 text-[11px] leading-5 text-ink-soft">All required documents must be verified before this shipment can proceed to Examination. Optional supporting documents do not block clearance.</p></div></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Button disabled={!canComplete} onClick={completeReview} className="flex-1 bg-orange text-white hover:bg-orange-deep disabled:opacity-50"><BadgeCheck className="mr-1.5 size-4" /> Mark documentation complete</Button><Button variant="outline" onClick={returnForCorrection} className="border-line text-ink hover:bg-sand"><XCircle className="mr-1.5 size-4" /> Return for correction</Button></div><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add a reason or verification note (required when returning)..." rows={2} className="mt-3 w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-orange/25" /></div>
						</div> : <div className="space-y-4 p-4"><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check className="size-4" /></span><div><p className="text-xs font-semibold text-ink">Cargo stored and location confirmed</p><p className="mt-1 text-[11px] text-ink-soft">{selected.storedAt} · {selected.storageLocation}</p></div></div><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange-deep"><FileCheck2 className="size-4" /></span><div><p className="text-xs font-semibold text-ink">Documentation review opened</p><p className="mt-1 text-[11px] text-ink-soft">Shipment documents are being checked by Operations.</p></div></div>{selected.documents.filter((doc) => doc.status !== "Missing").map((doc) => <div key={doc.id} className="flex gap-3"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", doc.status === "Verified" ? "bg-emerald-50 text-emerald-700" : doc.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-orange/10 text-orange-deep")}>{doc.status === "Verified" ? <Check className="size-4" /> : doc.status === "Rejected" ? <X className="size-4" /> : <Clock3 className="size-4" />}</span><div><p className="text-xs font-semibold text-ink">{doc.name}: {doc.status}</p><p className="mt-1 text-[11px] text-ink-soft">{doc.uploadedAt}</p></div></div>)}<div className="rounded-lg bg-sand/70 p-3 text-[11px] leading-5 text-ink-soft">Activity shown here is sample UI data. Actual user names, timestamps and audit events can be populated when the page is connected to the operations API.</div></div>}
					</section>
				</div>

				<div className="flex flex-col justify-between gap-3 rounded-xl bg-paper p-4 ring-1 ring-line sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep"><FileCheck2 className="size-4" /></span><div><p className="text-xs font-semibold text-ink">Next stage: Examination</p><p className="mt-1 text-[11px] text-ink-soft">Only shipments with completed documentation clearance should enter the examination queue.</p></div></div><div className="flex items-center gap-2 text-xs font-semibold text-orange-deep">{counts.complete} ready to proceed <ArrowRight className="size-4" /></div></div>
			</div>

			{showUpload && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setShowUpload(false)}><div className="w-full max-w-md rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><h3 className="text-base font-semibold text-ink">Add cargo document</h3><p className="mt-1 text-xs text-ink-soft">Attach a document to {selected.reference}.</p></div><Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}><X className="size-4" /></Button></div><label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Document type</label><select value={uploadType} onChange={(event) => setUploadType(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"><option>Bill of Lading</option><option>Commercial Invoice</option><option>Packing List</option><option>Import Permit</option><option>Regulatory Approval</option><option>Insurance Certificate</option><option>Other supporting document</option></select><label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Select file</label><label className="mt-1.5 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-line bg-sand/50 px-4 py-7 text-center transition hover:border-orange"><UploadCloud className="size-6 text-orange" /><span className="mt-2 text-xs font-semibold text-ink">Choose a file</span><span className="mt-1 text-[10px] text-ink-soft">PDF, JPG or PNG · UI preview only</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => setUploadName(event.target.files?.[0]?.name || "")} /></label>{uploadName && <p className="mt-2 truncate text-[11px] font-medium text-emerald-700">Selected: {uploadName}</p>}<div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1 border-line" onClick={() => setShowUpload(false)}>Cancel</Button><Button className="flex-1 bg-orange text-white hover:bg-orange-deep disabled:opacity-50" disabled={!uploadName} onClick={addDocument}>Add to review</Button></div></div></div>}
		</AppShell>
	);
}
