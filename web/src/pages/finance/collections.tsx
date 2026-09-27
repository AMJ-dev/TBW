import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Banknote,
	Calendar,
	Check,
	ChevronLeft,
	Clock3,
	Download,
	Filter,
	History,
	Mail,
	MessageSquare,
	Phone,
	Search,
	ShieldAlert,
	Sparkles,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AgeingBucket = "Current" | "1–30 days" | "31–60 days" | "61–90 days" | "90+ days";
type DunningStage =
	| "None"
	| "Reminder sent"
	| "Second reminder"
	| "Final notice"
	| "Pre-legal"
	| "Legal"
	| "Paid"
	| "Waived";

interface CollectionAccount {
	id: string;
	customer: string;
	accountRef: string;
	invoiceRef: string;
	invoiceDate: string;
	dueDate: string;
	amount: number;
	daysOverdue: number;
	bucket: AgeingBucket;
	stage: DunningStage;
	lastContact: string;
	nextAction: string;
	nextActionDate: string;
	contactEmail: string;
	contactPhone: string;
	notes: string;
}

const formatNaira = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

const initialAccounts: CollectionAccount[] = [
	{
		id: "col-1",
		customer: "Atlantic Trade Nigeria Ltd",
		accountRef: "TRN-CUST-0142",
		invoiceRef: "TRN-INV-2026-0142",
		invoiceDate: "07 Sep 2026",
		dueDate: "14 Sep 2026",
		amount: 1850000,
		daysOverdue: 10,
		bucket: "1–30 days",
		stage: "Reminder sent",
		lastContact: "20 Sep 2026 · email",
		nextAction: "Second reminder",
		nextActionDate: "27 Sep 2026",
		contactEmail: "finance@atlantictrade.ng",
		contactPhone: "+234 803 112 3456",
		notes: "Customer acknowledged invoice. Payment scheduled for end of week.",
	},
	{
		id: "col-2",
		customer: "Kano Freight Forwarders",
		accountRef: "TRN-CUST-0281",
		invoiceRef: "TRN-INV-2026-0143",
		invoiceDate: "01 Sep 2026",
		dueDate: "22 Sep 2026",
		amount: 2640000,
		daysOverdue: 2,
		bucket: "1–30 days",
		stage: "None",
		lastContact: "—",
		nextAction: "First reminder",
		nextActionDate: "25 Sep 2026",
		contactEmail: "accounts@kanofreight.ng",
		contactPhone: "+234 802 987 6543",
		notes: "First reminder due within the standard window.",
	},
	{
		id: "col-3",
		customer: "Meridian Customs Services",
		accountRef: "TRN-CUST-0073",
		invoiceRef: "TRN-INV-2026-0139",
		invoiceDate: "12 Aug 2026",
		dueDate: "02 Sep 2026",
		amount: 980000,
		daysOverdue: 22,
		bucket: "1–30 days",
		stage: "Second reminder",
		lastContact: "18 Sep 2026 · phone",
		nextAction: "Final notice",
		nextActionDate: "30 Sep 2026",
		contactEmail: "finance@meridiancustoms.ng",
		contactPhone: "+234 803 445 2200",
		notes: "Customer requested short extension. Documented in the account notes.",
	},
	{
		id: "col-4",
		customer: "Sahara Energy Logistics",
		accountRef: "TRN-CUST-0194",
		invoiceRef: "TRN-INV-2026-0128",
		invoiceDate: "15 Jul 2026",
		dueDate: "14 Aug 2026",
		amount: 5120000,
		daysOverdue: 41,
		bucket: "31–60 days",
		stage: "Final notice",
		lastContact: "12 Sep 2026 · email",
		nextAction: "Pre-legal review",
		nextActionDate: "28 Sep 2026",
		contactEmail: "treasury@saharaenergy.ng",
		contactPhone: "+234 814 332 1199",
		notes: "Customer has proposed a partial settlement plan. Finance reviewing.",
	},
	{
		id: "col-5",
		customer: "Coastal Freight Nigeria",
		accountRef: "TRN-CUST-0338",
		invoiceRef: "TRN-INV-2026-0118",
		invoiceDate: "22 Jun 2026",
		dueDate: "22 Jul 2026",
		amount: 392000,
		daysOverdue: 64,
		bucket: "61–90 days",
		stage: "Pre-legal",
		lastContact: "15 Sep 2026 · letter",
		nextAction: "Legal handover",
		nextActionDate: "30 Sep 2026",
		contactEmail: "ops@coastalfreight.ng",
		contactPhone: "+234 805 441 2288",
		notes: "No response since final notice. Legal review pending.",
	},
	{
		id: "col-6",
		customer: "Prime Haulage Ltd",
		accountRef: "TRN-CUST-0412",
		invoiceRef: "TRN-INV-2026-0104",
		invoiceDate: "05 May 2026",
		dueDate: "04 Jun 2026",
		amount: 640000,
		daysOverdue: 112,
		bucket: "90+ days",
		stage: "Legal",
		lastContact: "08 Sep 2026 · legal notice",
		nextAction: "Court filing",
		nextActionDate: "01 Oct 2026",
		contactEmail: "legal@primehaulage.ng",
		contactPhone: "+234 816 778 9900",
		notes: "Referred to legal counsel. Outstanding since June.",
	},
];

