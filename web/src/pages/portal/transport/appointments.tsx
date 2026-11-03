
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Calendar,
	CheckCircle2,
	Clock,
	Download,
	Filter,
	LoaderCircle,
	Plus,
	RefreshCw,
	Search,
	Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
	AppShell,
	StatusBadge,
	statusTone,
	Metric,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import {copy_text} from "@/lib/functions"

type AppointmentStatus =
	| "Confirmed"
	| "Arrived"
	| "In Terminal"
	| "Completed"
	| "Missed"
	| "Cancelled";

interface AppointmentRecord {
	id: string;
	pass_id: string;
	booking_ref: string;
	appointmentDate: string;
	slotTime: string;
	truckNo: string;
	driverName: string;
	driverPhone: string;
	containerNos: string[];
	cargoRef: string;
	status: AppointmentStatus;
	lane: string;
}

interface ApiAppointment {
	id?: string | number;
	pass_id?: string | number;
	booking_ref?: string;
	appointment_id?: string | number;
	appointment_date?: string;
	date?: string;
	slot_time?: string;
	slotTime?: string;
	vehicle_plate?: string;
	truck_no?: string;
	plate?: string;
	driver_name?: string;
	driverName?: string;
	driver_phone?: string;
	driverPhone?: string;
	container_nos?: string[] | string;
	container_no?: string;
	containerNos?: string[];
	cargo_ref?: string;
	cargo_reference?: string;
	status?: string;
	lane?: string;
	assigned_lane?: string;
}

function extractList<T>(response: Resp): T[] {
	const payload = response.code ?? response.data;

	if (Array.isArray(payload)) {
		return payload as T[];
	}

	if (payload && typeof payload === "object") {
		const record = payload as Record<string, unknown>;

		for (const key of ["appointments", "results", "items", "data"]) {
			if (Array.isArray(record[key])) {
				return record[key] as T[];
			}
		}
	}

	return [];
}

function normalizeStatus(value?: string): AppointmentStatus {
	const status = (value ?? "").trim().toLowerCase().replace(/_/g, " ");

	const statuses: Record<string, AppointmentStatus> = {
		confirmed: "Confirmed",
		arrived: "Arrived",
		"in terminal": "In Terminal",
		completed: "Completed",
		missed: "Missed",
		cancelled: "Cancelled",
		canceled: "Cancelled",
	};

	return statuses[status] ?? "Confirmed";
}

function normalizeAppointment(item: ApiAppointment): AppointmentRecord {
	const rawContainers =
		item.container_nos ?? item.containerNos ?? item.container_no ?? [];

	const containerNos = Array.isArray(rawContainers)
		? rawContainers.map(String).filter(Boolean)
		: String(rawContainers)
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean);

	return {
		id: String(item.id ?? item.appointment_id ?? ""),
		pass_id: String(item.pass_id ?? ""),
		booking_ref: String(item.booking_ref ?? ""),
		appointmentDate: String(item.appointment_date ?? item.date ?? ""),
		slotTime: String(item.slot_time ?? item.slotTime ?? ""),
		truckNo: String(
			item.vehicle_plate ?? item.truck_no ?? item.plate ?? "",
		),
		driverName: String(item.driver_name ?? item.driverName ?? ""),
		driverPhone: String(item.driver_phone ?? item.driverPhone ?? ""),
		containerNos,
		cargoRef: String(
			item.cargo_ref ?? item.cargo_reference ?? "",
		),
		status: normalizeStatus(item.status),
		lane: String(item.assigned_lane ?? item.lane ?? ""),
	};
}

function getErrorMessage(resp: Resp, fallback: string): string {
	return typeof resp.data === "string" && resp.data
		? resp.data
		: fallback;
}

