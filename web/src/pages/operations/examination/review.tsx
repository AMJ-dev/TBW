import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import {
	Activity,
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	Clock3,
	FileText,
	Filter,
	Search,
	ShieldCheck,
} from "lucide-react";

type ReviewStatus = "PENDING_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";

type Examination = {
	id: string;
	reference: string;
	shipment_reference: string;
	container_no: string;
	bill_of_lading: string;
	examination_type: string;
	examination_date: string;
	officer: string;
	location: string;
	findings: string;
	report: string;
	status: ReviewStatus;
};

const examinations: Examination[] = [
	{
		id: "1",
		reference: "TRN-EXM-2026-00031",
		shipment_reference: "TRN-SHP-2026-5D1F6F38F193",
		container_no: "JHN-93849",
		bill_of_lading: "KSBK-87384",
		examination_type: "Physical Examination",
		examination_date: "08 Nov 2026",
		officer: "Mathias Jacobs",
		location: "Examination Bay 01",
		findings: "Cargo description and declared quantities verified. No major discrepancies recorded.",
		report: "The examination was completed successfully. Container contents were inspected and compared with the submitted declaration.",
		status: "PENDING_REVIEW",
	},
	{
		id: "2",
		reference: "TRN-EXM-2026-00030",
		shipment_reference: "TRN-SHP-2026-84B6D102",
		container_no: "MSCU-738291",
		bill_of_lading: "MSC-738291-04",
		examination_type: "Document Examination",
		examination_date: "07 Nov 2026",
		officer: "Samuel Peters",
		location: "Examination Bay 02",
		findings: "Supporting documentation reviewed. One declared item requires clarification.",
		report: "Documents were reviewed against the shipment declaration. Clarification is required before final clearance.",
		status: "PENDING_REVIEW",
	},
	{
		id: "3",
		reference: "TRN-EXM-2026-00029",
		shipment_reference: "TRN-SHP-2026-91D8A421",
		container_no: "TGHU-629381",
		bill_of_lading: "MAEU-629381",
		examination_type: "Physical Examination",
		examination_date: "06 Nov 2026",
		officer: "Daniel James",
		location: "Examination Bay 01",
		findings: "Declared package count differs from the inspected package count.",
		report: "A discrepancy was identified during the physical examination. The declaration requires correction.",
		status: "PENDING_REVIEW",
	},
];

const statusLabel: Record<ReviewStatus, string> = {
	PENDING_REVIEW: "Pending review",
	APPROVED: "Approved",
	CHANGES_REQUESTED: "Changes requested",
};

