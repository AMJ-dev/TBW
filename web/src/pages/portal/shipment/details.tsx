import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	ClipboardList,
	Clock3,
	Container as ContainerIcon,
	Download,
	FileCheck2,
	FileText,
	Hash,
	Info,
	LockKeyhole,
	Mail,
	MapPin,
	Package,
	Phone,
	Ship,
	ShieldCheck,
	Thermometer,
	User,
	XCircle,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

type ShipmentContainer = {
	id: string;
	container_no: string;
	size?: string | null;
	seal_no?: string | null;
	package_count?: string | number | null;
	gross_weight?: string | number | null;
	created_at?: string;
};

type ShipmentDocument = {
	id: string;
	document_type: string;
	original_name: string;
	stored_name?: string;
	file_path?: string;
	mime_type?: string | null;
	file_size?: number | null;
	uploaded_at?: string;
	document_label?: string | null;
};

type Reviewer = {
	id: string;
	full_name: string;
	email: string;
	phone?: string;
	pics?: string | null;
};

type ReviewEvent = {
	id: string;
	shipment_id?: string;
	reviewer_id: string;
	reviewer: Reviewer | null;
	decision: string;
	from_status: string | null;
	to_status: string | null;
	reason: string | null;
	created_at: string;
};

type ManifestReview = {
	id?: string;
	manifest_ref?: string | null;
	bill_of_lading?: string | null;
	status?: string | null;
	review_reason?: string | null;
	review_responsible_party?: string | null;
	flagged_at?: string | null;
	received_at?: string | null;
	updated_at?: string | null;
	requires_action?: boolean;
	manifest_requires_action?: boolean;
	notes?: string | null;
};

type ShipmentRecord = {
	id: string;
	user_id?: string;
	shipment_reference?: string | null;
	organisation_id?: string;
	shipment_type?: string;
	bill_of_lading?: string;
	booking_number?: string;
	vessel_name?: string;
	voyage_number?: string;
	shipping_line?: string;
	origin_country?: string;
	origin_port?: string;
	destination_port?: string;
	expected_arrival?: string | null;
	consignee?: string;
	consignee_email?: string | null;
	consignee_phone?: string | null;
	cargo_description?: string | null;
	cargo_category?: string | null;
	package_type?: string | null;
	package_count?: string | number | null;
	gross_weight?: string | number | null;
	volume?: string | number | null;
	hs_code?: string | null;
	dangerous_goods?: string | null;
	temperature_controlled?: string | null;
	temperature?: string | null;
	special_instructions?: string | null;
	customs_reference?: string | null;
	status?: string;
	created_at?: string;
	updated_at?: string;
	container_count?: number;
	document_count?: number;
	containers?: ShipmentContainer[];
	documents?: ShipmentDocument[];
	reviews?: ReviewEvent[];
	latest_review?: ReviewEvent | null;
	latest_review_reason?: string | null;
	manifest?: ManifestReview | null;
};

const statusLabel = (status?: string | null): string => {
	if (!status) return "Unknown";
	return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};
