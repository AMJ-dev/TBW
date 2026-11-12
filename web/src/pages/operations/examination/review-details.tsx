import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import { useParams } from "react-router-dom";
import { http, type Resp } from "@/lib/httpClient";
import { toast } from "sonner";
import {
	AppShell,
	Metric,
	StatusBadge,
	statusTone,
} from "@/components/auth-shell";
import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	ClipboardCheck,
	Clock3,
	FileText,
	MapPin,
	Package,
	ShieldCheck,
	User,
	XCircle,
	CheckCircle2,
	AlertCircle,
} from "lucide-react";

type ChecklistItem = {
	id: string;
	label: string;
	description: string;
	result: string;
	remarks: string;
};

type Examination = {
	id: string;
	reference: string;
	shipment_reference: string;
	bill_of_lading: string;
	container_no: string;
	container_size: string;
	seal_no: string;
	organisation: string;
	consignee: string;
	vessel: string;
	voyage: string;
	examination_type: string;
	examination_status: string;
	priority: string;
	location: string;
	assigned_officer: string;
	scheduled_date: string;
	scheduled_time: string;
	completed_date: string;
	created_at: string;
	findings: string[];
	checklist: ChecklistItem[];
	remarks: string;
};

type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

function Detail({
	label,
	value,
	icon,
}: {
	label: string;
	value?: string | null;
	icon?: React.ReactNode;
}) {
	return (
		<div className="min-w-0">
			<p className="mb-1 text-xs text-ink-soft">{label}</p>
			<div className="flex items-center gap-2 text-sm font-semibold text-ink">
				{icon}
				<span className="break-words">{value || "Not recorded"}</span>
			</div>
		</div>
	);
}

