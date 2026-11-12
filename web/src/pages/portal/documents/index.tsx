
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	CheckCircle2,
	Clock3,
	FileCheck2,
	FolderOpen,
	Search,
	ShieldCheck,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { toast } from "sonner";

type DocumentStatus =
	| "PENDING_REVIEW"
	| "VERIFIED"
	| "CHANGES_REQUESTED"
	| "REJECTED";

type ShipmentDocument = {
	id: string;
	document_type: string;
	original_name: string;
	file_path: string;
	uploaded_at: string;
	status: DocumentStatus;
};

type Shipment = {
	id: string;
	shipment_reference: string;
	bill_of_lading: string | null;
	cargo_description: string | null;
	consignee: string | null;
	expected_arrival: string | null;
	status: string;
	document_status:
		| "MISSING"
		| "PENDING_REVIEW"
		| "VERIFIED"
		| "CHANGES_REQUESTED"
		| "REJECTED";
	container_count: number;
	document_count: number;
	documents: ShipmentDocument[];
};

type ShipmentDocumentResponse = {
	error: boolean;
	data: string;
	code: Shipment[];
};

const documentStatusLabels: Record<string, string> = {
	MISSING: "Missing",
	PENDING_REVIEW: "Pending Review",
	VERIFIED: "Verified",
	CHANGES_REQUESTED: "Changes Requested",
	REJECTED: "Rejected",
};

const documentStatusTones: Record<string, ReturnType<typeof statusTone>> = {
	MISSING: "info",
	PENDING_REVIEW: "warning",
	VERIFIED: "success",
	CHANGES_REQUESTED: "critical",
	REJECTED: "critical",
};

