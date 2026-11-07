
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/components/router-link";
import { AppShell } from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
	ArrowLeft,
	ClipboardCheck,
	ClipboardList,
	Clock,
	Container,
	FileText,
	Flag,
	Plus,
	ShieldCheck,
	Trash2,
	Play,
} from "lucide-react";
import { toast } from "sonner";

type ExaminationStatus =
	| "SCHEDULED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "CHANGES_REQUESTED"
	| "DISCREPANCY_FOUND"
	| "FURTHER_EXAMINATION"
	| "CANCELLED";

type ChecklistResult = "PENDING" | "PASS" | "ISSUE" | "NA";
type FindingSeverity = "LOW" | "MEDIUM" | "HIGH";

type ChecklistItem = {
	id: string;
	label: string;
	description: string;
	result: ChecklistResult;
	remarks: string;
};

type Finding = {
	id: string;
	title: string;
	description: string;
	severity: FindingSeverity;
};

type Examination = {
	id: string;
	reference: string;
	examination_type: string;
	status: ExaminationStatus;
	priority: string;
	scheduled_date: string;
	scheduled_time: string;
	instructions: string | null;
	findings: string | null;
	remarks: string | null;
	completed_at: string | null;
	shipment: {
		id: string;
		shipment_reference: string;
		bill_of_lading: string;
		booking_number: string;
		vessel_name: string;
		voyage_number: string;
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
		container_no: string;
		size: string;
		seal_no: string;
		gross_weight: string;
		cargo_description: string;
		status: string;
		current_location_id: string | null;
	};
	location: {
		id: string;
		code: string;
		name: string;
		description: string;
		kind: string;
	};
	officer: {
		id: string | null;
		name: string | null;
		email: string | null;
		phone?: string | null;
	};
	reviewer: {
		id: string | null;
		name: string | null;
		email: string | null;
	};
	created_by: {
		id: string | null;
		name: string | null;
	};
};

type ExaminationLog = {
	id: string;
	action: string;
	previous_status: string | null;
	new_status: string | null;
	description: string;
	performed_at: string;
	performed_by_name: string | null;
};

const checklistTemplate: ChecklistItem[] = [
	{
		id: "container_condition",
		label: "Container condition",
		description: "Inspect the general external condition of the container.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "container_seal",
		label: "Seal verification",
		description: "Verify the seal number against the declared shipment details.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "cargo_description",
		label: "Cargo description",
		description: "Verify that the cargo corresponds with the declared description.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "quantity",
		label: "Cargo quantity",
		description: "Check the declared package count and observed quantity.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "documentation",
		label: "Supporting documentation",
		description: "Verify the relevant shipment documentation.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "compliance",
		label: "Compliance checks",
		description: "Record any compliance concerns identified during examination.",
		result: "PENDING",
		remarks: "",
	},
];

const severityOptions: FindingSeverity[] = ["LOW", "MEDIUM", "HIGH"];

function getString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

