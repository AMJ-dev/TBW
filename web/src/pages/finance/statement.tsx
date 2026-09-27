import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Download,
	Filter,
	Plus,
	Receipt,
	Search,
	TrendingUp,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CustomerSegment = "Importer" | "Licensed agent" | "Shipping line" | "Transporter";
type StatementHealth = "Current" | "Watch" | "Overdue" | "Blocked";

interface StatementRow {
	id: string;
	name: string;
	rc: string;
	segment: CustomerSegment;
	balanceDue: number;
	overdue: number;
	ageing90Plus: number;
	creditLimit: number;
	creditUsed: number;
	paymentTerms: "Net 7" | "Net 14" | "Net 30";
	lastActivity: string;
	health: StatementHealth;
}

const initialRows: StatementRow[] = [
	{
		id: "atlantic-trade",
		name: "Atlantic Trade Nigeria Ltd",
		rc: "RC 1088421",
		segment: "Importer",
		balanceDue: 862_400,
		overdue: 320_000,
		ageing90Plus: 0,
		creditLimit: 5_000_000,
		creditUsed: 1_850_000,
		paymentTerms: "Net 14",
		lastActivity: "24 Sep 2026",
		health: "Overdue",
	},
	{
		id: "kano-freight",
		name: "Kano Freight Forwarders",
		rc: "RC 9921044",
		segment: "Licensed agent",
		balanceDue: 184_000,
		overdue: 0,
		ageing90Plus: 0,
		creditLimit: 2_500_000,
		creditUsed: 640_000,
		paymentTerms: "Net 14",
		lastActivity: "23 Sep 2026",
		health: "Current",
	},
	{
		id: "sahara-energy",
		name: "Sahara Energy Logistics",
		rc: "RC 7722019",
		segment: "Importer",
		balanceDue: 3_240_000,
		overdue: 1_180_000,
		ageing90Plus: 420_000,
		creditLimit: 10_000_000,
		creditUsed: 3_240_000,
		paymentTerms: "Net 30",
		lastActivity: "22 Sep 2026",
		health: "Blocked",
	},
	{
		id: "meridian-customs",
		name: "Meridian Customs Services",
		rc: "RC 4412908",
		segment: "Licensed agent",
		balanceDue: 96_000,
		overdue: 0,
		ageing90Plus: 0,
		creditLimit: 3_000_000,
		creditUsed: 420_000,
		paymentTerms: "Net 14",
		lastActivity: "24 Sep 2026",
		health: "Current",
	},
	{
		id: "prime-haulage",
		name: "Prime Haulage Ltd",
		rc: "RC 2218477",
		segment: "Transporter",
		balanceDue: 48_000,
		overdue: 48_000,
		ageing90Plus: 0,
		creditLimit: 1_000_000,
		creditUsed: 96_000,
		paymentTerms: "Net 7",
		lastActivity: "20 Sep 2026",
		health: "Watch",
	},
];

