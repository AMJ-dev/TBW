import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Calendar,
	Check,
	Clock3,
	Download,
	Filter,
	Receipt,
	TrendingUp,
	Wallet,
    FileText
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatementEntry {
	id: string;
	date: string;
	reference: string;
	description: string;
	type: "Invoice" | "Receipt" | "Adjustment" | "Credit note";
	debit: number;
	credit: number;
	status: "Issued" | "Paid" | "Overdue" | "Pending" | "Disputed";
	document?: string;
}

const openingBalance = 3120000;

const entries: StatementEntry[] = [
	{
		id: "e-1",
		date: "01 Sep 2026",
		reference: "TRN-INV-2026-0143",
		description: "Bonded storage · 4 containers · days 6–10",
		type: "Invoice",
		debit: 2640000,
		credit: 0,
		status: "Overdue",
		document: "TRN-INV-2026-0143",
	},
	{
		id: "e-2",
		date: "02 Sep 2026",
		reference: "TRN-RCP-2026-0784",
		description: "Bank transfer · part settlement of TRN-INV-2026-0139",
		type: "Receipt",
		debit: 0,
		credit: 1200000,
		status: "Paid",
		document: "TRN-RCP-2026-0784",
	},
	{
		id: "e-3",
		date: "05 Sep 2026",
		reference: "TRN-INV-2026-0140",
		description: "Terminal handling · 4 × 40ft containers",
		type: "Invoice",
		debit: 560000,
		credit: 0,
		status: "Paid",
		document: "TRN-INV-2026-0140",
	},
	{
		id: "e-4",
		date: "07 Sep 2026",
		reference: "TRN-RCP-2026-0799",
		description: "Bank transfer · settlement of TRN-INV-2026-0140",
		type: "Receipt",
		debit: 0,
		credit: 560000,
		status: "Paid",
		document: "TRN-RCP-2026-0799",
	},
	{
		id: "e-5",
		date: "08 Sep 2026",
		reference: "TRN-INV-2026-0142",
		description: "Full terminal charge · 4 containers · consolidated",
		type: "Invoice",
		debit: 1850000,
		credit: 0,
		status: "Issued",
		document: "TRN-INV-2026-0142",
	},
	{
		id: "e-6",
		date: "09 Sep 2026",
		reference: "TRN-INV-2026-0144",
		description: "Examination coordination · 1 pending operation",
		type: "Invoice",
		debit: 70000,
		credit: 0,
		status: "Issued",
		document: "TRN-INV-2026-0144",
	},
	{
		id: "e-7",
		date: "09 Sep 2026",
		reference: "TRN-INV-2026-0145",
		description: "Storage escalation · pending first escalation",
		type: "Invoice",
		debit: 250000,
		credit: 0,
		status: "Pending",
		document: "TRN-INV-2026-0145",
	},
	{
		id: "e-8",
		date: "10 Sep 2026",
		reference: "TRN-CRN-2026-0032",
		description: "Credit note · discount applied per tariff agreement",
		type: "Credit note",
		debit: 0,
		credit: 185000,
		status: "Issued",
		document: "TRN-CRN-2026-0032",
	},
	{
		id: "e-9",
		date: "12 Sep 2026",
		reference: "TRN-RCP-2026-0805",
		description: "Bank transfer · settlement of TRN-INV-2026-0142",
		type: "Receipt",
		debit: 0,
		credit: 1665000,
		status: "Paid",
		document: "TRN-RCP-2026-0805",
	},
	{
		id: "e-10",
		date: "14 Sep 2026",
		reference: "TRN-DIS-2026-0031",
		description: "Invoice dispute raised · amount held",
		type: "Adjustment",
		debit: 0,
		credit: 1850000,
		status: "Disputed",
		document: "TRN-DIS-2026-0031",
	},
];

const periods = [
	{ key: "30d", label: "Last 30 days" },
	{ key: "90d", label: "Last 90 days" },
	{ key: "ytd", label: "Year to date" },
	{ key: "custom", label: "Custom range" },
] as const;

type PeriodKey = (typeof periods)[number]["key"];