function getStatusLabel(value: string): string {
	return value
		.toLowerCase()
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function formatDate(value: string | null | undefined): string {
	if (!value) return "Not available";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatDateTime(value: string | null | undefined): string {
	if (!value) return "Not available";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function SectionCard({
	title,
	description,
	icon: Icon,
	children,
}: {
	title: string;
	description?: string;
	icon: LucideIcon;
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
			<div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
					<Icon size={19} />
				</div>
				<div className="min-w-0">
					<h2 className="font-semibold text-ink">{title}</h2>
					{description && (
						<p className="mt-1 text-sm text-ink-soft">{description}</p>
					)}
				</div>
			</div>
			<div className="p-5 sm:p-6">{children}</div>
		</section>
	);
}

function InfoItem({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="min-w-0">
			<p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-semibold text-ink">
				{value || "Not available"}
			</p>
		</div>
	);
}

function FieldLabel({
	children,
	required,
}: {
	children: ReactNode;
	required?: boolean;
}) {
	return (
		<label className="mb-2 block text-sm font-medium text-ink">
			{children}
			{required && <span className="ml-1 text-red-500">*</span>}
		</label>
	);
}

function StatusPill({ status }: { status: string }) {
	const tone =
		status === "COMPLETED" || status === "APPROVED" || status === "PASS"
			? "bg-green-50 text-green-700"
			: status === "CANCELLED" || status === "DISCREPANCY_FOUND" || status === "ISSUE"
				? "bg-red-50 text-red-700"
				: status === "IN_PROGRESS"
					? "bg-blue-50 text-blue-700"
					: "bg-orange/10 text-orange";

	return (
		<span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
			{getStatusLabel(status)}
		</span>
	);
}

export default function ConductExaminationPage() {
	const { id } = useParams<{ id: string }>();

	const [examination, setExamination] = useState<Examination | null>(null);
	const [logs, setLogs] = useState<ExaminationLog[]>([]);
	const [checklist, setChecklist] = useState<ChecklistItem[]>(checklistTemplate);
	const [findings, setFindings] = useState<Finding[]>([]);
	const [report, setReport] = useState("");
	const [remarks, setRemarks] = useState("");
	const [findingTitle, setFindingTitle] = useState("");
	const [findingDescription, setFindingDescription] = useState("");
	const [findingSeverity, setFindingSeverity] =
		useState<FindingSeverity>("MEDIUM");
	const [loading, setLoading] = useState(true);
	const [starting, setStarting] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [loadError, setLoadError] = useState("");

	const isScheduled = examination?.status === "SCHEDULED";
	const isCompleted = examination?.status === "COMPLETED";
	const isSubmitted =
		examination?.status === "PENDING_REVIEW" ||
		examination?.status === "APPROVED";

	const showWorkspace = !!examination && !isScheduled;
	const isReadOnly = isCompleted || isSubmitted;

	const completedChecklist = useMemo(
		() => checklist.filter((item) => item.result !== "PENDING").length,
		[checklist],
	);

	const checklistComplete = completedChecklist === checklist.length;

	const hasChecklistIssues = checklist.some(
		(item) => item.result === "ISSUE",
	);

	const canSubmit =
		!!examination &&
		examination.status === "IN_PROGRESS" &&
		!isReadOnly &&
		checklistComplete &&
		report.trim().length > 0 &&
		(findings.length > 0 || remarks.trim().length > 0) &&
		!submitting;

	const progress = useMemo(() => {
		const total = checklist.length + 2;
		let completed = completedChecklist;

		if (findings.length > 0) completed += 1;
		if (report.trim()) completed += 1;

		return Math.round((completed / total) * 100);
	}, [checklist.length, completedChecklist, findings.length, report]);

	const loadExamination = useCallback(async () => {
		if (!id) {
			setLoadError("Examination ID is missing.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setLoadError("");

		try {
			const response = await http.get(`/operator/examination/${id}/`);
			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not load examination details."),
				);
			}

			const code = resp.code as any;
			const record = code?.examination ?? code;

			if (!record?.id) {
				throw new Error("The examination record was not found.");
			}

			setExamination(record as Examination);

			const serverChecklist = Array.isArray(code?.checklist)
				? code.checklist
				: [];

			setChecklist(
				serverChecklist.length
					? serverChecklist.map((item: any, index: number) => ({
							id: getString(item.id, `checklist-${index}`),
							label: getString(item.label, getString(item.title)),
							description: getString(item.description),
							result: ["PENDING", "PASS", "ISSUE", "NA"].includes(item.result)
								? item.result
								: "PENDING",
							remarks: getString(item.remarks),
						}))
					: checklistTemplate,
			);

			const serverFindings = Array.isArray(code?.findings)
				? code.findings
				: [];

			setFindings(
				serverFindings.map((item: any, index: number) => ({
					id: getString(item.id, `finding-${index}`),
					title: getString(item.title),
					description: getString(item.description),
					severity: severityOptions.includes(item.severity)
						? item.severity
						: "MEDIUM",
				})),
			);

			setReport(
				getString(code?.report?.findings, getString(record.findings)),
			);
			setRemarks(
				getString(code?.report?.remarks, getString(record.remarks)),
			);


			setLogs(Array.isArray(code?.logs) ? code.logs : []);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Could not load examination details.";

			setLoadError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		void loadExamination();
	}, [loadExamination]);

	const startExamination = async () => {
		if (!id || !examination || starting) return;

		if (examination.status !== "SCHEDULED") {
			toast.info("This examination has already been started.");
			return;
		}

		setStarting(true);

		try {
			const formData = new FormData();
			formData.append("examination_id", id);

			const response = await http.post(
				"/operator/examination/start/",
				formData,
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not start examination."),
				);
			}

			toast.success("Examination started successfully.");
			await loadExamination();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not start examination.",
			);
		} finally {
			setStarting(false);
		}
	};

	const updateChecklist = (
		checklistId: string,
		field: "result" | "remarks",
		value: string,
	) => {
		setChecklist((current) =>
			current.map((item) =>
				item.id === checklistId ? { ...item, [field]: value } : item,
			),
		);
	};

	const addFinding = () => {
		if (!findingTitle.trim() || !findingDescription.trim()) {
			toast.error("Enter a finding title and description.");
			return;
		}

		setFindings((current) => [
			...current,
			{
				id: crypto.randomUUID(),
				title: findingTitle.trim(),
				description: findingDescription.trim(),
				severity: findingSeverity,
			},
		]);

		setFindingTitle("");
		setFindingDescription("");
		setFindingSeverity("MEDIUM");

		toast.success("Finding added.");
	};

	const removeFinding = (findingId: string) => {
		setFindings((current) =>
			current.filter((item) => item.id !== findingId),
		);
	};

	const submitExamination = async () => {
		if (!id || !examination || submitting) return;

		if (examination.status !== "IN_PROGRESS") {
			toast.error("The examination must be in progress before submission.");
			return;
		}

		if (!checklistComplete) {
			toast.error("Complete every checklist item before submitting.");
			return;
		}

		if (!report.trim()) {
			toast.error("Enter the examination report before submitting.");
			return;
		}

		if (findings.length === 0 && !remarks.trim()) {
			toast.error("Add a finding or provide examination remarks.");
			return;
		}

		setSubmitting(true);

		try {
			const formData = new FormData();

			formData.append("examination_id", id);
			formData.append("report", report.trim());
			formData.append("remarks", remarks.trim());
			formData.append(
				"checklist",
				JSON.stringify(
					checklist.map((item) => ({
						id: item.id,
						label: item.label,
						description: item.description,
						result: item.result,
						remarks: item.remarks,
					})),
				),
			);
			formData.append(
				"findings",
				JSON.stringify(
					findings.map((item) => ({
						id: item.id,
						title: item.title,
						description: item.description,
						severity: item.severity,
					})),
				),
			);

			const response = await http.post(
				"/operator/examination/finish/",
				formData,
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not submit examination."),
				);
			}

			toast.success("Examination submitted successfully.");
			await loadExamination();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not submit examination.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="Conduct Examination" eyebrow="Operations">
				<div className="flex min-h-[60vh] items-center justify-center">
					<div className="text-center">
						<div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange/20 border-t-orange" />
						<p className="mt-4 text-sm text-ink-soft">
							Loading examination...
						</p>
					</div>
				</div>
			</AppShell>
		);
	}

	if (loadError || !examination) {
		return (
			<AppShell title="Conduct Examination" eyebrow="Operations">
				<div className="mx-auto max-w-2xl py-16 text-center">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
						<ClipboardList size={26} />
					</div>
					<h2 className="mt-5 text-xl font-bold text-ink">
						Unable to load examination
					</h2>
					<p className="mt-2 text-sm text-ink-soft">
						{loadError || "The examination record could not be found."}
					</p>
					<div className="mt-6 flex justify-center gap-3">
						<button
							type="button"
							onClick={() => void loadExamination()}
							className="rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-deep"
						>
							Try again
						</button>
						<Link
							to="/operations/examinations"
							className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink"
						>
							Back to examinations
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Conduct Examination" eyebrow="Operations">
			<div className="mx-auto max-w-7xl space-y-6 pb-12">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<Link
							to={`/operations/examinations/${examination.id}`}
							className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-orange"
						>
							<ArrowLeft size={16} />
							Back to examination details
						</Link>

						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight text-ink">
								{examination.reference}
							</h1>
							<StatusPill status={examination.status} />
						</div>

						<p className="mt-1 text-sm text-ink-soft">
							{isScheduled
								? "Review the assignment details before starting the examination."
								: "Record the inspection results, findings and examination report."}
						</p>
					</div>

					{isScheduled && (
						<button
							type="button"
							onClick={() => void startExamination()}
							disabled={starting}
							className="inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-60"
						>
							{starting ? (
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
							) : (
								<Play size={17} />
							)}
							{starting ? "Starting..." : "Start Examination"}
						</button>
					)}
				</div>

				{(isCompleted || isSubmitted) && (
					<div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
						<ShieldCheck size={20} className="mt-0.5 shrink-0" />
						<div>
							<p className="font-semibold">
								{isCompleted
									? "Examination completed"
									: "Examination submitted"}
							</p>
							<p className="mt-1 text-sm">
								{isCompleted
									? "This examination has already been completed."
									: "This examination has been submitted and is awaiting the next review step."}
							</p>
						</div>
					</div>
				)}

				<SectionCard
					title="Examination information"
					description="Examination assignment and shipment details."
					icon={ClipboardList}
				>
					<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
						<InfoItem label="Examination reference" value={examination.reference} />
						<InfoItem
							label="Examination type"
							value={getStatusLabel(examination.examination_type)}
						/>
						<InfoItem
							label="Priority"
							value={getStatusLabel(examination.priority)}
						/>
						<InfoItem
							label="Scheduled date"
							value={formatDate(examination.scheduled_date)}
						/>
						<InfoItem label="Scheduled time" value={examination.scheduled_time} />
						<InfoItem label="Assigned officer" value={examination.officer?.name} />
						<InfoItem label="Examination location" value={examination.location?.name} />
						<InfoItem label="Location code" value={examination.location?.code} />
					</div>

					{examination.instructions && (
						<div className="mt-6 rounded-xl border border-orange/20 bg-orange/5 p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-orange">
								Examination instructions
							</p>
							<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
								{examination.instructions}
							</p>
						</div>
					)}
				</SectionCard>

				<SectionCard
					title="Container and shipment"
					description="Container and declaration details."
					icon={Container}
				>
					<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
						<InfoItem label="Container number" value={examination.container?.container_no} />
						<InfoItem label="Container size" value={examination.container?.size} />
						<InfoItem label="Seal number" value={examination.container?.seal_no} />
						<InfoItem
							label="Container weight"
							value={
								examination.container?.gross_weight
									? `${examination.container.gross_weight} kg`
									: "Not available"
							}
						/>
						<InfoItem
							label="Shipment reference"
							value={examination.shipment?.shipment_reference}
						/>
						<InfoItem
							label="Bill of lading"
							value={examination.shipment?.bill_of_lading}
						/>
						<InfoItem label="Vessel" value={examination.shipment?.vessel_name} />
						<InfoItem label="Voyage number" value={examination.shipment?.voyage_number} />
						<InfoItem label="Shipping line" value={examination.shipment?.shipping_line} />
						<InfoItem label="Consignee" value={examination.shipment?.consignee} />
						<InfoItem label="Cargo category" value={examination.shipment?.cargo_category} />
						<InfoItem
							label="Package count"
							value={
								examination.shipment?.package_count
									? `${examination.shipment.package_count} ${examination.shipment.package_type || ""}`
									: "Not available"
							}
						/>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-2">
						<div className="rounded-xl bg-surface p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
								Declared cargo
							</p>
							<p className="mt-2 text-sm leading-6 text-ink">
								{examination.shipment?.cargo_description || "Not available"}
							</p>
						</div>
						<div className="rounded-xl bg-surface p-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
								Container cargo description
							</p>
							<p className="mt-2 text-sm leading-6 text-ink">
								{examination.container?.cargo_description || "Not available"}
							</p>
						</div>
					</div>
				</SectionCard>

				{isScheduled && (
					<div className="rounded-2xl border border-orange/20 bg-orange/5 p-6">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-start gap-3">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
									<ClipboardCheck size={22} />
								</div>
								<div>
									<h2 className="font-semibold text-ink">
										Ready to begin?
									</h2>
									<p className="mt-1 max-w-xl text-sm leading-6 text-ink-soft">
										Review the examination instructions, container details and
										shipment information above. When you are ready, start the
										examination to open the inspection workspace.
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => void startExamination()}
								disabled={starting}
								className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Play size={17} />
								{starting ? "Starting..." : "Start Examination"}
							</button>
						</div>
					</div>
				)}

				{showWorkspace && (
					<>
						{!isReadOnly && (
							<div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-ink">
											Examination progress
										</p>
										<p className="mt-1 text-xs text-ink-soft">
											Complete the checklist, findings and report.
										</p>
									</div>
									<p className="text-lg font-bold tabular-nums text-orange">
										{progress}%
									</p>
								</div>
								<div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${progress}%` }}
										transition={{ duration: 0.35 }}
										className="h-full rounded-full bg-orange"
									/>
								</div>
								<div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
									<span>
										{completedChecklist}/{checklist.length} checklist items
									</span>
									<span>{findings.length} findings recorded</span>
									<span>{report.trim() ? "Report entered" : "Report pending"}</span>
								</div>
							</div>
						)}

						<SectionCard
							title="Examination checklist"
							description="Record the result of each inspection item."
							icon={ClipboardCheck}
						>
							<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
								<p className="text-sm text-ink-soft">
									{completedChecklist} of {checklist.length} items completed
								</p>
								<span
									className={`rounded-full px-3 py-1 text-xs font-semibold ${
										checklistComplete
											? "bg-green-50 text-green-700"
											: "bg-orange/10 text-orange"
									}`}
								>
									{checklistComplete ? "Checklist complete" : "Pending"}
								</span>
							</div>

							<div className="space-y-4">
								{checklist.map((item, index) => (
									<div
										key={item.id}
										className="rounded-xl border border-line p-4 sm:p-5"
									>
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="flex min-w-0 gap-3">
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-sm font-bold text-ink-soft">
													{index + 1}
												</div>
												<div>
													<h3 className="text-sm font-semibold text-ink">
														{item.label}
													</h3>
													<p className="mt-1 text-xs leading-5 text-ink-soft">
														{item.description}
													</p>
												</div>
											</div>
											<StatusPill status={item.result} />
										</div>

										<div className="mt-4 grid gap-4 md:grid-cols-2">
											<div>
												<FieldLabel required>Inspection result</FieldLabel>
												<select
													value={item.result}
													disabled={isReadOnly}
													onChange={(event) =>
														updateChecklist(item.id, "result", event.target.value)
													}
													className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-orange disabled:opacity-60"
												>
													<option value="PENDING">Select result</option>
													<option value="PASS">Pass</option>
													<option value="ISSUE">Issue found</option>
													<option value="NA">Not applicable</option>
												</select>
											</div>
											<div>
												<FieldLabel>Inspection remarks</FieldLabel>
												<input
													value={item.remarks}
													disabled={isReadOnly}
													onChange={(event) =>
														updateChecklist(item.id, "remarks", event.target.value)
													}
													placeholder="Enter observations..."
													className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-orange disabled:opacity-60"
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						<SectionCard
							title="Examination findings"
							description="Record discrepancies, damage, seal issues or other observations."
							icon={Flag}
						>
							{!isReadOnly && (
								<div className="rounded-xl border border-line bg-surface/50 p-4 sm:p-5">
									<h3 className="text-sm font-semibold text-ink">Add a finding</h3>

									<div className="mt-4 grid gap-4 md:grid-cols-2">
										<div>
											<FieldLabel required>Finding title</FieldLabel>
											<input
												value={findingTitle}
												onChange={(event) => setFindingTitle(event.target.value)}
												placeholder="e.g. Seal number mismatch"
												className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-orange"
											/>
										</div>

										<div>
											<FieldLabel required>Severity</FieldLabel>
											<select
												value={findingSeverity}
												onChange={(event) =>
													setFindingSeverity(event.target.value as FindingSeverity)
												}
												className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-orange"
											>
												<option value="LOW">Low</option>
												<option value="MEDIUM">Medium</option>
												<option value="HIGH">High</option>
											</select>
										</div>

										<div className="md:col-span-2">
											<FieldLabel required>Description</FieldLabel>
											<textarea
												rows={3}
												value={findingDescription}
												onChange={(event) =>
													setFindingDescription(event.target.value)
												}
												placeholder="Describe the finding and relevant observations..."
												className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-orange"
											/>
										</div>
									</div>

									<div className="mt-4 flex justify-end">
										<button
											type="button"
											onClick={addFinding}
											className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-deep"
										>
											<Plus size={16} />
											Add Finding
										</button>
									</div>
								</div>
							)}

							<div className="mt-5 space-y-3">
								{findings.length === 0 ? (
									<div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
										<Flag size={24} className="mx-auto text-ink-soft/50" />
										<p className="mt-3 text-sm font-medium text-ink">
											No findings recorded
										</p>
										<p className="mt-1 text-xs text-ink-soft">
											Add a finding above if an issue or observation was identified.
										</p>
									</div>
								) : (
									findings.map((finding, index) => (
										<motion.div
											key={finding.id}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											className="rounded-xl border border-line p-4"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="flex min-w-0 gap-3">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-sm font-bold text-orange">
														{index + 1}
													</div>
													<div className="min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="text-sm font-semibold text-ink">
																{finding.title}
															</h3>
															<span
																className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
																	finding.severity === "HIGH"
																		? "bg-red-50 text-red-700"
																		: finding.severity === "MEDIUM"
																			? "bg-orange/10 text-orange"
																			: "bg-blue-50 text-blue-700"
																}`}
															>
																{finding.severity}
															</span>
														</div>
														<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-soft">
															{finding.description}
														</p>
													</div>
												</div>

												{!isReadOnly && (
													<button
														type="button"
														onClick={() => removeFinding(finding.id)}
														title="Remove finding"
														className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
													>
														<Trash2 size={16} />
													</button>
												)}
											</div>
										</motion.div>
									))
								)}
							</div>
						</SectionCard>

						<SectionCard
							title="Examination report"
							description="Provide the overall assessment and final remarks."
							icon={FileText}
						>
							<div>
								<FieldLabel required>Examination report</FieldLabel>
								<textarea
									rows={6}
									value={report}
									disabled={isReadOnly}
									onChange={(event) => setReport(event.target.value)}
									placeholder="Write the examination report, including the inspection outcome and observations..."
									className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-soft/60 focus:border-orange disabled:opacity-60"
								/>
							</div>

							<div className="mt-5">
								<FieldLabel>Additional remarks</FieldLabel>
								<textarea
									rows={4}
									value={remarks}
									disabled={isReadOnly}
									onChange={(event) => setRemarks(event.target.value)}
									placeholder="Add additional remarks or recommendations..."
									className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-soft/60 focus:border-orange disabled:opacity-60"
								/>
							</div>

							{hasChecklistIssues && (
								<div className="mt-5 flex items-start gap-3 rounded-xl border border-orange/20 bg-orange/5 p-4">
									<Flag size={18} className="mt-0.5 shrink-0 text-orange" />
									<div>
										<p className="text-sm font-semibold text-ink">
											Checklist issues identified
										</p>
										<p className="mt-1 text-xs leading-5 text-ink-soft">
											One or more checklist items have been marked as an issue.
											Ensure the findings and report explain these observations.
										</p>
									</div>
								</div>
							)}
						</SectionCard>

						{logs.length > 0 && (
							<SectionCard
								title="Examination activity"
								description="Recorded activity associated with this examination."
								icon={Clock}
							>
								<div className="space-y-4">
									{logs.map((log) => (
										<div key={log.id} className="flex gap-3">
											<div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
												<Clock size={15} />
											</div>
											<div className="min-w-0 flex-1 border-b border-line pb-4 last:border-0 last:pb-0">
												<p className="text-sm font-semibold text-ink">
													{getStatusLabel(log.action)}
												</p>
												<p className="mt-1 text-sm text-ink-soft">
													{log.description}
												</p>
												<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
													<span>{formatDateTime(log.performed_at)}</span>
													{log.performed_by_name && (
														<span>By {log.performed_by_name}</span>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</SectionCard>
						)}

						{!isReadOnly && (
							<div className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
								<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h2 className="text-lg font-bold text-ink">
											Ready to submit?
										</h2>
										<p className="mt-1 max-w-2xl text-sm leading-6 text-ink-soft">
											Review the checklist, findings and examination report before submitting.
											Once submitted, the examination will move to the next review
											step.
										</p>
										<div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-soft">
											<span>
												{completedChecklist}/{checklist.length} checklist items
											</span>
											<span>{findings.length} findings</span>
											<span>
												{report.trim() ? "Report entered" : "Report missing"}
											</span>
										</div>
									</div>

									<button
										type="button"
										onClick={() => void submitExamination()}
										disabled={!canSubmit}
										className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
									>
										{submitting ? "Submitting..." : "Submit Examination"}
										<ShieldCheck size={18} />
									</button>
								</div>

								{!canSubmit && (
									<p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
										Complete every checklist item, enter the examination report,
										and add a finding or additional remarks to enable submission.
									</p>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</AppShell>
	);
}

