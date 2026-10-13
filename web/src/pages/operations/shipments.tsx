import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowDownUp,
	ArrowUpRight,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Container,
	FileCheck2,
	Filter,
	MapPin,
	Package,
	Search,
	ShieldAlert,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { AppShell, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShipmentStatus =
	| "Submitted"
	| "Documentation Review"
	| "Awaiting Arrival"
	| "Received"
	| "On Hold"
	| "Stored"
	| "Release Review"
	| "Completed";

type ShipmentPriority = "Normal" | "High" | "Urgent";

type Shipment = {
	id: string;
	reference: string;
	organisation: string;
	cargo: string;
	container: string;
	submitted: string;
	expectedArrival: string;
	status: ShipmentStatus;
	priority: ShipmentPriority;
	documents: string;
	assignedTo: string;
	location: string;
	notes: string;
};

type StatusFilter = "All statuses" | ShipmentStatus;
type PriorityFilter = "All priorities" | ShipmentPriority;

const initialShipments: Shipment[] = [
	{
		id: "1",
		reference: "TRN-SHP-2026-0148",
		organisation: "Atlantic Trade PLC",
		cargo: "Consumer electronics",
		container: "MSCU 482193-6",
		submitted: "13 Oct 2026",
		expectedArrival: "15 Oct 2026",
		status: "Documentation Review",
		priority: "Urgent",
		documents: "4 of 5",
		assignedTo: "Unassigned",
		location: "Not received",
		notes: "Commercial invoice is missing. Confirm supporting documents before approving the shipment.",
	},
	{
		id: "2",
		reference: "TRN-SHP-2026-0147",
		organisation: "Northstar Imports Ltd",
		cargo: "Packaged food products",
		container: "CMAU 710294-2",
		submitted: "13 Oct 2026",
		expectedArrival: "14 Oct 2026",
		status: "Submitted",
		priority: "High",
		documents: "3 of 3",
		assignedTo: "Unassigned",
		location: "Not received",
		notes: "New shipment submitted and awaiting initial validation.",
	},
	{
		id: "3",
		reference: "TRN-SHP-2026-0146",
		organisation: "Meridian Industrial Co.",
		cargo: "Industrial machinery",
		container: "TGHU 839120-1",
		submitted: "12 Oct 2026",
		expectedArrival: "14 Oct 2026",
		status: "Awaiting Arrival",
		priority: "Normal",
		documents: "5 of 5",
		assignedTo: "A. Okafor",
		location: "Expected at gate",
		notes: "Documentation checks are complete. Awaiting physical arrival at the terminal.",
	},
	{
		id: "4",
		reference: "TRN-SHP-2026-0145",
		organisation: "Bluewave Logistics",
		cargo: "Textile materials",
		container: "FCIU 230491-8",
		submitted: "12 Oct 2026",
		expectedArrival: "13 Oct 2026",
		status: "Received",
		priority: "High",
		documents: "5 of 5",
		assignedTo: "M. Bello",
		location: "Receiving bay 02",
		notes: "Cargo received. Yard allocation and quantity confirmation are pending.",
	},
	{
		id: "5",
		reference: "TRN-SHP-2026-0144",
		organisation: "Atlantic Trade PLC",
		cargo: "Vehicle spare parts",
		container: "TEMU 612930-4",
		submitted: "11 Oct 2026",
		expectedArrival: "12 Oct 2026",
		status: "On Hold",
		priority: "Urgent",
		documents: "4 of 4",
		assignedTo: "K. Ibrahim",
		location: "Inspection area",
		notes: "A discrepancy was recorded during receiving. Hold remains in place pending officer review.",
	},
	{
		id: "6",
		reference: "TRN-SHP-2026-0143",
		organisation: "Greenfield Commodities",
		cargo: "Agricultural equipment",
		container: "OOLU 521037-9",
		submitted: "10 Oct 2026",
		expectedArrival: "11 Oct 2026",
		status: "Stored",
		priority: "Normal",
		documents: "6 of 6",
		assignedTo: "S. Musa",
		location: "Yard B · Bay 14",
		notes: "Cargo is in storage. Confirm any applicable charges and outstanding compliance checks.",
	},
	{
		id: "7",
		reference: "TRN-SHP-2026-0142",
		organisation: "Northstar Imports Ltd",
		cargo: "Household goods",
		container: "TRHU 194820-3",
		submitted: "09 Oct 2026",
		expectedArrival: "10 Oct 2026",
		status: "Release Review",
		priority: "High",
		documents: "5 of 5",
		assignedTo: "A. Okafor",
		location: "Warehouse 01",
		notes: "Release checklist is in progress. Verify holds, documents and financial clearance.",
	},
	{
		id: "8",
		reference: "TRN-SHP-2026-0141",
		organisation: "Meridian Industrial Co.",
		cargo: "Electrical components",
		container: "CAIU 920145-7",
		submitted: "08 Oct 2026",
		expectedArrival: "09 Oct 2026",
		status: "Completed",
		priority: "Normal",
		documents: "5 of 5",
		assignedTo: "M. Bello",
		location: "Gate-out recorded",
		notes: "Shipment has exited the terminal. Records are retained for audit and reporting.",
	},
];

const STATUS_OPTIONS: StatusFilter[] = [
	"All statuses",
	"Submitted",
	"Documentation Review",
	"Awaiting Arrival",
	"Received",
	"On Hold",
	"Stored",
	"Release Review",
	"Completed",
];

const PRIORITY_OPTIONS: PriorityFilter[] = [
	"All priorities",
	"Urgent",
	"High",
	"Normal",
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type PageToken = number | "gap";

const buildPageTokens = (current: number, total: number): PageToken[] => {
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}
	const tokens: PageToken[] = [];
	const push = (value: PageToken) => {
		if (tokens[tokens.length - 1] !== value) tokens.push(value);
	};
	push(1);
	const left = Math.max(2, current - 1);
	const right = Math.min(total - 1, current + 1);
	if (left > 2) push("gap");
	for (let i = left; i <= right; i += 1) push(i);
	if (right < total - 1) push("gap");
	push(total);
	return tokens;
};

const statusStyles: Record<ShipmentStatus, string> = {
	Submitted: "bg-sand-2 text-ink ring-line",
	"Documentation Review": "bg-orange/10 text-orange-deep ring-orange/25",
	"Awaiting Arrival": "bg-slate/10 text-slate-deep ring-slate/25",
	Received: "bg-carmine/10 text-carmine ring-carmine/25",
	"On Hold": "bg-coral/10 text-coral ring-coral/25",
	Stored: "bg-teal/10 text-teal-deep ring-teal/25",
	"Release Review": "bg-orange/10 text-orange-deep ring-orange/25",
	Completed: "bg-teal/10 text-teal-deep ring-teal/25",
};

const statusFallback = "bg-sand text-ink-soft ring-line";

const priorityStyles: Record<ShipmentPriority, string> = {
	Normal: "text-ink-soft",
	High: "text-orange-deep",
	Urgent: "text-coral",
};

const priorityDot: Record<ShipmentPriority, string> = {
	Normal: "bg-ink-soft/50",
	High: "bg-orange",
	Urgent: "bg-coral",
};

function StatusPill({ status }: { status: ShipmentStatus }) {
	return (
		<span
			className={cn(
				"inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ring-1 ring-inset",
				statusStyles[status] ?? statusFallback
			)}
		>
			{status}
		</span>
	);
}

function PriorityLabel({ priority }: { priority: ShipmentPriority }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em]",
				priorityStyles[priority]
			)}
		>
			<span
				className={cn(
					"size-1.5 rounded-full",
					priorityDot[priority]
				)}
			/>
			{priority}
		</span>
	);
}

