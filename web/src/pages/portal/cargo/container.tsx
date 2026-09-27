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
	Download,
	FileCheck2,
	FileText,
	MapPin,
	Package,
	QrCode,
	ShieldCheck,
	Truck,
	Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";

type ContainerStatus =
	| "Stored"
	| "Documentation"
	| "Examination scheduled"
	| "Awaiting authorised outcome"
	| "Collected";

interface ContainerRecord {
	id: string;
	number: string;
	reference: string;
	bl: string;
	consignee: string;
	size: string;
	type: string;
	seal: string;
	weight: string;
	volume: string;
	position: string;
	status: ContainerStatus;
	arrival: string;
	dwell: string;
	shippingLine: string;
	vessel: string;
	originPort: string;
	marks: string;
}

const containers: ContainerRecord[] = [
	{
		id: "c-1",
		number: "TRIU1234564",
		reference: "TRN-IMP-002481",
		bl: "TRN-BL-2026-008721",
		consignee: "Atlantic Trade Nigeria Ltd",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992819",
		weight: "18,420 kg",
		volume: "67.5 m³",
		position: "Bond WH · Bay 2 · Tier 1",
		status: "Stored",
		arrival: "06 Sep 2026",
		dwell: "3 days",
		shippingLine: "Maersk Line",
		vessel: "Maersk Voyager V.2604",
		originPort: "Apapa Port",
		marks: "ATNL-2026-014 · Bay 2 grouping",
	},
	{
		id: "c-2",
		number: "TRIU1234565",
		reference: "TRN-IMP-002481",
		bl: "TRN-BL-2026-008721",
		consignee: "Atlantic Trade Nigeria Ltd",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992820",
		weight: "18,120 kg",
		volume: "67.5 m³",
		position: "Bond WH · Bay 2 · Tier 2",
		status: "Stored",
		arrival: "06 Sep 2026",
		dwell: "3 days",
		shippingLine: "Maersk Line",
		vessel: "Maersk Voyager V.2604",
		originPort: "Apapa Port",
		marks: "ATNL-2026-014 · Bay 2 grouping",
	},
	{
		id: "c-3",
		number: "TRIU1234566",
		reference: "TRN-IMP-002481",
		bl: "TRN-BL-2026-008721",
		consignee: "Atlantic Trade Nigeria Ltd",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992821",
		weight: "17,980 kg",
		volume: "67.5 m³",
		position: "Bond WH · Bay 3 · Tier 1",
		status: "Stored",
		arrival: "06 Sep 2026",
		dwell: "3 days",
		shippingLine: "Maersk Line",
		vessel: "Maersk Voyager V.2604",
		originPort: "Apapa Port",
		marks: "ATNL-2026-014 · Bay 3 grouping",
	},
	{
		id: "c-4",
		number: "TRIU1234568",
		reference: "TRN-IMP-002481",
		bl: "TRN-BL-2026-008721",
		consignee: "Atlantic Trade Nigeria Ltd",
		size: "40ft",
		type: "General purpose",
		seal: "SL-992822",
		weight: "18,340 kg",
		volume: "67.5 m³",
		position: "Bond WH · Bay 3 · Tier 2",
		status: "Stored",
		arrival: "06 Sep 2026",
		dwell: "3 days",
		shippingLine: "Maersk Line",
		vessel: "Maersk Voyager V.2604",
		originPort: "Apapa Port",
		marks: "ATNL-2026-014 · Bay 3 grouping",
	},
];

const timeline = [
	{
		id: "t-1",
		date: "06 Sep 2026 · 09:12",
		event: "Arrived at gate",
		location: "Gate 3",
		actor: "Gate officer · I. Musa",
		reference: "GATE-01982",
	},
	{
		id: "t-2",
		date: "06 Sep 2026 · 09:35",
		event: "Receiving completed · seal verified",
		location: "Receiving Bay 2",
		actor: "Warehouse team",
		reference: "RCV-002481",
	},
	{
		id: "t-3",
		date: "06 Sep 2026 · 14:08",
		event: "Weight and condition recorded",
		location: "Weighbridge A",
		actor: "Yard officer · D. Okafor",
		reference: "WGH-002481",
	},
	{
		id: "t-4",
		date: "07 Sep 2026 · 08:45",
		event: "Positioned in bonded storage",
		location: "Bond WH · Bay 2 · Tier 1",
		actor: "Yard officer · S. Eze",
		reference: "MOV-004119",
	},
	{
		id: "t-5",
		date: "08 Sep 2026 · 10:20",
		event: "Documentation review started",
		location: "Documentation desk",
		actor: "M. Adeyemi",
		reference: "DOC-009842",
	},
	{
		id: "t-6",
		date: "09 Sep 2026 · 14:30",
		event: "Examination coordination scheduled",
		location: "Examination Area 1",
		actor: "Coordination desk",
		reference: "EXM-001192",
	},
];

