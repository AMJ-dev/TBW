import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	Check,
	Eye,
	FileCheck2,
	FileText,
	Plus,
	ShieldCheck,
	UploadCloud,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DocumentStatus = "Verified" | "Pending review" | "Missing" | "Rejected";
type ShipmentStatus = "Awaiting documents" | "Under review" | "Documents complete" | "Returned" | "Rejected";

type CargoDocument = {
	id: string;
	name: string;
	category: string;
	reference: string;
	fileName?: string | undefined;
	fileSize?: string | undefined;
	uploadedAt: string;
	status: DocumentStatus;
	required: boolean;
	reviewNote?: string | undefined;
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
			{ id: "d1", name: "Bill of Lading", category: "Shipping document", reference: "MAEU-ABJ-784512", fileName: "bill-of-lading.pdf", fileSize: "1.8 MB", uploadedAt: "03 Nov 2026 · 09:51", status: "Verified", required: true },
			{ id: "d2", name: "Commercial Invoice", category: "Commercial document", reference: "INV-NS-2026-441", fileName: "commercial-invoice.pdf", fileSize: "842 KB", uploadedAt: "03 Nov 2026 · 09:54", status: "Pending review", required: true },
			{ id: "d3", name: "Packing List", category: "Cargo details", reference: "PL-NS-2026-441", fileName: "packing-list.pdf", fileSize: "624 KB", uploadedAt: "03 Nov 2026 · 09:55", status: "Verified", required: true },
			{ id: "d4", name: "Import Permit", category: "Regulatory document", reference: "IMP-2026-0931", fileName: "import-permit.pdf", fileSize: "1.1 MB", uploadedAt: "03 Nov 2026 · 09:58", status: "Pending review", required: true },
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
			{ id: "d10", name: "Bill of Lading", category: "Shipping document", reference: "OOLU-ABJ-610382", fileName: "bol-apex.pdf", fileSize: "1.2 MB", uploadedAt: "02 Nov 2026 · 16:42", status: "Verified", required: true },
			{ id: "d11", name: "Commercial Invoice", category: "Commercial document", reference: "APX-INV-8871", fileName: "invoice-apex.pdf", fileSize: "756 KB", uploadedAt: "02 Nov 2026 · 16:43", status: "Verified", required: true },
			{ id: "d12", name: "Packing List", category: "Cargo details", reference: "APX-PL-8871", fileName: "packing-apex.pdf", fileSize: "518 KB", uploadedAt: "02 Nov 2026 · 16:44", status: "Verified", required: true },
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
			{ id: "d13", name: "Bill of Lading", category: "Shipping document", reference: "HLCU-ABJ-501729", fileName: "crestline-bol.pdf", fileSize: "1.4 MB", uploadedAt: "02 Nov 2026 · 13:21", status: "Verified", required: true },
			{ id: "d14", name: "Commercial Invoice", category: "Commercial document", reference: "CR-INV-2026-102", fileName: "crestline-invoice.pdf", fileSize: "690 KB", uploadedAt: "02 Nov 2026 · 13:22", status: "Rejected", required: true, reviewNote: "Invoice total does not match the declared cargo value." },
			{ id: "d15", name: "Packing List", category: "Cargo details", reference: "CR-PL-2026-102", fileName: "crestline-packing.pdf", uploadedAt: "02 Nov 2026 · 13:23", status: "Verified", required: true },
		],
	},
	{
		id: "5",
		reference: "TRN-SHP-2026-001238",
		billOfLading: "MSCU-ABJ-119832",
		consignee: "Westbridge Engineering Ltd",
		organisation: "Westbridge Logistics",
		cargo: "Industrial machinery",
		containers: 2,
		storageLocation: "Yard D · D-011 / D-012",
		storedAt: "01 Nov 2026, 11:20",
		status: "Rejected",
		documents: [
			{ id: "d16", name: "Bill of Lading", category: "Shipping document", reference: "MSCU-ABJ-119832", fileName: "westbridge-bol.pdf", fileSize: "1.3 MB", uploadedAt: "01 Nov 2026 · 11:31", status: "Verified", required: true },
			{ id: "d17", name: "Commercial Invoice", category: "Commercial document", reference: "WB-INV-2026-81", fileName: "westbridge-invoice.pdf", fileSize: "910 KB", uploadedAt: "01 Nov 2026 · 11:32", status: "Rejected", required: true, reviewNote: "Submitted invoice appears to belong to a different consignee." },
		],
	},
];

