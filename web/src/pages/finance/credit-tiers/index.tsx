
import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Clock3,
	CreditCard,
	Edit3,
	Filter,
	Plus,
	Search,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {format_currency} from "@/lib/functions"

type CreditTierStatus = "Active" | "Inactive";

interface CreditTier {
	id: string;
	name: string;
	description: string;
	minimumLimit: number;
	maximumLimit: number;
	paymentDays: number;
	interestRate: number;
	status: CreditTierStatus;
	createdAt: string;
	updatedAt: string;
}

const initialTiers: CreditTier[] = [
	{
		id: "starter",
		name: "Starter",
		description: "Entry-level credit facility for organisations establishing a payment history with the terminal.",
		minimumLimit: 500000,
		maximumLimit: 2000000,
		paymentDays: 14,
		interestRate: 0,
		status: "Active",
		createdAt: "12 Sep 2026",
		updatedAt: "12 Sep 2026",
	},
	{
		id: "standard",
		name: "Standard",
		description: "Credit facility for established organisations with a consistent transaction and payment history.",
		minimumLimit: 2000000,
		maximumLimit: 10000000,
		paymentDays: 21,
		interestRate: 0,
		status: "Active",
		createdAt: "12 Sep 2026",
		updatedAt: "18 Sep 2026",
	},
	{
		id: "corporate",
		name: "Corporate",
		description: "Extended credit facility for high-volume organisations with an established business relationship.",
		minimumLimit: 10000000,
		maximumLimit: 50000000,
		paymentDays: 30,
		interestRate: 0,
		status: "Active",
		createdAt: "12 Sep 2026",
		updatedAt: "12 Sep 2026",
	},
];

const statusFilters: (CreditTierStatus | "all")[] = [
	"all",
	"Active",
	"Inactive",
];

