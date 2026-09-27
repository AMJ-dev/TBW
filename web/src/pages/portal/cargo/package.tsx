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
	Package,
	QrCode,
	ShieldCheck,
	Truck,
	Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";

type PackageStatus =
	| "Stored"
	| "Reserved"
	| "In transit"
	| "Examination scheduled"
	| "Awaiting authorised outcome"
	| "Collected";

interface PackageRecord {
	id: string;
	markNumber: string;
	container: string;
	containerId: string;
	consignment: string;
	consignee: string;
	kind: string;
	quantity: string;
	weight: string;
	dimensions: string;
	position: string;
	status: PackageStatus;
	condition: string;
	description: string;
	marks: string;
}

const packages: PackageRecord[] = [
	{
		id: "p-1",
		markNumber: "ATNL-2026-014-001",
		container: "TRIU1234564",
		containerId: "c-1",
		consignment: "TRN-IMP-002481",
		consignee: "Atlantic Trade Nigeria Ltd",
		kind: "Carton",
		quantity: "48 cartons",
		weight: "620 kg",
		dimensions: "120 × 80 × 90 cm",
		position: "Bond WH · Bay 2 · Rack 3 · Bin 12",
		status: "Stored",
		condition: "Good · no visible damage",
		description: "Telecommunications transceivers, packed on 4 pallets",
		marks: "ATNL-2026-014 · Handle with care · This side up",
	},
	{
		id: "p-2",
		markNumber: "ATNL-2026-014-002",
		container: "TRIU1234564",
		containerId: "c-1",
		consignment: "TRN-IMP-002481",
		consignee: "Atlantic Trade Nigeria Ltd",
		kind: "Carton",
		quantity: "52 cartons",
		weight: "680 kg",
		dimensions: "120 × 80 × 90 cm",
		position: "Bond WH · Bay 2 · Rack 3 · Bin 13",
		status: "Stored",
		condition: "Good · no visible damage",
		description: "Fiber termination units, packed on 4 pallets",
		marks: "ATNL-2026-014 · Handle with care · This side up",
	},
	{
		id: "p-3",
		markNumber: "ATNL-2026-014-003",
		container: "TRIU1234564",
		containerId: "c-1",
		consignment: "TRN-IMP-002481",
		consignee: "Atlantic Trade Nigeria Ltd",
		kind: "Pallet",
		quantity: "6 pallets",
		weight: "480 kg",
		dimensions: "120 × 100 × 140 cm",
		position: "Bond WH · Bay 2 · Rack 4 · Floor",
		status: "Reserved",
		condition: "Good · strap tension verified",
		description: "Bulk fiber hardware — reserved for upcoming examination",
		marks: "ATNL-2026-014 · Stack limit 3 high",
	},
	{
		id: "p-4",
		markNumber: "ATNL-2026-014-004",
		container: "TRIU1234565",
		containerId: "c-2",
		consignment: "TRN-IMP-002481",
		consignee: "Atlantic Trade Nigeria Ltd",
		kind: "Carton",
		quantity: "60 cartons",
		weight: "780 kg",
		dimensions: "120 × 80 × 90 cm",
		position: "Bond WH · Bay 2 · Rack 5 · Bin 02",
		status: "Stored",
		condition: "Good · no visible damage",
		description: "Power modules, packed on 5 pallets",
		marks: "ATNL-2026-014 · Keep dry",
	},
];

const timeline = [
	{
		id: "t-1",
		date: "06 Sep 2026 · 09:35",
		event: "Package received and tallied",
		location: "Receiving Bay 2",
		actor: "Warehouse team",
		reference: "RCV-002481",
	},
	{
		id: "t-2",
		date: "06 Sep 2026 · 10:14",
		event: "Condition recorded as good",
		location: "Receiving Bay 2",
		actor: "Warehouse team",
		reference: "COND-002481-001",
	},
	{
		id: "t-3",
		date: "07 Sep 2026 · 08:52",
		event: "Positioned in bonded storage",
		location: "Bond WH · Bay 2 · Rack 3 · Bin 12",
		actor: "Yard officer · S. Eze",
		reference: "MOV-004119",
	},
	{
		id: "t-4",
		date: "09 Sep 2026 · 14:30",
		event: "Reserved for examination coordination",
		location: "Examination Area 1",
		actor: "Coordination desk",
		reference: "EXM-001192",
	},
];

const handling = [
	{ id: "h-1", step: "Received", detail: "4 pallets · 48 cartons tallied", date: "06 Sep · 09:35" },
	{ id: "h-2", step: "Weighed", detail: "620 kg verified at receiving scale", date: "06 Sep · 10:02" },
	{ id: "h-3", step: "Putaway", detail: "Positioned on Rack 3 · Bin 12", date: "07 Sep · 08:52" },
	{ id: "h-4", step: "Reserved", detail: "Marked for upcoming examination coordination", date: "09 Sep · 14:30" },
];

const evidence = [
	{ id: "ev-1", label: "Package front", date: "06 Sep · 09:40", size: "1.1 MB" },
	{ id: "ev-2", label: "Markings close-up", date: "06 Sep · 09:42", size: "780 KB" },
	{ id: "ev-3", label: "Positioned on rack", date: "07 Sep · 08:55", size: "1.3 MB" },
];

