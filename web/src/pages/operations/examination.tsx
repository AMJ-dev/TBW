import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Boxes,
	CheckCircle2,
	ChevronDown,
	ClipboardCheck,
	Download,
	Filter,
	Plus,
	Search,
} from "lucide-react";
import {
	AppShell,
	StatusBadge,
	statusTone,
	Metric,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ExamType =
	| "100% Physical"
	| "Joint Inspection"
	| "Scanner Review"
	| "Document Reconciliation";

type ExamStatus = "Scheduled" | "In Progress" | "Outcome recorded" | "Held";

interface ExaminationRecord {
	id: string;
	containerNo: string;
	cargoRef: string;
	consignee: string;
	customsOfficer: string;
	bayArea: string;
	examType: ExamType;
	scheduledTime: string;
	status: ExamStatus;
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

const EXAM_TYPES: ExamType[] = [
	"100% Physical",
	"Joint Inspection",
	"Scanner Review",
	"Document Reconciliation",
];

const BAY_AREAS = [
	"Bay Area 01",
	"Bay Area 02",
	"Bay Area 03",
	"Bay Area 04",
];

const STATUS_FILTERS: (ExamStatus | "ALL")[] = [
	"ALL",
	"Scheduled",
	"In Progress",
	"Outcome recorded",
	"Held",
];

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function OperationsExaminationRoute() {
	const [exams, setExams] = useState<ExaminationRecord[]>(initialExaminations);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ExamStatus | "ALL">("ALL");
	const [view, setView] = useState<"list" | "intake">("list");

	const filteredExams = useMemo(() => {
		return exams.filter((e) => {
			const q = searchQuery.trim().toLowerCase();
			const matchQuery =
				!q ||
				e.containerNo.toLowerCase().includes(q) ||
				e.consignee.toLowerCase().includes(q) ||
				e.customsOfficer.toLowerCase().includes(q) ||
				e.cargoRef.toLowerCase().includes(q);

			const matchStatus =
				statusFilter === "ALL" ? true : e.status === statusFilter;

			return matchQuery && matchStatus;
		});
	}, [exams, searchQuery, statusFilter]);

	const handleSchedule = (item: ExaminationRecord) => {
		setExams((prev) => [item, ...prev]);
		setView("list");
		toast.success(
			`Examination scheduled locally for ${item.containerNo}.`
		);
	};

	const handleExport = () => {
		toast.success("Examination schedule exported locally.");
	};

	return (
		<AppShell title="Examination Bay" eyebrow="Operations · Coordination">
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						key="list"
						exams={exams}
						filteredExams={filteredExams}
						searchQuery={searchQuery}
						statusFilter={statusFilter}
						onSearchChange={setSearchQuery}
						onStatusChange={setStatusFilter}
						onNewSchedule={() => setView("intake")}
						onExport={handleExport}
					/>
				) : (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleSchedule}
						existingCount={exams.length}
					/>
				)}
			</div>
		</AppShell>
	);
}

