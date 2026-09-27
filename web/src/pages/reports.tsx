import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	BarChart3,
	Download,
	FileSpreadsheet,
	FileText,
	ShieldCheck,
	Truck,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

const reportSections = [
	{
		title: "Operational Throughput",
		desc: "Truck turnaround dwell times, gate queue velocity, stacker movement cycles, and yard capacity.",
		href: "/reports/operations",
		icon: Truck,
		stat: "28 min avg turnaround",
		badge: "Operations",
	},
	{
		title: "Financial & Revenue Analytics",
		desc: "Terminal handling collections, storage accrual schedules, tariff line yields, and customer aging.",
		href: "/reports/financial",
		icon: BarChart3,
		stat: "₦428.5m MTD collections",
		badge: "Finance",
	},
	{
		title: "Coordination & Records",
		desc: "Examination coordination log, movement register, and supporting record checklists.",
		href: "/reports/compliance",
		icon: ShieldCheck,
		stat: "Coordination records",
		badge: "Coordination",
	},
	{
		title: "Scheduled Reports",
		desc: "Directory of recurring reporting pipelines and export configuration.",
		href: "/reports",
		icon: FileSpreadsheet,
		stat: "6 scheduled reports",
		badge: "Schedule",
	},
];

const recentGeneratedReports = [
	{
		title: "Daily Yard Dwell & Capacity Extract",
		category: "Operations",
		date: "Today at 06:00 WAT",
		size: "1.4 MB",
		format: "CSV",
	},
	{
		title: "Examination Coordination Manifest",
		category: "Coordination",
		date: "Today at 08:30 WAT",
		size: "3.8 MB",
		format: "PDF",
	},
	{
		title: "Storage Accruals Ledger",
		category: "Finance",
		date: "Yesterday at 18:00 WAT",
		size: "2.1 MB",
		format: "CSV",
	},
	{
		title: "Weighbridge Axle Gross Extract",
		category: "Operations",
		date: "22 Sep at 12:00 WAT",
		size: "820 KB",
		format: "CSV",
	},
];

export default function ReportsRoute() {
	const handleQuickDownload = (title: string, format: string) => {
		toast.success(`Preparing ${title} (${format}) for download.`);
		const blob = new Blob(
			[
				`TRINU TERMINAL REPORT\nTitle: ${title}\nGenerated: ${new Date().toISOString()}\nPrototype export\n`,
			],
			{ type: "text/plain" }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format.toLowerCase()}`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<AppShell title="Reports & Analytics" eyebrow="Business Intelligence & Operational Oversight">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Executive reporting · Operational transparency
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Reports & analytics
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Terminal visibility, coordination records, financial ledger analysis, and
						scheduled export pipelines.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						onClick={() =>
							handleQuickDownload(
								"Comprehensive Terminal Daily Executive Briefing",
								"PDF"
							)
						}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<Download className="mr-1.5 size-3.5" />
						Download Daily Brief
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Coordination Records"
					value="142"
					tone="info"
					subtext="Last 30 days"
				/>
				<Metric
					label="MTD Terminal Revenue"
					value="₦428.5m"
					tone="success"
					subtext="+14.2% MoM collection velocity"
				/>
				<Metric
					label="Avg Turnaround Time"
					value="28 Mins"
					tone="success"
					subtext="Target: < 35 mins dwell per truck"
				/>
				<Metric
					label="Scheduled Reports"
					value="6 Active"
					tone="neutral"
					subtext="Ran on schedule this month"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{reportSections.map((section) => {
					const Icon = section.icon;
					return (
						<Link
							key={section.title}
							to={section.href}
							className="group flex flex-col justify-between rounded-lg border border-line bg-paper p-5 transition-all hover:border-orange/40 hover:shadow-md"
						>
							<div>
								<div className="flex items-center justify-between">
									<span className="inline-flex size-10 items-center justify-center rounded-lg bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</span>
									<StatusBadge label={section.badge} tone="info" />
								</div>
								<h3 className="mt-4 font-display text-lg font-bold text-ink group-hover:text-orange-deep">
									{section.title}
								</h3>
								<p className="mt-1 text-xs leading-5 text-ink-soft">{section.desc}</p>
							</div>

							<div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
								<span className="font-mono font-semibold text-ink">{section.stat}</span>
								<span className="inline-flex items-center font-semibold text-orange-deep group-hover:underline">
									View Analytics{" "}
									<ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
								</span>
							</div>
						</Link>
					);
				})}
			</div>

			<div className="rounded-lg border border-line bg-paper p-5">
				<div className="flex items-center justify-between border-b border-line pb-3">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Recent scheduled reports
						</h3>
						<p className="text-xs text-ink-soft">
							Generated snapshots available for review and download
						</p>
					</div>
					<span className="font-mono text-[11px] text-ink-soft">Archive</span>
				</div>

				<div className="mt-3 divide-y divide-line">
					{recentGeneratedReports.map((item) => (
						<div
							key={item.title}
							className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
						>
							<div className="flex items-center gap-3">
								<span className="rounded bg-sand p-2 text-orange-deep">
									<FileText className="size-4" />
								</span>
								<div>
									<h4 className="font-medium text-ink">{item.title}</h4>
									<div className="flex items-center gap-2 text-[10px] text-ink-soft">
										<span>{item.category}</span>
										<span>·</span>
										<span>{item.date}</span>
										<span>·</span>
										<span>{item.size}</span>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<span className="font-mono text-[10px] font-semibold uppercase text-ink-soft">
									{item.format}
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleQuickDownload(item.title, item.format)}
									className="h-7 border-line px-2 text-[11px] text-ink"
								>
									<Download className="mr-1 size-3" />
									Download
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</AppShell>
	);
}