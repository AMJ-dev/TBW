import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
	ArrowDownUp,
	ArrowUpRight,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Container,
	FileCheck2,
	Filter,
	Package,
	Search,
	ShieldAlert,
	SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type ShipmentStatus =
	| "pending_review"
	| "EXPECTED"
	| "IN_TRANSIT_TO_TERMINAL"
	| "ARRIVED_AT_GATE"
	| "RECEIVED"
	| "STORED"
	| "DOCS_IN_PROGRESS"
	| "EXAMINATION_SCHEDULED"
	| "UNDER_EXAMINATION"
	| "EXAMINATION_COMPLETE"
	| "HELD"
	| "CHARGES_PENDING"
	| "CHARGES_SETTLED"
	| "RELEASE_AUTHORISED"
	| "SLOT_BOOKED"
	| "LOADING"
	| "GATE_OUT"
	| "CLOSED"
	| "OVERSTAYED"
	| "TRANSFERRED_OUT"
	| "RETURNED_RE_EXPORTED";

type ShipmentContainer = {
	id: string;
	container_no: string;
	size: string | null;
	seal_no: string | null;
	package_count: number | null;
	gross_weight: number | null;
};

type ShipmentDocument = {
	id: string;
	document_type: string;
	original_name: string;
	file_path: string;
	mime_type: string | null;
	file_size: number;
	uploaded_at: string;
};

type Shipment = {
	id: string;
	shipment_reference: string;
	user_id: string;
	organisation_id: string | null;
	organisation_name: string | null;
	shipment_type: string;
	bill_of_lading: string | null;
	booking_number: string | null;
	vessel_name: string | null;
	voyage_number: string | null;
	shipping_line: string | null;
	origin_country: string | null;
	origin_port: string | null;
	destination_port: string | null;
	expected_arrival: string | null;
	consignee: string | null;
	consignee_email: string | null;
	consignee_phone: string | null;
	cargo_description: string | null;
	cargo_category: string;
	package_type: string;
	package_count: number | null;
	gross_weight: number | null;
	volume: number | null;
	hs_code: string | null;
	dangerous_goods: "yes" | "no";
	temperature_controlled: "yes" | "no";
	temperature: string | null;
	special_instructions: string | null;
	customs_reference: string | null;
	status: ShipmentStatus;
	created_at: string;
	updated_at: string;
	containers: ShipmentContainer[];
	documents: ShipmentDocument[];
};

type StatusFilter = "All statuses" | ShipmentStatus;

const normaliseContainer = (raw: any): ShipmentContainer => ({
	id: String(raw?.id ?? ""),
	container_no: String(raw?.container_no ?? ""),
	size: raw?.size ?? null,
	seal_no: raw?.seal_no ?? null,
	package_count: raw?.package_count === null || raw?.package_count === undefined ? null : Number(raw.package_count),
	gross_weight: raw?.gross_weight === null || raw?.gross_weight === undefined ? null : Number(raw.gross_weight),
});

const normaliseDocument = (raw: any): ShipmentDocument => ({
	id: String(raw?.id ?? ""),
	document_type: String(raw?.document_type ?? ""),
	original_name: String(raw?.original_name ?? ""),
	file_path: String(raw?.file_path ?? ""),
	mime_type: raw?.mime_type ?? null,
	file_size: Number(raw?.file_size ?? 0),
	uploaded_at: String(raw?.uploaded_at ?? ""),
});

