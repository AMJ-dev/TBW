import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	Coins,
	CreditCard,
	FileCheck2,
	Receipt,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

const financeSections = [
	{
		title: "Invoices Ledger",
		desc: "Create and track bonded terminal handling charges, storage invoices, and terminal obligation statements.",
		href: "/finance/invoices",
		icon: FileCheck2,
		stat: "₦4.49m Outstanding",
		badge: "Billing",
	},
	{
		title: "Payments & Receipts",
		desc: "Reconcile electronic bank transfers, payment gateway confirmations, and allocate receipts to cargo accounts.",
		href: "/finance/payments",
		icon: Receipt,
		stat: "₦8.12m Collected",
		badge: "Treasury",
	},
	{
		title: "Tariff Matrix",
		desc: "Published rates for lift-off, examination positioning, storage tiers, and reefer points.",
		href: "/finance/tariffs",
		icon: Coins,
		stat: "Effective-dated schedule",
		badge: "Schedule",
	},
	{
		title: "Revenue Analytics",
		desc: "Monthly collections breakdown, cashflow velocity, and billing performance metrics.",
		href: "/finance/dashboard",
		icon: BarChart3,
		stat: "+14.2% MoM",
		badge: "Analytics",
	},
];

export default function FinanceRoute() {
	return (
		<AppShell title="Finance" eyebrow="Commercial & Treasury Operations">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Treasury & Commercial Desk · Abuja Flagship Facility
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Finance & Commercial Operations
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage terminal billing, electronic payments, tariff schedules, and financial
						reconciliation.
					</p>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric label="M-T-D Collected" value="₦27.54m" detail="+14.2% vs target" tone="success" icon={Wallet} />
				<Metric label="Outstanding Invoices" value="₦4.49m" detail="2 overdue" tone="critical" icon={AlertTriangle} />
				<Metric label="Unallocated Receipts" value="₦640k" detail="2 pending allocations" tone="warning" icon={Coins} />
				<Metric label="Collection Rate" value="94.8%" detail="Avg dwell 3.2 days" tone="success" icon={TrendingUp} />
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{financeSections.map((sec) => {
					const Icon = sec.icon;
					return (
						<div
							key={sec.title}
							className="flex flex-col justify-between rounded-xl bg-paper p-6 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div>
								<div className="flex items-center justify-between">
									<div className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>
									<StatusBadge label={sec.badge} tone="info" />
								</div>
								<h3 className="mt-4 font-display text-lg font-bold text-ink">{sec.title}</h3>
								<p className="mt-2 text-xs leading-5 text-ink-soft">{sec.desc}</p>
							</div>

							<div className="mt-6 flex items-center justify-between border-t border-line pt-4">
								<span className="font-mono text-xs text-ink-soft">{sec.stat}</span>
								<Link to={sec.href}>
									<Button
										size="sm"
										className="bg-orange text-white hover:bg-orange-deep"
									>
										Open <ArrowRight className="ml-1 size-3.5" />
									</Button>
								</Link>
							</div>
						</div>
					);
				})}
			</div>
		</AppShell>
	);
}