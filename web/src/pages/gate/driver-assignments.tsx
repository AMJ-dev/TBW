import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ChevronDown,
	Filter,
	Loader2,
	RefreshCw,
	Search,
	Truck,
	User,
	UserCheck,
	X,
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

interface Vehicle {
	id: string;
	plate: string;
	kind: string;
	make: string;
	model: string;
	transporter: string;
}

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceExpiry: string;
	assignedVehicleId: string | null;
	assignedVehiclePlate: string | null;
	transporter: string;
	status: DriverStatus;
}

type AssignmentRow = {
	driverId: string;
	driverName: string;
	driverPhone: string;
	driverLicenceNumber: string;
	driverTransporter: string;
	driverStatus: DriverStatus;
	vehicleId: string | null;
	vehiclePlate: string | null;
	vehicleKind: string | null;
	vehicleMake: string | null;
	vehicleModel: string | null;
	vehicleTransporter: string | null;
	assignedAt: string | null;
};

const statusFilters: (DriverStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
	"Rejected",
	"Inactive",
];

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

type Mode = "driver-first" | "vehicle-first";

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

const normalizeVehicle = (raw: any): Vehicle => ({
	id: String(raw?.id ?? ""),
	plate: String(raw?.plate ?? raw?.plate_number ?? "—"),
	kind: String(raw?.kind ?? raw?.vehicle_kind ?? "—"),
	make: String(raw?.make ?? "—"),
	model: String(raw?.model ?? "—"),
	transporter: String(raw?.transporter ?? raw?.transporter_name ?? "—"),
});

const normalizeDriver = (raw: any): Driver => ({
	id: String(raw?.id ?? ""),
	name: String(raw?.name ?? raw?.full_name ?? "—"),
	phone: String(raw?.phone ?? "—"),
	licenceNumber: String(raw?.licence_number ?? raw?.licenceNumber ?? "—"),
	licenceExpiry: String(raw?.licence_expiry ?? raw?.licenceExpiry ?? "—"),
	assignedVehicleId:
		raw?.assigned_vehicle_id ?? raw?.assignedVehicleId ?? null,
	assignedVehiclePlate:
		raw?.assigned_vehicle_plate ??
		raw?.assignedVehiclePlate ??
		raw?.assigned_vehicle ??
		null,
	transporter: String(raw?.transporter ?? "—"),
	status: normalizeStatus(raw?.status),
});

const normalizeAssignment = (raw: any): AssignmentRow => {
	const driver = normalizeDriver(raw?.driver ?? raw);
	const vehicleRaw = raw?.vehicle ?? null;
	const vehicle = vehicleRaw ? normalizeVehicle(vehicleRaw) : null;
	return {
		driverId: driver.id,
		driverName: driver.name,
		driverPhone: driver.phone,
		driverLicenceNumber: driver.licenceNumber,
		driverTransporter: driver.transporter,
		driverStatus: driver.status,
		vehicleId: vehicle?.id ?? driver.assignedVehicleId,
		vehiclePlate: vehicle?.plate ?? driver.assignedVehiclePlate,
		vehicleKind: vehicle?.kind ?? null,
		vehicleMake: vehicle?.make ?? null,
		vehicleModel: vehicle?.model ?? null,
		vehicleTransporter: vehicle?.transporter ?? null,
		assignedAt: raw?.assigned_at ?? raw?.assignedAt ?? null,
	};
};

