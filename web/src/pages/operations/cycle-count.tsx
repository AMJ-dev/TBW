import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Calendar,
	Check,
	ChevronLeft,
	ClipboardCheck,
	Download,
	Filter,
	History,
	Package,
	Play,
	Plus,
	RefreshCw,
	Search,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CountStatus =
	| "Scheduled"
	| "In progress"
	| "Awaiting approval"
	| "Completed"
	| "Cancelled";

interface StockLine {
	id: string;
	sku: string;
	description: string;
	location: string;
	systemQty: number;
	unit: string;
	countedQty: number | null;
	notes: string;
}

interface CycleCount {
	id: string;
	reference: string;
	scope: "Aisle A" | "Aisle B" | "Aisle C" | "Aisle D" | "Cold Bay" | "Heavy Bay" | "Full warehouse";
	scheduledFor: string;
	assignedTo: string;
	startedAt: string;
	completedAt: string;
	status: CountStatus;
	progress: number;
	totalLines: number;
	countedLines: number;
	varianceCount: number;
	approvedBy?: string;
	notes: string;
	lines: StockLine[];
}

const buildLines = (
	prefix: string,
	aisle: string,
	entries: { sku: string; desc: string; bin: string; qty: number; unit?: string }[]
): StockLine[] =>
	entries.map((e, i) => ({
		id: `${prefix}-${i + 1}`,
		sku: e.sku,
		description: e.desc,
		location: `${aisle} · ${e.bin}`,
		systemQty: e.qty,
		unit: e.unit ?? "units",
		countedQty: null,
		notes: "",
	}));

