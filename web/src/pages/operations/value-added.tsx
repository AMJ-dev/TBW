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
	Flame,
	Layers,
	Package,
	Plus,
	Ruler,
	Scale,
	Search,
	Sparkles,
	Tag,
	User,
	Weight,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ServiceKind =
	| "Palletisation"
	| "Repackaging"
	| "Labelling"
	| "Sorting"
	| "Fumigation"
	| "Weighing";

type ServiceStatus =
	| "Scheduled"
	| "In progress"
	| "Awaiting verification"
	| "Completed"
	| "Cancelled";

interface ServiceOrder {
	id: string;
	reference: string;
	kind: ServiceKind;
	status: ServiceStatus;
	container: string;
	containerRef: string;
	consignment: string;
	cargoOwner: string;
	location: string;
	scheduledFor: string;
	startedAt: string;
	completedAt: string;
	assignedTo: string;
	quantity: string;
	beforeValue: string;
	afterValue: string;
	chargeRef: string;
	tariffLine: string;
	notes: string;
}

const kindMeta: Record<ServiceKind, { icon: typeof Package; label: string; detail: string }> = {
	Palletisation: {
		icon: Layers,
		label: "Palletisation",
		detail: "Consolidate loose cargo onto pallets for safe handling and storage.",
	},
	Repackaging: {
		icon: Package,
		label: "Repackaging",
		detail: "Replace damaged packaging, reseal, or consolidate into new cartons.",
	},
	Labelling: {
		icon: Tag,
		label: "Labelling",
		detail: "Apply marks, barcodes, warning labels, or customer-specific identifiers.",
	},
	Sorting: {
		icon: Sparkles,
		label: "Sorting",
		detail: "Segregate by consignee, SKU, destination, or handling requirements.",
	},
	Fumigation: {
		icon: Flame,
		label: "Fumigation coordination",
		detail: "Coordinate fumigation with the licensed operator and record the certificate.",
	},
	Weighing: {
		icon: Scale,
		label: "Weighing",
		detail: "Record gross or net weights on the terminal weighbridge.",
	},
};

