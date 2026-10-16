import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
	ArrowDownToLine,
	ArrowRight,
	ArrowUpRight,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	FileText,
	Filter,
	Plus,
	Search,
	Ship,
	SlidersHorizontal,
} from "lucide-react";
import { AppShell, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";


type UnknownRecord = Record<string, unknown>;

type ShipmentRecord = UnknownRecord & {
	id: string;
	status?: string;
	cargo_status?: string;
	documents?: unknown[];
	document_count?: number;
	documents_count?: number;
	container_count?: number;
	reference?: string;
	reference_number?: string;
	shipment_reference?: string;
	manifest_id?: string | null;
	manifest_reference?: string | null;
	manifest_bill_of_lading?: string | null;
	manifest_status?: string | null;
	manifest_review_reason?: string | null;
	manifest_review_responsible_party?: string | null;
	manifest_flagged_at?: string | null;
	manifest_action_status?: string;
	manifest_requires_action?: boolean;
	manifest_linked?: boolean;
	created_at?: string;
	submitted_at?: string;
	createdAt?: string;
	cargo_category?: string;
	cargo_type?: string;
	shipment_type?: string;
	bill_of_lading?: string;
	cargo_description?: string;
	package_type?: string;
	package_count?: string | number;
	consignee?: string;
	consignee_email?: string;
	origin_country?: string;
	origin_port?: string;
	destination_port?: string;
	vessel_name?: string;
};

const excludedFields = new Set([
	"id",
	"user_id",
	"organisation_id",
	"organization_id",
	"created_by",
	"updated_by",
	"deleted_at",
	"updated_at",
	"documents",
	"containers",
	"route_stops",
]);

const labelFor = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (value) => value.toUpperCase());

const asString = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	return String(value);
};

const displayValue = (value: unknown): string => {
	if (value === null || value === undefined || value === "") return "—";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (typeof value === "number") return String(value);
	if (typeof value === "object")
		return Array.isArray(value)
			? value.length
				? `${value.length} items`
				: "—"
			: JSON.stringify(value);
	return String(value);
};

const getStatus = (item: ShipmentRecord): string =>
	asString(item.cargo_status ?? item.status ?? "").trim();

const getDocuments = (item: ShipmentRecord): unknown[] =>
	Array.isArray(item.documents) ? item.documents : [];