function ListView({
	exams,
	filteredExams,
	searchQuery,
	statusFilter,
	onSearchChange,
	onStatusChange,
	onNewSchedule,
	onExport,
}: {
	exams: ExaminationRecord[];
	filteredExams: ExaminationRecord[];
	searchQuery: string;
	statusFilter: ExamStatus | "ALL";
	onSearchChange: (v: string) => void;
	onStatusChange: (v: ExamStatus | "ALL") => void;
	onNewSchedule: () => void;
	onExport: () => void;
}) {
	return (
		<div
			className="space-y-5 pb-8"
			style={{
				animation:
					"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<style>{`
				@keyframes slideInFromRight {
					from { opacity: 0; transform: translateX(24px); }
					to { opacity: 1; transform: translateX(0); }
				}
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Examination area · Coordination desk
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Examination coordination &amp; bay control
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Coordinate container positioning from yard to designated
						examination bays. The platform provides facilities and
						coordination; outcomes are recorded as provided by the
						competent authority.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Download className="size-4" /> Export schedule
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewSchedule}
					>
						<Plus className="size-4" /> Schedule examination
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Bays occupied"
					value="2 / 4"
					detail="Active coordination slots"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="Scheduled today"
					value="8"
					detail="3 joint inspections"
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
					label="Exception holds"
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
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search by container, consignee, cargo ref, or officer..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{STATUS_FILTERS.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => onStatusChange(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "ALL" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{filteredExams.length === 0 ? (
					<div className="p-12 text-center">
						<ClipboardCheck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No examination slots match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different container, consignee, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[850px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">
										Container / ref
									</th>
									<th className="px-4 py-3 font-medium">
										Consignee
									</th>
									<th className="px-4 py-3 font-medium">
										Exam type
									</th>
									<th className="px-4 py-3 font-medium">
										Bay assignment
									</th>
									<th className="px-4 py-3 font-medium">
										Officer / broker
									</th>
									<th className="px-4 py-3 font-medium">
										Scheduled time
									</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 text-right font-medium">
										Action
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filteredExams.map((e) => (
									<tr
										key={e.id}
										className="transition-colors hover:bg-sand/60"
									>
										<td className="px-4 py-3.5 font-mono text-xs">
											<span className="font-bold text-ink">
												{e.containerNo}
											</span>
											<span className="block text-[10px] text-ink-soft">
												{e.cargoRef}
											</span>
										</td>
										<td className="px-4 py-3.5 text-xs font-medium text-ink">
											{e.consignee}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink">
											{e.examType}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
											{e.bayArea}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{e.customsOfficer}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{e.scheduledTime}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={e.status}
												tone={statusTone(e.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													toast.success(
														`Examination coordination note added for ${e.containerNo}.`
													)
												}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												Log coordination note
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredExams.length} of {exams.length} examination
						slots
					</span>
					<span>
						Coordination record only — outcomes remain with the competent
						authority
					</span>
				</div>
			</section>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	existingCount,
}: {
	onCancel: () => void;
	onSubmit: (item: ExaminationRecord) => void;
	existingCount: number;
}) {
	const [containerNo, setContainerNo] = useState("");
	const [consignee, setConsignee] = useState("");
	const [examType, setExamType] = useState<ExamType>(EXAM_TYPES[0] ?? "100% Physical");
	const [bayArea, setBayArea] = useState(BAY_AREAS[0] ?? "Bay Area 01");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo.trim() || !consignee.trim()) {
			toast.error("Please provide container number and consignee.");
			return;
		}

		const item: ExaminationRecord = {
			id: `exm-${existingCount + 1}`,
			containerNo: containerNo.trim().toUpperCase(),
			cargoRef: `TRN-IMP-00${2485 + existingCount}`,
			consignee: consignee.trim(),
			customsOfficer: "Awaiting assignment",
			bayArea,
			examType,
			scheduledTime: "Today · Next slot",
			status: "Scheduled",
		};

		onSubmit(item);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-5 pb-24"
			style={{
				animation:
					"slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<style>{`
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to examination log
				</Button>
			</div>

			<div className="min-w-0">
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Examination area · Coordination desk
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Schedule examination coordination
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Coordinate container positioning from yard to a designated
					examination bay. This is a coordination record only — outcomes
					remain with the competent authority.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Container
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Identify the container and its consignee.
					</p>
				</div>
				<div className="space-y-5 p-5 sm:p-6">
					<label className="block">
						<span className={labelClass}>
							Container identification{" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. TRIU1234564"
							value={containerNo}
							onChange={(e) =>
								setContainerNo(e.target.value.toUpperCase())
							}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Consignee / owner{" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. Atlantic Trade Nigeria Ltd"
							value={consignee}
							onChange={(e) => setConsignee(e.target.value)}
							className="mt-1.5 h-11 border-line bg-sand text-ink"
						/>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Coordination
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Choose the examination procedure and bay assignment.
					</p>
				</div>
				<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
					<label className="block">
						<span className={labelClass}>Examination procedure</span>
						<SelectField
							value={examType}
							onChange={(v) => setExamType(v as ExamType)}
							options={EXAM_TYPES}
						/>
					</label>

					<label className="block">
						<span className={labelClass}>Bay assignment</span>
						<SelectField
							value={bayArea}
							onChange={setBayArea}
							options={BAY_AREAS}
						/>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<div className="rounded-lg bg-sand p-3 ring-1 ring-line">
						<p className={labelClass}>Recorded as</p>
						<p className="mt-1 font-mono text-[11px] text-ink">
							{containerNo || "CONTAINER"} · {bayArea} · {examType} ·
							Scheduled
						</p>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Examination coordination
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{containerNo || "Container pending"} · {bayArea}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							Schedule coordination
							<ArrowRight className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

function SelectField({
	value,
	onChange,
	options,
}: {
	value: string;
	onChange: (value: string) => void;
	options: string[];
}) {
	return (
		<div className="relative mt-1.5">
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-11 w-full appearance-none rounded-md border border-line bg-sand px-3 pr-9 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
			>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
		</div>
	);
}