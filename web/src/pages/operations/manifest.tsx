import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	ChevronDown,
	ClipboardCheck,
	Container,
	Download,
	FileText,
	Info,
	Loader2,
	Mail,
	Plus,
	Search,
	Send,
	Ship,
	Upload,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type ManifestStatus =
	| "Pre-advice"
	| "Review required"
	| "Validated"
	| "Received"
	| "Discrepancy"
	| "Duplicate";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

type ConsigneeType = "organisation" | "individual";

type ConsigneeStatus = "linked" | "unregistered";

type View = "list" | "intake" | "detail";

interface ManifestRecord {
	id: string;
	manifestRef: string;
	bl: string;
	vessel: string;
	shippingLine: string;
	originPort: string;
	eta: string;
	containers: number;
	packages: number;
	grossWeight: string;
	consignee: string;
	consigneeOrganisationId?: string | null;
	consigneeStatus?: ConsigneeStatus;
	consigneeEmail?: string | null;
	consigneePhone?: string | null;
	consigneeAddress?: string | null;
	agent: string;
	source: IntakeSource;
	status: ManifestStatus;
	receivedAt: string;
	notes: string;
	shipmentReference?: string;
	shipmentReferences?: string;
	matchedShipmentId?: string | null;
}

interface RegisteredOrganisation {
	id: string;
	name: string;
	rcNumber?: string;
	status: "verified" | "pending" | "under_review" | string;
}

interface RegisteredAgent {
	id: string;
	name: string;
	licenceNumber: string;
	contactEmail?: string;
	contactPhone?: string;
}

interface ConsigneeValue {
	type: ConsigneeType;
	organisationId: string | null;
	organisationName: string;
	status: ConsigneeStatus;
	contactPerson: string;
	fullName: string;
	email: string;
	phone: string;
	address: string;
	country: string;
	agentId: string | null;
	agentName: string;
}

const statusFilters: (ManifestStatus | "all")[] = [
	"all",
	"Pre-advice",
	"Review required",
	"Validated",
	"Received",
	"Discrepancy",
	"Duplicate",
];
const formatStatus = (status: string) => status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const inputClass =
	"mt-1.5 h-11 border-line bg-sand text-ink placeholder:text-ink-soft/60";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const emptyConsignee: ConsigneeValue = {
	type: "organisation",
	organisationId: null,
	organisationName: "",
	status: "unregistered",
	contactPerson: "",
	fullName: "",
	email: "",
	phone: "",
	address: "",
	country: "",
	agentId: null,
	agentName: "",
};

