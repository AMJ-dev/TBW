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

const RECEIVING_LOCATIONS = ["Receiving Area", "Receiving Bay 01", "Receiving Bay 02"];

const EXAMINATION_LOCATIONS = ["Examination Bay 01", "Examination Bay 02", "Quarantine Bay"];

const WAREHOUSE_LOCATIONS = ["Warehouse Zone A · Rack 01", "Warehouse Zone A · Rack 02", "Warehouse Zone B · Rack 01"];

const MOVEMENT_CONFIG = {
	GATE_IN: { label: "Gate In / Receiving", origin: "Entry Gate", destination: YARD_POSITIONS[0] ?? "" },
	YARD_TRANSFER: { label: "Yard Transfer", origin: YARD_POSITIONS[0] ?? "", destination: YARD_POSITIONS[1] ?? "" },
	EXAMINATION_TO_YARD: { label: "Examination to Yard", origin: "Examination Bay 01", destination: YARD_POSITIONS[0] ?? "" },
	WAREHOUSE_TO_YARD: { label: "Warehouse to Yard", origin: WAREHOUSE_LOCATIONS[0] ?? "", destination: YARD_POSITIONS[0] ?? "" },
} as const;

type MovementType = keyof typeof MOVEMENT_CONFIG;

const MOVEMENT_TYPES = Object.keys(MOVEMENT_CONFIG) as MovementType[];

const locationsForMovement = (type: MovementType) => {
	switch (type) {
		case "GATE_IN":
			return { origins: ["Entry Gate"], destinations: YARD_POSITIONS };
		case "YARD_TRANSFER":
			return { origins: YARD_POSITIONS, destinations: YARD_POSITIONS };
		case "EXAMINATION_TO_YARD":
			return { origins: EXAMINATION_LOCATIONS, destinations: YARD_POSITIONS };
		case "WAREHOUSE_TO_YARD":
			return { origins: WAREHOUSE_LOCATIONS, destinations: YARD_POSITIONS };
		default:
			return { origins: RECEIVING_LOCATIONS, destinations: YARD_POSITIONS };
	}
};

const EQUIPMENT_OPTIONS = [
	"Reach stacker 01",
	"Reach stacker 02",
	"Forklift 03",
	"Forklift 04",
	"Terminal tractor 01",
];

