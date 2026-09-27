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
	Container,
	Download,
	Filter,
	Layers,
	Package,
	Plus,
	Search,
	Sparkles,
	Truck,
	User,
	Users,
	Wrench,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WorkOrderKind = "Stuffing" | "Destuffing";
type WorkOrderStatus =
	| "Scheduled"
	| "In progress"
	| "Awaiting verification"
	| "Completed"
	| "Cancelled";

interface WorkOrderLine {
	id: string;
	description: string;
	systemQty: number;
	loadedQty: number | null;
	unit: string;
	notes: string;
}

interface WorkOrder {
	id: string;
	reference: string;
	kind: WorkOrderKind;
	status: WorkOrderStatus;
	container: string;
	containerRef: string;
	consignment: string;
	cargoOwner: string;
	location: string;
	scheduledFor: string;
	startedAt: string;
	completedAt: string;
	assignedTo: string;
	team: string;
	equipment: string;
	totalLines: number;
	completedLines: number;
	varianceCount: number;
	beforeWeight: string;
	afterWeight: string;
	notes: string;
	lines: WorkOrderLine[];
}

const buildLines = (
	prefix: string,
	entries: { desc: string; system: number; unit?: string }[]
): WorkOrderLine[] =>
	entries.map((e, i) => ({
		id: `${prefix}-${i + 1}`,
		description: e.desc,
		systemQty: e.system,
		loadedQty: null,
		unit: e.unit ?? "units",
		notes: "",
	}));

const initialWorkOrders: WorkOrder[] = [
	{
		id: "wo-1",
		reference: "TRN-WO-2026-00851",
		kind: "Stuffing",
		status: "In progress",
		container: "TRIU1234564",
		containerRef: "c-1",
		consignment: "TRN-EXP-002532",
		cargoOwner: "Atlantic Trade Nigeria Ltd",
		location: "Loading Bay 02",
		scheduledFor: "24 Sep 2026 · 10:00",
		startedAt: "24 Sep 2026 · 10:12",
		completedAt: "—",
		assignedTo: "S. Eze · Yard officer",
		team: "Stuffing team 01 · 4 people",
		equipment: "Forklift 04",
		totalLines: 6,
		completedLines: 4,
		varianceCount: 0,
		beforeWeight: "—",
		afterWeight: "—",
		notes: "Export consignment. All cartons palletised before loading.",
		lines: buildLines("a", [
			{ desc: "Telecommunications transceivers", system: 140, unit: "cartons" },
			{ desc: "Fiber termination units", system: 220, unit: "cartons" },
			{ desc: "Power modules", system: 60, unit: "cartons" },
			{ desc: "Spare battery packs", system: 40, unit: "pallets" },
			{ desc: "Cable kits", system: 300, unit: "cartons" },
			{ desc: "Antenna assemblies", system: 28, unit: "crates" },
		]),
	},
	{
		id: "wo-2",
		reference: "TRN-WO-2026-00852",
		kind: "Destuffing",
		status: "Awaiting verification",
		container: "CMAU4829106",
		containerRef: "c-2",
		consignment: "TRN-IMP-002482",
		cargoOwner: "Kano Freight Forwarders",
		location: "Receiving Bay 2",
		scheduledFor: "23 Sep 2026 · 14:00",
		startedAt: "23 Sep 2026 · 14:10",
		completedAt: "23 Sep 2026 · 16:20",
		assignedTo: "K. Lawal · Warehouse officer",
		team: "Destuffing team 02 · 3 people",
		equipment: "Reach stacker 01",
		totalLines: 4,
		completedLines: 4,
		varianceCount: 1,
		beforeWeight: "24,650 kg",
		afterWeight: "24,540 kg",
		notes:
			"One carton short from manifest. Photographs recorded. Awaiting supervisor verification before stock is adjusted.",
		lines: buildLines("b", [
			{ desc: "Household appliances", system: 120, unit: "cartons" },
			{ desc: "Small kitchen units", system: 60, unit: "cartons" },
			{ desc: "Spare parts kit", system: 40, unit: "boxes" },
			{ desc: "Packing accessories", system: 240, unit: "packs" },
		]),
	},
	{
		id: "wo-3",
		reference: "TRN-WO-2026-00853",
		kind: "Stuffing",
		status: "Scheduled",
		container: "TEMU3849204",
		containerRef: "c-3",
		consignment: "TRN-EXP-002536",
		cargoOwner: "Meridian Customs Services",
		location: "Loading Bay 03",
		scheduledFor: "25 Sep 2026 · 08:00",
		startedAt: "—",
		completedAt: "—",
		assignedTo: "M. Danjuma · Yard officer",
		team: "Stuffing team 03 · 4 people",
		equipment: "Forklift 02",
		totalLines: 5,
		completedLines: 0,
		varianceCount: 0,
		beforeWeight: "—",
		afterWeight: "—",
		notes: "Scheduled for tomorrow's morning window.",
		lines: buildLines("c", [
			{ desc: "Solar inverter components", system: 85, unit: "pallets" },
			{ desc: "Battery modules", system: 120, unit: "cartons" },
			{ desc: "Wiring harnesses", system: 300, unit: "rolls" },
			{ desc: "MC4 connectors", system: 800, unit: "packs" },
			{ desc: "Mounting rails", system: 200, unit: "meters" },
		]),
	},
	{
		id: "wo-4",
		reference: "TRN-WO-2026-00849",
		kind: "Destuffing",
		status: "Completed",
		container: "MSCU1234560",
		containerRef: "c-4",
		consignment: "TRN-IMP-002484",
		cargoOwner: "Sahara Energy Logistics",
		location: "Receiving Bay 1",
		scheduledFor: "21 Sep 2026 · 09:00",
		startedAt: "21 Sep 2026 · 09:05",
		completedAt: "21 Sep 2026 · 11:15",
		assignedTo: "S. Eze · Yard officer",
		team: "Destuffing team 01 · 3 people",
		equipment: "Reach stacker 01",
		totalLines: 3,
		completedLines: 3,
		varianceCount: 0,
		beforeWeight: "21,100 kg",
		afterWeight: "21,080 kg",
		notes: "No variance. Weight difference within tolerance.",
		lines: buildLines("d", [
			{ desc: "Heavy generator spares", system: 14, unit: "crates" },
			{ desc: "Industrial pumps", system: 6, unit: "crates" },
			{ desc: "Motor assemblies", system: 12, unit: "crates" },
		]),
	},
];

