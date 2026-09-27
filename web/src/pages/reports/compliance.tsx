import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	Award,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	Filter,
	Search,
	Shield,
	ShieldAlert,
	ShieldCheck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ComplianceRecord {
	id: string;
	containerNo: string;
	blNumber: string;
	agency:
		| "Customs coordination"
		| "Anti-narcotics coordination"
		| "Standards coordination"
		| "Quarantine coordination"
		| "Port security coordination";
	examType:
		| "100% Physical examination"
		| "Scanner review"
		| "Documentation review";
	officer: string;
	date: string;
	time: string;
	outcome: "Outcome recorded" | "Discrepancy noted" | "Sample requested" | "Cleared for collection";
	dossierRef: string;
	referenceNo: string;
}

const initialRecords: ComplianceRecord[] = [
	{
		id: "cmp-1",
		containerNo: "TRIU1234564",
		blNumber: "MEDU8821941",
		agency: "Customs coordination",
		examType: "100% Physical examination",
		officer: "Coordination desk",
		date: "23 Sep 2026",
		time: "10:30 WAT",
		outcome: "Outcome recorded",
		dossierRef: "TRN-EXM-2026-9021",
		referenceNo: "REF-EXM-882103",
	},
	{
		id: "cmp-2",
		containerNo: "MSCU9876540",
		blNumber: "CMAC7201948",
		agency: "Anti-narcotics coordination",
		examType: "Scanner review",
		officer: "Coordination desk",
		date: "22 Sep 2026",
		time: "14:15 WAT",
		outcome: "Outcome recorded",
		dossierRef: "TRN-SCN-2026-0418",
		referenceNo: "REF-SCN-77412",
	},
	{
		id: "cmp-3",
		containerNo: "CMAU5544335",
		blNumber: "MAE4419203",
		agency: "Standards coordination",
		examType: "Documentation review",
		officer: "Documentation desk",
		date: "21 Sep 2026",
		time: "11:45 WAT",
		outcome: "Sample requested",
		dossierRef: "TRN-DOC-2026-3392",
		referenceNo: "REF-DOC-10294",
	},
	{
		id: "cmp-4",
		containerNo: "TEMU7788993",
		blNumber: "HLCU3391024",
		agency: "Quarantine coordination",
		examType: "100% Physical examination",
		officer: "Coordination desk",
		date: "20 Sep 2026",
		time: "16:00 WAT",
		outcome: "Outcome recorded",
		dossierRef: "TRN-QRN-2026-0781",
		referenceNo: "REF-QRN-55910",
	},
	{
		id: "cmp-5",
		containerNo: "COSU1084727",
		blNumber: "COSU6629101",
		agency: "Customs coordination",
		examType: "Documentation review",
		officer: "Documentation desk",
		date: "19 Sep 2026",
		time: "09:20 WAT",
		outcome: "Discrepancy noted",
		dossierRef: "TRN-DOC-2026-8940",
		referenceNo: "REF-DOC-881944",
	},
	{
		id: "cmp-6",
		containerNo: "HLCU4091285",
		blNumber: "ZIM8810293",
		agency: "Port security coordination",
		examType: "Scanner review",
		officer: "Coordination desk",
		date: "18 Sep 2026",
		time: "13:10 WAT",
		outcome: "Cleared for collection",
		dossierRef: "TRN-SCN-2026-1102",
		referenceNo: "REF-SCN-3918",
	},
];

