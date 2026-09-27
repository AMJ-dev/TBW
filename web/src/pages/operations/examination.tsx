import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	CheckCircle2,
	ClipboardCheck,
	Download,
	Eye,
	Filter,
	Plus,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExaminationRecord {
	id: string;
	containerNo: string;
	cargoRef: string;
	consignee: string;
	customsOfficer: string;
	bayArea: string;
	examType: "100% Physical" | "Joint Inspection" | "Scanner Review" | "Document Reconciliation";
	scheduledTime: string;
	status: "Scheduled" | "In Progress" | "Outcome recorded" | "Held";
}

const initialExaminations: ExaminationRecord[] = [
	{
		id: "exm-1",
		containerNo: "TRIU1234564",
		cargoRef: "TRN-IMP-002481",
		consignee: "Atlantic Trade Nigeria Ltd",
		customsOfficer: "A. Balogun (Licensed Broker)",
		bayArea: "Bay Area 01",
		examType: "100% Physical",
		scheduledTime: "10:30 Today",
		status: "In Progress",
	},
	{
		id: "exm-2",
		containerNo: "MSCU9876540",
		cargoRef: "TRN-IMP-002482",
		consignee: "Kano Freight Forwarders",
		customsOfficer: "M. Danjuma (Licensed Broker)",
		bayArea: "Bay Area 02",
		examType: "Joint Inspection",
		scheduledTime: "11:45 Today",
		status: "Scheduled",
	},
	{
		id: "exm-3",
		containerNo: "CMAU5544335",
		cargoRef: "TRN-IMP-002483",
		consignee: "Meridian Customs Services",
		customsOfficer: "A. Balogun (Licensed Broker)",
		bayArea: "Bay Area 03",
		examType: "Scanner Review",
		scheduledTime: "Yesterday",
		status: "Outcome recorded",
	},
	{
		id: "exm-4",
		containerNo: "HLCU1122338",
		cargoRef: "TRN-IMP-002484",
		consignee: "Sahara Energy Logistics",
		customsOfficer: "O. Adeleke (Inspection Lead)",
		bayArea: "Bay Area 04",
		examType: "100% Physical",
		scheduledTime: "08 Sep 2026",
		status: "Held",
	},
];

export default function OperationsExaminationRoute() {
	const [exams, setExams] = useState<ExaminationRecord[]>(initialExaminations);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [containerNo, setContainerNo] = useState("");
	const [consignee, setConsignee] = useState("");
	const [examType, setExamType] = useState<ExaminationRecord["examType"]>("100% Physical");
	const [bayArea, setBayArea] = useState("Bay Area 01");

	const filteredExams = useMemo(() => {
		return exams.filter((e) => {
			const matchQuery =
				e.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.customsOfficer.toLowerCase().includes(searchQuery.toLowerCase()) ||
				e.cargoRef.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : e.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [exams, searchQuery, statusFilter]);

	const handleScheduleExam = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo || !consignee) {
			toast.error("Please provide container number and consignee.");
			return;
		}

		const newExam: ExaminationRecord = {
			id: `exm-${exams.length + 1}`,
			containerNo: containerNo.toUpperCase(),
			cargoRef: `TRN-IMP-00${2485 + exams.length}`,
			consignee,
			customsOfficer: "Awaiting assignment",
			bayArea,
			examType,
			scheduledTime: "Today · Next Slot",
			status: "Scheduled",
		};

		setExams([newExam, ...exams]);
		setIsModalOpen(false);
		setContainerNo("");
		setConsignee("");
		toast.success(`Examination scheduled locally for ${containerNo}.`);
	};

	return (
		<AppShell title="Examination Bay" eyebrow="Operations · Coordination">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Examination Area · Coordination desk
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Examination coordination & bay control
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Coordinate container positioning from yard to designated examination bays. The
						platform provides facilities and coordination; outcomes are recorded as
						provided by the competent authority.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Examination schedule exported locally.")}
					>
						<Download className="size-4" /> Export Schedule
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Schedule Examination
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Bays Occupied"
					value="2 / 4"
					detail="Active coordination slots"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="Scheduled Today"
					value="8"
					detail="3 Joint inspections"
					tone="info"
					icon={Boxes}
				/>
				<Metric
					label="Outcomes recorded"
					value="14"
					detail="Refs logged this week"
					tone="success"
					icon={CheckCircle2}
				/>
				<Metric
					label="Exception Holds"
					value="1"
					detail="Requires coordination review"
					tone="critical"
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by container, consignee, cargo ref, or officer..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Scheduled", "In Progress", "Outcome recorded", "Held"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Container / Ref</th>
								<th className="px-4 py-3 font-medium">Consignee</th>
								<th className="px-4 py-3 font-medium">Exam Type</th>
								<th className="px-4 py-3 font-medium">Bay Assignment</th>
								<th className="px-4 py-3 font-medium">Officer / Broker</th>
								<th className="px-4 py-3 font-medium">Scheduled Time</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredExams.map((e) => (
								<tr key={e.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs">
										<span className="font-bold text-ink">{e.containerNo}</span>
										<span className="block text-[10px] text-ink-soft">{e.cargoRef}</span>
									</td>
									<td className="px-4 py-3.5 text-xs font-medium text-ink">{e.consignee}</td>
									<td className="px-4 py-3.5 text-xs text-ink">{e.examType}</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{e.bayArea}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{e.customsOfficer}</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{e.scheduledTime}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={e.status} tone={statusTone(e.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												toast.success(`Examination coordination note added for ${e.containerNo}.`)
											}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											Log Coordination Note
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredExams.length} of {exams.length} examination slots
					</span>
					<span>
						Coordination record only — outcomes remain with the competent authority
					</span>
				</div>
			</section>

			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Examination Coordination
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Schedule Examination Coordination
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleScheduleExam} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Container Identification
								</label>
								<Input
									required
									placeholder="e.g. TRIU1234564"
									value={containerNo}
									onChange={(e) => setContainerNo(e.target.value)}
									className="mt-1.5 border-line bg-sand font-mono text-ink"
								/>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Consignee / Owner
								</label>
								<Input
									required
									placeholder="e.g. Atlantic Trade Nigeria Ltd"
									value={consignee}
									onChange={(e) => setConsignee(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Examination Procedure
									</label>
									<select
										value={examType}
										onChange={(e) =>
											setExamType(e.target.value as ExaminationRecord["examType"])
										}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>100% Physical</option>
										<option>Joint Inspection</option>
										<option>Scanner Review</option>
										<option>Document Reconciliation</option>
									</select>
								</div>

								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Bay Assignment
									</label>
									<select
										value={bayArea}
										onChange={(e) => setBayArea(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Bay Area 01</option>
										<option>Bay Area 02</option>
										<option>Bay Area 03</option>
										<option>Bay Area 04</option>
									</select>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Schedule Coordination
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}