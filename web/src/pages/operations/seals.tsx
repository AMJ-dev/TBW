import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ClipboardCheck,
	Container,
	Download,
	Filter,
	Plus,
	Search,
	ShieldCheck,
	ShieldAlert,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SealStatus =
	| "Verified"
	| "Intact"
	| "Pending verification"
	| "Mismatch"
	| "Broken"
	| "Missing";

type SealEvent =
	| "Initial"
	| "Custody change"
	| "Examination preparation"
	| "Return to storage"
	| "Replacement";
    
interface SealRecord {
	id: string;
	container: string;
	containerRef: string;
	bl: string;
	consignment: string;
	sealNumber: string;
	previousSeal?: string | undefined;
	sealType: "Bolt seal" | "Cable seal" | "Plastic seal";
	event: SealEvent;
	location: string;
	recordedBy: string;
	recordedAt: string;
	status: SealStatus;
	notes: string;
	hasPhoto: boolean;
}

const initialSeals: SealRecord[] = [
	{
		id: "s-1",
		container: "TRIU1234564",
		containerRef: "c-1",
		bl: "TRN-BL-2026-008721",
		consignment: "TRN-IMP-002481",
		sealNumber: "SL-992819",
		sealType: "Bolt seal",
		event: "Initial",
		location: "Receiving Bay 2",
		recordedBy: "Warehouse team · M. Adeyemi",
		recordedAt: "06 Sep 2026 · 09:35",
		status: "Verified",
		notes: "Seal verified at receipt. Number matches manifest.",
		hasPhoto: true,
	},
	{
		id: "s-2",
		container: "TRIU1234564",
		containerRef: "c-1",
		bl: "TRN-BL-2026-008721",
		consignment: "TRN-IMP-002481",
		sealNumber: "SL-992819",
		sealType: "Bolt seal",
		event: "Custody change",
		location: "Bond WH · Bay 2 · Tier 1",
		recordedBy: "Yard officer · S. Eze",
		recordedAt: "07 Sep 2026 · 08:45",
		status: "Intact",
		notes: "Seal intact during positioning. Photograph recorded.",
		hasPhoto: true,
	},
	{
		id: "s-3",
		container: "TRIU1234565",
		containerRef: "c-2",
		bl: "TRN-BL-2026-008721",
		consignment: "TRN-IMP-002481",
		sealNumber: "SL-992820",
		sealType: "Bolt seal",
		event: "Initial",
		location: "Receiving Bay 2",
		recordedBy: "Warehouse team · M. Adeyemi",
		recordedAt: "06 Sep 2026 · 09:40",
		status: "Verified",
		notes: "Seal verified at receipt.",
		hasPhoto: true,
	},
	{
		id: "s-4",
		container: "TRIU1234566",
		containerRef: "c-3",
		bl: "TRN-BL-2026-008721",
		consignment: "TRN-IMP-002481",
		sealNumber: "SL-992821",
		sealType: "Bolt seal",
		event: "Custody change",
		location: "Bond WH · Bay 3 · Tier 1",
		recordedBy: "Yard officer · S. Eze",
		recordedAt: "07 Sep 2026 · 09:10",
		status: "Mismatch",
		previousSeal: "SL-992821",
		notes:
			"Seal number recorded as SL-992820 during this event, but manifest and initial record show SL-992821. Awaiting supervisor review.",
		hasPhoto: true,
	},
	{
		id: "s-5",
		container: "TRIU1234568",
		containerRef: "c-4",
		bl: "TRN-BL-2026-008721",
		consignment: "TRN-IMP-002481",
		sealNumber: "SL-992822",
		sealType: "Bolt seal",
		event: "Examination preparation",
		location: "Examination Area 1",
		recordedBy: "Coordination desk",
		recordedAt: "09 Sep 2026 · 14:00",
		status: "Pending verification",
		notes: "Seal to be verified before examination presentation.",
		hasPhoto: false,
	},
];

const statusFilters: (SealStatus | "all")[] = [
	"all",
	"Verified",
	"Intact",
	"Pending verification",
	"Mismatch",
	"Broken",
	"Missing",
];