const initialOrders: ServiceOrder[] = [
	{
		id: "sv-1",
		reference: "TRN-VAS-2026-00871",
		kind: "Palletisation",
		status: "In progress",
		container: "TRIU1234564",
		containerRef: "c-1",
		consignment: "TRN-IMP-002481",
		cargoOwner: "Atlantic Trade Nigeria Ltd",
		location: "Bond WH · Bay 2",
		scheduledFor: "24 Sep 2026 · 10:00",
		startedAt: "24 Sep 2026 · 10:12",
		completedAt: "—",
		assignedTo: "S. Eze · Yard officer",
		quantity: "48 cartons → 6 pallets",
		beforeValue: "Loose cartons",
		afterValue: "—",
		chargeRef: "CHG-PAL-2026-00871",
		tariffLine: "VAS-PAL-01",
		notes: "Consolidate loose cartons onto standard 120×100 pallets with stretch wrap.",
	},
	{
		id: "sv-2",
		reference: "TRN-VAS-2026-00872",
		kind: "Weighing",
		status: "Awaiting verification",
		container: "CMAU4829106",
		containerRef: "c-2",
		consignment: "TRN-IMP-002482",
		cargoOwner: "Kano Freight Forwarders",
		location: "Weighbridge A",
		scheduledFor: "23 Sep 2026 · 11:00",
		startedAt: "23 Sep 2026 · 11:05",
		completedAt: "23 Sep 2026 · 11:20",
		assignedTo: "K. Lawal · Warehouse officer",
		quantity: "2 pallets",
		beforeValue: "Declared 1,180 kg",
		afterValue: "Recorded 1,204 kg",
		chargeRef: "CHG-WGH-2026-00872",
		tariffLine: "VAS-WGH-02",
		notes: "Gross weight recorded on terminal weighbridge. Discrepancy of +24 kg to be verified.",
	},
	{
		id: "sv-3",
		reference: "TRN-VAS-2026-00873",
		kind: "Fumigation",
		status: "Scheduled",
		container: "MSCU9876540",
		containerRef: "c-3",
		consignment: "TRN-IMP-002483",
		cargoOwner: "Meridian Customs Services",
		location: "Quarantine Bay",
		scheduledFor: "25 Sep 2026 · 14:00",
		startedAt: "—",
		completedAt: "—",
		assignedTo: "Vendor: NAQS-certified operator",
		quantity: "1 container",
		beforeValue: "Pre-fumigation",
		afterValue: "—",
		chargeRef: "CHG-FUM-2026-00873",
		tariffLine: "VAS-FUM-03",
		notes: "Fumigation coordination with NAQS-certified operator. Certificate to be attached on completion.",
	},
	{
		id: "sv-4",
		reference: "TRN-VAS-2026-00869",
		kind: "Labelling",
		status: "Completed",
		container: "TEMU3849204",
		containerRef: "c-4",
		consignment: "TRN-IMP-002483",
		cargoOwner: "Meridian Customs Services",
		location: "Bond WH · Bay 3",
		scheduledFor: "22 Sep 2026 · 09:00",
		startedAt: "22 Sep 2026 · 09:05",
		completedAt: "22 Sep 2026 · 10:40",
		assignedTo: "M. Adeyemi · Documentation desk",
		quantity: "85 pallets",
		beforeValue: "Unlabelled",
		afterValue: "Labelled with customer marks",
		chargeRef: "CHG-LBL-2026-00869",
		tariffLine: "VAS-LBL-04",
		notes: "Customer-specific barcodes applied and verified against the packing list.",
	},
	{
		id: "sv-5",
		reference: "TRN-VAS-2026-00867",
		kind: "Sorting",
		status: "Completed",
		container: "OOLU2948108",
		containerRef: "c-5",
		consignment: "TRN-IMP-002485",
		cargoOwner: "Prime Haulage Ltd",
		location: "Bond WH · Bay 4",
		scheduledFor: "21 Sep 2026 · 13:00",
		startedAt: "21 Sep 2026 · 13:10",
		completedAt: "21 Sep 2026 · 15:30",
		assignedTo: "Warehouse team 01",
		quantity: "62 pallets",
		beforeValue: "Mixed consignee pallets",
		afterValue: "Segregated by consignee",
		chargeRef: "CHG-SRT-2026-00867",
		tariffLine: "VAS-SRT-05",
		notes: "Sorted by consignee into designated bays.",
	},
];

const statusFilters: (ServiceStatus | "all")[] = [
	"all",
	"Scheduled",
	"In progress",
	"Awaiting verification",
	"Completed",
	"Cancelled",
];

const kindFilters: (ServiceKind | "all")[] = [
	"all",
	"Palletisation",
	"Repackaging",
	"Labelling",
	"Sorting",
	"Fumigation",
	"Weighing",
];

