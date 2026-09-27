import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Calendar,
	Check,
	Download,
	Filter,
	Plus,
	Search,
	ShieldCheck,
	Trash2,
	Truck,
	User,
	UserCheck,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VehicleStatus =
	| "Approved"
	| "Pending review"
	| "Suspended"
	| "Expired documents";

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
}

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceClass: string;
	licenceExpiry: string;
	assignedVehicle: string;
	transporter: string;
	status: VehicleStatus;
	lastVisit: string;
	notes: string;
}

const initialVehicles: Vehicle[] = [
	{
		id: "v-1",
		plate: "KJA-882-XD",
		kind: "Container",
		make: "Mercedes-Benz",
		model: "Actros 2645",
		year: "2021",
		capacity: "40 tonnes",
		owner: "Apex Haulage Fleet",
		transporter: "Apex Haulage Fleet",
		insuranceExpiry: "12 Mar 2027",
		roadworthinessExpiry: "30 Nov 2026",
		status: "Approved",
		lastVisit: "24 Sep 2026",
		notes: "Regular visitor. No incidents recorded.",
	},
	{
		id: "v-2",
		plate: "LSR-441-YY",
		kind: "Box",
		make: "MAN",
		model: "TGS 33.440",
		year: "2020",
		capacity: "32 tonnes",
		owner: "Direct Consignee Logistics",
		transporter: "Direct Consignee Logistics",
		insuranceExpiry: "08 Sep 2026",
		roadworthinessExpiry: "15 Jan 2027",
		status: "Expired documents",
		lastVisit: "22 Sep 2026",
		notes: "Insurance expired. Awaiting renewal before next visit.",
	},
	{
		id: "v-3",
		plate: "ABJ-220-ZZ",
		kind: "Reefer",
		make: "Volvo",
		model: "FH16 Reefer",
		year: "2022",
		capacity: "28 tonnes",
		owner: "Coastal Freight Nigeria",
		transporter: "Coastal Freight Nigeria",
		insuranceExpiry: "18 Jun 2027",
		roadworthinessExpiry: "22 May 2027",
		status: "Approved",
		lastVisit: "23 Sep 2026",
		notes: "Reefer unit inspected last month.",
	},
	{
		id: "v-4",
		plate: "KTN-773-AA",
		kind: "Flatbed",
		make: "Scania",
		model: "R450",
		year: "2019",
		capacity: "30 tonnes",
		owner: "Prime Haulage Ltd",
		transporter: "Prime Haulage Ltd",
		insuranceExpiry: "05 Nov 2026",
		roadworthinessExpiry: "12 Dec 2026",
		status: "Pending review",
		lastVisit: "—",
		notes: "Awaiting first visit. Documents received, review in progress.",
	},
];

const initialDrivers: Driver[] = [
	{
		id: "d-1",
		name: "Babatunde Alao",
		phone: "+234 803 112 3456",
		licenceNumber: "NG-DL-4821-7712",
		licenceClass: "Class G · Heavy goods",
		licenceExpiry: "14 Aug 2028",
		assignedVehicle: "KJA-882-XD",
		transporter: "Apex Haulage Fleet",
		status: "Approved",
		lastVisit: "24 Sep 2026",
		notes: "Registered driver for KJA-882-XD.",
	},
	{
		id: "d-2",
		name: "Emeka Okoro",
		phone: "+234 802 987 6543",
		licenceNumber: "NG-DL-4410-8829",
		licenceClass: "Class G · Heavy goods",
		licenceExpiry: "22 Oct 2026",
		assignedVehicle: "LSR-441-YY",
		transporter: "Direct Consignee Logistics",
		status: "Expired documents",
		lastVisit: "22 Sep 2026",
		notes: "Licence nearing expiry — needs renewal before next slot.",
	},
	{
		id: "d-3",
		name: "Suleiman Bello",
		phone: "+234 814 332 1199",
		licenceNumber: "NG-DL-7712-3344",
		licenceClass: "Class G · Heavy goods",
		licenceExpiry: "30 Jun 2027",
		assignedVehicle: "ABJ-220-ZZ",
		transporter: "Coastal Freight Nigeria",
		status: "Approved",
		lastVisit: "23 Sep 2026",
		notes: "Regular driver.",
	},
	{
		id: "d-4",
		name: "Yakubu Garba",
		phone: "+234 805 441 2288",
		licenceNumber: "NG-DL-2234-9911",
		licenceClass: "Class G · Heavy goods",
		licenceExpiry: "18 Mar 2028",
		assignedVehicle: "KTN-773-AA",
		transporter: "Prime Haulage Ltd",
		status: "Pending review",
		lastVisit: "—",
		notes: "Awaiting first visit for identity confirmation.",
	},
];