function formatDate(value?: string | null) {
	if (!value) return "Not recorded";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function formatDateTime(value?: string | null) {
	if (!value) return "Not recorded";

	const date = new Date(value.replace(" ", "T"));

	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getResultTone(result: string) {
	switch (result.toUpperCase()) {
		case "PASS":
		case "PASSED":
			return "success";
		case "FAIL":
		case "FAILED":
			return "critical";
		case "PENDING":
			return "warning";
		default:
			return "neutral";
	}
}

export default function ExaminationReviewDetailsPage() {
	const { id } = useParams<{ id: string }>();

	const [examination, setExamination] = useState<Examination | null>(null);
	const [decision, setDecision] = useState<ReviewDecision | "">("");
	const [remarks, setRemarks] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const fetchExamination = useCallback(async () => {
		if (!id) {
			toast.error("Invalid examination ID.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			const response = await http.get(
				`/operator/examination/review/${id}/`,
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					String(resp.data || "Could not load examination."),
				);
			}

			const data = resp.code?.examination as Examination | undefined;

			if (!data) {
				throw new Error("Examination record was not returned.");
			}

			setExamination({
				...data,
				findings: Array.isArray(data.findings) ? data.findings : [],
				checklist: Array.isArray(data.checklist)
					? data.checklist
					: [],
				remarks: data.remarks || "",
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not load examination.",
			);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		void fetchExamination();
	}, [fetchExamination]);

	const checklistSummary = useMemo(() => {
		const checklist = examination?.checklist || [];

		return {
			total: checklist.length,
			passed: checklist.filter(
				(item) => ["PASS", "PASSED"].includes(item.result.toUpperCase()),
			).length,
			failed: checklist.filter(
				(item) => ["FAIL", "FAILED"].includes(item.result.toUpperCase()),
			).length,
			pending: checklist.filter(
				(item) => !item.result || item.result.toUpperCase() === "PENDING",
			).length,
		};
	}, [examination]);

	const handleDecision = (value: ReviewDecision) => {
		setDecision(value);
	};

	const handleSubmit = async () => {
		if (!id || !decision || !remarks.trim() || submitting) { 
			if (!decision) {
				toast.error("Select a review decision.");
			} else if (!remarks.trim()) {
				toast.error("Enter your review remarks.");
			}

			return;
		}
		if (examination?.examination_status?.toUpperCase() !== "PENDING_REVIEW") {
			toast.error("This examination is no longer awaiting review.");
			return;
		}
		try {
			setSubmitting(true);

			const payload = {
				examination_id: id,
				decision,
				remarks: remarks.trim(),
			};

			const response = await http.post(
				"/operator/examination/review/save/",
				payload,
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					String(resp.data || "Could not submit review."),
				);
			}

			toast.success(
				String(resp.data || "Review submitted successfully."),
			);

			setExamination((current) =>
				current
					? {
							...current,
							examination_status: decision,
						}
					: current,
			);

			setDecision("");
			setRemarks("");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not submit review.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<AppShell title="Examination Review" eyebrow="Operations">
				<div className="rounded-xl border border-line bg-paper p-10 text-center">
					<div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-orange/20 border-t-orange" />
					<p className="mt-4 text-sm text-ink-soft">
						Loading examination...
					</p>
				</div>
			</AppShell>
		);
	}

	if (!examination) {
		return (
			<AppShell title="Examination Review" eyebrow="Operations">
				<div className="rounded-xl border border-line bg-paper p-10 text-center">
					<FileText
						size={36}
						className="mx-auto mb-4 text-ink-soft"
					/>
					<h2 className="text-lg font-semibold text-ink">
						Examination not found
					</h2>
					<p className="mt-2 text-sm text-ink-soft">
						The examination record could not be found.
					</p>

					<Link
						to="/operations/examinations/review"
						className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white"
					>
						<ArrowLeft size={16} />
						Back to review queue
					</Link>
				</div>
			</AppShell>
		);
	}

	const examinationStatus = examination.examination_status?.toUpperCase();

	const canReview = examinationStatus === "PENDING_REVIEW";

	const reviewState = {
		APPROVED: {
			title: "Examination approved",
			description:
				"The examination report has been approved. No further review action is required.",
			icon: CheckCircle2,
			color: "text-green-600",
			background: "bg-green-50",
		},
		CHANGES_REQUESTED: {
			title: "Corrections requested",
			description:
				"The examination has been returned to the assigned officer for corrections and resubmission.",
			icon: AlertCircle,
			color: "text-orange",
			background: "bg-orange/5",
		},
		REJECTED: {
			title: "Examination rejected",
			description:
				"The examination report has been rejected. No further review action is available.",
			icon: XCircle,
			color: "text-red-600",
			background: "bg-red-50",
		},
	};

	const currentReviewState = reviewState[examinationStatus as keyof typeof reviewState];

	return (
		<AppShell title="Examination Review" eyebrow="Operations">
			<div className="space-y-6 pb-10">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<Link
							to="/operations/examinations/review"
							className="mb-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-soft transition hover:text-orange"
						>
							<ArrowLeft size={15} />
							Back to review queue
						</Link>

						<h1 className="text-2xl font-bold text-ink">
							{examination.reference}
						</h1>

						<p className="mt-1 text-sm text-ink-soft">
							Review examination findings and submit an approval decision.
						</p>
					</div>

					<StatusBadge
						label={examination.examination_status.replaceAll("_", " ")}
						tone={statusTone(examination.examination_status)}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Examination reference"
						value={examination.reference || "Not recorded"}
						icon={ClipboardCheck}
					/>

					<Metric
						label="Examination type"
						value={examination.examination_type || "Not recorded"}
						icon={ShieldCheck}
					/>

					<Metric
						label="Priority"
						value={examination.priority || "Not recorded"}
						icon={Clock3}
					/>

					<Metric
						label="Container"
						value={examination.container_no || "Not recorded"}
						icon={Package}
					/>
				</div>

				<div className="grid gap-6 xl:grid-cols-3">
					<div className="space-y-6 xl:col-span-2">
						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Shipment information
								</h2>
							</div>

							<div className="grid gap-5 p-5 sm:grid-cols-2">
								<Detail
									label="Shipment reference"
									value={examination.shipment_reference}
								/>
								<Detail
									label="Bill of lading"
									value={examination.bill_of_lading}
								/>
								<Detail
									label="Organisation"
									value={examination.organisation}
								/>
								<Detail
									label="Consignee"
									value={examination.consignee}
								/>
								<Detail
									label="Vessel"
									value={examination.vessel}
								/>
								<Detail
									label="Voyage"
									value={examination.voyage}
								/>
							</div>
						</section>

						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Container information
								</h2>
							</div>

							<div className="grid gap-5 p-5 sm:grid-cols-2">
								<Detail
									label="Container number"
									value={examination.container_no}
								/>
								<Detail
									label="Container size"
									value={examination.container_size}
								/>
								<Detail
									label="Seal number"
									value={examination.seal_no}
								/>
								<Detail
									label="Current location"
									value={examination.location}
									icon={<MapPin size={15} />}
								/>
							</div>
						</section>

						<section className="rounded-xl border border-line bg-paper">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
								<div>
									<h2 className="font-semibold text-ink">
										Examination checklist
									</h2>
									<p className="mt-1 text-xs text-ink-soft">
										Inspection checks completed by the examination officer.
									</p>
								</div>

								<StatusBadge
									label={`${checklistSummary.passed}/${checklistSummary.total} passed`}
									tone={
										checklistSummary.failed > 0
											? "critical"
											: checklistSummary.pending > 0
												? "warning"
												: "success"
									}
								/>
							</div>

							<div className="grid grid-cols-3 gap-3 border-b border-line p-5">
								<div className="rounded-lg bg-green-50 p-3">
									<p className="text-xs text-green-700">Passed</p>
									<p className="mt-1 text-xl font-bold text-green-700">
										{checklistSummary.passed}
									</p>
								</div>

								<div className="rounded-lg bg-red-50 p-3">
									<p className="text-xs text-red-700">Failed</p>
									<p className="mt-1 text-xl font-bold text-red-700">
										{checklistSummary.failed}
									</p>
								</div>

								<div className="rounded-lg bg-amber-50 p-3">
									<p className="text-xs text-amber-700">Pending</p>
									<p className="mt-1 text-xl font-bold text-amber-700">
										{checklistSummary.pending}
									</p>
								</div>
							</div>

							<div className="divide-y divide-line">
								{examination.checklist.length > 0 ? (
									examination.checklist.map((item, index) => (
										<div
											key={item.id || index}
											className="space-y-3 p-5"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div className="flex min-w-0 gap-3">
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
														<ClipboardCheck size={18} />
													</div>

													<div className="min-w-0">
														<h3 className="text-sm font-semibold text-ink">
															{item.label || "Checklist item"}
														</h3>
														<p className="mt-1 text-sm leading-6 text-ink-soft">
															{item.description || "No description provided."}
														</p>
													</div>
												</div>

												<StatusBadge
													label={(item.result || "PENDING").replaceAll("_", " ")}
													tone={getResultTone(item.result || "PENDING")}
												/>
											</div>

											{item.remarks?.trim() && (
												<div className="ml-12 rounded-lg bg-sand p-3">
													<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
														Officer remarks
													</p>
													<p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
														{item.remarks}
													</p>
												</div>
											)}
										</div>
									))
								) : (
									<div className="p-8 text-center">
										<ClipboardCheck
											size={28}
											className="mx-auto text-ink-soft"
										/>
										<p className="mt-3 text-sm font-medium text-ink">
											No checklist available
										</p>
										<p className="mt-1 text-xs text-ink-soft">
											No checklist items were returned for this examination.
										</p>
									</div>
								)}
							</div>
						</section>

						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Examination findings
								</h2>
								<p className="mt-1 text-xs text-ink-soft">
									Findings submitted by the examination officer.
								</p>
							</div>

							<div className="space-y-3 p-5">
								{examination.findings.length > 0 ? (
									examination.findings.map((finding, index) => (
										<div
											key={index}
											className="flex gap-3 rounded-lg bg-sand p-4"
										>
											<BadgeCheck
												size={18}
												className="mt-0.5 shrink-0 text-orange"
											/>
											<p className="text-sm leading-6 text-ink">
												{finding}
											</p>
										</div>
									))
								) : (
									<p className="text-sm text-ink-soft">
										No examination findings recorded.
									</p>
								)}
							</div>
						</section>

						{examination.remarks?.trim() && (
							<section className="rounded-xl border border-line bg-paper">
								<div className="border-b border-line px-5 py-4">
									<h2 className="font-semibold text-ink">
										Officer's general remarks
									</h2>
								</div>

								<div className="p-5">
									<p className="whitespace-pre-wrap text-sm leading-7 text-ink">
										{examination.remarks}
									</p>
								</div>
							</section>
						)}
					</div>

					<div className="space-y-6">
						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Examination assignment
								</h2>
							</div>

							<div className="space-y-5 p-5">
								<Detail
									label="Assigned officer"
									value={examination.assigned_officer}
									icon={<User size={16} />}
								/>

								<Detail
									label="Examination location"
									value={examination.location}
									icon={<MapPin size={16} />}
								/>

								<Detail
									label="Scheduled date"
									value={formatDate(examination.scheduled_date)}
								/>

								<Detail
									label="Completed date"
									value={formatDateTime(examination.completed_date)}
								/>

								<Detail
									label="Submitted date"
									value={formatDateTime(examination.created_at)}
								/>
							</div>
						</section>

						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Review decision
								</h2>
								<p className="mt-1 text-xs text-ink-soft">
									{canReview
										? "Review the submitted examination report and record your decision."
										: "Current examination review status."}
								</p>
							</div>

							<div className="space-y-4 p-5">
								{canReview ? (
									<>
										<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
											<div className="flex items-center gap-2">
												<Clock3 size={18} className="text-blue-600" />
												<p className="text-sm font-semibold text-blue-800">
													Awaiting your review
												</p>
											</div>
											<p className="mt-2 text-xs leading-5 text-blue-700">
												The examination officer has submitted this report.
												Review the checklist and findings before making a decision.
											</p>
										</div>

										<button
											type="button"
											disabled={submitting}
											onClick={() => handleDecision("APPROVED")}
											className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
												decision === "APPROVED"
													? "border-green-600 bg-green-50"
													: "border-line hover:border-green-600"
											} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											<BadgeCheck size={19} className="text-green-600" />
											<div>
												<p className="text-sm font-semibold text-ink">
													Approve examination
												</p>
												<p className="mt-1 text-xs text-ink-soft">
													Accept the submitted examination report.
												</p>
											</div>
										</button>

										<button
											type="button"
											disabled={submitting}
											onClick={() => handleDecision("CHANGES_REQUESTED")}
											className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
												decision === "CHANGES_REQUESTED"
													? "border-orange bg-orange/5"
													: "border-line hover:border-orange"
											} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											<ClipboardCheck size={19} className="text-orange" />
											<div>
												<p className="text-sm font-semibold text-ink">
													Request corrections
												</p>
												<p className="mt-1 text-xs text-ink-soft">
													Return the report to the officer for clarification or corrections.
												</p>
											</div>
										</button>

										<button
											type="button"
											disabled={submitting}
											onClick={() => handleDecision("REJECTED")}
											className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
												decision === "REJECTED"
													? "border-red-500 bg-red-50"
													: "border-line hover:border-red-500"
											} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											<XCircle size={19} className="text-red-500" />
											<div>
												<p className="text-sm font-semibold text-ink">
													Reject examination
												</p>
												<p className="mt-1 text-xs text-ink-soft">
													Reject the submitted examination report.
												</p>
											</div>
										</button>

										<div>
											<label className="mb-2 block text-xs font-semibold text-ink">
												Review remarks <span className="text-red-500">*</span>
											</label>

											<textarea
												value={remarks}
												onChange={(event) => setRemarks(event.target.value)}
												disabled={submitting}
												rows={4}
												placeholder="Enter the reason for your decision..."
												className="w-full resize-none rounded-lg border border-line bg-paper p-3 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-orange disabled:opacity-50"
											/>
										</div>

										<button
											type="button"
											disabled={!decision || !remarks.trim() || submitting}
											onClick={() => void handleSubmit()}
											className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
										>
											{submitting ? "Submitting..." : "Submit review"}
											{!submitting && <ArrowRight size={16} />}
										</button>
									</>
								) : currentReviewState ? (
									<div className={`rounded-lg border border-line p-4 ${currentReviewState.background}`}>
										<div className="flex items-center gap-2">
											<currentReviewState.icon
												size={20}
												className={currentReviewState.color}
											/>
											<p className="text-sm font-semibold text-ink">
												{currentReviewState.title}
											</p>
										</div>
										<p className="mt-2 text-xs leading-6 text-ink-soft">
											{currentReviewState.description}
										</p>
										<div className="mt-4 border-t border-line/70 pt-3">
											<p className="text-xs text-ink-soft">
												Current status
											</p>
											<p className="mt-1 text-sm font-semibold text-ink">
												{examinationStatus.replaceAll("_", " ")}
											</p>
										</div>
									</div>
								) : (
									<div className="rounded-lg border border-line bg-sand p-4">
										<div className="flex items-center gap-2">
											<Clock3 size={19} className="text-ink-soft" />
											<p className="text-sm font-semibold text-ink">
												Not ready for review
											</p>
										</div>
										<p className="mt-2 text-xs leading-6 text-ink-soft">
											This examination is currently {examinationStatus.replaceAll("_", " ").toLowerCase()}.
											Review actions will become available when the examination
											officer submits the report for review.
										</p>
										<div className="mt-4 border-t border-line/70 pt-3">
											<p className="text-xs text-ink-soft">
												Current status
											</p>
											<p className="mt-1 text-sm font-semibold text-ink">
												{examinationStatus.replaceAll("_", " ")}
											</p>
										</div>
									</div>
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppShell>
	);
}