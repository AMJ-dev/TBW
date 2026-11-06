
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "@/components/router-link";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	CalendarDays,
	Check,
	CheckCircle2,
	ChevronRight,
	ClipboardCheck,
	Clock3,
	Container,
	Download,
	FileCheck2,
	FileText,
	History,
	MapPin,
	MessageSquare,
	Paperclip,
	Play,
	Plus,
	Save,
	Search,
	Ship,
	ShieldCheck,
	UserRound,
	X,
} from "lucide-react";

type ExaminationStatus =
	| "SCHEDULED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "CHANGES_REQUESTED";

type ChecklistItem = {
	id: string;
	label: string;
	description: string;
	result: "PENDING" | "PASS" | "ISSUE" | "NA";
	remarks: string;
};

type Finding = {
	id: string;
	title: string;
	description: string;
	severity: "LOW" | "MEDIUM" | "HIGH";
};

const initialChecklist: ChecklistItem[] = [
	{
		id: "CHK-001",
		label: "Container identification",
		description: "Verify container number against the shipment declaration.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "CHK-002",
		label: "Seal verification",
		description: "Verify the physical seal against the declared seal number.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "CHK-003",
		label: "Container condition",
		description: "Record the external condition of the container.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "CHK-004",
		label: "Cargo verification",
		description: "Verify cargo against the declared description and quantity.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "CHK-005",
		label: "Supporting documents",
		description: "Check the required shipment and supporting documents.",
		result: "PENDING",
		remarks: "",
	},
	{
		id: "CHK-006",
		label: "Discrepancy assessment",
		description: "Record any discrepancies identified during examination.",
		result: "PENDING",
		remarks: "",
	},
];

const sampleExamination = {
	id: "EXM-2026-00031",
	reference: "TRN-EXM-2026-00031",
	type: "PHYSICAL",
	priority: "NORMAL",
	status: "SCHEDULED" as ExaminationStatus,
	scheduled_date: "2026-11-08",
	scheduled_time: "10:30",
	created_at: "2026-11-06 14:20",
	location: "Examination Bay 01",
	location_code: "EXM-01",
	officer: "Mathias Jacobs",
	officer_role: "Examination Officer",
	reviewer: "Daniel Okafor",
	instructions: "Verify the declared cargo and confirm the container seal.",
	shipment: {
		id: "db3a07cb-99c5-409f-887f-5c4ce4ecf044",
		reference: "TRN-SHP-2026-5D1F6F38F193",
		bill_of_lading: "KSBK-87384",
		vessel: "MV Atlantic Star",
		voyage: "AS-3874",
		shipping_line: "Oceanic Shipping",
		consignee: "Global Trade Nigeria Ltd",
		agent: "Trinu Licensed Agency",
		cargo_description: "Television and electronic appliances",
	},
	container: {
		id: "df43ccc4-b328-4603-8825-558f868d2144",
		number: "JHN-93849",
		size: "40ft",
		seal: "JHJB-43984",
		weight: "234.000 kg",
		location: "Main Bonded Warehouse",
		status: "IN_WAREHOUSE",
	},
};

const checklistStyles = {
	PENDING: "bg-sand text-ink-soft",
	PASS: "bg-emerald-50 text-emerald-700",
	ISSUE: "bg-red-50 text-red-700",
	NA: "bg-slate-100 text-slate-600",
};