export default function PackageDetailRoute() {
	const params = useParams<{ id?: string }>();
	const id = params?.id;

	const pkg = useMemo(() => {
		const found = packages.find(
			(p) => p.id === id || p.markNumber === id
		);
		return found ?? packages[0];
	}, [id]);

	const [tab, setTab] = useState<
		"Overview" | "Timeline" | "Handling" | "Evidence"
	>("Overview");

	if (!pkg) {
		return (
			<AppShell title="Package not found" eyebrow="Package workspace">
				<div className="rounded-xl bg-paper p-10 text-center ring-1 ring-line">
					<Package className="mx-auto size-8 text-ink-soft" />
					<h2 className="mt-4 font-display text-xl font-bold text-ink">
						We couldn't find that package.
					</h2>
					<p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-soft">
						The mark number may be incorrect or the package may have been consolidated.
						Try another reference.
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

	const tabs = ["Overview", "Timeline", "Handling", "Evidence"] as const;

	return (
		<AppShell title={pkg.markNumber} eyebrow="Package workspace">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link
						to="/portal/cargo/$id"
						params={{ id: pkg.consignment.split("-").pop() ?? "2481" }}
						className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-deep"
					>
						<ChevronLeft className="size-4" /> Back to {pkg.consignment}
					</Link>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						{pkg.markNumber}
					</h2>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<StatusBadge label={pkg.status} tone={statusTone(pkg.status)} />
						<span className="font-mono text-[11px] text-ink-soft">
							{pkg.kind} · {pkg.quantity} · {pkg.weight}
						</span>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Package note logged locally.")}
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
						onClick={() => toast.success("Package record prepared for download.")}
					>
						<Download className="mr-1.5 size-4" /> Export record
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Container"
					value={pkg.container}
					detail={`Parent · ${pkg.containerId}`}
					icon={Boxes}
				/>
				<Metric
					label="Kind"
					value={pkg.kind}
					detail={`${pkg.quantity}`}
					icon={Package}
				/>
				<Metric
					label="Weight"
					value={pkg.weight}
					detail={`Dimensions ${pkg.dimensions}`}
					icon={Truck}
				/>
				<Metric
					label="Condition"
					value="Good"
					detail={pkg.condition}
					tone="success"
					icon={ShieldCheck}
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
				<div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Package profile" detail="Controlled record" inline />
						<dl className="grid gap-4 sm:grid-cols-2">
							{[
								["Mark number", pkg.markNumber],
								["Consignment", pkg.consignment],
								["Container", pkg.container],
								["Consignee", pkg.consignee],
								["Kind", pkg.kind],
								["Quantity", pkg.quantity],
								["Weight", pkg.weight],
								["Dimensions", pkg.dimensions],
								["Position", pkg.position],
								["Description", pkg.description],
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
							<SectionHeader title="Marks & handling notes" detail="As received" inline />
							<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
								<p className="font-mono text-[12px] leading-6 text-ink">{pkg.marks}</p>
							</div>
							<p className="mt-3 text-[12px] leading-5 text-ink-soft">
								Marks are recorded at receiving and used to identify the package in
								storage and during examination coordination.
							</p>
						</section>

						<section className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
							<SectionHeader title="Package state" detail="Operational" inline dark />
							{[
								{ label: "Received", done: true },
								{ label: "Positioned", done: true },
								{ label: "Condition verified", done: true },
								{ label: "Reserved for examination", active: true },
								{ label: "Returned to storage", done: false },
								{ label: "Released for collection", done: false },
							].map((step) => (
								<div className="flex items-center gap-3" key={step.label}>
									<div
										className={
											"grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold " +
											(step.done
												? "bg-orange text-white"
												: step.active
												? "bg-orange text-white"
												: "bg-sand/10 text-sand/50 ring-1 ring-sand/20")
										}
									>
										{step.done ? <Check className="size-3.5" /> : "•"}
									</div>
									<span
										className={
											"py-1 text-[13px] " +
											(step.active
												? "font-semibold text-orange"
												: step.done
												? "text-sand"
												: "text-sand/45")
										}
									>
										{step.label}
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
						title="Package timeline"
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
										(index < timeline.length - 1
											? "border-orange bg-orange"
											: "border-orange bg-paper")
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

			{tab === "Handling" && (
				<section className="rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader
						title="Handling steps"
						detail={`${handling.length} recorded`}
					/>
					<ul className="divide-y divide-line">
						{handling.map((step, index) => (
							<li key={step.id} className="flex items-start gap-4 px-5 py-4">
								<div className="grid size-8 shrink-0 place-items-center rounded-md bg-orange/10 font-mono text-[10px] font-semibold text-orange-deep">
									{String(index + 1).padStart(2, "0")}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-ink">{step.step}</p>
									<p className="mt-0.5 text-[12px] text-ink-soft">{step.detail}</p>
								</div>
								<span className="font-mono text-[11px] text-ink-soft">{step.date}</span>
							</li>
						))}
					</ul>
					<div className="border-t border-line p-4">
						<div className="flex flex-wrap items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
							<ClipboardCheck className="size-4 text-orange" />
							<p className="text-[12px] text-ink-soft">
								Every handling step is timestamped and attributed to the responsible desk
								or officer.
							</p>
						</div>
					</div>
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
					to="/portal/containers/$id"
					params={{ id: pkg.containerId }}
					icon={Boxes}
					title="Container detail"
					detail={`Parent · ${pkg.container}`}
				/>
				<RelatedLink
					to="/portal/cargo/$id"
					params={{ id: pkg.consignment.split("-").pop() ?? "2481" }}
					icon={Package}
					title="Consignment detail"
					detail={pkg.consignment}
				/>
				<RelatedLink
					to="/portal/documents"
					icon={FileCheck2}
					title="Document center"
					detail="All files across this account"
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
			{...(params ? { params } : {})}
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