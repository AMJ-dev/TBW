import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Container,
	FileCheck2,
	FileText,
	MapPin,
	Package,
	RefreshCcw,
	ShieldAlert,
	Ship,
	User,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

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
	shipment_reference: string | null;
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
	status: string;
	created_at: string;
	updated_at: string;
	containers: ShipmentContainer[];
	documents: ShipmentDocument[];
};

type CargoState = {
	code: string;
	internal_label: string;
	customer_label: string;
};

type CargoTransition = {
	from_code: string;
	to_code: string;
	requires_hold_clear: boolean;
	requires_docs: boolean;
	requires_financial_clearance: boolean;
	requires_authority_reference: boolean;
	notifies: boolean;
};

type CurrentConfig = {
	states: CargoState[];
	transitions: CargoTransition[];
};

const normaliseContainer = (raw: any): ShipmentContainer => ({
	id: String(raw?.id ?? ""),
	container_no: String(raw?.container_no ?? ""),
	size: raw?.size ?? null,
	seal_no: raw?.seal_no ?? null,
	package_count:
		raw?.package_count === null || raw?.package_count === undefined
			? null
			: Number(raw.package_count),
	gross_weight:
		raw?.gross_weight === null || raw?.gross_weight === undefined
			? null
			: Number(raw.gross_weight),
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
	shipment_reference: raw?.shipment_reference ?? null,
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
	package_count:
		raw?.package_count === null || raw?.package_count === undefined
			? null
			: Number(raw.package_count),
	gross_weight:
		raw?.gross_weight === null || raw?.gross_weight === undefined
			? null
			: Number(raw.gross_weight),
	volume:
		raw?.volume === null || raw?.volume === undefined
			? null
			: Number(raw.volume),
	hs_code: raw?.hs_code ?? null,
	dangerous_goods: raw?.dangerous_goods === "yes" ? "yes" : "no",
	temperature_controlled:
		raw?.temperature_controlled === "yes" ? "yes" : "no",
	temperature: raw?.temperature ?? null,
	special_instructions: raw?.special_instructions ?? null,
	customs_reference: raw?.customs_reference ?? null,
	status: String(raw?.status ?? "pending_review"),
	created_at: String(raw?.created_at ?? ""),
	updated_at: String(raw?.updated_at ?? ""),
	containers: Array.isArray(raw?.containers)
		? raw.containers.map(normaliseContainer)
		: [],
	documents: Array.isArray(raw?.documents)
		? raw.documents.map(normaliseDocument)
		: [],
});

const normaliseState = (raw: any): CargoState => ({
	code: String(raw?.code ?? ""),
	internal_label: String(raw?.internal_label ?? ""),
	customer_label: String(raw?.customer_label ?? ""),
});

const normaliseTransition = (raw: any): CargoTransition => ({
	from_code: String(raw?.from ?? raw?.from_code ?? ""),
	to_code: String(raw?.to ?? raw?.to_code ?? ""),
	requires_hold_clear: Boolean(raw?.requires_hold_clear ?? false),
	requires_docs: Boolean(raw?.requires_docs ?? false),
	requires_financial_clearance: Boolean(
		raw?.requires_financial_clearance ?? false
	),
	requires_authority_reference: Boolean(
		raw?.requires_authority_reference ?? false
	),
	notifies: Boolean(raw?.notifies ?? true),
});

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

const formatDate = (value: string | null) => {
	if (!value) return "—";
	return value.slice(0, 10);
};

const formatDateTime = (value: string | null) => {
	if (!value) return "—";
	return value.slice(0, 16);
};

const humaniseStatus = (value: string) =>
	value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function StatusPill({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ring-1 ring-inset",
				statusStyles[status] ?? statusFallback
			)}
		>
			{humaniseStatus(status)}
		</span>
	);
}

function DetailRow({
	label,
	value,
	mono,
}: {
	label: string;
	value: string | number | null | undefined;
	mono?: boolean;
}) {
	return (
		<div>
			<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 text-sm font-medium text-ink",
					mono && "font-mono"
				)}
			>
				{value === null || value === undefined || value === ""
					? "—"
					: value}
			</p>
		</div>
	);
}