const extractList = <T,>(payload: any): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	if (Array.isArray(payload?.results)) return payload.results as T[];
	if (Array.isArray(payload?.data)) return payload.data as T[];
	return [];
};

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
	@keyframes slideInFromLeft {
		from { opacity: 0; transform: translateX(-24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

export default function OperationsManifestRoute() {
	const [manifests, setManifests] = useState<ManifestRecord[]>([]);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ManifestStatus | "all">("all");
	const [selected, setSelected] = useState<ManifestRecord | null>(null);
	const [view, setView] = useState<View>("list");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [actioning, setActioning] = useState(false);

	const fetchManifests = async () => {
		setLoading(true);
		try {
			const res = await http.get("operations/manifests/");
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not load manifests.");
				setManifests([]);
				return;
			}
			const list = extractList<any>(resp.code);
			setManifests(
				list.map((m) => ({
					id: m.id,
					manifestRef: m.manifest_ref ?? m.manifestRef ?? "—",
					bl: m.bl ?? m.bill_of_lading ?? "—",
					vessel: m.vessel ?? "—",
					shippingLine: m.shipping_line ?? m.shippingLine ?? "—",
					originPort: m.origin_port ?? m.originPort ?? "—",
					eta: m.eta ?? "—",
					containers: Number(m.containers ?? 0),
					packages: Number(m.packages ?? 0),
					grossWeight: m.gross_weight ?? m.grossWeight ?? "—",
					consignee: m.consignee ?? "—",
					consigneeOrganisationId: m.consignee_organisation_id ?? null,
					consigneeStatus: (m.consignee_status ?? "unregistered") as ConsigneeStatus,
					consigneeEmail: m.consignee_email ?? null,
					consigneePhone: m.consignee_phone ?? null,
					consigneeAddress: m.consignee_address ?? null,
					agent: m.agent ?? "—",
					source: (m.source ?? "Manual") as IntakeSource,
					status: (String(m.status ?? "Pre-advice").toLowerCase() === "review_required" || String(m.status ?? "").toLowerCase() === "review required" ? "Review required" : m.status ?? "Pre-advice") as ManifestStatus,
					receivedAt: m.received_at ?? m.receivedAt ?? "—",
					notes: m.notes ?? "",
					shipmentReference: m.shipment_reference ?? "",
					shipmentReferences: m.shipment_reference ?? m.shipment_bill_of_lading ?? "",
					matchedShipmentId: m.matched_shipment_id ?? null,
				}))
			);
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not load manifests.");
			setManifests([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchManifests();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filtered = useMemo(() => {
		return manifests.filter((m) => {
			const q = query.trim().toLowerCase();
			const matchQuery =
				!q ||
				m.manifestRef.toLowerCase().includes(q) ||
				m.bl.toLowerCase().includes(q) ||
				m.vessel.toLowerCase().includes(q) ||
				m.consignee.toLowerCase().includes(q) ||
				m.agent.toLowerCase().includes(q);
			const matchStatus = statusFilter === "all" || m.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [manifests, query, statusFilter]);

	const stats = useMemo(() => {
		const total = manifests.length;
		const validated = manifests.filter((m) => m.status === "Validated").length;
		const received = manifests.filter((m) => m.status === "Received").length;
		const flagged = manifests.filter(
			(m) => m.status === "Discrepancy" || m.status === "Duplicate"
		).length;
		return { total, validated, received, flagged };
	}, [manifests]);

	const openManifest = (m: ManifestRecord) => {
		setSelected(m);
		setView("detail");
	};

	const closeManifest = () => {
		setSelected(null);
		setView("list");
	};

	const handleIntake = async (
		next: ManifestRecord & { uploadToken?: string }
	): Promise<boolean> => {
		setSubmitting(true);
		try {
			const formData = new FormData();
			Object.entries(next).forEach(([key, value]) => {
				if (value !== undefined && value !== null) formData.append(key, String(value));
			});
			formData.append("consigneeType", (next as any).consigneeType ?? "organisation");
			formData.append("consigneeOrganisationId", (next as any).consigneeOrganisationId ?? "");
			formData.append("consigneeStatus", (next as any).consigneeStatus ?? "unregistered");
			formData.append("consigneeEmail", (next as any).consigneeEmail ?? "");
			formData.append("consigneePhone", (next as any).consigneePhone ?? "");
			formData.append("consigneeAddress", (next as any).consigneeAddress ?? "");
			formData.append("agentId", (next as any).agentId ?? "");
			const res = await http.post("operations/manifests/save/", formData);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not add the manifest.");
				return false;
			}
			setView("list");
			toast.success("Manifest added.");
			await fetchManifests();
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not add the manifest."
			);
			return false;
		} finally {
			setSubmitting(false);
		}
	};

	const handleValidate = async (id: string) => {
		setActioning(true);
		try {
			const res = await http.post(`operations/manifests/validate/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not validate the manifest.");
				return;
			}
			toast.success("Manifest marked as validated.");
			await fetchManifests();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not validate the manifest."
			);
		} finally {
			setActioning(false);
		}
	};

	const handleFlag = async (id: string, reason: string, responsibleParty: "Organisation" | "Operations" | "") => {
		setActioning(true);
		try {
			const res = await http.post(`operations/manifests/flag/${id}/`, {reason: reason.trim(), responsible_party: responsibleParty});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not flag the manifest.");
				return false;
			}
			toast.success("Manifest flagged for review.");
			await fetchManifests();
			return true;
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Could not flag the manifest.");
			return false;
		} finally {
			setActioning(false);
		}
	};

	const handleExport = async () => {
		try {
			const res = await http.get("operations/manifests/export/");
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Export failed.");
				return;
			}
			const csv = typeof resp.code === "string" ? resp.code : "";
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `manifest-intake-${new Date()
				.toISOString()
				.slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Manifest intake log exported.");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Export failed. Please try again."
			);
		}
	};

	return (
		<AppShell title="Pre-advice & manifest intake" eyebrow="Operations · Inbound">
			<style>{pageAnimations}</style>
			<div className="overflow-hidden">
				{view === "list" && (
					<ListView
						key="list"
						manifests={manifests}
						filtered={filtered}
						stats={stats}
						query={query}
						statusFilter={statusFilter}
						loading={loading}
						actioning={actioning}
						onQueryChange={setQuery}
						onStatusChange={setStatusFilter}
						onSelect={openManifest}
						onNewIntake={() => setView("intake")}
						onExport={handleExport}
					/>
				)}

				{view === "intake" && (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleIntake}
						submitting={submitting}
					/>
				)}

				{view === "detail" && selected && (
					<ManifestDetailDialog
						key={selected.id}
						manifest={selected}
						actioning={actioning}
						onClose={closeManifest}
						onValidate={async () => {
							await handleValidate(selected.id);
							await fetchManifests();
							setSelected((current) => current ? { ...current, status: "Validated" } : current);
						}}
						onFlag={async (reason, responsibleParty) =>
							await handleFlag(selected.id, reason, responsibleParty)
						}
						onMatch={async (shipmentId, reason) => {
							if (selected.status !== "Pre-advice") {
								toast.error("The shipment link can only be changed while the manifest is in Pre-advice.");
								return false;
							}
							const res = await http.post(`operations/manifests/match/`, {"manifest_id": selected.id, "shipment_id": shipmentId, "reason": reason});
							const resp: Resp = res.data;
							if (resp.error) {
								toast.error(resp.data || "Could not link shipment declaration.");
								return false;
							}
							toast.success(resp.data || "Shipment declaration linked.");
							await fetchManifests();
							setSelected((current) => current ? {
								...current,
								matchedShipmentId: shipmentId,
								shipmentReference: current.shipmentReference || shipmentId,
								shipmentReferences: current.shipmentReferences || current.shipmentReference || shipmentId,
							} : current);
							return true;
						}}
						onRefresh={async () => {
							await fetchManifests();
						}}
					/>
				)}
			</div>
		</AppShell>
	);
}

function ListView({
	manifests,
	filtered,
	stats,
	query,
	statusFilter,
	loading,
	actioning,
	onQueryChange,
	onStatusChange,
	onSelect,
	onNewIntake,
	onExport,
}: {
	manifests: ManifestRecord[];
	filtered: ManifestRecord[];
	stats: { total: number; validated: number; received: number; flagged: number };
	query: string;
	statusFilter: ManifestStatus | "all";
	loading: boolean;
	actioning: boolean;
	onQueryChange: (v: string) => void;
	onStatusChange: (v: ManifestStatus | "all") => void;
	onSelect: (m: ManifestRecord) => void;
	onNewIntake: () => void;
	onExport: () => void;
}) {
	return (
		<div
			className="space-y-5"
			style={{
				animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Pre-advice and manifest intake
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Receive manifests via EDI, CSV/XLSX, or manual entry. Duplicates are
						detected and flagged automatically. Validated manifests feed the
						receiving workflow.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Download className="mr-1.5 size-4" /> Export log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewIntake}
					>
						<Plus className="mr-1.5 size-4" /> New intake
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total manifests"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={FileText}
				/>
				<Metric
					label="Validated"
					value={String(stats.validated)}
					detail="Ready for receiving"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Received"
					value={String(stats.received)}
					detail="Cargo arrived at gate"
					tone="info"
					icon={Container}
				/>
				<Metric
					label="Flagged"
					value={String(stats.flagged)}
					detail="Discrepancy or duplicate"
					tone={stats.flagged > 0 ? "critical" : "success"}
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => onQueryChange(e.target.value)}
							placeholder="Search by manifest ref, BL, vessel, consignee, or agent..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => onStatusChange(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center p-12">
						<Loader2 className="size-6 animate-spin text-orange" />
						<span className="ml-3 text-sm text-ink-soft">Loading manifests…</span>
					</div>
				) : filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Ship className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No manifests match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different reference, vessel, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Manifest ref</th>
									<th className="px-4 py-3 font-medium">BL / vessel</th>
									<th className="px-4 py-3 font-medium">Consignee / agent</th>
									<th className="px-4 py-3 font-medium">Containers</th>
									<th className="px-4 py-3 font-medium">Weight</th>
									<th className="px-4 py-3 font-medium">ETA</th>
									<th className="px-4 py-3 font-medium">Source</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((m) => (
									<tr key={m.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5">
											<p className="font-mono text-xs font-semibold text-orange-deep">
												{m.manifestRef}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												Received {m.receivedAt}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] text-ink">{m.bl}</p>
											<p className="mt-0.5 text-[11px] text-ink-soft">{m.vessel}</p>
											<p className="text-[10px] text-ink-soft">{m.shippingLine}</p>
											{m.shipmentReferences && (
												<p className="mt-1 text-[10px] text-emerald-700">
													Shipment: {m.shipmentReferences}
												</p>
											)}
										</td>
										<td className="px-4 py-3.5">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-[12px] font-medium text-ink">
													{m.consignee}
												</p>
												{m.consigneeStatus === "unregistered" && (
													<span className="rounded bg-amber/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
														Not yet in TRÏNŪ
													</span>
												)}
											</div>
											<p className="mt-0.5 text-[11px] text-ink-soft">{m.agent}</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] text-ink">{m.containers}</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{m.packages} pkgs
											</p>
										</td>
										<td className="px-4 py-3.5 font-mono text-[12px] text-ink">
											{m.grossWeight}
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink">{m.eta}</p>
											<p className="mt-0.5 text-[10px] text-ink-soft">
												From {m.originPort}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
												{m.source}
											</span>
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={formatStatus(m.status)}
												tone={statusTone(m.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onSelect(m)}
												disabled={actioning}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												View <ArrowRight className="ml-1 size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {manifests.length} manifest records
					</span>
					<span>Duplicate detection active on all sources</span>
				</div>
			</section>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	submitting,
}: {
	onCancel: () => void;
	onSubmit: (m: ManifestRecord & { uploadToken?: string }) => Promise<boolean>;
	submitting: boolean;
}) {
	const [source, setSource] = useState<IntakeSource>("Manual");
	const [manifestRef, setManifestRef] = useState("");
	const [bl, setBl] = useState("");
	const [vessel, setVessel] = useState("");
	const [shippingLine, setShippingLine] = useState("");
	const [originPort, setOriginPort] = useState("");
	const [eta, setEta] = useState("");
	const [containers, setContainers] = useState("");
	const [containerNumbers, setContainerNumbers] = useState("");
	const [packages, setPackages] = useState("");
	const [grossWeight, setGrossWeight] = useState("");
	const [consignee, setConsignee] = useState<ConsigneeValue>(emptyConsignee);

	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadToken, setUploadToken] = useState<string | null>(null);
	const [uploadedName, setUploadedName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		setFile(f);
		setUploading(true);
		setUploadToken(null);
		setUploadedName(null);
		try {
			const formData = new FormData();
			formData.append("file", f);
			formData.append("source", source);

			const res = await http.post("operations/manifests/upload/", formData);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not parse the file.");
				return;
			}
			const payload: any = resp.code ?? {};
			setUploadToken(payload.upload_token ?? null);
			setUploadedName(f.name);

			const parsed = payload.parsed ?? {};
			if (parsed.manifestRef ?? parsed.manifest_ref) {
				setManifestRef(parsed.manifestRef ?? parsed.manifest_ref ?? "");
			}
			if (parsed.bl ?? parsed.bill_of_lading) {
				setBl(parsed.bl ?? parsed.bill_of_lading ?? "");
			}
			if (parsed.vessel) setVessel(parsed.vessel);
			if (parsed.shippingLine ?? parsed.shipping_line) {
				setShippingLine(parsed.shippingLine ?? parsed.shipping_line ?? "");
			}
			if (parsed.originPort ?? parsed.origin_port) {
				setOriginPort(parsed.originPort ?? parsed.origin_port ?? "");
			}
			if (parsed.eta) setEta(parsed.eta);
			if (parsed.containers != null) setContainers(String(parsed.containers));
			if (parsed.packages != null) setPackages(String(parsed.packages));
			if (parsed.grossWeight ?? parsed.gross_weight) {
				setGrossWeight(parsed.grossWeight ?? parsed.gross_weight ?? "");
			}

			toast.success("File parsed. Review the fields below before submitting.");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not upload the file."
			);
		} finally {
			setUploading(false);
		}
	};

	const clearFile = () => {
		setFile(null);
		setUploadToken(null);
		setUploadedName(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!manifestRef.trim() || !bl.trim()) {
			toast.error("Manifest reference and bill of lading are required.");
			return;
		}

		const consigneeName =
			consignee.type === "organisation"
				? consignee.organisationName.trim()
				: consignee.fullName.trim();

		if (!consigneeName) {
			toast.error("Consignee name is required.");
			return;
		}

		if (consignee.type === "organisation" && !consignee.organisationId) {
			if (!consignee.email.trim() && !consignee.phone.trim()) {
				toast.error(
					"This consignee is not yet in TRÏNŪ. Provide at least an email or phone number so we can follow up."
				);
				return;
			}
		}

		if (source !== "Manual" && !uploadToken) {
			toast.error("Upload the manifest file before submitting.");
			return;
		}

		const record: ManifestRecord & { uploadToken?: string } = {
			id: "",
			manifestRef: manifestRef.trim(),
			bl: bl.trim(),
			vessel: vessel.trim(),
			shippingLine: shippingLine.trim(),
			originPort: originPort.trim(),
			eta: eta.trim(),
			containers: Number(containers) || 0,
			packages: Number(packages) || 0,
			grossWeight: grossWeight.trim(),
			consignee: consigneeName,
			consigneeOrganisationId: consignee.organisationId,
			consigneeStatus: consignee.organisationId ? "linked" : "unregistered",
			consigneeEmail: consignee.email.trim() || null,
			consigneePhone: consignee.phone.trim() || null,
			consigneeAddress: consignee.address.trim() || null,
			agent: consignee.agentName,
			source,
			status: "Pre-advice",
			receivedAt: "",
			notes: "",
		};
		if (uploadToken) record.uploadToken = uploadToken;
		(record as any).containerNumbers = containerNumbers;
		(record as any).consigneeType = consignee.type;
		(record as any).agentId = consignee.agentId ?? "";

		await onSubmit(record);
	};

	const acceptMap: Record<Exclude<IntakeSource, "Manual">, string> = {
		EDI: ".edi,.txt",
		CSV: ".csv",
		XLSX: ".xlsx,.xls",
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-5 pb-24"
			style={{
				animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					disabled={submitting || uploading}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to manifests
				</Button>
			</div>

			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Terminal operations · Intake
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Add a new manifest
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Upload an EDI, CSV, or XLSX file and we'll parse the fields for
					you. Or enter the manifest manually. Duplicates are detected
					automatically before the manifest is accepted.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Intake source
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Select how this manifest arrived.
					</p>
				</div>
				<div className="p-5 sm:p-6">
					<div className="grid gap-2 sm:grid-cols-4">
						{(["EDI", "CSV", "XLSX", "Manual"] as IntakeSource[]).map((s) => {
							const active = source === s;
							return (
								<button
									key={s}
									type="button"
									disabled={submitting || uploading}
									onClick={() => {
										setSource(s);
										if (s === "Manual") clearFile();
									}}
									className={cn(
										"rounded-xl border p-3 text-center transition-colors disabled:opacity-60",
										active
											? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/30"
											: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									)}
								>
									<p className="font-mono text-[11px] font-semibold">{s}</p>
								</button>
							);
						})}
					</div>

					{source !== "Manual" && (
						<div className="mt-4 rounded-xl border border-dashed border-line bg-sand p-4">
							<div className="flex flex-wrap items-start gap-3">
								<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
									{uploading ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Upload className="size-4" />
									)}
								</div>
								<div className="min-w-[200px] flex-1">
									<p className="text-[13px] font-semibold text-ink">
										{uploadedName
											? `Uploaded: ${uploadedName}`
											: `Upload ${source} file`}
									</p>
									<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
										{uploading
											? "Parsing file and extracting fields…"
											: "We'll parse the file and pre-fill the fields below. Review them before submitting."}
									</p>
									{uploadedName && !uploading && (
										<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-teal-deep">
											Parsed successfully
										</p>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<input
										ref={fileInputRef}
										type="file"
										accept={acceptMap[source as Exclude<IntakeSource, "Manual">]}
										onChange={handleFileChange}
										disabled={submitting || uploading}
										className="hidden"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => fileInputRef.current?.click()}
										disabled={submitting || uploading}
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										<Upload className="mr-1.5 size-3.5" />
										{uploadedName ? "Replace file" : "Choose file"}
									</Button>
									{uploadedName && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={clearFile}
											disabled={submitting || uploading}
											className="text-ink-soft hover:text-coral"
										>
											<X className="size-3.5" />
										</Button>
									)}
								</div>
							</div>
							{file && !uploading && uploadToken && (
								<p className="mt-3 font-mono text-[10px] text-ink-soft">
									{file.name} · {(file.size / 1024).toFixed(1)} KB
								</p>
							)}
						</div>
					)}
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Manifest details
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Primary references from the carrier. Edit anything the parser got wrong.
					</p>
				</div>
				<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
					<Field
						label="Manifest reference"
						placeholder="MAN-2026-008721"
						value={manifestRef}
						onChange={setManifestRef}
						mono
						required
					/>
					<Field
						label="Bill of lading"
						placeholder="TRN-BL-2026-008721"
						value={bl}
						onChange={setBl}
						mono
						required
					/>
					<Field
						label="Vessel"
						placeholder="Maersk Voyager V.2604"
						value={vessel}
						onChange={setVessel}
					/>
					<Field
						label="Shipping line"
						placeholder="Maersk Line"
						value={shippingLine}
						onChange={setShippingLine}
					/>
					<Field
						label="Origin port"
						placeholder="Apapa Port"
						value={originPort}
						onChange={setOriginPort}
					/>
					<Field
						label="ETA at terminal"
						placeholder="06 Sep 2026 · 08:30"
						value={eta}
						onChange={setEta}
					/>
					<Field
						label="Containers"
						placeholder="4"
						value={containers}
						onChange={setContainers}
						mono
					/>
					<Field
						label="Packages"
						placeholder="220"
						value={packages}
						onChange={setPackages}
						mono
					/>
					<div className="sm:col-span-2">
						<label className="block">
							<span className={labelClass}>Container numbers (optional)</span>
							<textarea
								rows={3}
								value={containerNumbers}
								onChange={(e) => setContainerNumbers(e.target.value)}
								placeholder="One container per line, or separate with commas"
								className={textareaClass}
							/>
						</label>
						<p className="mt-1 text-[11px] text-ink-soft">
							Enter individual container numbers when available. Leave blank
							when the carrier manifest only provides a total.
						</p>
					</div>
					<div className="sm:col-span-2">
						<Field
							label="Gross weight"
							placeholder="72,860 kg"
							value={grossWeight}
							onChange={setGrossWeight}
							mono
						/>
					</div>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<ConsigneeDetails
						value={consignee}
						onChange={setConsignee}
						disabled={submitting}
						source="manifest"
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<div className="flex items-start gap-3">
						<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
						<div>
							<p className="text-[13px] font-semibold text-ink">
								Duplicate detection
							</p>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								If the manifest reference or bill of lading matches an existing
								record, the intake is flagged as a duplicate and marked for
								review rather than silently accepted.
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Manifest intake
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{manifestRef || "Reference pending"} · {source}
							{uploadedName ? ` · ${uploadedName}` : ""}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={submitting || uploading}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={submitting || uploading}
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							{submitting ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									Adding…
								</>
							) : (
								<>
									Add manifest
									<ArrowRight className="size-4" />
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

function ManifestDetailDialog({
	manifest,
	actioning,
	onClose,
	onValidate,
	onFlag,
	onMatch,
	onRefresh,
}: {
	manifest: ManifestRecord;
	actioning: boolean;
	onClose: () => void;
	onValidate: () => Promise<void>;
	onFlag: (reason: string, responsibleParty: "Organisation" | "Operations" | "") => Promise<boolean>;
	onMatch: (shipmentId: string, reason: string) => Promise<boolean>;
	onRefresh: () => Promise<void>;
}) {
	const [shipmentQuery, setShipmentQuery] = useState(manifest.bl);
	const [shipmentResults, setShipmentResults] = useState<any[]>([]);
	const [matchSuggestions, setMatchSuggestions] = useState<any[]>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [shipmentId, setShipmentId] = useState("");
	const [matchReason, setMatchReason] = useState("");
	const [searchingShipments, setSearchingShipments] = useState(false);
	const [matchingShipment, setMatchingShipment] = useState(false);
	const [flagDialogOpen, setFlagDialogOpen] = useState(false);
	const [flagReason, setFlagReason] = useState("");
	const [responsibleParty, setResponsibleParty] = useState<"" | "Organisation" | "Operations">("");
	const [submittingFlag, setSubmittingFlag] = useState(false);

	const [linkedShipment, setLinkedShipment] = useState<any>(null);
	const [loadingLinkedShipment, setLoadingLinkedShipment] = useState(false);
	const [linkedShipmentError, setLinkedShipmentError] = useState("");
	const [inviteEmail, setInviteEmail] = useState(manifest.consigneeEmail ?? "");
	const [inviting, setInviting] = useState(false);

	const isUnregistered = manifest.consigneeStatus === "unregistered";

	useEffect(() => {
		const q = shipmentQuery.trim();
		if (q.length < 2) {
			setShipmentResults([]);
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout(async () => {
			setSearchingShipments(true);
			try {
				const res = await http.post(`operations/manifests/shipments/`, {q});
				const resp: Resp = res.data;
				if (!cancelled)
					setShipmentResults(resp.error ? [] : extractList<any>(resp.code));
			} catch {
				if (!cancelled) setShipmentResults([]);
			} finally {
				if (!cancelled) setSearchingShipments(false);
			}
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [shipmentQuery]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoadingSuggestions(true);
			try {
				const res = await http.post("operations/manifests/suggestions/", { manifest_id: manifest.id });
				const resp: Resp = res.data;
				if (!cancelled) setMatchSuggestions(resp.error ? [] : extractList<any>((resp.code as any)?.suggestions ?? resp.code));
			} catch {
				if (!cancelled) setMatchSuggestions([]);
			} finally {
				if (!cancelled) setLoadingSuggestions(false);
			}
		})();
		return () => { cancelled = true; };
	}, [manifest.id]);

	const isShipmentLinked = Boolean(
		(manifest.shipmentReference && manifest.shipmentReference.trim()) ||
		(manifest.shipmentReferences && manifest.shipmentReferences.trim())
	);
	const canChangeLink = manifest.status === "Pre-advice";
	const correctionSubmitted = manifest.status === "Review required";
	const canValidate = isShipmentLinked && (canChangeLink || correctionSubmitted);
	const canFlag = isShipmentLinked && (canChangeLink || correctionSubmitted);

	useEffect(() => {
		let cancelled = false;
		if (!isShipmentLinked) {
			setLinkedShipment(null);
			setLinkedShipmentError("");
			return;
		}
		(async () => {
			setLoadingLinkedShipment(true);
			setLinkedShipmentError("");
			try {
				if (!manifest.matchedShipmentId) {
					throw new Error("The manifest is linked by reference, but the linked shipment ID was not returned. Include matched_shipment_id in the operations/manifests list response.");
				}
				const res = await http.get(`operations/shipments/review/details/${manifest.matchedShipmentId}/`);
				const resp: Resp = res.data;
				if (resp.error) throw new Error(String(resp.data || "Could not load linked shipment details."));
				if (!cancelled) setLinkedShipment((resp.code as any)?.shipment ?? resp.code ?? null);
			} catch (err: any) {
				if (!cancelled) setLinkedShipmentError(err?.response?.data?.data || err?.message || "Could not load linked shipment details.");
			} finally {
				if (!cancelled) setLoadingLinkedShipment(false);
			}
		})();
		return () => { cancelled = true; };
	}, [manifest.id, manifest.matchedShipmentId, manifest.shipmentReference, manifest.shipmentReferences, isShipmentLinked]);

	const handleSendInvite = async () => {
		if (!inviteEmail.trim()) {
			toast.error("Enter an email address to send the invite.");
			return;
		}
		setInviting(true);
		try {
			const res = await http.post("operations/manifests/invite-consignee/", {"manifest_id": manifest.id, "email": inviteEmail.trim()});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not send the invite.");
				return;
			}
			toast.success(`Onboarding invite sent to ${inviteEmail.trim()}.`);
			await onRefresh();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not send the invite."
			);
		} finally {
			setInviting(false);
		}
	};

	const handleCopyInviteLink = async () => {
		try {
			const res = await http.post("operations/manifests/invite-link/", {"manifest_id": manifest.id});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not generate invite link.");
				return;
			}
			const payload: any = resp.code ?? {};
			const link = payload.link ?? payload.url ?? "";
			if (!link) {
				toast.error("Invite link was empty.");
				return;
			}
			await navigator.clipboard.writeText(link);
			toast.success("Invite link copied to clipboard.");
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not generate invite link."
			);
		}
	};

	return (
		<div
			className="space-y-5 pb-24"
			style={{
				animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					variant="ghost"
					onClick={onClose}
					disabled={actioning}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to manifests
				</Button>
			</div>

			<div className="rounded-2xl bg-paper shadow-sm ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Manifest record
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{manifest.manifestRef}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							Received {manifest.receivedAt} via {manifest.source}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						disabled={actioning}
						aria-label="Close manifest details"
					>
						<X />
					</Button>
				</div>

				<div className="space-y-4 p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge
							label={manifest.status}
							tone={statusTone(manifest.status)}
						/>
						{correctionSubmitted && (
							<span className="rounded bg-teal/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-teal-deep ring-1 ring-teal/25">
								Organisation resubmitted · Review required
							</span>
						)}
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{manifest.source}
						</span>
						{manifest.status === "Duplicate" && (
							<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-coral">
								Duplicate detected
							</span>
						)}
						{isUnregistered && (
							<span className="rounded bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
								Consignee not yet in TRÏNŪ
							</span>
						)}
					</div>

					<div className={cn(
						"rounded-xl border p-4",
						isShipmentLinked
							? "border-teal/25 bg-teal/5"
							: "border-orange/30 bg-orange/5"
					)}>
						<div className="flex items-start gap-3">
							<span className={cn(
								"grid size-9 shrink-0 place-items-center rounded-lg",
								isShipmentLinked ? "bg-teal/10 text-teal-deep" : "bg-orange/10 text-orange-deep"
							)}>
								{isShipmentLinked ? <Check className="size-4" /> : <Info className="size-4" />}
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-ink">
									{isShipmentLinked ? "Shipment declaration linked" : "Step 1 of 2: Link a shipment declaration"}
								</p>
								<p className="mt-1 text-xs leading-5 text-ink-soft">
									{isShipmentLinked
										? `Linked shipment: ${manifest.shipmentReferences || manifest.shipmentReference}. You can now complete the checks and validate or flag this manifest if needed.`
										: "You must link this manifest to the correct shipment declaration before you can validate it or flag it for review. Choose a suggested match or search for a declaration below."
									}
								</p>
								{!isShipmentLinked && (
									<p className="mt-2 text-[11px] font-medium text-orange-deep">Validation and flagging are locked until a shipment is linked.</p>
								)}
							</div>
						</div>
					</div>

					{isShipmentLinked && (
						<section className="space-y-4 rounded-xl border border-teal/25 bg-paper p-4 sm:p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal-deep">Linked declaration</p>
									<h4 className="mt-1 text-base font-bold text-ink">{linkedShipment?.shipment_reference || manifest.shipmentReferences || manifest.shipmentReference}</h4>
									<p className="mt-1 text-xs text-ink-soft">Review declaration fields, container seals and uploaded documents before validating or flagging.</p>
								</div>
								{loadingLinkedShipment && <Loader2 className="size-4 animate-spin text-teal-deep" />}
							</div>
							{linkedShipmentError ? (
								<div className="rounded-lg border border-coral/20 bg-coral/5 p-3 text-xs text-coral">{linkedShipmentError} Ensure the operations linked-shipment details endpoint is configured.</div>
							) : loadingLinkedShipment && !linkedShipment ? (
								<p className="text-xs text-ink-soft">Loading shipment declaration, containers and documents…</p>
							) : linkedShipment ? (
								<>
									<dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{[["Organisation", linkedShipment.organisation_name || linkedShipment.organisation?.name], ["Shipment status", formatStatus(linkedShipment.status)], ["Bill of lading", linkedShipment.bill_of_lading || linkedShipment.bl], ["Booking reference", linkedShipment.booking_reference], ["Vessel / voyage", [linkedShipment.vessel_name || linkedShipment.vessel, linkedShipment.voyage_number || linkedShipment.voyage].filter(Boolean).join(" / ")], ["Shipping line", linkedShipment.shipping_line], ["Origin", linkedShipment.origin_port || linkedShipment.origin], ["Destination", linkedShipment.destination_port || linkedShipment.destination], ["Expected arrival", linkedShipment.expected_arrival || linkedShipment.eta], ["Consignee", linkedShipment.consignee_name || linkedShipment.consignee], ["Consignee email", linkedShipment.consignee_email], ["Consignee phone", linkedShipment.consignee_phone], ["Cargo description", linkedShipment.cargo_description], ["Packages", linkedShipment.package_count ?? linkedShipment.packages], ["Gross weight", linkedShipment.gross_weight], ["Volume", linkedShipment.volume], ["HS code", linkedShipment.hs_code], ["Customs reference", linkedShipment.customs_reference]].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "").map(([label, value]) => (
											<div key={String(label)} className="rounded-lg bg-sand/70 p-3"><dt className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</dt><dd className="mt-1 break-words text-xs font-medium text-ink">{String(value)}</dd></div>
										))}
									</dl>
									<div>
										<h5 className="mb-2 text-xs font-bold text-ink">Containers and seal numbers</h5>
										{(linkedShipment.containers || []).length ? <div className="overflow-x-auto rounded-lg border border-line"><table className="w-full text-left text-xs"><thead className="bg-sand text-ink-soft"><tr><th className="p-2.5">Container</th><th className="p-2.5">Size</th><th className="p-2.5">Seal no.</th><th className="p-2.5">Packages</th><th className="p-2.5">Gross weight</th></tr></thead><tbody>{linkedShipment.containers.map((c: any, i: number) => <tr key={c.id || c.container_no || i} className="border-t border-line"><td className="p-2.5 font-mono">{c.container_no || "—"}</td><td className="p-2.5">{c.size || c.container_size || "—"}</td><td className="p-2.5">{c.seal_no || "Not provided"}</td><td className="p-2.5">{c.package_count ?? "—"}</td><td className="p-2.5">{c.gross_weight ?? "—"}</td></tr>)}</tbody></table></div> : <p className="rounded-lg bg-sand p-3 text-xs text-ink-soft">No container rows were returned for this declaration.</p>}
									</div>
									<div>
										<h5 className="mb-2 text-xs font-bold text-ink">Uploaded documents</h5>
										{(linkedShipment.documents || []).length ? <div className="grid gap-2 sm:grid-cols-2">{linkedShipment.documents.map((doc: any, i: number) => <div key={doc.id || doc.file_path || i} className="flex items-start gap-3 rounded-lg border border-line p-3"><FileText className="mt-0.5 size-4 shrink-0 text-orange"/><div className="min-w-0 flex-1"><p className="break-words text-xs font-semibold text-ink">{doc.original_name || doc.document_type || `Document ${i + 1}`}</p><p className="mt-1 text-[10px] text-ink-soft">{doc.document_type || "Document"}{doc.file_size ? ` · ${Math.round(Number(doc.file_size) / 1024)} KB` : ""}{doc.uploaded_at ? ` · ${doc.uploaded_at}` : ""}</p>{(doc.url || doc.file_url || doc.file_path) && <a href={doc.url || doc.file_url || doc.file_path} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-teal-deep underline">Open document</a>}</div></div>)}</div> : <p className="rounded-lg bg-sand p-3 text-xs text-ink-soft">No documents were returned for this declaration.</p>}
									</div>
								</>
							) : null}
						</section>
					)}

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{manifest.notes || "No additional notes for this manifest."}</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Bill of lading", manifest.bl, true],
							["Vessel", manifest.vessel],
							["Shipping line", manifest.shippingLine],
							["Origin port", manifest.originPort],
							["ETA at terminal", manifest.eta, true],
							["Containers", String(manifest.containers), true],
							["Packages", String(manifest.packages), true],
							["Gross weight", manifest.grossWeight, true],
							["Consignee", manifest.consignee],
							["Licensed agent", manifest.agent],
						].map(([label, value, mono]) => (
							<div key={label as string}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-sm font-medium text-ink",
										mono && "font-mono"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>

					{isUnregistered && (
						<div className="rounded-xl border border-orange/25 bg-orange/5 p-4">
							<div className="flex items-start gap-3">
								<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div className="min-w-0">
									<p className="text-[13px] font-semibold text-ink">
										Consignee not yet in TRÏNŪ
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This consignee is recorded by the name on the
										manifest. You can continue with the shipment.
										Send them an onboarding invite so future
										shipments link automatically to their
										organisation account.
									</p>
									<div className="mt-3 space-y-3">
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Email
											</span>
											<Input
												type="email"
												value={inviteEmail}
												onChange={(e) =>
													setInviteEmail(e.target.value)
												}
												placeholder="consignee@example.com"
												className="mt-1.5 h-11 border-line bg-paper text-ink"
											/>
										</label>
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												onClick={handleSendInvite}
												disabled={inviting}
												className="bg-orange text-white hover:bg-orange-deep"
											>
												{inviting ? (
													<Loader2 className="mr-1.5 size-4 animate-spin" />
												) : (
													<Send className="mr-1.5 size-4" />
												)}
												Send onboarding invite
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={handleCopyInviteLink}
												className="border-line bg-paper text-ink hover:bg-sand"
											>
												<Mail className="mr-1.5 size-4" />
												Copy invite link
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{canChangeLink ? (
					<section className="space-y-3 rounded-xl bg-sand p-4 ring-1 ring-line">
						<div>
							<p className="text-[13px] font-semibold text-ink">
								Step 1 · Link shipment declaration
							</p>
							<p className="mt-1 text-[11px] leading-5 text-ink-soft">
								Select the declaration that belongs to this carrier manifest. Check the bill of lading and container numbers before confirming. A bill-of-lading mismatch requires an explanation.
							</p>
						</div>
						<div className="rounded-lg border border-teal/25 bg-teal/5 p-3">
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs font-semibold text-ink">Suggested shipment matches</p>
								{loadingSuggestions && <Loader2 className="size-3.5 animate-spin text-ink-soft" />}
							</div>
							<p className="mt-1 text-[11px] leading-5 text-ink-soft">Suggestions are based on exact bill-of-lading and saved container-number matches. Nothing is linked until an operations user confirms it.</p>
							{!loadingSuggestions && matchSuggestions.length === 0 && (
								<p className="mt-2 text-[11px] text-ink-soft">No exact bill-of-lading or container matches found. Search manually below.</p>
							)}
							{matchSuggestions.length > 0 && (
								<div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
									{matchSuggestions.map((s) => (
										<div key={s.id} className={cn("rounded-lg border p-3", shipmentId === s.id ? "border-orange bg-orange/10" : "border-line bg-paper")}>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="text-xs font-semibold text-ink">{s.shipment_reference || s.id}</p>
													<p className="mt-1 text-[11px] text-ink-soft">BL: {s.bill_of_lading || "—"} · {s.consignee || "No consignee"}</p>
													<p className="mt-1 text-[10px] text-ink-soft">{s.organisation_name || "No organisation"} · Score {s.match_score}%</p>
													<p className="mt-1 text-[10px] text-teal-deep">{Array.isArray(s.match_reasons) ? s.match_reasons.join(" · ") : "Potential match — verify details"}</p>
												</div>
												<Button type="button" variant="outline" className={cn("shrink-0", shipmentId === s.id && "border-orange bg-orange/10 text-ink")} onClick={() => { setShipmentId(s.id); setShipmentQuery(s.shipment_reference || s.bill_of_lading || ""); }}>
													{shipmentId === s.id ? "Selected" : "Review match"}
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						<input
							value={shipmentQuery}
							onChange={(e) => {
								setShipmentQuery(e.target.value);
								setShipmentId("");
							}}
							placeholder="Search by shipment reference, BL, consignee, vessel…"
							className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
						/>
						{searchingShipments && (
							<p className="text-xs text-ink-soft">Searching declarations…</p>
						)}
						{shipmentResults.length > 0 && (
							<div className="max-h-44 space-y-1 overflow-y-auto">
								{shipmentResults.map((s) => (
									<button
										key={s.id}
										type="button"
										onClick={() => setShipmentId(s.id)}
										className={cn(
											"w-full rounded-lg border p-3 text-left transition",
											shipmentId === s.id
												? "border-orange bg-orange/10"
												: "border-line bg-paper hover:bg-sand-2"
										)}
									>
										<p className="text-xs font-semibold text-ink">
											{s.shipment_reference || s.id}
										</p>
										<p className="mt-1 text-[11px] text-ink-soft">
											BL: {s.bill_of_lading || "—"} ·{" "}
											{s.consignee || "No consignee"}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{s.organisation_name || "No organisation"} ·{" "}
											{s.vessel_name || "No vessel"} · {s.status}
										</p>
									</button>
								))}
							</div>
						)}
						{shipmentQuery.trim().length >= 2 &&
							!searchingShipments &&
							shipmentResults.length === 0 && (
								<p className="text-xs text-ink-soft">
									No shipment declarations found.
								</p>
							)}
						{shipmentId &&
							shipmentResults.find((s) => s.id === shipmentId) &&
							shipmentResults
								.find((s) => s.id === shipmentId)
								.bill_of_lading?.trim()
								.toLowerCase() !== manifest.bl.trim().toLowerCase() && (
								<label className="block">
									<span className={labelClass}>
										Reason for BL mismatch{" "}
										<span className="text-coral">*</span>
									</span>
									<textarea
										rows={2}
										value={matchReason}
										onChange={(e) => setMatchReason(e.target.value)}
										className={textareaClass}
										placeholder="Explain why these records should be linked"
									/>
								</label>
							)}
						<div className="flex justify-end">
							<Button
								type="button"
								disabled={
									!shipmentId ||
									matchingShipment ||
									(shipmentResults.find((s) => s.id === shipmentId)
										?.bill_of_lading?.trim()
										.toLowerCase() !==
										manifest.bl.trim().toLowerCase() &&
										!matchReason.trim())
								}
								onClick={async () => {
									setMatchingShipment(true);
									try {
										const ok = await onMatch(
											shipmentId,
											matchReason.trim()
										);
										if (ok) {
											setShipmentId("");
											setMatchReason("");
										}
									} finally {
										setMatchingShipment(false);
									}
								}}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{matchingShipment ? (
									<Loader2 className="mr-1.5 size-4 animate-spin" />
								) : (
									<Check className="mr-1.5 size-4" />
								)}
								Link shipment
							</Button>
						</div>
					</section>
					) : (
						<section className="rounded-xl border border-line bg-sand p-4">
							<div className="flex items-start gap-3">
								<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink-soft">
									<ClipboardCheck className="size-4" />
								</span>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-ink">Shipment link is locked</p>
									<p className="mt-1 text-xs leading-5 text-ink-soft">
										{manifest.status === "Validated"
											? "This manifest has been validated. The linked shipment cannot be changed."
											: manifest.status === "Discrepancy"
												? "This manifest has been flagged for review. Resolve the issue through the authorised review process before changing the shipment link."
												: manifest.status === "Duplicate"
													? "This manifest is marked as a duplicate. The shipment link cannot be changed until the duplicate is resolved."
													: "This manifest has moved beyond the matching stage. The shipment link cannot be changed."}
									</p>
									{isShipmentLinked && (
										<p className="mt-2 text-xs font-semibold text-ink">
											Linked shipment: {manifest.shipmentReferences || manifest.shipmentReference}
										</p>
									)}
								</div>
							</div>
						</section>
					)}

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-start gap-3">
							<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									What validation does
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									Validation confirms the manifest fields are consistent, the
									shipping line reference is registered, and no duplicate
									exists. Validated manifests are available for the receiving
									workflow.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={actioning}
						className="text-ink-soft"
					>
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setFlagReason("");
								setResponsibleParty("");
								setFlagDialogOpen(true);
							}}
							disabled={!canFlag || actioning}
							className="border-line bg-paper text-coral hover:bg-coral/10"
							title={!isShipmentLinked ? "Link a shipment before flagging this manifest" : undefined}
						>
							{actioning ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <AlertTriangle className="mr-1.5 size-4" />}
							Flag for review
						</Button>
						<Button
							onClick={onValidate}
							disabled={!canValidate || actioning}
							className="bg-orange text-white hover:bg-orange-deep"
							title={!isShipmentLinked ? "Link a shipment before validating this manifest" : undefined}
						>
							{actioning ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
							Mark as validated
						</Button>
					</div>
				</div>
			</div>
			{flagDialogOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !submittingFlag && setFlagDialogOpen(false)}>
					<form
						className="w-full max-w-lg space-y-5 rounded-2xl bg-paper p-5 shadow-2xl ring-1 ring-line sm:p-6"
						onSubmit={async (e) => {
							e.preventDefault();
							if (flagReason.trim().length < 5) {
								toast.error("Enter a reason of at least 5 characters.");
								return;
							}
							setSubmittingFlag(true);
							try {
								const ok = await onFlag(flagReason.trim(), responsibleParty);
								if (ok) setFlagDialogOpen(false);
							} finally {
								setSubmittingFlag(false);
							}
						}}
					>
						<div className="flex items-start gap-3">
							<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral/10 text-coral"><AlertTriangle className="size-5" /></span>
							<div>
								<h3 className="font-display text-lg font-bold text-ink">Flag manifest for review</h3>
								<p className="mt-1 text-xs leading-5 text-ink-soft">Record the issue and, if known, identify who needs to act next.</p>
							</div>
							<Button type="button" variant="ghost" size="icon" aria-label="Close flag dialog" disabled={submittingFlag} onClick={() => setFlagDialogOpen(false)}><X className="size-4" /></Button>
						</div>
						<div className="rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">Manifest <span className="font-mono font-semibold text-ink">{manifest.manifestRef}</span></div>
						<label className="block">
							<span className={labelClass}>Reason for review <span className="text-coral">*</span></span>
							<textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} minLength={5} maxLength={2000} required rows={4} placeholder="Describe the discrepancy, missing information, or issue requiring follow-up…" className={textareaClass} />
							<span className="mt-1 block text-right text-[10px] text-ink-soft">{flagReason.length}/2000</span>
						</label>
						<fieldset className="space-y-2">
							<legend className={labelClass}>Who needs to act? <span className="normal-case tracking-normal">(optional)</span></legend>
							<div className="grid gap-2 sm:grid-cols-2">
								{(["Organisation", "Operations"] as const).map((party) => (
									<button key={party} type="button" onClick={() => setResponsibleParty(responsibleParty === party ? "" : party)} className={cn("rounded-lg border px-3 py-3 text-sm font-medium transition-colors", responsibleParty === party ? "border-orange bg-orange/10 text-orange-deep ring-1 ring-orange/30" : "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink")} aria-pressed={responsibleParty === party}>{party}</button>
								))}
							</div>
							{responsibleParty && <p className="text-xs text-ink-soft">Next action assigned to: <span className="font-semibold text-ink">{responsibleParty}</span></p>}
						</fieldset>
						<div className="flex justify-end gap-2 border-t border-line pt-4">
							<Button type="button" variant="outline" disabled={submittingFlag} onClick={() => setFlagDialogOpen(false)} className="border-line">Cancel</Button>
							<Button type="submit" disabled={submittingFlag || flagReason.trim().length < 5} className="bg-orange text-white hover:bg-orange-deep">{submittingFlag ? <><Loader2 className="mr-2 size-4 animate-spin" />Submitting…</> : <><AlertTriangle className="mr-2 size-4" />Confirm flag</>}</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

function ConsigneeDetails({
	value,
	onChange,
	disabled = false,
	source = "manual",
}: {
	value: ConsigneeValue;
	onChange: (next: ConsigneeValue) => void;
	disabled?: boolean;
	source?: "manifest" | "manual";
}) {
	const update = (patch: Partial<ConsigneeValue>) =>
		onChange({ ...value, ...patch });

	const isOrganisation = value.type === "organisation";
	const isUnregistered =
		isOrganisation && !value.organisationId && !!value.organisationName;

	return (
		<div className="space-y-5">
			<div>
				<h3 className="font-display text-sm font-bold text-ink">
					Consignee details
				</h3>
				<p className="mt-1 text-xs leading-5 text-ink-soft">
					Who is receiving the cargo. Used by Operations to verify the
					recipient and resolve discrepancies.
				</p>
			</div>

			<div>
				<p className={labelClass}>Consignee type</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{(
						[
							{ key: "organisation", label: "Organisation", icon: Building2 },
							{ key: "individual", label: "Individual", icon: User },
						] as const
					).map((option) => {
						const Icon = option.icon;
						const active = value.type === option.key;
						return (
							<label
								key={option.key}
								className={cn(
									"flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors",
									active
										? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/25"
										: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink",
									disabled && "cursor-not-allowed opacity-60"
								)}
							>
								<input
									type="radio"
									name="consignee-type"
									value={option.key}
									checked={active}
									disabled={disabled}
									onChange={() =>
										update({
											type: option.key,
											organisationId:
												option.key === "organisation"
													? value.organisationId
													: null,
											organisationName:
												option.key === "organisation"
													? value.organisationName
													: "",
										})
									}
									className="sr-only"
								/>
								<Icon className="size-3.5" />
								{option.label}
							</label>
						);
					})}
				</div>
			</div>

			{isOrganisation ? (
				<div>
					<p className={labelClass}>
						Organisation / company name
						<span className="text-coral"> *</span>
					</p>
					<OrgSearchPicker
						value={{
							id: value.organisationId,
							name: value.organisationName,
						}}
						onChange={(next) =>
							update({
								organisationId: next.id,
								organisationName: next.name,
								status: next.id ? "linked" : "unregistered",
							})
						}
						disabled={disabled}
					/>
					<p className="mt-2 text-[11px] leading-5 text-ink-soft">
						Start typing to search registered organisations. If the
						consignee isn't in TRÏNŪ yet, you can continue — we'll
						record them by the name on the manifest and follow up
						with an onboarding invite.
					</p>
				</div>
			) : (
				<label className="block">
					<span className={labelClass}>
						Full name
						<span className="text-coral"> *</span>
					</span>
					<Input
						required
						disabled={disabled}
						value={value.fullName}
						onChange={(e) => update({ fullName: e.target.value })}
						placeholder="Enter full name"
						className={cn(inputClass, disabled && "cursor-not-allowed opacity-60")}
					/>
				</label>
			)}

			{isUnregistered && (
				<div className="rounded-xl border border-orange/25 bg-orange/5 p-3.5">
					<div className="flex items-start gap-3">
						<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div className="min-w-0">
							<p className="text-[12px] font-semibold text-ink">
								This consignee is not yet in TRÏNŪ
							</p>
							<p className="mt-1 text-[11px] leading-5 text-ink-soft">
								We'll record them by the name you entered. Provide at
								least one contact method below so Operations can
								follow up and send an onboarding invite.
							</p>
						</div>
					</div>
				</div>
			)}

			{isOrganisation && (
				<label className="block">
					<span className={labelClass}>Contact person</span>
					<Input
						disabled={disabled}
						value={value.contactPerson}
						onChange={(e) => update({ contactPerson: e.target.value })}
						placeholder="Name of contact person"
						className={cn(inputClass, disabled && "cursor-not-allowed opacity-60")}
					/>
				</label>
			)}

			<div className="grid gap-5 sm:grid-cols-2">
				<label className="block">
					<span className={labelClass}>
						Email address
						{isUnregistered && <span className="text-coral"> ·</span>}
					</span>
					<Input
						type="email"
						disabled={disabled}
						value={value.email}
						onChange={(e) => update({ email: e.target.value })}
						placeholder="contact@company.com"
						className={cn(inputClass, disabled && "cursor-not-allowed opacity-60")}
					/>
				</label>

				<label className="block">
					<span className={labelClass}>
						Phone number
						{isUnregistered && <span className="text-coral"> ·</span>}
					</span>
					<Input
						type="tel"
						disabled={disabled}
						value={value.phone}
						onChange={(e) => update({ phone: e.target.value })}
						placeholder="+234 …"
						className={cn(inputClass, disabled && "cursor-not-allowed opacity-60")}
					/>
				</label>
			</div>

			<label className="block">
				<span className={labelClass}>Address</span>
				<textarea
					rows={3}
					disabled={disabled}
					value={value.address}
					onChange={(e) => update({ address: e.target.value })}
					placeholder="Street address, city and state"
					className={cn(textareaClass, disabled && "cursor-not-allowed opacity-60")}
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Country</span>
				<Input
					disabled={disabled}
					value={value.country}
					onChange={(e) => update({ country: e.target.value })}
					placeholder="e.g. Nigeria"
					className={cn(inputClass, disabled && "cursor-not-allowed opacity-60")}
				/>
			</label>

			<div>
				<p className={labelClass}>Licensed agent</p>
				<AgentSearchPicker
					value={{
						id: value.agentId,
						name: value.agentName,
					}}
					onChange={(next) =>
						update({ agentId: next.id, agentName: next.name })
					}
					disabled={disabled}
				/>
				<p className="mt-2 text-[11px] leading-5 text-ink-soft">
					{value.agentId
						? "Linked to a verified TRÏNŪ agent record."
						: "Start typing to search licensed clearing agents."}
				</p>
			</div>

			{source === "manifest" && (
				<div className="flex items-start gap-3 rounded-xl border border-orange/25 bg-orange/5 p-3.5">
					<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[12px] font-semibold text-ink">
							Imported from the manifest
						</p>
						<p className="mt-1 text-[11px] leading-5 text-ink-soft">
							Consignee details from the carrier are treated as
							unverified until an operator confirms them. Existing
							verified contact details on a linked organisation
							will not be overwritten by this record.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

function useDebounced<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

function OrgSearchPicker({
	value,
	onChange,
	disabled = false,
}: {
	value: { id: string | null; name: string };
	onChange: (next: { id: string | null; name: string }) => void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<RegisteredOrganisation[]>([]);
	const [searching, setSearching] = useState(false);

	const debouncedQuery = useDebounced(query, 300);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		let cancelled = false;
		(async () => {
			setSearching(true);
			try {
				const res = await http.post(`operations/manifests/organisations/`, {q});
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setResults([]);
					return;
				}
				const list = extractList<any>(resp.code);
				setResults(
					list.map((o) => ({
						id: o.id,
						name: o.name ?? o.organisation_name ?? "—",
						rcNumber: o.rc_number ?? o.rcNumber,
						status: o.status ?? o.verification_status ?? "pending",
					}))
				);
			} catch {
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setSearching(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, open]);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const choose = (org: RegisteredOrganisation) => {
		onChange({ id: org.id, name: org.name });
		setOpen(false);
		setQuery("");
	};

	const clear = () => {
		onChange({ id: null, name: "" });
		setQuery("");
	};

	const typedName = query.trim();
	const canUseAsUnregistered = typedName.length >= 2 && !searching;

	const useAsUnregistered = () => {
		onChange({ id: null, name: typedName });
		setOpen(false);
		setQuery("");
	};

	return (
		<div ref={containerRef} className="relative mt-1.5">
			<div
				className={cn(
					"flex h-11 w-full items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink transition focus-within:ring-2 focus-within:ring-orange/30",
					disabled && "cursor-not-allowed opacity-60"
				)}
			>
				<Building2 className="size-3.5 shrink-0 text-ink-soft" />
				<input
					type="text"
					disabled={disabled}
					value={open ? query : value.name}
					placeholder={
						value.name
							? value.name
							: "Search registered organisations…"
					}
					onFocus={() => {
						if (disabled) return;
						setOpen(true);
						setQuery("");
					}}
					onChange={(e) => setQuery(e.target.value)}
					className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
				/>
				{value.id && (
					<span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Linked
					</span>
				)}
				{value.name && !value.id && (
					<span className="rounded-full bg-amber/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Not yet in TRÏNŪ
					</span>
				)}
				{value.name && !disabled && (
					<button
						type="button"
						onClick={clear}
						className="grid size-5 shrink-0 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
						aria-label="Clear organisation"
					>
						<X className="size-3" />
					</button>
				)}
				{searching ? (
					<Loader2 className="size-3.5 shrink-0 animate-spin text-ink-soft" />
				) : (
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-ink-soft transition-transform",
							open && "rotate-180"
						)}
					/>
				)}
			</div>

			{open && (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
					<div className="max-h-72 overflow-y-auto p-1">
						{query.trim().length < 2 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								Type at least 2 characters to search registered
								organisations.
							</div>
						) : searching ? (
							<div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
								<Loader2 className="size-3.5 animate-spin" />
								Searching…
							</div>
						) : (
							<>
								{results.map((org) => {
									const active = org.id === value.id;
									return (
										<button
											key={org.id}
											type="button"
											onClick={() => choose(org)}
											className={cn(
												"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
												active
													? "bg-orange/10 ring-1 ring-orange/25"
													: "hover:bg-sand"
											)}
										>
											<span
												className={cn(
													"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
													active
														? "bg-orange text-white"
														: "bg-sand text-ink-soft ring-1 ring-line"
												)}
											>
												{active ? (
													<Check className="size-4" />
												) : (
													<Building2 className="size-4" />
												)}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-[13px] font-semibold text-ink">
													{org.name}
												</span>
												{org.rcNumber && (
													<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														{org.rcNumber}
													</span>
												)}
											</span>
											{org.status === "verified" && (
												<span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-teal-deep ring-1 ring-teal/25">
													Verified
												</span>
											)}
										</button>
									);
								})}

								{results.length === 0 && (
									<div className="px-3 py-4 text-center text-[12px] text-ink-soft">
										No registered organisation matches.
									</div>
								)}

								{canUseAsUnregistered && (
									<button
										type="button"
										onClick={useAsUnregistered}
										className="cursor-pointer mt-1 flex w-full items-start gap-3 rounded-lg bg-orange/5 px-3 py-3 text-left transition-colors ring-1 ring-orange/20 hover:bg-orange/10"
									>
										<span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-orange text-white">
											<Plus className="size-4" />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-[13px] font-semibold text-ink">
												Use "{typedName}" as an unregistered
												consignee
											</span>
											<span className="mt-1 block text-[11px] leading-5 text-ink-soft">
												We'll record them by the name on the
												manifest. You can send an onboarding
												invite after the manifest is added.
											</span>
										</span>
									</button>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function AgentSearchPicker({
	value,
	onChange,
	disabled = false,
}: {
	value: { id: string | null; name: string };
	onChange: (next: { id: string | null; name: string }) => void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<RegisteredAgent[]>([]);
	const [searching, setSearching] = useState(false);

	const debouncedQuery = useDebounced(query, 300);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const q = debouncedQuery.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		let cancelled = false;
		(async () => {
			setSearching(true);
			try {
				const res = await http.post(`operations/manifests/agents/`, {q});
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setResults([]);
					return;
				}
				const list = extractList<any>(resp.code);
				setResults(
					list.map((a) => ({
						id: a.id,
						name: a.name ?? "—",
						licenceNumber: a.licence_number ?? a.licenceNumber ?? "—",
						contactEmail: a.contact_email ?? a.contactEmail,
						contactPhone: a.contact_phone ?? a.contactPhone,
					}))
				);
			} catch {
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setSearching(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [debouncedQuery, open]);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	const choose = (agent: RegisteredAgent) => {
		onChange({ id: agent.id, name: agent.name });
		setOpen(false);
		setQuery("");
	};

	const clear = () => {
		onChange({ id: null, name: "" });
		setQuery("");
	};

	return (
		<div ref={containerRef} className="relative mt-1.5">
			<div
				className={cn(
					"flex h-11 w-full items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink transition focus-within:ring-2 focus-within:ring-orange/30",
					disabled && "cursor-not-allowed opacity-60"
				)}
			>
				<User className="size-3.5 shrink-0 text-ink-soft" />
				<input
					type="text"
					disabled={disabled}
					value={open ? query : value.name}
					placeholder={
						value.name ? value.name : "Search licensed agents…"
					}
					onFocus={() => {
						if (disabled) return;
						setOpen(true);
						setQuery("");
					}}
					onChange={(e) => setQuery(e.target.value)}
					className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/70"
				/>
				{value.id && (
					<span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-deep ring-1 ring-orange/25">
						Linked
					</span>
				)}
				{value.name && !disabled && (
					<button
						type="button"
						onClick={clear}
						className="grid size-5 shrink-0 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
						aria-label="Clear agent"
					>
						<X className="size-3" />
					</button>
				)}
				{searching ? (
					<Loader2 className="size-3.5 shrink-0 animate-spin text-ink-soft" />
				) : (
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-ink-soft transition-transform",
							open && "rotate-180"
						)}
					/>
				)}
			</div>

			{open && (
				<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
					<div className="max-h-64 overflow-y-auto p-1">
						{query.trim().length < 2 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								Type at least 2 characters to search licensed
								agents.
							</div>
						) : searching ? (
							<div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
								<Loader2 className="size-3.5 animate-spin" />
								Searching…
							</div>
						) : results.length === 0 ? (
							<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
								No licensed agent matches that search.
							</div>
						) : (
							results.map((agent) => {
								const active = agent.id === value.id;
								return (
									<button
										key={agent.id}
										type="button"
										onClick={() => choose(agent)}
										className={cn(
											"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
											active ? "bg-orange/10 ring-1 ring-orange/25" : "hover:bg-sand"
										)}
									>
										<span
											className={cn(
												"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
												active
													? "bg-orange text-white"
													: "bg-sand text-ink-soft ring-1 ring-line"
											)}
										>
											{active ? (
												<Check className="size-4" />
											) : (
												<User className="size-4" />
											)}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-[13px] font-semibold text-ink">
												{agent.name}
											</span>
											<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												{agent.licenceNumber}
											</span>
											{(agent.contactEmail || agent.contactPhone) && (
												<span className="mt-1 block truncate text-[11px] text-ink-soft">
													{agent.contactEmail} · {agent.contactPhone}
												</span>
											)}
										</span>
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className={labelClass}>
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}