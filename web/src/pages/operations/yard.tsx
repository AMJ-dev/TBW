import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Download,
	Filter,
	Grid2X2,
	Plus,
	RefreshCw,
	Search,
	Truck,
} from "lucide-react";
import {
	AppShell,
	StatusBadge,
	statusTone,
	Metric,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const YARD_POSITIONS = [
	"Yard A · Block A · Row 01 · Slot 01 · Ground",
	"Yard A · Block A · Row 01 · Slot 02 · Ground",
	"Yard A · Block A · Row 02 · Slot 01 · Tier 1",
	"Yard A · Block B · Row 01 · Slot 03 · Ground",
	"Yard B · Block A · Row 03 · Slot 01 · Tier 2",
	"Yard B · Block B · Row 02 · Slot 04 · Ground",
	"Yard C · Block A · Row 01 · Slot 01 · Ground",
	"Yard C · Block A · Row 02 · Slot 02 · Tier 1",
];

const OPERATIONAL_AREAS = [
	"Gate Lane 01",
	"Gate Lane 02",
	"Examination Bay 01",
	"Examination Bay 02",
	"Quarantine Bay",
	"Re-stack Bay",
	"Loading Dock 01",
];

const EQUIPMENT_OPTIONS = [
	"Reach stacker 01",
	"Reach stacker 02",
	"Forklift 03",
	"Forklift 04",
	"Terminal tractor 01",
];

const REASON_OPTIONS = [
	"Initial discharge inbound stacking",
	"Positioning for examination coordination",
	"Gate-out truck loading",
	"Yard restacking",
	"Hold repositioning",
	"Quarantine transfer",
];

type MovementStatus =
	| "Positioned"
	| "Moving"
	| "Pending equipment"
	| "Blocked";

interface YardMovementItem {
	id: string;
	containerNo: string;
	originSlot: string;
	targetSlot: string;
	equipment: string;
	operator: string;
	reason: string;
	status: MovementStatus;
	timestamp: string;
	blockedBy?: string;
}

const initialMovements: YardMovementItem[] = [
	{
		id: "yd-1",
		containerNo: "TRIU1234564",
		originSlot: "Gate Lane 01",
		targetSlot: "Yard A · Block A · Row 01 · Slot 01 · Ground",
		equipment: "Reach stacker 01",
		operator: "S. Adeleke",
		reason: "Initial discharge inbound stacking",
		status: "Positioned",
		timestamp: "10 mins ago",
	},
	{
		id: "yd-2",
		containerNo: "MSCU9876540",
		originSlot: "Yard B · Block A · Row 03 · Slot 01 · Tier 2",
		targetSlot: "Examination Bay 01",
		equipment: "Forklift 04",
		operator: "K. Lawal",
		reason: "Positioning for examination coordination",
		status: "Moving",
		timestamp: "In progress",
	},
	{
		id: "yd-3",
		containerNo: "CMAU5544335",
		originSlot: "Yard A · Block A · Row 02 · Slot 01 · Tier 1",
		targetSlot: "Yard C · Block A · Row 02 · Slot 02 · Tier 1",
		equipment: "Reach stacker 02",
		operator: "M. Danjuma",
		reason: "Yard restacking",
		status: "Pending equipment",
		timestamp: "Queued",
	},
	{
		id: "yd-4",
		containerNo: "HLCU1122338",
		originSlot: "Yard C · Block A · Row 01 · Slot 01 · Ground",
		targetSlot: "Quarantine Bay",
		equipment: "Reach stacker 01",
		operator: "S. Adeleke",
		reason: "Hold repositioning",
		status: "Blocked",
		timestamp: "Yesterday",
		blockedBy: "Customs inspection hold",
	},
];

const ALL_DESTINATIONS = [...YARD_POSITIONS, ...OPERATIONAL_AREAS];

const STATUS_FILTERS: (MovementStatus | "ALL")[] = [
	"ALL",
	"Positioned",
	"Moving",
	"Pending equipment",
	"Blocked",
];

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function OperationsYardRoute() {
	const [movements, setMovements] =
		useState<YardMovementItem[]>(initialMovements);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<MovementStatus | "ALL">(
		"ALL"
	);
	const [view, setView] = useState<"list" | "intake">("list");

	const filteredMovements = useMemo(() => {
		return movements.filter((m) => {
			const query = searchQuery.trim().toLowerCase();
			const matchQuery =
				!query ||
				m.containerNo.toLowerCase().includes(query) ||
				m.originSlot.toLowerCase().includes(query) ||
				m.targetSlot.toLowerCase().includes(query) ||
				m.operator.toLowerCase().includes(query) ||
				m.reason.toLowerCase().includes(query);

			const matchStatus =
				statusFilter === "ALL" ? true : m.status === statusFilter;

			return matchQuery && matchStatus;
		});
	}, [movements, searchQuery, statusFilter]);

	const handleMovement = (item: YardMovementItem) => {
		setMovements((prev) => [item, ...prev]);
		setView("list");
		toast.success(
			`Movement recorded: ${item.containerNo} → ${item.targetSlot}`
		);
	};

	const handleExport = () => {
		toast.success("Yard movement log exported locally.");
	};

	const activeEquipmentCount = new Set(
		movements
			.filter((m) => m.status === "Moving" || m.status === "Positioned")
			.map((m) => m.equipment)
	).size;

	const pendingCount = movements.filter(
		(m) => m.status === "Pending equipment" || m.status === "Moving"
	).length;

	const blockedCount = movements.filter((m) => m.status === "Blocked").length;

	return (
		<AppShell
			title="Yard Management"
			eyebrow="Operations · Ground Stacking & Movement"
		>
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						key="list"
						movements={movements}
						filteredMovements={filteredMovements}
						searchQuery={searchQuery}
						statusFilter={statusFilter}
						onSearchChange={setSearchQuery}
						onStatusChange={setStatusFilter}
						onNewMovement={() => setView("intake")}
						onExport={handleExport}
						metrics={{
							activeEquipmentCount,
							pendingCount,
							blockedCount,
						}}
					/>
				) : (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleMovement}
						existingCount={movements.length}
					/>
				)}
			</div>
		</AppShell>
	);
}

