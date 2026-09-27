import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Calendar,
	CalendarCheck,
	CalendarPlus,
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

interface CustomerBooking {
	id: string;
	bookingRef: string;
	containerNo: string;
	slotTime: string;
	transporter: string;
	truckNo: string;
	driverPhone: string;
	cargoDescription: string;
	status: "Confirmed" | "Awaiting Slot" | "Completed" | "Cancelled";
}

const initialBookings: CustomerBooking[] = [
	{
		id: "cb-1",
		bookingRef: "TRN-BKG-9021",
		containerNo: "TRIU1234564",
		slotTime: "10:00 – 11:00 Today",
		transporter: "Apex Haulage Fleet",
		truckNo: "KJA-882-XD",
		driverPhone: "+234 803 112 3456",
		cargoDescription: "Telecommunications transceivers",
		status: "Confirmed",
	},
	{
		id: "cb-2",
		bookingRef: "TRN-BKG-9022",
		containerNo: "MSCU9876540",
		slotTime: "14:00 – 15:00 Today",
		transporter: "Direct Consignee Logistics",
		truckNo: "LSR-441-YY",
		driverPhone: "+234 802 987 6543",
		cargoDescription: "Industrial generator spares",
		status: "Confirmed",
	},
	{
		id: "cb-3",
		bookingRef: "TRN-BKG-9023",
		containerNo: "CMAU5544335",
		slotTime: "Tomorrow · Morning",
		transporter: "Kano Line Haulers",
		truckNo: "ABJ-220-ZZ",
		driverPhone: "+234 814 332 1199",
		cargoDescription: "Commercial inverters",
		status: "Awaiting Slot",
	},
];

export default function PortalBookingsRoute() {
	const [bookings, setBookings] = useState<CustomerBooking[]>(initialBookings);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [containerNo, setContainerNo] = useState("");
	const [transporter, setTransporter] = useState("");
	const [truckNo, setTruckNo] = useState("");
	const [driverPhone, setDriverPhone] = useState("");
	const [slotTime, setSlotTime] = useState("10:00 – 11:00");

	const filteredBookings = useMemo(() => {
		return bookings.filter((b) => {
			const matchQuery =
				b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.truckNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.transporter.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : b.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [bookings, searchQuery, statusFilter]);

	const handleCreateBooking = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo || !truckNo) {
			toast.error("Please provide container number and truck registration.");
			return;
		}

		const nextRef = `TRN-BKG-00${24 + bookings.length}`;
		const newBooking: CustomerBooking = {
			id: `cb-${bookings.length + 1}`,
			bookingRef: nextRef,
			containerNo: containerNo.toUpperCase(),
			slotTime: `${slotTime} Today`,
			transporter: transporter || "Assigned transporter",
			truckNo: truckNo.toUpperCase(),
			driverPhone: driverPhone || "—",
			cargoDescription: "Import cargo consignment",
			status: "Confirmed",
		};

		setBookings([newBooking, ...bookings]);
		setIsModalOpen(false);
		setContainerNo("");
		setTruckNo("");
		setTransporter("");
		setDriverPhone("");
		toast.success(`Booking ${nextRef} confirmed locally.`);
	};

	return (
		<AppShell title="Truck Pickups" eyebrow="Customer Portal · Booking Management">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Self-service logistics · Consignee access
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Schedule container pickup
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Book terminal access slots for your designated haulers once cargo readiness is
						confirmed.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Pickup itinerary exported locally.")}
					>
						<Download className="size-4" /> Export Bookings
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Book Pickup Slot
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active Bookings"
					value={String(bookings.filter((b) => b.status === "Confirmed").length)}
					detail="Confirmed at gate"
					tone="success"
					icon={CalendarCheck}
				/>
				<Metric
					label="Ready for Pickup"
					value="5 Containers"
					detail="Terminal obligations satisfied"
					tone="info"
					icon={CheckCircle2}
				/>
				<Metric
					label="Avg Gate-Out Time"
					value="38 mins"
					detail="Slot-based departure"
					tone="success"
					icon={Clock}
				/>
				<Metric
					label="Approved Haulers"
					value="12 Fleets"
					detail="Registered for terminal access"
					tone="info"
					icon={Truck}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by booking ref, container, plate, or transporter..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Confirmed", "Awaiting Slot", "Completed"].map((s) => (
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
								<th className="px-4 py-3 font-medium">Booking Ref</th>
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Reserved Window</th>
								<th className="px-4 py-3 font-medium">Assigned Truck</th>
								<th className="px-4 py-3 font-medium">Haulage Contractor</th>
								<th className="px-4 py-3 font-medium">Driver Phone</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredBookings.map((b) => (
								<tr key={b.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{b.bookingRef}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{b.containerNo}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">{b.slotTime}</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-ink">
										{b.truckNo}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{b.transporter}</td>
									<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
										{b.driverPhone}
									</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={b.status} tone={statusTone(b.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												toast.success(`Gate QR pass prepared for ${b.bookingRef}.`)
											}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											Gate QR Pass
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredBookings.length} of {bookings.length} haulage reservations
					</span>
					<span>Slot-based gate coordination</span>
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
									Book Truck Pickup Appointment
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Container Number
									</label>
									<Input
										required
										placeholder="e.g. TRIU1234564"
										value={containerNo}
										onChange={(e) => setContainerNo(e.target.value)}
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
										<option>13:00 – 14:00</option>
										<option>14:00 – 15:00</option>
										<option>15:00 – 16:00</option>
									</select>
								</div>
							</div>

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
										Haulage Company
									</label>
									<Input
										placeholder="e.g. Apex Haulage Ltd"
										value={transporter}
										onChange={(e) => setTransporter(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Driver Contact Phone
								</label>
								<Input
									placeholder="e.g. +234 803 112 3456"
									value={driverPhone}
									onChange={(e) => setDriverPhone(e.target.value)}
									className="mt-1.5 border-line bg-sand font-mono text-ink"
								/>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Reserve Pickup Slot
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}