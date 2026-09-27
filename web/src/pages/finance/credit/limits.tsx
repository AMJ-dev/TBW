import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Building2,
	Check,
	ChevronLeft,
	Clock3,
	Download,
	Filter,
	History,
	Plus,
	Search,
	ShieldAlert,
	ShieldCheck,
	Wallet,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CustomerTier = "Starter" | "Standard" | "Corporate";
type CustomerStatus =
	| "Healthy"
	| "Approaching limit"
	| "At limit"
	| "Blocked"
	| "Application pending";

interface CustomerCredit {
	id: string;
	customer: string;
	accountRef: string;
	tier: CustomerTier;
	limit: number;
	exposure: number;
	available: number;
	utilisation: number;
	paymentTerms: string;
	oldestOverdue: string;
	status: CustomerStatus;
	lastReviewed: string;
	notes: string;
}

const initialCustomers: CustomerCredit[] = [
	{
		id: "cc-1",
		customer: "Atlantic Trade Nigeria Ltd",
		accountRef: "TRN-CUST-0142",
		tier: "Corporate",
		limit: 25000000,
		exposure: 4490000,
		available: 20510000,
		utilisation: 18,
		paymentTerms: "30 days",
		oldestOverdue: "—",
		status: "Healthy",
		lastReviewed: "12 Sep 2026",
		notes: "Long-standing customer. No payment issues.",
	},
	{
		id: "cc-2",
		customer: "Kano Freight Forwarders",
		accountRef: "TRN-CUST-0281",
		tier: "Standard",
		limit: 10000000,
		exposure: 8640000,
		available: 1360000,
		utilisation: 86,
		paymentTerms: "21 days",
		oldestOverdue: "12 Sep 2026",
		status: "Approaching limit",
		lastReviewed: "03 Aug 2026",
		notes: "Growth in trade volume. Consider tier review.",
	},
	{
		id: "cc-3",
		customer: "Meridian Customs Services",
		accountRef: "TRN-CUST-0073",
		tier: "Standard",
		limit: 10000000,
		exposure: 9680000,
		available: 320000,
		utilisation: 97,
		paymentTerms: "21 days",
		oldestOverdue: "08 Sep 2026",
		status: "At limit",
		lastReviewed: "22 Aug 2026",
		notes: "New invoices on hold until settlement.",
	},
	{
		id: "cc-4",
		customer: "Sahara Energy Logistics",
		accountRef: "TRN-CUST-0194",
		tier: "Corporate",
		limit: 50000000,
		exposure: 51200000,
		available: 0,
		utilisation: 102,
		paymentTerms: "30 days",
		oldestOverdue: "14 Sep 2026",
		status: "Blocked",
		lastReviewed: "05 Sep 2026",
		notes: "Blocked after exceeding limit. Finance review required before unblocking.",
	},
	{
		id: "cc-5",
		customer: "Coastal Freight Nigeria",
		accountRef: "TRN-CUST-0338",
		tier: "Starter",
		limit: 2000000,
		exposure: 0,
		available: 2000000,
		utilisation: 0,
		paymentTerms: "14 days",
		oldestOverdue: "—",
		status: "Application pending",
		lastReviewed: "—",
		notes: "Credit application submitted 24 Sep 2026. Awaiting finance review.",
	},
];

const statusFilters: (CustomerStatus | "all")[] = [
	"all",
	"Healthy",
	"Approaching limit",
	"At limit",
	"Blocked",
	"Application pending",
];

const tierFilters: (CustomerTier | "all")[] = [
	"all",
	"Starter",
	"Standard",
	"Corporate",
];

const formatNaira = (amount: number) =>
	new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0,
	}).format(amount);

