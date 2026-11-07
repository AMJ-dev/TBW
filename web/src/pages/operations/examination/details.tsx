import {
	useEffect,
	useMemo,
	useState,
	type ElementType,
	type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/components/router-link";
import {
	AppShell,
	Metric,
	StatusBadge,
	statusTone,
} from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	CalendarDays,
	Check,
	ChevronRight,
	Clock3,
	Container,
	FileText,
	Play,
	RefreshCw,
	Search,
	Ship,
	ShieldCheck,
	UserRound,
	AlertCircle,
	MapPin,
	Activity,
} from "lucide-react";

type ExaminationStatus =
	| "SCHEDULED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "CHANGES_REQUESTED"
	| "CANCELLED"
	| "DISCREPANCY_FOUND"
	| "FURTHER_EXAMINATION";

type ExaminationLog = {
	id: string;
	action: string;
	previous_status: string | null;
	new_status: string | null;
	description: string;
	performed_at: string;
	performed_by_name: string;
	metadata: Record<string, unknown> | null;
};

type Examination = {
	id: string;
	reference: string;
	type: string;
	priority: string;
	status: ExaminationStatus;
	scheduled_date: string;
	scheduled_time: string;
	instructions: string;
	findings: string;
	remarks: string;
	completed_at: string;
	reviewed_at: string;
	created_at: string;
	updated_at: string;
	shipment: {
		id: string;
		reference: string;
		bill_of_lading: string;
		booking_number: string;
		vessel: string;
		voyage: string;
		shipping_line: string;
		origin_country: string;
		origin_port: string;
		destination_port: string;
		expected_arrival: string;
		consignee: string;
		consignee_email: string;
		consignee_phone: string;
		cargo_description: string;
		cargo_category: string;
		package_type: string;
		package_count: string;
		gross_weight: string;
		status: string;
	};
	container: {
		id: string;
		number: string;
		size: string;
		seal: string;
		weight: string;
		cargo_description: string;
		status: string;
		current_location_id: string;
	};
	location: {
		id: string;
		code: string;
		name: string;
		description: string;
		kind: string;
	};
	officer: {
		id: string;
		name: string;
		email: string;
		phone: string;
	};
	reviewer: {
		id: string;
		name: string;
		email: string;
	};
	created_by: {
		id: string;
		name: string;
	};
	checklist: any[];
	findings_list: any[];
	report: {
		findings: string;
		remarks: string;
		completed_at: string;
	};
	logs: ExaminationLog[];
};

function getString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

function normalizeExamination(code: any): Examination {
	const record = code?.examination ?? {};
	const shipment = record.shipment ?? {};
	const container = record.container ?? {};
	const location = record.location ?? {};
	const officer = record.officer ?? {};
	const reviewer = record.reviewer ?? {};
	const createdBy = record.created_by ?? {};
	const report = code?.report ?? {};

	const logs: ExaminationLog[] = Array.isArray(code?.logs)
		? code.logs.map((log: any) => ({
				id: getString(log?.id),
				action: getString(log?.action),
				previous_status: getString(log?.previous_status) || null,
				new_status: getString(log?.new_status) || null,
				description: getString(log?.description),
				performed_at: getString(log?.performed_at),
				performed_by_name: getString(log?.performed_by_name),
				metadata:
					log?.metadata && typeof log.metadata === "object"
						? log.metadata
						: null,
			}))
		: [];

	return {
		id: getString(record.id),
		reference: getString(record.reference) || getString(record.id),
		type: getString(record.examination_type),
		priority: getString(record.priority),
		status: getString(record.status, "SCHEDULED") as ExaminationStatus,
		scheduled_date: getString(record.scheduled_date),
		scheduled_time: getString(record.scheduled_time),
		instructions: getString(record.instructions),
		findings: getString(record.findings) || getString(report.findings),
		remarks: getString(record.remarks) || getString(report.remarks),
		completed_at:
			getString(record.completed_at) || getString(report.completed_at),
		reviewed_at: getString(record.reviewed_at),
		created_at: getString(record.created_at),
		updated_at: getString(record.updated_at),
		shipment: {
			id: getString(shipment.id),
			reference: getString(shipment.shipment_reference),
			bill_of_lading: getString(shipment.bill_of_lading),
			booking_number: getString(shipment.booking_number),
			vessel: getString(shipment.vessel_name),
			voyage: getString(shipment.voyage_number),
			shipping_line: getString(shipment.shipping_line),
			origin_country: getString(shipment.origin_country),
			origin_port: getString(shipment.origin_port),
			destination_port: getString(shipment.destination_port),
			expected_arrival: getString(shipment.expected_arrival),
			consignee: getString(shipment.consignee),
			consignee_email: getString(shipment.consignee_email),
			consignee_phone: getString(shipment.consignee_phone),
			cargo_description: getString(shipment.cargo_description),
			cargo_category: getString(shipment.cargo_category),
			package_type: getString(shipment.package_type),
			package_count: getString(shipment.package_count),
			gross_weight: getString(shipment.gross_weight),
			status: getString(shipment.status),
		},
		container: {
			id: getString(container.id),
			number: getString(container.container_no),
			size: getString(container.size),
			seal: getString(container.seal_no),
			weight: getString(container.gross_weight),
			cargo_description: getString(container.cargo_description),
			status: getString(container.status),
			current_location_id: getString(container.current_location_id),
		},
		location: {
			id: getString(location.id),
			code: getString(location.code),
			name: getString(location.name),
			description: getString(location.description),
			kind: getString(location.kind),
		},
		officer: {
			id: getString(officer.id),
			name: getString(officer.name),
			email: getString(officer.email),
			phone: getString(officer.phone),
		},
		reviewer: {
			id: getString(reviewer.id),
			name: getString(reviewer.name),
			email: getString(reviewer.email),
		},
		created_by: {
			id: getString(createdBy.id),
			name: getString(createdBy.name),
		},
		checklist: Array.isArray(code?.checklist) ? code.checklist : [],
		findings_list: Array.isArray(code?.findings) ? code.findings : [],
		report: {
			findings: getString(report.findings),
			remarks: getString(report.remarks),
			completed_at: getString(report.completed_at),
		},
		logs,
	};
}