const sealHistory = [
	{
		id: "s-1",
		event: "Seal verified at receipt",
		seal: "SL-992819",
		actor: "Warehouse team",
		date: "06 Sep 2026 · 09:35",
		status: "Verified",
	},
	{
		id: "s-2",
		event: "Seal intact during positioning",
		seal: "SL-992819",
		actor: "Yard officer · S. Eze",
		date: "07 Sep 2026 · 08:45",
		status: "Verified",
	},
	{
		id: "s-3",
		event: "Seal photographed",
		seal: "SL-992819",
		actor: "Documentation desk",
		date: "08 Sep 2026 · 09:10",
		status: "Recorded",
	},
];

const equipment = [
	{ id: "eq-1", item: "Reach stacker 01", reason: "Initial positioning", date: "07 Sep · 08:45" },
	{ id: "eq-2", item: "Forklift 04", reason: "Tier adjustment", date: "07 Sep · 11:20" },
];

const documents = [
	{ id: "d-1", name: "Commercial Invoice · 008721", type: "Invoice", status: "Verified" },
	{ id: "d-2", name: "Packing List · 008721", type: "Packing list", status: "Under review" },
	{ id: "d-3", name: "Bill of Lading · 008721", type: "Bill of lading", status: "Verified" },
	{ id: "d-4", name: "Delivery Order · 008721", type: "Delivery order", status: "Uploaded" },
];

