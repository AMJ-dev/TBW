import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
	ArrowRight,
	Clock3,
	Download,
	Eye,
	FileCheck2,
	Filter,
	FolderOpen,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DocumentStatus = "Verified" | "Pending review" | "Missing" | "Rejected";
type ShipmentStatus =
	| "Awaiting documents"
	| "Under review"
	| "Documents complete"
	| "Returned"
	| "Rejected";

type CargoDocument = {
	id?: string;
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

export default function OperationsDocumentationRoute() {
	const [shipments, setShipments] = useState(initialShipments);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const navigate = useNavigate();

	const allDocuments = useMemo(() => shipments.flatMap((shipment) => shipment.documents.map((document) => ({ document, shipment }))),[shipments]);

	const pendingCount = allDocuments.filter(({ document }) => document.status === "Pending review").length;
	const verifiedCount = allDocuments.filter(({ document }) => document.status === "Verified").length;
	const rejectedCount = allDocuments.filter(({ document }) => document.status === "Rejected").length;
	const missingCount = allDocuments.filter(({ document }) => document.status === "Missing" && document.required).length;
	const readyCount = shipments.filter((shipment) => shipment.status === "Documents complete").length;

	const filteredShipments = useMemo(() => {
		const query = search.trim().toLowerCase();
		return shipments.filter((shipment) => {
			const matchesSearch = !query || [
				shipment.reference,
				shipment.billOfLading,
				shipment.consignee,
				shipment.organisation,
				shipment.cargo,
			].some((value) => value.toLowerCase().includes(query));
			return matchesSearch && (statusFilter === "ALL" || shipment.status === statusFilter);
		});
	}, [shipments, search, statusFilter]);

	const exportRegister = () => {
		const rows = [
			["Shipment reference", "Bill of lading", "Consignee", "Organisation", "Shipment status", "Document", "Document reference", "File", "Document status", "Required"],
			...allDocuments.map(({ document, shipment }) => [
				shipment.reference,
				shipment.billOfLading,
				shipment.consignee,
				shipment.organisation,
				shipment.status,
				document.name,
				document.reference,
				document.fileName ?? "",
				document.status,
				document.required ? "Yes" : "No",
			]),
		];
		const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "trinu-document-register.csv";
		anchor.click();
		URL.revokeObjectURL(url);
		toast.success("Document register exported.");
	};

	return (
		<AppShell title="Document Management" eyebrow="Operations · Document Control">
			<div className="space-y-5 pb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">Terminal operations · Document control</p>
                        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Document Management</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Manage shipment documents, review submissions and track documentation clearance before cargo proceeds to the next stage.</p>
                    </div>
                    <Button variant="outline" className="w-full border-line sm:w-auto" onClick={exportRegister}>
                        <Download className="mr-2 size-4" /> Export register
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Shipments in register" value={String(shipments.length)} detail="Shipment documentation files" tone="info" icon={FolderOpen} />
                    <Metric label="Pending verification" value={String(pendingCount)} detail="Submitted documents awaiting review" tone="warning" icon={Clock3} />
                    <Metric label="Verified documents" value={String(verifiedCount)} detail={`${readyCount} shipments documentation-complete`} tone="success" icon={FileCheck2} />
                    <Metric label="Rejected / missing" value={String(rejectedCount + missingCount)} detail={`${rejectedCount} returned · ${missingCount} required missing`} tone="critical" icon={ShieldCheck} />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shipment, B/L, consignee..." className="pl-9" />
                        {search && <button aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"><X className="size-4" /></button>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="size-4 text-ink-soft" />
                        <label htmlFor="document-status-filter" className="sr-only">Filter by status</label>
                        <select id="document-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 min-w-44 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15">
                            <option value="ALL">All statuses</option>
                            <option>Awaiting documents</option><option>Under review</option><option>Documents complete</option><option>Returned</option><option>Rejected</option>
                        </select>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5">
                        <div>
                            <h3 className="text-sm font-semibold text-ink">Shipment document register</h3>
                            <p className="mt-1 text-[11px] text-ink-soft">Shipments currently recorded in terminal document control.</p>
                        </div>
                        <span className="rounded-md bg-orange/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-orange-deep">{filteredShipments.length} SHIPMENTS</span>
                    </div>
                    <div className="hidden grid-cols-[1.25fr_1.1fr_1fr_120px_145px_100px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft lg:grid">
                        <span>Shipment / B/L</span><span>Consignee / Organisation</span><span>Storage location</span><span>Required docs</span><span>Status</span><span className="text-right">Action</span>
                    </div>
                    {filteredShipments.map((shipment) => {
                        const required = shipment.documents.filter((document) => document.required);
                        const verified = required.filter((document) => document.status === "Verified").length;
                        const progress = required.length ? Math.round((verified / required.length) * 100) : 0;
                        return (
                            <div key={shipment.id} className="grid gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-sand/40 last:border-0 lg:grid-cols-[1.25fr_1.1fr_1fr_120px_145px_100px] lg:items-center">
                                <div className="min-w-0">
                                    <p className="break-all font-mono text-xs font-bold text-ink">{shipment.reference}</p>
                                    <p className="mt-1 text-[10px] text-ink-soft">B/L: {shipment.billOfLading} · {shipment.containers} container(s)</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-ink">{shipment.consignee}</p>
                                    <p className="mt-1 truncate text-[10px] text-ink-soft">{shipment.organisation}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-ink">{shipment.storageLocation}</p>
                                    <p className="mt-1 text-[10px] text-ink-soft">Stored {shipment.storedAt}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ink">{verified}/{required.length} verified</p>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
                                        <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                                <div><StatusBadge label={shipment.status} tone={shipmentTone[shipment.status]} /></div>
                                <div className="flex justify-start lg:justify-end">
                                    <Button type="button" size="sm" variant="outline" className="h-8 border-line" onClick={() => navigate(`/operations/documentation/${shipment.id}`)}>
                                        <Eye className="mr-1 size-3.5" /> Details
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredShipments.length === 0 && <div className="p-12 text-center"><FolderOpen className="mx-auto size-8 text-ink-soft/60" /><p className="mt-3 text-sm font-semibold text-ink">No shipments found</p><p className="mt-1 text-xs text-ink-soft">Try changing your search or status filter.</p></div>}
                    <div className="border-t border-line px-4 py-3 text-[10px] text-ink-soft">Showing {filteredShipments.length} of {shipments.length} shipments</div>
                </section>

                <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep"><FileCheck2 className="size-4" /></span>
                        <div>
                            <p className="text-xs font-semibold text-ink">Documentation clearance</p>
                            <p className="mt-1 text-[11px] leading-5 text-ink-soft">Only shipments with all required documents verified should proceed to the next operational stage.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-deep">{readyCount} shipments cleared <ArrowRight className="size-4" /></div>
                </div>
			</div>
		</AppShell>
	);
}