export default function OperationsShipmentsPage() {
	const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] =
		useState<StatusFilter>("All statuses");
	const [priorityFilter, setPriorityFilter] =
		useState<PriorityFilter>("All priorities");
	const [selected, setSelected] = useState<Shipment | null>(null);
	const [activeTab, setActiveTab] = useState("All shipments");
	const [sortNewest, setSortNewest] = useState(true);
	const [actionNote, setActionNote] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);

	const filteredShipments = useMemo(() => {
		const q = query.trim().toLowerCase();
		const result = shipments.filter((shipment) => {
			const matchesQuery =
				!q ||
				[
					shipment.reference,
					shipment.organisation,
					shipment.cargo,
					shipment.container,
				].some((value) => value.toLowerCase().includes(q));

			const matchesStatus =
				statusFilter === "All statuses" ||
				shipment.status === statusFilter;

			const matchesPriority =
				priorityFilter === "All priorities" ||
				shipment.priority === priorityFilter;

			const matchesTab =
				activeTab === "All shipments" ||
				(activeTab === "Needs action" &&
					(
						[
							"Submitted",
							"Documentation Review",
							"Received",
							"On Hold",
							"Release Review",
						] as ShipmentStatus[]
					).includes(shipment.status)) ||
				(activeTab === "In progress" &&
					(
						[
							"Awaiting Arrival",
							"Received",
							"Stored",
							"Release Review",
						] as ShipmentStatus[]
					).includes(shipment.status)) ||
				(activeTab === "On hold" && shipment.status === "On Hold");

			return (
				matchesQuery &&
				matchesStatus &&
				matchesPriority &&
				matchesTab
			);
		});

		return result.sort((a, b) =>
			sortNewest
				? b.id.localeCompare(a.id, undefined, { numeric: true })
				: a.id.localeCompare(b.id, undefined, { numeric: true })
		);
	}, [
		shipments,
		query,
		statusFilter,
		priorityFilter,
		activeTab,
		sortNewest,
	]);

	const totalPages = Math.max(
		1,
		Math.ceil(filteredShipments.length / pageSize)
	);
	const currentPage = Math.min(page, totalPages);
	const pageStart = (currentPage - 1) * pageSize;
	const pageEnd = Math.min(pageStart + pageSize, filteredShipments.length);
	const paginated = filteredShipments.slice(pageStart, pageEnd);
	const pageTokens = useMemo(
		() => buildPageTokens(currentPage, totalPages),
		[currentPage, totalPages]
	);

	const count = (predicate: (shipment: Shipment) => boolean) =>
		shipments.filter(predicate).length;

	const needsAction = count((s) =>
		(
			[
				"Submitted",
				"Documentation Review",
				"Received",
				"On Hold",
				"Release Review",
			] as ShipmentStatus[]
		).includes(s.status)
	);

	const openShipment = (shipment: Shipment) => {
		setSelected(shipment);
		setActionNote("");
	};

	const updateStatus = (status: ShipmentStatus, message: string) => {
		if (!selected) return;
		const updated: Shipment = {
			...selected,
			status,
			notes: message || selected.notes,
		};
		setShipments((current) =>
			current.map((shipment) =>
				shipment.id === selected.id ? updated : shipment
			)
		);
		setSelected(updated);
		setActionNote("");
	};

	const assignToMe = () => {
		if (!selected) return;
		const updated: Shipment = {
			...selected,
			assignedTo: "Current operator",
		};
		setShipments((current) =>
			current.map((shipment) =>
				shipment.id === selected.id ? updated : shipment
			)
		);
		setSelected(updated);
	};

	return (
		<AppShell title="Shipments" eyebrow="Operations · Shipment register">
			<div className="space-y-5 pb-8">
				<motion.section
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-6"
				>
					<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
						<div className="min-w-0">
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
								<Package className="size-3.5 text-primary" />
								Terminal operations · All shipments
							</div>
							<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								Review and action,{" "}
								<span className="text-primary">
									every declaration.
								</span>
							</h1>
							<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
								Submissions from every organisation on the platform.
								Resolve exceptions and move cargo through the terminal
								workflow.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								className="gap-2"
								onClick={() => {
									setQuery("");
									setStatusFilter("All statuses");
									setPriorityFilter("All priorities");
									setActiveTab("All shipments");
									setPage(1);
								}}
							>
								Reset filters
							</Button>
						</div>
					</div>
				</motion.section>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Total shipments"
						value={String(shipments.length)}
						detail="Across all organisations"
						tone="info"
						icon={Package}
					/>
					<Metric
						label="Needs action"
						value={String(needsAction)}
						detail="Review or decision required"
						tone="warning"
						icon={FileCheck2}
					/>
					<Metric
						label="On hold"
						value={String(count((s) => s.status === "On Hold"))}
						detail="Exception needs resolution"
						tone="critical"
						icon={ShieldAlert}
					/>
					<Metric
						label="Completed"
						value={String(count((s) => s.status === "Completed"))}
						detail="Gate-out recorded"
						tone="success"
						icon={CheckCircle2}
					/>
				</section>

				<section className="overflow-hidden rounded-2xl border bg-card">
					<div className="border-b border-line px-4 pt-4 sm:px-5">
						<div className="flex flex-wrap gap-1">
							{["All shipments", "Needs action", "In progress", "On hold"].map(
								(tab) => (
									<button
										key={tab}
										onClick={() => {
											setActiveTab(tab);
											setPage(1);
										}}
										className={cn(
											"border-b-2 px-3 py-3 text-sm font-medium transition-colors",
											activeTab === tab
												? "border-ink text-ink"
												: "border-transparent text-ink-soft hover:text-ink"
										)}
									>
										{tab}
										{tab === "Needs action" && (
											<span className="ml-2 rounded-full bg-orange/10 px-1.5 py-0.5 font-mono text-[10px] text-orange-deep">
												{needsAction}
											</span>
										)}
									</button>
								)
							)}
						</div>
					</div>

					<div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:px-5">
						<div className="relative min-w-0 flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							<Input
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setPage(1);
								}}
								placeholder="Search reference, organisation, cargo or container…"
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>
						<div className="flex flex-wrap gap-2">
							<div className="relative">
								<Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
								<select
									value={statusFilter}
									onChange={(e) => {
										setStatusFilter(e.target.value as StatusFilter);
										setPage(1);
									}}
									className="h-10 rounded-md border border-line bg-sand pl-9 pr-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
								>
									{STATUS_OPTIONS.map((status) => (
										<option key={status}>{status}</option>
									))}
								</select>
							</div>
							<select
								value={priorityFilter}
								onChange={(e) => {
									setPriorityFilter(
										e.target.value as PriorityFilter
									);
									setPage(1);
								}}
								className="h-10 rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
							>
								{PRIORITY_OPTIONS.map((priority) => (
									<option key={priority}>{priority}</option>
								))}
							</select>
							<Button
								variant="outline"
								className="h-10 gap-2 border-line bg-paper text-ink hover:bg-sand"
								onClick={() => setSortNewest((v) => !v)}
							>
								<ArrowDownUp className="size-4" />
								{sortNewest ? "Newest first" : "Oldest first"}
							</Button>
						</div>
					</div>

					{filteredShipments.length === 0 ? (
						<div className="flex flex-col items-center px-5 py-16 text-center">
							<div className="rounded-xl border bg-muted/50 p-3">
								<SlidersHorizontal className="size-6 text-muted-foreground" />
							</div>
							<h3 className="mt-3 font-semibold">
								No shipments match these filters
							</h3>
							<p className="mt-1 max-w-sm text-sm text-muted-foreground">
								Try changing your search or filter selection.
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full min-w-[1050px] border-collapse text-left">
									<thead className="border-b border-line bg-sand/40">
										<tr>
											<th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Shipment / cargo
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Organisation
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Status
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Priority
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Documents
											</th>
											<th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Submitted
											</th>
											<th className="px-4 py-3 text-right font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
												Action
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{paginated.map((shipment, index) => (
											<motion.tr
												key={shipment.id}
												initial={{ opacity: 0, y: 4 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													delay: Math.min(index * 0.015, 0.15),
												}}
												className="group transition-colors hover:bg-sand/50"
											>
												<td className="px-5 py-4">
													<div className="font-mono text-[12px] font-semibold text-ink transition-colors group-hover:text-orange-deep">
														{shipment.reference}
													</div>
													<div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
														<Container className="size-3.5" />
														{shipment.container}
													</div>
													<div className="mt-1 text-[12px] text-ink-soft">
														{shipment.cargo}
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-start gap-2">
														<Building2 className="mt-0.5 size-4 shrink-0 text-ink-soft" />
														<span className="max-w-[180px] truncate text-[12px] font-medium text-ink">
															{shipment.organisation}
														</span>
													</div>
												</td>
												<td className="px-4 py-4">
													<StatusPill status={shipment.status} />
												</td>
												<td className="px-4 py-4">
													<PriorityLabel priority={shipment.priority} />
												</td>
												<td className="px-4 py-4">
													<div className="flex items-center gap-2 text-[12px] text-ink">
														<FileCheck2 className="size-4 text-ink-soft" />
														{shipment.documents}
													</div>
													<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
														documents complete
													</div>
												</td>
												<td className="px-4 py-4">
													<div className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
														<CalendarDays className="size-3.5" />
														{shipment.submitted}
													</div>
												</td>
												<td className="px-4 py-4 text-right">
													<Button
														size="sm"
														onClick={() => openShipment(shipment)}
														className="gap-2 bg-ink text-sand hover:bg-ink/90"
													>
														Review
														<ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
													</Button>
												</td>
											</motion.tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="flex flex-col gap-3 border-t border-line bg-sand/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
									<span>
										Showing{" "}
										{filteredShipments.length === 0 ? 0 : pageStart + 1}–
										{pageEnd} of {filteredShipments.length} shipment
										{filteredShipments.length === 1 ? "" : "s"}
									</span>
									<label className="inline-flex items-center gap-2">
										<span className="font-mono text-[10px] uppercase tracking-[0.1em]">
											Rows
										</span>
										<select
											value={String(pageSize)}
											onChange={(event) => {
												setPageSize(Number(event.target.value));
												setPage(1);
											}}
											className="h-8 rounded-md border border-line bg-paper px-2 text-xs text-ink"
											aria-label="Rows per page"
										>
											{PAGE_SIZE_OPTIONS.map((size) => (
												<option key={size} value={size}>
													{size}
												</option>
											))}
										</select>
									</label>
								</div>

								<div className="flex flex-wrap items-center gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((current) => Math.max(1, current - 1))
										}
										disabled={currentPage <= 1}
										className="h-8 gap-1 border-line bg-paper px-2 text-xs text-ink hover:bg-sand"
										aria-label="Previous page"
									>
										<ChevronLeft className="size-3.5" />
										Prev
									</Button>

									{pageTokens.map((token, idx) => {
										if (token === "gap") {
											return (
												<span
													key={`gap-${idx}`}
													className="px-1 text-xs text-ink-soft"
												>
													…
												</span>
											);
										}
										const isActive = token === currentPage;
										return (
											<Button
												key={token}
												variant="ghost"
												size="sm"
												onClick={() => setPage(token)}
												className={cn(
													"h-8 w-8 p-0 text-xs",
													isActive
														? "bg-ink text-sand hover:bg-ink/90"
														: "text-ink-soft hover:text-ink"
												)}
												aria-current={
													isActive ? "page" : undefined
												}
											>
												{token}
											</Button>
										);
									})}

									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((current) =>
												Math.min(totalPages, current + 1)
											)
										}
										disabled={currentPage >= totalPages}
										className="h-8 gap-1 border-line bg-paper px-2 text-xs text-ink hover:bg-sand"
										aria-label="Next page"
									>
										Next
										<ChevronRight className="size-3.5" />
									</Button>
								</div>
							</div>
						</>
					)}
				</section>
			</div>

			{selected && (
				<div
					className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-[2px]"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) setSelected(null);
					}}
				>
					<aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-paper shadow-2xl">
						<div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-paper px-5 py-4 sm:px-6">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
									Shipment review
								</p>
								<h2 className="mt-1 font-mono text-lg font-semibold text-ink">
									{selected.reference}
								</h2>
								<div className="mt-2">
									<StatusPill status={selected.status} />
								</div>
							</div>
							<button
								onClick={() => setSelected(null)}
								className="rounded-lg p-2 text-ink-soft hover:bg-sand hover:text-ink"
								aria-label="Close shipment details"
							>
								<X className="size-5" />
							</button>
						</div>

						<div className="flex-1 space-y-5 p-5 sm:p-6">
							<div className="rounded-xl border border-line bg-sand p-4">
								<div className="flex items-start gap-3">
									<Building2 className="mt-0.5 size-5 text-ink-soft" />
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Submitting organisation
										</p>
										<p className="mt-1 text-sm font-semibold text-ink">
											{selected.organisation}
										</p>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-2 gap-4">
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Cargo type
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.cargo}
										</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Container
										</p>
										<p className="mt-1 font-mono text-sm font-medium text-ink">
											{selected.container}
										</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Submitted
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.submitted}
										</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Expected arrival
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.expectedArrival}
										</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Documents
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.documents}
										</p>
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Assigned officer
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.assignedTo}
										</p>
									</div>
								</div>
								<div className="mt-4 flex items-start gap-2 border-t border-line pt-4">
									<MapPin className="mt-0.5 size-4 text-ink-soft" />
									<div>
										<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
											Current location
										</p>
										<p className="mt-1 text-sm font-medium text-ink">
											{selected.location}
										</p>
									</div>
								</div>
							</div>

							<div>
								<div className="mb-2 flex items-center gap-2">
									<AlertTriangle className="size-4 text-orange-deep" />
									<h3 className="font-display text-sm font-bold text-ink">
										Officer notes
									</h3>
								</div>
								<p className="rounded-lg border border-orange/25 bg-orange/5 p-3 text-[12px] leading-6 text-ink">
									{selected.notes}
								</p>
							</div>

							<div>
								<h3 className="mb-2 font-display text-sm font-bold text-ink">
									Actions
								</h3>
								<p className="mb-3 text-[11px] leading-5 text-ink-soft">
									These controls demonstrate the intended workflow.
									Changes are local to this page and are not saved to a
									server.
								</p>

								<Button
									variant="outline"
									className="w-full justify-start gap-2 border-line bg-paper text-ink hover:bg-sand"
									onClick={assignToMe}
								>
									<FileCheck2 className="size-4" />
									Assign to me
								</Button>

								<label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
									Internal note (optional)
								</label>
								<textarea
									value={actionNote}
									onChange={(e) => setActionNote(e.target.value)}
									rows={3}
									placeholder="Add a review note or explain the next action…"
									className="mt-1.5 w-full rounded-lg border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
								/>

								<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
									{selected.status !== "On Hold" &&
										selected.status !== "Completed" && (
											<Button
												variant="outline"
												className="justify-start gap-2 border-coral/30 bg-paper text-coral hover:bg-coral/10"
												onClick={() =>
													updateStatus(
														"On Hold",
														actionNote ||
															"Shipment placed on hold for further review."
													)
												}
											>
												<ShieldAlert className="size-4" />
												Place on hold
											</Button>
										)}
									{selected.status === "Submitted" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Documentation Review",
													actionNote ||
														"Documentation review started."
												)
											}
										>
											<FileCheck2 className="size-4" />
											Start document review
										</Button>
									)}
									{selected.status === "Documentation Review" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Awaiting Arrival",
													actionNote ||
														"Documentation approved; awaiting physical arrival."
												)
											}
										>
											<CheckCircle2 className="size-4" />
											Approve documents
										</Button>
									)}
									{selected.status === "Received" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Stored",
													actionNote ||
														"Cargo received and storage location confirmed."
												)
											}
										>
											<Package className="size-4" />
											Confirm storage
										</Button>
									)}
									{selected.status === "Stored" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Release Review",
													actionNote ||
														"Shipment sent for release review."
												)
											}
										>
											<FileCheck2 className="size-4" />
											Start release review
										</Button>
									)}
									{selected.status === "Release Review" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Completed",
													actionNote ||
														"Demo: shipment marked completed."
												)
											}
										>
											<CheckCircle2 className="size-4" />
											Mark completed
										</Button>
									)}
									{selected.status === "On Hold" && (
										<Button
											className="justify-start gap-2 bg-orange text-white hover:bg-orange-deep"
											onClick={() =>
												updateStatus(
													"Documentation Review",
													actionNote ||
														"Hold lifted; shipment returned for review."
												)
											}
										>
											<CheckCircle2 className="size-4" />
											Lift hold and review
										</Button>
									)}
								</div>
							</div>
						</div>

						<div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-paper px-5 py-4 sm:px-6">
							<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
								<Clock3 className="mr-1 inline size-3.5" />
								Demo workflow
							</span>
							<Button
								variant="outline"
								onClick={() => setSelected(null)}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Close review
							</Button>
						</div>
					</aside>
				</div>
			)}
		</AppShell>
	);
}