export default function GateDriverAssignmentsPage() {
	const navigate = useNavigate();
	const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
	const [mode, setMode] = useState<Mode>("driver-first");
	const [pickingFor, setPickingFor] = useState<AssignmentRow | null>(null);
	const [assigning, setAssigning] = useState(false);

	const fetchAssignments = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("drivers/assignments/");
			const resp: Resp = res.data;
			if (resp.error) {
				const message =
					typeof resp.data === "string"
						? resp.data
						: "Could not load assignments.";
				setError(message);
				toast.error(message);
				setAssignments([]);
				return;
			}
			setAssignments(
				extractList<any>(resp.code ?? resp.data).map(normalizeAssignment)
			);
		} catch (err: any) {
			const message =
				err?.response?.data?.message ||
				err?.response?.data?.data ||
				"Could not load assignments.";
			setError(message);
			toast.error(message);
			setAssignments([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchAssignments();
	}, [fetchAssignments]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return assignments.filter((row) => {
			const matchQuery =
				!q ||
				row.driverName.toLowerCase().includes(q) ||
				row.driverPhone.toLowerCase().includes(q) ||
				row.driverLicenceNumber.toLowerCase().includes(q) ||
				row.driverTransporter.toLowerCase().includes(q) ||
				(row.vehiclePlate ?? "").toLowerCase().includes(q) ||
				(row.vehicleKind ?? "").toLowerCase().includes(q) ||
				(row.vehicleMake ?? "").toLowerCase().includes(q) ||
				(row.vehicleModel ?? "").toLowerCase().includes(q) ||
				(row.vehicleTransporter ?? "").toLowerCase().includes(q);
			const matchStatus =
				statusFilter === "all" || row.driverStatus === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [assignments, query, statusFilter]);

	const stats = useMemo(() => {
		const total = assignments.length;
		const assigned = assignments.filter((r) => r.vehicleId).length;
		const unassigned = assignments.filter((r) => !r.vehicleId).length;
		const pending = assignments.filter(
			(r) => r.driverStatus === "Pending review"
		).length;
		return { total, assigned, unassigned, pending };
	}, [assignments]);

	const handleAssign = async (driverId: string, vehicleId: string) => {
		setAssigning(true);
		try {
			const res = await http.post("driver/assign/", {
				driver_id: driverId,
				vehicle_id: vehicleId,
			});
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not assign vehicle.");
				return;
			}
			toast.success(
				typeof resp.data === "string" ? resp.data : "Vehicle assigned."
			);
			await fetchAssignments();
			setPickingFor(null);
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not assign vehicle."
			);
		} finally {
			setAssigning(false);
		}
	};

	const handleUnassign = async (driverId: string) => {
		setAssigning(true);
		try {
			const res = await http.post("driver/unassign/", { driver_id: driverId });
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(resp.data || "Could not unassign vehicle.");
				return;
			}
			toast.success(
				typeof resp.data === "string" ? resp.data : "Driver unassigned."
			);
			await fetchAssignments();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					err?.response?.data?.data ||
					"Could not unassign vehicle."
			);
		} finally {
			setAssigning(false);
		}
	};

	return (
		<AppShell title="Driver assignments" eyebrow="Gate control · Registry">
			<style>{pageAnimations}</style>
			<div className="space-y-5">
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
								Gate control · Assignment
							</p>
							<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
								Driver ↔ vehicle assignments
							</h2>
							<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
								Search, filter, and manage which driver is currently
								assigned to which vehicle. Use the toggle below to view
								assignments from the driver side or the vehicle side.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								className="border-line bg-paper text-ink hover:bg-sand"
								onClick={() => void fetchAssignments()}
								disabled={loading || assigning}
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
								onClick={() => navigate("/gate/drivers")}
							>
								<ArrowLeft className="mr-1.5 size-4" /> Drivers
							</Button>
							<Button
								variant="outline"
								className="border-line bg-paper text-ink hover:bg-sand"
								onClick={() => navigate("/gate/vehicles")}
							>
								<Truck className="mr-1.5 size-4" /> Vehicles
							</Button>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<Metric
							label="Total drivers"
							value={String(stats.total)}
							detail="Across all hauliers"
							tone="info"
							icon={User}
						/>
						<Metric
							label="Assigned"
							value={String(stats.assigned)}
							detail="Have an active vehicle"
							tone="success"
							icon={UserCheck}
						/>
						<Metric
							label="Unassigned"
							value={String(stats.unassigned)}
							detail="Blocked at gate-in"
							tone={stats.unassigned > 0 ? "warning" : "success"}
							icon={AlertTriangle}
						/>
						<Metric
							label="Pending review"
							value={String(stats.pending)}
							detail="Awaiting verification"
							tone="warning"
							icon={User}
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							View by
						</span>
						<button
							type="button"
							onClick={() => setMode("driver-first")}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
								mode === "driver-first"
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							<User className="size-3.5" />
							Driver → vehicle
						</button>
						<button
							type="button"
							onClick={() => setMode("vehicle-first")}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
								mode === "vehicle-first"
									? "bg-ink text-sand"
									: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
							)}
						>
							<Truck className="size-3.5" />
							Vehicle → driver
						</button>
					</div>

					<section className="rounded-xl bg-paper ring-1 ring-line">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
							<div className="relative min-w-[260px] flex-1">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search driver, phone, licence, transporter, plate, or vehicle…"
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
									Loading assignments…
								</span>
							</div>
						) : error ? (
							<div className="p-12 text-center">
								<AlertTriangle className="mx-auto size-7 text-coral" />
								<p className="mt-3 font-medium text-ink">
									Could not load assignments
								</p>
								<p className="mt-1 text-[12px] text-ink-soft">{error}</p>
								<Button
									onClick={() => void fetchAssignments()}
									className="mt-4 bg-orange text-white hover:bg-orange-deep"
								>
									Try again
								</Button>
							</div>
						) : filtered.length === 0 ? (
							<div className="p-12 text-center">
								<User className="mx-auto size-7 text-ink-soft" />
								<p className="mt-3 font-medium text-ink">
									No assignments match your filters.
								</p>
								<p className="mt-1 text-[12px] text-ink-soft">
									Try a different search or status.
								</p>
							</div>
						) : mode === "driver-first" ? (
							<DriverFirstTable
								rows={filtered}
								assigning={assigning}
								onAssign={(row) => setPickingFor(row)}
								onUnassign={(row) => void handleUnassign(row.driverId)}
							/>
						) : (
							<VehicleFirstTable
								rows={filtered}
								assigning={assigning}
								onAssign={(row) => setPickingFor(row)}
								onUnassign={(row) => void handleUnassign(row.driverId)}
							/>
						)}

						<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
							<span>
								Showing {filtered.length} of {assignments.length} assignment
								rows
							</span>
							<span>One active driver per vehicle</span>
						</div>
					</section>
				</div>
			</div>

			{pickingFor && (
				<AssignPicker
					row={pickingFor}
					assigning={assigning}
					onClose={() => setPickingFor(null)}
					onAssign={(vehicleId) =>
						handleAssign(pickingFor.driverId, vehicleId)
					}
				/>
			)}
		</AppShell>
	);
}

