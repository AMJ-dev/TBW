import { useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { motion } from "framer-motion";
import {
	Activity,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Container,
	FileSearch,
	Filter,
	Plus,
	Search,
	ShieldCheck,
	SlidersHorizontal,
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
	| "FURTHER_EXAMINATION";

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

const examinations: Examination[] = [
	{
		id: "EXM-001",
		reference: "TRN-EXM-2026-001",
		shipment_reference: "TRN-SHP-2026-5D1F6F38F193",
		bill_of_lading: "KSBK-87384",
		container_no: "JHN-93849",
		container_size: "40ft",
		seal_no: "JHJB-43984",
		vessel_name: "MV Atlantic Star",
		voyage_number: "AS-3874",
		shipping_line: "Oceanic Shipping",
		consignee: "Global Trade Nigeria Ltd",
		examination_type: "Physical Examination",
		location: "Examination Bay 01",
		officer: "Mathias Jacobs",
		scheduled_date: "2026-11-06",
		scheduled_time: "09:30 AM",
		completed_at: null,
		status: "IN_PROGRESS",
		findings: "Examination is currently in progress.",
		remarks: "Container received for physical examination.",
	},
	{
		id: "EXM-002",
		reference: "TRN-EXM-2026-002",
		shipment_reference: "TRN-SHP-2026-8A2D4C1F",
		bill_of_lading: "BOL-839202",
		container_no: "MSCU-7382910",
		container_size: "20ft",
		seal_no: "MSC-82719",
		vessel_name: "MV Ocean Pearl",
		voyage_number: "OP-2026-14",
		shipping_line: "Maersk Line",
		consignee: "Prime Imports Ltd",
		examination_type: "Document Examination",
		location: "Examination Bay 02",
		officer: "Daniel Okafor",
		scheduled_date: "2026-11-06",
		scheduled_time: "11:00 AM",
		completed_at: null,
		status: "SCHEDULED",
		findings: "Awaiting examination.",
		remarks: "Documentation check required.",
	},
	{
		id: "EXM-003",
		reference: "TRN-EXM-2026-003",
		shipment_reference: "TRN-SHP-2026-9B7C2A",
		bill_of_lading: "BOL-728391",
		container_no: "CMAU-8273641",
		container_size: "40ft",
		seal_no: "CMA-82731",
		vessel_name: "MV Northern Light",
		voyage_number: "NL-482",
		shipping_line: "CMA CGM",
		consignee: "West Africa Distributors",
		examination_type: "Physical Examination",
		location: "Examination Bay 03",
		officer: "Ibrahim Musa",
		scheduled_date: "2026-11-05",
		scheduled_time: "02:00 PM",
		completed_at: "2026-11-05 15:45",
		status: "PENDING_REVIEW",
		findings: "Examination completed. Report submitted for review.",
		remarks: "Findings submitted by the examination officer.",
	},
	{
		id: "EXM-004",
		reference: "TRN-EXM-2026-004",
		shipment_reference: "TRN-SHP-2026-7C8D2E",
		bill_of_lading: "BOL-928371",
		container_no: "TGHU-7382914",
		container_size: "40ft",
		seal_no: "TGH-92831",
		vessel_name: "MV African Queen",
		voyage_number: "AQ-2026-09",
		shipping_line: "Grimaldi Lines",
		consignee: "Eastern Cargo Services",
		examination_type: "Scanning Examination",
		location: "Scanning Bay 01",
		officer: "Samuel Ade",
		scheduled_date: "2026-11-04",
		scheduled_time: "10:00 AM",
		completed_at: "2026-11-04 11:30",
		status: "APPROVED",
		findings: "No discrepancies recorded.",
		remarks: "Examination successfully reviewed.",
	},
	{
		id: "EXM-005",
		reference: "TRN-EXM-2026-005",
		shipment_reference: "TRN-SHP-2026-3A8F1D",
		bill_of_lading: "BOL-837291",
		container_no: "HLXU-8293741",
		container_size: "20ft",
		seal_no: "HLX-72819",
		vessel_name: "MV Coastal Express",
		voyage_number: "CE-2026-21",
		shipping_line: "Hapag-Lloyd",
		consignee: "Atlantic Commercial Ltd",
		examination_type: "Physical Examination",
		location: "Examination Bay 01",
		officer: "Peter James",
		scheduled_date: "2026-11-03",
		scheduled_time: "09:00 AM",
		completed_at: "2026-11-03 10:30",
		status: "DISCREPANCY_FOUND",
		findings: "Discrepancy identified during examination.",
		remarks: "Further investigation required.",
	},
];

const statusConfig: Record<ExaminationStatus, { label: string }> = {
	SCHEDULED: { label: "Scheduled" },
	IN_PROGRESS: { label: "In progress" },
	COMPLETED: { label: "Completed" },
	PENDING_REVIEW: { label: "Pending review" },
	APPROVED: { label: "Approved" },
	DISCREPANCY_FOUND: { label: "Discrepancy found" },
	FURTHER_EXAMINATION: { label: "Further examination" },
};

export default function ExaminationsPage() {
	const [search, setSearch] = useState("");
	const [activeTab, setActiveTab] = useState("ALL");
	const [selectedStatus, setSelectedStatus] = useState("ALL");
	const [page, setPage] = useState(1);

	const pageSize = 8;

	const stats = useMemo(() => ({
		total: examinations.length,
		scheduled: examinations.filter((item) => item.status === "SCHEDULED").length,
		inProgress: examinations.filter((item) => item.status === "IN_PROGRESS").length,
		pendingReview: examinations.filter((item) => item.status === "PENDING_REVIEW").length,
		completed: examinations.filter((item) =>
			["COMPLETED", "APPROVED"].includes(item.status),
		).length,
	}), []);

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
				].some((value) => value.toLowerCase().includes(query));

			const matchesTab =
				activeTab === "ALL" ||
				(activeTab === "ACTIVE" && ["SCHEDULED", "IN_PROGRESS"].includes(item.status)) ||
				(activeTab === "COMPLETED" &&
					["COMPLETED", "PENDING_REVIEW", "APPROVED"].includes(item.status)) ||
				(activeTab === "ATTENTION" &&
					["DISCREPANCY_FOUND", "FURTHER_EXAMINATION"].includes(item.status));

			const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

			return matchesSearch && matchesTab && matchesStatus;
		});
	}, [search, activeTab, selectedStatus]);

	const totalPages = Math.max(1, Math.ceil(filteredExaminations.length / pageSize));

	const visibleExaminations = filteredExaminations.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const tabs = [
		{ value: "ALL", label: "All examinations" },
		{ value: "ACTIVE", label: "Active" },
		{ value: "COMPLETED", label: "Completed & review" },
		{ value: "ATTENTION", label: "Needs attention" },
	];

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

					<Link
						to="/operations/examinations/schedule"
						className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-deep"
					>
						<Plus size={17} />
						Schedule examination
					</Link>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
					<Metric label="Total examinations" value={String(stats.total)} icon={FileSearch} />
					<Metric label="Scheduled" value={String(stats.scheduled)} icon={CalendarDays} />
					<Metric label="In progress" value={String(stats.inProgress)} icon={Activity} />
					<Metric label="Pending review" value={String(stats.pendingReview)} icon={Clock3} />
					<Metric label="Completed / approved" value={String(stats.completed)} icon={CheckCircle2} />
				</div>

				<div className="overflow-hidden rounded-xl border border-line bg-paper">
					<div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h2 className="text-sm font-semibold text-ink">Examination register</h2>
							<p className="mt-1 text-xs text-ink-soft">
								View and monitor examinations across the terminal.
							</p>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<div className="relative min-w-0 sm:w-72">
								<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
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

							<div className="relative">
								<SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
								<select
									value={selectedStatus}
									onChange={(event) => {
										setSelectedStatus(event.target.value);
										setPage(1);
									}}
									className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-background pl-9 pr-8 text-xs text-ink outline-none focus:border-orange sm:w-48"
								>
									<option value="ALL">All statuses</option>
									{Object.entries(statusConfig).map(([value, config]) => (
										<option key={value} value={value}>{config.label}</option>
									))}
								</select>
								<Filter size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
							</div>
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
								className={`relative cursor-pointer whitespace-nowrap py-3 text-xs font-medium transition-colors ${
									activeTab === tab.value ? "text-orange" : "text-ink-soft hover:text-ink"
								}`}
							>
								{tab.label}
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
									{["CONTAINER", "SHIPMENT", "EXAMINATION", "LOCATION", "ASSIGNED OFFICER", "SCHEDULED", "STATUS", ""].map((heading, index) => (
										<th key={`${heading}-${index}`} className="px-4 py-3 text-[9px] font-semibold tracking-[0.14em] text-ink-soft">
											{heading}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{visibleExaminations.map((item) => (
									<tr key={item.id} className="transition-colors hover:bg-orange/[0.035]">
										<td className="px-4 py-4">
											<p className="text-xs font-semibold text-ink">{item.container_no}</p>
											<p className="mt-1 text-[10px] text-ink-soft">{item.container_size} · {item.seal_no}</p>
										</td>
										<td className="px-4 py-4">
											<p className="max-w-40 truncate text-xs font-medium text-ink">{item.shipment_reference}</p>
											<p className="mt-1 text-[10px] text-ink-soft">{item.bill_of_lading}</p>
										</td>
										<td className="px-4 py-4">
											<p className="text-xs font-medium text-ink">{item.examination_type}</p>
											<p className="mt-1 text-[10px] text-ink-soft">{item.reference}</p>
										</td>
										<td className="px-4 py-4">
											<p className="text-xs text-ink">{item.location}</p>
										</td>
										<td className="px-4 py-4">
											<div className="flex items-center gap-2">
												<div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-ink-soft">
													<UserRound size={13} />
												</div>
												<span className="text-xs text-ink">{item.officer}</span>
											</div>
										</td>
										<td className="px-4 py-4">
											<p className="text-xs font-medium text-ink">{item.scheduled_date}</p>
											<p className="mt-1 text-[10px] text-ink-soft">{item.scheduled_time}</p>
										</td>
										<td className="px-4 py-4">
											<StatusBadge label={statusConfig[item.status].label} tone={statusTone(item.status)} />
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

						{visibleExaminations.length === 0 && (
							<div className="flex flex-col items-center justify-center px-4 py-16 text-center">
								<div className="rounded-xl bg-sand p-4 text-ink-soft">
									<FileSearch size={24} />
								</div>
								<p className="mt-4 text-sm font-semibold text-ink">No examinations found</p>
								<p className="mt-1 max-w-sm text-xs text-ink-soft">
									Try another search term or change your status filter.
								</p>
							</div>
						)}
					</div>

					<div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
						<p className="text-xs text-ink-soft">
							Showing {filteredExaminations.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredExaminations.length)} of {filteredExaminations.length} examinations
						</p>

						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={page <= 1}
								onClick={() => setPage((current) => current - 1)}
								className="cursor-pointer rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
							>
								Previous
							</button>
							<span className="px-2 text-xs text-ink-soft">{page} / {totalPages}</span>
							<button
								type="button"
								disabled={page >= totalPages}
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
							<p className="text-xs font-semibold text-ink">Examination workflow</p>
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