const initialCounts: CycleCount[] = [
	{
		id: "cc-1",
		reference: "TRN-CC-2026-00412",
		scope: "Aisle A",
		scheduledFor: "24 Sep 2026",
		assignedTo: "S. Eze · Yard officer",
		startedAt: "24 Sep 2026 · 09:15",
		completedAt: "—",
		status: "In progress",
		progress: 62,
		totalLines: 8,
		countedLines: 5,
		varianceCount: 0,
		notes: "Regular weekly cycle count for Aisle A.",
		lines: buildLines("a", "Aisle A", [
			{ sku: "TRN-SKU-9021", desc: "Telecommunications transceivers", bin: "Rack 03 · Bin 12", qty: 140, unit: "cartons" },
			{ sku: "TRN-SKU-9032", desc: "Fiber termination units", bin: "Rack 03 · Bin 14", qty: 220, unit: "cartons" },
			{ sku: "TRN-SKU-9044", desc: "Power modules", bin: "Rack 04 · Bin 02", qty: 60, unit: "cartons" },
			{ sku: "TRN-SKU-9056", desc: "Spare battery packs", bin: "Rack 04 · Bin 06", qty: 40, unit: "pallets" },
			{ sku: "TRN-SKU-9067", desc: "Cable kits", bin: "Rack 05 · Bin 01", qty: 300, unit: "cartons" },
			{ sku: "TRN-SKU-9078", desc: "Antenna assemblies", bin: "Rack 05 · Bin 08", qty: 28, unit: "crates" },
			{ sku: "TRN-SKU-9089", desc: "Mounting hardware", bin: "Rack 06 · Bin 03", qty: 480, unit: "bags" },
			{ sku: "TRN-SKU-9090", desc: "Weatherproofing kits", bin: "Rack 06 · Bin 09", qty: 120, unit: "cartons" },
		]),
	},
	{
		id: "cc-2",
		reference: "TRN-CC-2026-00413",
		scope: "Cold Bay",
		scheduledFor: "24 Sep 2026",
		assignedTo: "K. Lawal · Warehouse officer",
		startedAt: "—",
		completedAt: "—",
		status: "Scheduled",
		progress: 0,
		totalLines: 6,
		countedLines: 0,
		varianceCount: 0,
		notes: "Scheduled for afternoon window.",
		lines: buildLines("b", "Cold Bay", [
			{ sku: "TRN-SKU-9022", desc: "Pharmaceutical grade glucose", bin: "Rack 01 · Bin 04", qty: 320, unit: "bags" },
			{ sku: "TRN-SKU-9018", desc: "Vaccine cooling packs", bin: "Rack 01 · Bin 08", qty: 180, unit: "cartons" },
			{ sku: "TRN-SKU-9014", desc: "Temperature loggers", bin: "Rack 02 · Bin 01", qty: 40, unit: "boxes" },
			{ sku: "TRN-SKU-9011", desc: "Insulated liners", bin: "Rack 02 · Bin 04", qty: 60, unit: "rolls" },
			{ sku: "TRN-SKU-9008", desc: "Cold chain packaging kits", bin: "Rack 03 · Bin 02", qty: 220, unit: "cartons" },
			{ sku: "TRN-SKU-9006", desc: "Gel ice refills", bin: "Rack 03 · Bin 05", qty: 480, unit: "packs" },
		]),
	},
	{
		id: "cc-3",
		reference: "TRN-CC-2026-00411",
		scope: "Heavy Bay",
		scheduledFor: "22 Sep 2026",
		assignedTo: "M. Danjuma · Yard officer",
		startedAt: "22 Sep 2026 · 10:00",
		completedAt: "22 Sep 2026 · 12:30",
		status: "Awaiting approval",
		progress: 100,
		totalLines: 5,
		countedLines: 5,
		varianceCount: 1,
		notes: "One variance flagged. Awaiting supervisor review.",
		lines: buildLines("c", "Heavy Bay", [
			{ sku: "TRN-SKU-9023", desc: "Heavy generator spares", bin: "Floor Area 02", qty: 14, unit: "crates" },
			{ sku: "TRN-SKU-9019", desc: "Industrial pumps", bin: "Floor Area 03", qty: 6, unit: "crates" },
			{ sku: "TRN-SKU-9015", desc: "Motor assemblies", bin: "Floor Area 04", qty: 12, unit: "crates" },
			{ sku: "TRN-SKU-9012", desc: "Transformer units", bin: "Floor Area 05", qty: 8, unit: "crates" },
			{ sku: "TRN-SKU-9009", desc: "Steel plate bundles", bin: "Floor Area 06", qty: 24, unit: "bundles" },
		]),
	},
	{
		id: "cc-4",
		reference: "TRN-CC-2026-00409",
		scope: "Aisle B",
		scheduledFor: "18 Sep 2026",
		assignedTo: "S. Eze · Yard officer",
		startedAt: "18 Sep 2026 · 09:00",
		completedAt: "18 Sep 2026 · 10:45",
		status: "Completed",
		progress: 100,
		totalLines: 10,
		countedLines: 10,
		varianceCount: 0,
		approvedBy: "D. Okafor · Operations Manager",
		notes: "All counts matched. No variance.",
		lines: buildLines("d", "Aisle B", [
			{ sku: "TRN-SKU-9024", desc: "Solar inverter components", bin: "Rack 02 · Bin 08", qty: 85, unit: "pallets" },
			{ sku: "TRN-SKU-9030", desc: "Battery modules", bin: "Rack 02 · Bin 10", qty: 120, unit: "cartons" },
			{ sku: "TRN-SKU-9038", desc: "Wiring harnesses", bin: "Rack 03 · Bin 02", qty: 300, unit: "rolls" },
			{ sku: "TRN-SKU-9041", desc: "MC4 connectors", bin: "Rack 03 · Bin 05", qty: 800, unit: "packs" },
			{ sku: "TRN-SKU-9052", desc: "Mounting rails", bin: "Rack 04 · Bin 01", qty: 200, unit: "meters" },
			{ sku: "TRN-SKU-9061", desc: "Grounding kits", bin: "Rack 04 · Bin 04", qty: 150, unit: "packs" },
			{ sku: "TRN-SKU-9071", desc: "Combiner boxes", bin: "Rack 05 · Bin 02", qty: 40, unit: "units" },
			{ sku: "TRN-SKU-9080", desc: "Junction boxes", bin: "Rack 05 · Bin 06", qty: 100, unit: "units" },
			{ sku: "TRN-SKU-9088", desc: "Solar charge controllers", bin: "Rack 06 · Bin 01", qty: 60, unit: "units" },
			{ sku: "TRN-SKU-9095", desc: "Fuse protectors", bin: "Rack 06 · Bin 04", qty: 500, unit: "packs" },
		]),
	},
];

