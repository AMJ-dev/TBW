import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertCircle,
	AlertTriangle,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	FileCheck2,
	Filter,
	Package,
	RefreshCcw,
	Search,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type Shipment = {
	id: string;
	shipment_reference: string;
	organisation_id?: string;
	organisation_name?: string;
	organisation?: string;
	cargo_description?: string;
	shipment_type?: string;
	expected_arrival?: string;
	created_at?: string;
	status: string;
};

const formatDate = (value?: string) => {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

export default function OperationsReviewPage() {
	const navigate = useNavigate();

	const [shipments, setShipments] = useState<Shipment[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");
	const pageSize = 10;

	const loadShipments = useCallback(async (isRefresh = false) => {
		if (isRefresh) setRefreshing(true);
		else setLoading(true);
		setError("");

		try {
			const res = await http.get("/operator/shipments/review/");
			const resp: Resp = res.data;

			if (resp.error) {
				setError(resp.data || "Unable to load shipment declarations.");
				setShipments([]);
				return;
			}

			const list: Shipment[] = Array.isArray(resp.code)
				? resp.code
				: Array.isArray(resp.code?.results)
				? resp.code.results
				: Array.isArray(resp.code?.shipments)
				? resp.code.shipments
				: [];

			setShipments(list);
		} catch (err: any) {
			setError(
				err?.response?.data?.data ||
					err?.response?.data?.message ||
					"Unable to load shipment declarations."
			);
			setShipments([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		void loadShipments();
	}, [loadShipments]);

	const stats = useMemo(() => {
		return {
			total: shipments.length,
			pending: shipments.filter((s) => s.status === "pending_review").length,
			changes: shipments.filter((s) => s.status === "CHANGES_REQUESTED").length,
			approved: shipments.filter((s) => s.status === "EXPECTED").length,
		};
	}, [shipments]);

	const filteredShipments = useMemo(() => {
		const query = search.trim().toLowerCase();
		return shipments.filter((shipment) => {
			const matchesSearch =
				!query ||
				[
					shipment.shipment_reference,
					shipment.organisation_name,
					shipment.organisation,
					shipment.organisation_id,
					shipment.cargo_description,
					shipment.shipment_type,
				].some((value) => value?.toLowerCase().includes(query));

			const matchesStatus =
				statusFilter === "all" || shipment.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [shipments, search, statusFilter]);

	const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
	const currentPage = Math.min(page, totalPages);
	const paginatedShipments = filteredShipments.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	);

	const openReview = (id: string) => {
		navigate(`/operations/shipments/${id}`);
	};

	const handleSearch = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleStatusFilter = (value: string) => {
		setStatusFilter(value);
		setPage(1);
	};

	return (
		<AppShell title="Declaration review" eyebrow="Operations · Shipments">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Operations · Declaration review
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Submitted declarations
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Review submitted shipment declarations, verify supporting documents
						and determine whether each shipment can proceed.
					</p>
				</div>
				<Button
					variant="outline"
					className="border-line bg-paper text-ink hover:bg-sand"
					onClick={() => void loadShipments(true)}
					disabled={loading || refreshing}
				>
					<RefreshCcw className={cn("size-4", refreshing && "animate-spin")} />
					Refresh
				</Button>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total declarations"
					value={loading ? "—" : String(stats.total)}
					detail="Available for review"
					tone="info"
					icon={FileCheck2}
				/>
				<Metric
					label="Pending review"
					value={loading ? "—" : String(stats.pending)}
					detail="Awaiting decision"
					tone="warning"
					icon={AlertCircle}
				/>
				<Metric
					label="Changes requested"
					value={loading ? "—" : String(stats.changes)}
					detail="Returned for correction"
					tone="warning"
					icon={AlertTriangle}
				/>
				<Metric
					label="Approved"
					value={loading ? "—" : String(stats.approved)}
					detail="Cleared to proceed"
					tone="success"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							type="search"
							value={search}
							onChange={(e) => handleSearch(e.target.value)}
							placeholder="Search reference, organisation, cargo..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{[
							{ key: "all", label: "All" },
							{ key: "pending_review", label: "Pending review" },
							{ key: "CHANGES_REQUESTED", label: "Changes requested" },
							{ key: "EXPECTED", label: "Approved" },
							{ key: "REJECTED", label: "Rejected" },
						].map((option) => (
							<button
								key={option.key}
								type="button"
								onClick={() => handleStatusFilter(option.key)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === option.key
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{error && (
					<div className="p-4 sm:p-6">
						<div className="flex items-start gap-3 rounded-xl border border-carmine/30 bg-carmine/5 p-4">
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-carmine" />
							<div className="min-w-0 flex-1">
								<p className="font-display text-sm font-bold text-ink">
									Could not load declarations
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									{error}
								</p>
							</div>
							<Button
								size="sm"
								variant="outline"
								className="border-line bg-paper text-ink hover:bg-sand"
								onClick={() => void loadShipments()}
							>
								Retry
							</Button>
						</div>
					</div>
				)}

				{!error && (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[850px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Shipment</th>
									<th className="px-4 py-3 font-medium">Organisation</th>
									<th className="px-4 py-3 font-medium">Cargo</th>
									<th className="px-4 py-3 font-medium">Submitted</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 text-right font-medium">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{loading ? (
									Array.from({ length: 5 }).map((_, rowIndex) => (
										<tr key={rowIndex}>
											{Array.from({ length: 6 }).map((_, cellIndex) => (
												<td key={cellIndex} className="px-4 py-4">
													<div className="h-4 w-24 animate-pulse rounded bg-sand-2" />
												</td>
											))}
										</tr>
									))
								) : paginatedShipments.length > 0 ? (
									paginatedShipments.map((shipment) => (
										<tr
											key={shipment.id}
											onClick={() => openReview(shipment.id)}
											onKeyDown={(event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													openReview(shipment.id);
												}
											}}
											tabIndex={0}
											role="link"
											aria-label={`Review ${shipment.shipment_reference}`}
											className="cursor-pointer transition-colors hover:bg-sand/60 focus:bg-sand/60 focus:outline-none"
										>
											<td className="px-4 py-3.5">
												<div className="flex items-center gap-3">
													<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
														<Package className="size-4" />
													</span>
													<div className="min-w-0">
														<p className="font-mono text-[12px] font-semibold text-ink">
															{shipment.shipment_reference}
														</p>
														<p className="mt-0.5 text-[11px] text-ink-soft">
															{shipment.shipment_type || "Shipment"}
														</p>
													</div>
												</div>
											</td>

											<td className="px-4 py-3.5">
												<div className="flex items-center gap-2">
													<Building2 className="size-3.5 shrink-0 text-ink-soft" />
													<div className="min-w-0">
														<p className="truncate text-[12px] font-medium text-ink">
															{shipment.organisation_name ||
																shipment.organisation ||
																"—"}
														</p>
														{shipment.organisation_id && (
															<p className="mt-0.5 max-w-[160px] truncate font-mono text-[10px] text-ink-soft">
																{shipment.organisation_id}
															</p>
														)}
													</div>
												</div>
											</td>

											<td className="max-w-[220px] px-4 py-3.5">
												<p className="truncate text-[12px] text-ink-soft">
													{shipment.cargo_description || "Not specified"}
												</p>
											</td>

											<td className="px-4 py-3.5">
												<div className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
													<CalendarDays className="size-3.5 shrink-0" />
													{formatDate(shipment.created_at)}
												</div>
											</td>

											<td className="px-4 py-3.5">
												<StatusBadge
													label={shipment.status
														.replace(/_/g, " ")
														.toLowerCase()
														.replace(/\b\w/g, (c) => c.toUpperCase())}
													tone={statusTone(shipment.status)}
												/>
											</td>

											<td className="px-4 py-3.5 text-right">
												<Button
													size="sm"
													onClick={(event) => {
														event.stopPropagation();
														openReview(shipment.id);
													}}
													className="bg-orange text-white hover:bg-orange-deep"
												>
													Review
												</Button>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={6} className="p-12 text-center">
											<FileCheck2 className="mx-auto size-7 text-ink-soft" />
											<p className="mt-3 font-medium text-ink">
												{search || statusFilter !== "all"
													? "No matching declarations"
													: "No declarations found"}
											</p>
											<p className="mt-1 text-[12px] text-ink-soft">
												{search || statusFilter !== "all"
													? "Try changing your search or status filter."
													: "Submitted declarations will appear here when available."}
											</p>
											{(search || statusFilter !== "all") && (
												<Button
													size="sm"
													variant="outline"
													className="mt-4 border-line bg-paper text-ink hover:bg-sand"
													onClick={() => {
														setSearch("");
														setStatusFilter("all");
														setPage(1);
													}}
												>
													Clear filters
												</Button>
											)}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						{loading
							? "Loading declarations…"
							: filteredShipments.length === 0
							? "No declarations to display"
							: `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
									currentPage * pageSize,
									filteredShipments.length
							  )} of ${filteredShipments.length} declarations`}
					</span>

					<div className="flex items-center gap-1">
						<Button
							size="sm"
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							disabled={currentPage <= 1 || loading}
							onClick={() => setPage((v) => Math.max(1, v - 1))}
						>
							<ChevronLeft className="size-3.5" />
							Previous
						</Button>
						<span className="px-2 text-ink-soft">
							{currentPage} / {totalPages}
						</span>
						<Button
							size="sm"
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							disabled={currentPage >= totalPages || loading}
							onClick={() =>
								setPage((v) => Math.min(totalPages, v + 1))
							}
						>
							Next
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			</section>

			<div className="rounded-xl border border-orange/20 bg-orange/5 p-4">
				<div className="flex items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div>
						<p className="font-display text-[13px] font-bold text-ink">
							Review before processing
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Only approve declarations after checking the shipment details and
							required documents. Physical arrival and cargo receiving must be
							recorded by their respective teams.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}