function ListView({
	movements,
	filteredMovements,
	searchQuery,
	statusFilter,
	onSearchChange,
	onStatusChange,
	onNewMovement,
	onExport,
	metrics,
}: {
	movements: YardMovementItem[];
	filteredMovements: YardMovementItem[];
	searchQuery: string;
	statusFilter: MovementStatus | "ALL";
	onSearchChange: (v: string) => void;
	onStatusChange: (v: MovementStatus | "ALL") => void;
	onNewMovement: () => void;
	onExport: () => void;
	metrics: {
		activeEquipmentCount: number;
		pendingCount: number;
		blockedCount: number;
	};
}) {
	const { activeEquipmentCount, pendingCount, blockedCount } = metrics;

	return (
		<div
			className="space-y-6 pb-8"
			style={{
				animation:
					"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
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
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Ground stacking · Equipment movement
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Yard stacking &amp; equipment movement logs
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Track equipment work orders, container restacking, dwell
						positioning, and examination bay shunts.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Download className="size-4" /> Export log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewMovement}
					>
						<Plus className="size-4" /> Record movement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Occupied ground slots"
					value="942 TEU"
					detail="92% terminal utilisation"
					tone="success"
					icon={Grid2X2}
				/>
				<Metric
					label="Active equipment"
					value={`${activeEquipmentCount} units`}
					detail="From movement log"
					tone="info"
					icon={Truck}
				/>
				<Metric
					label="Pending work orders"
					value={`${pendingCount}`}
					detail={
						pendingCount > 0
							? "In progress or awaiting equipment"
							: "All queued moves complete"
					}
					tone={pendingCount > 0 ? "warning" : "success"}
					icon={RefreshCw}
				/>
				<Metric
					label="Blocked moves"
					value={`${blockedCount}`}
					detail={
						blockedCount > 0
							? "Check hold records"
							: "No holds blocking"
					}
					tone={blockedCount > 0 ? "critical" : "success"}
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search by container, slot, equipment, operator, or purpose…"
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{STATUS_FILTERS.map((s) => (
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
								{s}
							</button>
						))}
					</div>
				</div>

				{filteredMovements.length === 0 ? (
					<div className="p-10 text-center">
						<Truck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 text-sm font-semibold text-ink">
							No movements match your filters
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Try another search term or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[980px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">
										Container
									</th>
									<th className="px-4 py-3 font-medium">Origin</th>
									<th className="px-4 py-3 font-medium">
										Destination
									</th>
									<th className="px-4 py-3 font-medium">
										Equipment
									</th>
									<th className="px-4 py-3 font-medium">
										Operator
									</th>
									<th className="px-4 py-3 font-medium">
										Reason
									</th>
									<th className="px-4 py-3 font-medium">
										Status
									</th>
									<th className="px-4 py-3 text-right font-medium">
										Time
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filteredMovements.map((m) => (
									<tr
										key={m.id}
										className="transition-colors hover:bg-sand/40"
									>
										<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
											{m.containerNo}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
											{m.originSlot}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
											{m.targetSlot}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink">
											{m.equipment}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{m.operator}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink">
											{m.reason}
										</td>
										<td className="px-4 py-3.5">
											<div className="flex flex-col gap-1">
												<StatusBadge
													label={m.status}
													tone={statusTone(m.status)}
												/>
												{m.blockedBy && (
													<span className="font-mono text-[10px] text-carmine">
														{m.blockedBy}
													</span>
												)}
											</div>
										</td>
										<td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
											{m.timestamp}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredMovements.length} of {movements.length}{" "}
						container movement logs
					</span>
					<span>Every movement creates a timestamped event</span>
				</div>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<RefreshCw className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Movements are immutable
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Every container movement is recorded as an immutable
							event with actor, timestamp, device, and reason. Origin
							and destination slots are drawn from the terminal
							configuration, and a move cannot be recorded to the
							same location it came from.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	existingCount,
}: {
	onCancel: () => void;
	onSubmit: (item: YardMovementItem) => void;
	existingCount: number;
}) {
	const [containerNo, setContainerNo] = useState("");
	const [originSlot, setOriginSlot] = useState(OPERATIONAL_AREAS[0] ?? "");
	const [targetSlot, setTargetSlot] = useState(YARD_POSITIONS[0] ?? "");
	const [equipment, setEquipment] = useState(EQUIPMENT_OPTIONS[0] ?? "");
	const [reason, setReason] = useState(REASON_OPTIONS[0] ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo.trim()) {
			toast.error("Enter a container number.");
			return;
		}
		if (originSlot === targetSlot) {
			toast.error("Origin and destination cannot be the same.");
			return;
		}

		const item: YardMovementItem = {
			id: `yd-${existingCount + 1}`,
			containerNo: containerNo.trim().toUpperCase(),
			originSlot,
			targetSlot,
			equipment,
			operator: "Console dispatch",
			reason,
			status: "Positioned",
			timestamp: "Just now",
		};

		onSubmit(item);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 pb-24"
			style={{
				animation:
					"slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
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
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to movement log
				</Button>
			</div>

			<div className="min-w-0">
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Ground stacking · Equipment movement
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Record equipment movement
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Assign a container to a new yard position. Every movement is
					recorded with actor, timestamp, device, and reason.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Container
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Identify the container being moved.
					</p>
				</div>
				<div className="p-5 sm:p-6">
					<label className="block">
						<span className={labelClass}>
							Container number{" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. TRIU1234564"
							value={containerNo}
							onChange={(e) =>
								setContainerNo(e.target.value.toUpperCase())
							}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Movement
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Origin, destination, equipment, and reason.
					</p>
				</div>
				<div className="space-y-5 p-5 sm:p-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<SelectField
							label="Origin"
							value={originSlot}
							onChange={setOriginSlot}
							options={ALL_DESTINATIONS}
						/>
						<SelectField
							label="Destination"
							value={targetSlot}
							onChange={setTargetSlot}
							options={ALL_DESTINATIONS}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<SelectField
							label="Equipment assigned"
							value={equipment}
							onChange={setEquipment}
							options={EQUIPMENT_OPTIONS}
						/>
						<SelectField
							label="Movement reason"
							value={reason}
							onChange={setReason}
							options={REASON_OPTIONS}
						/>
					</div>

					<div className="rounded-lg bg-sand p-3 ring-1 ring-line">
						<p className={labelClass}>Recorded as</p>
						<p className="mt-1 font-mono text-[11px] text-ink">
							{containerNo || "CONTAINER"} ·{" "}
							{originSlot.split(" · ")[0]} →{" "}
							{targetSlot.split(" · ")[0]}
						</p>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Yard work order
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{containerNo || "Container pending"} ·{" "}
							{targetSlot.split(" · ")[0]}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							<ArrowRight className="size-4" />
							Save movement
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
}) {
	return (
		<label className="block">
			<span className={labelClass}>{label}</span>
			<div className="relative mt-1.5">
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-11 w-full appearance-none rounded-md border border-line bg-sand px-3 pr-9 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
				>
					{options.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
			</div>
		</label>
	);
}