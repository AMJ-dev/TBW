import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Filter,
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
import { cn } from "@/lib/utils";

type DriverStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents";

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

const vehicles: Vehicle[] = [
	{
		id: "v-1",
		plate: "KJA-882-XD",
		kind: "Container",
		make: "Mercedes-Benz",
		model: "Actros 2645",
		transporter: "Apex Haulage Fleet",
	},
	{
		id: "v-2",
		plate: "LSR-441-YY",
		kind: "Box",
		make: "MAN",
		model: "TGS 33.440",
		transporter: "Direct Consignee Logistics",
	},
	{
		id: "v-3",
		plate: "ABJ-220-ZZ",
		kind: "Reefer",
		make: "Volvo",
		model: "FH16 Reefer",
		transporter: "Coastal Freight Nigeria",
	},
	{
		id: "v-4",
		plate: "KTN-773-AA",
		kind: "Flatbed",
		make: "Scania",
		model: "R450",
		transporter: "Prime Haulage Ltd",
	},
];

const initialDrivers: Driver[] = [
	{
		id: "d-1",
		name: "Babatunde Alao",
		phone: "+234 803 112 3456",
		licenceNumber: "NG-DL-4821-7712",
		licenceExpiry: "14 Aug 2028",
		assignedVehicleId: "v-1",
		assignedVehiclePlate: "KJA-882-XD",
		transporter: "Apex Haulage Fleet",
		status: "Approved",
	},
	{
		id: "d-2",
		name: "Emeka Okoro",
		phone: "+234 802 987 6543",
		licenceNumber: "NG-DL-4410-8829",
		licenceExpiry: "22 Oct 2026",
		assignedVehicleId: "v-2",
		assignedVehiclePlate: "LSR-441-YY",
		transporter: "Direct Consignee Logistics",
		status: "Expired documents",
	},
	{
		id: "d-3",
		name: "Suleiman Bello",
		phone: "+234 814 332 1199",
		licenceNumber: "NG-DL-7712-3344",
		licenceExpiry: "30 Jun 2027",
		assignedVehicleId: "v-3",
		assignedVehiclePlate: "ABJ-220-ZZ",
		transporter: "Coastal Freight Nigeria",
		status: "Approved",
	},
	{
		id: "d-4",
		name: "Yakubu Garba",
		phone: "+234 805 441 2288",
		licenceNumber: "NG-DL-2234-9911",
		licenceExpiry: "18 Mar 2028",
		assignedVehicleId: null,
		assignedVehiclePlate: null,
		transporter: "Prime Haulage Ltd",
		status: "Pending review",
	},
];

const statusFilters: (DriverStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
];

const pageAnimations = `
	@keyframes slideInFromRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}
`;

type View = "list" | "assign";

