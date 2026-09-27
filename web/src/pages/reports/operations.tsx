import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Activity,
	ArrowRight,
	Download,
	Filter,
	Search,
	Timer,
	Warehouse,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShiftThroughputRecord {
	id: string;
	timeWindow: string;
	shift: "Morning (06:00 – 14:00)" | "Afternoon (14:00 – 22:00)" | "Night (22:00 – 06:00)";
	inboundTrucks: number;
	outboundTrucks: number;
	avgTurnaroundMins: number;
	stackerMoves: number;
	exceptionsFlagged: number;
	gateReadiness: number;
}

const shiftData: ShiftThroughputRecord[] = [
	{
		id: "st-1",
		timeWindow: "06:00 – 08:00",
		shift: "Morning (06:00 – 14:00)",
		inboundTrucks: 28,
		outboundTrucks: 24,
		avgTurnaroundMins: 22,
		stackerMoves: 64,
		exceptionsFlagged: 1,
		gateReadiness: 98,
	},
	{
		id: "st-2",
		timeWindow: "08:00 – 10:00",
		shift: "Morning (06:00 – 14:00)",
		inboundTrucks: 42,
		outboundTrucks: 38,
		avgTurnaroundMins: 29,
		stackerMoves: 96,
		exceptionsFlagged: 2,
		gateReadiness: 94,
	},
	{
		id: "st-3",
		timeWindow: "10:00 – 12:00",
		shift: "Morning (06:00 – 14:00)",
		inboundTrucks: 51,
		outboundTrucks: 49,
		avgTurnaroundMins: 32,
		stackerMoves: 118,
		exceptionsFlagged: 0,
		gateReadiness: 92,
	},
	{
		id: "st-4",
		timeWindow: "12:00 – 14:00",
		shift: "Morning (06:00 – 14:00)",
		inboundTrucks: 36,
		outboundTrucks: 35,
		avgTurnaroundMins: 26,
		stackerMoves: 82,
		exceptionsFlagged: 1,
		gateReadiness: 96,
	},
	{
		id: "st-5",
		timeWindow: "14:00 – 16:00",
		shift: "Afternoon (14:00 – 22:00)",
		inboundTrucks: 46,
		outboundTrucks: 42,
		avgTurnaroundMins: 30,
		stackerMoves: 104,
		exceptionsFlagged: 3,
		gateReadiness: 91,
	},
	{
		id: "st-6",
		timeWindow: "16:00 – 18:00",
		shift: "Afternoon (14:00 – 22:00)",
		inboundTrucks: 38,
		outboundTrucks: 36,
		avgTurnaroundMins: 27,
		stackerMoves: 88,
		exceptionsFlagged: 0,
		gateReadiness: 95,
	},
];

const yardZones = [
	{ name: "Zone A · Import inbound", usedTEU: 540, capTEU: 700, pct: 77 },
	{ name: "Zone B · Export staging", usedTEU: 320, capTEU: 500, pct: 64 },
	{ name: "Zone C · Examination coordination", usedTEU: 180, capTEU: 250, pct: 72 },
	{ name: "Zone D · Reefer plugs", usedTEU: 84, capTEU: 120, pct: 70 },
	{ name: "Zone E · Empty depot", usedTEU: 518, capTEU: 830, pct: 62 },
];

