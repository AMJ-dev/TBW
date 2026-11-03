import { useMemo, useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Check,
	ClipboardCheck,
	Download,
	Filter,
	MapPin,
	Play,
	Plus,
	Search,
	Warehouse,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CountArea = "Yard" | "Examination" | "Warehouse";
type CountStatus = "Scheduled" | "In progress" | "Awaiting approval" | "Completed" | "Cancelled";
type CountUnit = "container" | "cartons" | "pallets" | "crates" | "bags" | "packages";

interface CountLine {
	id: string;	reference: string;	description: string;	location: string;	expectedQty: number;	actualQty: number | null;	unit: CountUnit;	notes: string;
}

interface CycleCount {
	id: string;	reference: string;	area: CountArea;	scope: string;	date: string;	assignedTo: string;	startedAt: string;	completedAt: string;	status: CountStatus;	approvedBy?: string;	notes: string;	lines: CountLine[];
}

const initialCounts: CycleCount[] = [
	{
		id: "cc-1", reference: "TRN-CC-2026-00412", area: "Yard", scope: "Block A · Rows 01–04", date: "2026-11-03", assignedTo: "S. Eze · Yard Officer", startedAt: "03 Nov 2026 · 09:15", completedAt: "—", status: "In progress", notes: "Verify container presence and recorded yard slots.",
		lines: [
			{ id: "yl-1", reference: "TRIU1234564", description: "40ft dry container", location: "A-01-03", expectedQty: 1, actualQty: 1, unit: "container", notes: "" },
			{ id: "yl-2", reference: "MSCU7654321", description: "40ft high-cube container", location: "A-01-04", expectedQty: 1, actualQty: null, unit: "container", notes: "" },
			{ id: "yl-3", reference: "CMAU9876543", description: "20ft dry container", location: "A-02-01", expectedQty: 1, actualQty: null, unit: "container", notes: "" },
			{ id: "yl-4", reference: "TGHU4567890", description: "40ft reefer container", location: "A-03-02", expectedQty: 1, actualQty: null, unit: "container", notes: "" },
		],
	},
	{
		id: "cc-2", reference: "TRN-CC-2026-00413", area: "Warehouse", scope: "Cold Bay · All bins", date: "2026-11-04", assignedTo: "K. Lawal · Warehouse Officer", startedAt: "—", completedAt: "—", status: "Scheduled", notes: "Verify cold-chain cargo quantities by bin.",
		lines: [
			{ id: "wl-1", reference: "TRN-SKU-9022", description: "Pharmaceutical grade glucose", location: "CB-01-04", expectedQty: 320, actualQty: null, unit: "bags", notes: "" },
			{ id: "wl-2", reference: "TRN-SKU-9018", description: "Vaccine cooling packs", location: "CB-01-08", expectedQty: 180, actualQty: null, unit: "cartons", notes: "" },
			{ id: "wl-3", reference: "TRN-SKU-9014", description: "Temperature loggers", location: "CB-02-01", expectedQty: 40, actualQty: null, unit: "packages", notes: "" },
		],
	},
	{
		id: "cc-3", reference: "TRN-CC-2026-00411", area: "Examination", scope: "Examination Bays 01–03", date: "2026-11-02", assignedTo: "M. Danjuma · Examination Officer", startedAt: "02 Nov 2026 · 10:00", completedAt: "—", status: "Awaiting approval", notes: "One container was not found in its assigned bay. Verify its last movement before approval.",
		lines: [
			{ id: "el-1", reference: "TRIU1234564", description: "40ft dry container · Under examination", location: "EX-01", expectedQty: 1, actualQty: 1, unit: "container", notes: "" },
			{ id: "el-2", reference: "MSCU7654321", description: "40ft high-cube · Examination scheduled", location: "EX-02", expectedQty: 1, actualQty: 0, unit: "container", notes: "Not present at assigned bay; movement history to be checked." },
		],
	},
	{
		id: "cc-4", reference: "TRN-CC-2026-00409", area: "Yard", scope: "Block B · Rows 01–02", date: "2026-10-30", assignedTo: "S. Eze · Yard Officer", startedAt: "30 Oct 2026 · 09:00", completedAt: "30 Oct 2026 · 10:45", status: "Completed", approvedBy: "D. Okafor · Operations Manager", notes: "All container locations matched.",
		lines: [
			{ id: "yl-5", reference: "OOLU1112233", description: "20ft dry container", location: "B-01-01", expectedQty: 1, actualQty: 1, unit: "container", notes: "" },
			{ id: "yl-6", reference: "FCIU4455667", description: "40ft dry container", location: "B-02-02", expectedQty: 1, actualQty: 1, unit: "container", notes: "" },
		],
	},
];

const areaLocations: Record<CountArea, string[]> = {
	Yard: ["All yard blocks", "Block A · Rows 01–04", "Block B · Rows 01–02", "Block C · Rows 01–03", "Reefer Area", "Heavy Cargo Area"],
	Examination: ["All examination bays", "Examination Bays 01–03", "Examination Bay 01", "Examination Bay 02", "Examination Bay 03"],
	Warehouse: ["Full warehouse", "Aisle A", "Aisle B", "Aisle C", "Cold Bay", "Heavy Bay"],
};

const areaDescriptions: Record<CountArea, string> = {
	Yard: "Verify container identity and physical slot against Yard Management records.",
	Examination: "Verify that containers are physically present in their assigned examination bays. This does not change examination progress.",
	Warehouse: "Verify stored cargo quantities and bin allocations against warehouse inventory records.",
};

const statusFilters: (CountStatus | "All")[] = ["All", "Scheduled", "In progress", "Awaiting approval", "Completed", "Cancelled"];

function getProgress(count: CycleCount) {
	const counted = count.lines.filter((line) => line.actualQty !== null).length;
	return { counted, total: count.lines.length, percent: count.lines.length ? Math.round((counted / count.lines.length) * 100) : 0 };
}

function getVarianceCount(count: CycleCount) {
	return count.lines.filter((line) => line.actualQty !== null && line.actualQty !== line.expectedQty).length;
}

function formatDate(value: string) {
	if (!value) return "—";
	return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function OperationsCycleCountRoute() {
	const [counts, setCounts] = useState<CycleCount[]>(initialCounts);
	const [query, setQuery] = useState("");
	const [areaFilter, setAreaFilter] = useState<CountArea | "All">("All");
	const [statusFilter, setStatusFilter] = useState<CountStatus | "All">("All");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isScheduleOpen, setIsScheduleOpen] = useState(false);
	const selected = counts.find((count) => count.id === selectedId) ?? null;

	const filtered = useMemo(() => counts.filter((count) => {
		const search = query.toLowerCase();
		const matchesQuery = [count.reference, count.scope, count.assignedTo, count.area, ...count.lines.map((line) => line.reference)].some((value) => value.toLowerCase().includes(search));
		return matchesQuery && (areaFilter === "All" || count.area === areaFilter) && (statusFilter === "All" || count.status === statusFilter);
	}), [counts, query, areaFilter, statusFilter]);

	const stats = useMemo(() => ({
		total: counts.length,
		inProgress: counts.filter((count) => count.status === "In progress").length,
		awaiting: counts.filter((count) => count.status === "Awaiting approval").length,
		variances: counts.reduce((sum, count) => sum + getVarianceCount(count), 0),
	}), [counts]);

	const updateCount = (id: string, updater: (count: CycleCount) => CycleCount) => {
		setCounts((current) => current.map((count) => count.id === id ? updater(count) : count));
	};

	const handleSchedule = (count: CycleCount) => {
		setCounts((current) => [count, ...current]);
		setIsScheduleOpen(false);
		setSelectedId(count.id);
		toast.success("Cycle count scheduled in this preview.");
	};

	const handleStart = (id: string) => {
		updateCount(id, (count) => ({ ...count, status: "In progress", startedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }));
		toast.success("Cycle count started in this preview.");
	};

	const handleLineChange = (countId: string, lineId: string, actualQty: number | null, notes?: string) => {
		updateCount(countId, (count) => ({ ...count, lines: count.lines.map((line) => line.id === lineId ? { ...line, actualQty, ...(notes === undefined ? {} : { notes }) } : line) }));
	};

	const handleSubmitCount = (id: string) => {
		const count = counts.find((item) => item.id === id);
		if (!count) return;
		if (count.lines.some((line) => line.actualQty === null)) {
			toast.error("Complete every physical verification before submitting.");
			return;
		}
		const varianceCount = getVarianceCount(count);
		updateCount(id, (current) => ({ ...current, status: varianceCount > 0 ? "Awaiting approval" : "Completed", completedAt: varianceCount > 0 ? "Awaiting review" : new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }));
		toast.success(varianceCount > 0 ? "Count submitted for supervisor review." : "Count completed. No variances found.");
		setSelectedId(null);
	};

	const handleApprove = (id: string) => {
		updateCount(id, (count) => ({ ...count, status: "Completed", approvedBy: "D. Okafor · Operations Manager", completedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }));
		toast.success("Count review approved in this preview. No source records were changed.");
		setSelectedId(null);
	};

	return (
		<AppShell title="Cycle counts" eyebrow="Operations · Inventory Control">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Terminal operations · Physical verification</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Cycle count management</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">Verify containers, locations, and cargo quantities across the yard, examination bays, and warehouse. Variances are recorded for investigation and approval; counts do not move cargo or silently adjust stock.</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" className="border-line bg-paper text-ink" onClick={() => toast.success("Export is a UI preview only.")}><Download className="mr-1.5 size-4" /> Export history</Button>
					<Button className="bg-orange text-white hover:bg-orange-deep" onClick={() => setIsScheduleOpen(true)}><Plus className="mr-1.5 size-4" /> Schedule count</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric label="Total counts" value={String(stats.total)} detail="All operational areas" tone="info" icon={ClipboardCheck} />
				<Metric label="In progress" value={String(stats.inProgress)} detail="Physical verification underway" tone="info" icon={Play} />
				<Metric label="Awaiting approval" value={String(stats.awaiting)} detail="Discrepancies need review" tone={stats.awaiting ? "warning" : "success"} icon={AlertTriangle} />
				<Metric label="Variances flagged" value={String(stats.variances)} detail="Across submitted counts" tone={stats.variances ? "critical" : "success"} icon={Boxes} />
			</div>

			<div className="grid gap-3 lg:grid-cols-3">
				<AreaCard icon={MapPin} title="Yard" description="Container presence and slot accuracy" count={counts.filter((count) => count.area === "Yard").length} onClick={() => setAreaFilter(areaFilter === "Yard" ? "All" : "Yard")} active={areaFilter === "Yard"} />
				<AreaCard icon={ClipboardCheck} title="Examination" description="Containers assigned to examination bays" count={counts.filter((count) => count.area === "Examination").length} onClick={() => setAreaFilter(areaFilter === "Examination" ? "All" : "Examination")} active={areaFilter === "Examination"} />
				<AreaCard icon={Warehouse} title="Warehouse" description="Cargo quantities and storage-bin accuracy" count={counts.filter((count) => count.area === "Warehouse").length} onClick={() => setAreaFilter(areaFilter === "Warehouse" ? "All" : "Warehouse")} active={areaFilter === "Warehouse"} />
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[240px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search count, location, container, SKU, or officer..." className="h-10 border-line bg-sand pl-9 text-sm text-ink" />
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						<select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as CountArea | "All")} className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"><option value="All">All areas</option><option value="Yard">Yard</option><option value="Examination">Examination</option><option value="Warehouse">Warehouse</option></select>
						<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CountStatus | "All")} className="h-9 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25">{statusFilters.map((status) => <option key={status} value={status}>{status === "All" ? "All statuses" : status}</option>)}</select>
					</div>
				</div>

				{filtered.length === 0 ? <div className="p-12 text-center"><ClipboardCheck className="mx-auto size-7 text-ink-soft" /><p className="mt-3 font-medium text-ink">No cycle counts match your filters.</p><p className="mt-1 text-xs text-ink-soft">Try another area, reference, or status.</p></div> : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[900px] text-left text-sm">
							<thead><tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft"><th className="px-4 py-3 font-medium">Count reference</th><th className="px-4 py-3 font-medium">Area / scope</th><th className="px-4 py-3 font-medium">Assigned officer</th><th className="px-4 py-3 font-medium">Progress</th><th className="px-4 py-3 font-medium">Variances</th><th className="px-4 py-3 font-medium">Scheduled</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium"> </th></tr></thead>
							<tbody className="divide-y divide-line">{filtered.map((count) => {
								const progress = getProgress(count);
								const variances = getVarianceCount(count);
								return <tr key={count.id} className="transition-colors hover:bg-sand/40"><td className="px-4 py-3.5"><p className="font-mono text-xs font-semibold text-ink">{count.reference}</p><p className="mt-1 text-[10px] text-ink-soft">{count.lines.length} verification lines</p></td><td className="px-4 py-3.5"><span className="rounded-md bg-orange/10 px-2 py-1 font-mono text-[10px] font-semibold text-orange-deep">{count.area}</span><p className="mt-1.5 text-xs text-ink">{count.scope}</p></td><td className="px-4 py-3.5 text-xs text-ink">{count.assignedTo}</td><td className="px-4 py-3.5"><div className="h-1.5 w-28 overflow-hidden rounded-full bg-sand-2"><div className="h-full rounded-full bg-orange" style={{ width: `${progress.percent}%` }} /></div><p className="mt-1.5 font-mono text-[10px] text-ink-soft">{progress.counted}/{progress.total} verified · {progress.percent}%</p></td><td className="px-4 py-3.5">{variances ? <span className="rounded bg-coral/10 px-2 py-1 font-mono text-[10px] text-coral">{variances} flagged</span> : <span className="text-xs text-ink-soft">—</span>}</td><td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{formatDate(count.date)}</td><td className="px-4 py-3.5"><StatusBadge label={count.status} tone={statusTone(count.status)} /></td><td className="px-4 py-3.5 text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedId(count.id)} className="text-xs font-semibold text-orange-deep hover:bg-orange/10">View <ArrowRight className="ml-1 size-3.5" /></Button></td></tr>;
							})}</tbody>
						</table>
					</div>
				)}
				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft"><span>Showing {filtered.length} of {counts.length} count records</span><span>Counts verify records; they do not move cargo or adjust stock automatically.</span></div>
			</section>

			{selected && <CountDetailDialog count={selected} onClose={() => setSelectedId(null)} onStart={() => handleStart(selected.id)} onLineChange={handleLineChange} onSubmit={() => handleSubmitCount(selected.id)} onApprove={() => handleApprove(selected.id)} />}
			{isScheduleOpen && <ScheduleModal onClose={() => setIsScheduleOpen(false)} onSubmit={handleSchedule} />}
		</AppShell>
	);
}