export default function GateDriverAssignmentsPage() {
	useNavigate();
	const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
	const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
	const [view, setView] = useState<View>("list");

	const filtered = useMemo(() => {
		return drivers.filter((d) => {
			const matchQuery =
				d.name.toLowerCase().includes(query.toLowerCase()) ||
				d.phone.includes(query) ||
				d.licenceNumber.toLowerCase().includes(query.toLowerCase()) ||
				d.transporter.toLowerCase().includes(query.toLowerCase()) ||
				(d.assignedVehiclePlate ?? "").toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || d.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [drivers, query, statusFilter]);

	const stats = useMemo(() => {
		const total = drivers.length;
		const assigned = drivers.filter((d) => d.assignedVehicleId).length;
		const unassigned = drivers.filter((d) => !d.assignedVehicleId).length;
		const pending = drivers.filter((d) => d.status === "Pending review").length;
		return { total, assigned, unassigned, pending };
	}, [drivers]);

	const selectedDriver = useMemo(
		() => drivers.find((d) => d.id === selectedDriverId) ?? null,
		[drivers, selectedDriverId]
	);

	const openAssign = (driver: Driver) => {
		setSelectedDriverId(driver.id);
		setView("assign");
	};

	const closeAssign = () => {
		setSelectedDriverId(null);
		setView("list");
	};

	const handleAssign = (driverId: string, vehicleId: string) => {
		const vehicle = vehicles.find((v) => v.id === vehicleId);
		if (!vehicle) return;

		const conflict = drivers.find(
			(d) => d.id !== driverId && d.assignedVehicleId === vehicleId
		);
		if (conflict) {
			toast.error(`${vehicle.plate} is already assigned to ${conflict.name}.`);
			return;
		}

		setDrivers((prev) =>
			prev.map((d) =>
				d.id === driverId
					? {
							...d,
							assignedVehicleId: vehicle.id,
							assignedVehiclePlate: vehicle.plate,
					  }
					: d
			)
		);
		toast.success(`${vehicle.plate} assigned successfully.`);
		closeAssign();
	};

	const handleUnassign = (driverId: string) => {
		setDrivers((prev) =>
			prev.map((d) =>
				d.id === driverId
					? { ...d, assignedVehicleId: null, assignedVehiclePlate: null }
					: d
			)
		);
		toast.success("Driver unassigned.");
	};

	return (
		<AppShell title="Driver assignments" eyebrow="Gate control · Registry">
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
									Gate control · Assignment
								</p>
								<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
									Driver ↔ vehicle assignments
								</h2>
								<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
									Assign each approved driver to a registered vehicle. A vehicle
									can only have one active driver assignment. Unassigned drivers
									cannot complete a gate-in.
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									className="border-line bg-paper text-ink"
									onClick={() => (window.location.href = "/gate/drivers")}
								>
									<ArrowLeft className="mr-1.5 size-4" /> Back to drivers
								</Button>
								<Button
									variant="outline"
									className="border-line bg-paper text-ink"
									onClick={() => (window.location.href = "/gate/vehicles")}
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

						<section className="rounded-xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
								<div className="relative min-w-[260px] flex-1">
									<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
									<Input
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="Search by driver, phone, licence, transporter, or plate…"
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
									<User className="mx-auto size-7 text-ink-soft" />
									<p className="mt-3 font-medium text-ink">
										No drivers match your filters.
									</p>
									<p className="mt-1 text-[12px] text-ink-soft">
										Try a different name, phone, or status.
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full min-w-[1000px] text-left text-sm">
										<thead>
											<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												<th className="px-4 py-3 font-medium">Driver</th>
												<th className="px-4 py-3 font-medium">Contact</th>
												<th className="px-4 py-3 font-medium">Licence</th>
												<th className="px-4 py-3 font-medium">Transporter</th>
												<th className="px-4 py-3 font-medium">
													Assigned vehicle
												</th>
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
														<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
															Expires {d.licenceExpiry}
														</p>
													</td>
													<td className="px-4 py-3.5 text-[11px] text-ink-soft">
														{d.transporter}
													</td>
													<td className="px-4 py-3.5">
														{d.assignedVehiclePlate ? (
															<span className="inline-flex items-center gap-1.5 rounded-md bg-teal/10 px-2 py-1 font-mono text-[11px] font-semibold text-teal-deep ring-1 ring-teal/25">
																<Truck className="size-3" />
																{d.assignedVehiclePlate}
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
															label={d.status}
															tone={statusTone(d.status)}
														/>
													</td>
													<td className="px-4 py-3.5 text-right">
														<div className="flex items-center justify-end gap-1.5">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => openAssign(d)}
																className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
															>
																{d.assignedVehicleId ? "Reassign" : "Assign"}
															</Button>
															{d.assignedVehicleId && (
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => handleUnassign(d.id)}
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
							)}

							<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
								<span>
									Showing {filtered.length} of {drivers.length} drivers
								</span>
								<span>One active driver per vehicle</span>
							</div>
						</section>
					</div>
				)}

				{view === "assign" && selectedDriver && (
					<div
						key={selectedDriver.id}
						className="space-y-5 pb-8"
						style={{
							animation:
								"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
						}}
					>
						<div>
							<Button
								variant="ghost"
								onClick={closeAssign}
								className="-ml-3 gap-2 text-ink-soft hover:text-ink"
							>
								<ArrowLeft className="size-4" />
								Back to drivers
							</Button>
						</div>

						<div className="rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
								<div className="min-w-0">
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
										Assign vehicle
									</p>
									<h3 className="mt-1 break-words font-display text-xl font-bold text-ink">
										{selectedDriver.name}
									</h3>
									<p className="mt-1 text-[12px] text-ink-soft">
										{selectedDriver.transporter} · Licence{" "}
										{selectedDriver.licenceNumber}
									</p>
								</div>
								<StatusBadge
									label={selectedDriver.status}
									tone={statusTone(selectedDriver.status)}
								/>
							</div>

							<div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
								<InfoStat
									label="Phone"
									value={selectedDriver.phone}
									mono
								/>
								<InfoStat
									label="Licence expiry"
									value={selectedDriver.licenceExpiry}
									mono
								/>
								<InfoStat
									label="Current vehicle"
									value={
										selectedDriver.assignedVehiclePlate ?? "Unassigned"
									}
									mono
								/>
							</div>
						</div>

						<AssignVehiclePanel
							driver={selectedDriver}
							vehicles={vehicles}
							drivers={drivers}
							onAssign={(vehicleId) =>
								handleAssign(selectedDriver.id, vehicleId)
							}
							onUnassign={() => {
								handleUnassign(selectedDriver.id);
								closeAssign();
							}}
							onCancel={closeAssign}
						/>
					</div>
				)}
			</div>
		</AppShell>
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

function AssignVehiclePanel({
	driver,
	vehicles,
	drivers,
	onAssign,
	onUnassign,
	onCancel,
}: {
	driver: Driver;
	vehicles: Vehicle[];
	drivers: Driver[];
	onAssign: (vehicleId: string) => void;
	onUnassign: () => void;
	onCancel: () => void;
}) {
	const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
		driver.assignedVehicleId ?? ""
	);
	const [query, setQuery] = useState("");

	const filteredVehicles = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return vehicles;
		return vehicles.filter(
			(v) =>
				v.plate.toLowerCase().includes(q) ||
				v.make.toLowerCase().includes(q) ||
				v.model.toLowerCase().includes(q) ||
				v.transporter.toLowerCase().includes(q)
		);
	}, [vehicles, query]);

	const currentHolderOf = (vehicleId: string) =>
		drivers.find(
			(d) => d.id !== driver.id && d.assignedVehicleId === vehicleId
		);

	const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
	const selectedConflict = selectedVehicle
		? currentHolderOf(selectedVehicle.id)
		: null;

	return (
		<section className="rounded-2xl bg-paper ring-1 ring-line">
			<div className="border-b border-line p-5 sm:p-6">
				<h3 className="font-display text-sm font-bold text-ink">
					Select a vehicle
				</h3>
				<p className="mt-1 text-xs leading-5 text-ink-soft">
					A vehicle can only have one active driver. Vehicles already assigned
					to another driver are disabled.
				</p>
			</div>

			<div className="space-y-4 p-5 sm:p-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search by plate, make, model, or transporter…"
						className="h-10 border-line bg-sand pl-9 text-sm text-ink"
					/>
				</div>

				{filteredVehicles.length === 0 ? (
					<p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-soft">
						No vehicles match your search.
					</p>
				) : (
					<div className="space-y-2">
						{filteredVehicles.map((v) => {
							const conflict = currentHolderOf(v.id);
							const isSelected = selectedVehicleId === v.id;
							const disabled = Boolean(conflict);

							return (
								<button
									key={v.id}
									type="button"
									onClick={() => !disabled && setSelectedVehicleId(v.id)}
									disabled={disabled}
									className={cn(
										"flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
										disabled
											? "cursor-not-allowed border-line bg-sand/40 opacity-70"
											: isSelected
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-paper hover:border-orange/50 hover:bg-orange/5"
									)}
								>
									<span
										className={cn(
											"mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
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
										<span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
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
										{conflict && (
											<span className="mt-1 inline-flex items-center gap-1 rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
												<AlertTriangle className="size-2.5" />
												Assigned to {conflict.name}
											</span>
										)}
									</span>
								</button>
							);
						})}
					</div>
				)}

				{selectedConflict && (
					<div className="rounded-lg border border-coral/20 bg-coral/5 p-3 text-xs text-coral">
						{selectedVehicle?.plate} is already assigned to{" "}
						{selectedConflict.name}. Unassign them first to transfer the
						vehicle.
					</div>
				)}
			</div>

			<div className="flex flex-col-reverse items-stretch gap-2 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
				<Button
					variant="ghost"
					onClick={onCancel}
					className="text-ink-soft"
				>
					Cancel
				</Button>
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
					{driver.assignedVehicleId && (
						<Button
							variant="outline"
							onClick={onUnassign}
							className="border-line bg-paper text-coral hover:bg-coral/10"
						>
							<X className="mr-1.5 size-4" />
							Unassign current vehicle
						</Button>
					)}
					<Button
						onClick={() =>
							selectedVehicleId && onAssign(selectedVehicleId)
						}
						disabled={!selectedVehicleId || Boolean(selectedConflict)}
						className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
					>
						<Check className="mr-1.5 size-4" />
						{driver.assignedVehicleId
							? "Confirm reassignment"
							: "Assign vehicle"}
					</Button>
				</div>
			</div>
		</section>
	);
}