export default function FinanceCreditTiersPage() {
	const [tiers, setTiers] = useState<CreditTier[]>(initialTiers);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<CreditTierStatus | "all">("all");

	const filtered = useMemo(() => {
		return tiers.filter((tier) => {
			const matchQuery =
				tier.name.toLowerCase().includes(query.toLowerCase()) ||
				tier.description.toLowerCase().includes(query.toLowerCase());

			const matchStatus =
				statusFilter === "all" || tier.status === statusFilter;

			return matchQuery && matchStatus;
		});
	}, [tiers, query, statusFilter]);

	const stats = useMemo(() => {
		const active = tiers.filter((tier) => tier.status === "Active").length;
		const inactive = tiers.filter((tier) => tier.status === "Inactive").length;
		const highestLimit = tiers.reduce(
			(max, tier) => Math.max(max, tier.maximumLimit),
			0
		);

		return {
			total: tiers.length,
			active,
			inactive,
			highestLimit,
		};
	}, [tiers]);

	const toggleStatus = (id: string) => {
		setTiers((current) =>
			current.map((tier) =>
				tier.id === id
					? {
							...tier,
							status: tier.status === "Active" ? "Inactive" : "Active",
							updatedAt: new Date().toLocaleDateString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							}),
						}
					: tier
			)
		);
	};

	return (
		<AppShell title="Credit tiers" eyebrow="Finance · Credit configuration">
			<div className="space-y-5">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Finance workspace · Credit configuration
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Credit tiers
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Manage credit facilities available to organisations, including
							credit limits and repayment terms.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<Link to="/finance/credit-tiers/new">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								<Plus className="mr-1.5 size-4" />
								Create credit tier
							</Button>
						</Link>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Total credit tiers"
						value={String(stats.total)}
						detail="Configured facilities"
						tone="info"
						icon={CreditCard}
					/>
					<Metric
						label="Active tiers"
						value={String(stats.active)}
						detail="Available for applications"
						tone="success"
						icon={ShieldCheck}
					/>
					<Metric
						label="Inactive tiers"
						value={String(stats.inactive)}
						detail="Unavailable for applications"
						tone={stats.inactive > 0 ? "warning" : "success"}
						icon={Clock3}
					/>
					<Metric
						label="Highest credit limit"
						value={format_currency(stats.highestLimit)}
						detail="Maximum configured facility"
						tone="info"
						icon={Wallet}
					/>
				</div>

				<section className="rounded-xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
						<div className="relative min-w-[260px] flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search credit tiers..."
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Filter className="size-4 text-ink-soft" />
							{statusFilters.map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => setStatusFilter(status)}
									className={cn(
										"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
										statusFilter === status
											? "bg-ink text-sand"
											: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									)}
								>
									{status === "all" ? "All" : status}
								</button>
							))}
						</div>
					</div>

					{filtered.length === 0 ? (
						<div className="p-12 text-center">
							<CreditCard className="mx-auto size-7 text-ink-soft" />
							<p className="mt-3 font-medium text-ink">
								No credit tiers found.
							</p>
							<p className="mt-1 text-[12px] text-ink-soft">
								Try a different search or status filter.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[950px] text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										<th className="px-4 py-3 font-medium">Credit tier</th>
										<th className="px-4 py-3 font-medium text-right">Minimum limit</th>
										<th className="px-4 py-3 font-medium text-right">Maximum limit</th>
										<th className="px-4 py-3 font-medium">Payment terms</th>
										<th className="px-4 py-3 font-medium">Interest rate</th>
										<th className="px-4 py-3 font-medium">Status</th>
										<th className="px-4 py-3 font-medium text-right">Action</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-line">
									{filtered.map((tier) => (
										<tr
											key={tier.id}
											className="transition-colors hover:bg-sand/60"
										>
											<td className="px-4 py-4">
												<div>
													<p className="text-[13px] font-semibold text-ink">
														{tier.name}
													</p>
													<p className="mt-1 max-w-[280px] text-[11px] leading-5 text-ink-soft">
														{tier.description}
													</p>
												</div>
											</td>

											<td className="px-4 py-4 text-right font-mono text-[12px] text-ink">
												{format_currency(tier.minimumLimit)}
											</td>

											<td className="px-4 py-4 text-right font-mono text-[12px] font-semibold text-ink">
												{format_currency(tier.maximumLimit)}
											</td>

											<td className="px-4 py-4">
												<span className="inline-flex items-center gap-1.5 text-[12px] text-ink">
													<Clock3 className="size-3.5 text-ink-soft" />
													{tier.paymentDays} days
												</span>
											</td>

											<td className="px-4 py-4 font-mono text-[12px] text-ink">
												{tier.interestRate}%
											</td>

											<td className="px-4 py-4">
												<StatusBadge
													label={tier.status}
													tone={statusTone(tier.status)}
												/>
											</td>

											<td className="px-4 py-4 text-right">
												<div className="flex items-center justify-end gap-1">
													<button
														type="button"
														onClick={() => toggleStatus(tier.id)}
														className={cn(
															"rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
															tier.status === "Active"
																? "text-coral hover:bg-coral/10"
																: "text-teal-deep hover:bg-teal/10"
														)}
													>
														{tier.status === "Active" ? "Deactivate" : "Activate"}
													</button>

													<Link to={`/finance/credit-tiers/${tier.id}`}>
														<Button
															variant="ghost"
															size="sm"
															className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
														>
															<Edit3 className="mr-1 size-3.5" />
															Edit
															<ArrowRight className="ml-1 size-3" />
														</Button>
													</Link>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
						<span>
							Showing {filtered.length} of {tiers.length} credit tiers
						</span>
						<span>
							{stats.active} active · {stats.inactive} inactive
						</span>
					</div>
				</section>

				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
						<div>
							<div className="flex items-center gap-2">
								<ShieldCheck className="size-4 text-orange" />
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Credit tier management
								</p>
							</div>
							<h3 className="mt-3 font-display text-xl font-bold text-ink">
								Configure facilities for organisation applications
							</h3>
							<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
								Credit tiers define the available borrowing limits and repayment
								terms. An organisation's application must still be reviewed and
								approved by the Finance Department before a facility is activated.
							</p>
						</div>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								How it works
							</p>
							<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
									Active tiers are available for new credit applications.
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
									Inactive tiers cannot be selected for new applications.
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-soft" />
									Existing approved facilities should retain their agreed terms.
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
