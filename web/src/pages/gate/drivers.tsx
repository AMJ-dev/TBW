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
	User,
	UserCheck,
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

interface Driver {
	id: string;
	name: string;
	phone: string;
	licenceNumber: string;
	licenceClass: string;
	licenceExpiry: string;
	assignedVehicle: string;
	transporter: string;
	status: DriverStatus;
	lastVisit: string;
	notes: string;
}

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

const statusFilters: (DriverStatus | "all")[] = [
	"all",
	"Approved",
	"Pending review",
	"Suspended",
	"Expired documents",
];

export default function GateDriversPage() {
	const navigate = useNavigate();
	const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all");
	const [removeTarget, setRemoveTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const filtered = useMemo(() => {
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

	const stats = useMemo(() => {
		const total = drivers.length;
		const approved = drivers.filter((d) => d.status === "Approved").length;
		const pending = drivers.filter((d) => d.status === "Pending review").length;
		const expired = drivers.filter((d) => d.status === "Expired documents").length;
		return { total, approved, pending, expired };
	}, [drivers]);

	const handleApprove = (id: string) => {
		setDrivers((prev) =>
			prev.map((d) =>
				d.id === id ? { ...d, status: "Approved" as DriverStatus } : d
			)
		);
		toast.success("Driver approved.");
	};

	const handleSuspend = (id: string) => {
		setDrivers((prev) =>
			prev.map((d) =>
				d.id === id ? { ...d, status: "Suspended" as DriverStatus } : d
			)
		);
		toast.success("Driver suspended.");
	};

	const handleRemove = () => {
		if (!removeTarget) return;
		setDrivers((prev) => prev.filter((d) => d.id !== removeTarget.id));
		toast.success(`${removeTarget.name} removed from the registry.`);
		setRemoveTarget(null);
	};

	const openEdit = (id: string) => {
		navigate(`/gate/driver/edit/${id}`);
	};

	return (
		<AppShell title="Drivers" eyebrow="Gate control · Registry">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate control · Approved haulage
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Driver registry
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Every driver visiting the terminal is registered with licence, contact
						details, and assigned vehicle. Expired licences block entry until
						renewed.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Driver registry exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export drivers
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => navigate("/gate/driver/add")}
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
					label="Approved"
					value={String(stats.approved)}
					detail="Cleared for gate entry"
					tone="success"
					icon={Check}
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

				{filtered.length === 0 ? (
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
											<StatusBadge
												label={d.status}
												tone={statusTone(d.status)}
											/>
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
													onClick={() => openEdit(d.id)}
													className="size-7 text-ink-soft hover:bg-orange/10 hover:text-orange-deep"
													aria-label={`Edit ${d.name}`}
												>
													<Pencil className="size-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() =>
														setRemoveTarget({ id: d.id, name: d.name })
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
							Gate officers verify the driver against the registry and check
							licence validity. Expired or suspended records block entry at the
							gate console. Every check is logged to the gate audit trail.
						</p>
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Checked at gate
						</p>
						<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
								Driver's licence (Class G or equivalent, not expired)
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
							They will no longer be able to enter the terminal as a registered
							driver. Historical records remain on the audit trail. You can
							register them again at any time.
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