function DriverFirstTable({
	rows,
	assigning,
	onAssign,
	onUnassign,
}: {
	rows: AssignmentRow[];
	assigning: boolean;
	onAssign: (row: AssignmentRow) => void;
	onUnassign: (row: AssignmentRow) => void;
}) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1000px] text-left text-sm">
				<thead>
					<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						<th className="px-4 py-3 font-medium">Driver</th>
						<th className="px-4 py-3 font-medium">Contact</th>
						<th className="px-4 py-3 font-medium">Licence</th>
						<th className="px-4 py-3 font-medium">Transporter</th>
						<th className="px-4 py-3 font-medium">Assigned vehicle</th>
						<th className="px-4 py-3 font-medium">Status</th>
						<th className="px-4 py-3 font-medium text-right">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-line">
					{rows.map((row) => (
						<tr
							key={`driver-${row.driverId}`}
							className="transition-colors hover:bg-sand/60"
						>
							<td className="px-4 py-3.5">
								<p className="text-[12px] font-semibold text-ink">
									{row.driverName}
								</p>
							</td>
							<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
								{row.driverPhone}
							</td>
							<td className="px-4 py-3.5 font-mono text-[11px] text-ink">
								{row.driverLicenceNumber}
							</td>
							<td className="px-4 py-3.5 text-[11px] text-ink-soft">
								{row.driverTransporter}
							</td>
							<td className="px-4 py-3.5">
								{row.vehiclePlate ? (
									<span className="inline-flex items-center gap-1.5 rounded-md bg-teal/10 px-2 py-1 font-mono text-[11px] font-semibold text-teal-deep ring-1 ring-teal/25">
										<Truck className="size-3" />
										{row.vehiclePlate}
									</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-coral ring-1 ring-coral/20">
										<AlertTriangle className="size-3" />
										Unassigned
									</span>
								)}
							</td>
							<td className="px-4 py-3.5">
								<StatusBadge
									label={row.driverStatus}
									tone={statusTone(row.driverStatus)}
								/>
							</td>
							<td className="px-4 py-3.5 text-right">
								<div className="flex items-center justify-end gap-1.5">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onAssign(row)}
										disabled={assigning}
										className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
									>
										{row.vehicleId ? "Reassign" : "Assign"}
									</Button>
									{row.vehicleId && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onUnassign(row)}
											disabled={assigning}
											className="text-[11px] font-semibold text-coral hover:bg-coral/10"
										>
											<X className="mr-1 size-3.5" />
											Unassign
										</Button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function VehicleFirstTable({
	rows,
	assigning,
	onAssign,
	onUnassign,
}: {
	rows: AssignmentRow[];
	assigning: boolean;
	onAssign: (row: AssignmentRow) => void;
	onUnassign: (row: AssignmentRow) => void;
}) {
	const sorted = [...rows].sort((a, b) => {
		const av = a.vehiclePlate ?? "";
		const bv = b.vehiclePlate ?? "";
		if (av === bv) return a.driverName.localeCompare(b.driverName);
		return av.localeCompare(bv);
	});

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1000px] text-left text-sm">
				<thead>
					<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						<th className="px-4 py-3 font-medium">Vehicle</th>
						<th className="px-4 py-3 font-medium">Make / model</th>
						<th className="px-4 py-3 font-medium">Transporter</th>
						<th className="px-4 py-3 font-medium">Assigned driver</th>
						<th className="px-4 py-3 font-medium">Driver contact</th>
						<th className="px-4 py-3 font-medium">Status</th>
						<th className="px-4 py-3 font-medium text-right">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-line">
					{sorted.map((row) => (
						<tr
							key={`vehicle-${row.driverId}`}
							className="transition-colors hover:bg-sand/60"
						>
							<td className="px-4 py-3.5">
								{row.vehiclePlate ? (
									<span className="font-mono text-[12px] font-semibold text-ink">
										{row.vehiclePlate}
									</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-md bg-coral/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-coral ring-1 ring-coral/20">
										<AlertTriangle className="size-3" />
										No vehicle
									</span>
								)}
								{row.vehicleKind && (
									<p className="mt-0.5 text-[10px] text-ink-soft">
										{row.vehicleKind}
									</p>
								)}
							</td>
							<td className="px-4 py-3.5 text-[11px] text-ink-soft">
								{row.vehicleMake} {row.vehicleModel}
							</td>
							<td className="px-4 py-3.5 text-[11px] text-ink-soft">
								{row.vehicleTransporter}
							</td>
							<td className="px-4 py-3.5">
								<p className="text-[12px] font-semibold text-ink">
									{row.driverName}
								</p>
								<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
									{row.driverLicenceNumber}
								</p>
							</td>
							<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
								{row.driverPhone}
							</td>
							<td className="px-4 py-3.5">
								<StatusBadge
									label={row.driverStatus}
									tone={statusTone(row.driverStatus)}
								/>
							</td>
							<td className="px-4 py-3.5 text-right">
								<div className="flex items-center justify-end gap-1.5">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onAssign(row)}
										disabled={assigning}
										className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
									>
										{row.vehicleId ? "Reassign" : "Assign"}
									</Button>
									{row.vehicleId && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onUnassign(row)}
											disabled={assigning}
											className="text-[11px] font-semibold text-coral hover:bg-coral/10"
										>
											<X className="mr-1 size-3.5" />
											Unassign
										</Button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function AssignPicker({
	row,
	assigning,
	onClose,
	onAssign,
}: {
	row: AssignmentRow;
	assigning: boolean;
	onClose: () => void;
	onAssign: (vehicleId: string) => void;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Vehicle[]>([]);
	const [searching, setSearching] = useState(false);
	const [selected, setSelected] = useState<string | null>(row.vehicleId ?? null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const q = query.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout(async () => {
			setSearching(true);
			try {
				const res = await http.post("vehicles/search/", { q });
				const resp: Resp = res.data;
				if (cancelled) return;
				if (resp.error) {
					setResults([]);
					return;
				}
				setResults(
					extractList<any>(resp.code ?? resp.data).map(normalizeVehicle)
				);
			} catch {
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setSearching(false);
			}
		}, 300);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [query]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-10 pt-20 backdrop-blur-sm sm:items-center"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Assign vehicle
						</p>
						<h3 className="mt-1 truncate font-display text-lg font-bold text-ink">
							{row.driverName}
						</h3>
						<p className="mt-1 text-[11px] text-ink-soft">
							Search a vehicle by plate, make, model, or transporter.
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={onClose}
						disabled={assigning}
						aria-label="Close"
					>
						<X className="size-4" />
					</Button>
				</div>

				<div className="space-y-3 p-5">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							ref={inputRef}
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setSelected(null);
							}}
							placeholder="Type at least 2 characters…"
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="max-h-[280px] space-y-2 overflow-y-auto">
						{searching ? (
							<div className="flex items-center justify-center gap-2 py-6 text-xs text-ink-soft">
								<Loader2 className="size-3.5 animate-spin" />
								Searching…
							</div>
						) : query.trim().length < 2 ? (
							<p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-soft">
								Enter at least 2 characters to search.
							</p>
						) : results.length === 0 ? (
							<p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-soft">
								No vehicles match that search.
							</p>
						) : (
							results.map((v) => {
								const isSelected = selected === v.id;
								return (
									<button
										key={v.id}
										type="button"
										onClick={() => setSelected(v.id)}
										disabled={assigning}
										className={cn(
											"flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
											isSelected
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-paper hover:border-orange/50 hover:bg-orange/5"
										)}
									>
										<span
											className={cn(
												"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
												isSelected
													? "bg-orange text-white"
													: "bg-sand text-ink-soft ring-1 ring-line"
											)}
										>
											{isSelected ? (
												<Check className="size-4" />
											) : (
												<Truck className="size-4" />
											)}
										</span>
										<span className="min-w-0 flex-1">
											<span className="flex flex-wrap items-baseline gap-x-2">
												<span className="font-mono text-[12px] font-semibold text-ink">
													{v.plate}
												</span>
												<span className="text-[11px] text-ink-soft">
													{v.kind}
												</span>
											</span>
											<span className="mt-0.5 block text-[11px] text-ink-soft">
												{v.make} {v.model} · {v.transporter}
											</span>
										</span>
									</button>
								);
							})
						)}
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-line p-5">
					<Button
						variant="ghost"
						onClick={onClose}
						disabled={assigning}
						className="text-ink-soft"
					>
						Cancel
					</Button>
					<Button
						onClick={() => selected && onAssign(selected)}
						disabled={!selected || assigning}
						className="bg-orange text-white hover:bg-orange-deep"
					>
						{assigning ? (
							<Loader2 className="mr-1.5 size-4 animate-spin" />
						) : (
							<Check className="mr-1.5 size-4" />
						)}
						Confirm assignment
					</Button>
				</div>
			</div>
		</div>
	);
}