const formatNaira = (value: number) =>
	`₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const healthFilters: (StatementHealth | "all")[] = [
	"all",
	"Current",
	"Watch",
	"Overdue",
	"Blocked",
];

const segmentFilters: (CustomerSegment | "all")[] = [
	"all",
	"Importer",
	"Licensed agent",
	"Shipping line",
	"Transporter",
];

export default function FinanceStatementsIndexRoute() {
	const [rows, setRows] = useState<StatementRow[]>(initialRows);
	const [query, setQuery] = useState("");
	const [healthFilter, setHealthFilter] = useState<StatementHealth | "all">("all");
	const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "all">("all");
	const [newLedgerOpen, setNewLedgerOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newRc, setNewRc] = useState("");
	const [newSegment, setNewSegment] = useState<CustomerSegment>("Importer");
	const [newCreditLimit, setNewCreditLimit] = useState("");

	const filtered = useMemo(() => {
		return rows.filter((r) => {
			const matchQuery =
				r.name.toLowerCase().includes(query.toLowerCase()) ||
				r.rc.toLowerCase().includes(query.toLowerCase());
			const matchHealth = healthFilter === "all" || r.health === healthFilter;
			const matchSegment = segmentFilter === "all" || r.segment === segmentFilter;
			return matchQuery && matchHealth && matchSegment;
		});
	}, [rows, query, healthFilter, segmentFilter]);

	const stats = useMemo(() => {
		const totalDue = rows.reduce((sum, r) => sum + r.balanceDue, 0);
		const totalOverdue = rows.reduce((sum, r) => sum + r.overdue, 0);
		const blocked = rows.filter((r) => r.health === "Blocked").length;
		const creditUsed = rows.reduce((sum, r) => sum + r.creditUsed, 0);
		const creditLimit = rows.reduce((sum, r) => sum + r.creditLimit, 0);
		return { totalDue, totalOverdue, blocked, creditUsed, creditLimit };
	}, [rows]);

	const createLedger = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const creditLimit = Number(newCreditLimit.replaceAll(",", ""));
		if (newName.trim().length < 3 || !newRc.trim() || !Number.isFinite(creditLimit) || creditLimit < 0) {
			toast.error("Enter a customer name, RC number, and valid credit limit.");
			return;
		}
		const customer: StatementRow = {
			id: `demo-${Date.now()}`,
			name: newName.trim(),
			rc: newRc.trim(),
			segment: newSegment,
			balanceDue: 0,
			overdue: 0,
			ageing90Plus: 0,
			creditLimit,
			creditUsed: 0,
			paymentTerms: "Net 14",
			lastActivity: "Demo setup",
			health: "Current",
		};
		setRows((current) => [customer, ...current]);
		setNewLedgerOpen(false);
		setNewName("");
		setNewRc("");
		setNewCreditLimit("");
		toast.success("Customer ledger added to this browser demo.");
	};

	return (
		<AppShell title="Statements of account" eyebrow="Finance · Customer ledgers">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance · Customer ledgers
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Statements of account
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						One ledger per customer. Open a statement to see invoice history,
						payments, live storage accruals, ageing, and credit position. Disputes
						pause automated dunning until finance review completes.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Bulk statement run queued locally.")}
					>
						<Download className="mr-1.5 size-4" /> Bulk run
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setNewLedgerOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> New ledger
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total balance due"
					value={formatNaira(stats.totalDue)}
					detail={`${rows.length} active ledgers`}
					tone="warning"
					icon={Receipt}
				/>
				<Metric
					label="Total overdue"
					value={formatNaira(stats.totalOverdue)}
					detail={stats.totalOverdue > 0 ? "Action required" : "No overdue items"}
					tone={stats.totalOverdue > 0 ? "critical" : "success"}
					icon={AlertTriangle}
				/>
				<Metric
					label="Credit utilisation"
					value={`${Math.round((stats.creditUsed / stats.creditLimit) * 100)}%`}
					detail={`${formatNaira(stats.creditUsed)} of ${formatNaira(stats.creditLimit)}`}
					tone="info"
					icon={TrendingUp}
				/>
				<Metric
					label="Blocked accounts"
					value={String(stats.blocked)}
					detail="Release interlock active"
					tone={stats.blocked > 0 ? "critical" : "success"}
					icon={Users}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by customer name or RC number..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{healthFilters.map((h) => (
							<button
								key={h}
								type="button"
								onClick={() => setHealthFilter(h)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									healthFilter === h
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{h === "all" ? "All health" : h}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
					{segmentFilters.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setSegmentFilter(s)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								segmentFilter === s
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							{s === "all" ? "All segments" : s}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Building2 className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No customer ledgers match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different name, RC number, segment, or health filter.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1050px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Customer</th>
									<th className="px-4 py-3 font-medium">Segment</th>
									<th className="px-4 py-3 text-right font-medium">Balance due</th>
									<th className="px-4 py-3 text-right font-medium">Overdue</th>
									<th className="px-4 py-3 text-right font-medium">90+ days</th>
									<th className="px-4 py-3 font-medium">Credit position</th>
									<th className="px-4 py-3 font-medium">Terms</th>
									<th className="px-4 py-3 font-medium">Last activity</th>
									<th className="px-4 py-3 font-medium">Health</th>
									<th className="px-4 py-3 text-right font-medium">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((r) => {
									const utilisation = Math.round((r.creditUsed / r.creditLimit) * 100);
									return (
										<tr key={r.id} className="transition-colors hover:bg-sand/60">
											<td className="px-4 py-3.5">
												<Link
													to="/finance/statement/$customer"
													params={{ customer: r.id }}
													className="font-mono text-[12px] font-semibold text-orange-deep hover:underline"
												>
													{r.name}
												</Link>
												<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
													{r.rc}
												</p>
											</td>
											<td className="px-4 py-3.5 text-[12px] text-ink-soft">
												{r.segment}
											</td>
											<td className="px-4 py-3.5 text-right font-mono text-[12px] font-semibold text-ink">
												{formatNaira(r.balanceDue)}
											</td>
											<td
												className={cn(
													"px-4 py-3.5 text-right font-mono text-[12px]",
													r.overdue > 0 ? "text-coral" : "text-ink-soft"
												)}
											>
												{r.overdue > 0 ? formatNaira(r.overdue) : "—"}
											</td>
											<td
												className={cn(
													"px-4 py-3.5 text-right font-mono text-[12px]",
													r.ageing90Plus > 0 ? "text-coral" : "text-ink-soft"
												)}
											>
												{r.ageing90Plus > 0 ? formatNaira(r.ageing90Plus) : "—"}
											</td>
											<td className="px-4 py-3.5">
												<div className="flex items-center gap-2">
													<div className="h-1.5 w-16 overflow-hidden rounded-full bg-sand-2">
														<div
															className={cn(
																"h-full rounded-full",
																utilisation > 80
																	? "bg-coral"
																	: utilisation > 50
																	? "bg-orange"
																	: "bg-teal"
															)}
															style={{ width: `${Math.min(100, utilisation)}%` }}
														/>
													</div>
													<span className="font-mono text-[11px] text-ink-soft">
														{utilisation}%
													</span>
												</div>
											</td>
											<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
												{r.paymentTerms}
											</td>
											<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
												{r.lastActivity}
											</td>
											<td className="px-4 py-3.5">
												<StatusBadge
													label={r.health}
													tone={statusTone(r.health)}
												/>
											</td>
											<td className="px-4 py-3.5 text-right">
												<Link
													to="/finance/statement/$customer"
													params={{ customer: r.id }}
													className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-deep hover:bg-orange/10 rounded-md px-2 py-1"
												>
													Open <ArrowRight className="size-3.5" />
												</Link>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {rows.length} customer ledgers
					</span>
					<span>
						TRINŪ Bonded Warehouse · Abuja Flagship Facility · Customs support and
						coordination, not a Customs authority
					</span>
				</div>
			</section>
			{newLedgerOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8" onMouseDown={(event) => event.target === event.currentTarget && setNewLedgerOpen(false)}>
					<form role="dialog" aria-modal="true" aria-labelledby="new-ledger-title" onSubmit={createLedger} className="w-full max-w-lg space-y-4 rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">Local demo</p>
								<h3 id="new-ledger-title" className="mt-1 font-display text-xl font-bold text-ink">Create customer ledger</h3>
							</div>
							<Button type="button" variant="ghost" size="icon" onClick={() => setNewLedgerOpen(false)} aria-label="Close new ledger form">×</Button>
						</div>
						<label className="block text-xs font-medium text-ink-soft">Customer name<Input required minLength={3} value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 h-11 border-line bg-sand text-ink" placeholder="Customer organisation" /></label>
						<label className="block text-xs font-medium text-ink-soft">RC number<Input required value={newRc} onChange={(event) => setNewRc(event.target.value)} className="mt-2 h-11 border-line bg-sand font-mono text-ink" placeholder="RC 1234567" /></label>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block text-xs font-medium text-ink-soft">Customer type<select value={newSegment} onChange={(event) => setNewSegment(event.target.value as CustomerSegment)} className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink">{segmentFilters.filter((segment): segment is CustomerSegment => segment !== "all").map((segment) => <option key={segment}>{segment}</option>)}</select></label>
							<label className="block text-xs font-medium text-ink-soft">Credit limit (NGN)<Input required type="number" min="0" value={newCreditLimit} onChange={(event) => setNewCreditLimit(event.target.value)} className="mt-2 h-11 border-line bg-sand text-ink" placeholder="0" /></label>
						</div>
						<p className="text-xs text-ink-soft">This record exists only in the current browser session. No account or backend record is created.</p>
						<div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="outline" onClick={() => setNewLedgerOpen(false)} className="border-line bg-paper text-ink">Cancel</Button><Button type="submit" className="bg-orange text-white hover:bg-orange-deep">Create ledger <ArrowRight /></Button></div>
					</form>
				</div>
			)}
		</AppShell>
	);
}