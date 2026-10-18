import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertTriangle,
	Check,
	Download,
	Filter,
	Pencil,
	Plus,
	Search,
	ShieldCheck,
	Trash2,
	Truck,
	UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
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

const vehicleStatuses: (VehicleStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
];

export default function GateVehiclesRoute() {
	const navigate = useNavigate();
	const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<VehicleStatus | "all">("all");
	const [removeTarget, setRemoveTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

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

	const vehicleStats = useMemo(() => {
		const total = vehicles.length;
		const approved = vehicles.filter((v) => v.status === "Approved").length;
		const pending = vehicles.filter((v) => v.status === "Pending review").length;
		const expired = vehicles.filter((v) => v.status === "Expired documents").length;
		return { total, approved, pending, expired };
	}, [vehicles]);

	const handleApprove = (id: string) => {
		setVehicles((prev) =>
			prev.map((v) =>
				v.id === id ? { ...v, status: "Approved" as VehicleStatus } : v
			)
		);
		toast.success("Vehicle approved.");
	};

	const handleSuspend = (id: string) => {
		setVehicles((prev) =>
			prev.map((v) =>
				v.id === id ? { ...v, status: "Suspended" as VehicleStatus } : v
			)
		);
		toast.success("Vehicle suspended.");
	};

	const handleRemove = () => {
		if (!removeTarget) return;
		setVehicles((prev) => prev.filter((v) => v.id !== removeTarget.id));
		toast.success(`${removeTarget.name} removed from the registry.`);
		setRemoveTarget(null);
	};

	const openEdit = (id: string) => {
		navigate(`/gate/vehicle/edit/${id}`);
	};

	return (
		<AppShell title="Vehicle registry" eyebrow="Gate control · Registry">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate control · Approved haulage
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Vehicle registry
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Every truck visiting the terminal is registered with plate, insurance,
						and roadworthiness details. Expired documents block entry until
						renewed.
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

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by plate, owner, transporter, or make..."
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
													onClick={() => openEdit(v.id)}
													className="size-7 text-ink-soft hover:bg-orange/10 hover:text-orange-deep"
													aria-label={`Edit ${v.plate}`}
												>
													<Pencil className="size-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														setRemoveTarget({
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

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredVehicles.length} of {vehicles.length} vehicles
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
							Only registered vehicles reach the gate
						</h3>
						<p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-soft">
							Gate officers verify the plate against the registry and check
							document expiry. Expired or suspended records block entry at the
							gate console. Every check is logged to the gate audit trail.
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
						</ul>
					</div>
				</div>
			</div>

			{removeTarget && (
				<RemoveDialog
					name={removeTarget.name}
					onClose={() => setRemoveTarget(null)}
					onConfirm={handleRemove}
				/>
			)}
		</AppShell>
	);
}

function RemoveDialog({
	name,
	onClose,
	onConfirm,
}: {
	name: string;
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
							It will no longer be able to enter the terminal as a registered
							vehicle. Historical records remain on the audit trail. You can
							register it again at any time.
						</p>
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={onClose}
						className="border-line bg-paper text-ink"
					>
						Keep record
					</Button>
					<Button
						onClick={onConfirm}
						className="bg-coral text-white hover:bg-coral/90"
					>
						Remove
					</Button>
				</div>
			</div>
		</div>
	);
}