export default function FinanceCreditLimitsRoute() {
	const [customers, setCustomers] = useState<CustomerCredit[]>(initialCustomers);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
	const [tierFilter, setTierFilter] = useState<CustomerTier | "all">("all");
	const [selected, setSelected] = useState<CustomerCredit | null>(null);
	const [isAdjustOpen, setIsAdjustOpen] = useState(false);
	const [adjustTarget, setAdjustTarget] = useState<CustomerCredit | null>(null);

	const filtered = useMemo(() => {
		return customers.filter((c) => {
			const matchQuery =
				c.customer.toLowerCase().includes(query.toLowerCase()) ||
				c.accountRef.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || c.status === statusFilter;
			const matchTier = tierFilter === "all" || c.tier === tierFilter;
			return matchQuery && matchStatus && matchTier;
		});
	}, [customers, query, statusFilter, tierFilter]);

	const stats = useMemo(() => {
		const total = customers.length;
		const totalLimit = customers.reduce((sum, c) => sum + c.limit, 0);
		const totalExposure = customers.reduce((sum, c) => sum + c.exposure, 0);
		const blocked = customers.filter((c) => c.status === "Blocked").length;
		const approaching = customers.filter(
			(c) => c.status === "Approaching limit" || c.status === "At limit"
		).length;
		const portfolioUtilisation =
			totalLimit > 0 ? Math.round((totalExposure / totalLimit) * 100) : 0;
		return {
			total,
			totalLimit,
			totalExposure,
			blocked,
			approaching,
			portfolioUtilisation,
		};
	}, [customers]);

	const handleAdjust = (
		id: string,
		newLimit: number,
		newTier: CustomerTier,
		reason: string
	) => {
		setCustomers((prev) =>
			prev.map((c) => {
				if (c.id !== id) return c;
				const available = newLimit - c.exposure;
				const utilisation = newLimit > 0 ? Math.round((c.exposure / newLimit) * 100) : 0;
				const status: CustomerStatus =
					c.status === "Application pending"
						? "Healthy"
						: utilisation >= 100
						? "Blocked"
						: utilisation >= 90
						? "At limit"
						: utilisation >= 75
						? "Approaching limit"
						: "Healthy";
				return {
					...c,
					tier: newTier,
					limit: newLimit,
					available: Math.max(available, 0),
					utilisation,
					status,
					lastReviewed: new Date().toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					}),
					notes: `${c.notes} Limit adjusted to ${formatNaira(newLimit)}. Reason: ${reason}`,
				};
			})
		);
		toast.success("Credit limit updated.");
		setAdjustTarget(null);
		setSelected(null);
	};

	const handleBlock = (id: string) => {
		setCustomers((prev) =>
			prev.map((c) => (c.id === id ? { ...c, status: "Blocked" as CustomerStatus } : c))
		);
		toast.success("Account blocked for new invoices.");
	};

	const handleUnblock = (id: string) => {
		setCustomers((prev) =>
			prev.map((c) =>
				c.id === id
					? {
							...c,
							status:
								c.utilisation >= 100
									? ("Blocked" as CustomerStatus)
									: c.utilisation >= 90
									? ("At limit" as CustomerStatus)
									: c.utilisation >= 75
									? ("Approaching limit" as CustomerStatus)
									: ("Healthy" as CustomerStatus),
						}
					: c
			)
		);
		toast.success("Account unblocked.");
	};

	return (
		<AppShell title="Credit limits" eyebrow="Finance · Credit control">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Finance workspace · Credit control
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Credit limits & exposure
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Monitor credit limits, current exposure, and utilisation across the portfolio.
						Adjusting a limit is logged to the audit trail; blocking an account stops new
						invoices from being raised.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link to="/finance/credit/apply">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ChevronLeft className="mr-1.5 size-4" /> Credit application
						</Button>
					</Link>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Exposure report exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export exposure
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total portfolio limit"
					value={formatNaira(stats.totalLimit)}
					detail={`${stats.total} customers`}
					tone="info"
					icon={Wallet}
				/>
				<Metric
					label="Total exposure"
					value={formatNaira(stats.totalExposure)}
					detail={`${stats.portfolioUtilisation}% of portfolio`}
					tone={stats.portfolioUtilisation >= 90 ? "critical" : stats.portfolioUtilisation >= 75 ? "warning" : "success"}
					icon={ShieldCheck}
				/>
				<Metric
					label="Approaching limit"
					value={String(stats.approaching)}
					detail="75%+ utilisation"
					tone={stats.approaching > 0 ? "warning" : "success"}
					icon={AlertTriangle}
				/>
				<Metric
					label="Blocked accounts"
					value={String(stats.blocked)}
					detail="New invoices prevented"
					tone={stats.blocked > 0 ? "critical" : "success"}
					icon={ShieldAlert}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by customer name or account reference..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
					{tierFilters.map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setTierFilter(t)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
								tierFilter === t
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							{t === "all" ? "All tiers" : t}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Wallet className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No customers match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different customer, tier, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Customer</th>
									<th className="px-4 py-3 font-medium">Tier</th>
									<th className="px-4 py-3 font-medium text-right">Limit</th>
									<th className="px-4 py-3 font-medium text-right">Exposure</th>
									<th className="px-4 py-3 font-medium text-right">Available</th>
									<th className="px-4 py-3 font-medium">Utilisation</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((c) => (
									<tr
										key={c.id}
										className={cn(
											"transition-colors hover:bg-sand/60",
											c.status === "Blocked" && "bg-coral/5"
										)}
									>
										<td className="px-4 py-3.5">
											<p className="text-[13px] font-semibold text-ink">
												{c.customer}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{c.accountRef} · {c.paymentTerms}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
												{c.tier}
											</span>
										</td>
										<td className="px-4 py-3.5 text-right font-mono text-[12px] text-ink">
											{formatNaira(c.limit)}
										</td>
										<td className="px-4 py-3.5 text-right font-mono text-[12px] text-ink">
											{formatNaira(c.exposure)}
										</td>
										<td
											className={cn(
												"px-4 py-3.5 text-right font-mono text-[12px]",
												c.available === 0 ? "text-coral" : "text-teal-deep"
											)}
										>
											{formatNaira(c.available)}
										</td>
										<td className="px-4 py-3.5">
											<div className="flex items-center gap-2">
												<div className="h-1.5 w-[100px] overflow-hidden rounded-full bg-sand-2">
													<div
														className={cn(
															"h-full rounded-full",
															c.utilisation >= 100
																? "bg-coral"
																: c.utilisation >= 90
																? "bg-coral"
																: c.utilisation >= 75
																? "bg-orange"
																: "bg-teal"
														)}
														style={{ width: `${Math.min(c.utilisation, 100)}%` }}
													/>
												</div>
												<span className="font-mono text-[11px] text-ink-soft">
													{c.utilisation}%
												</span>
											</div>
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={c.status}
												tone={statusTone(c.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right">
											<div className="flex items-center justify-end gap-1.5">
												{c.status === "Blocked" ? (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleUnblock(c.id)}
														className="text-[11px] font-semibold text-teal-deep hover:bg-teal/10"
													>
														<Check className="mr-1 size-3.5" />
														Unblock
													</Button>
												) : (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleBlock(c.id)}
														className="text-[11px] font-semibold text-coral hover:bg-coral/10"
													>
														<ShieldAlert className="mr-1 size-3.5" />
														Block
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setAdjustTarget(c);
														setIsAdjustOpen(true);
													}}
													className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
												>
													Adjust
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {customers.length} accounts
					</span>
					<span>Portfolio limit {formatNaira(stats.totalLimit)} · exposure {formatNaira(stats.totalExposure)}</span>
				</div>
			</section>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div>
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								How credit control works
							</p>
						</div>
						<h3 className="mt-3 font-display text-xl font-bold text-ink">
							Block, adjust, or unblock from one place
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Blocking an account prevents new invoices from being raised against it.
							Adjusting the limit recalculates utilisation and status automatically.
							Every change is logged with the reviewer, timestamp, and reason.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Status thresholds
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
								Healthy · utilisation under 75%
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
								Approaching limit · 75% to 89%
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
								At limit · 90% to 99%
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
								Blocked · at or above 100%, or manually blocked
							</li>
						</ul>
					</div>
				</div>
			</div>

			{isAdjustOpen && adjustTarget && (
				<AdjustLimitModal
					customer={adjustTarget}
					onClose={() => {
						setIsAdjustOpen(false);
						setAdjustTarget(null);
					}}
					onSubmit={(newLimit, newTier, reason) =>
						handleAdjust(adjustTarget.id, newLimit, newTier, reason)
					}
				/>
			)}
		</AppShell>
	);
}

function AdjustLimitModal({
	customer,
	onClose,
	onSubmit,
}: {
	customer: CustomerCredit;
	onClose: () => void;
	onSubmit: (newLimit: number, newTier: CustomerTier, reason: string) => void;
}) {
	const [limit, setLimit] = useState(String(customer.limit));
	const [tier, setTier] = useState<CustomerTier>(customer.tier);
	const [reason, setReason] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const parsed = Number(limit.replace(/,/g, ""));
		if (!parsed || parsed < 0) {
			toast.error("Enter a valid limit.");
			return;
		}
		if (reason.trim().length < 5) {
			toast.error("A reason is required and must be at least 5 characters.");
			return;
		}
		onSubmit(parsed, tier, reason);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Adjust credit limit
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								{customer.customer}
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								{customer.accountRef} · current limit{" "}
								{formatNaira(customer.limit)} · exposure{" "}
								{formatNaira(customer.exposure)}
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

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div className="grid gap-3 sm:grid-cols-2">
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									New limit (NGN)
								</span>
								<Input
									value={limit}
									onChange={(e) => setLimit(e.target.value)}
									placeholder="e.g. 15000000"
									className="mt-2 h-11 border-line bg-sand font-mono text-ink"
								/>
							</label>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Tier
								</span>
								<select
									value={tier}
									onChange={(e) => setTier(e.target.value as CustomerTier)}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
								>
									<option value="Starter">Starter</option>
									<option value="Standard">Standard</option>
									<option value="Corporate">Corporate</option>
								</select>
							</label>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Reason for adjustment
								<span className="text-coral"> *</span>
							</span>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="e.g. Approved credit application for Standard tier. Growth in trade volume from customer."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<History className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Audit trail
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										The new limit, tier, reason, and your identity will be recorded
										to the audit trail. The customer's exposure and status are
										recalculated automatically.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Save new limit <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}