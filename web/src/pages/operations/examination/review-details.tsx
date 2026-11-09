import { useCallback, useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import { useParams } from "react-router-dom";
import {http, type Resp } from "@/lib/httpClient";
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
} from "lucide-react";

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
	completed_date: string;
	created_at: string;
	findings: string[];
	documents: {
		name: string;
		status: string;
	}[];
};

type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

export default function ExaminationReviewDetailsPage() {
	const { id } = useParams<{ id: string }>();

	const [examination, setExamination] = useState<Examination | null>(null);
	const [decision, setDecision] = useState<ReviewDecision | "">("");
	const [remarks, setRemarks] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const fetchExamination = useCallback(async () => {
		if (!id) {
			setError("Invalid examination ID.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const response = await http.get(
				`/operator/examination/review/${id}/`
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					String(resp.data || "Could not load examination.")
				);
			}

			const data = resp.code?.examination as Examination | undefined;

			if (!data) {
				throw new Error("Examination record was not returned.");
			}

			setExamination({
				...data,
				findings: Array.isArray(data.findings) ? data.findings : [],
				documents: Array.isArray(data.documents) ? data.documents : [],
			});
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Could not load examination."
			);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		fetchExamination();
	}, [fetchExamination]);

	const handleDecision = (value: ReviewDecision) => {
		setDecision(value);
		setError("");
		setSuccess("");
	};

	const handleSubmit = async () => {
		if (!id || !decision || !remarks.trim() || submitting) return;

		try {
			setSubmitting(true);
			setError("");
			setSuccess("");

			const payload = {
				examination_id: id,
				decision,
				remarks: remarks.trim(),
			};

			const response = await http.post(
				"/operator/examination/review/save/",
				payload
			);

			const resp = response.data as Resp;

			if (resp.error) {
				throw new Error(
					String(resp.data || "Could not submit review.")
				);
			}

			setSuccess(
				String(resp.data || "Review submitted successfully.")
			);

			setExamination((current) =>
				current
					? {
							...current,
							examination_status: decision,
						}
					: current
			);
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Could not submit review."
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

	if (error && !examination) {
		return (
			<AppShell title="Examination Review" eyebrow="Operations">
				<div className="rounded-xl border border-line bg-paper p-10 text-center">
					<FileText
						size={36}
						className="mx-auto mb-4 text-ink-soft"
					/>
					<h2 className="text-lg font-semibold text-ink">
						Could not load examination
					</h2>
					<p className="mt-2 text-sm text-red-500">{error}</p>

					<button
						type="button"
						onClick={fetchExamination}
						className="mt-6 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-deep"
					>
						Retry
					</button>
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

	return (
		<AppShell title="Examination Review" eyebrow="Operations">
			<div className="space-y-6">
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
						label={examination.examination_status}
						tone={statusTone(examination.examination_status)}
					/>
				</div>

				{error && (
					<div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
						<span>{error}</span>
						<button
							type="button"
							onClick={() => setError("")}
							className="shrink-0 font-semibold"
						>
							Dismiss
						</button>
					</div>
				)}

				{success && (
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
						{success}
					</div>
				)}

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
								/>
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
											<p className="text-sm text-ink">
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

						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Supporting documents
								</h2>
							</div>

							<div className="divide-y divide-line">
								{examination.documents.length > 0 ? (
									examination.documents.map((document, index) => (
										<div
											key={`${document.name}-${index}`}
											className="flex items-center justify-between gap-4 px-5 py-4"
										>
											<div className="flex items-center gap-3">
												<div className="rounded-lg bg-sand p-2">
													<FileText
														size={18}
														className="text-ink-soft"
													/>
												</div>

												<span className="text-sm font-medium text-ink">
													{document.name}
												</span>
											</div>

											<StatusBadge
												label={document.status}
												tone={statusTone(document.status)}
											/>
										</div>
									))
								) : (
									<p className="p-5 text-sm text-ink-soft">
										No supporting documents recorded.
									</p>
								)}
							</div>
						</section>
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
									value={examination.scheduled_date}
								/>

								<Detail
									label="Completed date"
									value={examination.completed_date}
								/>

								<Detail
									label="Submitted date"
									value={examination.created_at}
								/>
							</div>
						</section>

						<section className="rounded-xl border border-line bg-paper">
							<div className="border-b border-line px-5 py-4">
								<h2 className="font-semibold text-ink">
									Review decision
								</h2>
								<p className="mt-1 text-xs text-ink-soft">
									Record your decision on this examination.
								</p>
							</div>

							<div className="space-y-4 p-5">
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
									<BadgeCheck
										size={19}
										className="text-green-600"
									/>
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
									onClick={() =>
										handleDecision("CHANGES_REQUESTED")
									}
									className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
										decision === "CHANGES_REQUESTED"
											? "border-orange bg-orange/5"
											: "border-line hover:border-orange"
									} disabled:cursor-not-allowed disabled:opacity-50`}
								>
									<ClipboardCheck
										size={19}
										className="text-orange"
									/>
									<div>
										<p className="text-sm font-semibold text-ink">
											Request corrections
										</p>
										<p className="mt-1 text-xs text-ink-soft">
											Return the examination for clarification.
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
									<XCircle
										size={19}
										className="text-red-500"
									/>
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
										Review remarks
									</label>

									<textarea
										value={remarks}
										onChange={(event) => {
											setRemarks(event.target.value);
											setError("");
											setSuccess("");
										}}
										disabled={submitting}
										rows={4}
										placeholder="Enter your review remarks..."
										className="w-full cursor-text resize-none rounded-lg border border-line bg-paper p-3 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-orange disabled:opacity-50"
									/>
								</div>

								<button
									type="button"
									disabled={
										!decision ||
										!remarks.trim() ||
										submitting
									}
									onClick={handleSubmit}
									className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-50"
								>
									{submitting
										? "Submitting..."
										: "Submit review"}
									{!submitting && <ArrowRight size={16} />}
								</button>
							</div>
						</section>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

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
		<div>
			<p className="mb-1 text-xs text-ink-soft">{label}</p>
			<div className="flex items-center gap-2 text-sm font-semibold text-ink">
				{icon}
				<span>{value || "Not recorded"}</span>
			</div>
		</div>
	);
}