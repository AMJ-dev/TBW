
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	ArrowRight,
	Check,
	ClipboardCheck,
	Filter,
	Plus,
	Search,
	Sparkles,
	User,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	getOrders,
	kindMeta,
	statusFilters,
	type ServiceKind,
	type ServiceStatus,
} from "./value-added.data";

export default function OperationsValueAddedPage() {
	const [orders] = useState(getOrders);
	const [query, setQuery] = useState("");
	const [kindFilter, setKindFilter] = useState<ServiceKind | "all">("all");
	const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");

	const filtered = useMemo(() => {
		const search = query.trim().toLowerCase();

		return orders.filter((order) => {
			const matchesSearch =
				!search ||
				[
					order.reference,
					order.container,
					order.consignment,
					order.cargoOwner,
				].some((value) => value.toLowerCase().includes(search));

			return (
				matchesSearch &&
				(kindFilter === "all" || order.kind === kindFilter) &&
				(statusFilter === "all" || order.status === statusFilter)
			);
		});
	}, [orders, query, kindFilter, statusFilter]);

	const stats = useMemo(
		() => ({
			total: orders.length,
			inProgress: orders.filter((order) => order.status === "In progress").length,
			awaiting: orders.filter((order) => order.status === "Awaiting verification").length,
			completed: orders.filter((order) => order.status === "Completed").length,
		}),
		[orders]
	);

	return (
		<AppShell title="Value-added services" eyebrow="Operations · Cargo services">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Value-added
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Value-added services
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage cargo services, work assignments, verification and chargeable
						tariff lines from one place.
					</p>
				</div>

				<Link to="/operations/value-added/new">
					<Button className="bg-orange text-white hover:bg-orange-deep">
						<Plus className="mr-1.5 size-4" />
						New service order
					</Button>
				</Link>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total service orders"
					value={String(stats.total)}
					detail="All recorded orders"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="In progress"
					value={String(stats.inProgress)}
					detail="Currently being handled"
					tone="info"
					icon={Sparkles}
				/>
				<Metric
					label="Awaiting verification"
					value={String(stats.awaiting)}
					detail="Supervisor review pending"
					tone={stats.awaiting ? "warning" : "success"}
					icon={User}
				/>
				<Metric
					label="Completed"
					value={String(stats.completed)}
					detail="Closed service orders"
					tone="success"
					icon={Check}
				/>
			</div>

			<section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
				<div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
					<div className="relative min-w-[240px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search reference, container, consignment or cargo owner..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						<select
							value={kindFilter}
							onChange={(event) =>
								setKindFilter(event.target.value as ServiceKind | "all")
							}
							className="h-10 rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:border-orange"
						>
							<option value="all">All services</option>
							{Object.keys(kindMeta).map((kind) => (
								<option key={kind} value={kind}>{kind}</option>
							))}
						</select>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/30 px-4 py-3">
					{statusFilters.map((status) => (
						<button
							key={status}
							type="button"
							onClick={() => setStatusFilter(status)}
							className={cn(
								"rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
								statusFilter === status
									? "bg-ink text-white"
									: "bg-paper text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							{status === "all" ? "All statuses" : status}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="px-5 py-16 text-center">
						<Sparkles className="mx-auto size-8 text-ink-soft" />
						<p className="mt-3 font-semibold text-ink">No service orders found</p>
						<p className="mt-1 text-sm text-ink-soft">
							Try changing your search or filters.
						</p>
					</div>
				) : (
					<div className="divide-y divide-line">
						{filtered.map((order) => {
							const Icon = kindMeta[order.kind].icon;

							return (
								<div
									key={order.id}
									className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-sand/30"
								>
									<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>

									<div className="min-w-[220px] flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-mono text-xs font-semibold text-ink">
												{order.reference}
											</p>
											<StatusBadge
												label={order.status}
												tone={statusTone(order.status)}
											/>
										</div>
										<p className="mt-1 text-xs text-ink-soft">
											<span className="font-semibold text-ink">{order.container}</span>
											{" · "}{order.consignment} · {order.cargoOwner}
										</p>
										<p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
											{order.kind} · {order.tariffLine} · {order.location}
										</p>
									</div>

									<div className="min-w-[150px]">
										<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
											Assigned to
										</p>
										<p className="mt-1 text-xs font-medium text-ink">
											{order.assignedTo}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{order.scheduledFor}
										</p>
									</div>

									<div className="ml-auto">
										<Link to={`/operations/value-added/${order.id}`}>
											<Button
												variant="ghost"
												size="sm"
												className="text-orange-deep hover:bg-orange/10"
											>
												View order <ArrowRight className="ml-1 size-4" />
											</Button>
										</Link>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>Showing {filtered.length} of {orders.length} service orders</span>
					<span>Value-added services · Operations</span>
				</div>
			</section>
		</AppShell>
	);
}