const toDatetimeLocal = (value?: string | null): string => {
	if (!value) return "";
	const date = new Date(String(value).replace(" ", "T"));
	if (Number.isNaN(date.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate()
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const formatDate = (value?: string | null): string => {
	if (!value) return "—";
	const date = new Date(String(value).replace(" ", "T"));
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const formatDateTime = (value?: string | null): string => {
	if (!value) return "—";
	const date = new Date(String(value).replace(" ", "T"));
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatNumber = (value?: string | number | null): string => {
	if (value === null || value === undefined || value === "") return "—";
	const num = Number(value);
	if (Number.isNaN(num)) return String(value);
	return num.toLocaleString("en-NG", { maximumFractionDigits: 2 });
};

const formatBytes = (bytes?: number | null): string => {
	if (bytes == null) return "—";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const decisionTone: Record<
	string,
	{ bg: string; text: string; ring: string; label: string; icon: typeof CheckCircle2 }
> = {
	APPROVED: {
		bg: "bg-teal/10",
		text: "text-teal-deep",
		ring: "ring-teal/30",
		label: "Approved",
		icon: CheckCircle2,
	},
	REJECTED: {
		bg: "bg-coral/10",
		text: "text-coral",
		ring: "ring-coral/30",
		label: "Rejected",
		icon: XCircle,
	},
	RETURNED: {
		bg: "bg-orange/10",
		text: "text-orange-deep",
		ring: "ring-orange/30",
		label: "Returned",
		icon: FileCheck2,
	},
	CHANGES_REQUESTED: {
		bg: "bg-orange/10",
		text: "text-orange-deep",
		ring: "ring-orange/30",
		label: "Changes requested",
		icon: FileCheck2,
	},
};

export default function PortalShipmentDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showReviews, setShowReviews] = useState(true);

	const load = async () => {
		if (!id) return;
		setLoading(true);
		setError("");
		try {
			const res = await http.get(`/portal/shipment/${id}/`);
			const resp: Resp = res.data;

			if (resp.error) {
				setError(
					typeof resp.data === "string"
						? resp.data
						: "Could not load this shipment."
				);
				return;
			}

			const payload: any = resp.code ?? {};
			const record: ShipmentRecord | undefined =
				payload.shipment ?? payload.data ?? payload;

			if (!record || typeof record !== "object" || !record.id) {
				setError("Shipment record is empty.");
				return;
			}

			setShipment({
				...record,
				containers: Array.isArray(record.containers)
					? record.containers
					: [],
				documents: Array.isArray(record.documents)
					? record.documents
					: [],
				reviews: Array.isArray(record.reviews)
					? record.reviews
					: [],
			});
		} catch (err: any) {
			setError(
				err?.response?.data?.data ||
					err?.response?.data?.message ||
					"Could not load this shipment."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	if (loading) {
		return (
			<AppShell title="Shipment details" eyebrow="Stakeholder Portal">
				<div className="space-y-5">
					<div className="h-32 animate-pulse rounded-2xl bg-sand" />
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						{[0, 1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-24 animate-pulse rounded-xl bg-sand"
							/>
						))}
					</div>
					<div className="h-64 animate-pulse rounded-2xl bg-sand" />
				</div>
			</AppShell>
		);
	}

	if (error || !shipment) {
		return (
			<AppShell title="Shipment details" eyebrow="Stakeholder Portal">
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load this shipment
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error || "The shipment may have been removed."}
							</p>
						</div>
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							onClick={() => void load()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={() => navigate("/portal/shipments")}
						>
							Back to shipments
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const containers = shipment.containers ?? [];
	const documents = shipment.documents ?? [];
	const reviews = shipment.reviews ?? [];
	const route =
		shipment.origin_port || shipment.destination_port
			? `${shipment.origin_port || "Origin"} → ${
					shipment.destination_port || "Destination"
				}`
			: "Not provided";

	const containerCount = shipment.container_count ?? containers.length;
	const documentCount = shipment.document_count ?? documents.length;
	const manifest = shipment.manifest ?? null;

	const manifestNeedsAction = manifest?.manifest_requires_action === true || manifest?.requires_action === true;


	return (
		<AppShell
			title={shipment.bill_of_lading || "Shipment details"}
			eyebrow="Stakeholder Portal · Shipment"
		>
			<div className="space-y-5 pb-8">
				<Link
					to="/portal/shipments"
					className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
				>
					<ArrowLeft className="size-3.5" />
					Back to shipments
				</Link>

				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6"
				>
					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
									<Ship className="size-3.5 text-primary" />
									Shipment declaration
								</span>
								<StatusBadge
									label={statusLabel(shipment.status)}
									tone={statusTone(shipment.status ?? "")}
								/>
							</div>

							<h1 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
								{shipment.bill_of_lading || "Untitled shipment"}
							</h1>
							{shipment.shipment_reference && (
								<div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-orange/20 bg-orange/5 px-3 py-2">
									<Hash className="size-4 text-orange" />
									<span className="font-mono text-xs font-semibold tracking-wide text-orange-deep">
										{shipment.shipment_reference}
									</span>
								</div>
							)}
							<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
								{shipment.cargo_description ||
									"No cargo description was provided for this declaration."}
							</p>

							<div className="mt-5 flex flex-wrap gap-2">
								<QuickStat
									icon={Hash}
									label="Booking"
									value={shipment.booking_number || "—"}
									mono
								/>
								<QuickStat
									icon={MapPin}
									label="Route"
									value={route}
								/>
								<QuickStat
									icon={CalendarDays}
									label="Submitted"
									value={formatDate(shipment.created_at)}
								/>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								onClick={() => navigate("/portal/shipments")}
								className="gap-2"
							>
								<ArrowLeft className="size-4" />
								All shipments
							</Button>
						</div>
					</div>
				</motion.section>

				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<SummaryTile
						icon={ContainerIcon}
						label="Containers"
						value={String(containerCount)}
						detail={
							containerCount === 0
								? "Not containerised"
								: `${containerCount} declared`
						}
					/>
					<SummaryTile
						icon={FileText}
						label="Documents"
						value={String(documentCount)}
						detail={
							documentCount === 0
								? "No files attached"
								: "Attached to declaration"
						}
					/>
					<SummaryTile
						icon={Package}
						label="Total packages"
						value={formatNumber(shipment.package_count)}
						detail={shipment.package_type ?? "Packaging type not set"}
					/>
					<SummaryTile
						icon={Thermometer}
						label="Temperature"
						value={
							shipment.temperature_controlled === "yes"
								? shipment.temperature || "Not specified"
								: "Not required"
						}
						detail={
							shipment.temperature_controlled === "yes"
								? "Controlled temperature"
								: "Standard handling"
						}
					/>
				</section>

				{manifest && (
					<motion.section
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className={cn(
							"overflow-hidden rounded-2xl border p-5 sm:p-6",
							manifestNeedsAction
								? "border-coral/30 bg-coral/5"
								: "border-line bg-paper"
						)}
					>
						<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
							<div className="flex min-w-0 gap-3">
								<div className={cn(
									"grid size-10 shrink-0 place-items-center rounded-xl",
									manifestNeedsAction ? "bg-coral/10 text-coral" : "bg-orange/10 text-orange-deep"
								)}>
									<AlertTriangle className="size-5" />
								</div>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="font-display text-base font-bold text-ink">
											Manifest review
										</h2>
										<StatusBadge
											label={statusLabel(manifest.status)}
											tone={statusTone(manifest.status ?? "")}
										/>
									</div>
									<p className="mt-1 text-sm leading-6 text-ink-soft">
										{manifestNeedsAction
											? "Operations has flagged an issue associated with this shipment. Review the reason and follow the requested action."
											: "A manifest is linked to this shipment. Review its current status and any operator notes here."}
									</p>
									<dl className="mt-4 grid gap-3 sm:grid-cols-2">
										<Field icon={Hash} label="Manifest reference" value={manifest.manifest_ref || "—"} mono />
										<Field icon={Hash} label="Manifest bill of lading" value={manifest.bill_of_lading || "—"} mono />
										<Field icon={User} label="Responsible party" value={manifest.review_responsible_party || "Not specified"} />
										<Field icon={CalendarDays} label="Last flagged" value={formatDateTime(manifest.flagged_at)} />
									</dl>
								</div>
							</div>
							{manifestNeedsAction && (
								<Button
									onClick={() => navigate(`/portal/shipment/edit/${shipment.id}`)}
									className="shrink-0 gap-2 bg-orange text-white hover:bg-orange-deep"
								>
									<FileCheck2 className="size-4" />
									Resolve Issue
								</Button>
							)}
						</div>
						{manifest.review_reason && (
							<div className="mt-4 rounded-xl border border-coral/20 bg-background p-4">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">
									Reason for flag
								</p>
								<p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">
									{manifest.review_reason}
								</p>
							</div>
						)}
						{manifest.notes && (
							<div className="mt-3 rounded-xl border border-line bg-background p-4">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Operator notes
								</p>
								<p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">
									{manifest.notes}
								</p>
							</div>
						)}
					</motion.section>
				)}

				<div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
					<div className="space-y-5">
						<Panel
							icon={Ship}
							title="Shipping information"
							description="Primary references for this declaration."
						>
							<dl className="grid gap-4 p-5 sm:grid-cols-2">
								<Field
									icon={Hash}
									label="Bill of lading"
									value={shipment.bill_of_lading ?? "—"}
									mono
								/>
								<Field
									icon={Hash}
									label="Shipment reference"
									value={shipment.shipment_reference ?? "—"}
									mono
								/>
								<Field
									icon={Hash}
									label="Booking number"
									value={shipment.booking_number ?? "—"}
									mono
								/>
								<Field
									icon={Ship}
									label="Shipment type"
									value={shipment.shipment_type ?? "—"}
								/>
								<Field
									icon={Ship}
									label="Shipping line"
									value={shipment.shipping_line ?? "—"}
								/>
								<Field
									icon={Ship}
									label="Vessel name"
									value={shipment.vessel_name ?? "—"}
								/>
								<Field
									icon={Hash}
									label="Voyage number"
									value={shipment.voyage_number ?? "—"}
									mono
								/>
							</dl>
						</Panel>

						<Panel
							icon={MapPin}
							title="Route & schedule"
							description="Movement of cargo from origin to destination."
						>
							<div className="space-y-4 p-5">
								<div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Origin
										</p>
										<p className="mt-1.5 text-[14px] font-semibold text-ink">
											{shipment.origin_port || "—"}
										</p>
										{shipment.origin_country && (
											<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
												{shipment.origin_country}
											</p>
										)}
									</div>

									<div className="flex justify-center sm:block">
										<ArrowRight className="size-5 rotate-90 text-orange sm:rotate-0" />
									</div>

									<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Destination
										</p>
										<p className="mt-1.5 text-[14px] font-semibold text-ink">
											{shipment.destination_port || "—"}
										</p>
									</div>
								</div>

								<dl className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
									<Field
										icon={CalendarDays}
										label="Expected arrival"
										value={formatDate(shipment.expected_arrival)}
									/>
									<Field icon={MapPin} label="Route" value={route} />
								</dl>
							</div>
						</Panel>

						<Panel
							icon={Package}
							title="Cargo declaration"
							description="Description, quantities, and handling requirements."
						>
							<div className="space-y-4 p-5">
								<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Cargo description
									</p>
									<p className="mt-2 text-[13px] leading-6 text-ink">
										{shipment.cargo_description ||
											"No description provided."}
									</p>
								</div>

								<dl className="grid gap-4 sm:grid-cols-2">
									<Field
										icon={Package}
										label="Cargo category"
										value={shipment.cargo_category ?? "—"}
									/>
									<Field
										icon={Package}
										label="Packaging type"
										value={shipment.package_type ?? "—"}
									/>
									<Field
										icon={Hash}
										label="Total packages"
										value={formatNumber(shipment.package_count)}
										mono
									/>
									<Field
										icon={Hash}
										label="Gross weight (kg)"
										value={formatNumber(shipment.gross_weight)}
										mono
									/>
									<Field
										icon={Hash}
										label="Volume (m³)"
										value={formatNumber(shipment.volume)}
										mono
									/>
									<Field
										icon={Hash}
										label="HS code"
										value={shipment.hs_code ?? "—"}
										mono
									/>
								</dl>

								<div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
									<FlagCard
										icon={AlertTriangle}
										active={shipment.dangerous_goods === "yes"}
										activeLabel="Declared dangerous"
										inactiveLabel="No dangerous goods"
										tone="coral"
									/>
									<FlagCard
										icon={Thermometer}
										active={shipment.temperature_controlled === "yes"}
										activeLabel={
											shipment.temperature
												? `Controlled · ${shipment.temperature}`
												: "Temperature controlled"
										}
										inactiveLabel="Standard temperature"
										tone="sky"
									/>
								</div>

								{shipment.special_instructions && (
									<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
										<div className="flex items-start gap-3">
											<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
											<div className="min-w-0">
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
													Special handling instructions
												</p>
												<p className="mt-1 text-[12px] leading-5 text-ink">
													{shipment.special_instructions}
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</Panel>

						<Panel
							icon={ContainerIcon}
							title="Containers"
							description={
								containers.length === 0
									? "No containers were declared for this shipment."
									: `${containers.length} container${
											containers.length === 1 ? "" : "s"
										} declared.`
							}
							badge={
								containers.length > 0 ? (
									<span className="rounded-full bg-orange/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-orange-deep">
										{containers.length}
									</span>
								) : undefined
							}
						>
							{containers.length === 0 ? (
								<div className="p-6 text-center">
									<div className="mx-auto grid size-12 place-items-center rounded-xl bg-sand text-ink-soft">
										<ContainerIcon className="size-5" />
									</div>
									<p className="mt-3 text-[13px] font-semibold text-ink">
										Not containerised
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										This shipment was declared without any containers.
									</p>
								</div>
							) : (
								<ul className="divide-y divide-line">
									{containers.map((container, index) => (
										<li
											key={container.id}
											className="flex flex-wrap items-start gap-4 p-5"
										>
											<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
												<ContainerIcon className="size-4" />
											</div>
											<div className="min-w-[180px] flex-1">
												<p className="font-mono text-[13px] font-semibold text-ink">
													{container.container_no}
												</p>
												<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													Container {index + 1}
												</p>
											</div>
											<dl className="flex min-w-[220px] flex-1 flex-wrap gap-x-6 gap-y-2">
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														Size
													</dt>
													<dd className="mt-0.5 text-[12px] text-ink">
														{container.size || "—"}
													</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														Seal
													</dt>
													<dd className="mt-0.5 font-mono text-[12px] text-ink">
														{container.seal_no || "—"}
													</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														Packages
													</dt>
													<dd className="mt-0.5 font-mono text-[12px] text-ink">
														{formatNumber(container.package_count)}
													</dd>
												</div>
												<div>
													<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														Weight
													</dt>
													<dd className="mt-0.5 font-mono text-[12px] text-ink">
														{container.gross_weight
															? `${formatNumber(
																	container.gross_weight
															  )} kg`
															: "—"}
													</dd>
												</div>
											</dl>
										</li>
									))}
								</ul>
							)}
						</Panel>
					</div>

					<div className="space-y-5">
						<Panel
							icon={User}
							title="Consignee"
							description="Recipient of the declared cargo."
						>
							<dl className="grid gap-4 p-5">
								<Field
									icon={User}
									label="Consignee name"
									value={shipment.consignee ?? "—"}
								/>
								<Field
									icon={Mail}
									label="Email"
									value={shipment.consignee_email ?? "—"}
									mono
								/>
								<Field
									icon={Phone}
									label="Phone"
									value={shipment.consignee_phone ?? "—"}
									mono
								/>
							</dl>
						</Panel>

						<Panel
							icon={FileText}
							title="Supporting documents"
							description={
								documents.length === 0
									? "No documents were attached to this declaration."
									: `${documents.length} file${
											documents.length === 1 ? "" : "s"
										} attached.`
							}
							badge={
								documents.length > 0 ? (
									<span className="rounded-full bg-orange/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-orange-deep">
										{documents.length}
									</span>
								) : undefined
							}
						>
							{documents.length === 0 ? (
								<div className="p-6 text-center">
									<div className="mx-auto grid size-12 place-items-center rounded-xl bg-sand text-ink-soft">
										<FileText className="size-5" />
									</div>
									<p className="mt-3 text-[13px] font-semibold text-ink">
										No documents attached
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Upload supporting documents from the documents centre.
									</p>
								</div>
							) : (
								<ul className="divide-y divide-line">
									{documents.map((doc) => {
										const href = resolveSrc(doc.file_path ?? "");
										return (
											<li
												key={doc.id}
												className="flex items-start gap-3 p-4"
											>
												<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
													<FileText className="size-4" />
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate text-[12px] font-semibold text-ink">
														{doc.original_name}
													</p>
													<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														{doc.document_label ||
															doc.document_type}{" "}
														· {formatBytes(doc.file_size)}
													</p>
													<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
														Uploaded {formatDate(doc.uploaded_at)}
													</p>
												</div>
												{href && (
													<a
														href={href}
														target="_blank"
														rel="noopener noreferrer"
														download
														className="grid size-8 shrink-0 place-items-center rounded-md text-orange-deep transition-colors hover:bg-orange/10"
														aria-label={`Download ${doc.original_name}`}
													>
														<Download className="size-3.5" />
													</a>
												)}
											</li>
										);
									})}
								</ul>
							)}
						</Panel>

						{reviews.length > 0 && (
							<Panel
								icon={ShieldCheck}
								title="Review history"
								description={`${reviews.length} review${
									reviews.length === 1 ? "" : "s"
								} recorded for this declaration.`}
								badge={
									<button
										type="button"
										onClick={() => setShowReviews((v) => !v)}
										className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft hover:text-ink"
									>
										{showReviews ? "Hide" : "Show"}
										<ChevronDown
											className={cn(
												"size-3 transition-transform",
												showReviews && "rotate-180"
											)}
										/>
									</button>
								}
							>
								<AnimatePresence initial={false}>
									{showReviews && (
										<motion.ol
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className="relative space-y-5 overflow-hidden p-5 pl-8 before:absolute before:bottom-5 before:left-[22px] before:top-5 before:w-px before:bg-line"
										>
											{reviews.map((review, index) => (
												<ReviewItem
													key={review.id}
													review={review}
													isLatest={index === 0}
												/>
											))}
										</motion.ol>
									)}
								</AnimatePresence>
							</Panel>
						)}

						<Panel
							icon={ClipboardList}
							title="Declaration timeline"
							description="Key timestamps for this submission."
						>
							<ul className="divide-y divide-line">
								<TimelineRow
									icon={CheckCircle2}
									label="Submitted"
									value={formatDateTime(shipment.created_at)}
									tone="success"
								/>
								<TimelineRow
									icon={Clock3}
									label="Last updated"
									value={formatDateTime(shipment.updated_at)}
									tone="info"
								/>
								<TimelineRow
									icon={ShieldCheck}
									label="Current status"
									value={statusLabel(shipment.status)}
									tone="warning"
								/>
								{shipment.customs_reference && (
									<TimelineRow
										icon={LockKeyhole}
										label="Customs reference"
										value={shipment.customs_reference}
										tone="info"
										mono
									/>
								)}
							</ul>
						</Panel>

						<div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
									<Info className="size-4" />
								</div>
								<div className="min-w-0">
									<p className="text-[12px] font-semibold text-ink">
										About this declaration
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										Submitting a declaration does not confirm terminal
										acceptance, customs clearance or cargo release. Those
										decisions are handled by the appropriate authorised
										parties.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function QuickStat({
	icon: Icon,
	label,
	value,
	mono = false,
}: {
	icon: typeof Hash;
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
			<Icon className="size-3.5 text-primary" />
			<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				{label}
			</span>
			<span
				className={cn(
					"text-[12px] font-medium text-foreground",
					mono && "font-mono"
				)}
			>
				{value}
			</span>
		</div>
	);
}

function SummaryTile({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: typeof ContainerIcon;
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						{label}
					</p>
					<p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
						{value}
					</p>
					<p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
				</div>
				<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-5" />
				</div>
			</div>
		</div>
	);
}

function Panel({
	icon: Icon,
	title,
	description,
	badge,
	children,
}: {
	icon: typeof Ship;
	title: string;
	description: string;
	badge?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
			<div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
				<div className="flex min-w-0 items-start gap-3">
					<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<Icon className="size-4" />
					</div>
					<div className="min-w-0">
						<h3 className="font-display text-sm font-bold text-ink">
							{title}
						</h3>
						<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
							{description}
						</p>
					</div>
				</div>
				{badge}
			</div>
			{children}
		</section>
	);
}

function Field({
	icon: Icon,
	label,
	value,
	mono = false,
}: {
	icon: typeof Hash;
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="min-w-0">
			<dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</dt>
			<dd
				className={cn(
					"mt-1.5 break-words text-[13px]",
					mono ? "font-mono text-ink" : "font-medium text-ink"
				)}
			>
				{value}
			</dd>
		</div>
	);
}

function FlagCard({
	icon: Icon,
	active,
	activeLabel,
	inactiveLabel,
	tone,
}: {
	icon: typeof AlertTriangle;
	active: boolean;
	activeLabel: string;
	inactiveLabel: string;
	tone: "coral" | "sky";
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-xl border p-3.5",
				active
					? tone === "coral"
						? "border-coral/30 bg-coral/5"
						: "border-sky-500/30 bg-sky-500/5"
					: "border-line bg-sand"
			)}
		>
			<div
				className={cn(
					"grid size-9 shrink-0 place-items-center rounded-lg",
					active
						? tone === "coral"
							? "bg-coral/15 text-coral"
							: "bg-sky-500/15 text-sky-700"
						: "bg-paper text-ink-soft"
				)}
			>
				<Icon className="size-4" />
			</div>
			<div className="min-w-0">
				<p className="text-[12px] font-semibold text-ink">
					{active ? activeLabel : inactiveLabel}
				</p>
				<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
					{active ? "Flagged" : "Not applicable"}
				</p>
			</div>
		</div>
	);
}

function TimelineRow({
	icon: Icon,
	label,
	value,
	tone,
	mono = false,
}: {
	icon: typeof CheckCircle2;
	label: string;
	value: string;
	tone: "success" | "warning" | "info" | "critical";
	mono?: boolean;
}) {
	const toneClass =
		tone === "success"
			? "bg-teal-500/10 text-teal-700"
			: tone === "warning"
			? "bg-orange/10 text-orange-deep"
			: tone === "critical"
			? "bg-carmine/10 text-carmine"
			: "bg-sky-500/10 text-sky-700";

	return (
		<li className="flex items-start gap-3 p-4">
			<div
				className={cn(
					"grid size-9 shrink-0 place-items-center rounded-lg",
					toneClass
				)}
			>
				<Icon className="size-4" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					{label}
				</p>
				<p
					className={cn(
						"mt-1 truncate text-[12px] text-ink",
						mono && "font-mono"
					)}
				>
					{value}
				</p>
			</div>
		</li>
	);
}

function ReviewAvatar({ reviewer }: { reviewer: Reviewer | null }) {
	if (!reviewer) {
		return (
			<span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-ink-soft ring-2 ring-paper">
				<User className="size-4" />
			</span>
		);
	}

	const hasPhoto = reviewer.pics && !reviewer.pics.endsWith("avatar.png");

	if (hasPhoto) {
		return (
			<img
				src={resolveSrc(reviewer.pics ?? "")}
				alt={reviewer.full_name}
				className="size-9 shrink-0 rounded-full object-cover ring-2 ring-paper"
			/>
		);
	}

	const initials = reviewer.full_name
		.split(" ")
		.filter(Boolean)
		.map((p) => p.charAt(0))
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-[11px] font-semibold text-sand ring-2 ring-paper">
			{initials || "—"}
		</span>
	);
}

function ReviewItem({
	review,
	isLatest,
}: {
	review: ReviewEvent;
	isLatest: boolean;
}) {
	const tone =
		decisionTone[review.decision] ?? {
			bg: "bg-sand-2",
			text: "text-ink-soft",
			ring: "ring-line",
			label: review.decision,
			icon: FileText,
		};
	const Icon = tone.icon;

	return (
		<li className="relative">
			<div className="absolute -left-[26px] top-1.5">
				<ReviewAvatar reviewer={review.reviewer} />
				{isLatest && (
					<span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-orange ring-2 ring-paper" />
				)}
			</div>

			<div className="ml-6 rounded-xl border border-line bg-background p-3.5">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							{review.reviewer?.full_name || "Operator"}
						</p>
						{review.reviewer?.email && (
							<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
								{review.reviewer.email}
							</p>
						)}
					</div>
					<span className="font-mono text-[10px] text-ink-soft">
						{formatDateTime(review.created_at)}
					</span>
				</div>

				<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
					<span
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ring-1 ring-inset",
							tone.bg,
							tone.text,
							tone.ring
						)}
					>
						<Icon className="size-3" />
						{tone.label}
					</span>

					{review.from_status && review.to_status && (
						<span className="inline-flex items-center gap-1 rounded-full bg-sand-2 px-2 py-0.5 font-mono text-[10px] text-ink-soft ring-1 ring-line">
							{statusLabel(review.from_status)}
							<ArrowRight className="size-2.5" />
							{statusLabel(review.to_status)}
						</span>
					)}
				</div>

				{review.reason && (
					<p className="mt-2.5 rounded-lg bg-sand/60 p-2.5 text-[12px] leading-5 text-ink-soft">
						{review.reason}
					</p>
				)}
			</div>
		</li>
	);
}