export default function OperationsSealsRoute() {
	const [seals, setSeals] = useState<SealRecord[]>(initialSeals);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<SealStatus | "all">("all");
	const [selected, setSelected] = useState<SealRecord | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);

	const filtered = useMemo(() => {
		return seals.filter((s) => {
			const matchQuery =
				s.container.toLowerCase().includes(query.toLowerCase()) ||
				s.sealNumber.toLowerCase().includes(query.toLowerCase()) ||
				s.bl.toLowerCase().includes(query.toLowerCase()) ||
				s.consignment.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || s.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [seals, query, statusFilter]);

	const stats = useMemo(() => {
		const total = seals.length;
		const verified = seals.filter((s) => s.status === "Verified" || s.status === "Intact").length;
		const pending = seals.filter((s) => s.status === "Pending verification").length;
		const issues = seals.filter(
			(s) => s.status === "Mismatch" || s.status === "Broken" || s.status === "Missing"
		).length;
		return { total, verified, pending, issues };
	}, [seals]);

	const handleAdd = (next: SealRecord) => {
		setSeals((prev) => [next, ...prev]);
		setIsAddOpen(false);
		toast.success("Seal event recorded locally.");
	};

	const handleResolve = (id: string) => {
		setSeals((prev) =>
			prev.map((s) =>
				s.id === id
					? {
							...s,
							status: "Intact" as SealStatus,
							notes: `${s.notes} Resolved by supervisor review.`,
						}
					: s
			)
		);
		toast.success("Seal event marked as resolved.");
		setSelected(null);
	};

	return (
		<AppShell title="Seal management" eyebrow="Operations · Seal & custody">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Seal integrity
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Seal management & custody records
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Every seal event — initial verification, custody change, examination
						preparation, return to storage, or replacement — is recorded with a timestamp,
						actor, and photograph where applicable.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Seal event log exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsAddOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> Record seal event
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total seal events"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={ShieldCheck}
				/>
				<Metric
					label="Verified or intact"
					value={String(stats.verified)}
					detail="No exception recorded"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Pending verification"
					value={String(stats.pending)}
					detail="Awaiting next event"
					tone="warning"
					icon={ClipboardCheck}
				/>
				<Metric
					label="Flagged issues"
					value={String(stats.issues)}
					detail="Mismatch, broken, or missing"
					tone={stats.issues > 0 ? "critical" : "success"}
					icon={ShieldAlert}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by container, seal number, BL, or consignment..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<ShieldCheck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No seal events match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different container, seal number, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Container</th>
									<th className="px-4 py-3 font-medium">Seal number</th>
									<th className="px-4 py-3 font-medium">Event</th>
									<th className="px-4 py-3 font-medium">Location</th>
									<th className="px-4 py-3 font-medium">Recorded by</th>
									<th className="px-4 py-3 font-medium">Timestamp</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((s) => (
									<tr key={s.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5">
											<Link
												to="/portal/containers/$id"
												params={{ id: s.containerRef }}
												className="font-mono text-xs font-semibold text-orange-deep hover:underline"
											>
												{s.container}
											</Link>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{s.consignment}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] font-semibold text-ink">
												{s.sealNumber}
											</p>
											{ s.previousSeal && s.previousSeal !== s.sealNumber && (
												<p className="mt-0.5 font-mono text-[10px] text-coral line-through">
													{s.previousSeal}
												</p>
											)}
											<p className="mt-0.5 text-[10px] text-ink-soft">{s.sealType}</p>
										</td>
										<td className="px-4 py-3.5 text-[12px] text-ink">{s.event}</td>
										<td className="px-4 py-3.5 text-[12px] text-ink-soft">{s.location}</td>
										<td className="px-4 py-3.5 text-[11px] text-ink-soft">{s.recordedBy}</td>
										<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
											{s.recordedAt}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={s.status} tone={statusTone(s.status)} />
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelected(s)}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												View <ArrowRight className="ml-1 size-3.5" />
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
						Showing {filtered.length} of {seals.length} seal events
					</span>
					<span>A mismatch requires supervisor resolution</span>
				</div>
			</section>

			{selected && (
				<SealDetailDialog
					seal={selected}
					onClose={() => setSelected(null)}
					onResolve={() => handleResolve(selected.id)}
				/>
			)}

			{isAddOpen && (
				<AddSealModal
					onClose={() => setIsAddOpen(false)}
					onSubmit={handleAdd}
				/>
			)}
		</AppShell>
	);
}

function SealDetailDialog({
	seal,
	onClose,
	onResolve,
}: {
	seal: SealRecord;
	onClose: () => void;
	onResolve: () => void;
}) {
	const isIssue =
		seal.status === "Mismatch" || seal.status === "Broken" || seal.status === "Missing";
	const canResolve = seal.status === "Mismatch";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Seal event
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{seal.sealNumber}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							{seal.container} · {seal.consignment}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge label={seal.status} tone={statusTone(seal.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{seal.event}
						</span>
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{seal.sealType}
						</span>
					</div>

					{isIssue && (
						<div className="flex items-start gap-3 rounded-xl bg-coral/5 p-4 ring-1 ring-coral/20">
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									Seal discrepancy flagged
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									A seal mismatch, break, or missing seal requires supervisor review
									before the cargo can progress. Evidence has been recorded with this
									event.
								</p>
							</div>
						</div>
					)}

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{seal.notes}</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Container", seal.container, true],
							["Consignment", seal.consignment, true],
							["Bill of lading", seal.bl, true],
							["Seal number", seal.sealNumber, true],
							["Seal type", seal.sealType],
							["Event", seal.event],
							["Location", seal.location],
							["Recorded by", seal.recordedBy],
							["Recorded at", seal.recordedAt, true],
							["Previous seal", seal.previousSeal ?? "—", true],
						].map(([label, value, mono]) => (
							<div key={label as string}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-sm font-medium text-ink",
										mono && "font-mono"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-start gap-3">
							{seal.hasPhoto ? (
								<Upload className="mt-0.5 size-4 shrink-0 text-orange" />
							) : (
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
							)}
							<div>
								<p className="text-[13px] font-semibold text-ink">
									{seal.hasPhoto ? "Photograph on file" : "No photograph recorded"}
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									{seal.hasPhoto
										? "A photograph of the seal is attached to this event and available for review."
										: "A photograph is recommended for every seal event. Add one to strengthen the evidence record."}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						<Link
							to="/portal/containers/$id"
							params={{ id: seal.containerRef }}
						>
							<Button
								variant="outline"
								className="border-line bg-paper text-ink"
							>
								<Container className="mr-1.5 size-4" /> Open container
							</Button>
						</Link>
						{canResolve && (
							<Button
								onClick={onResolve}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Mark as resolved
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AddSealModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (s: SealRecord) => void;
}) {
	const [container, setContainer] = useState("");
	const [containerRef, setContainerRef] = useState("");
	const [bl, setBl] = useState("");
	const [consignment, setConsignment] = useState("");
	const [sealNumber, setSealNumber] = useState("");
	const [previousSeal, setPreviousSeal] = useState("");
	const [sealType, setSealType] = useState<SealRecord["sealType"]>("Bolt seal");
	const [event, setEvent] = useState<SealEvent>("Initial");
	const [location, setLocation] = useState("");
	const [status, setStatus] = useState<SealStatus>("Verified");
	const [notes, setNotes] = useState("");
	const [hasPhoto, setHasPhoto] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!container.trim() || !sealNumber.trim()) {
			toast.error("Container and seal number are required.");
			return;
		}
		onSubmit({
			id: `s-${Date.now()}`,
			container,
			containerRef: containerRef || "c-1",
			bl: bl || "—",
			consignment: consignment || "—",
			sealNumber,
			previousSeal: previousSeal || undefined,
			sealType,
			event,
			location: location || "Receiving Bay 2",
			recordedBy: "Recording desk · Console",
			recordedAt: new Date().toLocaleString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
			status,
			notes: notes || "Seal event recorded from the operations console.",
			hasPhoto,
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Seal event
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Record a seal event
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Seal events are recorded at receipt, custody change, examination
								preparation, return to storage, and replacement.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Event type
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-3">
								{(
									[
										"Initial",
										"Custody change",
										"Examination preparation",
										"Return to storage",
										"Replacement",
									] as SealEvent[]
								).map((e) => {
									const active = event === e;
									return (
										<button
											key={e}
											type="button"
											onClick={() => setEvent(e)}
											className={cn(
												"rounded-xl border p-3 text-left text-[12px] font-medium transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30 text-orange-deep"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
										>
											{e}
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Container"
								placeholder="TRIU1234564"
								value={container}
								onChange={setContainer}
								mono
								required
							/>
							<Field
								label="Container ref"
								placeholder="c-1"
								value={containerRef}
								onChange={setContainerRef}
								mono
							/>
							<Field
								label="Bill of lading"
								placeholder="TRN-BL-2026-008721"
								value={bl}
								onChange={setBl}
								mono
							/>
							<Field
								label="Consignment"
								placeholder="TRN-IMP-002481"
								value={consignment}
								onChange={setConsignment}
								mono
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<Field
								label="Seal number"
								placeholder="SL-992819"
								value={sealNumber}
								onChange={setSealNumber}
								mono
								required
							/>
							<Field
								label="Previous seal (if replacing)"
								placeholder="SL-992821"
								value={previousSeal}
								onChange={setPreviousSeal}
								mono
							/>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Seal type
								</span>
								<select
									value={sealType}
									onChange={(e) => setSealType(e.target.value as SealRecord["sealType"])}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
								>
									<option value="Bolt seal">Bolt seal</option>
									<option value="Cable seal">Cable seal</option>
									<option value="Plastic seal">Plastic seal</option>
								</select>
							</label>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Location"
								placeholder="Receiving Bay 2"
								value={location}
								onChange={setLocation}
							/>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Status
								</span>
								<select
									value={status}
									onChange={(e) => setStatus(e.target.value as SealStatus)}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
								>
									<option value="Verified">Verified</option>
									<option value="Intact">Intact</option>
									<option value="Pending verification">Pending verification</option>
									<option value="Mismatch">Mismatch</option>
									<option value="Broken">Broken</option>
									<option value="Missing">Missing</option>
								</select>
							</label>
						</div>

						<div>
							<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
								<input
									type="checkbox"
									checked={hasPhoto}
									onChange={(e) => setHasPhoto(e.target.checked)}
									className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
								/>
								<span className="text-[12px] leading-6 text-ink">
									Photograph the seal and attach it to this event.
									<span className="mt-1 block text-[11px] leading-5 text-ink-soft">
										A photograph is recommended for every seal event, particularly
										custody changes and examination preparation.
									</span>
								</span>
							</label>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Anything relevant to this seal event."
							/>
						</label>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Record seal event <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}