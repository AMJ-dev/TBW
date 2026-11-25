
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Activity,
	AlertTriangle,
	ArrowDownUp,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	Filter,
	Globe,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserRound,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

interface AuditEntry {
	id: string;
	created_at: string;
	actor_name: string;
	actor_id: string | null;
	action: string;
	category: string;
	entity_type: string | null;
	entity_id: string | null;
	entity_reference: string | null;
	description: string | null;
	reason: string | null;
	ip_address: string | null;
	severity: string;
}

interface AuditPagination {
	page: number;
	limit: number;
	total: number;
	total_pages: number;
}

interface AuditResponsePayload {
	logs?: AuditEntry[];
	summary?: {
		total?: number;
		warnings?: number;
		errors?: number;
		critical?: number;
	};
	pagination?: {
		page?: number;
		limit?: number;
		total?: number;
		total_pages?: number;
	};
}

const PAGE_SIZE = 20;

const formatDate = (value: string) => {
	if (!value) return "—";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
};

const categoryLabel = (value: string) =>
	value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const severityStyle = (severity: string) => {
	switch (severity.toUpperCase()) {
		case "CRITICAL":
			return "border-red-200 bg-red-50 text-red-700";
		case "ERROR":
			return "border-rose-200 bg-rose-50 text-rose-700";
		case "WARNING":
			return "border-amber-200 bg-amber-50 text-amber-700";
		default:
			return "border-orange-200 bg-orange-50 text-orange-700";
	}
};

const severityDot = (severity: string) => {
	switch (severity.toUpperCase()) {
		case "CRITICAL":
			return "bg-red-600";
		case "ERROR":
			return "bg-rose-500";
		case "WARNING":
			return "bg-amber-500";
		default:
			return "bg-orange-500";
	}
};

