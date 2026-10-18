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

type VehicleStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents"
	| "Rejected"
	| "Inactive";

type DriverStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents"
	| "Rejected"
	| "Inactive";

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceClass: string;
	licenceExpiry: string;
	transporter: string;
	status: DriverStatus;
}

interface Vehicle {
	id: string;
	plate: string;
	kind: "Flatbed" | "Container" | "Reefer" | "Box" | "Tanker";
	make: string;
	model: string;
	year: string;
	capacity: string;
	owner: string;
	transporter: string;
	insuranceExpiry: string;
	roadworthinessExpiry: string;
	status: VehicleStatus;
	lastVisit: string;
	notes: string;
	drivers: Driver[];
}

const statusFilters: (VehicleStatus | "all")[] = [
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

const normalizeStatus = (raw: unknown): VehicleStatus => {
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

const normalizeDriver = (raw: any): Driver => ({
	id: String(raw?.id ?? ""),
	name: String(raw?.name ?? raw?.full_name ?? "—"),
	phone: String(raw?.phone ?? "—"),
	licenceNumber: String(raw?.licence_number ?? raw?.licenceNumber ?? "—"),
	licenceClass: String(raw?.licence_class ?? raw?.licenceClass ?? "—"),
	licenceExpiry: String(raw?.licence_expiry ?? raw?.licenceExpiry ?? "—"),
	transporter: String(raw?.transporter ?? "—"),
	status: normalizeStatus(raw?.status),
});

const normalizeVehicle = (raw: any): Vehicle => ({
	id: String(raw?.id ?? ""),
	plate: String(raw?.plate ?? raw?.plate_number ?? "—"),
	kind: (raw?.kind ?? raw?.vehicle_kind ?? "Container") as Vehicle["kind"],
	make: String(raw?.make ?? "—"),
	model: String(raw?.model ?? "—"),
	year: String(raw?.year ?? "—"),
	capacity: String(raw?.capacity ?? "—"),
	owner: String(raw?.owner ?? raw?.owner_name ?? "—"),
	transporter: String(raw?.transporter ?? raw?.transporter_name ?? "—"),
	insuranceExpiry: String(
		raw?.insurance_expiry ?? raw?.insuranceExpiry ?? "—"
	),
	roadworthinessExpiry: String(
		raw?.roadworthiness_expiry ?? raw?.roadworthinessExpiry ?? "—"
	),
	status: normalizeStatus(raw?.status),
	lastVisit: String(raw?.last_visit ?? raw?.lastVisit ?? "—"),
	notes: String(raw?.notes ?? ""),
	drivers: Array.isArray(raw?.drivers)
		? raw.drivers.map(normalizeDriver)
		: [],
});

export default function GateVehiclesRoute() {
	const navigate = useNavigate();
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
	const [view, setView] = useState<View>("list");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [actioning, setActioning] = useState<string | null>(null);

	const fetchVehicles = useCallback(async (preferredId?: string) => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("vehicles/");
			const resp: Resp = res.data;
			if (resp.error) {
				const message =
					typeof resp.data === "string"
						? resp.data
						: "Could not load vehicles.";
				setError(message);
				toast.error(message);
				setVehicles([]);
				return;
			}
			const list = extractList<any>(resp.code ?? resp.data);
			setVehicles(list.map(normalizeVehicle));
			if (preferredId) setSelectedId(preferredId);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.response?.data?.data ||
				"Could not load vehicles.";
			setError(message);
			toast.error(message);
			setVehicles([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchVehicles();
	}, [fetchVehicles]);

	const filteredVehicles = useMemo(() => {
		const q = query.trim().toLowerCase();
		return vehicles.filter((v) => {
			const matchQuery =
				!q ||
				v.plate.toLowerCase().includes(q) ||
				v.owner.toLowerCase().includes(q) ||
				v.transporter.toLowerCase().includes(q) ||
				v.make.toLowerCase().includes(q) ||
				v.drivers.some(
					(d) =>
						d.name.toLowerCase().includes(q) ||
						d.phone.toLowerCase().includes(q) ||
						d.licenceNumber.toLowerCase().includes(q)
				);
			const matchStatus = statusFilter === "all" || v.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [vehicles, query, statusFilter]);

	const stats = useMemo(() => {
		const total = vehicles.length;
		const approved = vehicles.filter((v) => v.status === "Approved").length;
		const pending = vehicles.filter((v) => v.status === "Pending review").length;
		const expired = vehicles.filter((v) => v.status === "Expired documents").length;
		const withDriver = vehicles.filter((v) => v.drivers.length > 0).length;
		return { total, approved, pending, expired, withDriver };
	}, [vehicles]);

	const selected = useMemo(
		() => vehicles.find((v) => v.id === selectedId) ?? null,
		[vehicles, selectedId]
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
		nextStatus: VehicleStatus,
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
			setVehicles((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: nextStatus } : v))
			);
			toast.success(
				typeof resp.data === "string" ? resp.data : "Vehicle updated."
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
		mutateStatus("vehicles/approve/", id, "Approved");

	const handleActivate = (id: string) =>
		mutateStatus("vehicles/activate/", id, "Approved");

	const handleSuspend = (id: string, reason: string) =>
		mutateStatus("vehicles/suspend/", id, "Suspended", { reason });

	const handleReject = (id: string, reason: string) =>
		mutateStatus("vehicles/reject/", id, "Rejected", { reason });

	const handleDelete = async (id: string, reason: string) => {
		setActioning(id);
		try {
			const res = await http.post("vehicles/delete/", { id, reason });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not remove vehicle.");
				return false;
			}
			setVehicles((prev) => prev.filter((v) => v.id !== id));
			toast.success("Vehicle removed from the registry.");
			closeDetail();
			return true;
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not remove vehicle."
			);
			return false;
		} finally {
			setActioning(null);
		}
	};

	return (
		<AppShell title="Vehicle registry" eyebrow="Gate control · Registry">
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
									Vehicle registry
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
									Every truck visiting the terminal is registered with plate,
									insurance, and roadworthiness details. The assigned driver
									is shown per vehicle.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									className="border-line bg-paper text-ink hover:bg-sand"
									onClick={() => void fetchVehicles(selectedId ?? undefined)}
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
									onClick={() => toast.success("Registry exported locally.")}
								>
									<Download className="mr-1.5 size-4" /> Export registry
								</Button>
								<Button
									className="bg-orange text-white hover:bg-orange-deep"
									onClick={() => navigate("/gate/vehicle/add")}
								>
									<Plus className="mr-1.5 size-4" />
									Add vehicle
								</Button>
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<Metric
								label="Registered vehicles"
								value={String(stats.total)}
								detail="Across all hauliers"
								tone="info"
								icon={Truck}
							/>
							<Metric
								label="With driver"
								value={String(stats.withDriver)}
								detail="Have an assigned driver"
								tone="success"
								icon={UserCheck}
							/>
							<Metric
								label="Pending review"
								value={String(stats.pending)}
								detail="Awaiting verification"
								tone="warning"
								icon={AlertTriangle}
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
										placeholder="Search by plate, owner, transporter, make, or driver…"
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
										Loading vehicles…
									</span>
								</div>
							) : error ? (
								<div className="p-12 text-center">
									<AlertTriangle className="mx-auto size-7 text-coral" />
									<p className="mt-3 font-medium text-ink">
										Could not load vehicles
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">{error}</p>
									<Button
										onClick={() => void fetchVehicles()}
										className="mt-4 bg-orange text-white hover:bg-orange-deep"
									>
										Try again
									</Button>
								</div>
							) : filteredVehicles.length === 0 ? (
								<div className="p-12 text-center">
									<Truck className="mx-auto size-7 text-ink-soft" />
									<p className="mt-3 font-medium text-ink">
										No vehicles match your filters.
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">
										Try a different plate, owner, or status.
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[1100px] text-left text-sm">
										<thead>
											<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												<th className="px-4 py-3 font-medium">Plate</th>
												<th className="px-4 py-3 font-medium">Kind / make</th>
												<th className="px-4 py-3 font-medium">
													Owner / transporter
												</th>
												<th className="px-4 py-3 font-medium">
													Assigned driver
												</th>
												<th className="px-4 py-3 font-medium">Insurance</th>
												<th className="px-4 py-3 font-medium">Status</th>
												<th className="px-4 py-3 font-medium text-right">
													Action
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-line">
											{filteredVehicles.map((v) => (
												<tr
													key={v.id}
													className="transition-colors hover:bg-sand/60"
												>
													<td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-ink">
														{v.plate}
													</td>
													<td className="px-4 py-3.5">
														<p className="text-[12px] text-ink">
															{v.kind}
														</p>
														<p className="mt-0.5 text-[11px] text-ink-soft">
															{v.make} {v.model} · {v.year}
														</p>
													</td>
													<td className="px-4 py-3.5">
														<p className="text-[12px] text-ink">
															{v.owner}
														</p>
														<p className="mt-0.5 text-[11px] text-ink-soft">
															{v.transporter} · {v.capacity}
														</p>
													</td>
													<td className="px-4 py-3.5">
														{v.drivers.length > 0 ? (
															<ul className="space-y-1.5">
																{v.drivers.map((d) => (
																	<li
																		key={d.id}
																		className="flex items-start gap-2"
																	>
																		<span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-teal/10 text-teal-deep ring-1 ring-teal/20">
																			<User className="size-3" />
																		</span>
																		<span className="min-w-0">
																			<span className="block truncate text-[12px] font-semibold text-ink">
																				{d.name}
																			</span>
																			<span className="block truncate font-mono text-[10px] text-ink-soft">
																				{d.phone} ·{" "}
																				{d.licenceNumber}
																			</span>
																		</span>
																	</li>
																))}
															</ul>
														) : (
															<span className="inline-flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-coral ring-1 ring-coral/20">
																<AlertTriangle className="size-3" />
																No driver
															</span>
														)}
													</td>
													<td className="px-4 py-3.5 font-mono text-[11px] text-ink">
														{v.insuranceExpiry}
													</td>
													<td className="px-4 py-3.5">
														<StatusBadge
															label={v.status}
															tone={statusTone(v.status)}
														/>
													</td>
													<td className="px-4 py-3.5 text-right">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => openDetail(v.id)}
															className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
														>
															View
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
									Showing {filteredVehicles.length} of {vehicles.length}{" "}
									vehicles
								</span>
								<span>Expired documents block gate entry</span>
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
										Only registered vehicles and drivers reach the gate
									</h3>
									<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
										Gate officers verify the plate against the registry,
										confirm the assigned driver, and check document expiry.
										Expired or suspended records block entry at the gate
										console. Every check is logged to the gate audit trail.
									</p>
								</div>

								<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Checked at gate
									</p>
									<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Insurance certificate (not expired)
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Roadworthiness certificate (not expired)
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Assigned driver matches the appointment
										</li>
										<li className="flex items-start gap-2">
											<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
											Driver licence (Class G, not expired)
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{view === "detail" && selected && (
					<VehicleDetail
						key={selected.id}
						vehicle={selected}
						actioning={actioning === selected.id}
						onBack={closeDetail}
						onEdit={() => navigate(`/gate/vehicle/edit/${selected.id}`)}
						onApprove={async () => {
							const ok = await handleApprove(selected.id);
							if (ok) await fetchVehicles(selected.id);
						}}
						onActivate={async () => {
							const ok = await handleActivate(selected.id);
							if (ok) await fetchVehicles(selected.id);
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

function VehicleDetail({
	vehicle,
	actioning,
	onBack,
	onEdit,
	onApprove,
	onActivate,
	onSuspend,
	onReject,
	onDelete,
}: {
	vehicle: Vehicle;
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

	const isPending = vehicle.status === "Pending review";
	const isSuspended = vehicle.status === "Suspended";
	const isActive = vehicle.status === "Approved";

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
					Back to vehicles
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
							Vehicle record
						</p>
						<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
							{vehicle.plate}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							{vehicle.kind} · {vehicle.make} {vehicle.model} ·{" "}
							{vehicle.year}
						</p>
					</div>
					<StatusBadge
						label={vehicle.status}
						tone={statusTone(vehicle.status)}
					/>
				</div>

				<div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
					<InfoStat label="Owner" value={vehicle.owner} />
					<InfoStat label="Transporter" value={vehicle.transporter} />
					<InfoStat label="Capacity" value={vehicle.capacity} mono />
				</div>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<div className="flex items-center justify-between gap-3">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Assigned drivers
					</p>
					<span className="rounded-full bg-sand px-2 py-0.5 font-mono text-[10px] text-ink-soft">
						{vehicle.drivers.length}
					</span>
				</div>

				{vehicle.drivers.length === 0 ? (
					<div className="mt-3 rounded-xl border border-dashed border-line bg-sand/40 p-4 text-center">
						<User className="mx-auto size-6 text-ink-soft" />
						<p className="mt-2 text-[12px] font-semibold text-ink">
							No driver assigned
						</p>
						<p className="mt-1 text-[11px] text-ink-soft">
							Assign a driver from the driver assignments page.
						</p>
						<Button
							onClick={() => navigate("/gate/drivers/assignments")}
							variant="outline"
							className="mt-3 border-line bg-paper text-ink hover:bg-sand"
						>
							Open assignments
						</Button>
					</div>
				) : (
					<ul className="mt-3 space-y-2">
						{vehicle.drivers.map((d) => (
							<li
								key={d.id}
								className="flex items-start gap-3 rounded-lg border border-line bg-sand p-3"
							>
								<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
									<User className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-[13px] font-semibold text-ink">
											{d.name}
										</p>
										<StatusBadge
											label={d.status}
											tone={statusTone(d.status)}
										/>
									</div>
									<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
										{d.phone} · {d.licenceNumber}
									</p>
									<p className="mt-0.5 text-[11px] text-ink-soft">
										{d.licenceClass} · Expires {d.licenceExpiry}
									</p>
									<p className="mt-0.5 text-[11px] text-ink-soft">
										Transporter: {d.transporter}
									</p>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Insurance
					</p>
					<p className="mt-1 font-mono text-sm font-semibold text-ink">
						{vehicle.insuranceExpiry}
					</p>
				</div>
				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Roadworthiness
					</p>
					<p className="mt-1 font-mono text-sm font-semibold text-ink">
						{vehicle.roadworthinessExpiry}
					</p>
				</div>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					Notes
				</p>
				<p className="mt-2 text-[13px] leading-6 text-ink-soft">
					{vehicle.notes || "No additional notes for this vehicle."}
				</p>
				<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
					Last visit: {vehicle.lastVisit}
				</p>
			</div>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
				<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
					Actions
				</p>

				<div className="mt-3 flex flex-wrap gap-2">
					{isPending && (
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
					)}

					{isActive && (
						<Button
							disabled={actioning}
							onClick={() => setSuspendOpen(true)}
							variant="outline"
							className="border-coral/30 bg-coral/5 text-coral hover:bg-coral/10"
						>
							<AlertTriangle className="mr-1.5 size-4" />
							Suspend
						</Button>
					)}

					{isSuspended && (
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
					)}
				</div>

				<div className="mt-5 border-t border-line pt-4">
					<Button
						disabled={actioning}
						onClick={() => setDeleteOpen(true)}
						variant="ghost"
						className="text-coral hover:bg-coral/10"
					>
						<XCircle className="mr-1.5 size-4" />
						Delete vehicle
					</Button>
				</div>

				{suspendOpen && (
					<ConfirmDialog
						title="Suspend vehicle"
						description="Suspending this vehicle blocks gate entry. Provide a reason for the audit trail."
						confirmLabel="Suspend vehicle"
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
						title="Reject vehicle"
						description="Rejecting this vehicle prevents it from being approved. Provide a reason for the audit trail."
						confirmLabel="Reject vehicle"
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
						title="Delete vehicle"
						description="This removes the vehicle from the registry. Provide a reason for the audit trail."
						confirmLabel="Delete vehicle"
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