function AreaCard({ icon: Icon, title, description, count, onClick, active }: { icon: LucideIcon; title: CountArea; description: string; count: number; onClick: () => void; active: boolean }) {
	return <button type="button" onClick={onClick} className={cn("rounded-xl bg-paper p-4 text-left ring-1 transition-all", active ? "ring-orange shadow-sm" : "ring-line hover:ring-orange/40")}><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep"><Icon className="size-5" /></span><span className="font-mono text-xl font-semibold text-ink">{count}</span></div><p className="mt-3 text-sm font-semibold text-ink">{title} counts</p><p className="mt-1 text-xs text-ink-soft">{description}</p></button>;
}

function CountDetailDialog({ count, onClose, onStart, onLineChange, onSubmit, onApprove }: { count: CycleCount; onClose: () => void; onStart: () => void; onLineChange: (countId: string, lineId: string, actualQty: number | null, notes?: string) => void; onSubmit: () => void; onApprove: () => void }) {
	const progress = getProgress(count);
	const varianceCount = getVarianceCount(count);
	const isContainerCount = count.area !== "Warehouse";
	const canEdit = count.status === "In progress";
	const canApprove = count.status === "Awaiting approval";

	return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
		<div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 sm:p-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">{count.area} physical verification</p><h3 className="mt-1 font-display text-xl font-bold text-ink">{count.reference}</h3><p className="mt-1 text-xs text-ink-soft">{count.scope} · Scheduled {formatDate(count.date)}</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X /></Button></div>
			<div className="max-h-[72vh] space-y-5 overflow-y-auto p-5 sm:p-6">
				<div className="grid gap-3 sm:grid-cols-4"><InfoCard label="Area" value={count.area} /><InfoCard label="Assigned officer" value={count.assignedTo} /><InfoCard label="Verification" value={`${progress.counted} of ${progress.total} lines`} /><InfoCard label="Variances" value={String(varianceCount)} /></div>
				<div className="rounded-xl bg-sand p-4 ring-1 ring-line"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><StatusBadge label={count.status} tone={statusTone(count.status)} />{varianceCount > 0 && <span className="rounded bg-coral/10 px-2 py-1 font-mono text-[10px] text-coral">{varianceCount} discrepancy{varianceCount > 1 ? "ies" : ""}</span>}</div><span className="font-mono text-[10px] text-ink-soft">Started {count.startedAt} · Completed {count.completedAt}</span></div><p className="mt-2 text-xs leading-5 text-ink-soft">{areaDescriptions[count.area]}</p><p className="mt-1 text-xs text-ink-soft">{count.notes}</p></div>
				<div><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h4 className="text-sm font-semibold text-ink">{isContainerCount ? "Expected containers" : "Expected cargo stock"}</h4><p className="mt-1 text-xs text-ink-soft">{canEdit ? "Enter the physical finding for each line. Use zero or mark not found where applicable." : "Compare the recorded expected values with the physical findings."}</p></div><span className="font-mono text-[10px] text-ink-soft">{progress.percent}% verified</span></div>
					<div className="overflow-x-auto rounded-xl ring-1 ring-line"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-line bg-sand/60 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft"><th className="px-3 py-3 font-medium">{isContainerCount ? "Container" : "Cargo / SKU"}</th><th className="px-3 py-3 font-medium">Expected location</th><th className="px-3 py-3 text-right font-medium">Expected</th><th className="px-3 py-3 text-right font-medium">Physical finding</th><th className="px-3 py-3 text-right font-medium">Variance</th><th className="px-3 py-3 font-medium">Finding / notes</th></tr></thead><tbody className="divide-y divide-line">{count.lines.map((line) => { const delta = line.actualQty === null ? null : line.actualQty - line.expectedQty; return <tr key={line.id} className="hover:bg-sand/30"><td className="px-3 py-3"><p className="font-mono text-[11px] font-semibold text-ink">{line.reference}</p><p className="mt-0.5 text-[10px] text-ink-soft">{line.description}</p></td><td className="px-3 py-3 font-mono text-xs text-ink-soft">{line.location}</td><td className="px-3 py-3 text-right font-mono text-xs text-ink">{line.expectedQty} {line.unit}</td><td className="px-3 py-3 text-right">{canEdit ? <Input type="number" min="0" step="1" value={line.actualQty ?? ""} onChange={(event) => onLineChange(count.id, line.id, event.target.value === "" ? null : Math.max(0, Number(event.target.value)))} placeholder="Enter count" className="ml-auto h-9 w-28 border-line bg-white text-right font-mono text-xs text-ink" /> : <span className="font-mono text-xs text-ink">{line.actualQty === null ? "Not counted" : `${line.actualQty} ${line.unit}`}</span>}</td><td className="px-3 py-3 text-right font-mono text-xs">{delta === null ? <span className="text-ink-soft">—</span> : delta === 0 ? <span className="text-teal-deep">Match</span> : <span className="text-coral">{delta > 0 ? "+" : ""}{delta}</span>}</td><td className="px-3 py-3">{canEdit ? <Input value={line.notes} onChange={(event) => onLineChange(count.id, line.id, line.actualQty, event.target.value)} placeholder="Optional note" className="h-9 min-w-40 border-line bg-white text-xs text-ink" /> : <span className="text-xs text-ink-soft">{line.notes || "—"}</span>}</td></tr>; })}</tbody></table></div>
				</div>
				{canApprove && <div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" /><div><p className="text-sm font-semibold text-ink">Discrepancy review required</p><p className="mt-1 text-xs leading-5 text-ink-soft">Review each variance and investigate the relevant movement, receiving, examination, or warehouse records. Approval here records the count review only; it does not move containers or directly adjust inventory.</p></div></div></div>}
				{count.approvedBy && <div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20"><div className="flex items-center gap-2 text-teal-deep"><Check className="size-4" /><p className="text-sm font-semibold">Reviewed by {count.approvedBy}</p></div><p className="mt-1 text-xs text-ink-soft">Count completed {count.completedAt}. Source location and inventory records remain unchanged in this UI-only preview.</p></div>}
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6"><Button variant="ghost" onClick={onClose} className="text-ink-soft">Close</Button><div className="flex flex-wrap gap-2">{count.status === "Scheduled" && <Button onClick={onStart} className="bg-orange text-white hover:bg-orange-deep"><Play className="mr-1.5 size-4" /> Start count</Button>}{canEdit && <Button onClick={onSubmit} className="bg-orange text-white hover:bg-orange-deep"><Check className="mr-1.5 size-4" /> Submit findings</Button>}{canApprove && <Button onClick={onApprove} className="bg-orange text-white hover:bg-orange-deep"><Check className="mr-1.5 size-4" /> Approve review</Button>}</div></div>
		</div>
	</div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
	return <div className="rounded-lg bg-sand p-3 ring-1 ring-line"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">{label}</p><p className="mt-1 text-xs font-semibold text-ink">{value}</p></div>;
}

function ScheduleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (count: CycleCount) => void }) {
	const [area, setArea] = useState<CountArea>("Yard");
	const [scope, setScope] = useState(areaLocations.Yard[0]);
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [assignedTo, setAssignedTo] = useState("");
	const [notes, setNotes] = useState("");
	const [referenceFilter, setReferenceFilter] = useState("");

	const handleAreaChange = (nextArea: CountArea) => {
		setArea(nextArea);
		setScope(areaLocations[nextArea][0]);
		setReferenceFilter("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!assignedTo.trim()) { toast.error("Assign this count to an officer."); return; }
		const dateLabel = formatDate(date);
		const samples: CountLine[] = area === "Yard" ? [
			{ id: `line-${Date.now()}-1`, reference: referenceFilter || "TRIU1234564", description: "40ft dry container", location: scope === "All yard blocks" ? "A-01-03" : scope, expectedQty: 1, actualQty: null, unit: "container", notes: "" },
			{ id: `line-${Date.now()}-2`, reference: "MSCU7654321", description: "40ft high-cube container", location: scope === "All yard blocks" ? "A-01-04" : scope, expectedQty: 1, actualQty: null, unit: "container", notes: "" },
		] : area === "Examination" ? [
			{ id: `line-${Date.now()}-1`, reference: referenceFilter || "CMAU9876543", description: "20ft dry container · Examination scheduled", location: scope === "All examination bays" ? "EX-01" : scope, expectedQty: 1, actualQty: null, unit: "container", notes: "" },
			{ id: `line-${Date.now()}-2`, reference: "TGHU4567890", description: "40ft reefer · Under examination", location: scope === "All examination bays" ? "EX-02" : scope, expectedQty: 1, actualQty: null, unit: "container", notes: "" },
		] : [
			{ id: `line-${Date.now()}-1`, reference: referenceFilter || "TRN-SKU-9022", description: "Pharmaceutical grade glucose", location: scope === "Full warehouse" ? "CB-01-04" : scope, expectedQty: 320, actualQty: null, unit: "bags", notes: "" },
			{ id: `line-${Date.now()}-2`, reference: "TRN-SKU-9018", description: "Vaccine cooling packs", location: scope === "Full warehouse" ? "CB-01-08" : scope, expectedQty: 180, actualQty: null, unit: "cartons", notes: "" },
		];
		const sequence = 414 + Math.floor(Math.random() * 80);
		onSubmit({ id: `cc-${Date.now()}`, reference: `TRN-CC-2026-${sequence}`, area, scope, date, assignedTo: assignedTo.trim(), startedAt: "—", completedAt: "—", status: "Scheduled", notes: notes || `${area} physical verification scheduled for ${dateLabel}.`, lines: samples });
	};

	return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line"><form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col"><div className="flex items-start justify-between border-b border-line p-5 sm:p-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">Schedule physical verification</p><h3 className="mt-1 font-display text-xl font-bold text-ink">New cycle count</h3><p className="mt-1 text-xs text-ink-soft">Choose the operational area. The expected records are presented for verification.</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog"><X /></Button></div>
			<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Count area</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{(["Yard", "Examination", "Warehouse"] as CountArea[]).map((item) => <button key={item} type="button" onClick={() => handleAreaChange(item)} className={cn("rounded-xl border p-3 text-left transition-colors", area === item ? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/30" : "border-line bg-sand text-ink-soft hover:bg-sand-2")}><span className="text-xs font-semibold">{item}</span><span className="mt-1 block text-[10px] leading-4">{item === "Yard" ? "Container slots" : item === "Examination" ? "Examination bays" : "Cargo bins and quantities"}</span></button>)}</div><p className="mt-2 text-xs leading-5 text-ink-soft">{areaDescriptions[area]}</p></div>
				<div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Location / scope</span><select value={scope} onChange={(event) => setScope(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25">{areaLocations[area].map((location) => <option key={location}>{location}</option>)}</select></label><label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Scheduled date</span><Input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 h-11 border-line bg-sand text-ink" /></label></div>
				<label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">{area === "Warehouse" ? "Optional SKU / consignment filter" : "Optional container number filter"}</span><Input value={referenceFilter} onChange={(event) => setReferenceFilter(event.target.value.toUpperCase())} placeholder={area === "Warehouse" ? "e.g. TRN-SKU-9022" : "e.g. TRIU1234564"} className="mt-2 h-11 border-line bg-sand font-mono text-xs text-ink" /></label>
				<div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Assigned officer <span className="text-coral">*</span></span><Input required value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Officer name / role" className="mt-2 h-11 border-line bg-sand text-ink" /></label><div className="rounded-lg bg-sand p-3 ring-1 ring-line"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">Count basis</p><p className="mt-1 text-xs font-semibold text-ink">{area === "Warehouse" ? "Physical cargo quantity by bin" : "Physical container presence by location"}</p></div></div>
				<label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Instructions / notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Instructions for the assigned officer..." className="mt-2 min-h-20 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30" /></label>
				<div className="rounded-xl bg-sand p-4 ring-1 ring-line"><div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange-deep" /><div><p className="text-xs font-semibold text-ink">Important</p><p className="mt-1 text-xs leading-5 text-ink-soft">A cycle count only records what is physically found. Missing or unexpected containers must be investigated against movement history. Warehouse quantity variances require review before any stock adjustment is made.</p></div></div></div>
			</div><div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6"><Button type="button" variant="ghost" onClick={onClose} className="text-ink-soft">Cancel</Button><Button type="submit" className="bg-orange text-white hover:bg-orange-deep">Schedule count <ArrowRight className="ml-1 size-4" /></Button></div></form></div></div>;
}
