import { Link } from "@/components/router-link";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Coins,
	Download,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

export default function FinanceDashboardRoute() {
	const revenueStreams = [
		{
			label: "Terminal Handling Charges (THC)",
			amount: "₦14.2m",
			share: "52%",
			trend: "+8.4%",
		},
		{
			label: "Bonded Yard Storage & Escalation",
			amount: "₦7.8m",
			share: "28%",
			trend: "+12.1%",
		},
		{
			label: "Examination Coordination",
			amount: "₦3.4m",
			share: "12%",
			trend: "+4.2%",
		},
		{
			label: "Reefer Cold Chain Monitoring",
			amount: "₦1.6m",
			share: "6%",
			trend: "+15.0%",
		},
		{
			label: "Weighbridge Operations",
			amount: "₦540k",
			share: "2%",
			trend: "+1.8%",
		},
	];

	const recentSettlements = [
		{
			customer: "Atlantic Trade Nigeria Ltd",
			amount: "₦1,850,000",
			ref: "TRN-RCP-00841",
			date: "Today · 11:24",
			status: "Reconciled",
		},
		{
			customer: "Kano Freight Forwarders",
			amount: "₦2,640,000",
			ref: "TRN-RCP-00842",
			date: "Yesterday",
			status: "Reconciled",
		},
		{
			customer: "Meridian Customs Services",
			amount: "₦980,000",
			ref: "TRN-RCP-00844",
			date: "07 Sep 2026",
			status: "Reconciled",
		},
		{
			customer: "Sahara Energy Logistics",
			amount: "₦640,000",
			ref: "TRN-RCP-00843",
			date: "08 Sep 2026",
			status: "Pending",
		},
	];

	return (
		<AppShell title="Finance Dashboard" eyebrow="Finance Workspace · Revenue & Collections">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Commercial analytics · Treasury & collections
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Revenue performance & settlement liquidity
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Monitor terminal collections, storage accruals, bank settlements, and overdue
						invoices.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Executive finance summary exported locally.")}
					>
						<Download className="size-4" /> Download Report
					</Button>
					<Link to="/finance/invoices">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							View Invoices <ArrowRight className="size-4" />
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="M-T-D Collections"
					value="₦27.54m"
					detail="+14.2% vs target"
					tone="success"
					icon={Wallet}
				/>
				<Metric
					label="Outstanding Receivables"
					value="₦4.49m"
					detail="2 invoices overdue"
					tone="critical"
					icon={AlertTriangle}
				/>
				<Metric
					label="Unallocated Receipts"
					value="₦640k"
					detail="2 pending deposit matches"
					tone="warning"
					icon={Coins}
				/>
				<Metric
					label="Collection Efficiency"
					value="94.8%"
					detail="Avg collection: 3.2 days"
					tone="success"
					icon={TrendingUp}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-12">
				<section className="rounded-xl bg-paper p-6 ring-1 ring-line lg:col-span-7">
					<div className="flex items-center justify-between border-b border-line pb-4">
						<div>
							<h3 className="font-display text-base font-bold text-ink">
								Revenue streams breakdown
							</h3>
							<p className="text-xs text-ink-soft">
								Monthly fee distribution across terminal operations
							</p>
						</div>
						<span className="font-mono text-xs font-semibold text-orange-deep">
							Total: ₦27.54m
						</span>
					</div>

					<div className="mt-5 space-y-4">
						{revenueStreams.map((s) => (
							<div key={s.label}>
								<div className="flex items-center justify-between text-xs">
									<span className="font-medium text-ink">{s.label}</span>
									<div className="flex items-center gap-3">
										<span className="font-mono font-bold text-ink">{s.amount}</span>
										<span className="font-mono text-[10px] text-orange-deep">
											{s.trend}
										</span>
										<span className="w-10 text-right font-mono text-xs text-ink-soft">
											{s.share}
										</span>
									</div>
								</div>
								<div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand">
									<div
										className="h-full rounded-full bg-orange"
										style={{ width: s.share }}
									/>
								</div>
							</div>
						))}
					</div>

					<div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-ink-soft">
						<span>Storage escalation applies after configured free days</span>
						<Link
							to="/finance/tariffs"
							className="font-semibold text-orange-deep hover:underline"
						>
							Inspect Tariff Matrix →
						</Link>
					</div>
				</section>

				<section className="rounded-xl bg-paper p-6 ring-1 ring-line lg:col-span-5">
					<div className="flex items-center justify-between border-b border-line pb-4">
						<div>
							<h3 className="font-display text-base font-bold text-ink">
								Recent bank settlements
							</h3>
							<p className="text-xs text-ink-soft">Confirmed receipts reconciled this week</p>
						</div>
						<Link
							to="/finance/payments"
							className="text-xs font-semibold text-orange-deep hover:underline"
						>
							View All
						</Link>
					</div>

					<div className="mt-4 divide-y divide-line">
						{recentSettlements.map((item) => (
							<div key={item.ref} className="py-3 first:pt-0 last:pb-0">
								<div className="flex items-center justify-between">
									<p className="text-xs font-semibold text-ink">{item.customer}</p>
									<span className="font-mono text-xs font-bold text-orange-deep">
										{item.amount}
									</span>
								</div>
								<div className="mt-1 flex items-center justify-between text-[11px] text-ink-soft">
									<span className="font-mono">{item.ref}</span>
									<span>{item.date}</span>
								</div>
							</div>
						))}
					</div>

					<div className="mt-6 rounded-lg bg-sand p-4 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="size-4 text-orange" />
							<p className="text-xs font-semibold text-ink">Financial clearance signal</p>
						</div>
						<p className="mt-1 text-[11px] leading-5 text-ink-soft">
							Satisfied financial obligations are surfaced to the release workflow.
							Authorised release remains with the responsible officer.
						</p>
					</div>
				</section>
			</div>
		</AppShell>
	);
}