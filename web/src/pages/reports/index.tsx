import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Activity,
	ArrowRight,
	BarChart3,
	Calendar,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileSpreadsheet,
	FileText,
	Filter,
	Layers,
	Play,
	Plus,
	RefreshCw,
	Search,
	ShieldCheck,
	TrendingUp,
	X,
} from "lucide-react";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { client_url } from "@/lib/constants";

interface ScheduledReport {
	id: string;
	name: string;
	category: "Operations" | "Finance" | "Compliance" | "Audit";
	frequency: "Daily (06:00 WAT)" | "Weekly (Monday)" | "Monthly (1st of Month)";
	format: "CSV / Excel" | "PDF Dossier" | "JSON Stream";
	recipients: string;
	lastGenerated: string;
	status: "Active" | "Paused";
}

const initialScheduledReports: ScheduledReport[] = [
	{
		id: "rep-1",
		name: "Terminal Operations & Dwell Time Summary",
		category: "Operations",
		frequency: "Daily (06:00 WAT)",
		format: "CSV / Excel",
		recipients: `ops-management@${client_url}`,
		lastGenerated: "Today 06:00",
		status: "Active",
	},
	{
		id: "rep-2",
		name: "Regulatory Coordination Return",
		category: "Compliance",
		frequency: "Weekly (Monday)",
		format: "PDF Dossier",
		recipients: `ops-management@${client_url}`,
		lastGenerated: "22 Sep 2026",
		status: "Active",
	},
	{
		id: "rep-3",
		name: "Tariff Collections & Receivables Aging Schedule",
		category: "Finance",
		frequency: "Daily (06:00 WAT)",
		format: "CSV / Excel",
		recipients: `treasury@${client_url}`,
		lastGenerated: "Today 06:00",
		status: "Active",
	},
	{
		id: "rep-4",
		name: "Gate & Weighbridge Variance Audit",
		category: "Operations",
		frequency: "Daily (06:00 WAT)",
		format: "CSV / Excel",
		recipients: `gate-ops@${client_url}`,
		lastGenerated: "Today 06:00",
		status: "Active",
	},
	{
		id: "rep-5",
		name: "Monthly Storage Accruals & Aging Dossier",
		category: "Finance",
		frequency: "Monthly (1st of Month)",
		format: "PDF Dossier",
		recipients: `cfo@${client_url}, audit@${client_url}`,
		lastGenerated: "01 Sep 2026",
		status: "Active",
	},
	{
		id: "rep-6",
		name: "System Audit Trail Ledger",
		category: "Audit",
		frequency: "Weekly (Monday)",
		format: "CSV / Excel",
		recipients: `compliance@${client_url}`,
		lastGenerated: "22 Sep 2026",
		status: "Paused",
	},
];

const reportCatalog = [
	{
		title: "Operations Velocity & Dwell",
		category: "Operations",
		desc: "Truck turnaround times, terminal equipment productivity, and yard sector TEU capacity.",
		href: "/reports/operations",
		badge: "Operational extract",
	},
	{
		title: "Revenue & Ledger Yield",
		category: "Finance",
		desc: "Tariff line breakdown, storage collections velocity, and customer aging schedule.",
		href: "/reports/financial",
		badge: "Financial extract",
	},
	{
		title: "Coordination & Compliance",
		category: "Compliance",
		desc: "Examination coordination log, movement register, and supporting record checklists.",
		href: "/reports/compliance",
		badge: "Coordination record",
	},
];