const lifecycleStatusLabel = (status: string) =>
	status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value: string | null) => {
	if (!value) return "—";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

const labelClass =
	"text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-soft";

export default function PortalDocumentsPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [shipments, setShipments] = useState<Shipment[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const navigate = useNavigate();

	const loadShipments = useCallback(async () => {
		try {
			setLoading(true);
			setLoadError(false);

			const response = await http.get("/portal/documents/");
			const resp: Resp = response.data;

			if (resp.error) {
				setLoadError(true);
				toast.error(String(resp.data || "Could not load documents."));
				return;
			}

			const result = resp as ShipmentDocumentResponse;
			setShipments(result.code);
		} catch (error: any) {
			setLoadError(true);
			toast.error(error?.message || "Could not load shipment documents.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadShipments();
	}, [loadShipments]);

	const filteredShipments = useMemo(() => {
		const query = search.trim().toLowerCase();

		return shipments.filter((shipment) => {
			const matchesSearch =
				!query ||
				[
					shipment.shipment_reference,
					shipment.bill_of_lading ?? "",
					shipment.cargo_description ?? "",
					shipment.consignee ?? "",
				].some((value) => value.toLowerCase().includes(query));

			const matchesStatus =
				statusFilter === "ALL" ||
				shipment.document_status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [shipments, search, statusFilter]);

	const allDocuments = useMemo(
		() => shipments.flatMap((shipment) => shipment.documents),
		[shipments],
	);

	const verifiedCount = allDocuments.filter(
		(document) => document.status === "VERIFIED",
	).length;

	const pendingCount = allDocuments.filter(
		(document) => document.status === "PENDING_REVIEW",
	).length;

	const changesRequestedCount = allDocuments.filter(
		(document) => document.status === "CHANGES_REQUESTED",
	).length;

	const rejectedCount = allDocuments.filter(
		(document) => document.status === "REJECTED",
	).length;

	return (
		<AppShell title="My Documents" eyebrow="Portal · Shipment Documents">
			<div className="space-y-6 pb-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className={labelClass}>
							Organisation workspace
						</p>

						<h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Shipment Documents
						</h1>

						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							View the documents submitted for your shipments, check
							their verification status and see where action is required.
						</p>
					</div>

					<div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-xs text-ink-soft">
						<ShieldCheck className="size-4 text-orange-deep" />
						Your shipment documents in one place
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Shipments"
						value={String(shipments.length)}
						detail="Your registered shipments"
						tone="info"
						icon={FolderOpen}
					/>

					<Metric
						label="Verified documents"
						value={String(verifiedCount)}
						detail="Documents accepted by operations"
						tone="success"
						icon={FileCheck2}
					/>

					<Metric
						label="Pending review"
						value={String(pendingCount)}
						detail="Awaiting operations verification"
						tone="warning"
						icon={Clock3}
					/>

					<Metric
						label="Action required"
						value={String(changesRequestedCount + rejectedCount)}
						detail={`${changesRequestedCount} changes requested · ${rejectedCount} rejected`}
						tone="critical"
						icon={XCircle}
					/>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-md">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search shipment, B/L or consignee..."
							className="pl-9"
						/>
					</div>

					<select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}
						className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-xs text-ink outline-none focus:border-orange focus:ring-2 focus:ring-orange/15 sm:w-56"
					>
						<option value="ALL">All document statuses</option>
						<option value="MISSING">Missing</option>
						<option value="PENDING_REVIEW">Pending Review</option>
						<option value="VERIFIED">Verified</option>
						<option value="CHANGES_REQUESTED">Changes Requested</option>
						<option value="REJECTED">Rejected</option>
					</select>
				</div>

				<section className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-4 sm:px-5">
						<div>
							<h2 className="text-sm font-semibold text-ink">
								Your shipments
							</h2>

							<p className="mt-1 text-[11px] text-ink-soft">
								Select a shipment to view its documents and review status.
							</p>
						</div>

						<span className="rounded-md bg-orange/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-orange-deep">
							{filteredShipments.length} SHIPMENTS
						</span>
					</div>

					{loading ? (
						<div className="p-12 text-center text-xs text-ink-soft">
							Loading shipment documents...
						</div>
					) : loadError ? (
						<div className="flex flex-col items-center justify-center p-12 text-center">
							<FolderOpen className="size-9 text-ink-soft/60" />

							<p className="mt-3 text-sm font-semibold text-ink">
								Unable to load documents
							</p>

							<p className="mt-1 text-xs text-ink-soft">
								Check your internet connection and try again.
							</p>

							<Button
								size="sm"
								variant="outline"
								className="mt-4 border-line"
								onClick={loadShipments}
								disabled={loading}
							>
								<RefreshCw className="mr-2 size-3.5" />
								Retry
							</Button>
						</div>
					) : filteredShipments.length > 0 ? (
						<div className="w-full overflow-x-auto">
							<table className="w-full min-w-[1050px] border-collapse text-left">
								<thead className="bg-sand/60">
									<tr className="border-b border-line font-mono text-[9px] uppercase tracking-wider text-ink-soft">
										<th className="px-5 py-3 font-medium">
											Shipment / B/L
										</th>
										<th className="px-4 py-3 font-medium">
											Cargo / Consignee
										</th>
										<th className="px-4 py-3 font-medium">
											Containers
										</th>
										<th className="px-4 py-3 font-medium">
											Documents
										</th>
										<th className="px-4 py-3 font-medium">
											Document Status
										</th>
										<th className="px-4 py-3 font-medium">
											Cargo Status
										</th>
										<th className="px-4 py-3 font-medium">
											Action
										</th>
									</tr>
								</thead>

								<tbody>
									{filteredShipments.map((shipment) => (
										<tr
											key={shipment.id}
											className="border-b border-line last:border-0 hover:bg-sand/20"
										>
											<td className="px-5 py-4 align-middle">
												<p className="break-all font-mono text-xs font-bold text-ink">
													{shipment.shipment_reference}
												</p>

												<p className="mt-1 break-all text-[10px] text-ink-soft">
													B/L: {shipment.bill_of_lading || "—"}
												</p>
											</td>

											<td className="px-4 py-4 align-middle">
												<p className="text-xs font-medium text-ink">
													{shipment.cargo_description || "—"}
												</p>

												<p className="mt-1 break-words text-[10px] text-ink-soft">
													{shipment.consignee || "—"}
												</p>
											</td>

											<td className="px-4 py-4 align-middle">
												<p className="text-xs font-semibold text-ink">
													{shipment.container_count} container(s)
												</p>

												<p className="mt-1 text-[10px] text-ink-soft">
													ETA: {formatDate(shipment.expected_arrival)}
												</p>
											</td>

											<td className="px-4 py-4 align-middle">
												<p className="text-xs font-semibold text-ink">
													{shipment.document_count} document(s)
												</p>

												<p className="mt-1 text-[10px] text-ink-soft">
													{shipment.documents.length} records returned
												</p>
											</td>

											<td className="px-4 py-4 align-middle">
												<StatusBadge
													label={documentStatusLabels[shipment.document_status] ?? shipment.document_status}
													tone={documentStatusTones[shipment.document_status]}
												/>
											</td>

											<td className="px-4 py-4 align-middle">
												<span className="text-[11px] font-medium text-ink">
													{lifecycleStatusLabel(shipment.status)}
												</span>
											</td>

											<td className="px-4 py-4 align-middle">
												<Button
													size="sm"
													variant="outline"
													className="h-8 whitespace-nowrap border-line px-3"
													onClick={() =>
														navigate(`/portal/documents/${shipment.id}`)
													}
												>
													View <span className="ml-1" aria-hidden="true">→</span>
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="p-12 text-center">
							<FolderOpen className="mx-auto size-8 text-ink-soft/60" />

							<p className="mt-3 text-sm font-semibold text-ink">
								No shipments found
							</p>

							<p className="mt-1 text-xs text-ink-soft">
								Try another shipment reference or document status filter.
							</p>
						</div>
					)}

					<div className="border-t border-line px-4 py-3 text-[10px] text-ink-soft sm:px-5">
						Showing {filteredShipments.length} of {shipments.length} shipments
					</div>
				</section>

				<div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange-deep">
						<CheckCircle2 className="size-4" />
					</span>

					<div>
						<p className="text-xs font-semibold text-ink">
							Document verification
						</p>

						<p className="mt-1 text-[11px] leading-5 text-ink-soft">
							Pending Review means operations has not completed verification.
							Verified documents have been accepted. Changes Requested means
							you need to submit corrections. Rejected means the document was
							not accepted. Check the shipment details for further information.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