const vehicleStatuses: (VehicleStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
];

export default function GateVehiclesRoute() {
	const [tab, setTab] = useState<"vehicles" | "drivers">("vehicles");
	const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
	const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [removeTarget, setRemoveTarget] = useState<{ kind: "vehicle" | "driver"; id: string; name: string } | null>(null);

	const filteredVehicles = useMemo(() => {
		return vehicles.filter((v) => {
			const matchQuery =
				v.plate.toLowerCase().includes(query.toLowerCase()) ||
				v.owner.toLowerCase().includes(query.toLowerCase()) ||
				v.transporter.toLowerCase().includes(query.toLowerCase()) ||
				v.make.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || v.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [vehicles, query, statusFilter]);

	const filteredDrivers = useMemo(() => {
		return drivers.filter((d) => {
			const matchQuery =
				d.name.toLowerCase().includes(query.toLowerCase()) ||
				d.phone.includes(query) ||
				d.licenceNumber.toLowerCase().includes(query.toLowerCase()) ||
				d.transporter.toLowerCase().includes(query.toLowerCase()) ||
				d.assignedVehicle.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || d.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [drivers, query, statusFilter]);

	const vehicleStats = useMemo(() => {
		const total = vehicles.length;
		const approved = vehicles.filter((v) => v.status === "Approved").length;
		const pending = vehicles.filter((v) => v.status === "Pending review").length;
		const expired = vehicles.filter((v) => v.status === "Expired documents").length;
		return { total, approved, pending, expired };
	}, [vehicles]);

	const handleAdd = (next: Vehicle | Driver) => {
		if (tab === "vehicles") {
			setVehicles((prev) => [next as Vehicle, ...prev]);
			toast.success("Vehicle added locally.");
		} else {
			setDrivers((prev) => [next as Driver, ...prev]);
			toast.success("Driver added locally.");
		}
		setIsAddOpen(false);
	};

	const handleApprove = (id: string) => {
		if (tab === "vehicles") {
			setVehicles((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: "Approved" as VehicleStatus } : v))
			);
		} else {
			setDrivers((prev) =>
				prev.map((d) => (d.id === id ? { ...d, status: "Approved" as VehicleStatus } : d))
			);
		}
		toast.success("Record approved.");
	};

	const handleSuspend = (id: string) => {
		if (tab === "vehicles") {
			setVehicles((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: "Suspended" as VehicleStatus } : v))
			);
		} else {
			setDrivers((prev) =>
				prev.map((d) => (d.id === id ? { ...d, status: "Suspended" as VehicleStatus } : d))
			);
		}
		toast.success("Record suspended.");
	};

	const handleRemove = () => {
		if (!removeTarget) return;
		if (removeTarget.kind === "vehicle") {
			setVehicles((prev) => prev.filter((v) => v.id !== removeTarget.id));
		} else {
			setDrivers((prev) => prev.filter((d) => d.id !== removeTarget.id));
		}
		toast.success(`${removeTarget.name} removed from the registry.`);
		setRemoveTarget(null);
	};

	return (
		<AppShell title="Vehicle & driver registry" eyebrow="Gate control · Registry">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate control · Approved haulage
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Vehicle & driver registry
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Every truck and driver visiting the terminal is registered with plate,
						licence, insurance, and roadworthiness details. Expired documents block
						entry until renewed.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Registry exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export registry
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsAddOpen(true)}
					>
						<Plus className="mr-1.5 size-4" />
						Add {tab === "vehicles" ? "vehicle" : "driver"}
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Registered vehicles"
					value={String(vehicleStats.total)}
					detail="Across all hauliers"
					tone="info"
					icon={Truck}
				/>
				<Metric
					label="Approved"
					value={String(vehicleStats.approved)}
					detail="Cleared for gate entry"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Pending review"
					value={String(vehicleStats.pending)}
					detail="Awaiting verification"
					tone="warning"
					icon={UserCheck}
				/>
				<Metric
					label="Expired documents"
					value={String(vehicleStats.expired)}
					detail="Blocked until renewed"
					tone={vehicleStats.expired > 0 ? "critical" : "success"}
					icon={AlertTriangle}
				/>
			</div>

			<div className="flex gap-1 border-b border-line">
				<button
					type="button"
					onClick={() => setTab("vehicles")}
					className={cn(
						"border-b-2 px-4 py-3 text-[13px] font-medium transition-colors",
						tab === "vehicles"
							? "border-orange font-semibold text-ink"
							: "border-transparent text-ink-soft hover:border-line hover:text-ink"
					)}
				>
					<Truck className="mr-2 inline size-4" />
					Vehicles ({vehicles.length})
				</button>
				<button
					type="button"
					onClick={() => setTab("drivers")}
					className={cn(
						"border-b-2 px-4 py-3 text-[13px] font-medium transition-colors",
						tab === "drivers"
							? "border-orange font-semibold text-ink"
							: "border-transparent text-ink-soft hover:border-line hover:text-ink"
					)}
				>
					<User className="mr-2 inline size-4" />
					Drivers ({drivers.length})
				</button>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={
								tab === "vehicles"
									? "Search by plate, owner, transporter, or make..."
									: "Search by name, phone, licence, transporter, or plate..."
							}
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Filter className="size-4 text-ink-soft" />
						{vehicleStatuses.map((s) => (
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

				{tab === "vehicles" && (
					<>
						{filteredVehicles.length === 0 ? (
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
								<table className="w-full min-w-[1000px] text-left text-sm">
									<thead>
										<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											<th className="px-4 py-3 font-medium">Plate</th>
											<th className="px-4 py-3 font-medium">Kind / make</th>
											<th className="px-4 py-3 font-medium">Owner / transporter</th>
											<th className="px-4 py-3 font-medium">Insurance</th>
											<th className="px-4 py-3 font-medium">Roadworthiness</th>
											<th className="px-4 py-3 font-medium">Last visit</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{filteredVehicles.map((v) => (
											<tr key={v.id} className="transition-colors hover:bg-sand/60">
												<td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-ink">
													{v.plate}
												</td>
												<td className="px-4 py-3.5">
													<p className="text-[12px] text-ink">{v.kind}</p>
													<p className="mt-0.5 text-[11px] text-ink-soft">
														{v.make} {v.model} · {v.year}
													</p>
												</td>
												<td className="px-4 py-3.5">
													<p className="text-[12px] text-ink">{v.owner}</p>
													<p className="mt-0.5 text-[11px] text-ink-soft">
														{v.transporter} · {v.capacity}
													</p>
												</td>
												<td className="px-4 py-3.5">
													<p className="font-mono text-[11px] text-ink">
														{v.insuranceExpiry}
													</p>
												</td>
												<td className="px-4 py-3.5">
													<p className="font-mono text-[11px] text-ink">
														{v.roadworthinessExpiry}
													</p>
												</td>
												<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
													{v.lastVisit}
												</td>
												<td className="px-4 py-3.5">
													<StatusBadge label={v.status} tone={statusTone(v.status)} />
												</td>
												<td className="px-4 py-3.5 text-right">
													<div className="flex items-center justify-end gap-1.5">
														{v.status === "Pending review" && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleApprove(v.id)}
																className="text-[11px] font-semibold text-teal-deep hover:bg-teal/10"
															>
																<Check className="mr-1 size-3.5" />
																Approve
															</Button>
														)}
														{v.status !== "Suspended" && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleSuspend(v.id)}
																className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
															>
																<AlertTriangle className="mr-1 size-3.5" />
																Suspend
															</Button>
														)}
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setRemoveTarget({
																	kind: "vehicle",
																	id: v.id,
																	name: v.plate,
																})
															}
															className="size-7 text-ink-soft hover:bg-coral/10 hover:text-coral"
															aria-label={`Remove ${v.plate}`}
														>
															<Trash2 className="size-3.5" />
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				{tab === "drivers" && (
					<>
						{filteredDrivers.length === 0 ? (
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
											<th className="px-4 py-3 font-medium">Assigned vehicle</th>
											<th className="px-4 py-3 font-medium">Transporter</th>
											<th className="px-4 py-3 font-medium">Last visit</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{filteredDrivers.map((d) => (
											<tr key={d.id} className="transition-colors hover:bg-sand/60">
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
												<td className="px-4 py-3.5 font-mono text-[11px] text-ink">
													{d.assignedVehicle}
												</td>
												<td className="px-4 py-3.5 text-[11px] text-ink-soft">
													{d.transporter}
												</td>
												<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
													{d.lastVisit}
												</td>
												<td className="px-4 py-3.5">
													<StatusBadge label={d.status} tone={statusTone(d.status)} />
												</td>
												<td className="px-4 py-3.5 text-right">
													<div className="flex items-center justify-end gap-1.5">
														{d.status === "Pending review" && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleApprove(d.id)}
																className="text-[11px] font-semibold text-teal-deep hover:bg-teal/10"
															>
																<Check className="mr-1 size-3.5" />
																Approve
															</Button>
														)}
														{d.status !== "Suspended" && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleSuspend(d.id)}
																className="text-[11px] font-semibold text-orange-deep hover:bg-orange/10"
															>
																<AlertTriangle className="mr-1 size-3.5" />
																Suspend
															</Button>
														)}
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																setRemoveTarget({
																	kind: "driver",
																	id: d.id,
																	name: d.name,
																})
															}
															className="size-7 text-ink-soft hover:bg-coral/10 hover:text-coral"
															aria-label={`Remove ${d.name}`}
														>
															<Trash2 className="size-3.5" />
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						{tab === "vehicles"
							? `Showing ${filteredVehicles.length} of ${vehicles.length} vehicles`
							: `Showing ${filteredDrivers.length} of ${drivers.length} drivers`}
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
							Gate officers verify the plate against the registry and check document
							expiry. Expired or suspended records block entry at the gate console.
							Every check is logged to the gate audit trail.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Documents checked at gate
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
								Driver's licence (Class G or equivalent, not expired)
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Assigned vehicle matches the appointment
							</li>
						</ul>
					</div>
				</div>
			</div>

			{isAddOpen && (
				<AddRegistryModal
					kind={tab === "vehicles" ? "vehicle" : "driver"}
					onClose={() => setIsAddOpen(false)}
					onSubmit={handleAdd}
				/>
			)}

			{removeTarget && (
				<RemoveDialog
					name={removeTarget.name}
					kind={removeTarget.kind}
					onClose={() => setRemoveTarget(null)}
					onConfirm={handleRemove}
				/>
			)}
		</AppShell>
	);
}

function AddRegistryModal({
	kind,
	onClose,
	onSubmit,
}: {
	kind: "vehicle" | "driver";
	onClose: () => void;
	onSubmit: (record: Vehicle | Driver) => void;
}) {
	const [plate, setPlate] = useState("");
	const [vKind, setVKind] = useState<Vehicle["kind"]>("Container");
	const [make, setMake] = useState("");
	const [model, setModel] = useState("");
	const [year, setYear] = useState("");
	const [capacity, setCapacity] = useState("");
	const [owner, setOwner] = useState("");
	const [transporter, setTransporter] = useState("");
	const [insuranceExpiry, setInsuranceExpiry] = useState("");
	const [roadworthinessExpiry, setRoadworthinessExpiry] = useState("");
	const [notes, setNotes] = useState("");

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [licenceNumber, setLicenceNumber] = useState("");
	const [licenceClass, setLicenceClass] = useState("Class G · Heavy goods");
	const [licenceExpiry, setLicenceExpiry] = useState("");
	const [assignedVehicle, setAssignedVehicle] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (kind === "vehicle") {
			if (!plate.trim() || !owner.trim() || !transporter.trim()) {
				toast.error("Plate, owner, and transporter are required.");
				return;
			}
			onSubmit({
				id: `v-${Date.now()}`,
				plate,
				kind: vKind,
				make,
				model,
				year,
				capacity,
				owner,
				transporter,
				insuranceExpiry: insuranceExpiry || "—",
				roadworthinessExpiry: roadworthinessExpiry || "—",
				status: "Pending review",
				lastVisit: "—",
				notes: notes || "New vehicle awaiting review.",
			});
		} else {
			if (!name.trim() || !phone.trim() || !licenceNumber.trim()) {
				toast.error("Name, phone, and licence number are required.");
				return;
			}
			onSubmit({
				id: `d-${Date.now()}`,
				name,
				phone,
				licenceNumber,
				licenceClass,
				licenceExpiry: licenceExpiry || "—",
				assignedVehicle: assignedVehicle || "—",
				transporter: transporter || "—",
				status: "Pending review",
				lastVisit: "—",
				notes: notes || "New driver awaiting review.",
			});
		}
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
								New {kind}
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Register a {kind === "vehicle" ? "vehicle" : "driver"}
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								New records start in "Pending review" until verified by the gate
								supervisor.
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
						{kind === "vehicle" ? (
							<>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Plate"
										placeholder="KJA-882-XD"
										value={plate}
										onChange={setPlate}
										mono
										required
									/>
									<label className="block">
										<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											Kind
										</span>
										<select
											value={vKind}
											onChange={(e) => setVKind(e.target.value as Vehicle["kind"])}
											className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
										>
											<option value="Flatbed">Flatbed</option>
											<option value="Container">Container</option>
											<option value="Reefer">Reefer</option>
											<option value="Box">Box</option>
											<option value="Tanker">Tanker</option>
										</select>
									</label>
								</div>

								<div className="grid gap-3 sm:grid-cols-3">
									<Field label="Make" placeholder="Mercedes-Benz" value={make} onChange={setMake} />
									<Field label="Model" placeholder="Actros 2645" value={model} onChange={setModel} />
									<Field label="Year" placeholder="2021" value={year} onChange={setYear} mono />
								</div>

								<Field
									label="Capacity"
									placeholder="40 tonnes"
									value={capacity}
									onChange={setCapacity}
									mono
								/>

								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Owner"
										placeholder="Apex Haulage Fleet"
										value={owner}
										onChange={setOwner}
										required
									/>
									<Field
										label="Transporter"
										placeholder="Apex Haulage Fleet"
										value={transporter}
										onChange={setTransporter}
										required
									/>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Insurance expiry"
										placeholder="12 Mar 2027"
										value={insuranceExpiry}
										onChange={setInsuranceExpiry}
										mono
									/>
									<Field
										label="Roadworthiness expiry"
										placeholder="30 Nov 2026"
										value={roadworthinessExpiry}
										onChange={setRoadworthinessExpiry}
										mono
									/>
								</div>
							</>
						) : (
							<>
								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Full name"
										placeholder="Babatunde Alao"
										value={name}
										onChange={setName}
										required
									/>
									<Field
										label="Phone"
										placeholder="+234 803 112 3456"
										value={phone}
										onChange={setPhone}
										mono
										required
									/>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Licence number"
										placeholder="NG-DL-4821-7712"
										value={licenceNumber}
										onChange={setLicenceNumber}
										mono
										required
									/>
									<Field
										label="Licence class"
										placeholder="Class G · Heavy goods"
										value={licenceClass}
										onChange={setLicenceClass}
									/>
								</div>

								<Field
									label="Licence expiry"
									placeholder="14 Aug 2028"
									value={licenceExpiry}
									onChange={setLicenceExpiry}
									mono
								/>

								<div className="grid gap-3 sm:grid-cols-2">
									<Field
										label="Assigned vehicle"
										placeholder="KJA-882-XD"
										value={assignedVehicle}
										onChange={setAssignedVehicle}
										mono
									/>
									<Field
										label="Transporter"
										placeholder="Apex Haulage Fleet"
										value={transporter}
										onChange={setTransporter}
									/>
								</div>
							</>
						)}

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Anything the gate supervisor should know."
							/>
						</label>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<Calendar className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Document expiry reminders
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										TRINŪ can send a reminder before insurance, roadworthiness, or
										licence expiry. Expired documents block entry at the gate
										automatically.
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
							Register {kind} <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function RemoveDialog({
	name,
	kind,
	onClose,
	onConfirm,
}: {
	name: string;
	kind: "vehicle" | "driver";
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-md rounded-2xl bg-paper p-6 shadow-2xl ring-1 ring-line">
				<div className="flex items-start gap-3">
					<div className="grid size-11 shrink-0 place-items-center rounded-full bg-coral/10 text-coral">
						<AlertTriangle className="size-5" />
					</div>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
							Remove from registry
						</p>
						<h3 className="mt-1 font-display text-lg font-bold text-ink">
							Remove {name}?
						</h3>
						<p className="mt-2 text-[12px] leading-5 text-ink-soft">
							They will no longer be able to enter the terminal as a registered{" "}
							{kind === "vehicle" ? "vehicle" : "driver"}. Historical records remain
							on the audit trail. You can register them again at any time.
						</p>
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onClose} className="border-line bg-paper text-ink">
						Keep record
					</Button>
					<Button onClick={onConfirm} className="bg-coral text-white hover:bg-coral/90">
						Remove
					</Button>
				</div>
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