
import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format_currency } from "@/lib/functions";
import { http, type Resp } from "@/lib/httpClient";

type CreditTierStatus = "Active" | "Inactive";
type DurationUnit = "DAYS" | "MONTHS" | "YEARS";

interface CreditTier {
	id: string;
	name: string;
	code: string;
	description: string;
	minimumLimit: number;
	maximumLimit: number;
	paymentDuration: number;
	paymentUnit: DurationUnit;
	interestRate: number;
	status: CreditTierStatus;
	createdAt: string;
	updatedAt: string;
}

interface ApiCreditTier {
	id: string;
	name: string;
	code: string;
	description: string;
	minimum_limit: string | number;
	maximum_limit: string | number;
	payment_duration: string | number;
	payment_unit: string;
	interest_rate: string | number;
	status: string;
	created_at?: string;
	updated_at?: string;
}

const statusFilters: (CreditTierStatus | "all")[] = [
	"all",
	"Active",
	"Inactive",
];

function normaliseUnit(value?: string): DurationUnit {
	const unit = value?.toUpperCase();

	if (unit === "DAYS" || unit === "DAY") return "DAYS";
	if (unit === "YEARS" || unit === "YEAR") return "YEARS";

	return "MONTHS";
}

function formatPaymentDuration(value: number, unit: DurationUnit) {
	const label =
		value === 1
			? unit === "DAYS"
				? "day"
				: unit === "MONTHS"
					? "month"
					: "year"
			: unit.toLowerCase();

	return `${value} ${label}`;
}

function formatDate(value?: string) {
	if (!value) return "—";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function getCreditTiers(payload: unknown): ApiCreditTier[] {
	if (Array.isArray(payload)) {
		return payload as ApiCreditTier[];
	}

	if (!payload || typeof payload !== "object") {
		return [];
	}

	const data = payload as Record<string, unknown>;

	const tiers =
		data["credit_tiers"] ??
		data["creditTiers"] ??
		data["tiers"] ??
		data["items"] ??
		data["data"];

	return Array.isArray(tiers) ? (tiers as ApiCreditTier[]) : [];
}

function mapCreditTier(tier: ApiCreditTier): CreditTier {
	return {
		id: String(tier.id),
		name: String(tier.name ?? ""),
		code: String(tier.code ?? ""),
		description: String(tier.description ?? ""),
		minimumLimit: Number(tier.minimum_limit ?? 0),
		maximumLimit: Number(tier.maximum_limit ?? 0),
		paymentDuration: Number(tier.payment_duration ?? 0),
		paymentUnit: normaliseUnit(tier.payment_unit),
		interestRate: Number(tier.interest_rate ?? 0),
		status:
			String(tier.status).toUpperCase() === "ACTIVE"
				? "Active"
				: "Inactive",
		createdAt: formatDate(tier.created_at),
		updatedAt: formatDate(tier.updated_at),
	};
}

export default function FinanceCreditTiersPage() {
	const [tiers, setTiers] = useState<CreditTier[]>([]);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<CreditTierStatus | "all">("all");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

	const fetchCreditTiers = async () => {
		setLoading(true);
		setLoadError(false);

		try {
			const res = await http.get("/credit-tiers/");
			const resp: Resp = res.data;

			if (resp.error) {
				setLoadError(true);
				toast.error(String(resp.data || "Could not load credit tiers."));
				return;
			}

			const apiTiers = getCreditTiers(resp.code);
			setTiers(apiTiers.map(mapCreditTier));
		} catch (error) {
			setLoadError(true);
			toast.error(
				error instanceof Error
					? error.message
					: "Could not load credit tiers."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCreditTiers();
	}, []);

	const filtered = useMemo(() => {
		return tiers.filter((tier) => {
			const search = query.toLowerCase();

			const matchQuery =
				tier.name.toLowerCase().includes(search) ||
				tier.code.toLowerCase().includes(search) ||
				tier.description.toLowerCase().includes(search);

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

	const toggleStatus = async (tier: CreditTier) => {
		const status = tier.status === "Active" ? "INACTIVE" : "ACTIVE";

		setUpdatingStatus(tier.id);

		try {
			const res = await http.post("/credit-tiers/change-status/", {
				id: tier.id,
				status,
			});

			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(String(resp.data || "Could not change credit tier status."));
				return;
			}

			setTiers((current) =>
				current.map((item) =>
					item.id === tier.id
						? {
								...item,
								status: status === "ACTIVE" ? "Active" : "Inactive",
							}
						: item
				)
			);

			toast.success(
				`Credit tier ${status === "ACTIVE" ? "activated" : "deactivated"} successfully.`
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not change credit tier status."
			);
		} finally {
			setUpdatingStatus(null);
		}
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
						<Button
							type="button"
							variant="outline"
							onClick={fetchCreditTiers}
							disabled={loading}
							className="border-line bg-paper text-ink"
						>
							Refresh
						</Button>

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
						tone="info"
						icon={ShieldCheck}
					/>
					<Metric
						label="Inactive tiers"
						value={String(stats.inactive)}
						detail="Unavailable for applications"
						tone="warning"
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

					{loading ? (
						<div className="p-12 text-center">
							<div className="mx-auto size-7 animate-spin rounded-full border-2 border-line border-t-orange" />
							<p className="mt-3 text-sm text-ink-soft">
								Loading credit tiers...
							</p>
						</div>
					) : loadError ? (
						<div className="p-12 text-center">
							<CreditCard className="mx-auto size-7 text-ink-soft" />
							<p className="mt-3 font-medium text-ink">
								Could not load credit tiers.
							</p>
							<p className="mt-1 text-[12px] text-ink-soft">
								Check your connection and try again.
							</p>
							<Button
								type="button"
								onClick={fetchCreditTiers}
								className="mt-4 bg-orange text-white hover:bg-orange-deep"
							>
								Try again
							</Button>
						</div>
					) : filtered.length === 0 ? (
						<div className="p-12 text-center">
							<CreditCard className="mx-auto size-7 text-ink-soft" />
							<p className="mt-3 font-medium text-ink">
								{tiers.length === 0
									? "No credit tiers have been created."
									: "No credit tiers found."}
							</p>
							<p className="mt-1 text-[12px] text-ink-soft">
								{tiers.length === 0
									? "Create a credit tier to make it available for organisation applications."
									: "Try a different search or status filter."}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[950px] text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										<th className="px-4 py-3 font-medium">Credit tier</th>
										<th className="px-4 py-3 text-right font-medium">
											Minimum limit
										</th>
										<th className="px-4 py-3 text-right font-medium">
											Maximum limit
										</th>
										<th className="px-4 py-3 font-medium">Payment terms</th>
										<th className="px-4 py-3 font-medium">Interest rate</th>
										<th className="px-4 py-3 font-medium">Status</th>
										<th className="px-4 py-3 text-right font-medium">Action</th>
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
													<p className="mt-1 font-mono text-[10px] text-ink-soft">
														{tier.code}
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
													{formatPaymentDuration(
														tier.paymentDuration,
														tier.paymentUnit
													)}
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
														disabled={updatingStatus === tier.id}
														onClick={() => toggleStatus(tier)}
														className={cn(
															"cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
															tier.status === "Active"
																? "text-coral hover:bg-coral/10"
																: "text-orange-deep hover:bg-orange/10"
														)}
													>
														{updatingStatus === tier.id
															? "Updating..."
															: tier.status === "Active"
																? "Deactivate"
																: "Activate"}
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
									<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
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
