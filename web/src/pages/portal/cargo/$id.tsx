import { useMemo, useState } from "react";
import { Link, useParams } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Check,
	ChevronLeft,
	ClipboardCheck,
	Clock3,
	Container,
	Download,
	FileCheck2,
	FileText,
	Package,
	QrCode,
	ShieldCheck,
	Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { cargoRecords, documents, timeline } from "@/data/mock";

const tabs = [
	"Overview",
	"Containers",
	"Timeline",
	"Documents",
	"Charges",
	"Examination",
	"Holds",
	"Evidence",
] as const;

type Tab = (typeof tabs)[number];

const containerDetails = [
	{
		id: "c-1",
		number: "TRIU1234564",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992819",
		weight: "18,420 kg",
		position: "Bond WH · Bay 2",
		status: "Stored",
	},
	{
		id: "c-2",
		number: "TRIU1234565",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992820",
		weight: "18,120 kg",
		position: "Bond WH · Bay 2",
		status: "Stored",
	},
	{
		id: "c-3",
		number: "TRIU1234566",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992821",
		weight: "17,980 kg",
		position: "Bond WH · Bay 3",
		status: "Stored",
	},
	{
		id: "c-4",
		number: "TRIU1234568",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992822",
		weight: "18,340 kg",
		position: "Bond WH · Bay 3",
		status: "Stored",
	},
];

const charges = [
	{
		id: "ch-1",
		label: "Terminal handling charge",
		detail: "THC-01 · Per container (40ft) · 4 units",
		amount: "₦560,000",
		status: "Invoiced",
	},
	{
		id: "ch-2",
		label: "Bonded storage",
		detail: "STR-02 · Days 6–10 · 4 containers · 3 days",
		amount: "₦264,000",
		status: "Accruing",
	},
	{
		id: "ch-3",
		label: "Examination coordination",
		detail: "EXM-04 · Per operation · 1 pending",
		amount: "₦70,000",
		status: "Pending",
	},
	{
		id: "ch-4",
		label: "Reefer power & monitoring",
		detail: "Not applicable · cargo is dry",
		amount: "₦0",
		status: "Not applicable",
	},
];

const holds = [
	{
		id: "h-1",
		type: "Documentation",
		reason: "Commercial invoice under review",
		authority: "Documentation desk",
		raisedBy: "M. Adeyemi",
		raisedAt: "08 Sep 2026 · 09:14",
		reference: "HLD-2026-00871",
		status: "Active",
	},
];

const examinationEvents = [
	{
		id: "ex-1",
		title: "Examination coordination scheduled",
		detail: "Examination Area 1 · 09 Sep 2026 · 14:30",
		tone: "warning" as const,
	},
	{
		id: "ex-2",
		title: "Cargo prepared and presented",
		detail: "Presented to the coordinating desk · awaiting outcome",
		tone: "info" as const,
	},
	{
		id: "ex-3",
		title: "Outcome pending",
		detail: "Outcome will be recorded as provided by the competent authority",
		tone: "neutral" as const,
	},
];

const evidence = [
	{ id: "ev-1", label: "Received — front and side", date: "06 Sep · 09:12", size: "1.2 MB" },
	{ id: "ev-2", label: "Seal integrity — close-up", date: "06 Sep · 09:14", size: "840 KB" },
	{ id: "ev-3", label: "Bonded bay — positioned", date: "07 Sep · 11:05", size: "1.4 MB" },
];

