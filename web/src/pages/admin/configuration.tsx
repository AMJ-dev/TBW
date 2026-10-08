import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Coins,
	CreditCard,
	FileCheck2,
	FileSpreadsheet,
	FileText,
	Landmark,
	Receipt,
	RefreshCcw,
	Scale,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

const financeSections = [
	{
		title: "Finance Dashboard",
		desc: "Monitor revenue, collections, outstanding balances, cashflow, receivables, and financial performance across terminal operations.",
		href: "/finance/dashboard",
		icon: BarChart3,
		stat: "₦27.54m MTD collected",
		badge: "Analytics",
		tone: "info" as const,
	},
	{
		title: "Invoice Ledger",
		desc: "Create, review, issue, track, and manage terminal invoices generated from handling, storage, examination, positioning, and other chargeable services.",
		href: "/finance/invoices",
		icon: FileCheck2,
		stat: "₦4.49m outstanding",
		badge: "Billing",
		tone: "warning" as const,
	},
	{
		title: "Payments & Receipts",
		desc: "Record electronic payments, bank transfers, gateway confirmations, receipts, allocations, reversals, and payment status.",
		href: "/finance/payments",
		icon: Receipt,
		stat: "₦8.12m collected",
		badge: "Treasury",
		tone: "success" as const,
	},
	{
		title: "Tariff Matrix",
		desc: "Configure effective-dated terminal rates for handling, storage, lifting, examination positioning, reefer services, documentation, and other chargeable services.",
		href: "/finance/tariffs",
		icon: Coins,
		stat: "Effective-dated schedule",
		badge: "Rates",
		tone: "info" as const,
	},
	{
		title: "Credit Applications",
		desc: "Review customer credit requests, supporting documents, approval decisions, limits, terms, and credit account status.",
		href: "/finance/credit/apply",
		icon: CreditCard,
		stat: "8 applications pending",
		badge: "Credit",
		tone: "warning" as const,
	},
	{
		title: "Credit Limits",
		desc: "Manage approved customer credit limits, utilisation, available balance, payment terms, expiry dates, and exposure.",
		href: "/finance/credit/limits",
		icon: Scale,
		stat: "₦18.6m available",
		badge: "Exposure",
		tone: "info" as const,
	},
	{
		title: "Collections",
		desc: "Track overdue invoices, customer balances, collection activities, promises to pay, escalations, and recovery performance.",
		href: "/finance/collections",
		icon: TrendingDown,
		stat: "₦1.28m overdue",
		badge: "Receivables",
		tone: "critical" as const,
	},
	{
		title: "Customer Statements",
		desc: "View customer account activity, invoices, receipts, credits, adjustments, outstanding balances, and statement history.",
		href: "/finance/statement/atlantic-trade",
		icon: FileText,
		stat: "142 active accounts",
		badge: "Accounts",
		tone: "info" as const,
	},
	{
		title: "Approvals",
		desc: "Review financial approvals including invoice adjustments, credit decisions, discounts, waivers, write-offs, and exceptional charges.",
		href: "/finance/approvals",
		icon: CheckCircle2,
		stat: "6 awaiting approval",
		badge: "Workflow",
		tone: "warning" as const,
	},
	{
		title: "Tax Rules",
		desc: "Configure applicable tax rules, rates, exemptions, effective dates, taxable services, and invoice tax calculations.",
		href: "/finance/tax",
		icon: FileSpreadsheet,
		stat: "VAT 7.5% active",
		badge: "Tax",
		tone: "info" as const,
	},
	{
		title: "Reconciliation",
		desc: "Match bank transactions and payment gateway confirmations against TRINU receipts, investigate exceptions, and close reconciliation periods.",
		href: "/finance/reconciliation",
		icon: RefreshCcw,
		stat: "97.4% reconciled",
		badge: "Control",
		tone: "success" as const,
	},
];