export default function StatementPage() {
	const [period, setPeriod] = useState<PeriodKey>("30d");
	const [typeFilter, setTypeFilter] = useState<"all" | StatementEntry["type"]>("all");

	const filteredEntries = useMemo(() => {
		if (typeFilter === "all") return entries;
		return entries.filter((e) => e.type === typeFilter);
	}, [typeFilter]);

	const totals = useMemo(() => {
		const debits = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
		const credits = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
		const closing = openingBalance + debits - credits;
		return { debits, credits, closing };
	}, [filteredEntries]);

	const formatNaira = (n: number) =>
		new Intl.NumberFormat("en-NG", {
			style: "currency",
			currency: "NGN",
			maximumFractionDigits: 0,
		}).format(n);

	const downloadStatement = () => {
		toast.success("Statement prepared locally for download.");
	};

	return (
		<AppShell title="Statement of account" eyebrow="Finance workspace">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Account ledger
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Statement of account
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Invoices, receipts, adjustments, and credit notes for your account. The
						closing balance reflects everything up to and including the selected period.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() =>
							toast.success("Statement emailed to the address on file (simulated).")
						}
					>
						Email statement
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={downloadStatement}
					>
						<Download className="mr-1.5 size-4" /> Download statement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Opening balance"
					value={formatNaira(openingBalance)}
					detail="As at 01 Sep 2026"
					icon={Wallet}
				/>
				<Metric
					label="Invoiced in period"
					value={formatNaira(totals.debits)}
					detail={`${filteredEntries.filter((e) => e.type === "Invoice").length} invoices`}
					tone="info"
					icon={Receipt}
				/>
				<Metric
					label="Settled in period"
					value={formatNaira(totals.credits)}
					detail={`${filteredEntries.filter((e) => e.type === "Receipt").length} receipts`}
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Closing balance"
					value={formatNaira(totals.closing)}
					detail="Amount outstanding as at period end"
					tone={totals.closing > 0 ? "warning" : "success"}
					icon={TrendingUp}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="flex flex-wrap items-center gap-2">
						<Calendar className="size-4 text-ink-soft" />
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Period:
						</span>
						{periods.map((p) => (
							<button
								key={p.key}
								type="button"
								onClick={() => setPeriod(p.key)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									period === p.key
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{p.label}
							</button>
						))}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Type:
						</span>
						{(
							[
								{ key: "all", label: "All" },
								{ key: "Invoice", label: "Invoices" },
								{ key: "Receipt", label: "Receipts" },
								{ key: "Credit note", label: "Credit notes" },
								{ key: "Adjustment", label: "Adjustments" },
							] as const
						).map((t) => (
							<button
								key={t.key}
								type="button"
								onClick={() => setTypeFilter(t.key as typeof typeFilter)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									typeFilter === t.key
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[960px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Date</th>
								<th className="px-4 py-3 font-medium">Reference</th>
								<th className="px-4 py-3 font-medium">Description</th>
								<th className="px-4 py-3 font-medium">Type</th>
								<th className="px-4 py-3 font-medium text-right">Debit</th>
								<th className="px-4 py-3 font-medium text-right">Credit</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Document</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							<tr className="bg-sand/30">
								<td className="px-4 py-3 font-mono text-[11px] text-ink-soft" colSpan={4}>
									Opening balance as at 01 Sep 2026
								</td>
								<td className="px-4 py-3 text-right font-mono text-[12px] font-semibold text-ink">
									{formatNaira(openingBalance)}
								</td>
								<td className="px-4 py-3" />
								<td className="px-4 py-3" colSpan={3} />
							</tr>

							{filteredEntries.map((e) => (
								<tr
									key={e.id}
									className="transition-colors hover:bg-sand/60"
								>
									<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
										{e.date}
									</td>
									<td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-orange-deep">
										{e.reference}
									</td>
									<td className="px-4 py-3.5 text-[13px] text-ink">
										{e.description}
									</td>
									<td className="px-4 py-3.5 text-[12px] text-ink-soft">
										{e.type}
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-[12px] text-ink">
										{e.debit ? formatNaira(e.debit) : "—"}
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-[12px] text-teal-deep">
										{e.credit ? formatNaira(e.credit) : "—"}
									</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={e.status} tone={statusTone(e.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Link
											to="/portal/payments"
											className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-deep hover:underline"
										>
											{e.document}
											<ArrowRight className="size-3" />
										</Link>
									</td>
								</tr>
							))}

							<tr className="border-t-2 border-line bg-sand/30">
								<td className="px-4 py-4 font-mono text-[11px] text-ink-soft" colSpan={4}>
									Totals for period
								</td>
								<td className="px-4 py-4 text-right font-mono text-[13px] font-bold text-ink">
									{formatNaira(totals.debits)}
								</td>
								<td className="px-4 py-4 text-right font-mono text-[13px] font-bold text-teal-deep">
									{formatNaira(totals.credits)}
								</td>
								<td colSpan={2} />
							</tr>

							<tr className="border-t border-line bg-paper">
								<td className="px-4 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft" colSpan={4}>
									Closing balance
								</td>
								<td colSpan={2} className="px-4 py-5 text-right">
									<span className="font-mono text-[16px] font-bold text-ink">
										{formatNaira(totals.closing)}
									</span>
								</td>
								<td colSpan={2} />
							</tr>
						</tbody>
					</table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
					<p className="text-[12px] text-ink-soft">
						Statement shows {filteredEntries.length} of {entries.length} entries for the
						selected period.
					</p>
					<div className="flex flex-wrap gap-2">
						<Link to="/portal/payments">
							<Button variant="outline" size="sm" className="border-line bg-paper text-ink">
								Open payment ledger
							</Button>
						</Link>
						<Link to="/portal/payments/dispute">
							<Button variant="outline" size="sm" className="border-line bg-paper text-ink">
								Dispute an invoice
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<div className="grid gap-4 sm:grid-cols-3">
				<RelatedCard
					to="/portal/payments"
					icon={Receipt}
					title="Payment ledger"
					detail="Receipts, disputes, and reconciliation status"
				/>
				<RelatedCard
					to="/portal/invoices"
					icon={FileText}
					title="Invoices"
					detail="All invoices raised on your account"
				/>
				<RelatedCard
					to="/portal/cargo"
					icon={Clock3}
					title="Cargo workspace"
					detail="Charges on each consignment"
				/>
			</div>
		</AppShell>
	);
}

function RelatedCard({
	to,
	icon: Icon,
	title,
	detail,
}: {
	to: string;
	icon: typeof Receipt;
	title: string;
	detail: string;
}) {
	return (
		<Link
			to={to}
			className="group flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line transition-colors hover:bg-sand"
		>
			<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
				<Icon className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-ink">{title}</p>
				<p className="mt-0.5 text-[12px] text-ink-soft">{detail}</p>
			</div>
			<ArrowRight className="mt-2 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}