export default function OperationsValueAddedRoute() {
	const [orders, setOrders] = useState<ServiceOrder[]>(initialOrders);
	const [query, setQuery] = useState("");
	const [kindFilter, setKindFilter] = useState<ServiceKind | "all">("all");
	const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
	const [selected, setSelected] = useState<ServiceOrder | null>(null);
	const [isNewOpen, setIsNewOpen] = useState(false);

	const filtered = useMemo(() => {
		return orders.filter((o) => {
			const matchQuery =
				o.reference.toLowerCase().includes(query.toLowerCase()) ||
				o.container.toLowerCase().includes(query.toLowerCase()) ||
				o.consignment.toLowerCase().includes(query.toLowerCase()) ||
				o.cargoOwner.toLowerCase().includes(query.toLowerCase());
			const matchKind = kindFilter === "all" || o.kind === kindFilter;
			const matchStatus = statusFilter === "all" || o.status === statusFilter;
			return matchQuery && matchKind && matchStatus;
		});
	}, [orders, query, kindFilter, statusFilter]);

	const stats = useMemo(() => {
		const total = orders.length;
		const inProgress = orders.filter((o) => o.status === "In progress").length;
		const awaiting = orders.filter((o) => o.status === "Awaiting verification").length;
		const completed = orders.filter((o) => o.status === "Completed").length;
		return { total, inProgress, awaiting, completed };
	}, [orders]);

	const handleCreate = (next: ServiceOrder) => {
		setOrders((prev) => [next, ...prev]);
		setIsNewOpen(false);
		toast.success("Service order created locally.");
	};

	const handleStart = (id: string) => {
		setOrders((prev) =>
			prev.map((o) =>
				o.id === id
					? {
							...o,
							status: "In progress" as ServiceStatus,
							startedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: o
			)
		);
		toast.success("Service order started.");
		setSelected(null);
	};

	const handleVerify = (id: string) => {
		setOrders((prev) =>
			prev.map((o) =>
				o.id === id
					? {
							...o,
							status: "Completed" as ServiceStatus,
							completedAt: new Date().toLocaleString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: o
			)
		);
		toast.success("Verification complete. Service order closed.");
		setSelected(null);
	};

	return (
		<AppShell title="Value-added services" eyebrow="Operations · Cargo services">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Value-added
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Value-added services
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Palletisation, repackaging, labelling, sorting, fumigation coordination, and
						weighing. Every service order records its handling time and links to a
						chargeable tariff line.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Service order history exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export history
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsNewOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> New service order
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total service orders"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={ClipboardCheck}
				/>
				<Metric
					label="In progress"
					value={String(stats.inProgress)}
					detail="Currently on the floor"
					tone="info"
					icon={Sparkles}
				/>
				<Metric
					label="Awaiting verification"
					value={String(stats.awaiting)}
					detail="Supervisor review pending"
					tone={stats.awaiting > 0 ? "warning" : "success"}
					icon={User}
				/>
				<Metric
					label="Completed"
					value={String(stats.completed)}
					detail="Closed and billed"
					tone="success"
					icon={Check}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by reference, container, consignment, or cargo owner..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{kindFilters.map((k) => (
							<button
								key={k}
								type="button"
								onClick={() => setKindFilter(k)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									kindFilter === k
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{k === "all" ? "All services" : k}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 border-b border-line bg-sand/20 px-4 py-2">
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
							{s === "all" ? "All statuses" : s}
						</button>
					))}
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Sparkles className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No service orders match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different service, reference, or status.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-line">
						{filtered.map((o) => {
							const meta = kindMeta[o.kind];
							const Icon = meta.icon;
							return (
								<li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
									<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
										<Icon className="size-5" />
									</div>

									<div className="min-w-[220px] flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-mono text-[12px] font-semibold text-ink">
												{o.reference}
											</p>
											<StatusBadge label={o.status} tone={statusTone(o.status)} />
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
												{o.kind}
											</span>
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
												{o.tariffLine}
											</span>
										</div>
										<p className="mt-1 text-[12px] text-ink-soft">
											<span className="font-semibold text-ink">{o.container}</span> ·{" "}
											{o.consignment} · {o.cargoOwner}
										</p>
										<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											{o.location} · {o.quantity}
										</p>
									</div>

									<div className="min-w-[180px]">
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Assigned
										</p>
										<p className="mt-1 text-[12px] text-ink">{o.assignedTo}</p>
										<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
											Scheduled {o.scheduledFor}
										</p>
									</div>

									<div className="min-w-[160px]">
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Before → After
										</p>
										<p className="mt-1 text-[11px] text-ink-soft">{o.beforeValue}</p>
										<p className="mt-0.5 text-[11px] text-ink">{o.afterValue}</p>
									</div>

									<div className="ml-auto flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelected(o)}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											View <ArrowRight className="ml-1 size-3.5" />
										</Button>
									</div>
								</li>
							);
						})}
					</ul>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {orders.length} service orders
					</span>
					<span>Every service creates a charge line on the cargo record</span>
				</div>
			</section>

			{selected && (
				<ServiceOrderDialog
					order={selected}
					onClose={() => setSelected(null)}
					onStart={() => handleStart(selected.id)}
					onVerify={() => handleVerify(selected.id)}
				/>
			)}

			{isNewOpen && (
				<NewServiceOrderModal
					onClose={() => setIsNewOpen(false)}
					onSubmit={handleCreate}
					existingReferences={orders.map((o) => o.reference)}
				/>
			)}
		</AppShell>
	);
}

function ServiceOrderDialog({
	order,
	onClose,
	onStart,
	onVerify,
}: {
	order: ServiceOrder;
	onClose: () => void;
	onStart: () => void;
	onVerify: () => void;
}) {
	const meta = kindMeta[order.kind];
	const Icon = meta.icon;
	const canStart = order.status === "Scheduled";
	const canVerify = order.status === "Awaiting verification";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div className="flex items-start gap-3">
						<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
							<Icon className="size-5" />
						</div>
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								{meta.label} service
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								{order.reference}
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								{order.container} · {order.consignment} · {order.cargoOwner}
							</p>
						</div>
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
						<StatusBadge label={order.status} tone={statusTone(order.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{order.kind}
						</span>
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							Tariff line {order.tariffLine}
						</span>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{meta.detail}</p>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Assigned to
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">{order.assignedTo}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Started
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{order.startedAt}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Completed
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{order.completedAt}</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Location
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">{order.location}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Quantity
							</p>
							<p className="mt-1 text-[12px] font-medium text-ink">{order.quantity}</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Scheduled for
							</p>
							<p className="mt-1 font-mono text-[11px] text-ink">{order.scheduledFor}</p>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								Before
							</p>
							<p className="mt-1 text-[13px] font-semibold text-ink">
								{order.beforeValue}
							</p>
						</div>
						<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
							<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								After
							</p>
							<p className="mt-1 text-[13px] font-semibold text-ink">{order.afterValue}</p>
						</div>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{order.notes}</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-start gap-3">
							<Ruler className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">Charge line</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									This service links to charge reference{" "}
									<span className="font-mono text-ink">{order.chargeRef}</span> under
									tariff line{" "}
									<span className="font-mono text-ink">{order.tariffLine}</span>. The
									charge appears on the cargo record and the invoice ledger.
								</p>
							</div>
						</div>
					</div>

					{order.status === "Awaiting verification" && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Supervisor verification required
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This service includes a variance to be verified. Verifying
										confirms the after-value and closes the service order.
									</p>
								</div>
							</div>
						</div>
					)}

					{order.status === "Completed" && (
						<div className="rounded-xl bg-teal/5 p-4 ring-1 ring-teal/20">
							<div className="flex items-start gap-3">
								<Check className="mt-0.5 size-4 shrink-0 text-teal-deep" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Service order completed
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Closed on {order.completedAt}. The charge line has been posted to
										the cargo record.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						<Link
							to="/portal/containers/$id"
							params={{ id: order.containerRef }}
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								<Container className="mr-1.5 size-4" /> Open container
							</Button>
						</Link>
						{canStart && (
							<Button
								onClick={onStart}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Sparkles className="mr-1.5 size-4" /> Start service
							</Button>
						)}
						{canVerify && (
							<Button
								onClick={onVerify}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Verify & complete
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function NewServiceOrderModal({
	onClose,
	onSubmit,
	existingReferences,
}: {
	onClose: () => void;
	onSubmit: (o: ServiceOrder) => void;
	existingReferences: string[];
}) {
	const [kind, setKind] = useState<ServiceKind>("Palletisation");
	const [container, setContainer] = useState("");
	const [containerRef, setContainerRef] = useState("");
	const [consignment, setConsignment] = useState("");
	const [cargoOwner, setCargoOwner] = useState("");
	const [location, setLocation] = useState("");
	const [scheduledFor, setScheduledFor] = useState("");
	const [assignedTo, setAssignedTo] = useState("");
	const [quantity, setQuantity] = useState("");
	const [beforeValue, setBeforeValue] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!container.trim() || !consignment.trim() || !assignedTo.trim()) {
			toast.error("Container, consignment, and assigned officer are required.");
			return;
		}

		const nextNumber = String(
			Math.max(
				...existingReferences
					.map((r) => parseInt(r.split("-").pop() ?? "0", 10))
					.filter((n) => !isNaN(n)),
				0
			) + 1
		).padStart(5, "0");

		const tariffMap: Record<ServiceKind, string> = {
			Palletisation: "VAS-PAL-01",
			Repackaging: "VAS-RPK-02",
			Labelling: "VAS-LBL-04",
			Sorting: "VAS-SRT-05",
			Fumigation: "VAS-FUM-03",
			Weighing: "VAS-WGH-02",
		};

		onSubmit({
			id: `sv-${Date.now()}`,
			reference: `TRN-VAS-2026-${nextNumber}`,
			kind,
			status: "Scheduled",
			container,
			containerRef: containerRef || "c-1",
			consignment,
			cargoOwner: cargoOwner || "—",
			location: location || (kind === "Weighing" ? "Weighbridge A" : "Bond WH · Bay 2"),
			scheduledFor: scheduledFor || "Awaiting scheduling",
			startedAt: "—",
			completedAt: "—",
			assignedTo,
			quantity: quantity || "—",
			beforeValue: beforeValue || "—",
			afterValue: "—",
			chargeRef: `CHG-${kind.slice(0, 3).toUpperCase()}-2026-${nextNumber}`,
			tariffLine: tariffMap[kind],
			notes: notes || `${kind} service requested from the operations console.`,
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
								New service order
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Request a value-added service
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Select a service, assign the work, and record before/after values.
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
								Service
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{(Object.keys(kindMeta) as ServiceKind[]).map((k) => {
									const meta = kindMeta[k];
									const Icon = meta.icon;
									const active = kind === k;
									return (
										<button
											key={k}
											type="button"
											onClick={() => setKind(k)}
											className={cn(
												"flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
												active
													? "border-orange bg-orange/5 ring-1 ring-orange/30"
													: "border-line bg-sand hover:bg-sand-2"
											)}
										>
											<span
												className={cn(
													"grid size-9 shrink-0 place-items-center rounded-md",
													active
														? "bg-orange text-white"
														: "bg-orange/10 text-orange-deep"
												)}
											>
												<Icon className="size-4" />
											</span>
											<span className="min-w-0">
												<span className="block text-[13px] font-semibold text-ink">
													{meta.label}
												</span>
												<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
													{meta.detail}
												</span>
											</span>
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
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Consignment"
								placeholder="TRN-IMP-002481"
								value={consignment}
								onChange={setConsignment}
								mono
								required
							/>
							<Field
								label="Cargo owner"
								placeholder="Atlantic Trade Nigeria Ltd"
								value={cargoOwner}
								onChange={setCargoOwner}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Location"
								placeholder={kind === "Weighing" ? "Weighbridge A" : "Bond WH · Bay 2"}
								value={location}
								onChange={setLocation}
							/>
							<Field
								label="Scheduled for"
								placeholder="24 Sep 2026 · 10:00"
								value={scheduledFor}
								onChange={setScheduledFor}
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Assigned to"
								placeholder="S. Eze · Yard officer"
								value={assignedTo}
								onChange={setAssignedTo}
								required
							/>
							<Field
								label="Quantity"
								placeholder={
									kind === "Palletisation"
										? "48 cartons → 6 pallets"
										: kind === "Weighing"
										? "2 pallets"
										: "85 pallets"
								}
								value={quantity}
								onChange={setQuantity}
							/>
						</div>

						<Field
							label="Before value (optional)"
							placeholder={
								kind === "Weighing"
									? "Declared 1,180 kg"
									: kind === "Labelling"
									? "Unlabelled"
									: "Loose cartons"
							}
							value={beforeValue}
							onChange={setBeforeValue}
						/>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Special handling notes, sequence, or other context."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										What happens on completion
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										The service records before/after values, the handling time, and a
										link to the charge line on the cargo record. Any variance
										requires supervisor verification.
									</p>
								</div>
							</div>
						</div>
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
							Create service order <ArrowRight />
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