import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Download,
	Filter,
	Loader2,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	ShieldCheck,
	Trash2,
	Truck,
	User,
	UserCheck,
	X,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type DriverStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents"
	| "Rejected"
	| "Inactive";

interface AssignedVehicle {
	id: string;
	plate: string;
	kind: string;
	make: string;
	model: string;
	year: string;
	capacity: string;
	transporter: string;
	status: string;
}

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceClass: string;
	licenceExpiry: string;
	transporter: string;
	status: DriverStatus;
	lastVisit: string;
	notes: string;
	vehicles: AssignedVehicle[];
}

const statusFilters: (DriverStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
	"Rejected",
	"Inactive",
];

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const textareaClass =
	"mt-2 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

type View = "list" | "detail";

const extractList = <T,>(payload: any): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	if (Array.isArray(payload?.results)) return payload.results as T[];
	if (Array.isArray(payload?.data)) return payload.data as T[];
	return [];
};

const normalizeStatus = (raw: unknown): DriverStatus => {
	const s = String(raw ?? "").trim().toLowerCase();
	switch (s) {
		case "approved":
			return "Approved";
		case "pending":
		case "pending_review":
		case "pending review":
			return "Pending review";
		case "suspended":
			return "Suspended";
		case "expired":
		case "expired_documents":
		case "expired documents":
			return "Expired documents";
		case "rejected":
			return "Rejected";
		case "inactive":
			return "Inactive";
		default:
			return "Pending review";
	}
};

const normalizeDriver = (raw: any): Driver => {
	const assignedVehicle: AssignedVehicle | null =
		raw?.vehicle_id || raw?.vehicle_plate
			? {
					id: String(raw?.vehicle_id ?? ""),
					plate: String(raw?.vehicle_plate ?? "—"),
					kind: String(raw?.vehicle_kind ?? "—"),
					make: String(raw?.vehicle_make ?? "—"),
					model: String(raw?.vehicle_model ?? "—"),
					year: String(raw?.vehicle_year ?? "—"),
					capacity: String(raw?.vehicle_capacity ?? "—"),
					transporter: String(raw?.vehicle_transporter ?? "—"),
					status: String(raw?.vehicle_status ?? "—"),
			  }
			: null;

	return {
		id: String(raw?.id ?? ""),
		name: String(raw?.name ?? raw?.full_name ?? "—"),
		phone: String(raw?.phone ?? "—"),
		licenceNumber: String(
			raw?.licence_number ?? raw?.licenceNumber ?? "—"
		),
		licenceClass: String(
			raw?.licence_class ?? raw?.licenceClass ?? "—"
		),
		licenceExpiry: String(
			raw?.licence_expiry ?? raw?.licenceExpiry ?? "—"
		),
		transporter: String(raw?.transporter ?? "—"),
		status: normalizeStatus(raw?.status),
		lastVisit: String(raw?.last_visit ?? raw?.lastVisit ?? "—"),
		notes: String(raw?.notes ?? ""),
		vehicles: assignedVehicle ? [assignedVehicle] : [],
	};
};