const getDocumentCount = (item: ShipmentRecord): number => {
	const value = item.document_count ?? item.documents_count;
	if (value === undefined || value === null) return getDocuments(item).length;
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

const getContainerCount = (item: ShipmentRecord): number => {
	const value = item.container_count;
	if (value === undefined || value === null) return 0;
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

const getDate = (item: ShipmentRecord): string => {
	const value = item.created_at ?? item.submitted_at ?? item.createdAt;
	return value ? asString(value).slice(0, 10) : "";
};

const formatDate = (value: unknown): string => {
	if (!value) return "—";
	const date = new Date(String(value).slice(0, 10) + "T00:00:00");
	if (Number.isNaN(date.getTime())) return String(value);
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const formatNumber = (value?: string | number | null): string => {
	if (value === null || value === undefined || value === "") return "—";
	const num = Number(value);
	if (Number.isNaN(num)) return String(value);
	return num.toLocaleString("en-NG", { maximumFractionDigits: 2 });
};

const statusTone = (status: string): string => {
	const value = status.toLowerCase();
	if (/reject|fail|hold|action|required|cancel|error/.test(value))
		return "border-rose-500/20 bg-rose-500/10 text-rose-700";
	if (
		/complete|closed|release|arriv|received|approved|accept|settled|collected/.test(
			value
		)
	)
		return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
	if (/transit|moving|loading|dispatch/.test(value))
		return "border-indigo-500/20 bg-indigo-500/10 text-indigo-700";
	if (/review|pending|expected|schedule|progress|stored/.test(value))
		return "border-amber-500/20 bg-amber-500/10 text-amber-700";
	return "border-border bg-muted text-muted-foreground";
};

const recordNameFor = (item: ShipmentRecord): string =>
	item.reference ??
	item.reference_number ??
	item.shipment_reference ??
	item.bill_of_lading ??
	item.id;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type PageToken = number | "gap";

const buildPageTokens = (current: number, total: number): PageToken[] => {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const tokens: PageToken[] = [];
	const push = (value: PageToken) => {
		if (tokens[tokens.length - 1] !== value) tokens.push(value);
	};

	push(1);

	const left = Math.max(2, current - 1);
	const right = Math.min(total - 1, current + 1);

	if (left > 2) push("gap");

	for (let i = left; i <= right; i += 1) push(i);

	if (right < total - 1) push("gap");

	push(total);

	return tokens;
};

export default function PortalShipmentsPage() {
	const navigate = useNavigate();

	const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [cargoFilter, setCargoFilter] = useState("All");
	const [sortOrder, setSortOrder] = useState("newest");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const loadShipments = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/portal/shipments/");
			const resp: Resp = res.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not load shipments."
				);
			}

			const payload: unknown = resp.code ?? resp.data ?? {};
			const container = payload as UnknownRecord;

			const rows: unknown = Array.isArray(payload)
				? payload
				: (container["shipments"] ??
						container["data"] ??
						container["items"] ??
						[]);

			if (!Array.isArray(rows)) {
				throw new Error("The shipments API did not return a list.");
			}

			const normalised: ShipmentRecord[] = rows
				.filter(
					(row): row is UnknownRecord & { id: unknown } =>
						row !== null && typeof row === "object" && "id" in row
				)
				.map((row) => ({ ...row, id: String(row.id) }) as ShipmentRecord);

			setShipments(normalised);
		} catch (err) {
			const message =
				(err as { response?: { data?: { data?: string; message?: string } } })
					?.response?.data?.data ||
				(err as { response?: { data?: { message?: string } } })?.response
					?.data?.message ||
				(err as Error)?.message ||
				"Could not load shipments.";
			setError(message);
			setShipments([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadShipments();
	}, []);

	const statuses = useMemo(
		() =>
			[...new Set(shipments.map(getStatus).filter(Boolean))].sort((a, b) =>
				a.localeCompare(b)
			),
		[shipments]
	);

	const cargoTypes = useMemo(
		() =>
			[
				...new Set(
					shipments
						.map((item) =>
							String(item.cargo_category ?? item.cargo_type ?? "")
						)
						.filter(Boolean)
				),
			].sort((a, b) => a.localeCompare(b)),
		[shipments]
	);

	const searchableText = (item: ShipmentRecord): string =>
		Object.entries(item)
			.filter(
				([, value]) =>
					value === null ||
					["string", "number", "boolean"].includes(typeof value)
			)
			.map(([key, value]) => `${key} ${String(value ?? "")}`)
			.join(" ")
			.toLowerCase();

	const filtered = useMemo(
		() =>
			shipments
				.filter((item) => {
					const matchesSearch =
						!search.trim() ||
						searchableText(item).includes(search.trim().toLowerCase());
					const matchesStatus =
						statusFilter === "All" || getStatus(item) === statusFilter;
					const cargo = String(
						item.cargo_category ?? item.cargo_type ?? ""
					);
					const matchesCargo = cargoFilter === "All" || cargo === cargoFilter;
					return matchesSearch && matchesStatus && matchesCargo;
				})
				.sort((a, b) =>
					sortOrder === "newest"
						? getDate(b).localeCompare(getDate(a))
						: getDate(a).localeCompare(getDate(b))
				),
		[shipments, search, statusFilter, cargoFilter, sortOrder]
	);

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const currentPage = Math.min(page, totalPages);
	const pageStart = (currentPage - 1) * pageSize;
	const pageEnd = Math.min(pageStart + pageSize, filtered.length);
	const paginated = useMemo(
		() => filtered.slice(pageStart, pageEnd),
		[filtered, pageStart, pageEnd]
	);

	const pageTokens = useMemo(
		() => buildPageTokens(currentPage, totalPages),
		[currentPage, totalPages]
	);

	useEffect(() => {
		setPage(1);
	}, [search, statusFilter, cargoFilter, sortOrder, pageSize]);

	const handleExport = () => {
		const exportFields = [
			...new Set(
				filtered.flatMap((item) =>
					Object.keys(item).filter(
						(key) =>
							!excludedFields.has(key.toLowerCase()) &&
							typeof item[key] !== "object"
					)
				)
			),
		];
		const csv = [
			exportFields.map(labelFor),
			...filtered.map((item) =>
				exportFields.map((key) => displayValue(item[key]))
			),
		]
			.map((row) =>
				row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
			)
			.join("\r\n");
		const url = URL.createObjectURL(
			new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
		);
		const link = document.createElement("a");
		link.href = url;
		link.download = "shipments.csv";
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AppShell
			title="My Shipments"
			eyebrow="Stakeholder Portal · Shipment Management"
		>
			<div className="space-y-5 pb-8">
				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6"
				>
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div>
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
								<Ship className="size-3.5 text-primary" />
								Shipment management
							</div>
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								Your shipments,{" "}
								<span className="text-primary">in one place.</span>
							</h1>
							<p className="mt-2 max-w-xl text-sm text-muted-foreground">
								Review shipment details, status updates, cargo information
								and submitted documents.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={handleExport}
								disabled={!filtered.length}
								className="gap-2"
							>
								<ArrowDownToLine className="size-4" />
								Export list
							</Button>
							<Button
								onClick={() => navigate("/portal/shipment/new")}
								className="gap-2"
							>
								<Plus className="size-4" />
								Submit shipment
							</Button>
						</div>
					</div>
				</motion.section>

				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Total shipments"
						value={String(shipments.length)}
						detail="Records returned by the API"
						tone="info"
						icon={Ship}
					/>
					<Metric
						label="Statuses"
						value={String(statuses.length)}
						detail="Statuses currently in your records"
						tone="warning"
						icon={SlidersHorizontal}
					/>
					<Metric
						label="Documents"
						value={String(
							shipments.reduce(
								(total, item) => total + getDocumentCount(item),
								0
							)
						)}
						detail="Documents attached to shipments"
						tone="success"
						icon={FileText}
					/>
					<Metric
						label="Filtered results"
						value={String(filtered.length)}
						detail="Matching current filters"
						tone="info"
						icon={Search}
					/>
				</section>

				<section className="overflow-hidden rounded-2xl border bg-card">
					<div className="flex flex-col gap-3 border-b p-4 sm:p-5">
						<div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
							<div>
								<h2 className="font-semibold">Shipment register</h2>
								<p className="mt-1 text-xs text-muted-foreground">
									Search and filter the records returned by the
									shipment API.
								</p>
							</div>
							<span className="text-xs text-muted-foreground">
								{filtered.length} of {shipments.length} shipments
							</span>
						</div>

						<div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_190px_190px_140px]">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search shipment details..."
									className="pl-9"
								/>
							</div>

							<div className="relative">
								<Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
									aria-label="Filter by status"
								>
									<option value="All">All statuses</option>
									{statuses.map((status) => (
										<option key={status} value={status}>
											{status}
										</option>
									))}
								</select>
							</div>

							<select
								value={cargoFilter}
								onChange={(event) => setCargoFilter(event.target.value)}
								className="h-10 rounded-md border border-input bg-background px-3 text-sm"
								aria-label="Filter by cargo category"
							>
								<option value="All">All cargo categories</option>
								{cargoTypes.map((cargo) => (
									<option key={cargo} value={cargo}>
										{cargo}
									</option>
								))}
							</select>

							<select
								value={sortOrder}
								onChange={(event) => setSortOrder(event.target.value)}
								className="h-10 rounded-md border border-input bg-background px-3 text-sm"
								aria-label="Sort shipments"
							>
								<option value="newest">Newest first</option>
								<option value="oldest">Oldest first</option>
							</select>
						</div>

						{statuses.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{["All", ...statuses].map((status) => (
									<button
										key={status}
										type="button"
										onClick={() => setStatusFilter(status)}
										className={cn(
											"rounded-full border px-3 py-1 text-xs font-medium",
											statusFilter === status
												? "border-primary bg-primary text-primary-foreground"
												: "border-border bg-background text-muted-foreground hover:bg-muted"
										)}
									>
										{status}
									</button>
								))}
							</div>
						)}
					</div>

					{error && (
						<div className="m-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-700">
							<p>{error}</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={() => void loadShipments()}
							>
								Retry
							</Button>
						</div>
					)}

					{loading ? (
						<div className="flex items-center justify-center gap-3 px-5 py-12 text-sm text-muted-foreground">
							<span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
							Loading shipments...
						</div>
					) : filtered.length === 0 ? (
						<div className="flex flex-col items-center px-5 py-12 text-center">
							<div className="rounded-xl border bg-muted/50 p-3">
								<SlidersHorizontal className="size-6 text-muted-foreground" />
							</div>
							<h3 className="mt-3 font-semibold">
								{error
									? "Shipments could not be loaded"
									: "No shipments found"}
							</h3>
							<p className="mt-1 max-w-sm text-sm text-muted-foreground">
								{error
									? "Retry the request to load your shipment records."
									: shipments.length
										? "Change the search or filters and try again."
										: "Your shipment records will appear here after the API returns them."}
							</p>
							{!error && shipments.length > 0 && (
								<Button
									variant="outline"
									className="mt-3"
									onClick={() => {
										setSearch("");
										setStatusFilter("All");
										setCargoFilter("All");
									}}
								>
									Clear filters
								</Button>
							)}
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full min-w-[1250px] text-left text-sm">
									<thead>
										<tr className="border-b border-line bg-sand/40">
											<th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Shipment
											</th>
											<th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Route
											</th>
											<th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Cargo
											</th>
											<th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Consignee
											</th>
											<th className="px-5 py-3.5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Containers
											</th>
											<th className="px-5 py-3.5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Files
											</th>
											<th className="px-5 py-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Status
											</th>
											<th className="px-5 py-3.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Manifest / next step
							</th>
							<th className="px-5 py-3.5 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
								Action
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{paginated.map((item, index) => {
											const status = getStatus(item);
											const recordName = recordNameFor(item);
											const containerCount = getContainerCount(item);
											const documentCount = getDocumentCount(item);
											const createdAt = getDate(item);
											const cargoLine = String(
												item.cargo_description ?? ""
											).trim();
											const cargoCategory = String(
												item.cargo_category ?? ""
											).trim();
											const routeFrom = String(
												item.origin_port ?? ""
											).trim();
											const routeTo = String(
												item.destination_port ?? ""
											).trim();
											const originCountry = String(
												item.origin_country ?? ""
											).trim();
											const vessel = String(
												item.vessel_name ?? ""
											).trim();
											const consigneeName = String(
												item.consignee ?? ""
											).trim();
											const consigneeEmail = String(
												item.consignee_email ?? ""
											).trim();

											return (
												<motion.tr
													key={item.id}
													initial={{ opacity: 0, y: 4 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{
														delay: Math.min(index * 0.015, 0.15),
													}}
													className="group transition-colors hover:bg-sand/50"
												>
													<td className="px-5 py-4">
														<button
															type="button"
															onClick={() =>
																navigate(`/portal/shipments/${item.id}`)
															}
															className="text-left"
														>
															<p className="font-mono text-[13px] font-semibold text-ink transition-colors group-hover:text-primary">
																{recordName}
															</p>
															<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
																{item.shipment_type && (
																	<span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
																		{String(item.shipment_type)}
																	</span>
																)}
																<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
																	{formatDate(createdAt)}
																</span>
															</div>
														</button>
													</td>

													<td className="px-5 py-4">
														<div className="flex items-center gap-2">
															<div className="min-w-0">
																<p className="truncate text-[12px] font-medium text-foreground">
																	{routeFrom || "Origin"}
																</p>
																<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
																	{originCountry || "—"}
																</p>
															</div>
															<ArrowRight className="size-3.5 shrink-0 text-primary" />
															<div className="min-w-0">
																<p className="truncate text-[12px] font-medium text-foreground">
																	{routeTo || "Destination"}
																</p>
																<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
																	{vessel || "—"}
																</p>
															</div>
														</div>
													</td>

													<td className="max-w-[220px] px-5 py-4">
														<p className="truncate text-[12px] font-medium text-foreground">
															{cargoCategory || "—"}
														</p>
														<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
															{cargoLine || "No description"}
														</p>
														{item.package_count && (
															<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
																{formatNumber(item.package_count)}{" "}
																{String(item.package_type ?? "packages")}
															</p>
														)}
													</td>

													<td className="max-w-[200px] px-5 py-4">
														<p className="truncate text-[12px] font-medium text-foreground">
															{consigneeName || "—"}
														</p>
														{consigneeEmail && (
															<p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
																{consigneeEmail}
															</p>
														)}
													</td>

													<td className="px-5 py-4 text-center">
														<span
															className={cn(
																"inline-flex size-8 items-center justify-center rounded-lg font-mono text-[11px] font-semibold",
																containerCount > 0
																	? "bg-primary/10 text-primary"
																	: "bg-muted text-muted-foreground"
															)}
														>
															{containerCount}
														</span>
													</td>

													<td className="px-5 py-4 text-center">
														<span
															className={cn(
																"inline-flex size-8 items-center justify-center rounded-lg font-mono text-[11px] font-semibold",
																documentCount > 0
																	? "bg-sky-500/10 text-sky-700"
																	: "bg-muted text-muted-foreground"
															)}
														>
															{documentCount}
														</span>
													</td>

													<td className="px-5 py-4">
														<span
															className={cn(
																"inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
																statusTone(status)
															)}
														>
															{status
																? status.replace(/_/g, " ")
																: "—"}
														</span>
													</td>

													<td className="max-w-[280px] px-5 py-4">
									<div className="space-y-1.5">
										<span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold", statusTone(String(item.manifest_action_status ?? "No manifest linked")))}>
											{String(item.manifest_action_status ?? (item.manifest_linked ? "Manifest linked" : "No manifest linked"))}
										</span>
										{item.manifest_reference && <p className="font-mono text-[10px] text-muted-foreground">Manifest: {String(item.manifest_reference)}</p>}
										{item.manifest_requires_action && item.manifest_review_reason && <p className="max-w-[260px] whitespace-normal text-xs text-rose-700">{String(item.manifest_review_reason)}</p>}
										{item.manifest_requires_action && <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => navigate(`/portal/shipments/${item.id}`)}>Review shipment</Button>}
									</div>
								</td>
								<td className="px-5 py-4 text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																navigate(`/portal/shipments/${item.id}`)
															}
															className="gap-1 text-muted-foreground hover:text-primary"
														>
															View
															<ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
														</Button>
													</td>
												</motion.tr>
											);
										})}
									</tbody>
								</table>
							</div>

							<div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
									<span>
										Showing {filtered.length === 0 ? 0 : pageStart + 1}–
										{pageEnd} of {filtered.length} shipment
										{filtered.length === 1 ? "" : "s"}
									</span>
									<label className="inline-flex items-center gap-2">
										<span className="font-mono text-[10px] uppercase tracking-[0.1em]">
											Rows
										</span>
										<select
											value={String(pageSize)}
											onChange={(event) =>
												setPageSize(Number(event.target.value))
											}
											className="h-8 rounded-md border border-input bg-background px-2 text-xs"
											aria-label="Rows per page"
										>
											{PAGE_SIZE_OPTIONS.map((size) => (
												<option key={size} value={size}>
													{size}
												</option>
											))}
										</select>
									</label>
								</div>

								<div className="flex flex-wrap items-center gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((current) => Math.max(1, current - 1))
										}
										disabled={currentPage <= 1}
										className="h-8 gap-1 px-2 text-xs"
										aria-label="Previous page"
									>
										<ChevronLeft className="size-3.5" />
										Prev
									</Button>

									{pageTokens.map((token, idx) => {
										if (token === "gap") {
											return (
												<span
													key={`gap-${idx}`}
													className="px-1 text-xs text-muted-foreground"
												>
													…
												</span>
											);
										}

										const isActive = token === currentPage;

										return (
											<Button
												key={token}
												variant={isActive ? "default" : "ghost"}
												size="sm"
												onClick={() => setPage(token)}
												className={cn(
													"h-8 w-8 p-0 text-xs",
													!isActive &&
														"text-muted-foreground hover:text-foreground"
												)}
												aria-current={isActive ? "page" : undefined}
											>
												{token}
											</Button>
										);
									})}

									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((current) =>
												Math.min(totalPages, current + 1)
											)
										}
										disabled={currentPage >= totalPages}
										className="h-8 gap-1 px-2 text-xs"
										aria-label="Next page"
									>
										Next
										<ChevronRight className="size-3.5" />
									</Button>
								</div>
							</div>
						</>
					)}
				</section>
			</div>
		</AppShell>
	);
}