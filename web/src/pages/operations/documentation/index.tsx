
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
	ArrowRight,
	Clock3,
	Download,
	Eye,
	FileCheck2,
	Filter,
	FolderOpen,
	Loader2,
	RefreshCw,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import {statusLabel} from "@/lib/functions"

type DocumentStatus = "Verified" | "Pending review" | "Missing" | "Rejected";

type ShipmentStatus =
	| "Awaiting documents"
	| "Under review"
	| "Documents complete"
	| "Returned"
	| "Rejected";

type CargoDocument = {
	id?: string;
	name: string;
	category: string;
	reference: string;
	fileName?: string;
	fileSize?: string;
	uploadedAt: string;
	status: DocumentStatus;
	required: boolean;
	reviewNote?: string;
};

type Shipment = {
	id: string;
	reference: string;
	billOfLading: string;
	consignee: string;
	organisation: string;
	cargo: string;
	containers: number;
	storageLocation: string;
	storedAt: string;
	status: ShipmentStatus;
	documents: CargoDocument[];
};

type Pagination = {
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

type DocumentsResponse = Resp & {
	code: unknown;
	pagination?: Pagination;
};

const PAGE_SIZE = 20;

const shipmentTone: Record<ShipmentStatus, ReturnType<typeof statusTone>> = {
	"Awaiting documents": "warning",
	"Under review": "info",
	"Documents complete": "success",
	Returned: "critical",
	Rejected: "critical",
};

export default function OperationsDocumentationRoute() {
	const [shipments, setShipments] = useState<Shipment[]>([]);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalShipments, setTotalShipments] = useState(0);

	const navigate = useNavigate();

	const loadShipments = useCallback(async (refresh = false) => {
		if (refresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		setLoadError("");

		try {
			const res = await http.post("/operations/documents/", {
				page,
				q: search.trim(),
			});

			const resp: Resp = res.data;

			if (resp.error) {
				const message = String(
					resp.data || "Could not load shipment documents.",
				);

				setLoadError(message);
				toast.error(message);
				return;
			}

			const payload = resp as DocumentsResponse;

			const nested =
				payload.code &&
				typeof payload.code === "object" &&
				!Array.isArray(payload.code)
					? (payload.code as {
							shipments?: unknown;
							pagination?: Pagination;
						})
					: null;

			const rows = Array.isArray(payload.code)
				? payload.code
				: Array.isArray(nested?.shipments)
					? nested.shipments
					: null;

			if (!rows) {
				throw new Error(
					"The API did not return a valid shipment array.",
				);
			}

			const validShipments = (rows as any[]).map((shipment) => ({
				id: shipment.id,
				reference: shipment.shipment_reference,
				billOfLading: shipment.bill_of_lading ?? "",
				consignee: shipment.consignee ?? "",
				organisation: shipment.organisation_name ?? "",
				cargo: shipment.cargo_description ?? "",
				containers: Number(shipment.container_count ?? 0),
				storageLocation: Array.isArray(shipment.containers)
					? shipment.containers
							.map((container: any) => container.container_no)
							.filter(Boolean)
							.join(", ")
					: "",
				storedAt: shipment.updated_at ?? "",
				status: shipment.document_status,
				documents: Array.isArray(shipment.documents)
					? shipment.documents.map((document: any) => ({
							id: document.id,
							name: document.document_type,
							category: document.document_type,
							reference: document.reference_code ?? "",
							fileName: document.original_name ?? "",
							fileSize: document.file_size
								? `${(Number(document.file_size) / 1024).toFixed(1)} KB`
								: "",
							uploadedAt: document.uploaded_at ?? "",
							status: document.status,
							required: false,
						}))
					: [],
			}));

			const pagination = payload.pagination ?? nested?.pagination;

			setShipments(validShipments);
			setTotalShipments(
				Number(pagination?.total ?? validShipments.length),
			);
			setTotalPages(
				Math.max(1, Number(pagination?.total_pages ?? 1)),
			);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Could not load shipment documents. Please try again.";

			setLoadError(message);
			toast.error(message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [page, search]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			loadShipments();
		}, 350);

		return () => window.clearTimeout(timer);
	}, [loadShipments]);

	const allDocuments = useMemo(
		() =>
			shipments.flatMap((shipment) =>
				shipment.documents.map((document) => ({
					document,
					shipment,
				})),
			),
		[shipments],
	);

	const pendingCount = allDocuments.filter(
		({ document }) => document.status === "Pending review",
	).length;

	const verifiedCount = allDocuments.filter(
		({ document }) => document.status === "Verified",
	).length;

	const rejectedCount = allDocuments.filter(
		({ document }) => document.status === "Rejected",
	).length;

	const missingCount = allDocuments.filter(
		({ document }) =>
			document.status === "Missing" && document.required,
	).length;

	const readyCount = shipments.filter(
		(shipment) => shipment.status === "Documents complete",
	).length;

	const filteredShipments = useMemo(
		() =>
			shipments.filter(
				(shipment) =>
					statusFilter === "ALL" ||
					shipment.status === statusFilter,
			),
		[shipments, statusFilter],
	);

	const exportRegister = () => {
		const rows = [
			[
				"Shipment reference",
				"Bill of lading",
				"Consignee",
				"Organisation",
				"Shipment status",
				"Document",
				"Document reference",
				"File",
				"Document status",
				"Required",
			],
			...allDocuments.map(({ document, shipment }) => [
				shipment.reference,
				shipment.billOfLading,
				shipment.consignee,
				shipment.organisation,
				shipment.status,
				document.name,
				document.reference,
				document.fileName ?? "",
				document.status,
				document.required ? "Yes" : "No",
			]),
		];

		const csv = rows
			.map((row) =>
				row
					.map((value) => `"${String(value).replaceAll('"', '""')}"`)
					.join(","),
			)
			.join("\n");

		const url = URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8;" }),
		);

		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "trinu-document-register.csv";
		anchor.click();

		URL.revokeObjectURL(url);
		toast.success("Document register exported.");
	};

	const clearSearch = () => {
		setSearch("");
		setPage(1);
	};

	return (
		<AppShell
			title="Document Management"
			eyebrow="Operations · Document Control"
		>
			<div className="space-y-5 pb-8">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
							Terminal operations · Document control
						</p>

						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Document Management
						</h2>

						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Manage shipment documents, review submissions and track
							documentation clearance before cargo proceeds to the next stage.
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							className="w-full border-line sm:w-auto"
							onClick={() => loadShipments(true)}
							disabled={loading || refreshing}
						>
							<RefreshCw
								className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>

						<Button
							type="button"
							variant="outline"
							className="w-full border-line sm:w-auto"
							onClick={exportRegister}
							disabled={loading || shipments.length === 0}
						>
							<Download className="mr-2 size-4" />
							Export register
						</Button>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Shipments in register"
						value={String(totalShipments)}
						detail="Total matching shipments"
						tone="info"
						icon={FolderOpen}
					/>

					<Metric
						label="Pending verification"
						value={String(pendingCount)}
						detail="Submitted documents awaiting review on this page"
						tone="warning"
						icon={Clock3}
					/>

					<Metric
						label="Verified documents"
						value={String(verifiedCount)}
						detail={`${readyCount} shipments documentation-complete on this page`}
						tone="success"
						icon={FileCheck2}
					/>

					<Metric
						label="Rejected / missing"
						value={String(rejectedCount + missingCount)}
						detail={`${rejectedCount} rejected · ${missingCount} required missing on this page`}
						tone="critical"
						icon={ShieldCheck}
					/>
				</div>

				{loadError ? (
					<section className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
						<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
							<FolderOpen className="size-6" />
						</div>

						<h3 className="mt-4 text-sm font-semibold text-red-900">
							Unable to load documents
						</h3>

						<p className="mx-auto mt-2 max-w-md text-xs leading-5 text-red-700">
							{loadError}
						</p>

						<Button
							type="button"
							className="mt-5"
							onClick={() => loadShipments()}
							disabled={loading}
						>
							<RefreshCw className="mr-2 size-4" />
							Retry
						</Button>
					</section>
				) : loading ? (
					<section className="rounded-xl border border-line bg-paper p-16 text-center">
						<Loader2 className="mx-auto size-8 animate-spin text-orange" />

						<p className="mt-4 text-sm font-medium text-ink">
							Loading shipment documents...
						</p>

						<p className="mt-1 text-xs text-ink-soft">
							Please wait while the document register is loaded.
						</p>
					</section>
				) : (
					<>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="relative w-full sm:max-w-md">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

								<Input
									value={search}
									onChange={(event) => {
										setSearch(event.target.value);
										setPage(1);
									}}
									placeholder="Search shipment, B/L, consignee..."
									className="pl-9"
								/>

								{search && (
									<button
										type="button"
										aria-label="Clear search"
										onClick={clearSearch}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
									>
										<X className="size-4" />
									</button>
								)}
							</div>

							<div className="flex items-center gap-2">
								<Filter className="size-4 text-ink-soft" />

								<label
									htmlFor="document-status-filter"
									className="sr-only"
								>
									Filter by status
								</label>

								<select
									id="document-status-filter"
									value={statusFilter}
									onChange={(event) =>
										setStatusFilter(event.target.value)
									}
									className="h-10 min-w-44 rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15"
								>
									<option value="ALL">All statuses</option>
									<option>Awaiting documents</option>
									<option>Under review</option>
									<option>Documents complete</option>
									<option>Returned</option>
									<option>Rejected</option>
								</select>
							</div>
						</div>

						<section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5">
								<div>
									<h3 className="text-sm font-semibold text-ink">
										Shipment document register
									</h3>

									<p className="mt-1 text-[11px] text-ink-soft">
										Shipments currently recorded in terminal document control.
									</p>
								</div>

								<span className="rounded-md bg-orange/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-orange-deep">
									{filteredShipments.length} SHIPMENTS
								</span>
							</div>

							<div className="hidden grid-cols-[1.25fr_1.1fr_1fr_120px_145px_100px] gap-3 border-b border-line bg-sand/60 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-ink-soft lg:grid">
								<span>Shipment / B/L</span>
								<span>Consignee / Organisation</span>
								<span>Storage location</span>
								<span>Required docs</span>
								<span>Status</span>
								<span className="text-right">Action</span>
							</div>

							{filteredShipments.map((shipment) => {
								const totalDocuments = shipment.documents.length;

								const verified = shipment.documents.filter(
									(document) => document.status?.toUpperCase() === "VERIFIED",
								).length;

								const progress = totalDocuments
									? Math.round((verified / totalDocuments) * 100)
									: 0;

								return (
									<div
										key={shipment.id}
										className="grid gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-sand/40 last:border-0 lg:grid-cols-[1.25fr_1.1fr_1fr_120px_145px_100px] lg:items-center"
									>
										<div className="min-w-0">
											<p className="break-all font-mono text-xs font-bold text-ink">
												{shipment.reference}
											</p>

											<p className="mt-1 text-[10px] text-ink-soft">
												B/L: {shipment.billOfLading} · {shipment.containers}{" "}
												container(s)
											</p>
										</div>

										<div className="min-w-0">
											<p className="truncate text-xs font-medium text-ink">
												{shipment.consignee}
											</p>

											<p className="mt-1 truncate text-[10px] text-ink-soft">
												{shipment.organisation}
											</p>
										</div>

										<div>
											<p className="text-xs text-ink">
												{shipment.storageLocation}
											</p>

											<p className="mt-1 text-[10px] text-ink-soft">
												Stored {shipment.storedAt}
											</p>
										</div>

										<div>
											<p className="text-xs font-semibold text-ink">
												{verified}/{totalDocuments} verified
											</p>

											<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand">
												<div
													className="h-full rounded-full bg-orange transition-all"
													style={{ width: `${progress}%` }}
												/>
											</div>
										</div>

										<div>
											<StatusBadge
												label={statusLabel(shipment.status)}
												tone={shipmentTone[shipment.status]}
											/>
										</div>

										<div className="flex justify-start lg:justify-end">
											<Button
												type="button"
												size="sm"
												variant="outline"
												className="h-8 border-line"
												onClick={() =>
													navigate(
														`/operations/documentation/${shipment.id}`,
													)
												}
											>
												<Eye className="mr-1 size-3.5" />
												Details
											</Button>
										</div>
									</div>
								);
							})}

							{filteredShipments.length === 0 && (
								<div className="p-12 text-center">
									<FolderOpen className="mx-auto size-8 text-ink-soft/60" />

									<p className="mt-3 text-sm font-semibold text-ink">
										No shipments found
									</p>

									<p className="mt-1 text-xs text-ink-soft">
										Try changing your search or status filter.
									</p>
								</div>
							)}

							<div className="border-t border-line px-4 py-3 text-[10px] text-ink-soft">
								Showing{" "}
								{shipments.length === 0
									? 0
									: (page - 1) * PAGE_SIZE + 1}
								{"–"}
								{Math.min(
									(page - 1) * PAGE_SIZE + shipments.length,
									totalShipments,
								)}{" "}
								of {totalShipments} shipments
							</div>
						</section>

						<div className="flex flex-col gap-3 rounded-xl border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-ink-soft">
								Page {page} of {totalPages}
							</p>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="border-line"
									disabled={page <= 1 || loading}
									onClick={() =>
										setPage((current) => Math.max(1, current - 1))
									}
								>
									Previous
								</Button>

								<Button
									type="button"
									variant="outline"
									size="sm"
									className="border-line"
									disabled={page >= totalPages || loading}
									onClick={() =>
										setPage((current) =>
											Math.min(totalPages, current + 1),
										)
									}
								>
									Next
								</Button>
							</div>
						</div>

						<div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
							<div className="flex items-start gap-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep">
									<FileCheck2 className="size-4" />
								</span>

								<div>
									<p className="text-xs font-semibold text-ink">
										Documentation clearance
									</p>

									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Only shipments with all required documents verified should
										proceed to the next operational stage.
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 text-xs font-semibold text-orange-deep">
								{readyCount} shipments cleared on this page
								<ArrowRight className="size-4" />
							</div>
						</div>
					</>
				)}
			</div>
		</AppShell>
	);
}