export default function GateDriversPage() {
	const navigate = useNavigate();
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
	const [view, setView] = useState<View>("list");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [actioning, setActioning] = useState<string | null>(null);

	const fetchDrivers = useCallback(async (preferredId?: string) => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("drivers/");
			const resp: Resp = res.data;
			if (resp.error) {
				const message =
					typeof resp.data === "string"
						? resp.data
						: "Could not load drivers.";
				setError(message);
				toast.error(message);
				setDrivers([]);
				return;
			}
			const list = extractList<any>(resp.code ?? resp.data);
			setDrivers(list.map(normalizeDriver));
			if (preferredId) setSelectedId(preferredId);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.response?.data?.data ||
				"Could not load drivers.";
			setError(message);
			toast.error(message);
			setDrivers([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDrivers();
	}, [fetchDrivers]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return drivers.filter((d) => {
			const matchQuery =
				!q ||
				d.name.toLowerCase().includes(q) ||
				d.phone.includes(q) ||
				d.licenceNumber.toLowerCase().includes(q) ||
				d.transporter.toLowerCase().includes(q) ||
				d.vehicles.some(
					(v) =>
						v.plate.toLowerCase().includes(q) ||
						v.make.toLowerCase().includes(q) ||
						v.model.toLowerCase().includes(q) ||
						v.transporter.toLowerCase().includes(q)
				);
			const matchStatus = statusFilter === "all" || d.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [drivers, query, statusFilter]);

	const stats = useMemo(() => {
		const total = drivers.length;
		const approved = drivers.filter((d) => d.status === "Approved").length;
		const pending = drivers.filter((d) => d.status === "Pending review").length;
		const expired = drivers.filter((d) => d.status === "Expired documents").length;
		const assigned = drivers.filter((d) => d.vehicles.length > 0).length;
		return { total, approved, pending, expired, assigned };
	}, [drivers]);

	const selected = useMemo(
		() => drivers.find((d) => d.id === selectedId) ?? null,
		[drivers, selectedId]
	);

	const openDetail = (id: string) => {
		setSelectedId(id);
		setView("detail");
	};

	const closeDetail = () => {
		setSelectedId(null);
		setView("list");
	};

	const mutateStatus = async (
		endpoint: string,
		id: string,
		nextStatus: DriverStatus,
		payload: Record<string, string> = {}
	) => {
		setActioning(id);
		try {
			const res = await http.post(endpoint, { id, ...payload });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Action could not be completed.");
				return false;
			}
			setDrivers((prev) =>
				prev.map((d) => (d.id === id ? { ...d, status: nextStatus } : d))
			);
			toast.success(
				typeof resp.data === "string" ? resp.data : "Driver updated."
			);
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Action could not be completed."
			);
			return false;
		} finally {
			setActioning(null);
		}
	};

	const handleApprove = (id: string) =>
		mutateStatus("driver/approve/", id, "Approved");

	const handleActivate = (id: string) =>
		mutateStatus("driver/activate/", id, "Approved");

	const handleSuspend = (id: string, reason: string) =>
		mutateStatus("driver/suspend/", id, "Suspended", { reason });

	const handleReject = (id: string, reason: string) =>
		mutateStatus("driver/reject/", id, "Rejected", { reason });

	const handleDelete = async (id: string, reason: string) => {
		setActioning(id);
		try {
			const res = await http.post("driver/delete/", { id, reason });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove driver.");
				return false;
			}
			setDrivers((prev) => prev.filter((d) => d.id !== id));
			toast.success("Driver removed from the registry.");
			closeDetail();
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not remove driver."
			);
			return false;
		} finally {
			setActioning(null);
		}
	};

	const openEdit = (id: string) => {
		navigate(`/portal/driver/edit/${id}`);
	};

	return (
		<AppShell title="Drivers" eyebrow="Gate control · Registry">
			<style>{pageAnimations}</style>
			<div className="overflow-hidden">
				{view === "list" && (
					<div
						className="space-y-5"
						style={{
							animation:
								"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
						}}
					>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
									Gate control · Approved haulage
								</p>
								<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
									Driver registry
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
									Every driver visiting the terminal is registered with
									licence, contact details, and assigned vehicle. Expired
									licences block entry until renewed.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									className="border-line bg-paper text-ink hover:bg-sand"
									onClick={() => void fetchDrivers(selectedId ?? undefined)}
									disabled={loading}
								>
									<RefreshCw
										className={cn(
											"mr-1.5 size-4",
											loading && "animate-spin"
										)}
									/>
									Refresh
								</Button>
								<Button
									variant="outline"
									className="border-line bg-paper text-ink hover:bg-sand"
									onClick={() =>
										toast.success("Driver registry exported locally.")
									}
								>
									<Download className="mr-1.5 size-4" /> Export drivers
								</Button>
								<Button
									className="bg-orange text-white hover:bg-orange-deep"
									onClick={() => navigate("/portal/driver/add")}
								>
									<Plus className="mr-1.5 size-4" />
									Add driver
								</Button>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric
								label="Registered drivers"
								value={String(stats.total)}
								detail="Across all hauliers"
								tone="info"
								icon={User}
							/>
							<Metric
								label="With vehicle"
								value={String(stats.assigned)}
								detail="Assigned to a vehicle"
								tone="success"
								icon={Truck}
							/>
							<Metric
								label="Pending review"
								value={String(stats.pending)}
								detail="Awaiting verification"
								tone="warning"
								icon={UserCheck}
							/>
							<Metric
								label="Expired documents"
								value={String(stats.expired)}
								detail="Blocked until renewed"
								tone={stats.expired > 0 ? "critical" : "success"}
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
										placeholder="Search by name, phone, licence, transporter, or plate..."
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

							{loading ? (
								<div className="flex items-center justify-center gap-2 py-16">
									<Loader2 className="size-5 animate-spin text-orange" />
									<span className="text-sm text-ink-soft">
										Loading drivers…
									</span>
								</div>
							) : error ? (
								<div className="p-12 text-center">
									<AlertTriangle className="mx-auto size-7 text-coral" />
									<p className="mt-3 font-medium text-ink">
										Could not load drivers
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">{error}</p>
									<Button
										onClick={() => void fetchDrivers()}
										className="mt-4 bg-orange text-white hover:bg-orange-deep"
									>
										Try again
									</Button>
								</div>
							) : filtered.length === 0 ? (
								<div className="p-12 text-center">
									<User className="mx-auto size-7 text-ink-soft" />
									<p className="mt-3 font-medium text-ink">
										No drivers match your filters.
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">
										Try a different name, phone, licence, or status.
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[1000px] text-left text-sm">
										<thead>
											<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												<th className="px-4 py-3 font-medium">Name</th>
												<th className="px-4 py-3 font-medium">Contact</th>
												<th className="px-4 py-3 font-medium">Licence</th>
												<th className="px-4 py-3 font-medium">
													Assigned vehicle
												</th>
												<th className="px-4 py-3 font-medium">Transporter</th>
												<th className="px-4 py-3 font-medium">Status</th>
												<th className="px-4 py-3 font-medium text-right">
													Action
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-line">
											{filtered.map((d) => (
												<tr
													key={d.id}
													className="transition-colors hover:bg-sand/60"
												>
													<td className="px-4 py-3.5">
														<p className="text-[12px] font-semibold text-ink">
															{d.name}
														</p>
													</td>
													<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
														{d.phone}
													</td>
													<td className="px-4 py-3.5">
														<p className="font-mono text-[11px] text-ink">
															{d.licenceNumber}
														</p>
														<p className="mt-0.5 text-[10px] text-ink-soft">
															{d.licenceClass}
														</p>
														<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
															Expires {d.licenceExpiry}
														</p>
													</td>
													<td className="px-4 py-3.5">
														{d.vehicles.length === 0 ? (
															<span className="inline-flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-coral ring-1 ring-coral/20">
																<AlertTriangle className="size-3" />
																No vehicle
															</span>
														) : (
															<ul className="space-y-1.5">
																{d.vehicles.map((v) => (
																	<li
																		key={v.id}
																		className="flex items-start gap-2"
																	>
																		<span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-teal/10 text-teal-deep ring-1 ring-teal/20">
																			<Truck className="size-3" />
																		</span>
																		<span className="min-w-0">
																			<span className="block truncate font-mono text-[12px] font-semibold text-ink">
																				{v.plate}
																			</span>
																			<span className="block truncate text-[10px] text-ink-soft">
																				{v.kind} · {v.make}{" "}
																				{v.model}
																			</span>
																		</span>
																	</li>
																))}
															</ul>
														)}
													</td>
													<td className="px-4 py-3.5 text-[11px] text-ink-soft">
														{d.transporter}
													</td>
													<td className="px-4 py-3.5">
														<StatusBadge
															label={d.status}
															tone={statusTone(d.status)}
														/>
													</td>
													<td className="px-4 py-3.5 text-right">
														<div className="flex items-center justify-end gap-1.5">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => openDetail(d.id)}
																className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
															>
																View
															</Button>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => openEdit(d.id)}
																className="size-7 text-ink-soft hover:bg-orange/10 hover:text-orange-deep"
																aria-label={`Edit ${d.name}`}
															>
																<Pencil className="size-3.5" />
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
								<span>
									Showing {filtered.length} of {drivers.length} drivers
								</span>
								<span>Expired licences block gate entry</span>
							</div>
						</section>

						<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
							<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
								<div>
									<div className="flex items-center gap-2">
										<ShieldCheck className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
											Why registration matters
										</p>
									</div>
									<h3 className="mt-3 font-display text-xl font-bold text-ink">
										Only registered drivers reach the gate
									</h3>
									<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
										Gate officers verify the driver against the registry
										and check licence validity. Expired or suspended
										records block entry at the gate console. Every check
										is logged to the gate audit trail.
									</p>
								</div>

								<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Checked at gate
									</p>
									<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Driver's licence (Class G or equivalent, not
											expired)
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Assigned vehicle matches the appointment
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Identity matches the registered driver
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Transporter is authorised for the visit
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{view === "detail" && selected && (
					<DriverDetail
						key={selected.id}
						driver={selected}
						actioning={actioning === selected.id}
						onBack={closeDetail}
						onEdit={() => openEdit(selected.id)}
						onApprove={async () => {
							const ok = await handleApprove(selected.id);
							if (ok) await fetchDrivers(selected.id);
						}}
						onActivate={async () => {
							const ok = await handleActivate(selected.id);
							if (ok) await fetchDrivers(selected.id);
						}}
						onSuspend={async (reason) => {
							const ok = await handleSuspend(selected.id, reason);
							if (ok) closeDetail();
							return ok;
						}}
						onReject={async (reason) => {
							const ok = await handleReject(selected.id, reason);
							if (ok) closeDetail();
							return ok;
						}}
						onDelete={async (reason) => {
							await handleDelete(selected.id, reason);
						}}
					/>
				)}
			</div>
		</AppShell>
	);
}

function DriverDetail({
	driver,
	actioning,
	onBack,
	onEdit,
	onApprove,
	onActivate,
	onSuspend,
	onReject,
	onDelete,
}: {
	driver: Driver;
	actioning: boolean;
	onBack: () => void;
	onEdit: () => void;
	onApprove: () => void | Promise<void>;
	onActivate: () => void | Promise<void>;
	onSuspend: (reason: string) => Promise<boolean>;
	onReject: (reason: string) => Promise<boolean>;
	onDelete: (reason: string) => Promise<void>;
}) {
	const navigate = useNavigate();
	const [suspendOpen, setSuspendOpen] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const isPending = driver.status === "Pending review";
	const isSuspended = driver.status === "Suspended";
	const isActive = driver.status === "Approved";

	return (
		<div
			className="space-y-5 pb-8"
			style={{
				animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					variant="ghost"
					onClick={onBack}
					disabled={actioning}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to drivers
				</Button>
				<Button
					variant="outline"
					onClick={onEdit}
					disabled={actioning}
					className="border-line bg-paper text-ink hover:bg-sand"
				>
					<Pencil className="mr-1.5 size-4" />
					Edit
				</Button>
			</div>

			<div className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Driver record
						</p>
						<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
							{driver.name}
						</h3>
						<p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
							{driver.phone}
						</p>
					</div>
					<StatusBadge
						label={driver.status}
						tone={statusTone(driver.status)}
					/>
				</div>

				<div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
					<InfoStat label="Transporter" value={driver.transporter} />
					<InfoStat
						label="Vehicles assigned"
						value={String(driver.vehicles.length)}
						mono
					/>
					<InfoStat label="Last visit" value={driver.lastVisit} mono />
				</div>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					Licence
				</p>
				<p className="mt-1 font-mono text-sm font-semibold text-ink">
					{driver.licenceNumber}
				</p>
				<p className="mt-1 text-[12px] text-ink-soft">
					{driver.licenceClass}
				</p>
				<p className="mt-2 font-mono text-[11px] text-ink-soft">
					Expires {driver.licenceExpiry}
				</p>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<div className="flex items-center justify-between gap-3">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Assigned vehicles
					</p>
					<span className="rounded-full bg-sand px-2 py-0.5 font-mono text-[10px] text-ink-soft">
						{driver.vehicles.length}
					</span>
				</div>

				{driver.vehicles.length === 0 ? (
					<div className="mt-3 rounded-xl border border-dashed border-line bg-sand/40 p-4 text-center">
						<Truck className="mx-auto size-6 text-ink-soft" />
						<p className="mt-2 text-[12px] font-semibold text-ink">
							No vehicle assigned
						</p>
						<p className="mt-1 text-[11px] text-ink-soft">
							Assign a vehicle from the driver assignments page.
						</p>
						<Button
							onClick={() => navigate("/portal/drivers/assignments")}
							variant="outline"
							className="mt-3 border-line bg-paper text-ink hover:bg-sand"
						>
							Open assignments
						</Button>
					</div>
				) : (
					<ul className="mt-3 space-y-2">
						{driver.vehicles.map((v) => (
							<li
								key={v.id}
								className="flex items-start gap-3 rounded-lg border border-line bg-sand p-3"
							>
								<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
									<Truck className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-mono text-[13px] font-semibold text-ink">
											{v.plate}
										</p>
										{v.status && v.status !== "—" && (
											<StatusBadge
												label={v.status}
												tone={statusTone(v.status)}
											/>
										)}
									</div>
									<p className="mt-0.5 text-[11px] text-ink-soft">
										{v.kind} · {v.make} {v.model} · {v.year}
									</p>
									<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
										{v.capacity} · {v.transporter}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					Notes
				</p>
				<p className="mt-2 text-[13px] leading-6 text-ink-soft">
					{driver.notes || "No additional notes for this driver."}
				</p>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
					Actions
				</p>

				<div className="mt-3 flex flex-wrap gap-2">
					{isPending ? (
						<>
							<Button
								disabled={actioning}
								onClick={() => void onApprove()}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{actioning ? (
									<Loader2 className="mr-1.5 size-4 animate-spin" />
								) : (
									<Check className="mr-1.5 size-4" />
								)}
								Approve
							</Button>

							<Button
								disabled={actioning}
								onClick={() => setRejectOpen(true)}
								variant="outline"
								className="border-coral/30 bg-coral/5 text-coral hover:bg-coral/10"
							>
								<XCircle className="mr-1.5 size-4" />
								Reject
							</Button>
						</>
					) : isActive ? (
						<Button
							disabled={actioning}
							onClick={() => setSuspendOpen(true)}
							variant="outline"
							className="border-coral/30 bg-coral/5 text-coral hover:bg-coral/10"
						>
							<AlertTriangle className="mr-1.5 size-4" />
							Suspend
						</Button>
					) : isSuspended ? (
						<Button
							disabled={actioning}
							onClick={() => void onActivate()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							{actioning ? (
								<Loader2 className="mr-1.5 size-4 animate-spin" />
							) : (
								<Check className="mr-1.5 size-4" />
							)}
							Activate
						</Button>
					) : null}
				</div>

				<div className="mt-5 border-t border-line pt-4">
					<Button
						disabled={actioning}
						onClick={() => setDeleteOpen(true)}
						variant="ghost"
						className="text-coral hover:bg-coral/10"
					>
						<Trash2 className="mr-1.5 size-4" />
						Delete driver
					</Button>
				</div>
			</div>

			{suspendOpen && (
				<ConfirmDialog
					title="Suspend driver"
					description="Suspending this driver blocks gate entry immediately. Provide a reason for the audit trail."
					confirmLabel="Suspend driver"
					tone="danger"
					requireReason
					onClose={() => setSuspendOpen(false)}
					onConfirm={async (reason) => {
						const ok = await onSuspend(reason ?? "");
						if (ok) setSuspendOpen(false);
					}}
				/>
			)}

			{rejectOpen && (
				<ConfirmDialog
					title="Reject driver"
					description="Rejecting this driver prevents them from being approved. Provide a reason for the audit trail."
					confirmLabel="Reject driver"
					tone="danger"
					requireReason
					onClose={() => setRejectOpen(false)}
					onConfirm={async (reason) => {
						const ok = await onReject(reason ?? "");
						if (ok) setRejectOpen(false);
					}}
				/>
			)}

			{deleteOpen && (
				<ConfirmDialog
					title="Remove driver"
					description="The driver will no longer be able to enter the terminal. Historical records remain on the audit trail."
					confirmLabel="Remove driver"
					tone="danger"
					requireReason
					onClose={() => setDeleteOpen(false)}
					onConfirm={async (reason) => {
						await onDelete(reason ?? "");
						setDeleteOpen(false);
					}}
				/>
			)}
		</div>
	);
}

function InfoStat({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-xl bg-sand p-3 ring-1 ring-line">
			<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
				{label}
			</p>
			<p
				className={cn(
					"mt-1 truncate text-[13px] font-semibold text-ink",
					mono && "font-mono"
				)}
			>
				{value}
			</p>
		</div>
	);
}

function ConfirmDialog({
	title,
	description,
	confirmLabel,
	tone,
	requireReason,
	onClose,
	onConfirm,
}: {
	title: string;
	description: string;
	confirmLabel: string;
	tone: "danger" | "default";
	requireReason?: boolean;
	onClose: () => void;
	onConfirm: (reason?: string) => void | Promise<unknown>;
}) {
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (requireReason && reason.trim().length < 5) {
			toast.error("Enter a reason of at least 5 characters.");
			return;
		}
		setSubmitting(true);
		try {
			await onConfirm(reason.trim());
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) =>
				e.target === e.currentTarget && !submitting && onClose()
			}
		>
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line"
			>
				<div className="flex items-start gap-3 border-b border-line p-5 sm:p-6">
					<div
						className={cn(
							"grid size-10 shrink-0 place-items-center rounded-full",
							tone === "danger"
								? "bg-coral/10 text-coral"
								: "bg-orange/10 text-orange-deep"
						)}
					>
						<AlertTriangle className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
							Confirm action
						</p>
						<h3 className="mt-1 font-display text-lg font-bold text-ink">
							{title}
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							{description}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onClose}
						disabled={submitting}
						aria-label="Close"
					>
						<X className="size-4" />
					</Button>
				</div>

				{requireReason && (
					<div className="space-y-2 p-5 sm:p-6">
						<label className="block">
							<span className={labelClass}>
								Reason <span className="text-coral">*</span>
							</span>
							<textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								rows={4}
								minLength={5}
								maxLength={2000}
								disabled={submitting}
								required
								placeholder="Explain the reason. Recorded in the audit trail."
								className={textareaClass}
							/>
						</label>
						<p className="text-right font-mono text-[10px] text-ink-soft">
							{reason.length}/2000
						</p>
					</div>
				)}

				<div className="flex justify-end gap-2 border-t border-line p-5 sm:p-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={submitting}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={
							submitting || (requireReason && reason.trim().length < 5)
						}
						className={cn(
							"text-white",
							tone === "danger"
								? "bg-coral hover:bg-coral/90"
								: "bg-orange hover:bg-orange-deep"
						)}
					>
						{submitting && (
							<Loader2 className="mr-1.5 size-4 animate-spin" />
						)}
						{confirmLabel}
					</Button>
				</div>
			</form>
		</div>
	);
}