export default function OperationsShipmentReviewPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [shipment, setShipment] = useState<Shipment | null>(null);
	const [config, setConfig] = useState<CurrentConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [actionNote, setActionNote] = useState("");
	const [holdReason, setHoldReason] = useState("");
	const [authorityReference, setAuthorityReference] = useState("");
	const [financialReference, setFinancialReference] = useState("");

	const fetchAll = async (silent = false) => {
		if (!id) return;

		if (silent) setRefreshing(true);
		else setLoading(true);

		try {
			const [shipmentRes, configRes] = await Promise.all([
				http.get(`/operator/shipment/${id}/`),
				http.get("/portal/shipment/config/"),
			]);

			const shipmentResp: Resp = shipmentRes.data;
			const configResp: Resp = configRes.data;

			if (shipmentResp.error) {
				toast.error(
					shipmentResp.data || "Could not load shipment."
				);
				return;
			}

		if (!configResp.error) {
			const cfgPayload: any = configResp.code ?? {};
			setConfig({
				states: Array.isArray(cfgPayload.cargo_states)
					? cfgPayload.cargo_states.map(normaliseState)
					: [],
				transitions: Array.isArray(cfgPayload.cargo_transitions)
					? cfgPayload.cargo_transitions.map(normaliseTransition)
					: [],
			});
		}

			const payload: any =
				shipmentResp.code?.shipment ?? shipmentResp.code ?? {};
			setShipment(normaliseShipment(payload));
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not load shipment."
			);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const stateLookup = useMemo(() => {
		const map = new Map<string, CargoState>();
		config?.states.forEach((state) => map.set(state.code, state));
		return map;
	}, [config]);

	const availableTransitions = useMemo(() => {
		if (!config || !shipment) return [];

		const isTerminal = stateLookup.get(shipment.status) === undefined
			? false
			: false;

		if (isTerminal) return [];

		return config.transitions.filter(
			(t) => t.from_code === shipment.status
		);
	}, [config, shipment, stateLookup]);

	const currentLabel = shipment
		? stateLookup.get(shipment.status)?.customer_label ??
		  humaniseStatus(shipment.status)
		: "";

	const requiresHoldClear = availableTransitions.some(
		(t) => t.requires_hold_clear
	);
	const requiresDocs = availableTransitions.some((t) => t.requires_docs);
	const requiresFinancial = availableTransitions.some(
		(t) => t.requires_financial_clearance
	);
	const requiresAuthority = availableTransitions.some(
		(t) => t.requires_authority_reference
	);

	const canSubmit = useMemo(() => {
		if (requiresAuthority && authorityReference.trim() === "") return false;
		if (requiresFinancial && financialReference.trim() === "") return false;
		return true;
	}, [
		requiresAuthority,
		authorityReference,
		requiresFinancial,
		financialReference,
	]);

	const handleTransition = async (toCode: string) => {
		if (!shipment || !id || submitting) return;

		if (!canSubmit) {
			toast.error(
				"Provide the required references before proceeding."
			);
			return;
		}

		setSubmitting(true);

		try {
			const formData = new URLSearchParams();
			formData.set("id", id);
			formData.set("to_status", toCode);
			formData.set("note", actionNote);
			if (holdReason) formData.set("hold_reason", holdReason);
			if (authorityReference)
				formData.set("authority_reference", authorityReference);
			if (financialReference)
				formData.set("financial_reference", financialReference);

			const res = await http.post(
				`/operator/shipment/transition/`,
				formData,
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);

			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(resp.data || "Could not update shipment.");
				return;
			}

			toast.success(resp.data || "Shipment updated.");
			setActionNote("");
			setHoldReason("");
			setAuthorityReference("");
			setFinancialReference("");
			await fetchAll(true);
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not update shipment."
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<AppShell
				title="Shipment review"
				eyebrow="Operations · Shipment"
			>
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (!shipment) {
		return (
			<AppShell
				title="Shipment review"
				eyebrow="Operations · Shipment"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Shipment not found
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								The shipment you are looking for does not exist
								or is not visible to your role.
							</p>
						</div>
					</div>
					<div className="mt-5">
						<Button
							onClick={() => navigate("/operations/shipments")}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Back to shipments
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	const reference =
		shipment.shipment_reference ?? shipment.id.slice(0, 8) + "…";

	return (
		<AppShell
			title="Shipment review"
			eyebrow="Operations · Shipment"
		>
			<div className="space-y-5 pb-10">
				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6"
				>
					<button
						onClick={() => navigate("/operations/shipments")}
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to shipments
					</button>

					<div className="mt-3 flex flex-wrap items-start justify-between gap-4">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								Shipment
							</p>
							<h1 className="mt-1 font-mono text-xl font-semibold text-ink sm:text-2xl">
								{reference}
							</h1>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<StatusPill status={shipment.status} />
								<span className="text-xs text-ink-soft">
									{currentLabel}
								</span>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								onClick={() => void fetchAll(true)}
								disabled={refreshing}
								className="gap-2 border-line bg-paper text-ink hover:bg-sand"
							>
								<RefreshCcw
									className={cn(
										"size-4",
										refreshing && "animate-spin"
									)}
								/>
								Refresh
							</Button>
						</div>
					</div>
				</motion.section>

				<div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<div className="space-y-5">
						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<Building2 className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Shipment summary
								</h2>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<DetailRow
									label="Organisation"
									value={shipment.organisation_name}
								/>
								<DetailRow
									label="Shipment type"
									value={shipment.shipment_type}
								/>
								<DetailRow
									label="Bill of lading"
									value={shipment.bill_of_lading}
									mono
								/>
								<DetailRow
									label="Booking number"
									value={shipment.booking_number}
									mono
								/>
								<DetailRow
									label="Vessel"
									value={shipment.vessel_name}
								/>
								<DetailRow
									label="Voyage"
									value={shipment.voyage_number}
								/>
								<DetailRow
									label="Shipping line"
									value={shipment.shipping_line}
								/>
								<DetailRow
									label="Customs reference"
									value={shipment.customs_reference}
									mono
								/>
							</div>
						</section>

						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<MapPin className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Routing
								</h2>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<DetailRow
									label="Origin country"
									value={shipment.origin_country}
								/>
								<DetailRow
									label="Origin port"
									value={shipment.origin_port}
								/>
								<DetailRow
									label="Destination port"
									value={shipment.destination_port}
								/>
								<DetailRow
									label="Expected arrival"
									value={formatDate(
										shipment.expected_arrival
									)}
								/>
							</div>
						</section>

						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<Package className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Cargo
								</h2>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<DetailRow
									label="Description"
									value={shipment.cargo_description}
								/>
								<DetailRow
									label="Category"
									value={shipment.cargo_category}
								/>
								<DetailRow
									label="Package type"
									value={shipment.package_type}
								/>
								<DetailRow
									label="Package count"
									value={shipment.package_count}
								/>
								<DetailRow
									label="Gross weight"
									value={shipment.gross_weight}
								/>
								<DetailRow
									label="Volume"
									value={shipment.volume}
								/>
								<DetailRow
									label="HS code"
									value={shipment.hs_code}
									mono
								/>
								<DetailRow
									label="Dangerous goods"
									value={shipment.dangerous_goods}
								/>
								<DetailRow
									label="Temperature controlled"
									value={shipment.temperature_controlled}
								/>
								<DetailRow
									label="Temperature"
									value={shipment.temperature}
								/>
							</div>
							{shipment.special_instructions && (
								<div className="mt-4 border-t border-line pt-4">
									<div className="mb-2 flex items-center gap-2">
										<AlertTriangle className="size-4 text-orange-deep" />
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Special instructions
										</p>
									</div>
									<p className="rounded-lg border border-orange/25 bg-orange/5 p-3 text-[12px] leading-6 text-ink">
										{shipment.special_instructions}
									</p>
								</div>
							)}
						</section>

						{shipment.containers.length > 0 && (
							<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
								<div className="mb-4 flex items-center gap-2">
									<Container className="size-4 text-ink-soft" />
									<h2 className="font-display text-sm font-bold text-ink">
										Containers
									</h2>
								</div>
								<div className="space-y-3">
									{shipment.containers.map((container) => (
										<div
											key={container.id}
											className="rounded-lg border border-line bg-sand p-3"
										>
											<div className="flex items-center justify-between gap-3">
												<span className="font-mono text-[12px] font-semibold text-ink">
													{container.container_no}
												</span>
												<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
													{container.size ?? "—"}
												</span>
											</div>
											<div className="mt-2 grid grid-cols-3 gap-3 text-[11px] text-ink-soft">
												<span>
													Seal:{" "}
													<span className="text-ink">
														{container.seal_no ??
															"—"}
													</span>
												</span>
												<span>
													Pkgs:{" "}
													<span className="text-ink">
														{container.package_count ??
															"—"}
													</span>
												</span>
												<span>
													Weight:{" "}
													<span className="text-ink">
														{container.gross_weight ??
															"—"}
													</span>
												</span>
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						{shipment.documents.length > 0 && (
							<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
								<div className="mb-4 flex items-center gap-2">
									<FileText className="size-4 text-ink-soft" />
									<h2 className="font-display text-sm font-bold text-ink">
										Documents
									</h2>
								</div>
								<div className="space-y-2">
									{shipment.documents.map((doc) => (
										<div
											key={doc.id}
											className="flex items-start gap-3 rounded-lg border border-line bg-sand p-3"
										>
											<FileCheck2 className="mt-0.5 size-4 shrink-0 text-ink-soft" />
											<div className="min-w-0 flex-1">
												<p className="text-[12px] font-medium text-ink">
													{doc.document_type}
												</p>
												<p className="mt-0.5 truncate text-[11px] text-ink-soft">
													{doc.original_name}
												</p>
												<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
													{doc.mime_type ?? "—"} ·{" "}
													{(
														doc.file_size / 1024
													).toFixed(1)}{" "}
													KB
												</p>
											</div>
										</div>
									))}
								</div>
							</section>
						)}
					</div>

					<div className="space-y-5">
						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<User className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Consignee
								</h2>
							</div>
							<div className="space-y-3">
								<DetailRow
									label="Name"
									value={shipment.consignee}
								/>
								<DetailRow
									label="Email"
									value={shipment.consignee_email}
								/>
								<DetailRow
									label="Phone"
									value={shipment.consignee_phone}
								/>
							</div>
						</section>

						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<Clock3 className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Timeline
								</h2>
							</div>
							<div className="space-y-3">
								<DetailRow
									label="Submitted"
									value={formatDateTime(
										shipment.created_at
									)}
								/>
								<DetailRow
									label="Last updated"
									value={formatDateTime(
										shipment.updated_at
									)}
								/>
							</div>
						</section>

						<section className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
							<div className="mb-4 flex items-center gap-2">
								<Ship className="size-4 text-ink-soft" />
								<h2 className="font-display text-sm font-bold text-ink">
									Actions
								</h2>
							</div>

							{availableTransitions.length === 0 ? (
								<div className="rounded-lg border border-line bg-sand p-3">
									<div className="flex items-start gap-2">
										<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-deep" />
										<div>
											<p className="text-[12px] font-semibold text-ink">
												No further actions
											</p>
											<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
												This shipment is in a terminal
												state. No further transitions
												are available.
											</p>
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									{requiresHoldClear && (
										<div className="rounded-lg border border-coral/25 bg-coral/5 p-3 text-[11px] leading-5 text-ink">
											<ShieldAlert className="mr-1 inline size-3.5 text-coral" />
											Active holds must be cleared
											before this transition.
										</div>
									)}
									{requiresDocs && (
										<div className="rounded-lg border border-orange/25 bg-orange/5 p-3 text-[11px] leading-5 text-ink">
											<FileCheck2 className="mr-1 inline size-3.5 text-orange-deep" />
											Required documents must be
											complete.
										</div>
									)}

									{requiresHoldClear && (
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Hold reason (optional)
											</span>
											<input
												type="text"
												value={holdReason}
												onChange={(e) =>
													setHoldReason(
														e.target.value
													)
												}
												placeholder="e.g. Discrepancy noted at receiving"
												className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
											/>
										</label>
									)}

									{requiresAuthority && (
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Authority reference{" "}
												<span className="text-coral">
													*
												</span>
											</span>
											<input
												type="text"
												value={authorityReference}
												onChange={(e) =>
													setAuthorityReference(
														e.target.value
													)
												}
												placeholder="e.g. Customs release reference"
												className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
											/>
										</label>
									)}

									{requiresFinancial && (
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Financial clearance
												reference{" "}
												<span className="text-coral">
													*
												</span>
											</span>
											<input
												type="text"
												value={financialReference}
												onChange={(e) =>
													setFinancialReference(
														e.target.value
													)
												}
												placeholder="e.g. Receipt number"
												className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
											/>
										</label>
									)}

									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Internal note (optional)
										</span>
										<textarea
											value={actionNote}
											onChange={(e) =>
												setActionNote(e.target.value)
											}
											rows={3}
											placeholder="Add a review note or explain the next action…"
											className="mt-1.5 w-full rounded-lg border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
										/>
									</label>

									<div className="grid grid-cols-1 gap-2">
										{availableTransitions.map(
											(transition) => {
												const target =
													stateLookup.get(
														transition.to_code
													);
												const label =
													target?.customer_label ??
													humaniseStatus(
														transition.to_code
													);

												const isHoldAction =
													transition.to_code ===
													"HELD";

												return (
													<Button
														key={
															transition.to_code
														}
														disabled={
															submitting ||
															!canSubmit
														}
														onClick={() =>
															void handleTransition(
																transition.to_code
															)
														}
														className={cn(
															"justify-start gap-2 text-white",
															isHoldAction
																? "bg-coral hover:bg-coral/90"
																: "bg-orange hover:bg-orange-deep"
														)}
													>
														{isHoldAction ? (
															<ShieldAlert className="size-4" />
														) : (
															<CheckCircle2 className="size-4" />
														)}
														{submitting
															? "Updating…"
															: `Move to ${label}`}
													</Button>
												);
											}
										)}
									</div>
								</div>
							)}
						</section>

						<section className="rounded-2xl border border-line bg-sand/50 p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[12px] font-semibold text-ink">
										Terminal operator scope
									</p>
									<p className="mt-1 text-[11px] leading-5 text-ink-soft">
										You can only progress a shipment to
										the next state(s) defined by the cargo
										lifecycle configuration. Regulatory
										releases are recorded, not made, by
										terminal staff. Every transition is
										audited.
									</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppShell>
	);
}