const normaliseShipment = (raw: any): Shipment => ({
	id: String(raw?.id ?? ""),
	shipment_reference: String(raw?.shipment_reference ?? ""),
	user_id: String(raw?.user_id ?? ""),
	organisation_id: raw?.organisation_id ?? null,
	organisation_name: raw?.organisation_name ?? null,
	shipment_type: String(raw?.shipment_type ?? ""),
	bill_of_lading: raw?.bill_of_lading ?? null,
	booking_number: raw?.booking_number ?? null,
	vessel_name: raw?.vessel_name ?? null,
	voyage_number: raw?.voyage_number ?? null,
	shipping_line: raw?.shipping_line ?? null,
	origin_country: raw?.origin_country ?? null,
	origin_port: raw?.origin_port ?? null,
	destination_port: raw?.destination_port ?? null,
	expected_arrival: raw?.expected_arrival ?? null,
	consignee: raw?.consignee ?? null,
	consignee_email: raw?.consignee_email ?? null,
	consignee_phone: raw?.consignee_phone ?? null,
	cargo_description: raw?.cargo_description ?? null,
	cargo_category: String(raw?.cargo_category ?? ""),
	package_type: String(raw?.package_type ?? ""),
	package_count: raw?.package_count === null || raw?.package_count === undefined ? null : Number(raw.package_count),
	gross_weight: raw?.gross_weight === null || raw?.gross_weight === undefined ? null : Number(raw.gross_weight),
	volume: raw?.volume === null || raw?.volume === undefined ? null : Number(raw.volume),
	hs_code: raw?.hs_code ?? null,
	dangerous_goods: raw?.dangerous_goods === "yes" ? "yes" : "no",
	temperature_controlled: raw?.temperature_controlled === "yes" ? "yes" : "no",
	temperature: raw?.temperature ?? null,
	special_instructions: raw?.special_instructions ?? null,
	customs_reference: raw?.customs_reference ?? null,
	status: (raw?.status ?? "pending_review") as ShipmentStatus,
	created_at: String(raw?.created_at ?? ""),
	updated_at: String(raw?.updated_at ?? ""),
	containers: Array.isArray(raw?.containers) ? raw.containers.map(normaliseContainer) : [],
	documents: Array.isArray(raw?.documents) ? raw.documents.map(normaliseDocument) : [],
});

const STATUS_OPTIONS: StatusFilter[] = [
	"All statuses",
	"pending_review",
	"EXPECTED",
	"IN_TRANSIT_TO_TERMINAL",
	"ARRIVED_AT_GATE",
	"RECEIVED",
	"STORED",
	"DOCS_IN_PROGRESS",
	"EXAMINATION_SCHEDULED",
	"UNDER_EXAMINATION",
	"EXAMINATION_COMPLETE",
	"HELD",
	"CHARGES_PENDING",
	"CHARGES_SETTLED",
	"RELEASE_AUTHORISED",
	"SLOT_BOOKED",
	"LOADING",
	"GATE_OUT",
	"CLOSED",
	"OVERSTAYED",
	"TRANSFERRED_OUT",
	"RETURNED_RE_EXPORTED",
];

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

const statusStyles: Record<string, string> = {
	pending_review: "bg-orange/10 text-orange-deep ring-orange/25",
	EXPECTED: "bg-sand-2 text-ink ring-line",
	IN_TRANSIT_TO_TERMINAL: "bg-slate/10 text-slate-deep ring-slate/25",
	ARRIVED_AT_GATE: "bg-slate/10 text-slate-deep ring-slate/25",
	RECEIVED: "bg-carmine/10 text-carmine ring-carmine/25",
	STORED: "bg-teal/10 text-teal-deep ring-teal/25",
	DOCS_IN_PROGRESS: "bg-orange/10 text-orange-deep ring-orange/25",
	EXAMINATION_SCHEDULED: "bg-orange/10 text-orange-deep ring-orange/25",
	UNDER_EXAMINATION: "bg-orange/10 text-orange-deep ring-orange/25",
	EXAMINATION_COMPLETE: "bg-orange/10 text-orange-deep ring-orange/25",
	HELD: "bg-coral/10 text-coral ring-coral/25",
	CHARGES_PENDING: "bg-orange/10 text-orange-deep ring-orange/25",
	CHARGES_SETTLED: "bg-teal/10 text-teal-deep ring-teal/25",
	RELEASE_AUTHORISED: "bg-teal/10 text-teal-deep ring-teal/25",
	SLOT_BOOKED: "bg-teal/10 text-teal-deep ring-teal/25",
	LOADING: "bg-slate/10 text-slate-deep ring-slate/25",
	GATE_OUT: "bg-teal/10 text-teal-deep ring-teal/25",
	CLOSED: "bg-sand text-ink-soft ring-line",
	OVERSTAYED: "bg-coral/10 text-coral ring-coral/25",
	TRANSFERRED_OUT: "bg-sand text-ink-soft ring-line",
	RETURNED_RE_EXPORTED: "bg-sand text-ink-soft ring-line",
};

