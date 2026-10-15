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
	| "Validated"
	| "Received"
	| "Discrepancy"
	| "Duplicate";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

type ConsigneeType = "organisation" | "individual";

type ConsigneeStatus = "linked" | "unregistered";

type View = "list" | "intake";

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
	"Validated",
	"Received",
	"Discrepancy",
	"Duplicate",
];

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
					status: (m.status ?? "Pre-advice") as ManifestStatus,
					receivedAt: m.received_at ?? m.receivedAt ?? "—",
					notes: m.notes ?? "",
					shipmentReference: m.shipment_reference ?? "",
					shipmentReferences: m.shipment_reference ?? m.shipment_bill_of_lading ?? "",
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

	const handleFlag = async (id: string) => {
		setActioning(true);
		try {
			const res = await http.post(`operations/manifests/flag/${id}/`);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not flag the manifest.");
				return;
			}
			toast.success("Manifest flagged for review.");
			await fetchManifests();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message || "Could not flag the manifest."
			);
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
			<div className="overflow-hidden">
				{view === "list" ? (
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
						onSelect={setSelected}
						onNewIntake={() => setView("intake")}
						onExport={handleExport}
					/>
				) : (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleIntake}
						submitting={submitting}
					/>
				)}
			</div>

			{selected && (
				<ManifestDetailDialog
					manifest={selected}
					actioning={actioning}
					onClose={() => setSelected(null)}
					onValidate={async () => {
						await handleValidate(selected.id);
						setSelected(null);
					}}
					onFlag={async () => {
						await handleFlag(selected.id);
						setSelected(null);
					}}
					onMatch={async (shipmentId, reason) => {
						const res = await http.post(`operations/manifests/match/`, {"manifest_id": selected.id, "shipment_id": shipmentId, "reason": reason});
						const resp: Resp = res.data;
						if (resp.error) {
							toast.error(resp.data || "Could not link shipment declaration.");
							return false;
						}
						toast.success(resp.data || "Shipment declaration linked.");
						await fetchManifests();
						setSelected(null);
						return true;
					}}
					onRefresh={async () => {
						await fetchManifests();
					}}
				/>
			)}
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
			<style>{`
				@keyframes slideInFromRight {
					from { opacity: 0; transform: translateX(24px); }
					to { opacity: 1; transform: translateX(0); }
				}
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

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
												label={m.status}
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
			<style>{`
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

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
	onFlag: () => Promise<void>;
	onMatch: (shipmentId: string, reason: string) => Promise<boolean>;
	onRefresh: () => Promise<void>;
}) {
	const [shipmentQuery, setShipmentQuery] = useState(manifest.bl);
	const [shipmentResults, setShipmentResults] = useState<any[]>([]);
	const [shipmentId, setShipmentId] = useState("");
	const [matchReason, setMatchReason] = useState("");
	const [searchingShipments, setSearchingShipments] = useState(false);
	const [matchingShipment, setMatchingShipment] = useState(false);

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

	const canValidate = manifest.status === "Pre-advice";
	const canFlag =
		manifest.status !== "Discrepancy" && manifest.status !== "Duplicate";

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
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
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
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge
							label={manifest.status}
							tone={statusTone(manifest.status)}
						/>
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

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{manifest.notes}</p>
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

					<section className="space-y-3 rounded-xl bg-sand p-4 ring-1 ring-line">
						<div>
							<p className="text-[13px] font-semibold text-ink">
								Shipment declaration matching
							</p>
							<p className="mt-1 text-[11px] leading-5 text-ink-soft">
								Search portal shipment declarations and link the correct
								record. A bill-of-lading mismatch requires an explanation.
							</p>
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
						{canFlag && (
							<Button
								variant="outline"
								onClick={onFlag}
								disabled={actioning}
								className="border-line bg-paper text-coral hover:bg-coral/10"
							>
								{actioning ? (
									<Loader2 className="mr-1.5 size-4 animate-spin" />
								) : (
									<AlertTriangle className="mr-1.5 size-4" />
								)}
								Flag for review
							</Button>
						)}
						{canValidate && (
							<Button
								onClick={onValidate}
								disabled={actioning}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{actioning ? (
									<Loader2 className="mr-1.5 size-4 animate-spin" />
								) : (
									<Check className="mr-1.5 size-4" />
								)}
								Mark as validated
							</Button>
						)}
					</div>
				</div>
			</div>
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