const shipmentTone: Record<ShipmentStatus, ReturnType<typeof statusTone>> = {
	"Awaiting documents": "warning",
	"Under review": "info",
	"Documents complete": "success",
	Returned: "critical",
	Rejected: "critical",
};

const documentTone: Record<DocumentStatus, ReturnType<typeof statusTone>> = {
	Verified: "success",
	"Pending review": "warning",
	Missing: "info",
	Rejected: "critical",
};

const labelClass = "block text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-soft";
const inputClass = "h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-orange focus:ring-2 focus:ring-orange/15";

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OperationDocumentDetailsationPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [shipments, setShipments] = useState(initialShipments);
	const [showUpload, setShowUpload] = useState(false);
	const [uploadType, setUploadType] = useState("Commercial Invoice");
	const [uploadReference, setUploadReference] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [requiredUpload, setRequiredUpload] = useState(true);
	const [rejectingId, setRejectingId] = useState<string | null>(null);
	const [reviewNote, setReviewNote] = useState("");
	const [previewDocument, setPreviewDocument] = useState<CargoDocument | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const selected = shipments.find((shipment) => shipment.id === id) ?? null;
	const selectedRequired = selected?.documents.filter((document) => document.required) ?? [];
	const selectedVerified = selectedRequired.filter((document) => document.status === "Verified").length;
	const selectedCompletion = selectedRequired.length ? Math.round((selectedVerified / selectedRequired.length) * 100) : 0;
	const canClear = selectedRequired.length > 0 && selectedRequired.every((document) => document.status === "Verified");

	const documentCounts = useMemo(() => ({
		verified: selected?.documents.filter((document) => document.status === "Verified").length ?? 0,
		pending: selected?.documents.filter((document) => document.status === "Pending review").length ?? 0,
		rejected: selected?.documents.filter((document) => document.status === "Rejected").length ?? 0,
		missing: selected?.documents.filter((document) => document.status === "Missing" && document.required).length ?? 0,
	}), [selected]);

	const recalculateStatus = (documents: CargoDocument[]): ShipmentStatus => {
		const required = documents.filter((document) => document.required);
		if (required.length && required.every((document) => document.status === "Verified")) return "Documents complete";
		if (required.some((document) => document.status === "Rejected")) return "Returned";
		if (required.length && required.every((document) => document.status === "Missing")) return "Awaiting documents";
		return "Under review";
	};

	const updateDocument = (documentId: string, status: DocumentStatus, note = "") => {
		if (!selected) return;
		setShipments((current) => current.map((shipment) => {
			if (shipment.id !== selected.id) return shipment;
			const documents = shipment.documents.map((document) => document.id === documentId
				? { ...document, status, reviewNote: status === "Rejected" ? note : undefined }
				: document);
			return { ...shipment, documents, status: recalculateStatus(documents) };
		}));
		setRejectingId(null);
		setReviewNote("");
		toast.success(status === "Verified" ? "Document marked as verified." : "Document returned for correction.");
	};

	const addDocument = () => {
		if (!selected || !uploadFile) return;
		const document: CargoDocument = {
			id: `preview-${Date.now()}`,
			name: uploadType,
			category: "Uploaded document",
			reference: uploadReference.trim() || "Not provided",
			fileName: uploadFile.name,
			fileSize: formatFileSize(uploadFile.size),
			uploadedAt: "Just now",
			status: "Pending review",
			required: requiredUpload,
		};
		setShipments((current) => current.map((shipment) => shipment.id === selected.id
			? { ...shipment, documents: [...shipment.documents, document], status: "Under review" }
			: shipment));
		setUploadFile(null);
		setUploadReference("");
		setUploadType("Commercial Invoice");
		setRequiredUpload(true);
		setShowUpload(false);
		toast.success("Document added to the local preview.");
	};

	const completeVerification = () => {
		if (!selected || !canClear) return;
		setShipments((current) => current.map((shipment) => shipment.id === selected.id
			? { ...shipment, status: "Documents complete" }
			: shipment));
		toast.success("Documentation marked complete in this preview.");
	};

	if (!selected) {
		return (
			<AppShell title="Document Details" eyebrow="Operations · Document Control">
				<div className="space-y-5 pb-8">
					<Button variant="outline" className="border-line" onClick={() => navigate("/operations/documentation")}>
						<ArrowLeft className="mr-2 size-4" /> Back to documents
					</Button>
					<section className="rounded-xl border border-line bg-paper px-5 py-14 text-center shadow-sm">
						<FileText className="mx-auto size-9 text-ink-soft/60" />
						<h2 className="mt-3 text-base font-semibold text-ink">Shipment not found</h2>
						<p className="mt-1 text-sm text-ink-soft">No shipment matches the ID in this route.</p>
					</section>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Shipment Documentation" eyebrow="Operations · Document Control">
			<div className="space-y-5 pb-8">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button variant="outline" className="border-line" onClick={() => navigate("/operations/documentation")}>
						<ArrowLeft className="mr-2 size-4" /> Back to documents
					</Button>
					<StatusBadge label={selected.status} tone={shipmentTone[selected.status]} />
				</div>

				<section className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-5">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0">
							<p className={labelClass}>Shipment documentation file</p>
							<h2 className="mt-1 break-all font-display text-xl font-bold text-ink sm:text-2xl">{selected.reference}</h2>
							<p className="mt-2 text-xs text-ink-soft">Bill of Lading: {selected.billOfLading}</p>
						</div>
						<div className="w-full lg:max-w-xs">
							<div className="flex items-center justify-between text-xs">
								<span className="font-semibold text-ink">Required document clearance</span>
								<span className="font-mono font-bold text-orange-deep">{selectedCompletion}%</span>
							</div>
							<div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
								<div className="h-full rounded-full bg-orange transition-all" style={{ width: `${selectedCompletion}%` }} />
							</div>
							<p className="mt-1.5 text-[11px] text-ink-soft">{selectedVerified} of {selectedRequired.length} required documents verified</p>
						</div>
					</div>
					<div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
						<div><p className={labelClass}>Organisation</p><p className="mt-1 text-sm font-semibold text-ink">{selected.organisation}</p></div>
						<div><p className={labelClass}>Consignee</p><p className="mt-1 text-sm font-semibold text-ink">{selected.consignee}</p></div>
						<div><p className={labelClass}>Cargo description</p><p className="mt-1 text-sm font-semibold text-ink">{selected.cargo}</p></div>
						<div><p className={labelClass}>Storage location</p><p className="mt-1 text-sm font-semibold text-ink">{selected.storageLocation}</p></div>
					</div>
					<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-ink-soft">
						<span><strong className="text-ink">{selected.containers}</strong> container(s)</span>
						<span>Received into storage: <strong className="text-ink">{selected.storedAt}</strong></span>
					</div>
				</section>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-xl border border-line bg-paper p-4"><p className={labelClass}>Total documents</p><p className="mt-2 font-display text-2xl font-bold text-ink">{selected.documents.length}</p><p className="mt-1 text-[11px] text-ink-soft">Shipment document records</p></div>
					<div className="rounded-xl border border-line bg-paper p-4"><p className={labelClass}>Verified</p><p className="mt-2 font-display text-2xl font-bold text-emerald-700">{documentCounts.verified}</p><p className="mt-1 text-[11px] text-ink-soft">Documents accepted</p></div>
					<div className="rounded-xl border border-line bg-paper p-4"><p className={labelClass}>Pending review</p><p className="mt-2 font-display text-2xl font-bold text-orange-deep">{documentCounts.pending}</p><p className="mt-1 text-[11px] text-ink-soft">Awaiting verification</p></div>
					<div className="rounded-xl border border-line bg-paper p-4"><p className={labelClass}>Rejected / missing</p><p className="mt-2 font-display text-2xl font-bold text-rose-700">{documentCounts.rejected + documentCounts.missing}</p><p className="mt-1 text-[11px] text-ink-soft">Returned or not submitted</p></div>
				</div>

				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h3 className="font-display text-lg font-bold text-ink">Document verification</h3>
						<p className="mt-1 text-xs text-ink-soft">Review each submitted file and record its verification outcome.</p>
					</div>
					<Button onClick={() => setShowUpload(true)} className="bg-orange text-white hover:bg-orange-deep">
						<Plus className="mr-1.5 size-4" /> Add document
					</Button>
				</div>

				<section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
					<div className="hidden grid-cols-[1.15fr_1fr_1fr_120px_190px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft lg:grid">
						<span>Document</span><span>Reference / File</span><span>Submitted</span><span>Status</span><span>Actions</span>
					</div>
					{selected.documents.map((document) => (
						<div key={document.id} className="border-b border-line p-4 last:border-0">
							<div className="grid gap-3 lg:grid-cols-[1.15fr_1fr_1fr_120px_190px] lg:items-center">
								<div className="flex min-w-0 items-center gap-3">
									<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand text-ink-soft"><FileText className="size-4" /></span>
									<div className="min-w-0"><p className="text-sm font-semibold text-ink">{document.name}{document.required && <span className="ml-1 text-orange">*</span>}</p><p className="text-[11px] text-ink-soft">{document.category}{document.required ? " · Required" : " · Optional"}</p></div>
								</div>
								<div className="min-w-0"><p className="break-all text-xs text-ink">{document.reference}</p><p className="truncate text-[11px] text-ink-soft">{document.fileName ?? "No file submitted"}{document.fileSize ? ` · ${document.fileSize}` : ""}</p></div>
								<p className="text-xs text-ink">{document.uploadedAt}</p>
								<div><StatusBadge label={document.status} tone={documentTone[document.status]} /></div>
								<div className="flex flex-wrap gap-1.5">
									{document.fileName && <Button size="sm" variant="outline" className="h-8 border-line" onClick={() => setPreviewDocument(document)}><Eye className="mr-1 size-3" /> View</Button>}
									{document.fileName && document.status !== "Verified" && <Button size="sm" className="h-8 bg-orange text-white hover:bg-orange-deep" onClick={() => updateDocument(document.id, "Verified")}><Check className="mr-1 size-3" /> Verify</Button>}
									{document.fileName && document.status !== "Rejected" && document.status !== "Verified" && <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => { setRejectingId(document.id); setReviewNote(""); }}><X className="mr-1 size-3" /> Return</Button>}
								</div>
							</div>
							{document.reviewNote && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800"><span className="font-semibold">Return note:</span> {document.reviewNote}</div>}
							{rejectingId === document.id && (
								<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/40 p-3">
									<label className="text-xs font-semibold text-rose-800">Reason for returning this document</label>
									<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value.slice(0, 1000))} rows={3} maxLength={1000} className="mt-2 w-full resize-y rounded-lg border border-rose-200 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-rose-200" placeholder="Explain the issue and what the organisation needs to correct..." />
									<div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-ink-soft">{reviewNote.length}/1000 characters</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button><Button size="sm" disabled={!reviewNote.trim()} className="bg-rose-700 text-white hover:bg-rose-800" onClick={() => updateDocument(document.id, "Rejected", reviewNote.trim())}>Confirm return</Button></div></div>
								</div>
							)}
						</div>
					))}
					{selected.documents.length === 0 && <div className="p-10 text-center text-sm text-ink-soft">No documents have been added to this shipment.</div>}
				</section>

				<section className="rounded-xl border border-line bg-paper p-4 shadow-sm sm:p-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-orange-deep" /><div><h3 className="text-sm font-semibold text-ink">Documentation clearance</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-soft">Every required document must be verified before documentation can be marked complete and the shipment can proceed to the next operational stage.</p></div></div>
						<span className={cn("shrink-0 text-xs font-semibold", canClear ? "text-emerald-700" : "text-orange-deep")}>{canClear ? "Ready for clearance" : "Verification outstanding"}</span>
					</div>
					<div className="mt-4 flex justify-end"><Button disabled={!canClear || selected.status === "Documents complete"} onClick={completeVerification} className="bg-orange text-white hover:bg-orange-deep disabled:opacity-50"><BadgeCheck className="mr-2 size-4" /> {selected.status === "Documents complete" ? "Verification complete" : "Complete verification"} <ArrowRight className="ml-2 size-4" /></Button></div>
				</section>
			</div>

			{showUpload && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowUpload(false); }}>
					<div role="dialog" aria-modal="true" aria-labelledby="add-document-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-5 shadow-2xl sm:p-6">
						<div className="flex items-start justify-between gap-3"><div><h3 id="add-document-title" className="text-base font-bold text-ink">Add shipment document</h3><p className="mt-1 text-xs text-ink-soft">Add a document to {selected.reference}.</p></div><Button variant="ghost" size="icon" aria-label="Close dialog" onClick={() => setShowUpload(false)}><X className="size-4" /></Button></div>
						<div className="mt-5 space-y-4">
							<div><label className={labelClass}>Document type <span className="text-orange">*</span></label><select value={uploadType} onChange={(event) => setUploadType(event.target.value)} className={cn(inputClass, "mt-1.5")}><option>Bill of Lading</option><option>Commercial Invoice</option><option>Packing List</option><option>Import Permit</option><option>Regulatory Approval</option><option>Insurance Certificate</option><option>Customs Declaration</option><option>Other supporting document</option></select></div>
							<div><label className={labelClass}>Document reference</label><Input value={uploadReference} onChange={(event) => setUploadReference(event.target.value)} placeholder="Enter document reference" className="mt-1.5" /></div>
							<div><label className={labelClass}>Document file <span className="text-orange">*</span></label><input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx" className="hidden" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1.5 flex w-full flex-col items-center rounded-xl border border-dashed border-line bg-sand/40 px-4 py-7 text-center transition hover:border-orange hover:bg-orange/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"><UploadCloud className="size-7 text-orange" /><span className="mt-2 text-sm font-semibold text-ink">{uploadFile ? uploadFile.name : "Choose a file to attach"}</span><span className="mt-1 text-[11px] text-ink-soft">{uploadFile ? `${formatFileSize(uploadFile.size)} · Selected` : "PDF, image, Excel or Word · Maximum 10 MB"}</span></button>{uploadFile && <button type="button" onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-2 text-xs font-medium text-rose-700 hover:underline">Remove selected file</button>}</div>
							<label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3"><input type="checkbox" checked={requiredUpload} onChange={(event) => setRequiredUpload(event.target.checked)} className="mt-0.5 size-4 accent-orange" /><span><span className="block text-xs font-semibold text-ink">Required document</span><span className="mt-0.5 block text-[11px] text-ink-soft">Include this document in the shipment clearance checklist.</span></span></label>
							<p className="text-[10px] leading-5 text-ink-soft">This screen is a UI preview. Selecting a file does not upload it to a server or persist it after the page is refreshed.</p>
						</div>
						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" className="border-line" onClick={() => setShowUpload(false)}>Cancel</Button><Button disabled={!uploadFile || uploadFile.size > 10 * 1024 * 1024} className="bg-orange text-white hover:bg-orange-deep disabled:opacity-50" onClick={addDocument}>Add to register</Button></div>
					</div>
				</div>
			)}

			{previewDocument && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewDocument(null); }}>
					<div role="dialog" aria-modal="true" aria-labelledby="preview-document-title" className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-2xl">
						<div className="flex items-start justify-between gap-3"><div><h3 id="preview-document-title" className="text-base font-bold text-ink">Document details</h3><p className="mt-1 text-xs text-ink-soft">Preview information for the selected file.</p></div><Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setPreviewDocument(null)}><X className="size-4" /></Button></div>
						<div className="mt-5 flex items-center gap-3 rounded-xl bg-sand/60 p-3"><span className="flex size-10 items-center justify-center rounded-lg bg-paper text-orange-deep"><FileText className="size-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{previewDocument.fileName}</p><p className="text-[11px] text-ink-soft">{previewDocument.fileSize ?? "File size unavailable"}</p></div></div>
						<dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-ink-soft">Document type</dt><dd className="text-right font-medium text-ink">{previewDocument.name}</dd></div><div className="flex justify-between gap-4"><dt className="text-ink-soft">Reference</dt><dd className="text-right font-medium text-ink">{previewDocument.reference}</dd></div><div className="flex justify-between gap-4"><dt className="text-ink-soft">Submitted</dt><dd className="text-right font-medium text-ink">{previewDocument.uploadedAt}</dd></div><div className="flex justify-between gap-4"><dt className="text-ink-soft">Status</dt><dd><StatusBadge label={previewDocument.status} tone={documentTone[previewDocument.status]} /></dd></div></dl>
						<p className="mt-4 rounded-lg border border-line bg-sand/40 p-3 text-[11px] leading-5 text-ink-soft">Actual file preview will be available when document storage and the file-view endpoint are connected.</p>
						<div className="mt-5 flex justify-end"><Button onClick={() => setPreviewDocument(null)}>Close</Button></div>
					</div>
				</div>
			)}
		</AppShell>
	);
}