const statusFallback = "bg-sand text-ink-soft ring-line";

function StatusPill({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ring-1 ring-inset",
				statusStyles[status] ?? statusFallback
			)}
		>
			{status.replace(/_/g, " ")}
		</span>
	);
}

const formatDate = (value: string | null) => {
	if (!value) return "—";
	return value.slice(0, 10);
};

export default function OperationsShipmentsPage() {
	const navigate = useNavigate();
	const [shipments, setShipments] = useState<Shipment[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] =
		useState<StatusFilter>("All statuses");
	const [activeTab, setActiveTab] = useState("All shipments");
	const [sortNewest, setSortNewest] = useState(true);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	useEffect(() => {
		let cancelled = false;

		const fetchShipments = async () => {
			setLoading(true);
			try {
				const res = await http.get("/operator/shipments/");
				const resp: Resp = res.data;

				if (resp.error) {
					toast.error(
						resp.data || "Could not load shipments."
					);
					return;
				}

				const payload: any = resp.code ?? {};
				const rawShipments: any[] = Array.isArray(payload.shipments)
					? payload.shipments
					: Array.isArray(payload)
						? payload
						: [];

				if (cancelled) return;
				setShipments(rawShipments.map(normaliseShipment));
			} catch (err: any) {
				if (cancelled) return;
				toast.error(
					err?.response?.data?.message ||
						"Could not load shipments."
				);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchShipments();
		return () => {
			cancelled = true;
		};
	}, []);

	const filteredShipments = useMemo(() => {
		const q = query.trim().toLowerCase();
		const result = shipments.filter((shipment) => {
			const matchesQuery =
				!q ||
				[
					shipment.id,
					shipment.organisation_name ?? "",
					shipment.bill_of_lading ?? "",
					shipment.booking_number ?? "",
					shipment.cargo_description ?? "",
					shipment.cargo_category,
				].some((value) => value.toLowerCase().includes(q));

			const matchesStatus =
				statusFilter === "All statuses" ||
				shipment.status === statusFilter;

			const matchesTab =
				activeTab === "All shipments" ||
				(activeTab === "Pending review" &&
					shipment.status === "pending_review") ||
				(activeTab === "On hold" && shipment.status === "HELD") ||
				(activeTab === "In progress" &&
					[
						"EXPECTED",
						"IN_TRANSIT_TO_TERMINAL",
						"ARRIVED_AT_GATE",
						"RECEIVED",
						"STORED",
						"DOCS_IN_PROGRESS",
						"EXAMINATION_SCHEDULED",
						"UNDER_EXAMINATION",
						"EXAMINATION_COMPLETE",
						"CHARGES_PENDING",
						"CHARGES_SETTLED",
						"RELEASE_AUTHORISED",
						"SLOT_BOOKED",
						"LOADING",
					].includes(shipment.status)) ||
				(activeTab === "Completed" &&
					[
						"GATE_OUT",
						"CLOSED",
						"TRANSFERRED_OUT",
						"RETURNED_RE_EXPORTED",
					].includes(shipment.status));

			return matchesQuery && matchesStatus && matchesTab;
		});

		return result.sort((a, b) =>
			sortNewest
				? b.created_at.localeCompare(a.created_at)
				: a.created_at.localeCompare(b.created_at)
		);
	}, [shipments, query, statusFilter, activeTab, sortNewest]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredShipments.length / pageSize)
	);
	const currentPage = Math.min(page, totalPages);
	const pageStart = (currentPage - 1) * pageSize;
	const pageEnd = Math.min(pageStart + pageSize, filteredShipments.length);
	const paginated = filteredShipments.slice(pageStart, pageEnd);
	const pageTokens = useMemo(
		() => buildPageTokens(currentPage, totalPages),
		[currentPage, totalPages]
	);

	const count = (predicate: (shipment: Shipment) => boolean) =>
		shipments.filter(predicate).length;

	const pendingReview = count((s) => s.status === "pending_review");

	const openShipment = (shipment: Shipment) => {
		navigate(`/operations/shipments/${shipment.id}`);
	};

	return (
		<AppShell title="Shipments" eyebrow="Operations · Shipment register">
			<div className="space-y-5 pb-8">
				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6"
				>
					<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
						<div className="min-w-0">
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
								<Package className="size-3.5 text-primary" />
								Terminal operations · All shipments
							</div>
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								Review and action,{" "}
								<span className="text-primary">
									every declaration.
								</span>
							</h1>
							<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
								Submissions from every organisation on the platform.
								Resolve exceptions and move cargo through the terminal
								workflow.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								className="gap-2"
								onClick={() => {
									setQuery("");
									setStatusFilter("All statuses");
									setActiveTab("All shipments");
									setPage(1);
								}}
							>
								Reset filters
							</Button>
						</div>
					</div>
				</motion.section>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Total shipments"
						value={String(shipments.length)}
						detail="Across all organisations"
						tone="info"
						icon={Package}
					/>
					<Metric
						label="Pending review"
						value={String(pendingReview)}
						detail="Awaiting initial validation"
						tone="warning"
						icon={FileCheck2}
					/>
					<Metric
						label="On hold"
						value={String(count((s) => s.status === "HELD"))}
						detail="Exception needs resolution"
						tone="critical"
						icon={ShieldAlert}
					/>
					<Metric
						label="Completed"
						value={String(
							count((s) =>
								[
									"GATE_OUT",
									"CLOSED",
									"TRANSFERRED_OUT",
									"RETURNED_RE_EXPORTED",
								].includes(s.status)
							)
						)}
						detail="Gate-out recorded"
						tone="success"
						icon={CheckCircle2}
					/>
				</section>

				<section className="overflow-hidden rounded-2xl border bg-card">
					<div className="border-b border-line px-4 pt-4 sm:px-5">
						<div className="flex flex-wrap gap-1">
							{[
								"All shipments",
								"Pending review",
								"In progress",
								"On hold",
								"Completed",
							].map((tab) => (
								<button
									key={tab}
									onClick={() => {
										setActiveTab(tab);
										setPage(1);
									}}
									className={cn(
										"border-b-2 px-3 py-3 text-sm font-medium transition-colors",
										activeTab === tab
											? "border-ink text-ink"
											: "border-transparent text-ink-soft hover:text-ink"
									)}
								>
									{tab}
									{tab === "Pending review" && (
										<span className="ml-2 rounded-full bg-orange/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-deep">
											{pendingReview}
										</span>
									)}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-5">
						<div className="relative min-w-0 flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							<Input
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setPage(1);
								}}
								placeholder="Search id, organisation, B/L, booking or cargo…"
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>
						<div className="flex flex-wrap gap-2">
							<div className="relative">
								<Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
								<select
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value as StatusFilter);
										setPage(1);
									}}
									className="h-10 rounded-md border border-line bg-sand pl-9 pr-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
								>
									{STATUS_OPTIONS.map((status) => (
										<option key={status}>{status}</option>
									))}
								</select>
							</div>
							<Button
								variant="outline"
								className="h-10 gap-2 border-line bg-paper text-ink hover:bg-sand"
								onClick={() => setSortNewest((v) => !v)}
							>
								<ArrowDownUp className="size-4" />
								{sortNewest ? "Newest first" : "Oldest first"}
							</Button>
						</div>
					</div>

					{loading ? (
						<div className="flex items-center justify-center px-5 py-16">
							<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
						</div>
					) : filteredShipments.length === 0 ? (
						<div className="flex flex-col items-center px-5 py-16 text-center">
							<div className="rounded-xl border bg-muted/50 p-3">
								<SlidersHorizontal className="size-6 text-muted-foreground" />
							</div>
							<h3 className="mt-3 font-semibold">
								No shipments match these filters
							</h3>
							<p className="mt-1 max-w-sm text-sm text-muted-foreground">
								Try changing your search or filter selection.
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full min-w-[1050px] border-collapse text-left">
									<thead className="border-b border-line bg-sand/40">
										<tr>
											<th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Shipment / cargo
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Organisation
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Status
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Containers
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Documents
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Submitted
											</th>
											<th className="px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Action
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{paginated.map((shipment, index) => (
											<motion.tr
												key={shipment.id}
												initial={{ opacity: 0, y: 4 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													delay: Math.min(index * 0.015, 0.15),
												}}
												className="group transition-colors hover:bg-sand/50"
											>
												<td className="px-5 py-4">
													<div className="font-mono text-[12px] font-semibold text-ink transition-colors group-hover:text-orange-deep">
														{shipment.shipment_reference || "—"}
													</div>
													<div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
														<Container className="size-3.5" />
														{shipment.containers.length > 0
															? shipment.containers
																	.map((c) => c.container_no)
																	.join(", ")
															: "No container"}
													</div>
													<div className="mt-1 text-[12px] text-ink-soft">
														{shipment.cargo_description ?? "—"}
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-start gap-2">
														<Building2 className="mt-0.5 size-4 shrink-0 text-ink-soft" />
														<span className="max-w-[180px] truncate text-[12px] font-medium text-ink">
															{shipment.organisation_name ?? "—"}
														</span>
													</div>
												</td>
												<td className="px-4 py-4">
													<StatusPill status={shipment.status} />
												</td>
												<td className="px-4 py-4">
													<div className="text-[12px] text-ink">
														{shipment.containers.length}
													</div>
													<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
														container
														{shipment.containers.length === 1 ? "" : "s"}
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-center gap-2 text-[12px] text-ink">
														<FileCheck2 className="size-4 text-ink-soft" />
														{shipment.documents.length}
													</div>
													<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
														document
														{shipment.documents.length === 1 ? "" : "s"}
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
														<CalendarDays className="size-3.5" />
														{formatDate(shipment.created_at)}
													</div>
												</td>
												<td className="px-4 py-4 text-right">
													<Button
														size="sm"
														onClick={() => openShipment(shipment)}
														className="gap-2 bg-ink text-sand hover:bg-ink/90"
													>
														Review
														<ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
													</Button>
												</td>
											</motion.tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex flex-col gap-3 border-t border-line bg-sand/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
									<span>
										Showing{" "}
										{filteredShipments.length === 0 ? 0 : pageStart + 1}–
										{pageEnd} of {filteredShipments.length} shipment
										{filteredShipments.length === 1 ? "" : "s"}
									</span>
									<label className="inline-flex items-center gap-2">
										<span className="font-mono text-[10px] uppercase tracking-[0.1em]">
											Rows
										</span>
										<select
											value={String(pageSize)}
											onChange={(event) => {
												setPageSize(Number(event.target.value));
												setPage(1);
											}}
											className="h-8 rounded-md border border-line bg-paper px-2 text-xs text-ink"
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
										className="h-8 gap-1 border-line bg-paper px-2 text-xs text-ink hover:bg-sand"
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
													className="px-1 text-xs text-ink-soft"
												>
													…
												</span>
											);
										}
										const isActive = token === currentPage;
										return (
											<Button
												key={token}
												variant="ghost"
												size="sm"
												onClick={() => setPage(token)}
												className={cn(
													"h-8 w-8 p-0 text-xs",
													isActive
														? "bg-ink text-sand hover:bg-ink/90"
														: "text-ink-soft hover:text-ink"
												)}
												aria-current={
													isActive ? "page" : undefined
												}
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
										className="h-8 gap-1 border-line bg-paper px-2 text-xs text-ink hover:bg-sand"
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