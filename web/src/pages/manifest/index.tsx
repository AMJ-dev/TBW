import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	Container,
	Download,
	FileText,
	Loader2,
	Plus,
	Search,
	Ship,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/functions"

type ManifestStatus =
	| "Pre-advice"
	| "Review required"
	| "Validated"
	| "Received"
	| "Discrepancy"
	| "Duplicate";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

type ConsigneeStatus = "linked" | "unregistered";

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
	consigneeStatus?: ConsigneeStatus;
	agent: string;
	source: IntakeSource;
	status: ManifestStatus;
	receivedAt: string;
	notes: string;
	shipmentReference?: string;
	shipmentReferences?: string;
	matchedShipmentId?: string | null;
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
`;

export default function OperationsManifestRoute() {
	const navigate = useNavigate();
	const [manifests, setManifests] = useState<ManifestRecord[]>([]);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ManifestStatus | "all">("all");
	const [loading, setLoading] = useState(true);

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
					consigneeStatus: (m.consignee_status ?? "unregistered") as ConsigneeStatus,
					agent: m.agent ?? "—",
					source: (m.source ?? "Manual") as IntakeSource,
					status: (String(m.status ?? "Pre-advice").toLowerCase() === "review_required" ||
					String(m.status ?? "").toLowerCase() === "review required"
						? "Review required"
						: m.status ?? "Pre-advice") as ManifestStatus,
					receivedAt: m.received_at ?? m.receivedAt ?? "—",
					notes: m.notes ?? "",
					shipmentReference: m.shipment_reference ?? "",
					shipmentReferences:
						m.shipment_reference ?? m.shipment_bill_of_lading ?? "",
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
			a.download = `manifest-intake-${new Date().toISOString().slice(0, 10)}.csv`;
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
							onClick={handleExport}
						>
							<Download className="mr-1.5 size-4" /> Export log
						</Button>
						<Button
							className="bg-orange text-white hover:bg-orange-deep"
							onClick={() => navigate("/operations/manifests/intake")}
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
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search by manifest ref, BL, vessel, consignee, or agent..."
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{statusFilters.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setStatusFilter(s)}
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
												<p className="mt-0.5 text-[11px] text-ink-soft">
													{m.vessel}
												</p>
												<p className="text-[10px] text-ink-soft">
													{m.shippingLine}
												</p>
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
												<p className="mt-0.5 text-[11px] text-ink-soft">
													{m.agent}
												</p>
											</td>
											<td className="px-4 py-3.5">
												<p className="font-mono text-[12px] text-ink">
													{m.containers}
												</p>
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
												<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-soft">
													{m.source}
												</span>
											</td>
											<td className="px-4 py-3.5">
												<StatusBadge
													label={statusLabel(m.status)}
													tone={statusTone(m.status)}
												/>
											</td>
											<td className="px-4 py-3.5 text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														navigate(`/operations/manifest/details/${m.id}`)
													}
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
		</AppShell>
	);
}