export default function ReportsOperationsRoute() {
	const [records] = useState<ShiftThroughputRecord[]>(shiftData);
	const [shiftFilter, setShiftFilter] = useState("ALL");
	const [search, setSearch] = useState("");
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [exportDate, setExportDate] = useState("Today (24 Sep 2026)");

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const matchesSearch =
				r.timeWindow.toLowerCase().includes(search.toLowerCase()) ||
				r.shift.toLowerCase().includes(search.toLowerCase());

			const matchesShift = shiftFilter === "ALL" || r.shift.startsWith(shiftFilter);

			return matchesSearch && matchesShift;
		});
	}, [records, search, shiftFilter]);

	const summary = useMemo(() => {
		const totalInbound = records.reduce((acc, r) => acc + r.inboundTrucks, 0);
		const totalOutbound = records.reduce((acc, r) => acc + r.outboundTrucks, 0);
		const totalMoves = records.reduce((acc, r) => acc + r.stackerMoves, 0);
		const avgTurnaround = Math.round(
			records.reduce((acc, r) => acc + r.avgTurnaroundMins, 0) / records.length
		);

		return { totalInbound, totalOutbound, totalMoves, avgTurnaround };
	}, [records]);

	const handleExportCSV = () => {
		const header =
			"Time Window,Shift,Inbound Trucks,Outbound Trucks,Avg Turnaround (Mins),Stacker Moves,Exceptions,Readiness Pct\n";
		const rows = records
			.map(
				(r) =>
					`"${r.timeWindow}","${r.shift}",${r.inboundTrucks},${r.outboundTrucks},${r.avgTurnaroundMins},${r.stackerMoves},${r.exceptionsFlagged},${r.gateReadiness}%`
			)
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `operational-throughput-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Operational throughput log exported locally.");
	};

	return (
		<AppShell title="Operations Reports" eyebrow="Terminal Efficiency & Yard Analytics">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Throughput, equipment & yard velocity
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Operational performance analytics
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Analytics for truck turnaround dwell times, yard utilization, and stacker cycles.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCSV}
						className="border-line font-mono text-xs text-ink"
					>
						<Download className="mr-1.5 size-3.5" />
						Export Throughput
					</Button>
					<Button
						size="sm"
						onClick={() => setIsExportModalOpen(true)}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<Activity className="mr-1.5 size-3.5" />
						Generate Ops Report
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Avg Turnaround Time"
					value={`${summary.avgTurnaround} Mins`}
					tone="success"
					subtext="Target: < 35 mins from gate-in to exit"
				/>
				<Metric
					label="Trucks Serviced Today"
					value={`${summary.totalInbound + summary.totalOutbound} Visits`}
					tone="info"
					subtext={`${summary.totalInbound} inbound · ${summary.totalOutbound} outbound`}
				/>
				<Metric
					label="Yard TEU Capacity"
					value="68.4%"
					tone="neutral"
					subtext="1,642 TEU occupied of 2,400 capacity"
				/>
				<Metric
					label="Stacker Cycle Rate"
					value={`${summary.totalMoves} Moves`}
					tone="success"
					subtext="Recorded this window"
				/>
			</div>

			<div className="rounded-lg border border-line bg-paper p-5">
				<div className="flex items-center justify-between border-b border-line pb-3">
					<div className="flex items-center gap-2">
						<Warehouse className="size-4 text-orange-deep" />
						<h3 className="font-display text-sm font-bold text-ink">
							Yard sector capacity & allocation
						</h3>
					</div>
					<span className="font-mono text-xs text-ink-soft">
						Total: 2,400 TEU capacity
					</span>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					{yardZones.map((zone) => (
						<div
							key={zone.name}
							className="rounded-lg border border-line/70 bg-sand/30 p-3.5"
						>
							<span className="text-[11px] font-semibold text-ink-soft">{zone.name}</span>
							<div className="mt-1 font-mono text-base font-bold text-ink">
								{zone.usedTEU} / {zone.capTEU} TEU
							</div>
							<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
								<div
									className="h-full rounded-full bg-orange"
									style={{ width: `${zone.pct}%` }}
								/>
							</div>
							<div className="mt-1.5 flex justify-between text-[10px] text-ink-soft">
								<span>{zone.pct}% occupied</span>
								<span className="font-medium text-ink">{100 - zone.pct}% free</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 sm:max-w-md">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by time window or shift..."
						className="border-line bg-paper pl-9 text-sm text-ink"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Filter className="size-4 text-ink-soft" />
					<span className="text-xs font-medium text-ink-soft">Shift:</span>
					<select
						value={shiftFilter}
						onChange={(e) => setShiftFilter(e.target.value)}
						aria-label="Filter by shift"
						className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-orange"
					>
						<option value="ALL">All shifts (24 hours)</option>
						<option value="Morning">Morning shift</option>
						<option value="Afternoon">Afternoon shift</option>
						<option value="Night">Night shift</option>
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[800px] text-left text-sm">
						<thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
							<tr>
								<th className="px-4 py-3">Time Window</th>
								<th className="px-4 py-3">Operational Shift</th>
								<th className="px-4 py-3">Inbound Trucks</th>
								<th className="px-4 py-3">Outbound Trucks</th>
								<th className="px-4 py-3">Avg Turnaround</th>
								<th className="px-4 py-3">Stacker Cycles</th>
								<th className="px-4 py-3">Exceptions</th>
								<th className="px-4 py-3">Readiness</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredRecords.map((r) => (
								<tr key={r.id} className="transition-colors hover:bg-sand/30">
									<td className="px-4 py-4 font-mono font-semibold text-orange-deep">
										{r.timeWindow}
									</td>
									<td className="px-4 py-4 text-xs font-medium text-ink">{r.shift}</td>
									<td className="px-4 py-4 font-mono text-xs text-ink">
										{r.inboundTrucks} trucks
									</td>
									<td className="px-4 py-4 font-mono text-xs text-ink">
										{r.outboundTrucks} trucks
									</td>
									<td className="px-4 py-4">
										<span
											className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
												r.avgTurnaroundMins <= 28
													? "text-teal-deep"
													: "text-orange-deep"
											}`}
										>
											<Timer className="size-3.5" />
											{r.avgTurnaroundMins} mins
										</span>
									</td>
									<td className="px-4 py-4 font-mono text-xs font-semibold text-ink">
										{r.stackerMoves} moves
									</td>
									<td className="px-4 py-4">
										{r.exceptionsFlagged > 0 ? (
											<span className="font-mono text-xs font-semibold text-orange-deep">
												{r.exceptionsFlagged} flagged
											</span>
										) : (
											<span className="text-xs text-ink-soft">Zero</span>
										)}
									</td>
									<td className="px-4 py-4">
										<StatusBadge
											label={`${r.gateReadiness}%`}
											tone={r.gateReadiness >= 95 ? "success" : "info"}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{isExportModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsExportModalOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Terminal operations reporting
								</span>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Generate operations report
								</h3>
								<p className="text-xs text-ink-soft">
									Compile an operational performance report for internal review.
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsExportModalOpen(false)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-4 space-y-3.5 text-xs">
							<div>
								<label className="font-semibold text-ink-soft">Target date / shift</label>
								<select
									value={exportDate}
									onChange={(e) => setExportDate(e.target.value)}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Today (24 Sep 2026)">Today (24 Sep 2026)</option>
									<option value="Yesterday (23 Sep 2026)">Yesterday (23 Sep 2026)</option>
									<option value="Trailing 7 Days">Trailing 7 days aggregate</option>
									<option value="Month of September 2026">Month of September 2026</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Modules included</label>
								<div className="mt-1 space-y-1.5 rounded-lg border border-line bg-sand/30 p-2.5">
									{[
										"Weighbridge tare & gross",
										"Gate turnaround & dwell times",
										"Stacker cycle distribution",
										"Yard capacity heatmap",
									].map((item) => (
										<label key={item} className="flex items-center gap-2">
											<input
												type="checkbox"
												defaultChecked
												className="rounded border-line accent-orange"
											/>
											<span className="text-ink">{item}</span>
										</label>
									))}
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsExportModalOpen(false)}
								className="border-line text-ink"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={() => {
									toast.success(`Operations report for ${exportDate} prepared locally.`);
									setIsExportModalOpen(false);
								}}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Download className="mr-1.5 size-3.5" />
								Generate Report
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}