export default function ExaminationReviewPage() {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("PENDING_REVIEW");

	const pendingCount = examinations.filter(
		(item) => item.status === "PENDING_REVIEW"
	).length;

	const approvedCount = examinations.filter(
		(item) => item.status === "APPROVED"
	).length;

	const returnedCount = examinations.filter(
		(item) => item.status === "CHANGES_REQUESTED"
	).length;

	const filteredExaminations = useMemo(() => {
		const value = search.trim().toLowerCase();

		return examinations.filter((item) => {
			const matchesFilter = filter === "ALL" || item.status === filter;

			const matchesSearch = [
				item.reference,
				item.shipment_reference,
				item.container_no,
				item.bill_of_lading,
				item.officer,
			].some((field) => field.toLowerCase().includes(value));

			return matchesFilter && matchesSearch;
		});
	}, [filter, search]);

	return (
		<AppShell title="Examination Review" eyebrow="Operations">
			<div className="space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Link
							to="/operations/examinations"
							className="mb-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft transition hover:text-orange"
						>
							<ArrowLeft size={15} />
							Examinations
						</Link>

						<h2 className="font-display text-2xl font-bold tracking-tight text-ink">
							Examination review
						</h2>

						<p className="mt-1 text-sm text-ink-soft">
							Review completed examinations and make approval decisions.
						</p>
					</div>

					<div className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2 ring-1 ring-line">
						<ShieldCheck size={17} className="text-teal" />
						<span className="text-xs font-medium text-ink-soft">
							Authorised review workflow
						</span>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Awaiting review"
						value={String(pendingCount)}
						detail="Require your decision"
						tone="warning"
						icon={Clock3}
					/>

					<Metric
						label="Approved"
						value={String(approvedCount)}
						detail="Successfully reviewed"
						tone="success"
						icon={BadgeCheck}
					/>

					<Metric
						label="Returned"
						value={String(returnedCount)}
						detail="Require further action"
						tone="critical"
						icon={FileText}
					/>

					<Metric
						label="Total examinations"
						value={String(examinations.length)}
						detail="All review records"
						icon={Activity}
					/>
				</div>

				<div className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
					<div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Review queue
							</h3>

							<p className="mt-1 text-xs text-ink-soft">
								Examinations submitted by examination officers.
							</p>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
									size={16}
								/>

								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search examination..."
									className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-xs text-ink outline-none transition focus:border-orange sm:w-64"
								/>
							</div>

							<div className="relative">
								<Filter
									className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
									size={15}
								/>

								<select
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
									className="h-10 w-full cursor-pointer appearance-none rounded-md border border-line bg-white pl-9 pr-8 text-xs text-ink outline-none focus:border-orange sm:w-48"
								>
									<option value="PENDING_REVIEW">Awaiting review</option>
									<option value="APPROVED">Approved</option>
									<option value="CHANGES_REQUESTED">Returned</option>
									<option value="ALL">All examinations</option>
								</select>
							</div>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[950px] text-left">
							<thead className="bg-sand-2/60">
								<tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-5 py-4">Examination</th>
									<th className="px-5 py-4">Container</th>
									<th className="px-5 py-4">Type</th>
									<th className="px-5 py-4">Officer</th>
									<th className="px-5 py-4">Date</th>
									<th className="px-5 py-4">Status</th>
									<th className="px-5 py-4 text-right">Action</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{filteredExaminations.map((item) => (
									<tr
										key={item.id}
										className="transition-colors hover:bg-sand-2/40"
									>
										<td className="px-5 py-4">
											<p className="font-mono text-xs font-semibold text-ink">
												{item.reference}
											</p>

											<p className="mt-1 text-[10px] text-ink-soft">
												{item.shipment_reference}
											</p>
										</td>

										<td className="px-5 py-4">
											<p className="text-xs font-semibold text-ink">
												{item.container_no}
											</p>

											<p className="mt-1 text-[10px] text-ink-soft">
												{item.bill_of_lading}
											</p>
										</td>

										<td className="px-5 py-4 text-xs text-ink">
											{item.examination_type}
										</td>

										<td className="px-5 py-4 text-xs text-ink">
											{item.officer}
										</td>

										<td className="px-5 py-4 text-xs text-ink-soft">
											{item.examination_date}
										</td>

										<td className="px-5 py-4">
											<StatusBadge
												label={statusLabel[item.status]}
												tone={statusTone(item.status)}
											/>
										</td>

										<td className="px-5 py-4 text-right">
											<Link
												to={`/operations/examinations/review/${item.id}`}
												className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-[11px] font-semibold text-ink transition hover:border-orange hover:text-orange"
											>
												Review
												<ArrowRight size={14} />
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{filteredExaminations.length === 0 && (
							<div className="px-6 py-16 text-center">
								<div className="mx-auto grid size-11 place-items-center rounded-lg bg-sand-2">
									<Search size={19} className="text-ink-soft" />
								</div>

								<p className="mt-3 text-sm font-semibold text-ink">
									No examinations found
								</p>

								<p className="mt-1 text-xs text-ink-soft">
									Try changing your search or filter.
								</p>
							</div>
						)}
					</div>

					<div className="flex items-center justify-between border-t border-line px-5 py-3">
						<p className="text-[10px] text-ink-soft">
							Showing {filteredExaminations.length} of {examinations.length} examinations
						</p>

						<Link
							to="/operations/examinations"
							className="cursor-pointer text-[10px] font-semibold text-orange-deep hover:underline"
						>
							View examinations
						</Link>
					</div>
				</div>
			</div>
		</AppShell>
	);
}