export default function FinanceRoute() {
	return (
		<AppShell title="Finance" eyebrow="Commercial & Treasury Operations">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Commercial · Treasury · Receivables · Financial Control
					</p>

					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Finance & Commercial Operations
					</h2>

					<p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
						Manage terminal billing, tariffs, invoices, payments, credit, collections,
						tax, customer accounts, approvals, and financial reconciliation.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<StatusBadge label="Finance system operational" tone="success" />
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="M-T-D Collected"
					value="₦27.54m"
					detail="+14.2% vs target"
					tone="success"
					icon={Wallet}
				/>

				<Metric
					label="Outstanding Invoices"
					value="₦4.49m"
					detail="2 overdue"
					tone="critical"
					icon={AlertTriangle}
				/>

				<Metric
					label="Unallocated Receipts"
					value="₦640k"
					detail="2 pending allocations"
					tone="warning"
					icon={Coins}
				/>

				<Metric
					label="Collection Rate"
					value="94.8%"
					detail="↑ 3.4% this month"
					tone="success"
					icon={TrendingUp}
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Overdue Receivables"
					value="₦1.28m"
					detail="12 customer accounts"
					tone="critical"
					icon={TrendingDown}
				/>

				<Metric
					label="Credit Exposure"
					value="₦18.6m"
					detail="68.2% of approved limits"
					tone="warning"
					icon={CreditCard}
				/>

				<Metric
					label="Pending Approvals"
					value="6"
					detail="₦1.84m total value"
					tone="warning"
					icon={CheckCircle2}
				/>

				<Metric
					label="Reconciliation"
					value="97.4%"
					detail="2 exceptions"
					tone="success"
					icon={RefreshCcw}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{financeSections.map((section) => {
					const Icon = section.icon;

					return (
						<div
							key={section.title}
							className="flex flex-col justify-between rounded-xl bg-paper p-6 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div>
								<div className="flex items-center justify-between gap-3">
									<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>

									<StatusBadge
										label={section.badge}
										tone={section.tone}
									/>
								</div>

								<h3 className="mt-4 font-display text-lg font-bold text-ink">
									{section.title}
								</h3>

								<p className="mt-2 min-h-[60px] text-xs leading-5 text-ink-soft">
									{section.desc}
								</p>
							</div>

							<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
								<span className="font-mono text-xs text-ink-soft">
									{section.stat}
								</span>

								<Link to={section.href}>
									<Button
										size="sm"
										className="bg-orange text-white hover:bg-orange-deep"
									>
										Open
										<ArrowRight className="ml-1 size-3.5" />
									</Button>
								</Link>
							</div>
						</div>
					);
				})}
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="flex items-center gap-3">
						<div className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<Landmark className="size-4.5" />
						</div>

						<div>
							<p className="text-xs font-semibold text-ink">
								Bank & Treasury
							</p>
							<p className="text-[11px] text-ink-soft">
								Payment channels connected
							</p>
						</div>
					</div>

					<div className="mt-5 flex items-end justify-between">
						<span className="font-display text-2xl font-bold text-ink">
							4
						</span>

						<span className="text-xs text-ink-soft">
							All operational
						</span>
					</div>
				</div>

				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="flex items-center gap-3">
						<div className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<FileCheck2 className="size-4.5" />
						</div>

						<div>
							<p className="text-xs font-semibold text-ink">
								Invoices This Month
							</p>
							<p className="text-[11px] text-ink-soft">
								Generated from terminal activity
							</p>
						</div>
					</div>

					<div className="mt-5 flex items-end justify-between">
						<span className="font-display text-2xl font-bold text-ink">
							284
						</span>

						<span className="text-xs text-success">
							+18.7%
						</span>
					</div>
				</div>

				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="flex items-center gap-3">
						<div className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<BarChart3 className="size-4.5" />
						</div>

						<div>
							<p className="text-xs font-semibold text-ink">
								Revenue Forecast
							</p>
							<p className="text-[11px] text-ink-soft">
								Current billing cycle
							</p>
						</div>
					</div>

					<div className="mt-5 flex items-end justify-between">
						<span className="font-display text-2xl font-bold text-ink">
							₦31.2m
						</span>

						<span className="text-xs text-success">
							+11.6%
						</span>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