export default function ReportsComplianceRoute() {
	const [records] = useState<ComplianceRecord[]>(initialRecords);
	const [search, setSearch] = useState("");
	const [agencyFilter, setAgencyFilter] = useState("ALL");
	const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [reportPeriod, setReportPeriod] = useState("Last 30 Days");

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const matchesSearch =
				r.containerNo.toLowerCase().includes(search.toLowerCase()) ||
				r.blNumber.toLowerCase().includes(search.toLowerCase()) ||
				r.dossierRef.toLowerCase().includes(search.toLowerCase()) ||
				r.agency.toLowerCase().includes(search.toLowerCase());

			const matchesAgency = agencyFilter === "ALL" || r.agency === agencyFilter;

			return matchesSearch && matchesAgency;
		});
	}, [records, search, agencyFilter]);

	const handleExportCSV = () => {
		const header =
			"Dossier Ref,Container,BL,Agency,Examination Type,Officer,Date,Time,Outcome,Reference\n";
		const rows = records
			.map(
				(r) =>
					`"${r.dossierRef}","${r.containerNo}","${r.blNumber}","${r.agency}","${r.examType}","${r.officer}","${r.date}","${r.time}","${r.outcome}","${r.referenceNo}"`
			)
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `compliance-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Compliance coordination log exported locally.");
	};

	return (
		<AppShell title="Compliance Reports" eyebrow="Coordination & Records">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Coordination record · Searchable by actor, entity, event, outcome
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Coordination & records
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Coordination log of examination scheduling, scanning review, and supporting
						documentation. Outcomes remain with the competent authority.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCSV}
						className="border-line font-mono text-xs text-ink"
					>
						<Download className="mr-1.5 size-3.5" />
						Export Log
					</Button>
					<Button
						size="sm"
						onClick={() => setIsExportModalOpen(true)}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						<ShieldCheck className="mr-1.5 size-3.5" />
						Generate Packet
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Metric
					label="Coordination records"
					value="142"
					tone="info"
					subtext="Last 30 days"
				/>
				<Metric
					label="Avg. hold duration"
					value="3.8 hrs"
					tone="warning"
					subtext="Per container, terminal side only"
				/>
				<Metric
					label="Completed coordination"
					value="100%"
					tone="success"
					subtext="Records closed without exception"
				/>
				<Metric
					label="Record integrity"
					value="Sequential"
					tone="neutral"
					subtext="Events timestamped in order"
				/>
			</div>

			<div className="rounded-lg border border-line bg-paper p-4">
				<div className="flex items-center justify-between border-b border-line pb-3">
					<div className="flex items-center gap-2">
						<Award className="size-4 text-orange-deep" />
						<h3 className="font-display text-sm font-bold text-ink">
							Coordination by agency
						</h3>
					</div>
					<span className="font-mono text-[10px] text-ink-soft">Period: Q3 2026</span>
				</div>
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{[
						["Customs coordination", 142, "Customs coordination records"],
						["Anti-narcotics coordination", 86, "Scanner reviews coordinated"],
						["Standards coordination", 34, "Documentation reviews coordinated"],
						["Quarantine coordination", 29, "Quarantine coordination records"],
					].map(([label, count, detail]) => (
						<div key={String(label)} className="rounded border border-line/60 bg-sand/30 p-3">
							<div className="flex items-center justify-between text-xs">
								<span className="font-medium text-ink">{label}</span>
								<span className="font-mono font-bold text-orange-deep">{count}</span>
							</div>
							<p className="mt-2 text-[10px] text-ink-soft">{detail}</p>
						</div>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 sm:max-w-md">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by container #, dossier ref, or coordination type..."
						className="border-line bg-paper pl-9 text-sm text-ink"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Filter className="size-4 text-ink-soft" />
					<span className="text-xs font-medium text-ink-soft">Coordination:</span>
					<select
						value={agencyFilter}
						onChange={(e) => setAgencyFilter(e.target.value)}
						aria-label="Filter by coordination type"
						className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-orange"
					>
						<option value="ALL">All coordination types</option>
						<option value="Customs coordination">Customs coordination</option>
						<option value="Anti-narcotics coordination">Anti-narcotics coordination</option>
						<option value="Standards coordination">Standards coordination</option>
						<option value="Quarantine coordination">Quarantine coordination</option>
						<option value="Port security coordination">Port security coordination</option>
					</select>
				</div>
			</div>

			<div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[820px] text-left text-sm">
						<thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
							<tr>
								<th className="px-4 py-3">Dossier Ref</th>
								<th className="px-4 py-3">Container / BL</th>
								<th className="px-4 py-3">Coordination</th>
								<th className="px-4 py-3">Examination mode</th>
								<th className="px-4 py-3">Coordinating desk</th>
								<th className="px-4 py-3">Timestamp</th>
								<th className="px-4 py-3">Outcome</th>
								<th className="px-4 py-3 text-right">Dossier</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredRecords.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-4 py-12 text-center text-ink-soft">
										<ShieldAlert className="mx-auto size-8 opacity-40" />
										<p className="mt-2 text-sm">
											No coordination records matching filters.
										</p>
									</td>
								</tr>
							) : (
								filteredRecords.map((r) => (
									<tr key={r.id} className="transition-colors hover:bg-sand/30">
										<td className="px-4 py-4 font-mono font-semibold text-orange-deep">
											{r.dossierRef}
										</td>
										<td className="px-4 py-4">
											<div className="font-mono text-xs font-medium text-ink">
												{r.containerNo}
											</div>
											<div className="font-mono text-[11px] text-ink-soft">
												{r.blNumber}
											</div>
										</td>
										<td className="px-4 py-4">
											<span className="inline-flex items-center gap-1 rounded bg-sand px-2 py-0.5 text-xs font-semibold text-ink">
												<Shield className="size-3 text-orange-deep" />
												{r.agency}
											</span>
										</td>
										<td className="px-4 py-4 text-xs font-medium text-ink">
											{r.examType}
										</td>
										<td className="px-4 py-4 text-xs font-medium text-ink">
											{r.officer}
										</td>
										<td className="px-4 py-4">
											<div className="text-xs font-medium text-ink">{r.date}</div>
											<div className="text-[10px] text-ink-soft">{r.time}</div>
										</td>
										<td className="px-4 py-4">
											<StatusBadge
												label={r.outcome}
												tone={statusTone(r.outcome)}
											/>
										</td>
										<td className="px-4 py-4 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelectedRecord(r)}
												className="h-8 px-2 text-xs text-orange-deep hover:bg-orange/10"
											>
												<Eye className="mr-1 size-3.5" />
												View
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{selectedRecord && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedRecord(null)}
				>
					<div className="w-full max-w-lg rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Coordination record
								</span>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									{selectedRecord.dossierRef}
								</h3>
								<p className="text-xs text-ink-soft">
									Container: {selectedRecord.containerNo} · BL: {selectedRecord.blNumber}
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedRecord(null)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-4 space-y-3.5 text-xs">
							<div className="flex items-center justify-between rounded-lg bg-sand/50 p-3">
								<div>
									<span className="text-ink-soft">Recorded outcome: </span>
									<StatusBadge
										label={selectedRecord.outcome}
										tone={statusTone(selectedRecord.outcome)}
									/>
								</div>
								<div className="text-right">
									<span className="text-ink-soft">Reference: </span>
									<span className="font-mono font-bold text-ink">
										{selectedRecord.referenceNo}
									</span>
								</div>
							</div>

							<div className="divide-y divide-line rounded border border-line">
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Coordination type</span>
									<span className="font-semibold text-ink">{selectedRecord.agency}</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Coordinating desk</span>
									<span className="font-medium text-ink">{selectedRecord.officer}</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Examination mode</span>
									<span className="font-medium text-ink">{selectedRecord.examType}</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Timestamp</span>
									<span className="font-medium text-ink">
										{selectedRecord.date} at {selectedRecord.time}
									</span>
								</div>
								<div className="flex justify-between p-2.5">
									<span className="text-ink-soft">Coordinated by</span>
									<span className="font-medium text-ink">
										TRINŪ · Abuja Flagship Facility
									</span>
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									toast.success(
										`Dossier ${selectedRecord.dossierRef} prepared for download.`
									);
									setSelectedRecord(null);
								}}
								className="border-line text-ink"
							>
								<Download className="mr-1.5 size-3.5" />
								Download Dossier
							</Button>
							<Button
								size="sm"
								onClick={() => setSelectedRecord(null)}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								Close
							</Button>
						</div>
					</div>
				</div>
			)}

			{isExportModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsExportModalOpen(false)}
				>
					<div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
						<div className="flex items-start justify-between border-b border-line pb-4">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
									Coordination packet
								</span>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Generate coordination packet
								</h3>
								<p className="text-xs text-ink-soft">
									Compile coordination records for internal review. Outcomes remain with
									the competent authority.
								</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsExportModalOpen(false)}
								aria-label="Close dialog"
							>
								<X className="size-4" />
							</Button>
						</div>

						<div className="mt-4 space-y-3.5 text-xs">
							<div>
								<label className="font-semibold text-ink-soft">Report period</label>
								<select
									value={reportPeriod}
									onChange={(e) => setReportPeriod(e.target.value)}
									className="mt-1 w-full rounded-md border border-line bg-sand p-2 text-xs text-ink"
								>
									<option value="Last 7 Days">Last 7 days</option>
									<option value="Last 30 Days">Last 30 days</option>
									<option value="Q3 2026">Q3 2026</option>
									<option value="Year-to-Date 2026">Year-to-date 2026</option>
								</select>
							</div>

							<div>
								<label className="font-semibold text-ink-soft">
									Included coordination types
								</label>
								<div className="mt-1 space-y-1.5 rounded-lg border border-line bg-sand/30 p-2.5">
									{[
										"Customs coordination",
										"Anti-narcotics coordination",
										"Standards coordination",
										"Quarantine coordination",
									].map((ag) => (
										<label key={ag} className="flex items-center gap-2">
											<input
												type="checkbox"
												defaultChecked
												className="rounded border-line text-orange-deep"
											/>
											<span className="text-ink">{ag}</span>
										</label>
									))}
								</div>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsExportModalOpen(false)}
								className="border-line text-ink"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={() => {
									toast.success(
										`Coordination packet for ${reportPeriod} prepared locally.`
									);
									setIsExportModalOpen(false);
								}}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Download className="mr-1.5 size-3.5" />
								Generate Packet
							</Button>
						</div>
					</div>
				</div>
			)}
		</AppShell>
	);
}