function formatDate(date: string): string {
	if (!date) return "—";

	const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

	if (Number.isNaN(parsed.getTime())) return date;

	return parsed.toLocaleDateString(undefined, {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function escapeCsv(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

export default function GateAppointmentsRoute() {
	const navigate = useNavigate();

	const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [checkingIn, setCheckingIn] = useState<string | null>(null);

	const loadAppointments = useCallback(async (refresh = false) => {
		if (refresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		try {
			const res = await http.get("appointments/");
			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(
					getErrorMessage(resp, "Could not load appointments."),
				);
				return;
			}

			const records = extractList<ApiAppointment>(resp)
				.map(normalizeAppointment)
				.filter((item) => item.id);

			setAppointments(records);
		} catch {
			toast.error("Could not load appointments. Please try again.");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		void loadAppointments();
	}, [loadAppointments]);

	const today = new Date();
	const todayString = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, "0"),
		String(today.getDate()).padStart(2, "0"),
	].join("-");

	const todaysAppointments = useMemo(
		() =>
			appointments.filter(
				(item) => item.appointmentDate.slice(0, 10) === todayString,
			),
		[appointments, todayString],
	);

	const confirmedToday = todaysAppointments.filter(
		(item) => item.status === "Confirmed",
	).length;

	const arrivedToday = todaysAppointments.filter(
		(item) =>
			item.status === "Arrived" || item.status === "In Terminal",
	).length;

	const filteredAppointments = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		return appointments.filter((item) => {
			const searchable = [
				item.truckNo,
				item.driverName,
				item.driverPhone,
				item.cargoRef,
				...item.containerNos,
			]
				.join(" ")
				.toLowerCase();

			const matchesQuery = searchable.includes(query);
			const matchesStatus =
				statusFilter === "ALL" || item.status === statusFilter;

			return matchesQuery && matchesStatus;
		});
	}, [appointments, searchQuery, statusFilter]);

	const handleExport = () => {
		if (filteredAppointments.length === 0) {
			toast.info("There are no appointments to export.");
			return;
		}

		const rows = [
			[
				"Appointment ID",
				"Appointment Date",
				"Slot",
				"Truck Plate",
				"Driver",
				"Driver Phone",
				"Containers",
				"Cargo Reference",
				"Status",
				"Assigned Lane",
			],
			...filteredAppointments.map((item) => [
				item.id,
				item.appointmentDate,
				item.slotTime,
				item.truckNo,
				item.driverName,
				item.driverPhone,
				item.containerNos.join(", "),
				item.cargoRef,
				item.status,
				item.lane,
			]),
		];

		const csv = rows
			.map((row) => row.map((value) => escapeCsv(String(value))).join(","))
			.join("\r\n");

		const blob = new Blob(["\uFEFF", csv], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = `gate-appointments-${todayString}.csv`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<AppShell
			title="Truck Appointments"
			eyebrow="Gate Coordination · Fleet Scheduling"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal access · Traffic coordination
					</p>

					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Truck appointments & gate scheduling
					</h2>

					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Manage truck bookings, review arrival schedules, and record
						confirmed appointments at the terminal gate.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={handleExport}
						disabled={loading || filteredAppointments.length === 0}
					>
						<Download className="size-4" />
						Export Schedule
					</Button>

					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => void loadAppointments(true)}
						disabled={loading || refreshing}
					>
						<RefreshCw
							className={`size-4 ${refreshing ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>

					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => navigate("/portal/appointments/book")}
					>
						<Plus className="size-4" />
						Book Appointment
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				<Metric
					label="Today's Appointments"
					value={loading ? "—" : String(todaysAppointments.length)}
					detail="Bookings scheduled for today"
					tone="info"
					icon={Calendar}
				/>

				<Metric
					label="Expected Today"
					value={loading ? "—" : String(confirmedToday)}
					detail="Confirmed appointments"
					tone="success"
					icon={Truck}
				/>

				<Metric
					label="Arrived Today"
					value={loading ? "—" : String(arrivedToday)}
					detail="Arrived or currently in terminal"
					tone="info"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search plate, driver, phone, container, or cargo reference..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" />
							Status:
						</span>

						{[
							"ALL",
							"Confirmed",
							"Arrived",
							"In Terminal",
							"Completed",
							"Missed",
							"Cancelled",
						].map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => setStatusFilter(status)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === status
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{status === "ALL" ? "All" : status}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[1050px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Booking Ref</th>
								<th className="px-4 py-3 font-medium">Appointment</th>
								<th className="px-4 py-3 font-medium">Slot Window</th>
								<th className="px-4 py-3 font-medium">Truck Plate</th>
								<th className="px-4 py-3 font-medium">Driver / Phone</th>
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Assigned Lane</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium">Actions</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-line">
							{loading ? (
								<tr>
									<td colSpan={9} className="px-4 py-12 text-center">
										<LoaderCircle className="mx-auto mb-3 size-5 animate-spin text-orange" />
										<p className="text-sm text-ink-soft">
											Loading appointments...
										</p>
									</td>
								</tr>
							) : filteredAppointments.length === 0 ? (
								<tr>
									<td
										colSpan={9}
										className="px-4 py-12 text-center text-sm text-ink-soft"
									>
										<Search className="mx-auto mb-3 size-5 opacity-50" />
										No appointments match your search or status filter.
									</td>
								</tr>
							) : (
								filteredAppointments.map((appointment) => (
									<tr
										key={appointment.id}
										className="transition-colors hover:bg-sand/60"
									>
										<td className="cursor-pointer px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep" onClick={() => copy_text(appointment.booking_ref)}>
											{appointment.booking_ref || "—"}
										</td>

										<td className="px-4 py-3.5 text-xs text-ink">
											{formatDate(appointment.appointmentDate)}
											<p className="mt-1 font-mono text-[10px] text-ink-soft">
												{appointment.id}
											</p>
										</td>


										<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
											{appointment.slotTime || "—"}
										</td>

										<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
											{appointment.truckNo || "—"}
										</td>

										<td className="px-4 py-3.5">
											<p className="font-semibold text-ink">
												{appointment.driverName || "—"}
											</p>
											<p className="font-mono text-[10px] text-ink-soft">
												{appointment.driverPhone || "—"}
											</p>
										</td>

										<td className="px-4 py-3.5 font-mono text-xs text-ink">
											{appointment.containerNos.length
												? appointment.containerNos.join(", ")
												: "—"}
										</td>

										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{appointment.lane || "—"}
										</td>

										<td className="px-4 py-3.5">
											<StatusBadge
												label={appointment.status}
												tone={statusTone(appointment.status)}
											/>
										</td>
										
										<td className="px-4 py-3.5 text-right">
											{
												appointment.pass_id && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => navigate(`/portal/passes/${appointment.pass_id}`)}
														className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
													>
														Gate QR Pass
													</Button>
												)
											}
											
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredAppointments.length} of {appointments.length} appointments
					</span>
					<span>
						{loading ? "Loading from server" : "Live API data"}
					</span>
				</div>
			</section>
		</AppShell>
	);
}
