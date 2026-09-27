import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Calendar,
	CheckCircle2,
	Clock,
	Download,
	Filter,
	Plus,
	Search,
	Truck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppointmentRecord {
	id: string;
	slotTime: string;
	truckNo: string;
	driverName: string;
	driverPhone: string;
	containerNo: string;
	cargoRef: string;
	status: "Confirmed" | "Arrived" | "In Terminal" | "Completed" | "Missed";
	lane: string;
}

const initialAppointments: AppointmentRecord[] = [
	{
		id: "apt-1",
		slotTime: "10:00 – 11:00",
		truckNo: "KJA-882-XD",
		driverName: "Babatunde Alao",
		driverPhone: "+234 803 112 3456",
		containerNo: "TRIU1234564",
		cargoRef: "TRN-IMP-002481",
		status: "Arrived",
		lane: "Gate Lane 01",
	},
	{
		id: "apt-2",
		slotTime: "10:30 – 11:30",
		truckNo: "LSR-441-YY",
		driverName: "Emeka Okoro",
		driverPhone: "+234 802 987 6543",
		containerNo: "MSCU9876540",
		cargoRef: "TRN-IMP-002482",
		status: "Confirmed",
		lane: "Gate Lane 02",
	},
	{
		id: "apt-3",
		slotTime: "11:00 – 12:00",
		truckNo: "ABJ-220-ZZ",
		driverName: "Suleiman Bello",
		driverPhone: "+234 814 332 1199",
		containerNo: "CMAU5544335",
		cargoRef: "TRN-IMP-002483",
		status: "Confirmed",
		lane: "Gate Lane 01",
	},
	{
		id: "apt-4",
		slotTime: "08:30 – 09:30",
		truckNo: "KTN-773-AA",
		driverName: "Yakubu Garba",
		driverPhone: "+234 805 441 2288",
		containerNo: "HLCU1122338",
		cargoRef: "TRN-IMP-002484",
		status: "Completed",
		lane: "Gate Lane 02",
	},
	{
		id: "apt-5",
		slotTime: "09:00 – 10:00",
		truckNo: "EKY-904-BB",
		driverName: "Femi Daniel",
		driverPhone: "+234 816 778 9900",
		containerNo: "ONEU9988774",
		cargoRef: "TRN-IMP-002485",
		status: "Missed",
		lane: "Gate Lane 01",
	},
];

export default function GateAppointmentsRoute() {
	const [appointments, setAppointments] = useState<AppointmentRecord[]>(initialAppointments);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [truckNo, setTruckNo] = useState("");
	const [driverName, setDriverName] = useState("");
	const [driverPhone, setDriverPhone] = useState("");
	const [containerNo, setContainerNo] = useState("");
	const [slotTime, setSlotTime] = useState("12:00 – 13:00");

	const filteredAppointments = useMemo(() => {
		return appointments.filter((item) => {
			const matchQuery =
				item.truckNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.cargoRef.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : item.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [appointments, searchQuery, statusFilter]);

	const handleCreateAppointment = (e: React.FormEvent) => {
		e.preventDefault();
		if (!truckNo || !driverName || !containerNo) {
			toast.error("Please fill in truck, driver, and container information.");
			return;
		}

		const newApt: AppointmentRecord = {
			id: `apt-${appointments.length + 1}`,
			slotTime,
			truckNo: truckNo.toUpperCase(),
			driverName,
			driverPhone: driverPhone || "—",
			containerNo: containerNo.toUpperCase(),
			cargoRef: `TRN-IMP-00${2486 + appointments.length}`,
			status: "Confirmed",
			lane: "Gate Lane 01",
		};

		setAppointments([newApt, ...appointments]);
		setIsModalOpen(false);
		setTruckNo("");
		setDriverName("");
		setDriverPhone("");
		setContainerNo("");
		toast.success(`Appointment confirmed locally for truck ${truckNo}.`);
	};

	return (
		<AppShell title="Truck Appointments" eyebrow="Gate Coordination · Fleet Scheduling">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal access · Traffic coordination
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Truck appointments & gate scheduling
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Coordinate hauler arrival slots around cargo readiness to prevent terminal road
						congestion.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Daily gate manifest exported locally.")}
					>
						<Download className="size-4" /> Export Schedule
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Book Appointment
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Today's Slots"
					value="48"
					detail="12 remaining available"
					tone="success"
					icon={Calendar}
				/>
				<Metric
					label="Expected Today"
					value={String(appointments.length)}
					detail="Across 2 gate lanes"
					tone="info"
					icon={Truck}
				/>
				<Metric
					label="Avg Turnaround"
					value="42 min"
					detail="6 min faster vs last week"
					tone="success"
					icon={Clock}
				/>
				<Metric
					label="Admittance Rate"
					value="95.8%"
					detail="Readiness checks passed at gate"
					tone="success"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by truck plate, driver name, container, or cargo ref..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Confirmed", "Arrived", "Completed", "Missed"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Slot Window</th>
								<th className="px-4 py-3 font-medium">Truck Plate</th>
								<th className="px-4 py-3 font-medium">Driver / Phone</th>
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Assigned Lane</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredAppointments.map((apt) => (
								<tr key={apt.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{apt.slotTime}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{apt.truckNo}
									</td>
									<td className="px-4 py-3.5">
										<p className="font-semibold text-ink">{apt.driverName}</p>
										<p className="font-mono text-[10px] text-ink-soft">
											{apt.driverPhone}
										</p>
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink">{apt.containerNo}</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{apt.lane}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={apt.status} tone={statusTone(apt.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												toast.success(`Gate check-in recorded for truck ${apt.truckNo}.`)
											}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											Check-In
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredAppointments.length} of {appointments.length} gate appointments
					</span>
					<span>Turnaround measured gate-in to gate-out</span>
				</div>
			</section>

			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
				>
					<div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Gate booking
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Book Truck Entry Slot
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleCreateAppointment} className="mt-5 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Truck Registration Plate
									</label>
									<Input
										required
										placeholder="e.g. KJA-882-XD"
										value={truckNo}
										onChange={(e) => setTruckNo(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Time Window
									</label>
									<select
										value={slotTime}
										onChange={(e) => setSlotTime(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>10:00 – 11:00</option>
										<option>11:00 – 12:00</option>
										<option>12:00 – 13:00</option>
										<option>13:00 – 14:00</option>
										<option>14:00 – 15:00</option>
										<option>15:00 – 16:00</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Driver Full Name
									</label>
									<Input
										required
										placeholder="e.g. Babatunde Alao"
										value={driverName}
										onChange={(e) => setDriverName(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Driver Phone Number
									</label>
									<Input
										placeholder="e.g. +234 803 112 3456"
										value={driverPhone}
										onChange={(e) => setDriverPhone(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Container Number to Load / Offload
								</label>
								<Input
									required
									placeholder="e.g. TRIU1234564"
									value={containerNo}
									onChange={(e) => setContainerNo(e.target.value)}
									className="mt-1.5 border-line bg-sand font-mono text-ink"
								/>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Confirm Booking
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}