export default function AdminAuditRoute() {
	const [logs, setLogs] = useState<AuditEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("ALL");
	const [severityFilter, setSeverityFilter] = useState("ALL");
	const [page, setPage] = useState(1);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const [pagination, setPagination] = useState<AuditPagination>({
		page: 1,
		limit: PAGE_SIZE,
		total: 0,
		total_pages: 1,
	});

	const [summary, setSummary] = useState({
		total: 0,
		warnings: 0,
		errors: 0,
		critical: 0,
	});

	const loadLogs = useCallback(async () => {
		setLoading(true);

		try {
			const res = await http.post("/operations/audit/", {
				page,
				limit: PAGE_SIZE,
				search: query.trim(),
				category: categoryFilter === "ALL" ? "" : categoryFilter,
				severity: severityFilter === "ALL" ? "" : severityFilter,
			});

			const resp: Resp = res.data;

			if (resp.error) {
				toast.error("Could not load audit logs.");
				return;
			}

			const payload = resp.data as AuditResponsePayload;
			const records = Array.isArray(payload?.logs) ? payload.logs : [];

			setLogs(records);

			const paginationData = payload?.pagination;

			setPagination({
				page: Number(paginationData?.page ?? page),
				limit: Number(paginationData?.limit ?? PAGE_SIZE),
				total: Number(paginationData?.total ?? records.length),
				total_pages: Math.max(1, Number(paginationData?.total_pages ?? 1)),
			});

			setSummary({
				total: Number(payload?.summary?.total ?? 0),
				warnings: Number(payload?.summary?.warnings ?? 0),
				errors: Number(payload?.summary?.errors ?? 0),
				critical: Number(payload?.summary?.critical ?? 0),
			});
		} catch {
			toast.error("Could not load audit logs.");
		} finally {
			setLoading(false);
		}
	}, [page, query, categoryFilter, severityFilter]);

	useEffect(() => {
		loadLogs();
	}, [loadLogs]);

	const categories = useMemo(
		() => [...new Set(logs.map((log) => log.category).filter(Boolean))],
		[logs]
	);

	const hasFilters =
		query.trim() !== "" ||
		categoryFilter !== "ALL" ||
		severityFilter !== "ALL";

	const clearFilters = () => {
		setQuery("");
		setCategoryFilter("ALL");
		setSeverityFilter("ALL");
		setPage(1);
		setExpandedId(null);
	};

	const handleExport = () => {
		if (!logs.length) {
			toast.error("There are no audit records to export.");
			return;
		}

		const escapeCsv = (value: unknown) =>
			`"${String(value ?? "").replace(/"/g, '""')}"`;

		const rows = [
			[
				"Timestamp",
				"Actor",
				"Action",
				"Category",
				"Resource",
				"Description",
				"Reason",
				"IP Address",
				"Severity",
			],
			...logs.map((log) => [
				log.created_at,
				log.actor_name,
				log.action,
				log.category,
				log.entity_reference ?? log.entity_id ?? "",
				log.description ?? "",
				log.reason ?? "",
				log.ip_address ?? "",
				log.severity,
			]),
		];

		const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");

		anchor.href = url;
		anchor.download = `TRINU-Audit-Log-${new Date().toISOString().slice(0, 10)}.csv`;
		anchor.click();

		URL.revokeObjectURL(url);
		toast.success("Audit records exported.");
	};

	const startRecord = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const endRecord = Math.min(page * PAGE_SIZE, pagination.total);

	return (
		<AppShell title="Audit Trail" eyebrow="Administration · Security & Compliance">
			<div className="space-y-6">
				<div className="relative overflow-hidden rounded-2xl border border-line bg-paper p-5 sm:p-7">
					<div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-orange/5 blur-3xl" />
					<div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
						<div className="max-w-2xl">
							<div className="mb-3 flex items-center gap-2">
								<div className="flex size-9 items-center justify-center rounded-xl bg-orange/10 text-orange">
									<ShieldCheck className="size-5" />
								</div>
								<span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-orange">
									System monitoring
								</span>
							</div>

							<h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
								Audit & Activity Logs
							</h2>
							<p className="mt-2 text-sm leading-6 text-ink-soft">
								Monitor user actions, operational activities, configuration changes,
								and important system events from one central location.
							</p>
						</div>

						<div className="flex shrink-0 flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={loadLogs}
								disabled={loading}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
								Refresh
							</Button>
							<Button
								onClick={handleExport}
								disabled={!logs.length}
								className="bg-orange text-white hover:bg-orange/90"
							>
								<Download className="size-4" />
								Export CSV
							</Button>
						</div>
					</div>
				</div>

				<section className="overflow-hidden rounded-2xl border border-line bg-paper">
					<div className="border-b border-line p-4 sm:p-5">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 className="font-semibold text-ink">Activity history</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Search and inspect recorded system events.
								</p>
							</div>
							<div className="flex items-center gap-2 rounded-lg bg-sand px-3 py-2">
								<Activity className="size-4 text-ink-soft" />
								<span className="font-mono text-xs font-semibold text-ink">
									{pagination.total.toLocaleString()}
								</span>
								<span className="text-xs text-ink-soft">records</span>
							</div>
						</div>

						<div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_170px_auto]">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input
									value={query}
									onChange={(e) => {
										setQuery(e.target.value);
										setPage(1);
										setExpandedId(null);
									}}
									placeholder="Search activity, actor, resource or IP..."
									className="h-10 border-line bg-sand pl-9 text-sm text-ink"
								/>
								{query && (
									<button
										onClick={() => {
											setQuery("");
											setPage(1);
										}}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
									>
										<X className="size-4" />
									</button>
								)}
							</div>

							<div className="relative">
								<Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<select
									value={categoryFilter}
									onChange={(e) => {
										setCategoryFilter(e.target.value);
										setPage(1);
									}}
									className="h-10 w-full appearance-none rounded-md border border-line bg-sand pl-9 pr-8 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/20"
								>
									<option value="ALL">All categories</option>
									{categories.map((category) => (
										<option key={category} value={category}>
											{categoryLabel(category)}
										</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							</div>

							<div className="relative">
								<ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<select
									value={severityFilter}
									onChange={(e) => {
										setSeverityFilter(e.target.value);
										setPage(1);
									}}
									className="h-10 w-full appearance-none rounded-md border border-line bg-sand pl-9 pr-8 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/20"
								>
									<option value="ALL">All severity</option>
									<option value="INFO">Info</option>
									<option value="WARNING">Warning</option>
									<option value="ERROR">Error</option>
									<option value="CRITICAL">Critical</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							</div>

							<Button
								variant="outline"
								onClick={clearFilters}
								disabled={!hasFilters}
								className="h-10 border-line text-ink hover:bg-sand"
							>
								<X className="size-4" />
								Clear
							</Button>
						</div>

						{hasFilters && (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<span className="text-xs text-ink-soft">Active filters:</span>
								{query && (
									<span className="rounded-md bg-sand px-2.5 py-1 text-xs text-ink">
										Search: {query}
									</span>
								)}
								{categoryFilter !== "ALL" && (
									<span className="rounded-md bg-sand px-2.5 py-1 text-xs text-ink">
										{categoryLabel(categoryFilter)}
									</span>
								)}
								{severityFilter !== "ALL" && (
									<span className="rounded-md bg-sand px-2.5 py-1 text-xs text-ink">
										{severityFilter}
									</span>
								)}
							</div>
						)}
					</div>

					<div className="hidden overflow-x-auto md:block">
						<table className="w-full min-w-[900px] text-left">
							<thead>
								<tr className="border-b border-line bg-sand/60">
									<th className="w-[220px] px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Activity
									</th>
									<th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Actor
									</th>
									<th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Resource
									</th>
									<th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Severity
									</th>
									<th className="px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Date & Time
									</th>
									<th className="w-12 px-4 py-3" />
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{loading ? (
									Array.from({ length: 7 }).map((_, index) => (
										<tr key={index}>
											{Array.from({ length: 6 }).map((__, cell) => (
												<td key={cell} className="px-4 py-5">
													<div className="h-4 animate-pulse rounded bg-sand" />
												</td>
											))}
										</tr>
									))
								) : logs.length === 0 ? (
									<tr>
										<td colSpan={6} className="px-5 py-20 text-center">
											<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sand">
												<Search className="size-5 text-ink-soft" />
											</div>
											<p className="mt-3 font-semibold text-ink">
												No activity found
											</p>
											<p className="mt-1 text-sm text-ink-soft">
												Try another search or adjust your filters.
											</p>
										</td>
									</tr>
								) : (
									logs.map((log) => (
										<>
											<tr
												key={log.id}
												onClick={() =>
													setExpandedId((current) =>
														current === log.id ? null : log.id
													)
												}
												className={`cursor-pointer transition-colors hover:bg-sand/50 ${
													expandedId === log.id ? "bg-sand/40" : ""
												}`}
											>
												<td className="px-5 py-4">
													<div className="flex items-start gap-3">
														<div
															className={`mt-1 size-2 shrink-0 rounded-full ${severityDot(log.severity)}`}
														/>
														<div className="min-w-0">
															<p className="text-sm font-semibold text-ink">
																{categoryLabel(log.action)}
															</p>
															<p className="mt-1 text-xs text-ink-soft">
																{categoryLabel(log.category)}
															</p>
														</div>
													</div>
												</td>

												<td className="px-4 py-4">
													<div className="flex items-center gap-2.5">
														<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sand text-ink-soft">
															<UserRound className="size-4" />
														</div>
														<div className="min-w-0">
															<p className="max-w-44 truncate text-sm font-medium text-ink">
																{log.actor_name}
															</p>
															<p className="mt-0.5 text-[11px] text-ink-soft">
																{log.actor_id ? "User account" : "System"}
															</p>
														</div>
													</div>
												</td>

												<td className="px-4 py-4">
													<p className="max-w-48 truncate text-sm font-medium text-ink">
														{log.entity_reference ?? log.entity_id ?? "—"}
													</p>
													<p className="mt-1 text-[11px] text-ink-soft">
														{log.entity_type ? categoryLabel(log.entity_type) : "No resource"}
													</p>
												</td>

												<td className="px-4 py-4">
													<span
														className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${severityStyle(log.severity)}`}
													>
														<span className={`size-1.5 rounded-full ${severityDot(log.severity)}`} />
														{log.severity}
													</span>
												</td>

												<td className="px-4 py-4">
													<p className="whitespace-nowrap text-xs font-medium text-ink">
														{formatDate(log.created_at)}
													</p>
												</td>

												<td className="px-4 py-4 text-right">
													<ChevronDown
														className={`size-4 text-ink-soft transition-transform ${
															expandedId === log.id ? "rotate-180" : ""
														}`}
													/>
												</td>
											</tr>

											{expandedId === log.id && (
												<tr key={`${log.id}-details`} className="bg-sand/30">
													<td colSpan={6} className="px-5 py-4">
														<div className="grid gap-4 lg:grid-cols-3">
															<div className="lg:col-span-2">
																<p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																	Event description
																</p>
																<p className="text-sm leading-6 text-ink">
																	{log.description || "No description provided."}
																</p>
																{log.reason && (
																	<div className="mt-3 rounded-lg border border-line bg-paper p-3">
																		<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																			Reason / Remarks
																		</p>
																		<p className="mt-1 text-sm text-ink">{log.reason}</p>
																	</div>
																)}
															</div>

															<div className="space-y-3 rounded-lg border border-line bg-paper p-3">
																<div>
																	<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																		Origin IP
																	</p>
																	<p className="mt-1 flex items-center gap-2 font-mono text-xs text-ink">
																		<Globe className="size-3.5 text-ink-soft" />
																		{log.ip_address || "Not recorded"}
																	</p>
																</div>
																<div>
																	<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																		Resource ID
																	</p>
																	<p className="mt-1 break-all font-mono text-xs text-ink">
																		{log.entity_id || "Not linked"}
																	</p>
																</div>
																<div>
																	<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																		Log ID
																	</p>
																	<p className="mt-1 break-all font-mono text-[10px] text-ink-soft">
																		{log.id}
																	</p>
																</div>
															</div>
														</div>
													</td>
												</tr>
											)}
										</>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="divide-y divide-line md:hidden">
						{loading ? (
							Array.from({ length: 5 }).map((_, index) => (
								<div key={index} className="space-y-3 p-4">
									<div className="h-4 w-2/3 animate-pulse rounded bg-sand" />
									<div className="h-3 w-1/2 animate-pulse rounded bg-sand" />
								</div>
							))
						) : logs.length === 0 ? (
							<div className="px-4 py-16 text-center">
								<Activity className="mx-auto size-8 text-ink-soft" />
								<p className="mt-3 font-semibold text-ink">No activity found</p>
								<p className="mt-1 text-sm text-ink-soft">
									Adjust your search or filters.
								</p>
							</div>
						) : (
							logs.map((log) => (
								<div key={log.id} className="p-4">
									<button
										onClick={() =>
											setExpandedId((current) =>
												current === log.id ? null : log.id
											)
										}
										className="w-full text-left"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex min-w-0 gap-3">
												<div
													className={`mt-1.5 size-2 shrink-0 rounded-full ${severityDot(log.severity)}`}
												/>
												<div className="min-w-0">
													<p className="text-sm font-semibold text-ink">
														{categoryLabel(log.action)}
													</p>
													<p className="mt-1 text-xs text-ink-soft">
														{categoryLabel(log.category)}
													</p>
												</div>
											</div>
											<ChevronDown
												className={`size-4 shrink-0 text-ink-soft transition-transform ${
													expandedId === log.id ? "rotate-180" : ""
												}`}
											/>
										</div>

										<div className="mt-3 flex flex-wrap items-center gap-2">
											<span
												className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${severityStyle(log.severity)}`}
											>
												{log.severity}
											</span>
											<span className="text-xs text-ink-soft">
												{log.actor_name}
											</span>
										</div>

										<div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-soft">
											<span className="truncate font-mono text-ink">
												{log.entity_reference ?? log.entity_id ?? "No resource"}
											</span>
											<span className="shrink-0">
												{formatDate(log.created_at)}
											</span>
										</div>
									</button>

									{expandedId === log.id && (
										<div className="mt-4 space-y-3 rounded-xl bg-sand/70 p-3">
											<p className="text-sm leading-6 text-ink">
												{log.description || "No description provided."}
											</p>
											{log.reason && (
												<p className="text-xs leading-5 text-ink-soft">
													<strong className="text-ink">Reason:</strong> {log.reason}
												</p>
											)}
											<div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
												<div>
													<p className="text-[10px] uppercase tracking-wide text-ink-soft">
														Origin IP
													</p>
													<p className="mt-1 break-all font-mono text-xs text-ink">
														{log.ip_address || "Not recorded"}
													</p>
												</div>
												<div>
													<p className="text-[10px] uppercase tracking-wide text-ink-soft">
														Resource type
													</p>
													<p className="mt-1 text-xs text-ink">
														{log.entity_type ? categoryLabel(log.entity_type) : "—"}
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							))
						)}
					</div>

					<div className="flex flex-col gap-3 border-t border-line bg-sand/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
						<p className="text-xs text-ink-soft">
							Showing <strong className="text-ink">{startRecord}</strong>– 
							<strong className="text-ink">{endRecord}</strong> of{" "}
							<strong className="text-ink">{pagination.total.toLocaleString()}</strong> records
						</p>

						<div className="flex items-center justify-between gap-3 sm:justify-end">
							<Button
								variant="outline"
								size="sm"
								className="border-line bg-paper"
								disabled={page <= 1 || loading}
								onClick={() => {
									setPage((current) => Math.max(1, current - 1));
									setExpandedId(null);
								}}
							>
								<ChevronLeft className="size-4" />
								Previous
							</Button>

							<span className="whitespace-nowrap font-mono text-xs text-ink-soft">
								{page} / {pagination.total_pages}
							</span>

							<Button
								variant="outline"
								size="sm"
								className="border-line bg-paper"
								disabled={page >= pagination.total_pages || loading}
								onClick={() => {
									setPage((current) =>
										Math.min(pagination.total_pages, current + 1)
									);
									setExpandedId(null);
								}}
							>
								Next
								<ChevronRight className="size-4" />
							</Button>
						</div>
					</div>
				</section>

				<div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-soft">
					<p className="flex items-center gap-2">
						<ShieldCheck className="size-3.5" />
						Audit records are maintained for security and compliance.
					</p>
					<p>Login attempts are maintained separately.</p>
				</div>
			</div>
		</AppShell>
	);
}