const statusFilters: (WorkOrderStatus | "all")[] = [
	"all",
	"Scheduled",
	"In progress",
	"Awaiting verification",
	"Completed",
	"Cancelled",
];

export default function OperationsStuffingRoute() {
	const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
	const [query, setQuery] = useState("");
	const [kindFilter, setKindFilter] = useState<WorkOrderKind | "all">("all");
	const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | "all">("all");
	const [selected, setSelected] = useState<WorkOrder | null>(null);
	const [isNewOpen, setIsNewOpen] = useState(false);

	const filtered = useMemo(() => {
		return workOrders.filter((w) => {
			const matchQuery =
				w.reference.toLowerCase().includes(query.toLowerCase()) ||
				w.container.toLowerCase().includes(query.toLowerCase()) ||
				w.consignment.toLowerCase().includes(query.toLowerCase()) ||
				w.cargoOwner.toLowerCase().includes(query.toLowerCase());
			const matchKind = kindFilter === "all" || w.kind === kindFilter;
			const matchStatus = statusFilter === "all" || w.status === statusFilter;
			return matchQuery && matchKind && matchStatus;
		});
	}, [workOrders, query, kindFilter, statusFilter]);

	const stats = useMemo(() => {
		const total = workOrders.length;
		const inProgress = workOrders.filter((w) => w.status === "In progress").length;
		const awaiting = workOrders.filter((w) => w.status === "Awaiting verification").length;
		const variances = workOrders.reduce((sum, w) => sum + w.varianceCount, 0);
		return { total, inProgress, awaiting, variances };
	}, [workOrders]);

	const handleCreate = (next: WorkOrder) => {
		setWorkOrders((prev) => [next, ...prev]);
		setIsNewOpen(false);
		toast.success("Work order created locally.");
	};

	const handleStart = (id: string) => {
		setWorkOrders((prev) =>
			prev.map((w) =>
				w.id === id
					? {
							...w,
							status: "In progress" as WorkOrderStatus,
							startedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: w
			)
		);
		toast.success("Work order started.");
		setSelected(null);
	};

	const handleVerify = (id: string) => {
		setWorkOrders((prev) =>
			prev.map((w) =>
				w.id === id
					? {
							...w,
							status: "Completed" as WorkOrderStatus,
							completedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: w
			)
		);
		toast.success("Verification complete. Work order closed.");
		setSelected(null);
	};

	return (
		<AppShell title="Stuffing & destuffing" eyebrow="Operations · Work orders">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Container work orders
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Stuffing & destuffing work orders
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Coordinate container loading and unloading with before/after reconciliation
						and full lineage. Variances require supervisor verification before stock is
						adjusted.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Work order history exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export history
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsNewOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> New work order
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total work orders"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={Wrench}
				/>
				<Metric
					label="In progress"
					value={String(stats.inProgress)}
					detail="Currently on the floor"
					tone="info"
					icon={Users}
				/>
				<Metric
					label="Awaiting verification"
					value={String(stats.awaiting)}
					detail="Supervisor review pending"
					tone={stats.awaiting > 0 ? "warning" : "success"}
					icon={User}
				/>
				<Metric
					label="Variances flagged"
					value={String(stats.variances)}
					detail="Across all work orders"
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
							placeholder="Search by reference, container, consignment, or cargo owner..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						<button
							type="button"
							onClick={() => setKindFilter("all")}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								kindFilter === "all"
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							All kinds
						</button>
						{(["Stuffing", "Destuffing"] as WorkOrderKind[]).map((k) => (
							<button
								key={k}
								type="button"
								onClick={() => setKindFilter(k)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									kindFilter === k
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{k}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
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
							{s === "all" ? "All statuses" : s}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Wrench className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No work orders match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different reference, container, or status.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((w) => (
							<li key={w.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
								<div
									className={cn(
										"grid size-11 shrink-0 place-items-center rounded-xl",
										w.kind === "Stuffing"
											? "bg-teal/10 text-teal-deep"
											: "bg-orange/10 text-orange-deep"
									)}
								>
									<Layers className="size-5" />
								</div>

								<div className="min-w-[220px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-mono text-[12px] font-semibold text-ink">
											{w.reference}
										</p>
										<StatusBadge label={w.status} tone={statusTone(w.status)} />
										<span
											className={cn(
												"rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
												w.kind === "Stuffing"
													? "bg-teal/10 text-teal-deep"
													: "bg-orange/10 text-orange-deep"
											)}
										>
											{w.kind}
										</span>
										{w.varianceCount > 0 && (
											<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
												{w.varianceCount} variance{w.varianceCount > 1 ? "s" : ""}
											</span>
										)}
									</div>
									<p className="mt-1 text-[12px] text-ink-soft">
										<span className="font-semibold text-ink">{w.container}</span> ·{" "}
										{w.consignment} · {w.cargoOwner}
									</p>
									<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										{w.location} · Scheduled {w.scheduledFor}
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Assigned
									</p>
									<p className="mt-1 text-[12px] text-ink">{w.assignedTo}</p>
									<p className="mt-0.5 text-[11px] text-ink-soft">{w.team}</p>
									<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
										{w.equipment}
									</p>
								</div>

								<div className="min-w-[160px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Progress
									</p>
									<div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-sand-2">
										<div
											className="h-full rounded-full bg-orange transition-[width] duration-300"
											style={{
												width: `${(w.completedLines / w.totalLines) * 100}%`,
											}}
										/>
									</div>
									<p className="mt-1.5 font-mono text-[10px] text-ink-soft">
										{w.completedLines} of {w.totalLines} lines
									</p>
								</div>

								<div className="ml-auto flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelected(w)}
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
						Showing {filtered.length} of {workOrders.length} work orders
					</span>
					<span>Variances require supervisor verification</span>
				</div>
			</section>

			{selected && (
				<WorkOrderDetailDialog
					workOrder={selected}
					onClose={() => setSelected(null)}
					onStart={() => handleStart(selected.id)}
					onVerify={() => handleVerify(selected.id)}
				/>
			)}

			{isNewOpen && (
				<NewWorkOrderModal
					onClose={() => setIsNewOpen(false)}
					onSubmit={handleCreate}
					existingReferences={workOrders.map((w) => w.reference)}
				/>
			)}
		</AppShell>
	);
}

function WorkOrderDetailDialog({
	workOrder,
	onClose,
	onStart,
	onVerify,
}: {
	workOrder: WorkOrder;
	onClose: () => void;
	onStart: () => void;
	onVerify: () => void;
}) {
	const canStart = workOrder.status === "Scheduled";
	const canVerify = workOrder.status === "Awaiting verification";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							{workOrder.kind} work order
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{workOrder.reference}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							{workOrder.container} · {workOrder.consignment} · {workOrder.cargoOwner}
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
						<StatusBadge label={workOrder.status} tone={statusTone(workOrder.status)} />
						<span
							className={cn(
								"rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
								workOrder.kind === "Stuffing"
									? "bg-teal/10 text-teal-deep"
									: "bg-orange/10 text-orange-deep"
							)}
						>
							{workOrder.kind}
						</span>
						{workOrder.varianceCount > 0 && (
							<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-coral">
								{workOrder.varianceCount} variance flagged
							</span>
						)}
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Assigned to
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">
								{workOrder.assignedTo}
							</p>
							<p className="mt-0.5 text-[11px] text-ink-soft">{workOrder.team}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Started
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{workOrder.startedAt}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Completed
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">
								{workOrder.completedAt}
							</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Location
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">
								{workOrder.location}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Equipment
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">
								{workOrder.equipment}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Scheduled for
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">
								{workOrder.scheduledFor}
							</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Before weight
							</p>
							<p className="mt-1 font-mono text-[13px] font-semibold text-ink">
								{workOrder.beforeWeight}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								After weight
							</p>
							<p className="mt-1 font-mono text-[13px] font-semibold text-ink">
								{workOrder.afterWeight}
							</p>
						</div>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{workOrder.notes}</p>
					</div>

					<div>
						<div className="mb-2 flex items-center justify-between">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Cargo lines · {workOrder.totalLines} total
							</p>
							<p className="font-mono text-[10px] text-ink-soft">
								{workOrder.completedLines} handled
							</p>
						</div>
						<div className="overflow-hidden rounded-xl ring-1 ring-line">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/60 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										<th className="px-3 py-2 font-medium">Description</th>
										<th className="px-3 py-2 font-medium text-right">System</th>
										<th className="px-3 py-2 font-medium text-right">Loaded</th>
										<th className="px-3 py-2 font-medium text-right">Delta</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{workOrder.lines.map((l) => {
										const delta =
											l.loadedQty === null ? null : l.loadedQty - l.systemQty;
										return (
											<tr key={l.id} className="hover:bg-sand/40">
												<td className="px-3 py-2.5 text-[12px] text-ink">
													{l.description}
												</td>
												<td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink">
													{l.systemQty} {l.unit}
												</td>
												<td className="px-3 py-2.5 text-right font-mono text-[11px] text-ink">
													{l.loadedQty === null ? "—" : `${l.loadedQty} ${l.unit}`}
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

					{workOrder.status === "Awaiting verification" && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Supervisor verification required
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This work order includes a variance. Verifying confirms the
										loaded figures and closes the work order.
									</p>
								</div>
							</div>
						</div>
					)}

					{workOrder.status === "Completed" && (
						<div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20">
							<div className="flex items-start gap-3">
								<Check className="mt-0.5 size-4 shrink-0 text-teal-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Work order completed
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Closed on {workOrder.completedAt}. Cargo lineage and weight
										reconciliation have been recorded.
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
						<Link
							to="/portal/containers/$id"
							params={{ id: workOrder.containerRef }}
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								<Container className="mr-1.5 size-4" /> Open container
							</Button>
						</Link>
						{canStart && (
							<Button
								onClick={onStart}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Sparkles className="mr-1.5 size-4" /> Start work order
							</Button>
						)}
						{canVerify && (
							<Button
								onClick={onVerify}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Verify & complete
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function NewWorkOrderModal({
	onClose,
	onSubmit,
	existingReferences,
}: {
	onClose: () => void;
	onSubmit: (w: WorkOrder) => void;
	existingReferences: string[];
}) {
	const [kind, setKind] = useState<WorkOrderKind>("Stuffing");
	const [container, setContainer] = useState("");
	const [containerRef, setContainerRef] = useState("");
	const [consignment, setConsignment] = useState("");
	const [cargoOwner, setCargoOwner] = useState("");
	const [location, setLocation] = useState("");
	const [scheduledFor, setScheduledFor] = useState("");
	const [assignedTo, setAssignedTo] = useState("");
	const [team, setTeam] = useState("");
	const [equipment, setEquipment] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!container.trim() || !consignment.trim() || !assignedTo.trim()) {
			toast.error("Container, consignment, and assigned officer are required.");
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

		onSubmit({
			id: `wo-${Date.now()}`,
			reference: `TRN-WO-2026-${nextNumber}`,
			kind,
			status: "Scheduled",
			container,
			containerRef: containerRef || "c-1",
			consignment,
			cargoOwner: cargoOwner || "—",
			location: location || (kind === "Stuffing" ? "Loading Bay 02" : "Receiving Bay 2"),
			scheduledFor: scheduledFor || "Awaiting scheduling",
			startedAt: "—",
			completedAt: "—",
			assignedTo,
			team: team || "Team 01 · 4 people",
			equipment: equipment || "Forklift 01",
			totalLines: 5,
			completedLines: 0,
			varianceCount: 0,
			beforeWeight: "—",
			afterWeight: "—",
			notes: notes || `${kind} work order scheduled from operations console.`,
			lines: Array.from({ length: 5 }).map((_, i) => ({
				id: `new-${i + 1}`,
				description: "Awaiting detailed cargo list",
				systemQty: 0,
				loadedQty: null,
				unit: "units",
				notes: "",
			})),
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								New work order
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Schedule a stuffing or destuffing
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Work orders record before/after reconciliation and full cargo lineage.
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
								Work order type
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{(["Stuffing", "Destuffing"] as WorkOrderKind[]).map((k) => {
									const active = kind === k;
									return (
										<button
											key={k}
											type="button"
											onClick={() => setKind(k)}
											className={cn(
												"rounded-xl border p-4 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<div className="flex items-center gap-2">
												<Layers
													className={cn(
														"size-4",
														active ? "text-orange-deep" : "text-ink-soft"
													)}
												/>
												<p className="text-sm font-semibold text-ink">{k}</p>
											</div>
											<p className="mt-1 text-[11px] leading-5 text-ink-soft">
												{k === "Stuffing"
													? "Load cargo into a container for export or transfer."
													: "Unload cargo from a container into bonded storage."}
											</p>
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Container"
								placeholder="TRIU1234564"
								value={container}
								onChange={setContainer}
								mono
								required
							/>
							<Field
								label="Container ref"
								placeholder="c-1"
								value={containerRef}
								onChange={setContainerRef}
								mono
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Consignment"
								placeholder="TRN-EXP-002532"
								value={consignment}
								onChange={setConsignment}
								mono
								required
							/>
							<Field
								label="Cargo owner"
								placeholder="Atlantic Trade Nigeria Ltd"
								value={cargoOwner}
								onChange={setCargoOwner}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Location"
								placeholder={kind === "Stuffing" ? "Loading Bay 02" : "Receiving Bay 2"}
								value={location}
								onChange={setLocation}
							/>
							<Field
								label="Scheduled for"
								placeholder="24 Sep 2026 · 10:00"
								value={scheduledFor}
								onChange={setScheduledFor}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Assigned to"
								placeholder="S. Eze · Yard officer"
								value={assignedTo}
								onChange={setAssignedTo}
								required
							/>
							<Field
								label="Team"
								placeholder="Stuffing team 01 · 4 people"
								value={team}
								onChange={setTeam}
							/>
						</div>

						<Field
							label="Equipment"
							placeholder="Forklift 04"
							value={equipment}
							onChange={setEquipment}
						/>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Special handling notes, sequence, or other context."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										How work orders are handled
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Before/after weights are recorded, cargo lines are confirmed,
										and any variance is flagged for supervisor verification.
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
							Create work order <ArrowRight />
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