export default function ReportsIndexRoute() {
	const [reports, setReports] = useState<ScheduledReport[]>(initialScheduledReports);
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("ALL");
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

	const [formName, setFormName] = useState("");
	const [formCategory, setFormCategory] = useState<ScheduledReport["category"]>("Operations");
	const [formFrequency, setFormFrequency] =
		useState<ScheduledReport["frequency"]>("Daily (06:00 WAT)");
	const [formFormat, setFormFormat] = useState<ScheduledReport["format"]>("CSV / Excel");
	const [formRecipients, setFormRecipients] = useState("");

	const filteredReports = useMemo(() => {
		return reports.filter((r) => {
			const matchesSearch =
				r.name.toLowerCase().includes(search.toLowerCase()) ||
				r.recipients.toLowerCase().includes(search.toLowerCase());
			const matchesCategory = categoryFilter === "ALL" || r.category === categoryFilter;
			return matchesSearch && matchesCategory;
		});
	}, [reports, search, categoryFilter]);

	const handleToggleStatus = (id: string) => {
		setReports((prev) =>
			prev.map((r) =>
				r.id === id ? { ...r, status: r.status === "Active" ? "Paused" : "Active" } : r
			)
		);
		toast.success("Scheduled report status updated locally.");
	};

	const handleRunNow = (name: string) => {
		toast.success(`Generated "${name}" locally. File is downloading…`);
		const blob = new Blob(
			[
				`TRINU REPORT: ${name}\nGenerated: ${new Date().toISOString()}\nPrototype export\n`,
			],
			{ type: "text/plain" }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleCreateSchedule = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName || !formRecipients) {
			toast.error("Please enter a report title and recipients.");
			return;
		}

		const newReport: ScheduledReport = {
			id: `rep-${Date.now()}`,
			name: formName,
			category: formCategory,
			frequency: formFrequency,
			format: formFormat,
			recipients: formRecipients,
			lastGenerated: "Pending first run",
			status: "Active",
		};

		setReports([newReport, ...reports]);
		toast.success(`Scheduled report "${formName}" created locally.`);
		setIsScheduleModalOpen(false);
		setFormName("");
		setFormRecipients("");
	};

	return (
		<AppShell title="Reports & Analytics" eyebrow="Business Intelligence Center">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Automated delivery & analytics hub
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Reports & intelligence directory
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Manage scheduled reporting pipelines, coordination returns, and download
						operational extracts.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						size="sm"
						onClick={() => setIsScheduleModalOpen(true)}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<Plus className="mr-1.5 size-3.5" />
						New Scheduled Export
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Generated This Month"
					value="184 Reports"
					tone="neutral"
					subtext="Distributed via email"
				/>
				<Metric
					label="Active Automated Schedules"
					value={`${reports.filter((r) => r.status === "Active").length} Scheduled`}
					tone="success"
					subtext="Ran on schedule this month"
				/>
				<Metric
					label="Coordination Filings"
					value="On schedule"
					tone="success"
					subtext="Recorded without exception"
				/>
				<Metric
					label="Audit Trail"
					value="Logging"
					tone="info"
					subtext="Events recorded with timestamps"
				/>
			</div>

			<div>
				<h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-soft">
					Analytics modules
				</h3>
				<div className="mt-3 grid gap-4 sm:grid-cols-3">
					{reportCatalog.map((item) => (
						<Link
							key={item.title}
							to={item.href}
							className="group flex flex-col justify-between rounded-lg border border-line bg-paper p-5 transition-all hover:border-orange/40 hover:shadow-sm"
						>
							<div>
								<div className="flex items-center justify-between">
									<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
										{item.category}
									</span>
									<StatusBadge label={item.badge} tone="info" />
								</div>
								<h4 className="mt-2 font-display text-base font-bold text-ink group-hover:text-orange-deep">
									{item.title}
								</h4>
								<p className="mt-1 text-xs text-ink-soft">{item.desc}</p>
							</div>
							<div className="mt-4 flex items-center gap-1 text-xs font-semibold text-orange-deep">
								<span>Open module</span>
								<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
							</div>
						</Link>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1 sm:max-w-md">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search scheduled reports or recipients..."
							className="border-line bg-paper pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						<span className="text-xs font-medium text-ink-soft">Category:</span>
						<select
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							aria-label="Filter by category"
							className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-orange"
						>
							<option value="ALL">All Categories</option>
							<option value="Operations">Operations</option>
							<option value="Finance">Finance</option>
							<option value="Compliance">Compliance</option>
							<option value="Audit">Audit</option>
						</select>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[800px] text-left text-sm">
							<thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
								<tr>
									<th className="px-4 py-3">Report Name</th>
									<th className="px-4 py-3">Domain</th>
									<th className="px-4 py-3">Schedule Frequency</th>
									<th className="px-4 py-3">Format</th>
									<th className="px-4 py-3">Recipients</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filteredReports.map((r) => (
									<tr key={r.id} className="transition-colors hover:bg-sand/30">
										<td className="px-4 py-4 font-medium text-ink">{r.name}</td>
										<td className="px-4 py-4">
											<span className="rounded bg-sand px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-ink">
												{r.category}
											</span>
										</td>
										<td className="px-4 py-4 text-xs text-ink">{r.frequency}</td>
										<td className="px-4 py-4 font-mono text-xs text-ink-soft">{r.format}</td>
										<td className="px-4 py-4 font-mono text-[11px] text-ink-soft">
											{r.recipients}
										</td>
										<td className="px-4 py-4">
											<button
												type="button"
												onClick={() => handleToggleStatus(r.id)}
												className="cursor-pointer"
												title="Click to toggle status"
											>
												<StatusBadge
													label={r.status}
													tone={r.status === "Active" ? "success" : "critical"}
												/>
											</button>
										</td>
										<td className="px-4 py-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRunNow(r.name)}
													className="h-8 px-2 text-xs text-orange-deep hover:bg-orange/10"
												>
													<Play className="mr-1 size-3.5" />
													Run Now
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleRunNow(r.name)}
													className="h-8 border-line px-2 text-xs text-ink"
													title="Download latest"
												>
													<Download className="size-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{isScheduleModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsScheduleModalOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Pipeline configuration
								</span>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									New scheduled report
								</h3>
								<p className="text-xs text-ink-soft">
									Configure automated report compilation and email distribution.
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsScheduleModalOpen(false)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<form onSubmit={handleCreateSchedule} className="mt-4 space-y-3.5 text-xs">
							<div>
								<label className="font-semibold text-ink-soft">Report Title</label>
								<Input
									required
									placeholder="e.g. Daily Reefer Energy & Plug Audit"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									className="mt-1 border-line bg-sand text-xs text-ink"
								/>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Operational Category</label>
								<select
									value={formCategory}
									onChange={(e) =>
										setFormCategory(e.target.value as ScheduledReport["category"])
									}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Operations">Operations & Yard</option>
									<option value="Finance">Commercial & Finance</option>
									<option value="Compliance">Coordination & Compliance</option>
									<option value="Audit">Security & Audit</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Frequency & Timing</label>
								<select
									value={formFrequency}
									onChange={(e) =>
										setFormFrequency(e.target.value as ScheduledReport["frequency"])
									}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Daily (06:00 WAT)">Daily at 06:00 WAT</option>
									<option value="Weekly (Monday)">Weekly on Monday 07:00 WAT</option>
									<option value="Monthly (1st of Month)">Monthly on 1st of Month</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Output File Format</label>
								<select
									value={formFormat}
									onChange={(e) =>
										setFormFormat(e.target.value as ScheduledReport["format"])
									}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="CSV / Excel">CSV / Excel Spreadsheet</option>
									<option value="PDF Dossier">PDF Executive Dossier</option>
									<option value="JSON Stream">JSON API Stream</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">Recipient Email Addresses</label>
								<Input
									required
									placeholder={`e.g. ops@${client_url}, treasury@${client_url}`}
									value={formRecipients}
									onChange={(e) => setFormRecipients(e.target.value)}
									className="mt-1 border-line bg-sand font-mono text-xs text-ink"
								/>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setIsScheduleModalOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									className="bg-orange text-white hover:bg-orange-deep"
								>
									Schedule Report
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}