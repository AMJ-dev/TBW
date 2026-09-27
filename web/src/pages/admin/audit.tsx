import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Activity,
	AlertTriangle,
	Download,
	Filter,
	Lock,
	Search,
	ShieldCheck,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditEntry {
	id: string;
	timestamp: string;
	actor: string;
	event: string;
	resource: string;
	ip: string;
	status: "Success" | "Flagged" | "Blocked";
	hash: string;
}

const initialAuditLogs: AuditEntry[] = [
	{
		id: "aud-1",
		timestamp: "09 Sep 2026 · 14:22:08",
		actor: "D. Okafor (Terminal Ops)",
		event: "Cargo location relocated",
		resource: "TRIU1234564 → Yard B / Row 04 / B02",
		ip: "10.0.4.18 (Console 02)",
		status: "Success",
		hash: "0x8f2a…91b4",
	},
	{
		id: "aud-2",
		timestamp: "09 Sep 2026 · 13:45:19",
		actor: "A. Balogun (Licensed Broker)",
		event: "Examination coordination note added",
		resource: "TRN-IMP-002481",
		ip: "10.0.4.21 (Console 04)",
		status: "Success",
		hash: "0x44c1…77d2",
	},
	{
		id: "aud-3",
		timestamp: "09 Sep 2026 · 12:10:33",
		actor: "System Scheduler",
		event: "Storage charge auto-assessed",
		resource: "TRN-INV-2026-0142",
		ip: "127.0.0.1 (Worker 01)",
		status: "Success",
		hash: "0x12e9…a5c8",
	},
	{
		id: "aud-4",
		timestamp: "09 Sep 2026 · 11:05:42",
		actor: "Unknown (API client)",
		event: "Failed admin authentication",
		resource: "/api/v1/auth/login",
		ip: "203.0.113.42 (External)",
		status: "Blocked",
		hash: "0x99f3…22e1",
	},
	{
		id: "aud-5",
		timestamp: "09 Sep 2026 · 09:30:00",
		actor: "Khadija Sani (Finance)",
		event: "Receipt allocated to invoice",
		resource: "TRN-RCP-00841 → TRN-INV-2026-0142",
		ip: "10.0.2.14 (Billing Desk)",
		status: "Success",
		hash: "0x77b8…41d9",
	},
	{
		id: "aud-6",
		timestamp: "08 Sep 2026 · 18:22:11",
		actor: "Gate Lane 01 sensor",
		event: "Weight mismatch detected",
		resource: "Truck KJA-882-XD (variance +420 kg)",
		ip: "10.0.5.11 (Scale A)",
		status: "Flagged",
		hash: "0x33a1…88c4",
	},
];

export default function AdminAuditRoute() {
	const [logs, setLogs] = useState<AuditEntry[]>(initialAuditLogs);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");

	const filteredLogs = useMemo(() => {
		return logs.filter((l) => {
			const matchQuery =
				l.actor.toLowerCase().includes(query.toLowerCase()) ||
				l.event.toLowerCase().includes(query.toLowerCase()) ||
				l.resource.toLowerCase().includes(query.toLowerCase()) ||
				l.ip.toLowerCase().includes(query.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : l.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [logs, query, statusFilter]);

	const handleExport = () => {
		const csv = [
			["Timestamp", "Actor", "Event", "Resource", "IP", "Outcome", "Reference"].join(","),
			...logs.map((l) =>
				[
					`"${l.timestamp}"`,
					`"${l.actor}"`,
					`"${l.event}"`,
					`"${l.resource}"`,
					l.ip,
					l.status,
					l.hash,
				].join(",")
			),
		].join("\n");

		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `TRINU-Audit-Log-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Audit trail exported locally.");
	};

	return (
		<AppShell title="Audit Trail" eyebrow="Administration · Security & Compliance">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange">
						Security log · Searchable by actor, entity, event, date, outcome
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						System & operational audit trail
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Searchable log of cargo movement, coordination events, financial postings, and
						access changes.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={handleExport}
					>
						<Download className="size-4" /> Export Log
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Events Recorded"
					value="14,281"
					detail="Last 30 days"
					tone="info"
					icon={Activity}
				/>
				<Metric
					label="Log Integrity"
					value="Sequential"
					detail="Events timestamped in order"
					tone="success"
					icon={ShieldCheck}
				/>
				<Metric
					label="Blocked Sign-ins"
					value="3"
					detail="Brute force attempts"
					tone="critical"
					icon={Lock}
				/>
				<Metric
					label="Flagged Anomalies"
					value="1"
					detail="Pending review"
					tone="warning"
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by actor, event type, resource, or IP address..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Outcome:
						</span>
						{["ALL", "Success", "Flagged", "Blocked"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-orange text-white"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[880px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Timestamp</th>
								<th className="px-4 py-3 font-medium">Actor</th>
								<th className="px-4 py-3 font-medium">Event</th>
								<th className="px-4 py-3 font-medium">Resource / Details</th>
								<th className="px-4 py-3 font-medium">Origin IP</th>
								<th className="px-4 py-3 font-medium">Outcome</th>
								<th className="px-4 py-3 font-medium text-right">Reference</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredLogs.map((l) => (
								<tr key={l.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{l.timestamp}
									</td>
									<td className="px-4 py-3.5 font-medium text-ink">{l.actor}</td>
									<td className="px-4 py-3.5 text-xs font-semibold text-ink">{l.event}</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{l.resource}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{l.ip}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={l.status} tone={statusTone(l.status)} />
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-xs text-orange">
										{l.hash}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredLogs.length} of {logs.length} audit trail records
					</span>
					<span>Retention, purge and legal-hold handled per the applicable retention policy</span>
				</div>
			</section>
		</AppShell>
	);
}