const bucketFilters: (AgeingBucket | "all")[] = [
	"all",
	"Current",
	"1–30 days",
	"31–60 days",
	"61–90 days",
	"90+ days",
];

const stageFilters: (DunningStage | "all")[] = [
	"all",
	"None",
	"Reminder sent",
	"Second reminder",
	"Final notice",
	"Pre-legal",
	"Legal",
];

export default function FinanceCollectionsRoute() {
	const [accounts, setAccounts] = useState<CollectionAccount[]>(initialAccounts);
	const [query, setQuery] = useState("");
	const [bucketFilter, setBucketFilter] = useState<AgeingBucket | "all">("all");
	const [stageFilter, setStageFilter] = useState<DunningStage | "all">("all");
	const [selected, setSelected] = useState<CollectionAccount | null>(null);

	const filtered = useMemo(() => {
		return accounts.filter((a) => {
			const matchQuery =
				a.customer.toLowerCase().includes(query.toLowerCase()) ||
				a.invoiceRef.toLowerCase().includes(query.toLowerCase()) ||
				a.accountRef.toLowerCase().includes(query.toLowerCase());
			const matchBucket = bucketFilter === "all" || a.bucket === bucketFilter;
			const matchStage = stageFilter === "all" || a.stage === stageFilter;
			return matchQuery && matchBucket && matchStage;
		});
	}, [accounts, query, bucketFilter, stageFilter]);

	const stats = useMemo(() => {
		const totalOutstanding = accounts.reduce((sum, a) => sum + a.amount, 0);
		const overdue = accounts.filter((a) => a.daysOverdue > 0);
		const overdueAmount = overdue.reduce((sum, a) => sum + a.amount, 0);
		const inDunning = accounts.filter((a) =>
			["Reminder sent", "Second reminder", "Final notice", "Pre-legal"].includes(a.stage)
		).length;
		const preLegal = accounts.filter((a) => a.stage === "Pre-legal" || a.stage === "Legal").length;
		return { totalOutstanding, overdueAmount, inDunning, preLegal };
	}, [accounts]);

	const bucketTotals = useMemo(() => {
		const buckets: Record<AgeingBucket, number> = {
			Current: 0,
			"1–30 days": 0,
			"31–60 days": 0,
			"61–90 days": 0,
			"90+ days": 0,
		};
		accounts.forEach((a) => {
			buckets[a.bucket] += a.amount;
		});
		return buckets;
	}, [accounts]);

	const handleAdvance = (id: string, nextStage: DunningStage, note: string) => {
		setAccounts((prev) =>
			prev.map((a) =>
				a.id === id
					? {
							...a,
							stage: nextStage,
							lastContact: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
							notes: note ? `${a.notes} ${note}` : a.notes,
						}
					: a
			)
		);
		toast.success(`Stage updated to ${nextStage}.`);
		setSelected(null);
	};

	const handleSendReminder = (id: string, channel: "Email" | "SMS" | "Call") => {
		toast.success(`${channel} reminder sent (simulated).`);
		setAccounts((prev) =>
			prev.map((a) =>
				a.id === id
					? {
							...a,
							lastContact: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
							notes: `${a.notes} ${channel} reminder sent.`,
						}
					: a
			)
		);
	};

	return (
		<AppShell title="Collections & dunning" eyebrow="Finance · Receivables">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Receivables
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Collections & dunning
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Track overdue invoices by ageing bucket, advance dunning stages, and send
						reminders through email, SMS, or logged calls. Every action is logged to the
						audit trail.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/finance/reconciliation">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ChevronLeft className="mr-1.5 size-4" /> Reconciliation
						</Button>
					</Link>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Ageing report exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export ageing
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Outstanding receivables"
					value={formatNaira(stats.totalOutstanding)}
					detail="Across all accounts"
					tone="warning"
					icon={Banknote}
				/>
				<Metric
					label="Overdue amount"
					value={formatNaira(stats.overdueAmount)}
					detail={`${accounts.filter((a) => a.daysOverdue > 0).length} invoices`}
					tone="critical"
					icon={AlertTriangle}
				/>
				<Metric
					label="In active dunning"
					value={String(stats.inDunning)}
					detail="Reminder to final notice"
					tone="warning"
					icon={Clock3}
				/>
				<Metric
					label="Pre-legal & legal"
					value={String(stats.preLegal)}
					detail="Requires escalation"
					tone={stats.preLegal > 0 ? "critical" : "success"}
					icon={ShieldAlert}
				/>
			</div>

			<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex items-center gap-2">
					<Calendar className="size-4 text-orange" />
					<h3 className="font-display text-sm font-bold text-ink">Ageing buckets</h3>
				</div>
				<div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{(
						["Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"] as AgeingBucket[]
					).map((bucket) => {
						const amount = bucketTotals[bucket];
						const count = accounts.filter((a) => a.bucket === bucket).length;
						const isWarning =
							bucket === "31–60 days" || bucket === "61–90 days" || bucket === "90+ days";
						return (
							<div
								key={bucket}
								className={cn(
									"rounded-xl p-4 ring-1",
									bucket === "90+ days"
										? "bg-coral/5 ring-coral/20"
										: bucket === "61–90 days"
										? "bg-orange/5 ring-orange/20"
										: "bg-sand ring-line"
								)}
							>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									{bucket}
								</p>
								<p className="mt-2 font-display text-lg font-bold text-ink">
									{formatNaira(amount)}
								</p>
								<p className="mt-0.5 text-[11px] text-ink-soft">
									{count} {count === 1 ? "invoice" : "invoices"}
								</p>
								{isWarning && amount > 0 && (
									<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-coral">
										Escalation required
									</p>
								)}
							</div>
						);
					})}
				</div>
			</section>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by customer, invoice, or account reference..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{bucketFilters.map((b) => (
							<button
								key={b}
								type="button"
								onClick={() => setBucketFilter(b)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									bucketFilter === b
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{b === "all" ? "All ages" : b}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
					{stageFilters.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setStageFilter(s)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								stageFilter === s
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							{s === "all" ? "All stages" : s}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Banknote className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No overdue accounts match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different customer, bucket, or stage.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((a) => (
							<li key={a.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
								<div
									className={cn(
										"grid size-11 shrink-0 place-items-center rounded-xl",
										a.stage === "Legal" || a.stage === "Pre-legal"
											? "bg-coral/10 text-coral"
											: a.stage === "Final notice"
											? "bg-orange/10 text-orange-deep"
											: "bg-teal/10 text-teal-deep"
									)}
								>
									{a.stage === "Legal" || a.stage === "Pre-legal" ? (
										<ShieldAlert className="size-5" />
									) : (
										<Banknote className="size-5" />
									)}
								</div>

								<div className="min-w-[260px] flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-[13px] font-semibold text-ink">{a.customer}</p>
										<StatusBadge label={a.bucket} tone={statusTone(a.bucket)} />
										<span
											className={cn(
												"rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
												a.stage === "Legal" || a.stage === "Pre-legal"
													? "bg-coral/10 text-coral"
													: a.stage === "Final notice"
													? "bg-orange/10 text-orange-deep"
													: "bg-sand text-ink-soft"
											)}
										>
											{a.stage}
										</span>
									</div>
									<p className="mt-1 text-[12px] text-ink-soft">
										<span className="font-mono">{a.invoiceRef}</span> ·{" "}
										<span className="font-mono">{a.accountRef}</span>
									</p>
									<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
										Issued {a.invoiceDate} · Due {a.dueDate} ·{" "}
										<span
											className={cn(
												a.daysOverdue > 0 ? "text-coral" : "text-ink-soft"
											)}
										>
											{a.daysOverdue} days overdue
										</span>
									</p>
								</div>

								<div className="min-w-[180px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Amount
									</p>
									<p className="mt-1 font-display text-xl font-bold text-ink">
										{formatNaira(a.amount)}
									</p>
								</div>

								<div className="min-w-[220px]">
									<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
										Last contact
									</p>
									<p className="mt-1 font-mono text-[11px] text-ink-soft">
										{a.lastContact}
									</p>
									<p className="mt-1 text-[11px] text-ink">
										Next: <span className="font-semibold">{a.nextAction}</span>
									</p>
									<p className="mt-0.5 font-mono text-[10px] text-orange-deep">
										{a.nextActionDate}
									</p>
								</div>

								<div className="ml-auto flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelected(a)}
										className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
									>
										Manage <ArrowRight className="ml-1 size-3.5" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {accounts.length} overdue accounts
					</span>
					<span>All reminders and stage changes are logged</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div>
						<div className="flex items-center gap-2">
							<Sparkles className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Dunning process
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Standard escalation from reminder to legal
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Reminders escalate through the standard stages based on ageing. Movement to
							pre-legal or legal requires supervisor review and is recorded with a
							reason.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Stage thresholds
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
								Reminder sent · day 1 overdue
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
								Second reminder · day 10 overdue
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
								Final notice · day 30 overdue
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
								Pre-legal · day 60 overdue
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
								Legal · day 90 overdue
							</li>
						</ul>
					</div>
				</div>
			</div>

			{selected && (
				<CollectionDetailDialog
					account={selected}
					onClose={() => setSelected(null)}
					onSendReminder={(channel) => handleSendReminder(selected.id, channel)}
					onAdvance={(stage, note) => handleAdvance(selected.id, stage, note)}
				/>
			)}
		</AppShell>
	);
}

function CollectionDetailDialog({
	account,
	onClose,
	onSendReminder,
	onAdvance,
}: {
	account: CollectionAccount;
	onClose: () => void;
	onSendReminder: (channel: "Email" | "SMS" | "Call") => void;
	onAdvance: (stage: DunningStage, note: string) => void;
}) {
	const [note, setNote] = useState("");
	const [intent, setIntent] = useState<DunningStage | null>(null);

	const stages: DunningStage[] = [
		"Reminder sent",
		"Second reminder",
		"Final notice",
		"Pre-legal",
		"Legal",
	];

	const canSubmit =
		intent !== null &&
		(intent === "Pre-legal" || intent === "Legal" ? note.trim().length >= 5 : true);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Collection account
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{account.customer}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							<span className="font-mono">{account.invoiceRef}</span> ·{" "}
							{formatNaira(account.amount)} · {account.daysOverdue} days overdue
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
						<StatusBadge label={account.bucket} tone={statusTone(account.bucket)} />
						<span
							className={cn(
								"rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
								account.stage === "Legal" || account.stage === "Pre-legal"
									? "bg-coral/10 text-coral"
									: account.stage === "Final notice"
									? "bg-orange/10 text-orange-deep"
									: "bg-sand text-ink-soft"
							)}
						>
							Stage: {account.stage}
						</span>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Amount
							</p>
							<p className="mt-1 font-display text-lg font-bold text-ink">
								{formatNaira(account.amount)}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Due date
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{account.dueDate}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Days overdue
							</p>
							<p
								className={cn(
									"mt-1 font-mono text-[13px] font-bold",
									account.daysOverdue > 30 ? "text-coral" : "text-orange-deep"
								)}
							>
								{account.daysOverdue}
							</p>
						</div>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Notes
						</p>
						<div className="mt-2 rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="text-[13px] leading-6 text-ink-soft">{account.notes}</p>
						</div>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Send reminder
						</p>
						<div className="mt-3 grid gap-2 sm:grid-cols-3">
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={() => onSendReminder("Email")}
							>
								<Mail className="mr-1.5 size-4" /> Email
							</Button>
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={() => onSendReminder("SMS")}
							>
								<MessageSquare className="mr-1.5 size-4" /> SMS
							</Button>
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={() => onSendReminder("Call")}
							>
								<Phone className="mr-1.5 size-4" /> Log call
							</Button>
						</div>
					</div>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Advance dunning stage
						</p>
						<div className="mt-3 space-y-2">
							{stages.map((s) => {
								const active = intent === s;
								return (
									<button
										key={s}
										type="button"
										onClick={() => setIntent(s)}
										className={cn(
											"flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
											active
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-sand hover:bg-sand-2"
										)}
									>
										<span className="text-[13px] font-semibold text-ink">{s}</span>
										{active && (
											<span className="grid size-5 place-items-center rounded-full bg-orange text-white">
												<Check className="size-3" />
											</span>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{(intent === "Pre-legal" || intent === "Legal") && (
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Reason for escalation
							</p>
							<textarea
								value={note}
								onChange={(e) => setNote(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Document the escalation decision. This is recorded to the audit trail."
							/>
						</div>
					)}

					{account.contactPhone && (
						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<User className="mt-0.5 size-4 shrink-0 text-ink-soft" />
								<div className="text-[12px] leading-5 text-ink-soft">
									<p>
										Contact:{" "}
										<span className="font-mono text-ink">{account.contactEmail}</span>
									</p>
									<p className="mt-1">
										Phone:{" "}
										<span className="font-mono text-ink">{account.contactPhone}</span>
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
					<Button
						disabled={!canSubmit}
						onClick={() => {
							if (intent && canSubmit) onAdvance(intent, note);
						}}
						className={cn(
							"bg-orange text-white hover:bg-orange-deep",
							!canSubmit && "opacity-60"
						)}
					>
						{intent ? `Move to ${intent}` : "Select a stage"} <ArrowRight />
					</Button>
				</div>
			</div>
		</div>
	);
}