export default function ContainerDetailRoute() {
	const params = useParams<{ id?: string }>();
	const id = params?.id;

	const container = useMemo(() => {
		const found = containers.find((c) => c.id === id || c.number === id);
		return found ?? containers[0];
	}, [id]);

	const [tab, setTab] = useState<"Overview" | "Timeline" | "Seals" | "Equipment" | "Documents">(
		"Overview"
	);

	if (!container) {
		return (
			<AppShell title="Container not found" eyebrow="Container workspace">
				<div className="rounded-xl bg-paper p-10 text-center ring-1 ring-line">
					<Package className="mx-auto size-8 text-ink-soft" />
					<h2 className="mt-4 font-display text-xl font-bold text-ink">
						We couldn't find that container.
					</h2>
					<p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-soft">
						The container reference may be incorrect or the container may have been
						collected. Try another reference.
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

	const tabs = [
		"Overview",
		"Timeline",
		"Seals",
		"Equipment",
		"Documents",
	] as const;

	return (
		<AppShell title={container.number} eyebrow="Container workspace">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						to="/portal/cargo/$id"
						params={{ id: container.reference.split("-").pop() ?? "2481" }}
						className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-deep"
					>
						<ChevronLeft className="size-4" /> Back to {container.reference}
					</Link>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						{container.number}
					</h2>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<StatusBadge label={container.status} tone={statusTone(container.status)} />
						<span className="font-mono text-[11px] text-ink-soft">
							{container.size} · {container.type} · {container.weight}
						</span>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Container note logged locally.")}
					>
						Add note
					</Button>
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Movement request opened locally.")}
					>
						<Warehouse className="mr-1.5 size-4" /> Request movement
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => toast.success("Container record prepared for download.")}
					>
						<Download className="mr-1.5 size-4" /> Export record
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Consignee"
					value={container.consignee.split(" ").slice(0, 2).join(" ")}
					detail={container.consignee}
					icon={Boxes}
				/>
				<Metric
					label="Position"
					value={container.position.split(" · ").slice(-1)[0] ?? "—"}
					detail={container.position}
					icon={MapPin}
				/>
				<Metric
					label="Seal"
					value={container.seal}
					detail="Verified at receipt"
					tone="success"
					icon={ShieldCheck}
				/>
				<Metric
					label="Dwell"
					value={container.dwell}
					detail={`Arrived ${container.arrival}`}
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
				<div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Container profile" detail="Controlled record" inline />
						<dl className="grid gap-4 sm:grid-cols-2">
							{[
								["Container number", container.number],
								["Size / type", `${container.size} · ${container.type}`],
								["Reference", container.reference],
								["Bill of lading", container.bl],
								["Weight", container.weight],
								["Volume", container.volume],
								["Seal", container.seal],
								["Marks", container.marks],
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

					<div className="space-y-5">
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
							<SectionHeader title="Movement information" detail="Arrival & position" inline />
							<dl className="grid gap-4 sm:grid-cols-2">
								{[
									["Shipping line", container.shippingLine],
									["Vessel", container.vessel],
									["Origin port", container.originPort],
									["Arrival", container.arrival],
									["Current position", container.position],
									["Dwell", container.dwell],
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
							<SectionHeader title="Container lifecycle" detail="Operational state" inline dark />
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
				</div>
			)}

			{tab === "Timeline" && (
				<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<SectionHeader
						title="Container timeline"
						detail="Auditable event history"
						inline
					/>
					<div className="mt-4 space-y-0">
						{timeline.map((event, index) => (
							<div
								key={event.id}
								className="relative flex gap-4 border-l border-line pb-7 pl-7 last:pb-1"
							>
								<span
									className={
										"absolute -left-[7px] top-0 size-3 rounded-full border-2 " +
										(index < timeline.length - 2
											? "border-orange bg-paper"
											: index === timeline.length - 2
											? "border-orange bg-orange"
											: "border-line bg-paper")
									}
								/>
								<div className="grid flex-1 gap-3 md:grid-cols-[160px_1.3fr_1fr_1fr]">
									<div className="font-mono text-[11px] text-ink-soft">{event.date}</div>
									<div>
										<p className="text-sm font-semibold text-ink">{event.event}</p>
										<p className="mt-1 text-[11px] text-ink-soft">{event.actor}</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
											Location
										</p>
										<p className="mt-1 text-[12px] text-ink">{event.location}</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
											Reference
										</p>
										<p className="mt-1 font-mono text-[11px] text-ink">
											{event.reference}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{tab === "Seals" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Seal history"
						detail={`${sealHistory.length} events`}
					/>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Event</th>
									<th className="px-4 py-3 font-medium">Seal number</th>
									<th className="px-4 py-3 font-medium">Recorded by</th>
									<th className="px-4 py-3 font-medium">Timestamp</th>
									<th className="px-4 py-3 font-medium">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{sealHistory.map((s) => (
									<tr key={s.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5 font-medium text-ink">{s.event}</td>
										<td className="px-4 py-3.5 font-mono text-xs text-orange-deep">
											{s.seal}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">{s.actor}</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
											{s.date}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={s.status} tone={statusTone(s.status)} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<ShieldCheck className="size-4 text-teal-deep" />
							<p className="text-[12px] text-ink-soft">
								Seal records are verified at receipt and any custody change. A mismatch
								requires supervisor resolution.
							</p>
						</div>
					</div>
				</section>
			)}

			{tab === "Equipment" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Equipment used on this container"
						detail={`${equipment.length} moves`}
					/>
					<ul className="divide-y divide-line">
						{equipment.map((e) => (
							<li
								key={e.id}
								className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
							>
								<div className="flex items-center gap-3">
									<div className="grid size-9 place-items-center rounded-md bg-orange/10 text-orange-deep">
										<Truck className="size-4" />
									</div>
									<div>
										<p className="text-sm font-semibold text-ink">{e.item}</p>
										<p className="mt-0.5 text-[12px] text-ink-soft">{e.reason}</p>
									</div>
								</div>
								<span className="font-mono text-[11px] text-ink-soft">{e.date}</span>
							</li>
						))}
					</ul>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<Warehouse className="size-4 text-orange" />
							<p className="text-[12px] text-ink-soft">
								Every equipment movement creates a timestamped auditable event.
							</p>
						</div>
					</div>
				</section>
			)}

			{tab === "Documents" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Documents on this container"
						detail={`${documents.length} files`}
					/>
					<ul className="divide-y divide-line">
						{documents.map((doc) => (
							<li
								key={doc.id}
								className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
							>
								<div className="flex items-center gap-3">
									<div className="grid size-9 place-items-center rounded-md bg-orange/10 text-orange-deep">
										<FileText className="size-4" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-ink">{doc.name}</p>
										<p className="mt-0.5 text-[11px] text-ink-soft">{doc.type}</p>
									</div>
								</div>
								<StatusBadge label={doc.status} tone={statusTone(doc.status)} />
							</li>
						))}
					</ul>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<FileCheck2 className="size-4 text-orange" />
							<p className="text-[12px] text-ink-soft">
								Need a version that isn't shown? Open the document center to see all
								versions.
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

			<div className="grid gap-4 sm:grid-cols-3">
				<RelatedLink
					to="/portal/cargo/$id"
					params={{ id: container.reference.split("-").pop() ?? "2481" }}
					icon={Boxes}
					title="Consignment detail"
					detail={`Back to ${container.reference}`}
				/>
				<RelatedLink
					to="/portal/documents"
					icon={FileCheck2}
					title="Document center"
					detail="All files across this account"
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
	params,
	icon: Icon,
	title,
	detail,
}: {
	to: string;
	params?: Record<string, string>;
	icon: typeof Boxes;
	title: string;
	detail: string;
}) {
	return (
		<Link
			to={to}
			params={params}
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