const REASON_OPTIONS = [
	"Inbound arrival and receiving check",
	"Positioning for examination coordination",
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
	movementType: MovementType;
	gateLane: string;
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
		movementType: "GATE_IN",
		gateLane: "Gate Lane 01",
		originSlot: "Entry Gate",
		targetSlot: YARD_POSITIONS[0] ?? "",
		equipment: "Terminal tractor 01",
		operator: "S. Adeleke",
		reason: "Inbound arrival and receiving check",
		status: "Positioned",
		timestamp: "10 mins ago",
	},
	{
		id: "yd-2",
		containerNo: "MSCU9876540",
		movementType: "EXAMINATION_TO_YARD",
		gateLane: "",
		originSlot: "Examination Bay 01",
		targetSlot: "Yard B · Block A · Row 03 · Slot 01 · Tier 2",
		equipment: "Forklift 04",
		operator: "K. Lawal",
		reason: "Positioning for examination coordination",
		status: "Moving",
		timestamp: "In progress",
	},
	{
		id: "yd-3",
		containerNo: "CMAU5544335",
		movementType: "YARD_TRANSFER",
		gateLane: "",
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
		movementType: "WAREHOUSE_TO_YARD",
		gateLane: "",
		originSlot: "Warehouse Zone A · Rack 01",
		targetSlot: "Yard C · Block A · Row 01 · Slot 01 · Ground",
		equipment: "Reach stacker 01",
		operator: "S. Adeleke",
		reason: "Hold repositioning",
		status: "Blocked",
		timestamp: "Yesterday",
		blockedBy: "Customs inspection hold",
	},
];

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
				m.movementType.toLowerCase().includes(query) ||
				m.gateLane.toLowerCase().includes(query) ||
				m.originSlot.toLowerCase().includes(query) ||
				m.targetSlot.toLowerCase().includes(query) ||
				m.operator.toLowerCase().includes(query) ||
				m.reason.toLowerCase().includes(query);

			const matchStatus =
				statusFilter === "ALL" ? true : m.status === statusFilter;

			return matchQuery && matchStatus;
		});
	}, [movements, searchQuery, statusFilter]);

	const handleMovement = (items: YardMovementItem[]) => {
		setMovements((prev) => [...items].reverse().concat(prev));
		setView("list");
		toast.success(`${items.length} container movement${items.length === 1 ? "" : "s"} recorded.`);
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
							placeholder="Search by container, movement type, location, equipment, or purpose…"
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
									<th className="px-4 py-3 font-medium">Movement type</th>
									<th className="px-4 py-3 font-medium">Origin</th>
									<th className="px-4 py-3 font-medium">
										Destination
									</th>
									<th className="px-4 py-3 font-medium">Gate lane</th>
									<th className="px-4 py-3 font-medium">
										Equipment
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
										<td className="px-4 py-3.5">
											<span className={cn("rounded-md px-2 py-1 font-mono text-[10px] font-semibold", m.movementType === "GATE_IN" ? "bg-orange/10 text-orange-deep" : "bg-sand text-ink-soft")}>
												{MOVEMENT_CONFIG[m.movementType].label}
											</span>
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
											{m.originSlot}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
											{m.targetSlot}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{m.gateLane || "—"}</td>
										<td className="px-4 py-3.5 text-xs text-ink">
											{m.equipment}
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

interface BillOfLadingContainer {
	containerNo: string;
	currentLocation: string;
	status: string;
}

interface BillOfLadingRecord {
	billOfLading: string;
	shipmentReference: string;
	consignee: string;
	containers: BillOfLadingContainer[];
}

const inferMovementType = (location: string): MovementType => {
	if (location.startsWith("Examination")) return "EXAMINATION_TO_YARD";
	if (location.startsWith("Warehouse")) return "WAREHOUSE_TO_YARD";
	if (location.startsWith("Yard")) return "YARD_TRANSFER";
	return "GATE_IN";
};

const SAMPLE_BILL_OF_LADING_RECORDS: BillOfLadingRecord[] = [
	{
		billOfLading: "MAEUABJ202610045",
		shipmentReference: "TRN-SHP-2026-A1045",
		consignee: "Atlantic Manufacturing Ltd.",
		containers: [
			{ containerNo: "MSCU1234567", currentLocation: "Receiving Area", status: "Received" },
			{ containerNo: "TGHU7654321", currentLocation: "Yard A · Block A · Row 01 · Slot 01 · Ground", status: "In Yard" },
			{ containerNo: "CMAU2468135", currentLocation: "Examination Bay 01", status: "Under Examination" },
			{ containerNo: "TRIU1357924", currentLocation: "Yard B · Block A · Row 03 · Slot 01 · Tier 2", status: "In Yard" },
		],
	},
	{
		billOfLading: "ONEYLOS202610082",
		shipmentReference: "TRN-SHP-2026-B2082",
		consignee: "Northern Star Trading",
		containers: [
			{ containerNo: "HLXU1122334", currentLocation: "Receiving Bay 01", status: "Received" },
			{ containerNo: "FCIU5566778", currentLocation: "Yard C · Block A · Row 01 · Slot 01 · Ground", status: "In Yard" },
		],
	},
];

interface ContainerMovementDraft {
	equipment: string;
	destination: string;
}

function IntakeView({
	onCancel,
	onSubmit,
	existingCount,
}: {
	onCancel: () => void;
	onSubmit: (items: YardMovementItem[]) => void;
	existingCount: number;
}) {
	const [billOfLading, setBillOfLading] = useState("");
	const [record, setRecord] = useState<BillOfLadingRecord | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [drafts, setDrafts] = useState<Record<string, ContainerMovementDraft>>({});
	const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
	const [bulkEquipment, setBulkEquipment] = useState(EQUIPMENT_OPTIONS[0] ?? "");
	const [reason, setReason] = useState(REASON_OPTIONS[0] ?? "");

	const getDraft = (containerNo: string): ContainerMovementDraft =>
		drafts[containerNo] ?? {
			equipment: EQUIPMENT_OPTIONS[0] ?? "",
			destination: "",
		};

	const updateDraft = (containerNo: string, updates: Partial<ContainerMovementDraft>) => {
		setDrafts((prev) => ({
			...prev,
			[containerNo]: { ...getDraft(containerNo), ...updates },
		}));
	};

	const handleSearch = () => {
		const query = billOfLading.trim().toUpperCase();
		if (!query) {
			toast.error("Enter a Bill of Lading number.");
			return;
		}
		const found = SAMPLE_BILL_OF_LADING_RECORDS.find(
			(item) => item.billOfLading.toUpperCase() === query
		);
		setHasSearched(true);
		setRecord(found ?? null);
		setDrafts({});
		setSelectedContainers([]);
	};

	const toggleAll = (checked: boolean) => {
		setSelectedContainers(
			checked && record ? record.containers.map((item) => item.containerNo) : []
		);
	};

	const applyBulkSettings = () => {
		if (!selectedContainers.length) {
			toast.error("Select at least one container first.");
			return;
		}
		setDrafts((prev) => {
			const next = { ...prev };
			selectedContainers.forEach((containerNo) => {
				const current = next[containerNo] ?? getDraft(containerNo);
				next[containerNo] = {
					...current,
					equipment: bulkEquipment,
				};
			});
			return next;
		});
		toast.success(`Settings applied to ${selectedContainers.length} container${selectedContainers.length === 1 ? "" : "s"}.`);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!record) return;

		const containersToMove = record.containers.filter(
			(container) => Boolean(getDraft(container.containerNo).destination)
		);

		if (!containersToMove.length) {
			toast.error("Choose a new location for at least one container.");
			return;
		}

		const invalid = containersToMove.find((container) => {
			const draft = getDraft(container.containerNo);
			return !draft.equipment || draft.destination === container.currentLocation;
		});

		if (invalid) {
			toast.error(`Complete the movement details for ${invalid.containerNo}.`);
			return;
		}

		const items = containersToMove.map((container, index): YardMovementItem => {
			const draft = getDraft(container.containerNo);
			return {
				id: `yd-${existingCount + index + 1}`,
				containerNo: container.containerNo,
				movementType: inferMovementType(container.currentLocation),
				gateLane: "",
				originSlot: container.currentLocation,
				targetSlot: draft.destination,
				equipment: draft.equipment,
				operator: "",
				reason,
				status: "Positioned",
				timestamp: "Just now",
			};
		});
		onSubmit(items);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 pb-24" style={{ animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)" }}>
			<style>{`
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button type="button" variant="ghost" onClick={onCancel} className="-ml-3 gap-2 text-ink-soft hover:text-ink">
					<ArrowLeft className="size-4" />
					Back to movement log
				</Button>
			</div>

			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Ground stacking · Equipment movement</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Move containers to the yard</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Search for a shipment, choose where each container should go, then save the movements.
				</p>
			</div>

			<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<label className="block">
					<span className={labelClass}>1. Enter Bill of Lading number</span>
					<div className="mt-2 flex flex-col gap-2 sm:flex-row">
						<Input
							value={billOfLading}
							onChange={(e) => setBillOfLading(e.target.value.toUpperCase())}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSearch();
								}
							}}
							placeholder="e.g. MAEUABJ202610045"
							className="h-11 border-line bg-sand font-mono text-ink"
						/>
						<Button type="button" onClick={handleSearch} className="h-11 gap-2 bg-orange text-white hover:bg-orange-deep">
							<Search className="size-4" />
							Find containers
						</Button>
					</div>
				</label>
				<p className="mt-2 text-[11px] text-ink-soft">Try MAEUABJ202610045 or ONEYLOS202610082 in this UI preview.</p>
			</section>

			{hasSearched && !record && (
				<div className="rounded-2xl border border-carmine/20 bg-carmine/5 p-5">
					<p className="text-sm font-semibold text-ink">Shipment not found</p>
					<p className="mt-1 text-xs text-ink-soft">Check the Bill of Lading number and search again.</p>
				</div>
			)}

			{record && (
				<>
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className={labelClass}>Shipment found</p>
								<h3 className="mt-1 font-mono text-base font-bold text-ink">{record.billOfLading}</h3>
								<p className="mt-1 text-xs text-ink-soft">{record.shipmentReference} · {record.consignee}</p>
							</div>
							<div className="rounded-lg bg-sand px-3 py-2">
								<p className={labelClass}>Containers</p>
								<p className="text-xl font-bold text-ink">{record.containers.length}</p>
							</div>
						</div>
					</section>

					<section className="rounded-2xl bg-paper ring-1 ring-line">
						<div className="border-b border-line p-5 sm:p-6">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className={labelClass}>2. Choose containers</p>
									<h3 className="mt-1 font-display text-sm font-bold text-ink">Apply the same settings to several containers</h3>
									<p className="mt-1 text-xs text-ink-soft">Optional. Select containers, choose the settings and apply.</p>
								</div>
								<label className="flex items-center gap-2 text-xs font-medium text-ink">
									<input
										type="checkbox"
										checked={selectedContainers.length === record.containers.length}
										onChange={(e) => toggleAll(e.target.checked)}
										className="size-4 accent-orange"
									/>
									Select all
								</label>
							</div>
							<div className="mt-4 max-w-md">
								<SelectField label="Equipment" value={bulkEquipment} onChange={setBulkEquipment} options={EQUIPMENT_OPTIONS} />
							</div>
							<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
								<p className="text-xs text-ink-soft">{selectedContainers.length} container{selectedContainers.length === 1 ? "" : "s"} selected</p>
								<Button type="button" variant="outline" onClick={applyBulkSettings} className="border-line bg-paper text-ink hover:bg-sand">
									Apply to selected
								</Button>
							</div>
						</div>

						<div className="p-5 sm:p-6">
							<div className="mb-4">
								<p className={labelClass}>3. Set each container's destination</p>
								<p className="mt-1 text-xs text-ink-soft">The system identifies each container's current location. Choose its equipment and destination.</p>
							</div>
							<div className="space-y-3">
								{record.containers.map((container, index) => {
									const draft = getDraft(container.containerNo);
									const options = YARD_POSITIONS.filter(
										(location) => location !== container.currentLocation
									);
									return (
										<div key={container.containerNo} className="rounded-xl border border-line bg-paper p-4">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="flex items-start gap-3">
													<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand font-mono text-xs font-bold text-ink-soft">{index + 1}</span>
													<div>
														<p className="font-mono text-sm font-bold text-ink">{container.containerNo}</p>
														<p className="mt-1 text-xs text-ink-soft">Currently at: {container.currentLocation}</p>
														<div className="mt-2">
															<StatusBadge label={container.status} tone={statusTone(container.status)} />
														</div>
													</div>
												</div>
												<span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft">
													{draft.destination ? "Ready to move" : "No change"}
												</span>
											</div>
											<div className="mt-4 grid gap-3 sm:grid-cols-2">
												<SelectField
													label="Equipment assigned"
													value={draft.equipment}
													onChange={(value) => updateDraft(container.containerNo, { equipment: value })}
													options={EQUIPMENT_OPTIONS}
												/>
												<SelectField
													label="New yard location"
													value={draft.destination}
													onChange={(value) => updateDraft(container.containerNo, { destination: value })}
													options={["", ...options]}
													formatOption={(value) => value || "Keep current location"}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</section>

					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<p className={labelClass}>4. Confirm movement</p>
						<div className="mt-3 max-w-md">
							<SelectField label="Reason for movement" value={reason} onChange={setReason} options={REASON_OPTIONS} />
						</div>
						<p className="mt-3 text-xs leading-5 text-ink-soft">
							Only containers with a new yard location will be included. Each container is saved as its own movement.
						</p>
					</section>

					<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">Ready to save</p>
								<p className="mt-1 text-xs text-sand/75">
									{record.containers.filter((container) => Boolean(getDraft(container.containerNo).destination)).length} of {record.containers.length} containers selected for movement
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button type="button" variant="outline" onClick={onCancel} className="border-sand/25 bg-transparent text-sand hover:bg-sand/10">Cancel</Button>
								<Button type="submit" className="gap-2 bg-orange text-white hover:bg-orange-deep">
									<ArrowRight className="size-4" />
									Save movements
								</Button>
							</div>
						</div>
					</div>
				</>
			)}
		</form>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	formatOption,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	formatOption?: (value: string) => string;
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
							{formatOption ? formatOption(o) : o}
						</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
			</div>
		</label>
	);
}