function Section({
	title,
	description,
	icon: Icon,
	children,
	action,
}: {
	title: string;
	description?: string;
	icon: React.ElementType;
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-xl border border-line bg-paper">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
				<div className="flex items-center gap-3">
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
				{action}
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
	value?: string;
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

export default function ExaminationDetailsPage() {
	const { id } = useParams();

	const [examination, setExamination] = useState(sampleExamination);
	const [activeTab, setActiveTab] = useState("overview");
	const [checklist, setChecklist] = useState(initialChecklist);
	const [findings, setFindings] = useState<Finding[]>([]);
	const [report, setReport] = useState("");
	const [reviewRemarks, setReviewRemarks] = useState("");
	const [newFinding, setNewFinding] = useState({
		title: "",
		description: "",
		severity: "MEDIUM" as Finding["severity"],
	});
	const [showFindingForm, setShowFindingForm] = useState(false);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [reviewAction, setReviewAction] = useState<
		"APPROVED" | "CHANGES_REQUESTED" | null
	>(null);
	const [notice, setNotice] = useState("");

	const completedItems = checklist.filter(
		(item) => item.result !== "PENDING",
	).length;

	const progress = Math.round(
		(completedItems / checklist.length) * 100,
	);

	const canStart = examination.status === "SCHEDULED";
	const canEdit =
		examination.status === "IN_PROGRESS" ||
		examination.status === "CHANGES_REQUESTED";
	const canSubmit =
		canEdit &&
		completedItems === checklist.length &&
		report.trim().length > 0;
	const canReview = examination.status === "PENDING_REVIEW";

	const tabs = [
		{ id: "overview", label: "Overview", icon: Activity },
		{ id: "checklist", label: "Checklist", icon: ClipboardCheck },
		{ id: "findings", label: "Findings", icon: Search },
		{ id: "report", label: "Examination report", icon: FileText },
	];

	const timeline = useMemo(() => {
		const events = [
			{
				title: "Examination scheduled",
				description: "Examination assignment created.",
				date: examination.created_at,
				done: true,
			},
			{
				title: "Examination started",
				description: "Officer commenced the examination.",
				date: examination.status === "SCHEDULED" ? "Awaiting" : "Recorded locally",
				done: examination.status !== "SCHEDULED",
			},
			{
				title: "Examination completed",
				description: "Examination findings submitted.",
				date: ["COMPLETED", "PENDING_REVIEW", "APPROVED", "CHANGES_REQUESTED"].includes(
					examination.status,
				)
					? "Recorded locally"
					: "Awaiting",
				done: ["COMPLETED", "PENDING_REVIEW", "APPROVED", "CHANGES_REQUESTED"].includes(
					examination.status,
				),
			},
			{
				title: "Review decision",
				description: "Authorised reviewer decision.",
				date:
					examination.status === "APPROVED"
						? "Approved locally"
						: examination.status === "CHANGES_REQUESTED"
							? "Changes requested locally"
							: "Awaiting",
				done: examination.status === "APPROVED",
			},
		];

		return events;
	}, [examination]);

	function updateChecklist(
		itemId: string,
		field: "result" | "remarks",
		value: string,
	) {
		setChecklist((current) =>
			current.map((item) =>
				item.id === itemId ? { ...item, [field]: value } : item,
			),
		);
	}

	function startExamination() {
		setExamination((current) => ({
			...current,
			status: "IN_PROGRESS",
		}));
		setNotice("Examination started.");
		setActiveTab("checklist");
	}

	function addFinding() {
		if (!newFinding.title.trim() || !newFinding.description.trim()) return;

		setFindings((current) => [
			...current,
			{
				id: `FND-${Date.now()}`,
				...newFinding,
			},
		]);

		setNewFinding({
			title: "",
			description: "",
			severity: "MEDIUM",
		});
		setShowFindingForm(false);
		setNotice("Finding added.");
	}

	function submitReport() {
		if (!canSubmit) return;

		setExamination((current) => ({
			...current,
			status: "PENDING_REVIEW",
		}));
		setNotice("Examination report submitted for review.");
		setActiveTab("overview");
	}

	function submitReview() {
		if (!reviewAction || !reviewRemarks.trim()) return;

		setExamination((current) => ({
			...current,
			status: reviewAction,
		}));
		setShowReviewForm(false);
		setNotice(
			reviewAction === "APPROVED"
				? "Examination approved."
				: "Examination returned for correction.",
		);
		setReviewRemarks("");
		setReviewAction(null);
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
							<StatusBadge label={examination.status.replaceAll("_", " ")} tone={statusTone(examination.status)} />
						</div>
						<p className="mt-1 text-sm text-ink-soft">
							Examination record and operational workspace.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						{canStart && (
							<button
								type="button"
								onClick={startExamination}
								className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep"
							>
								<Play size={15} />
								Start examination
							</button>
						)}

						{canEdit && (
							<button
								type="button"
								onClick={() => setActiveTab("report")}
								className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep"
							>
								<FileCheck2 size={15} />
								Complete examination
							</button>
						)}

						{canReview && (
							<button
								type="button"
								onClick={() => setShowReviewForm(true)}
								className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep"
							>
								<ShieldCheck size={15} />
								Review report
							</button>
						)}
					</div>
				</div>
			</div>

			<AnimatePresence>
				{notice && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
					>
						<div className="flex items-center gap-2">
							<CheckCircle2 size={16} />
							{notice}
						</div>
						<button type="button" onClick={() => setNotice("")}>
							<X size={15} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Examination type"
					value={examination.type.replaceAll("_", " ")}
					icon={Search}
				/>
				<Metric
					label="Scheduled date"
					value={`${examination.scheduled_date} ${examination.scheduled_time}`}
					icon={CalendarDays}
				/>
				<Metric
					label="Assigned officer"
					value={examination.officer}
					icon={UserRound}
				/>
				<Metric
					label="Checklist progress"
					value={`${completedItems} / ${checklist.length}`}
					icon={ClipboardCheck}
				/>
			</div>

			<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
				<div className="min-w-0 space-y-5">
					<div className="flex gap-1 overflow-x-auto border-b border-line">
						{tabs.map((tab) => {
							const Icon = tab.icon;

							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									className={`cursor-pointer flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
										activeTab === tab.id
											? "border-orange text-orange"
											: "border-transparent text-ink-soft hover:text-ink"
									}`}
								>
									<Icon size={15} />
									{tab.label}
								</button>
							);
						})}
					</div>

					<AnimatePresence mode="wait">
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, x: 12 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -12 }}
							transition={{ duration: 0.18 }}
							className="space-y-5"
						>
							{activeTab === "overview" && (
								<>
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
												label="Consignee"
												value={examination.shipment.consignee}
											/>
											<Detail
												label="Licensed agent"
												value={examination.shipment.agent}
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
												label="Gross weight"
												value={examination.container.weight}
											/>
											<Detail
												label="Current location"
												value={examination.container.location}
											/>
											<Detail
												label="Container status"
												value={examination.container.status.replaceAll("_", " ")}
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
												label="Examination location"
												value={`${examination.location} (${examination.location_code})`}
											/>
											<Detail
												label="Examination officer"
												value={examination.officer}
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
												value={examination.priority}
											/>
										</div>
										<div className="mt-5 rounded-lg bg-sand/70 p-4">
											<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
												Instructions
											</p>
											<p className="mt-2 text-sm leading-6 text-ink">
												{examination.instructions || "No special instructions."}
											</p>
										</div>
									</Section>
								</>
							)}

							{activeTab === "checklist" && (
								<Section
									title="Examination checklist"
									description="Record the outcome of each examination check."
									icon={ClipboardCheck}
									action={
										<span className="text-xs font-semibold text-ink-soft">
											{completedItems}/{checklist.length} completed
										</span>
									}
								>
									{!canEdit && examination.status !== "PENDING_REVIEW" && examination.status !== "COMPLETED" && (
										<div className="mb-4 rounded-lg border border-orange/20 bg-orange/[0.04] p-3 text-xs text-ink-soft">
											Start the examination before recording checklist results.
										</div>
									)}

									<div className="space-y-3">
										{checklist.map((item, index) => (
											<div
												key={item.id}
												className="rounded-xl border border-line p-4"
											>
												<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
													<div className="flex gap-3">
														<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-xs font-semibold text-ink-soft">
															{String(index + 1).padStart(2, "0")}
														</div>
														<div>
															<p className="text-sm font-semibold text-ink">
																{item.label}
															</p>
															<p className="mt-1 text-xs leading-5 text-ink-soft">
																{item.description}
															</p>
														</div>
													</div>

													<select
														value={item.result}
														disabled={!canEdit}
														onChange={(event) =>
															updateChecklist(
																item.id,
																"result",
																event.target.value,
															)
														}
														className="w-full rounded-lg border border-line bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-orange sm:w-40"
													>
														<option value="PENDING">Pending</option>
														<option value="PASS">Passed</option>
														<option value="ISSUE">Issue found</option>
														<option value="NA">Not applicable</option>
													</select>
												</div>

												{item.result !== "PENDING" && (
													<input
														value={item.remarks}
														disabled={!canEdit}
														onChange={(event) =>
															updateChecklist(
																item.id,
																"remarks",
																event.target.value,
															)
														}
														placeholder="Add remarks for this check..."
														className="mt-3 w-full rounded-lg border border-line bg-background px-3 py-2 text-xs text-ink outline-none focus:border-orange disabled:opacity-60"
													/>
												)}
											</div>
										))}
									</div>
								</Section>
							)}

							{activeTab === "findings" && (
								<Section
									title="Examination findings"
									description="Record discrepancies or observations."
									icon={Search}
									action={
										canEdit ? (
											<button
												type="button"
												onClick={() => setShowFindingForm(true)}
												className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-[11px] font-semibold text-white hover:bg-orange-deep"
											>
												<Plus size={14} />
												Add finding
											</button>
										) : null
									}
								>
									{findings.length === 0 ? (
										<div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
											<Search
												size={27}
												className="mx-auto text-ink-soft"
											/>
											<p className="mt-3 text-sm font-semibold text-ink">
												No findings recorded
											</p>
											<p className="mt-1 text-xs text-ink-soft">
												Examination observations will appear here.
											</p>
											{canEdit && (
												<button
													type="button"
													onClick={() => setShowFindingForm(true)}
													className="cursor-pointer mt-4 text-xs font-semibold text-orange hover:text-orange-deep"
												>
													Add first finding
												</button>
											)}
										</div>
									) : (
										<div className="space-y-3">
											{findings.map((finding) => (
												<div
													key={finding.id}
													className="rounded-xl border border-line p-4"
												>
													<div className="flex flex-wrap items-center justify-between gap-2">
														<p className="text-sm font-semibold text-ink">
															{finding.title}
														</p>
														<span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
															finding.severity === "HIGH"
																? "bg-red-50 text-red-700"
																: finding.severity === "MEDIUM"
																	? "bg-amber-50 text-amber-700"
																	: "bg-sky-50 text-sky-700"
														}`}>
															{finding.severity} SEVERITY
														</span>
													</div>
													<p className="mt-2 text-xs leading-5 text-ink-soft">
														{finding.description}
													</p>
												</div>
											))}
										</div>
									)}
								</Section>
							)}

							{activeTab === "report" && (
								<>
									<Section
										title="Examination report"
										description="Officer's summary and conclusion."
										icon={FileText}
									>
										<div className="space-y-4">
											<div className="grid gap-4 sm:grid-cols-3">
												<div className="rounded-lg bg-sand/70 p-3">
													<p className="text-[10px] text-ink-soft">Checklist completed</p>
													<p className="mt-1 text-lg font-semibold text-ink">
														{completedItems}/{checklist.length}
													</p>
												</div>
												<div className="rounded-lg bg-sand/70 p-3">
													<p className="text-[10px] text-ink-soft">Findings recorded</p>
													<p className="mt-1 text-lg font-semibold text-ink">
														{findings.length}
													</p>
												</div>
												<div className="rounded-lg bg-sand/70 p-3">
													<p className="text-[10px] text-ink-soft">Issues identified</p>
													<p className="mt-1 text-lg font-semibold text-ink">
														{checklist.filter((item) => item.result === "ISSUE").length}
													</p>
												</div>
											</div>

											<div>
												<label className="mb-2 block text-xs font-semibold text-ink">
													Examination summary
													<span className="ml-1 text-orange">*</span>
												</label>
												<textarea
													rows={7}
													value={report}
													disabled={!canEdit}
													onChange={(event) => setReport(event.target.value)}
													placeholder="Describe the examination performed, observations, discrepancies and final recommendation..."
													className="w-full cursor-text resize-y rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink outline-none focus:border-orange disabled:opacity-60"
												/>
											</div>

											<div className="rounded-lg border border-line p-4">
												<div className="flex items-center gap-2">
													<Paperclip size={15} className="text-orange" />
													<p className="text-xs font-semibold text-ink">
														Supporting documents
													</p>
												</div>
												<p className="mt-2 text-xs text-ink-soft">
													Document uploads will be connected when the API is implemented.
												</p>
												<div className="mt-3 flex items-center gap-2 text-[11px] text-ink-soft">
													<FileText size={14} />
													No attachments added
												</div>
											</div>

											{canEdit && (
												<div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
													<button
														type="button"
														onClick={() => setNotice("Report draft retained in this UI session.")}
														className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand"
													>
														<Save size={14} />
														Save draft
													</button>
													<button
														type="button"
														disabled={!canSubmit}
														onClick={submitReport}
														className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-40"
													>
														<CheckCircle2 size={14} />
														Submit for review
													</button>
												</div>
											)}

											{canEdit && !canSubmit && (
												<p className="text-right text-[11px] text-ink-soft">
													Complete all checklist items and enter a report summary to submit.
												</p>
											)}
										</div>
									</Section>
								</>
							)}
						</motion.div>
					</AnimatePresence>
				</div>

				<aside className="space-y-5">
					<div className="rounded-xl border border-line bg-paper p-5">
						<h3 className="text-sm font-semibold text-ink">
							Examination workflow
						</h3>
						<p className="mt-1 text-xs text-ink-soft">
							Progress through the examination process.
						</p>

						<div className="mt-5 space-y-5">
							{timeline.map((event, index) => (
								<div key={event.title} className="relative flex gap-3">
									{index !== timeline.length - 1 && (
										<div className={`absolute left-[11px] top-7 h-8 w-px ${
											event.done ? "bg-emerald-300" : "bg-line"
										}`} />
									)}
									<div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
										event.done
											? "bg-emerald-100 text-emerald-700"
											: "border border-line bg-paper text-ink-soft"
									}`}>
										{event.done ? <Check size={13} /> : <span className="text-[9px]">{index + 1}</span>}
									</div>
									<div className="min-w-0 pb-1">
										<p className="text-xs font-semibold text-ink">
											{event.title}
										</p>
										<p className="mt-1 text-[10px] leading-4 text-ink-soft">
											{event.description}
										</p>
										<p className="mt-1 text-[10px] text-ink-soft">
											{event.date}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-xl border border-line bg-paper p-5">
						<h3 className="text-sm font-semibold text-ink">
							Assigned personnel
						</h3>
						<div className="mt-4 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/10 text-orange">
								<UserRound size={18} />
							</div>
							<div>
								<p className="text-xs font-semibold text-ink">
									{examination.officer}
								</p>
								<p className="mt-1 text-[10px] text-ink-soft">
									{examination.officer_role}
								</p>
							</div>
						</div>
						<div className="mt-4 border-t border-line pt-4">
							<p className="text-[10px] uppercase tracking-wider text-ink-soft">
								Review responsibility
							</p>
							<p className="mt-1 text-xs font-semibold text-ink">
								{examination.reviewer}
							</p>
							<p className="mt-1 text-[10px] text-ink-soft">
								Authorised reviewer
							</p>
						</div>
					</div>

					<div className="rounded-xl border border-orange/20 bg-orange/[0.035] p-4">
						<div className="flex items-center gap-2">
							<ShieldCheck size={17} className="text-orange" />
							<p className="text-xs font-semibold text-ink">
								Review guidance
							</p>
						</div>
						<p className="mt-2 text-xs leading-5 text-ink-soft">
							An examination report should be reviewed before the examination
							is treated as approved. The reviewer should check the findings,
							checklist and supporting evidence.
						</p>
					</div>

					<div className="rounded-xl border border-line bg-paper p-4">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
							Record identifier
						</p>
						<p className="mt-2 break-all font-mono text-[10px] text-ink">
							{id || examination.id}
						</p>
					</div>
				</aside>
			</div>

			<AnimatePresence>
				{showFindingForm && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex justify-end bg-ink/30"
						onClick={() => setShowFindingForm(false)}
					>
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "tween", duration: 0.25 }}
							onClick={(event) => event.stopPropagation()}
							className="flex h-full w-full max-w-lg flex-col border-l border-line bg-paper shadow-2xl"
						>
							<div className="flex items-center justify-between border-b border-line px-5 py-4">
								<div>
									<h2 className="text-sm font-semibold text-ink">
										Add examination finding
									</h2>
									<p className="mt-1 text-xs text-ink-soft">
										Record an observation or discrepancy.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setShowFindingForm(false)}
									className="cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sand"
								>
									<X size={18} />
								</button>
							</div>

							<div className="flex-1 space-y-4 overflow-y-auto p-5">
								<div>
									<label className="mb-2 block text-xs font-semibold text-ink">
										Finding title
									</label>
									<input
										value={newFinding.title}
										onChange={(event) =>
											setNewFinding((current) => ({
												...current,
												title: event.target.value,
											}))
										}
										placeholder="e.g. Seal number discrepancy"
										className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-orange"
									/>
								</div>

								<div>
									<label className="mb-2 block text-xs font-semibold text-ink">
										Description
									</label>
									<textarea
										rows={6}
										value={newFinding.description}
										onChange={(event) =>
											setNewFinding((current) => ({
												...current,
												description: event.target.value,
											}))
										}
										placeholder="Describe the observation and relevant details..."
										className="w-full cursor-text resize-y rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink outline-none focus:border-orange"
									/>
								</div>

								<div>
									<label className="mb-2 block text-xs font-semibold text-ink">
										Severity
									</label>
									<select
										value={newFinding.severity}
										onChange={(event) =>
											setNewFinding((current) => ({
												...current,
												severity: event.target.value as Finding["severity"],
											}))
										}
										className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-orange"
									>
										<option value="LOW">Low</option>
										<option value="MEDIUM">Medium</option>
										<option value="HIGH">High</option>
									</select>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line p-5">
								<button
									type="button"
									onClick={() => setShowFindingForm(false)}
									className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={addFinding}
									disabled={!newFinding.title.trim() || !newFinding.description.trim()}
									className="cursor-pointer rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep disabled:opacity-40"
								>
									Add finding
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showReviewForm && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex justify-end bg-ink/30"
						onClick={() => setShowReviewForm(false)}
					>
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "tween", duration: 0.25 }}
							onClick={(event) => event.stopPropagation()}
							className="flex h-full w-full max-w-lg flex-col border-l border-line bg-paper shadow-2xl"
						>
							<div className="flex items-center justify-between border-b border-line px-5 py-4">
								<div>
									<h2 className="text-sm font-semibold text-ink">
										Review examination report
									</h2>
									<p className="mt-1 text-xs text-ink-soft">
										Record your review decision.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setShowReviewForm(false)}
									className="cursor-pointer rounded-lg p-2 text-ink-soft hover:bg-sand"
								>
									<X size={18} />
								</button>
							</div>

							<div className="flex-1 space-y-5 overflow-y-auto p-5">
								<div className="rounded-lg bg-sand/70 p-4">
									<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Examination report
									</p>
									<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
										{report || "No report summary provided."}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="rounded-lg border border-line p-3">
										<p className="text-[10px] text-ink-soft">Checklist</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											{completedItems}/{checklist.length}
										</p>
									</div>
									<div className="rounded-lg border border-line p-3">
										<p className="text-[10px] text-ink-soft">Findings</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											{findings.length}
										</p>
									</div>
								</div>

								<div>
									<label className="mb-2 block text-xs font-semibold text-ink">
										Review decision
									</label>
									<div className="grid gap-3 sm:grid-cols-2">
										<button
											type="button"
											onClick={() => setReviewAction("APPROVED")}
											className={`cursor-pointer rounded-xl border p-4 text-left ${
												reviewAction === "APPROVED"
													? "border-emerald-500 bg-emerald-50"
													: "border-line hover:border-emerald-300"
											}`}
										>
											<CheckCircle2 size={19} className="text-emerald-600" />
											<p className="mt-2 text-xs font-semibold text-ink">
												Approve
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												Accept the examination report.
											</p>
										</button>
										<button
											type="button"
											onClick={() => setReviewAction("CHANGES_REQUESTED")}
											className={`cursor-pointer rounded-xl border p-4 text-left ${
												reviewAction === "CHANGES_REQUESTED"
													? "border-red-400 bg-red-50"
													: "border-line hover:border-red-300"
											}`}
										>
											<MessageSquare size={19} className="text-red-600" />
											<p className="mt-2 text-xs font-semibold text-ink">
												Return for correction
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												Request additional information or corrections.
											</p>
										</button>
									</div>
								</div>

								<div>
									<label className="mb-2 block text-xs font-semibold text-ink">
										Review remarks
										<span className="ml-1 text-orange">*</span>
									</label>
									<textarea
										rows={5}
										value={reviewRemarks}
										onChange={(event) => setReviewRemarks(event.target.value)}
										placeholder="Enter the reason for your decision..."
										className="w-full cursor-text resize-y rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink outline-none focus:border-orange"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line p-5">
								<button
									type="button"
									onClick={() => setShowReviewForm(false)}
									className="cursor-pointer rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand"
								>
									Cancel
								</button>
								<button
									type="button"
									disabled={!reviewAction || !reviewRemarks.trim()}
									onClick={submitReview}
									className="cursor-pointer rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-deep disabled:opacity-40"
								>
									Submit decision
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
		</AppShell>
	);
}

