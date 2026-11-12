
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { motion } from "framer-motion";
import { http, Resp } from "@/lib/httpClient";
import { toast } from "sonner";
import {
	Activity,
	CalendarDays,
	CheckCircle2,
	Clock3,
	FileSearch,
	Plus,
	Search,
	ShieldCheck,
	UserRound,
	Eye,
} from "lucide-react";

type ExaminationStatus =
	| "SCHEDULED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "PENDING_REVIEW"
	| "APPROVED"
	| "DISCREPANCY_FOUND"
	| "FURTHER_EXAMINATION"
	| "CANCELLED";

type Examination = {
	id: string;
	reference: string;
	shipment_reference: string;
	bill_of_lading: string;
	container_no: string;
	container_size: string;
	seal_no: string;
	vessel_name: string;
	voyage_number: string;
	shipping_line: string;
	consignee: string;
	examination_type: string;
	location: string;
	officer: string;
	scheduled_date: string;
	scheduled_time: string;
	completed_at: string | null;
	status: ExaminationStatus;
	findings: string;
	remarks: string;
};

const statusConfig: Record<ExaminationStatus, { label: string }> = {
	SCHEDULED: { label: "Scheduled" },
	IN_PROGRESS: { label: "In progress" },
	COMPLETED: { label: "Completed" },
	PENDING_REVIEW: { label: "Pending review" },
	APPROVED: { label: "Approved" },
	DISCREPANCY_FOUND: { label: "Discrepancy found" },
	FURTHER_EXAMINATION: { label: "Further examination" },
	CANCELLED: { label: "Cancelled" },
};

