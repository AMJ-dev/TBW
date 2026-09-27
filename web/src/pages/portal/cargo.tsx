import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Boxes,
	Download,
	FileCheck2,
	FileText,
	Search,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cargoRecords, type CargoRecord } from "@/data/mock";

export default function CargoPageRoute() {
	return (
		<AppShell title="Cargo" eyebrow="Stakeholder portal">
			<PageIntro
				eyebrow="Cargo workspace"
				title="Cargo under your account."
				detail="Search across terminal references, containers, bills of lading, and current obligations."
				actions={
					<Link to="/quote">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							Request a quote <ArrowRight />
						</Button>
					</Link>
				}
			/>

			<div className="grid gap-3 sm:grid-cols-3">
				<Metric label="Active records" value="24" detail="Across 6 shipments" icon={Boxes} />
				<Metric
					label="Documentation"
					value="8"
					detail="3 require attention"
					tone="warning"
					icon={FileText}
				/>
				<Metric
					label="Outstanding"
					value="₦4.49m"
					detail="2 invoices overdue"
					tone="critical"
					icon={FileCheck2}
				/>
			</div>

			<DataTable rows={cargoRecords} kind="cargo" />
		</AppShell>
	);
}

export { CargoPageRoute as CargoPage };

function DataTable({
	rows,
	kind,
}: {
	rows: CargoRecord[];
	kind: "cargo" | "invoices" | "documents";
}) {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("All statuses");
	const filtered = useMemo(
		() => rows.filter((row) => {
			const matchesQuery = JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase());
			return matchesQuery && (statusFilter === "All statuses" || row.status === statusFilter);
		}),
		[query, rows, statusFilter]
	);
	const exportRows = () => {
		const columns: (keyof CargoRecord)[] = ["reference", "container", "billOfLading", "cargo", "consignee", "status", "location", "arrival", "storage", "outstanding"];
		const csv = [columns.join(","), ...filtered.map((row) => columns.map((column) => `"${String(row[column]).replaceAll('"', '""')}"`).join(","))].join("\n");
		const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = "trinu-cargo-demo.csv";
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="rounded-xl bg-paper ring-1 ring-line">
			<div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
				<div className="relative min-w-[220px] flex-1">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={`Search ${kind}...`}
						className="h-10 border-line bg-sand pl-9 text-ink"
					/>
				</div>
				<label className="flex h-10 items-center gap-2 rounded-md border border-line bg-paper px-3 text-sm text-ink">
					<span className="sr-only">Filter by status</span>
					<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="max-w-44 bg-transparent outline-none">
						{["All statuses", ...new Set(rows.map((row) => row.status))].map((status) => <option key={status}>{status}</option>)}
					</select>
				</label>
				<Button
					variant="outline"
					className="border-line bg-paper text-ink"
					onClick={exportRows}
				>
					<Download /> Export
				</Button>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full min-w-[860px] text-left text-sm">
					<thead>
						<tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
							<th className="px-4 py-3 font-medium">Reference</th>
							<th className="px-4 py-3 font-medium">Customer / cargo</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Location / date</th>
							<th className="px-4 py-3 font-medium">Financial</th>
							<th className="px-4 py-3 font-medium">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-line">
						{filtered.map((row) => (
							<tr key={row.id} className="transition-colors hover:bg-sand/60">
								<td className="px-4 py-4">
									<Link
										to="/portal/cargo/$id"
										params={{ id: row.id }}
										className="font-mono text-[12px] font-semibold text-orange-deep"
									>
										{row.reference}
									</Link>
									<p className="mt-1 font-mono text-[11px] text-ink-soft">
										{row.container}
									</p>
								</td>
								<td className="px-4 py-4">
									<p className="font-medium text-ink">{row.cargo}</p>
									<p className="mt-1 text-[11px] text-ink-soft">{row.consignee}</p>
								</td>
								<td className="px-4 py-4">
									<StatusBadge label={row.status} tone={statusTone(row.status)} />
									{row.holds > 0 && (
										<p className="mt-2 font-mono text-[10px] text-coral">
											{row.holds} hold{row.holds > 1 ? "s" : ""}
										</p>
									)}
								</td>
								<td className="px-4 py-4">
									<p className="text-[12px] text-ink">{row.location}</p>
									<p className="mt-1 font-mono text-[10px] text-ink-soft">
										{row.arrival} · {row.storage}
									</p>
								</td>
								<td className="px-4 py-4 font-mono text-[12px] text-ink">
									{row.outstanding}
								</td>
								<td className="px-4 py-4">
									<Link to="/portal/cargo/$id" params={{ id: row.id }} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-orange-deep transition-colors hover:bg-orange/10">
										Open <ArrowRight className="size-4" />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{filtered.length === 0 && (
				<div className="p-12 text-center">
					<Search className="mx-auto size-6 text-ink-soft" />
					<p className="mt-3 font-medium text-ink">No {kind} matches your filters.</p>
					<p className="mt-1 text-sm text-ink-soft">
						Try a different reference or search term.
					</p>
				</div>
			)}

			<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
				<span>
					Showing {filtered.length} of {rows.length} records
				</span>
				<span>Page 1 of 1</span>
			</div>
		</div>
	);
}

function PageIntro({
	eyebrow,
	title,
	detail,
	actions,
}: {
	eyebrow: string;
	title: string;
	detail: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					{eyebrow}
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					{title}
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{detail}</p>
			</div>
			{actions}
		</div>
	);
}