export default function CargoDetailRoute() {
	const params = useParams<{ id?: string }>();
	const id = params?.id;

	const cargo = useMemo(() => {
		const found = cargoRecords.find((c) => c.id === id);
		return found ?? cargoRecords[0];
	}, [id]);

	const [tab, setTab] = useState<Tab>("Overview");

	if (!cargo) {
		return (
			<AppShell title="Cargo not found" eyebrow="Cargo workspace">
				<div className="rounded-xl bg-paper p-10 text-center ring-1 ring-line">
					<Boxes className="mx-auto size-8 text-ink-soft" />
					<h2 className="mt-4 font-display text-xl font-bold text-ink">
						We couldn't find that consignment.
					</h2>
					<p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-soft">
						The reference may be incorrect, or the cargo may have been archived. Try
						another reference from your cargo list.
					</p>
					<Link to="/portal/cargo" className="mt-6 inline-flex">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							<ChevronLeft className="size-4" /> Back to cargo
						</Button>
					</Link>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title={cargo.reference} eyebrow="Cargo workspace">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						to="/portal/cargo"
						className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-deep"
					>
						<ChevronLeft className="size-4" /> Back to cargo
					</Link>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						{cargo.reference}
					</h2>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<StatusBadge label={cargo.status} tone={statusTone(cargo.status)} />
						<span className="font-mono text-[11px] text-ink-soft">
							{cargo.container} · {cargo.cargo}
						</span>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Cargo activity logged locally.")}
					>
						Add note
					</Button>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Release workflow opened locally.")}
					>
						Release workflow
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => toast.success("Cargo record prepared for download.")}
					>
						<Download className="mr-1.5 size-4" /> Export record
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Consignee"
					value={cargo.consignee.split(" ").slice(0, 2).join(" ")}
					detail={cargo.consignee}
					icon={Boxes}
				/>
				<Metric
					label="Containers"
					value={String(containerDetails.length)}
					detail={cargo.container}
					icon={Container}
				/>
				<Metric
					label="Total weight"
					value={cargo.weight}
					detail="Verified at receiving"
					icon={Package}
				/>
				<Metric
					label="Storage"
					value={cargo.storage}
					detail="Deadline · 18 Sep 2026"
					tone="warning"
					icon={Clock3}
				/>
			</div>

			<div className="flex gap-1 overflow-x-auto border-b border-line">
				{tabs.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => setTab(item)}
						className={
							"shrink-0 rounded-none border-b-2 px-4 py-3 text-[13px] transition-colors " +
							(tab === item
								? "border-orange font-semibold text-ink"
								: "border-transparent text-ink-soft hover:border-line hover:text-ink")
						}
					>
						{item}
					</button>
				))}
			</div>

			{tab === "Overview" && (
				<div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Cargo profile" detail="Controlled record" inline />
						<dl className="grid gap-4 sm:grid-cols-2">
							{[
								["Description", cargo.cargo],
								["Consignee", cargo.consignee],
								["Bill of lading", cargo.billOfLading],
								["Shipping line", "Maersk Line"],
								["Arrival", cargo.arrival],
								["Current location", cargo.location],
								["Total weight", cargo.weight],
								["Holds", cargo.holds > 0 ? `${cargo.holds} active` : "None"],
							].map(([label, value]) => (
								<div key={label}>
									<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
										{label}
									</dt>
									<dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
								</div>
							))}
						</dl>
					</section>

					<section className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<SectionHeader title="Cargo lifecycle" detail="Operational state" inline dark />
						{[
							"Expected",
							"Arrived at gate",
							"Received",
							"Stored",
							"Documentation",
							"Examination coordination",
							"Awaiting authorised outcome",
							"Gate out",
						].map((label, index) => (
							<div className="flex items-center gap-3" key={label}>
								<div
									className={
										"grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold " +
										(index < 4
											? "bg-orange text-white"
											: index === 4
											? "bg-orange text-white"
											: "bg-sand/10 text-sand/50 ring-1 ring-sand/20")
									}
								>
									{index < 4 ? <Check className="size-3.5" /> : index + 1}
								</div>
								<span
									className={
										"py-1 text-[13px] " +
										(index > 4
											? "text-sand/45"
											: index === 4
											? "font-semibold text-orange"
											: "text-sand")
									}
								>
									{label}
								</span>
							</div>
						))}
					</section>
				</div>
			)}

			{tab === "Containers" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Containers on this consignment"
						detail={`${containerDetails.length} units`}
					/>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[860px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Container</th>
									<th className="px-4 py-3 font-medium">Size / type</th>
									<th className="px-4 py-3 font-medium">Seal</th>
									<th className="px-4 py-3 font-medium">Weight</th>
									<th className="px-4 py-3 font-medium">Position</th>
									<th className="px-4 py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{containerDetails.map((c) => (
									<tr key={c.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
											{c.number}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{c.size} · {c.type}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-orange-deep">
											{c.seal}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink">{c.weight}</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
											{c.position}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={c.status} tone={statusTone(c.status)} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			)}

			{tab === "Timeline" && (
				<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<SectionHeader title="Cargo timeline" detail="Auditable event history" inline />
					<div className="mt-4 space-y-0">
						{timeline.map(([date, event, actor, location, device, reference]) => (
							<div
								className="relative flex gap-4 border-l border-line pb-7 pl-7 last:pb-1"
								key={reference}
							>
								<span className="absolute -left-[7px] top-0 size-3 rounded-full border-2 border-orange bg-paper" />
								<div className="grid flex-1 gap-3 md:grid-cols-[140px_1.2fr_1fr_1fr]">
									<div className="font-mono text-[11px] text-ink-soft">{date}</div>
									<div>
										<p className="text-sm font-semibold text-ink">{event}</p>
										<p className="mt-1 text-[11px] text-ink-soft">{actor}</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
											Location
										</p>
										<p className="mt-1 text-[12px] text-ink">{location}</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
											Device · Ref
										</p>
										<p className="mt-1 font-mono text-[11px] text-ink">
											{device} · {reference}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{tab === "Documents" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Documents on this consignment"
						detail={`${documents.length} files`}
					/>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[860px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Document</th>
									<th className="px-4 py-3 font-medium">Type</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium">Uploaded by</th>
									<th className="px-4 py-3 font-medium">Version</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{documents.map((doc) => (
									<tr key={doc.name} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5 font-medium text-ink">{doc.name}</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">{doc.type}</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={doc.status} tone={statusTone(doc.status)} />
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{doc.uploadedBy}
											<br />
											<span className="font-mono text-[10px]">{doc.date}</span>
										</td>
										<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
											{doc.version}
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => toast.success("Document preview opened locally.")}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												Preview <ArrowRight className="ml-1 size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<FileText className="size-4 text-orange" />
							<p className="text-[12px] text-ink-soft">
								Missing a document? Upload through the document center and it will appear
								here once received.
							</p>
							<Link to="/portal/documents" className="ml-auto">
								<Button variant="outline" size="sm" className="border-line bg-paper text-ink">
									Open document center
								</Button>
							</Link>
						</div>
					</div>
				</section>
			)}

			{tab === "Charges" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader title="Charges on this consignment" detail={`${charges.length} lines`} />
					<ul className="divide-y divide-line">
						{charges.map((c) => (
							<li
								key={c.id}
								className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
							>
								<div className="min-w-[240px] flex-1">
									<p className="text-sm font-semibold text-ink">{c.label}</p>
									<p className="mt-0.5 text-[12px] text-ink-soft">{c.detail}</p>
								</div>
								<p className="font-mono text-sm font-bold text-ink">{c.amount}</p>
								<StatusBadge label={c.status} tone={statusTone(c.status)} />
							</li>
						))}
					</ul>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="text-[12px] text-ink-soft">
								Charges refresh automatically as operational events occur.
							</p>
							<Link to="/portal/payments">
								<Button variant="outline" size="sm" className="border-line bg-paper text-ink">
									Open payment ledger
								</Button>
							</Link>
						</div>
					</div>
				</section>
			)}

			{tab === "Examination" && (
				<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<SectionHeader
						title="Examination coordination"
						detail="Recorded by the coordinating desk"
						inline
					/>
					<p className="max-w-2xl text-[13px] leading-6 text-ink-soft">
						TRINŪ provides facilities and coordination for examination. Outcomes are
						recorded as provided by the competent authority.
					</p>
					<ul className="mt-5 divide-y divide-line border-y border-line">
						{examinationEvents.map((e) => (
							<li key={e.id} className="flex items-start gap-3 py-3.5">
								<span
									className={
										"mt-1.5 size-1.5 shrink-0 rounded-full " +
										(e.tone === "warning"
											? "bg-orange"
											: e.tone === "info"
											? "bg-sky"
											: "bg-ink-soft/40")
									}
								/>
								<div>
									<p className="text-[13px] font-medium text-ink">{e.title}</p>
									<p className="mt-0.5 font-mono text-[11px] text-ink-soft">{e.detail}</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}

			{tab === "Holds" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader title="Holds on this consignment" detail={`${holds.length} active`} />
					{holds.length === 0 ? (
						<div className="p-10 text-center">
							<ShieldCheck className="mx-auto size-7 text-teal-deep" />
							<p className="mt-3 font-medium text-ink">No holds on this consignment.</p>
							<p className="mt-1 text-[12px] text-ink-soft">
								The cargo is progressing through the standard workflow.
							</p>
						</div>
					) : (
						<ul className="divide-y divide-line">
							{holds.map((h) => (
								<li key={h.id} className="px-5 py-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											<AlertTriangle className="size-4 text-coral" />
											<p className="text-sm font-semibold text-ink">{h.type} hold</p>
											<StatusBadge label={h.status} tone="critical" />
										</div>
										<span className="font-mono text-[11px] text-ink-soft">{h.reference}</span>
									</div>
									<p className="mt-2 text-[13px] text-ink-soft">{h.reason}</p>
									<dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-3">
										<div>
											<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Authority
											</dt>
											<dd className="mt-0.5 text-ink">{h.authority}</dd>
										</div>
										<div>
											<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Raised by
											</dt>
											<dd className="mt-0.5 text-ink">{h.raisedBy}</dd>
										</div>
										<div>
											<dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Raised at
											</dt>
											<dd className="mt-0.5 font-mono text-ink">{h.raisedAt}</dd>
										</div>
									</dl>
								</li>
							))}
						</ul>
					)}
				</section>
			)}

			{tab === "Evidence" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader title="Evidence" detail={`${evidence.length} items`} />
					<div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
						{evidence.map((e) => (
							<div
								key={e.id}
								className="group overflow-hidden rounded-xl bg-sand ring-1 ring-line"
							>
								<div className="grid aspect-video place-items-center bg-sand-2 text-ink-soft">
									<QrCode className="size-8" />
								</div>
								<div className="p-3">
									<p className="text-[13px] font-medium text-ink">{e.label}</p>
									<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
										{e.date} · {e.size}
									</p>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			<div className="grid gap-4 sm:grid-cols-3">
				<RelatedLink
					to="/portal/documents"
					icon={FileCheck2}
					title="Document center"
					detail="All files across this account"
				/>
				<RelatedLink
					to="/portal/payments"
					icon={ClipboardCheck}
					title="Payment ledger"
					detail="Receipts and outstanding balances"
				/>
				<RelatedLink
					to="/portal/bookings"
					icon={Truck}
					title="Truck pickups"
					detail="Coordinate collection slots"
				/>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
	inline = false,
	dark = false,
}: {
	title: string;
	detail: string;
	inline?: boolean;
	dark?: boolean;
}) {
	return (
		<div
			className={
				"mb-4 flex flex-wrap items-center justify-between gap-3 " +
				(inline ? "px-0 pt-0" : "px-5 pt-5")
			}
		>
			<h3
				className={
					"font-display text-sm font-bold tracking-tight " +
					(dark ? "text-sand" : "text-ink")
				}
			>
				{title}
			</h3>
			<span
				className={
					"font-mono text-[10px] uppercase tracking-[0.14em] " +
					(dark ? "text-sand/50" : "text-ink-soft")
				}
			>
				{detail}
			</span>
		</div>
	);
}

function RelatedLink({
	to,
	icon: Icon,
	title,
	detail,
}: {
	to: string;
	icon: typeof FileCheck2;
	title: string;
	detail: string;
}) {
	return (
		<Link
			to={to}
			className="group flex items-start gap-3 rounded-xl bg-paper p-4 ring-1 ring-line transition-colors hover:bg-sand"
		>
			<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
				<Icon className="size-5" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-ink">{title}</p>
				<p className="mt-0.5 text-[12px] text-ink-soft">{detail}</p>
			</div>
			<ArrowRight className="mt-2 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}