const scopeOptions: CycleCount["scope"][] = [
	"Aisle A",
	"Aisle B",
	"Aisle C",
	"Aisle D",
	"Cold Bay",
	"Heavy Bay",
	"Full warehouse",
];

const statusFilters: (CountStatus | "all")[] = [
	"all",
	"Scheduled",
	"In progress",
	"Awaiting approval",
	"Completed",
	"Cancelled",
];

export default function OperationsCycleCountRoute() {
	const [counts, setCounts] = useState<CycleCount[]>(initialCounts);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<CountStatus | "all">("all");
	const [selected, setSelected] = useState<CycleCount | null>(null);
	const [isScheduleOpen, setIsScheduleOpen] = useState(false);

	const filtered = useMemo(() => {
		return counts.filter((c) => {
			const matchQuery =
				c.reference.toLowerCase().includes(query.toLowerCase()) ||
				c.scope.toLowerCase().includes(query.toLowerCase()) ||
				c.assignedTo.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || c.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [counts, query, statusFilter]);

	const stats = useMemo(() => {
		const total = counts.length;
		const inProgress = counts.filter((c) => c.status === "In progress").length;
		const awaiting = counts.filter((c) => c.status === "Awaiting approval").length;
		const variances = counts.reduce((sum, c) => sum + c.varianceCount, 0);
		return { total, inProgress, awaiting, variances };
	}, [counts]);

	const handleSchedule = (next: CycleCount) => {
		setCounts((prev) => [next, ...prev]);
		setIsScheduleOpen(false);
		toast.success("Cycle count scheduled locally.");
	};

	const handleStart = (id: string) => {
		setCounts((prev) =>
			prev.map((c) =>
				c.id === id
					? {
							...c,
							status: "In progress" as CountStatus,
							startedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: c
			)
		);
		toast.success("Cycle count started.");
	};

	const handleApprove = (id: string) => {
		setCounts((prev) =>
			prev.map((c) =>
				c.id === id
					? {
							...c,
							status: "Completed" as CountStatus,
							approvedBy: "D. Okafor · Operations Manager",
							completedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: c
			)
		);
		toast.success("Cycle count approved and completed.");
		setSelected(null);
	};

	return (
		<AppShell title="Cycle counts" eyebrow="Operations · Inventory">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Stock-take
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Cycle count workflow
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Schedule, run, and approve cycle counts across aisles, cold bays, and heavy
						bays. Variances require supervisor approval before stock figures are adjusted.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Cycle count history exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export history
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsScheduleOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> Schedule count
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total counts"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="In progress"
					value={String(stats.inProgress)}
					detail="Currently on the floor"
					tone="info"
					icon={Play}
				/>
				<Metric
					label="Awaiting approval"
					value={String(stats.awaiting)}
					detail="Supervisor review pending"
					tone={stats.awaiting > 0 ? "warning" : "success"}
					icon={User}
				/>
				<Metric
					label="Variances flagged"
					value={String(stats.variances)}
					detail="Across all counts"
					tone={stats.variances > 0 ? "critical" : "success"}
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
							placeholder="Search by reference, scope, or assignee..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
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

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<ClipboardCheck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No cycle counts match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different scope, reference, or status.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((c) => (
							<li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
								<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
									<ClipboardCheck className="size-5" />
								</div>

								<div className="min-w-[220px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-mono text-[12px] font-semibold text-ink">
											{c.reference}
										</p>
										<StatusBadge label={c.status} tone={statusTone(c.status)} />
										{c.varianceCount > 0 && (
											<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
												{c.varianceCount} variance{c.varianceCount > 1 ? "s" : ""}
											</span>
										)}
									</div>
									<p className="mt-1 text-[12px] text-ink-soft">
										<span className="font-semibold text-ink">{c.scope}</span> ·{" "}
										{c.assignedTo}
									</p>
									<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Scheduled {c.scheduledFor}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Progress
									</p>
									<div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-sand-2">
										<div
											className="h-full rounded-full bg-orange transition-[width] duration-300"
											style={{ width: `${c.progress}%` }}
										/>
									</div>
									<p className="mt-1.5 font-mono text-[10px] text-ink-soft">
										{c.countedLines} of {c.totalLines} lines · {c.progress}%
									</p>
								</div>

								<div className="min-w-[160px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Timeline
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">
										Started {c.startedAt}
									</p>
									<p className="mt-0.5 text-[11px] text-ink-soft">
										{c.completedAt !== "—" ? `Completed ${c.completedAt}` : "—"}
									</p>
									{c.approvedBy && (
										<p className="mt-0.5 font-mono text-[10px] text-teal-deep">
											Approved by {c.approvedBy}
										</p>
									)}
								</div>

								<div className="ml-auto flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelected(c)}
										className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
									>
										View <ArrowRight className="ml-1 size-3.5" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {counts.length} cycle count records
					</span>
					<span>Variances require supervisor approval</span>
				</div>
			</section>

			{selected && (
				<CycleCountDetailDialog
					count={selected}
					onClose={() => setSelected(null)}
					onStart={() => {
						handleStart(selected.id);
						setSelected(null);
					}}
					onApprove={() => handleApprove(selected.id)}
				/>
			)}

			{isScheduleOpen && (
				<ScheduleModal
					onClose={() => setIsScheduleOpen(false)}
					onSubmit={handleSchedule}
					existingReferences={counts.map((c) => c.reference)}
				/>
			)}
		</AppShell>
	);
}

function CycleCountDetailDialog({
	count,
	onClose,
	onStart,
	onApprove,
}: {
	count: CycleCount;
	onClose: () => void;
	onStart: () => void;
	onApprove: () => void;
}) {
	const canStart = count.status === "Scheduled";
	const canApprove = count.status === "Awaiting approval";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Cycle count
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">{count.reference}</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							{count.scope} · Scheduled {count.scheduledFor}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge label={count.status} tone={statusTone(count.status)} />
						{count.varianceCount > 0 && (
							<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-coral">
								{count.varianceCount} variance{count.varianceCount > 1 ? "s" : ""} flagged
							</span>
						)}
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Assigned to
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">{count.assignedTo}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Started
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{count.startedAt}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Completed
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{count.completedAt}</p>
						</div>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{count.notes}</p>
					</div>

					<div>
						<div className="mb-2 flex items-center justify-between">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Stock lines · {count.totalLines} total
							</p>
							<p className="font-mono text-[10px] text-ink-soft">
								{count.countedLines} counted · {count.progress}%
							</p>
						</div>
						<div className="overflow-hidden rounded-xl ring-1 ring-line">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/60 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										<th className="px-3 py-2 font-medium">SKU</th>
										<th className="px-3 py-2 font-medium">Location</th>
										<th className="px-3 py-2 font-medium text-right">System</th>
										<th className="px-3 py-2 font-medium text-right">Counted</th>
										<th className="px-3 py-2 font-medium text-right">Delta</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{count.lines.map((l) => {
										const counted = l.countedQty;
										const delta = counted === null ? null : counted - l.systemQty;
										return (
											<tr key={l.id} className="hover:bg-sand/40">
												<td className="px-3 py-2.5">
													<p className="font-mono text-[11px] font-semibold text-ink">
														{l.sku}
													</p>
													<p className="mt-0.5 text-[10px] text-ink-soft">
														{l.description}
													</p>
												</td>
												<td className="px-3 py-2.5 font-mono text-[11px] text-ink-soft">
													{l.location}
												</td>
												<td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink">
													{l.systemQty} {l.unit}
												</td>
												<td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink">
													{counted === null ? "—" : `${counted} ${l.unit}`}
												</td>
												<td className="px-3 py-2.5 text-right font-mono text-[11px]">
													{delta === null ? (
														<span className="text-ink-soft">—</span>
													) : delta === 0 ? (
														<span className="text-teal-deep">Match</span>
													) : (
														<span className="text-coral">
															{delta > 0 ? "+" : ""}
															{delta}
														</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{count.approvedBy && (
						<div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20">
							<div className="flex items-start gap-3">
								<Check className="mt-0.5 size-4 shrink-0 text-teal-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Approved and completed
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Approved by {count.approvedBy} on {count.completedAt}. Any
										variance adjustments have been applied to the stock figures.
									</p>
								</div>
							</div>
						</div>
					)}

					{count.status === "Awaiting approval" && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Supervisor review required
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This cycle count includes a variance. Approving confirms the
										counted figures and adjusts the bonded stock record.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						{canStart && (
							<Button
								onClick={onStart}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Play className="mr-1.5 size-4" /> Start count
							</Button>
						)}
						{canApprove && (
							<Button
								onClick={onApprove}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Approve & complete
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ScheduleModal({
	onClose,
	onSubmit,
	existingReferences,
}: {
	onClose: () => void;
	onSubmit: (c: CycleCount) => void;
	existingReferences: string[];
}) {
	const [scope, setScope] = useState<CycleCount["scope"]>("Aisle A");
	const [scheduledFor, setScheduledFor] = useState(
		new Date().toISOString().slice(0, 10)
	);
	const [assignedTo, setAssignedTo] = useState("");
	const [totalLines, setTotalLines] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!assignedTo.trim()) {
			toast.error("Assign a count to a user.");
			return;
		}

		const nextNumber = String(
			Math.max(
				...existingReferences
					.map((r) => parseInt(r.split("-").pop() ?? "0", 10))
					.filter((n) => !isNaN(n)),
				0
			) + 1
		).padStart(5, "0");

		const lines = Number(totalLines) || 6;
		onSubmit({
			id: `cc-${Date.now()}`,
			reference: `TRN-CC-2026-${nextNumber}`,
			scope,
			scheduledFor,
			assignedTo,
			startedAt: "—",
			completedAt: "—",
			status: "Scheduled",
			progress: 0,
			totalLines: lines,
			countedLines: 0,
			varianceCount: 0,
			notes: notes || `Scheduled cycle count for ${scope}.`,
			lines: Array.from({ length: lines }).map((_, i) => ({
				id: `new-${i + 1}`,
				sku: "—",
				description: "Awaiting count",
				location: scope,
				systemQty: 0,
				unit: "units",
				countedQty: null,
				notes: "",
			})),
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Schedule cycle count
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								New cycle count
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Counts can be scoped to a single aisle, bay, or the full warehouse.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Scope
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								{scopeOptions.map((s) => {
									const active = scope === s;
									return (
										<button
											key={s}
											type="button"
											onClick={() => setScope(s)}
											className={cn(
												"rounded-xl border p-3 text-left text-[12px] font-medium transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30 text-orange-deep"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
										>
											{s}
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Scheduled for"
								placeholder="2026-09-24"
								value={scheduledFor}
								onChange={setScheduledFor}
								type="date"
								required
							/>
							<Field
								label="Assign to"
								placeholder="e.g. S. Eze · Yard officer"
								value={assignedTo}
								onChange={setAssignedTo}
								required
							/>
						</div>

						<Field
							label="Estimated lines (optional)"
							placeholder="e.g. 8"
							value={totalLines}
							onChange={setTotalLines}
							mono
						/>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Anything the assigned officer should know."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<History className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										How cycle counts work
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										The assigned officer records physical counts against each stock
										line. Variances require supervisor approval before the bonded
										stock figures are adjusted.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Schedule count <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
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
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
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