function Section({
	title,
	description,
	icon: Icon,
	children,
}: {
	title: string;
	description?: string;
	icon: ElementType;
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-xl border border-line bg-paper">
			<div className="flex items-center gap-3 border-b border-line px-5 py-4">
				<div className="rounded-lg bg-orange/10 p-2 text-orange">
					<Icon size={18} />
				</div>
				<div>
					<h2 className="text-sm font-semibold text-ink">{title}</h2>
					{description && (
						<p className="mt-1 text-xs text-ink-soft">{description}</p>
					)}
				</div>
			</div>
			<div className="p-5">{children}</div>
		</section>
	);
}

function Detail({
	label,
	value,
}: {
	label: string;
	value?: string | number | null;
}) {
	return (
		<div className="min-w-0">
			<p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-semibold text-ink">
				{value || "Not recorded"}
			</p>
		</div>
	);
}

function formatStatus(status: string) {
	return status ? status.replaceAll("_", " ") : "Not recorded";
}

function formatDate(value: string) {
	if (!value) return "Not recorded";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString();
}

export default function ExaminationDetailsPage() {
	const { id } = useParams();

	const [examination, setExamination] = useState<Examination | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [retry, setRetry] = useState(0);

	useEffect(() => {
		if (!id) {
			setExamination(null);
			setLoadError("Examination ID is missing.");
			setLoading(false);
			return;
		}

		let mounted = true;

		async function loadExamination() {
			setLoading(true);
			setLoadError("");

			try {
				const response = await http.get(`/operator/examination/${id}/`);
				const resp: Resp = response.data;

				if (resp.error) {
					throw new Error(
						getString(
							resp.data,
							"Could not load examination details.",
						),
					);
				}

				const code = resp.code as any;
				const record = code?.examination;

				if (!record?.id) {
					throw new Error("Examination record was not found.");
				}

				const normalized = normalizeExamination(code);

				if (mounted) {
					setExamination(normalized);
				}
			} catch (error: any) {
				if (mounted) {
					setExamination(null);
					setLoadError(
						getString(
							error?.response?.data?.data,
							getString(
								error?.message,
								"Could not load examination details.",
							),
						),
					);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		void loadExamination();

		return () => {
			mounted = false;
		};
	}, [id, retry]);

	const timeline = useMemo(() => {
		if (!examination) return [];

		if (examination.logs.length > 0) {
			return examination.logs.map((log) => ({
				id: log.id,
				title: formatStatus(log.action),
				description:
					log.description ||
					`${formatStatus(log.previous_status || "")} → ${formatStatus(
						log.new_status || "",
					)}`,
				date: log.performed_at,
				actor: log.performed_by_name,
				done: true,
			}));
		}

		const status = examination.status;

		const started = status !== "SCHEDULED";
		const submitted = [
			"COMPLETED",
			"PENDING_REVIEW",
			"APPROVED",
			"CHANGES_REQUESTED",
		].includes(status);

		const reviewed = ["APPROVED", "CHANGES_REQUESTED"].includes(status);

		return [
			{
				id: "scheduled",
				title: "Examination scheduled",
				description: "Examination assignment created.",
				date: examination.created_at,
				actor: examination.created_by.name,
				done: true,
			},
			{
				id: "started",
				title: "Examination started",
				description: "Officer commenced the examination.",
				date: started ? "Started" : "Awaiting",
				actor: "",
				done: started,
			},
			{
				id: "submitted",
				title: "Examination submitted",
				description: "Examination findings submitted for review.",
				date: submitted ? "Submitted" : "Awaiting",
				actor: "",
				done: submitted,
			},
			{
				id: "reviewed",
				title: "Review decision",
				description: "Authorised reviewer decision.",
				date:
					status === "APPROVED"
						? "Approved"
						: status === "CHANGES_REQUESTED"
							? "Changes requested"
							: "Awaiting",
				actor: examination.reviewer.name,
				done: reviewed,
			},
		];
	}, [examination]);

	const canConduct =
		examination?.status === "SCHEDULED" ||
		examination?.status === "IN_PROGRESS" ||
		examination?.status === "CHANGES_REQUESTED";

	if (loading) {
		return (
			<AppShell title="Examination details" eyebrow="Operations">
				<div className="flex min-h-[50vh] items-center justify-center">
					<div className="text-center">
						<div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-orange/20 border-t-orange" />
						<p className="mt-4 text-sm text-ink-soft">
							Loading examination details...
						</p>
					</div>
				</div>
			</AppShell>
		);
	}

	if (loadError || !examination) {
		return (
			<AppShell title="Examination details" eyebrow="Operations">
				<div className="mx-auto max-w-xl py-16 text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
						<AlertCircle size={22} />
					</div>

					<h2 className="mt-4 text-lg font-semibold text-ink">
						Unable to load examination
					</h2>

					<p className="mt-2 text-sm text-ink-soft">
						{loadError || "The requested examination could not be found."}
					</p>

					<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
						<button
							type="button"
							onClick={() => setRetry((current) => current + 1)}
							className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-deep"
						>
							<RefreshCw size={15} />
							Retry
						</button>

						<Link
							to="/operations/examinations"
							className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-orange hover:text-orange"
						>
							<ArrowLeft size={15} />
							Back to examinations
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Examination details" eyebrow="Operations">
			<div className="space-y-6 pb-10">
				<div>
					<Link
						to="/operations/examinations"
						className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-ink-soft hover:text-orange"
					>
						<ArrowLeft size={15} />
						Back to examinations
					</Link>

					<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
						<div>
							<div className="mb-2 flex items-center gap-2 text-xs text-ink-soft">
								<span>Operations</span>
								<ChevronRight size={13} />
								<Link
									to="/operations/examinations"
									className="hover:text-orange"
								>
									Examinations
								</Link>
								<ChevronRight size={13} />
								<span className="font-medium text-orange">Details</span>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<h1 className="text-2xl font-semibold tracking-tight text-ink">
									{examination.reference}
								</h1>
								<StatusBadge
									label={formatStatus(examination.status)}
									tone={statusTone(examination.status)}
								/>
							</div>

							<p className="mt-1 text-sm text-ink-soft">
								Examination record and assignment information.
							</p>
						</div>

						{canConduct && (
							<Link
								to={`/operations/examinations/start/${examination.id}`}
								className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-deep"
							>
								<Play size={15} />
								{examination.status === "SCHEDULED"
									? "Start examination"
									: "Continue examination"}
							</Link>
						)}

						{examination.status === "PENDING_REVIEW" && (
							<Link
								to={`/operations/examinations/${examination.id}/review`}
								className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-deep"
							>
								<ShieldCheck size={15} />
								Review examination
							</Link>
						)}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Examination type"
						value={formatStatus(examination.type)}
						icon={Search}
					/>
					<Metric
						label="Scheduled date"
						value={`${examination.scheduled_date} ${examination.scheduled_time}`}
						icon={CalendarDays}
					/>
					<Metric
						label="Assigned officer"
						value={examination.officer.name || "Not assigned"}
						icon={UserRound}
					/>
					<Metric
						label="Priority"
						value={formatStatus(examination.priority)}
						icon={Clock3}
					/>
				</div>

				<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
					<div className="min-w-0 space-y-5">
						<Section
							title="Shipment information"
							description="Shipment details linked to this examination."
							icon={Ship}
						>
							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
								<Detail
									label="Shipment reference"
									value={examination.shipment.reference}
								/>
								<Detail
									label="Bill of lading"
									value={examination.shipment.bill_of_lading}
								/>
								<Detail
									label="Booking number"
									value={examination.shipment.booking_number}
								/>
								<Detail
									label="Vessel"
									value={examination.shipment.vessel}
								/>
								<Detail
									label="Voyage number"
									value={examination.shipment.voyage}
								/>
								<Detail
									label="Shipping line"
									value={examination.shipment.shipping_line}
								/>
								<Detail
									label="Origin country"
									value={examination.shipment.origin_country}
								/>
								<Detail
									label="Origin port"
									value={examination.shipment.origin_port}
								/>
								<Detail
									label="Destination port"
									value={examination.shipment.destination_port}
								/>
								<Detail
									label="Expected arrival"
									value={examination.shipment.expected_arrival}
								/>
								<Detail
									label="Consignee"
									value={examination.shipment.consignee}
								/>
								<Detail
									label="Consignee email"
									value={examination.shipment.consignee_email}
								/>
								<Detail
									label="Consignee phone"
									value={examination.shipment.consignee_phone}
								/>
								<Detail
									label="Cargo category"
									value={examination.shipment.cargo_category}
								/>
								<Detail
									label="Package type"
									value={examination.shipment.package_type}
								/>
								<Detail
									label="Package count"
									value={examination.shipment.package_count}
								/>
								<Detail
									label="Shipment gross weight"
									value={examination.shipment.gross_weight}
								/>
								<Detail
									label="Shipment status"
									value={formatStatus(examination.shipment.status)}
								/>
								<Detail
									label="Cargo description"
									value={examination.shipment.cargo_description}
								/>
							</div>
						</Section>

						<Section
							title="Container information"
							description="Container selected for examination."
							icon={Container}
						>
							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
								<Detail
									label="Container number"
									value={examination.container.number}
								/>
								<Detail
									label="Container size"
									value={examination.container.size}
								/>
								<Detail
									label="Seal number"
									value={examination.container.seal}
								/>
								<Detail
									label="Container gross weight"
									value={examination.container.weight}
								/>
								<Detail
									label="Cargo description"
									value={examination.container.cargo_description}
								/>
								<Detail
									label="Container status"
									value={formatStatus(examination.container.status)}
								/>
								<Detail
									label="Current location ID"
									value={examination.container.current_location_id}
								/>
							</div>
						</Section>

						<Section
							title="Examination assignment"
							description="Scheduling and assignment information."
							icon={CalendarDays}
						>
							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
								<Detail
									label="Examination reference"
									value={examination.reference}
								/>
								<Detail
									label="Examination type"
									value={formatStatus(examination.type)}
								/>
								<Detail
									label="Examination location"
									value={examination.location.name}
								/>
								<Detail
									label="Location code"
									value={examination.location.code}
								/>
								<Detail
									label="Location type"
									value={formatStatus(examination.location.kind)}
								/>
								<Detail
									label="Examination officer"
									value={examination.officer.name}
								/>
								<Detail
									label="Officer email"
									value={examination.officer.email}
								/>
								<Detail
									label="Officer phone"
									value={examination.officer.phone}
								/>
								<Detail
									label="Scheduled date"
									value={examination.scheduled_date}
								/>
								<Detail
									label="Scheduled time"
									value={examination.scheduled_time}
								/>
								<Detail
									label="Priority"
									value={formatStatus(examination.priority)}
								/>
							</div>

							{examination.location.description && (
								<div className="mt-5 rounded-lg bg-sand/70 p-4">
									<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Location description
									</p>
									<p className="mt-2 text-sm leading-6 text-ink">
										{examination.location.description}
									</p>
								</div>
							)}

							<div className="mt-5 rounded-lg bg-sand/70 p-4">
								<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
									Instructions
								</p>
								<p className="mt-2 text-sm leading-6 text-ink">
									{examination.instructions || "No special instructions."}
								</p>
							</div>
						</Section>

						<Section
							title="Examination report"
							description="Findings and remarks recorded for this examination."
							icon={FileText}
						>
							<div className="space-y-5">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Findings
									</p>
									<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
										{examination.findings || "No findings recorded."}
									</p>
								</div>

								<div className="border-t border-line pt-4">
									<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Remarks
									</p>
									<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
										{examination.remarks || "No remarks recorded."}
									</p>
								</div>

								<div className="grid gap-5 border-t border-line pt-4 sm:grid-cols-2">
									<Detail
										label="Completed at"
										value={examination.completed_at}
									/>
									<Detail
										label="Reviewed at"
										value={examination.reviewed_at}
									/>
								</div>
							</div>
						</Section>

						<Section
							title="Record information"
							description="Creation and update information."
							icon={FileText}
						>
							<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
								<Detail
									label="Created at"
									value={formatDate(examination.created_at)}
								/>
								<Detail
									label="Last updated"
									value={formatDate(examination.updated_at)}
								/>
								<Detail
									label="Created by"
									value={examination.created_by.name}
								/>
								<Detail
									label="Reviewer"
									value={examination.reviewer.name}
								/>
								<Detail
									label="Reviewer email"
									value={examination.reviewer.email}
								/>
							</div>
						</Section>
					</div>

					<aside className="space-y-5">
						<div className="rounded-xl border border-line bg-paper p-5">
							<div className="flex items-center gap-2">
								<Activity size={17} className="text-orange" />
								<h3 className="text-sm font-semibold text-ink">
									Examination activity
								</h3>
							</div>

							<p className="mt-1 text-xs text-ink-soft">
								Recorded examination events and status changes.
							</p>

							{timeline.length === 0 ? (
								<p className="mt-5 text-xs text-ink-soft">
									No activity has been recorded.
								</p>
							) : (
								<div className="mt-5 space-y-5">
									{timeline.map((event, index) => (
										<div key={event.id} className="relative flex gap-3">
											{index !== timeline.length - 1 && (
												<div
													className={`absolute left-[11px] top-7 h-full w-px ${
														event.done ? "bg-emerald-300" : "bg-line"
													}`}
												/>
											)}

											<div
												className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
													event.done
														? "bg-emerald-100 text-emerald-700"
														: "border border-line bg-paper text-ink-soft"
												}`}
											>
												{event.done ? (
													<Check size={13} />
												) : (
													<span className="text-[9px]">{index + 1}</span>
												)}
											</div>

											<div className="min-w-0 pb-1">
												<p className="text-xs font-semibold text-ink">
													{event.title}
												</p>
												<p className="mt-1 text-[10px] leading-4 text-ink-soft">
													{event.description}
												</p>
												{event.actor && (
													<p className="mt-1 text-[10px] font-medium text-ink">
														By {event.actor}
													</p>
												)}
												<p className="mt-1 text-[10px] text-ink-soft">
													{formatDate(event.date)}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="rounded-xl border border-line bg-paper p-5">
							<h3 className="text-sm font-semibold text-ink">
								Assigned personnel
							</h3>

							<div className="mt-4 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/10 text-orange">
									<UserRound size={18} />
								</div>
								<div className="min-w-0">
									<p className="text-xs font-semibold text-ink">
										{examination.officer.name || "Not assigned"}
									</p>
									<p className="mt-1 break-all text-[10px] text-ink-soft">
										{examination.officer.email}
									</p>
								</div>
							</div>

							<div className="mt-4 border-t border-line pt-4">
								<p className="text-[10px] uppercase tracking-wider text-ink-soft">
									Review responsibility
								</p>
								<p className="mt-1 text-xs font-semibold text-ink">
									{examination.reviewer.name || "Not assigned"}
								</p>
								{examination.reviewer.email && (
									<p className="mt-1 break-all text-[10px] text-ink-soft">
										{examination.reviewer.email}
									</p>
								)}
							</div>
						</div>

						<div className="rounded-xl border border-line bg-paper p-5">
							<div className="flex items-center gap-2">
								<MapPin size={17} className="text-orange" />
								<h3 className="text-sm font-semibold text-ink">
									Examination location
								</h3>
							</div>

							<p className="mt-3 text-sm font-semibold text-ink">
								{examination.location.name || "Not assigned"}
							</p>
							<p className="mt-1 text-xs text-ink-soft">
								{examination.location.code}
							</p>
							<p className="mt-2 text-[10px] text-ink-soft">
								{formatStatus(examination.location.kind)}
							</p>
						</div>

						<div className="rounded-xl border border-orange/20 bg-orange/[0.035] p-4">
							<div className="flex items-center gap-2">
								<ShieldCheck size={17} className="text-orange" />
								<p className="text-xs font-semibold text-ink">
									Examination guidance
								</p>
							</div>
							<p className="mt-2 text-xs leading-5 text-ink-soft">
								The examination officer records checklist results, findings
								and the examination report from the conduct examination
								workspace. The submitted report must be reviewed separately.
							</p>
						</div>

						<div className="rounded-xl border border-line bg-paper p-4">
							<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
								Record identifier
							</p>
							<p className="mt-2 break-all font-mono text-[10px] text-ink">
								{examination.id}
							</p>
						</div>
					</aside>
				</div>

				{examination.status === "CANCELLED" && (
					<AnimatePresence>
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
						>
							This examination has been cancelled. Conduct actions are
							unavailable.
						</motion.div>
					</AnimatePresence>
				)}
			</div>
		</AppShell>
	);
}