const getStatusLabel = (status: string) => {
	return statusConfig[status as ExaminationStatus]?.label ??
		status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ExaminationsPage() {
	const [examinations, setExaminations] = useState<Examination[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState("ALL");
	const [page, setPage] = useState(1);

	const pageSize = 8;

	useEffect(() => {
		let mounted = true;

		const loadExaminations = async () => {
			try {
				setLoading(true);

				const response = await http.get("/operator/examination/");
				const resp: Resp = response.data;

				if (resp.error) {
					throw new Error(
						typeof resp.data === "string"
							? resp.data
							: "Could not load examinations.",
					);
				}

				const code = resp.code as {
					examinations?: Examination[];
				};

				if (mounted) {
					setExaminations(
						Array.isArray(code?.examinations)
							? code.examinations
							: [],
					);
				}
			} catch (error) {
				if (mounted) {
					setExaminations([]);
					toast.error(
						error instanceof Error
							? error.message
							: "Could not load examinations.",
					);
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		void loadExaminations();

		return () => {
			mounted = false;
		};
	}, []);

	const stats = useMemo(() => ({
		total: examinations.length,
		scheduled: examinations.filter(
			(item) => item.status === "SCHEDULED",
		).length,
		inProgress: examinations.filter(
			(item) => item.status === "IN_PROGRESS",
		).length,
		pendingReview: examinations.filter(
			(item) => item.status === "PENDING_REVIEW",
		).length,
		completed: examinations.filter(
			(item) => ["COMPLETED", "APPROVED"].includes(item.status),
		).length,
	}), [examinations]);

	const tabs = useMemo(() => {
		const availableStatuses = new Set(
			examinations.map((item) => item.status),
		);

		const statusTabs = Object.keys(statusConfig)
			.filter((status) => availableStatuses.has(status as ExaminationStatus))
			.map((status) => ({
				value: status,
				label: getStatusLabel(status),
				count: examinations.filter(
					(item) => item.status === status,
				).length,
			}));

		return [
			{
				value: "ALL",
				label: "All examinations",
				count: examinations.length,
			},
			...statusTabs,
		];
	}, [examinations]);

	const filteredExaminations = useMemo(() => {
		const query = search.toLowerCase().trim();

		return examinations.filter((item) => {
			const matchesSearch =
				!query ||
				[
					item.reference,
					item.shipment_reference,
					item.bill_of_lading,
					item.container_no,
					item.seal_no,
					item.officer,
					item.consignee,
				].some((value) =>
					String(value ?? "").toLowerCase().includes(query),
				);

			const matchesStatus =
				activeTab === "ALL" || item.status === activeTab;

			return matchesSearch && matchesStatus;
		});
	}, [examinations, search, activeTab]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredExaminations.length / pageSize),
	);

	const visibleExaminations = filteredExaminations.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	return (
		<AppShell title="Examinations" eyebrow="Operations">
			<div className="space-y-6 pb-10">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-ink">
							Examinations
						</h1>
						<p className="mt-1 text-sm text-ink-soft">
							Manage container examinations, assignments and examination progress.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Link
							to="/operations/examinations/review"
							className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-orange hover:text-orange"
						>
							<ShieldCheck size={17} />
							Review examinations
						</Link>

						<Link
							to="/operations/examinations/schedule"
							className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-deep"
						>
							<Plus size={17} />
							Schedule examination
						</Link>
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
					<Metric
						label="Total examinations"
						value={String(stats.total)}
						icon={FileSearch}
					/>
					<Metric
						label="Scheduled"
						value={String(stats.scheduled)}
						icon={CalendarDays}
					/>
					<Metric
						label="In progress"
						value={String(stats.inProgress)}
						icon={Activity}
					/>
					<Metric
						label="Pending review"
						value={String(stats.pendingReview)}
						icon={Clock3}
					/>
					<Metric
						label="Completed / approved"
						value={String(stats.completed)}
						icon={CheckCircle2}
					/>
				</div>

				<div className="overflow-hidden rounded-xl border border-line bg-paper">
					<div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h2 className="text-sm font-semibold text-ink">
								Examination register
							</h2>
							<p className="mt-1 text-xs text-ink-soft">
								View and monitor examinations across the terminal.
							</p>
						</div>

						<div className="relative min-w-0 sm:w-72">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
							/>
							<input
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setPage(1);
								}}
								placeholder="Search container, shipment, BOL..."
								className="h-10 w-full cursor-text rounded-lg border border-line bg-background pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-soft focus:border-orange focus:ring-2 focus:ring-orange/10"
							/>
						</div>
					</div>

					<div className="flex gap-5 overflow-x-auto border-b border-line px-4">
						{tabs.map((tab) => (
							<button
								type="button"
								key={tab.value}
								onClick={() => {
									setActiveTab(tab.value);
									setPage(1);
								}}
								className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap py-3 text-xs font-medium transition-colors ${
									activeTab === tab.value
										? "text-orange"
										: "text-ink-soft hover:text-ink"
								}`}
							>
								{tab.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] ${
										activeTab === tab.value
											? "bg-orange/10 text-orange"
											: "bg-sand text-ink-soft"
									}`}
								>
									{tab.count}
								</span>

								{activeTab === tab.value && (
									<motion.span
										layoutId="examination-tab"
										className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-orange"
									/>
								)}
							</button>
						))}
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[1050px] border-collapse text-left">
							<thead>
								<tr className="border-b border-line bg-sand/50">
									{[
										"CONTAINER",
										"SHIPMENT",
										"EXAMINATION",
										"LOCATION",
										"ASSIGNED OFFICER",
										"SCHEDULED",
										"STATUS",
										"",
									].map((heading, index) => (
										<th
											key={`${heading}-${index}`}
											className="px-4 py-3 text-[9px] font-semibold tracking-[0.14em] text-ink-soft"
										>
											{heading}
										</th>
									))}
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{!loading && visibleExaminations.map((item) => (
									<tr
										key={item.id}
										className="transition-colors hover:bg-orange/[0.035]"
									>
										<td className="px-4 py-4">
											<p className="text-xs font-semibold text-ink">
												{item.container_no || "—"}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.container_size || "—"} · {item.seal_no || "—"}
											</p>
										</td>

										<td className="px-4 py-4">
											<p className="max-w-40 truncate text-xs font-medium text-ink">
												{item.shipment_reference || "—"}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.bill_of_lading || "—"}
											</p>
										</td>

										<td className="px-4 py-4">
											<p className="text-xs font-medium text-ink">
												{item.examination_type || "—"}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.reference || "—"}
											</p>
										</td>

										<td className="px-4 py-4">
											<p className="text-xs text-ink">
												{item.location || "—"}
											</p>
										</td>

										<td className="px-4 py-4">
											<div className="flex items-center gap-2">
												<div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-ink-soft">
													<UserRound size={13} />
												</div>
												<span className="text-xs text-ink">
													{item.officer || "Unassigned"}
												</span>
											</div>
										</td>

										<td className="px-4 py-4">
											<p className="text-xs font-medium text-ink">
												{item.scheduled_date || "—"}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.scheduled_time || "—"}
											</p>
										</td>

										<td className="px-4 py-4">
											<StatusBadge
												label={getStatusLabel(item.status)}
												tone={statusTone(item.status)}
											/>
										</td>

										<td className="px-4 py-4">
											<Link
												to={`/operations/examinations/${item.id}`}
												className="inline-flex cursor-pointer items-center gap-2 rounded-lg p-2 text-ink-soft transition hover:bg-sand hover:text-orange"
												title="View examination"
											>
												<Eye size={16} />
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{loading && (
							<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-orange/20 border-t-orange" />
								<p className="mt-4 text-xs text-ink-soft">
									Loading examinations...
								</p>
							</div>
						)}

						{!loading && visibleExaminations.length === 0 && (
							<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
								<div className="rounded-xl bg-sand p-4 text-ink-soft">
									<FileSearch size={24} />
								</div>
								<p className="mt-4 text-sm font-semibold text-ink">
									No examinations found
								</p>
								<p className="mt-1 max-w-sm text-xs text-ink-soft">
									{activeTab === "ALL"
										? "No examination records match your search."
										: `There are no examinations with ${getStatusLabel(activeTab)} status.`}
								</p>
							</div>
						)}
					</div>

					<div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
						<p className="text-xs text-ink-soft">
							Showing{" "}
							{filteredExaminations.length === 0
								? 0
								: (page - 1) * pageSize + 1}{" "}
							to{" "}
							{Math.min(page * pageSize, filteredExaminations.length)}{" "}
							of {filteredExaminations.length} examinations
						</p>

						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={page <= 1 || loading}
								onClick={() => setPage((current) => current - 1)}
								className="cursor-pointer rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
							>
								Previous
							</button>

							<span className="px-2 text-xs text-ink-soft">
								{page} / {totalPages}
							</span>

							<button
								type="button"
								disabled={page >= totalPages || loading}
								onClick={() => setPage((current) => current + 1)}
								className="cursor-pointer rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
							>
								Next
							</button>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-line bg-sand/50 p-4">
					<div className="flex items-start gap-3">
						<div className="rounded-lg bg-orange/10 p-2 text-orange">
							<ShieldCheck size={18} />
						</div>
						<div>
							<p className="text-xs font-semibold text-ink">
								Examination workflow
							</p>
							<p className="mt-1 max-w-3xl text-xs leading-5 text-ink-soft">
								Scheduled examinations are assigned to officers. Once the examination is completed, its report can proceed to the separate examination review process. Examination completion does not automatically authorise cargo release.
							</p>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
