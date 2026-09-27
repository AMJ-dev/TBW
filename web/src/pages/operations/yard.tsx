import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowRight,
	Boxes,
	CheckCircle2,
	Clock,
	Download,
	Filter,
	Grid2X2,
	Plus,
	RefreshCw,
	Search,
	Truck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface YardMovementItem {
	id: string;
	containerNo: string;
	originSlot: string;
	targetSlot: string;
	equipment: string;
	operator: string;
	reason: string;
	status: "Positioned" | "Moving" | "Pending equipment" | "Hold";
	timestamp: string;
}

const initialMovements: YardMovementItem[] = [
	{
		id: "yd-1",
		containerNo: "TRIU1234564",
		originSlot: "Gate Lane 01",
		targetSlot: "Yard A / Bay 02 / Tier 2",
		equipment: "Reach stacker 01",
		operator: "S. Adeleke",
		reason: "Initial discharge inbound stacking",
		status: "Positioned",
		timestamp: "10 mins ago",
	},
	{
		id: "yd-2",
		containerNo: "MSCU9876540",
		originSlot: "Yard B / Bay 04 / Tier 1",
		targetSlot: "Examination Bay 02",
		equipment: "Forklift 04",
		operator: "K. Lawal",
		reason: "Positioning for examination coordination",
		status: "Moving",
		timestamp: "In progress",
	},
	{
		id: "yd-3",
		containerNo: "CMAU5544335",
		originSlot: "Yard A / Bay 01 / Tier 3",
		targetSlot: "Yard C / Re-stack Bay",
		equipment: "Reach stacker 02",
		operator: "M. Danjuma",
		reason: "Yard restacking",
		status: "Pending equipment",
		timestamp: "Queued",
	},
	{
		id: "yd-4",
		containerNo: "HLCU1122338",
		originSlot: "Yard C / Bay 03 / Tier 1",
		targetSlot: "Quarantine Bay",
		equipment: "Reach stacker 01",
		operator: "S. Adeleke",
		reason: "Hold repositioned for review",
		status: "Hold",
		timestamp: "Yesterday",
	},
];

export default function OperationsYardRoute() {
	const [movements, setMovements] = useState<YardMovementItem[]>(initialMovements);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [containerNo, setContainerNo] = useState("");
	const [originSlot, setOriginSlot] = useState("Yard A / Bay 01");
	const [targetSlot, setTargetSlot] = useState("Examination Bay 01");
	const [equipment, setEquipment] = useState("Reach stacker 01");
	const [reason, setReason] = useState("Positioning for examination coordination");

	const filteredMovements = useMemo(() => {
		return movements.filter((m) => {
			const matchQuery =
				m.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.originSlot.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.targetSlot.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.reason.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : m.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [movements, searchQuery, statusFilter]);

	const handleRecordMovement = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo) {
			toast.error("Please enter a container number.");
			return;
		}

		const newMove: YardMovementItem = {
			id: `yd-${movements.length + 1}`,
			containerNo: containerNo.toUpperCase(),
			originSlot,
			targetSlot,
			equipment,
			operator: "Console dispatch",
			reason,
			status: "Positioned",
			timestamp: "Just now",
		};

		setMovements([newMove, ...movements]);
		setIsModalOpen(false);
		setContainerNo("");
		toast.success(`Movement recorded locally: ${containerNo} → ${targetSlot}`);
	};

	return (
		<AppShell title="Yard Management" eyebrow="Operations · Ground Stacking & Movement">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Ground stacking · Equipment movement
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Yard stacking & equipment movement logs
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Track equipment work orders, container restacking, dwell positioning, and
						examination bay shunts.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Yard movement log exported locally.")}
					>
						<Download className="size-4" /> Export Movement Log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Record Movement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Occupied Ground Slots"
					value="942 TEU"
					detail="92% terminal utilization"
					tone="success"
					icon={Grid2X2}
				/>
				<Metric
					label="Active Equipment"
					value="4 Units"
					detail="3 reach stackers · 1 forklift"
					tone="info"
					icon={Truck}
				/>
				<Metric
					label="Pending Shunts"
					value="3 Work Orders"
					detail="Next: Exam Bay 02"
					tone="warning"
					icon={RefreshCw}
				/>
				<Metric
					label="Average Shunt Time"
					value="8.5 Mins"
					detail="Cycle time per move"
					tone="success"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by container, slot, equipment, operator, or purpose..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Positioned", "Moving", "Pending equipment", "Hold"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Origin Position</th>
								<th className="px-4 py-3 font-medium">Destination Slot</th>
								<th className="px-4 py-3 font-medium">Assigned Equipment</th>
								<th className="px-4 py-3 font-medium">Operator / Driver</th>
								<th className="px-4 py-3 font-medium">Movement Reason</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Time</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredMovements.map((m) => (
								<tr key={m.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{m.containerNo}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{m.originSlot}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{m.targetSlot}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">{m.equipment}</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{m.operator}</td>
									<td className="px-4 py-3.5 text-xs text-ink">{m.reason}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={m.status} tone={statusTone(m.status)} />
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
										{m.timestamp}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredMovements.length} of {movements.length} container movement logs
					</span>
					<span>Every movement creates a timestamped event</span>
				</div>
			</section>

			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Yard work order
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Record Equipment Movement
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleRecordMovement} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Container Number
								</label>
								<Input
									required
									placeholder="e.g. TRIU1234564"
									value={containerNo}
									onChange={(e) => setContainerNo(e.target.value)}
									className="mt-1.5 border-line bg-sand font-mono text-ink"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Origin Slot
									</label>
									<Input
										required
										value={originSlot}
										onChange={(e) => setOriginSlot(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-xs text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Destination Slot
									</label>
									<Input
										required
										value={targetSlot}
										onChange={(e) => setTargetSlot(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-xs text-ink"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Equipment Assigned
									</label>
									<select
										value={equipment}
										onChange={(e) => setEquipment(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Reach stacker 01</option>
										<option>Reach stacker 02</option>
										<option>Forklift 04</option>
									</select>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Movement Reason
									</label>
									<select
										value={reason}
										onChange={(e) => setReason(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Positioning for examination coordination</option>
										<option>Initial discharge inbound stacking</option>
										<option>Gate-out truck loading</option>
										<option>Yard restacking</option>
									</select>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Save Movement
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}