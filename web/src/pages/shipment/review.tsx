import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertCircle,
	AlertTriangle,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	FileCheck2,
	Filter,
	Package,
	RefreshCcw,
	Search,
	Ship,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import {statusLabel} from "@/lib/functions"

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
	bill_of_lading?: string;
	vessel_name?: string;
	shipping_line?: string;
	origin_port?: string;
	destination_port?: string;
	consignee?: string;
	consignee_email?: string;
	consignee_phone?: string;
	gross_weight?: string | number;
	package_count?: string | number;
	package_type?: string;
	booking_number?: string;
	manifest_id?: string | null;
	manifest_ref?: string | null;
	manifest_bill_of_lading?: string | null;
	manifest_vessel?: string | null;
	manifest_shipping_line?: string | null;
	manifest_origin_port?: string | null;
	manifest_eta?: string | null;
	manifest_containers?: string | number | null;
	manifest_packages?: string | number | null;
	manifest_gross_weight?: string | number | null;
	manifest_consignee?: string | null;
	manifest_source?: string | null;
	manifest_status?: string | null;
	manifest_review_status?: string | null;
	manifest_review_reason?: string | null;
	manifest_correction_reason?: string | null;
	matched_shipment_id?: string | null;
};

const formatDate = (value?: string | null) => {
	if (!value) return "—";

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

const displayValue = (value?: string | number | null) => {
	if (value === undefined || value === null || String(value).trim() === "") {
		return "—";
	}

	return String(value);
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
	const [expandedManifest, setExpandedManifest] = useState<string | null>(null);

	const pageSize = 10;

	const loadShipments = useCallback(async (isRefresh = false) => {
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		setError("");

		try {
			const response = await http.get("/operator/shipments/review/");
			const resp: Resp = response.data;

			if (resp.error) {
				setError(
					typeof resp.data === "string"
						? resp.data
						: "Unable to load shipment declarations."
				);
				setShipments([]);
				return;
			}

			const code = resp.code as
				| Shipment[]
				| { results?: Shipment[]; shipments?: Shipment[] }
				| null
				| undefined;

			const list: Shipment[] = Array.isArray(code)
				? code
				: Array.isArray(code?.results)
					? code.results
					: Array.isArray(code?.shipments)
						? code.shipments
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

	const stats = useMemo(
		() => ({
			total: shipments.length,
			pending: shipments.filter((shipment) => shipment.status === "pending_review")
				.length,
			changes: shipments.filter(
				(shipment) => shipment.status === "CHANGES_REQUESTED"
			).length,
			approved: shipments.filter((shipment) => shipment.status === "EXPECTED")
				.length,
		}),
		[shipments]
	);

	const filteredShipments = useMemo(() => {
		const query = search.trim().toLowerCase();

		return shipments.filter((shipment) => {
			const searchableValues = [
				shipment.shipment_reference,
				shipment.organisation_name,
				shipment.organisation,
				shipment.organisation_id,
				shipment.cargo_description,
				shipment.shipment_type,
				shipment.bill_of_lading,
				shipment.booking_number,
				shipment.vessel_name,
				shipment.shipping_line,
				shipment.manifest_ref,
				shipment.manifest_bill_of_lading,
				shipment.manifest_vessel,
				shipment.manifest_status,
			];

			const matchesSearch =
				!query ||
				searchableValues.some((value) =>
					String(value ?? "").toLowerCase().includes(query)
				);

			const matchesStatus =
				statusFilter === "all" || shipment.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [shipments, search, statusFilter]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredShipments.length / pageSize)
	);
	const currentPage = Math.min(page, totalPages);

	const paginatedShipments = filteredShipments.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	);

	const openReview = (id: string) => {
		navigate(`/operations/shipments/${id}`);
	};

	const openManifest = (id: string) => {
		navigate(`/operations/manifest/details/${id}`);
	};

	const handleSearch = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleStatusFilter = (value: string) => {
		setStatusFilter(value);
		setPage(1);
	};

	const toggleManifest = (shipmentId: string) => {
		setExpandedManifest((current) =>
			current === shipmentId ? null : shipmentId
		);
	};

	return (
		<AppShell title="Declaration review" eyebrow="Operations · Shipments">
			<div className="space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Operations · Declaration review
						</p>

						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Submitted declarations
						</h2>

						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Review submitted shipment declarations, verify supporting
							documents, and determine whether each shipment can proceed.
							Check linked manifest information where available.
						</p>
					</div>

					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={() => void loadShipments(true)}
						disabled={loading || refreshing}
					>
						<RefreshCcw
							className={cn("size-4", refreshing && "animate-spin")}
						/>
						Refresh
					</Button>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Total declarations"
						value={loading ? "—" : String(stats.total)}
						detail="Returned by the review API"
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

				<section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
						<div className="relative min-w-[260px] flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

							<Input
								type="search"
								value={search}
								onChange={(event) => handleSearch(event.target.value)}
								placeholder="Search shipment, organisation, cargo, manifest..."
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<span className="flex items-center gap-1 text-xs text-ink-soft">
								<Filter className="size-3.5" />
								Status:
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
							<table className="w-full min-w-[1050px] text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										<th className="px-4 py-3 font-medium">Shipment</th>
										<th className="px-4 py-3 font-medium">Organisation</th>
										<th className="px-4 py-3 font-medium">Cargo</th>
										<th className="px-4 py-3 font-medium">Manifest</th>
										<th className="px-4 py-3 font-medium">Submitted</th>
										<th className="px-4 py-3 font-medium">Status</th>
										<th className="px-4 py-3 text-right font-medium">
											Action
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-line">
									{loading ? (
										Array.from({ length: 5 }).map((_, rowIndex) => (
											<tr key={rowIndex}>
												{Array.from({ length: 7 }).map((_, cellIndex) => (
													<td key={cellIndex} className="px-4 py-4">
														<div className="h-4 w-24 animate-pulse rounded bg-sand-2" />
													</td>
												))}
											</tr>
										))
									) : paginatedShipments.length > 0 ? (
										paginatedShipments.map((shipment) => {
											const hasManifest = Boolean(shipment.manifest_id);

											return (
												<Fragment key={shipment.id}>
													<tr
														onClick={() => openReview(shipment.id)}
														onKeyDown={(event) => {
															if (
																event.key === "Enter" ||
																event.key === " "
															) {
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

															{shipment.bill_of_lading && (
																<p className="mt-1 truncate font-mono text-[10px] text-ink-soft">
																	B/L: {shipment.bill_of_lading}
																</p>
															)}
														</td>

														<td className="px-4 py-3.5">
															{hasManifest ? (
																<div className="space-y-1">
																	<p className="font-mono text-[11px] font-semibold text-ink">
																		{shipment.manifest_ref || "Manifest linked"}
																	</p>

																	<span className="inline-flex rounded-md bg-sand px-2 py-1 text-[10px] text-ink-soft">
																		{statusLabel(shipment.manifest_status)}
																	</span>

																	<button
																		type="button"
																		onClick={(event) => {
																			event.stopPropagation();
																			toggleManifest(shipment.id);
																		}}
																		className="flex items-center gap-1 text-[11px] font-medium text-orange-deep hover:underline"
																	>
																		{expandedManifest === shipment.id ? (
																			<>
																				Hide details
																				<ChevronUp className="size-3.5" />
																			</>
																		) : (
																			<>
																				View details
																				<ChevronDown className="size-3.5" />
																			</>
																		)}
																	</button>
																</div>
															) : (
																<div className="space-y-1">
																	<span className="inline-flex rounded-md border border-line px-2 py-1 text-[10px] text-ink-soft">
																		No manifest linked
																	</span>
																	<p className="max-w-[150px] text-[10px] leading-4 text-ink-soft">
																		Declaration can still be reviewed.
																	</p>
																</div>
															)}
														</td>

														<td className="px-4 py-3.5">
															<div className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
																<CalendarDays className="size-3.5 shrink-0" />
																{formatDate(shipment.created_at)}
															</div>
														</td>

														<td className="px-4 py-3.5">
															<StatusBadge
																label={statusLabel(shipment.status)}
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

													{hasManifest &&
														expandedManifest === shipment.id && (
															<tr className="bg-sand/30">
																<td colSpan={7} className="px-4 py-5 sm:px-6">
																	<div className="rounded-xl border border-line bg-paper p-4 sm:p-5">
																		<div className="flex flex-wrap items-start justify-between gap-3">
																			<div className="flex items-start gap-3">
																				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
																					<Ship className="size-5" />
																				</span>

																				<div>
																					<p className="font-display text-sm font-bold text-ink">
																						Linked manifest
																					</p>

																					<p className="mt-1 font-mono text-xs text-ink-soft">
																						{shipment.manifest_ref ||
																							"Reference unavailable"}
																					</p>
																				</div>
																			</div>
																		</div>

																		<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
																			<DetailItem
																				label="Manifest status"
																				value={statusLabel(shipment.manifest_status)}
																			/>
																			<DetailItem
																				label="Bill of lading"
																				value={shipment.manifest_bill_of_lading}
																			/>
																			<DetailItem
																				label="Vessel"
																				value={shipment.manifest_vessel}
																			/>
																			<DetailItem
																				label="Shipping line"
																				value={shipment.manifest_shipping_line}
																			/>
																			<DetailItem
																				label="Origin port"
																				value={shipment.manifest_origin_port}
																			/>
																			<DetailItem
																				label="Estimated arrival"
																				value={formatDate(shipment.manifest_eta)}
																			/>
																			<DetailItem
																				label="Containers"
																				value={shipment.manifest_containers}
																			/>
																			<DetailItem
																				label="Packages"
																				value={shipment.manifest_packages}
																			/>
																			<DetailItem
																				label="Gross weight (KG)"
																				value={shipment.manifest_gross_weight}
																			/>
																			<DetailItem
																				label="Consignee"
																				value={shipment.manifest_consignee}
																			/>
																			<DetailItem
																				label="Intake source"
																				value={shipment.manifest_source}
																			/>
																			<DetailItem
																				label="Review status"
																				value={statusLabel(shipment.manifest_review_status)}
																			/>
																		</div>

																		{(shipment.manifest_review_reason ||
																			shipment.manifest_correction_reason) && (
																			<div className="mt-4 grid gap-3 sm:grid-cols-2">
																				{shipment.manifest_review_reason && (
																					<div className="rounded-lg border border-line bg-sand/50 p-3">
																						<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																							Review reason
																						</p>
																						<p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink">
																							{shipment.manifest_review_reason}
																						</p>
																					</div>
																				)}

																				{shipment.manifest_correction_reason && (
																					<div className="rounded-lg border border-line bg-sand/50 p-3">
																						<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																							Correction instructions
																						</p>
																						<p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink">
																							{shipment.manifest_correction_reason}
																						</p>
																					</div>
																				)}
																			</div>
																		)}

																		<div className="mt-4 rounded-lg border border-line px-3 py-2.5">
																			<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
																				Link verification
																			</p>
																			<p className="mt-1 text-xs leading-5 text-ink-soft">
																				Compare the manifest bill of lading, vessel,
																				consignee, and cargo details with the shipment
																				declaration before making a decision. Manifest
																				validation and declaration approval are separate
																				actions.
																			</p>
																		</div>
																	</div>
																</td>
															</tr>
														)}
												</Fragment>
											);
										})
									) : (
										<tr>
											<td colSpan={7} className="p-12 text-center">
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
								onClick={() => setPage((value) => Math.max(1, value - 1))}
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
									setPage((value) => Math.min(totalPages, value + 1))
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
								Review shipment declarations independently of manifest
								availability. A missing manifest does not automatically prevent
								declaration review. Manifest validation does not approve a
								shipment declaration, and physical arrival must be recorded
								separately by the responsible operations team.
							</p>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function DetailItem({
	label,
	value,
}: {
	label: string;
	value?: string | number | null | undefined;
}) {
	return (
		<div className="min-w-0">
			<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
				{label}
			</p>
			<p className="mt-1 break-words text-xs font-medium text-ink">
				{displayValue(value)}
			</p>
		</div>
	);
}