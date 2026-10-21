
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Calendar,
	Check,
	ChevronDown,
	LoaderCircle,
	Plus,
	Search,
	Trash2,
	Truck,
	UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

const slots = [
	"08:00 – 09:00",
	"09:00 – 10:00",
	"10:00 – 11:00",
	"11:00 – 12:00",
	"12:00 – 13:00",
	"13:00 – 14:00",
	"14:00 – 15:00",
	"15:00 – 16:00",
];

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

interface Driver {
	id: string;
	name: string;
	phone: string;
	status: string;
	licence_number?: string | null;
	licence_class?: string | null;
	licence_expiry?: string | null;
}

interface Vehicle {
	id: string;
	plate: string;
	kind?: string;
	make?: string | null;
	model?: string | null;
	year?: number | null;
	capacity?: string | null;
	owner?: string | null;
	transporter?: string | null;
	status: string;
	drivers: Driver[];
	assigned_drivers?: Driver[];
}

function extractList<T>(response: Resp): T[] {
	const result = response as {
		error?: boolean;
		data?: unknown;
		code?: unknown;
	};

	const value = result.code ?? result.data;

	if (Array.isArray(value)) {
		return value as T[];
	}

	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;

		for (const key of ["vehicles", "results", "items", "data"]) {
			if (Array.isArray(obj[key])) {
				return obj[key] as T[];
			}
		}
	}

	return [];
}

export default function GateBookAppointmentsPage() {
	const navigate = useNavigate();

	const [vehicleQuery, setVehicleQuery] = useState("");
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [selectedVehicle, setSelectedVehicle] =
		useState<Vehicle | null>(null);
	const [selectedDriver, setSelectedDriver] =
		useState<Driver | null>(null);

	const [vehicleDropdown, setVehicleDropdown] = useState(false);
	const [searchingVehicles, setSearchingVehicles] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [containerNos, setContainerNos] = useState([""]);
	const [slotTime, setSlotTime] = useState("10:00 – 11:00");
	const [appointmentDate, setAppointmentDate] = useState("");

	const vehicleRequest = useRef(0);

	useEffect(() => {
		const query = vehicleQuery.trim();
		const requestId = ++vehicleRequest.current;

		if (selectedVehicle || query.length < 2) {
			setVehicles([]);
			setSearchingVehicles(false);
			return;
		}

		const timer = setTimeout(async () => {
			setSearchingVehicles(true);

			try {
				const response = await http.post("vehicles/search/", {
					q: query,
					include_assigned: 1,
				});

				const resp: Resp = response.data;

				if (requestId !== vehicleRequest.current) return;

				if (resp.error) {
					setVehicles([]);
					return;
				}

				setVehicles(extractList<Vehicle>(resp));
			} catch {
				if (requestId === vehicleRequest.current) {
					setVehicles([]);
				}
			} finally {
				if (requestId === vehicleRequest.current) {
					setSearchingVehicles(false);
				}
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [vehicleQuery, selectedVehicle]);

	const vehicleDrivers =
		selectedVehicle?.drivers ??
		selectedVehicle?.assigned_drivers ??
		[];

	const approvedDrivers = vehicleDrivers.filter(
		(driver) => driver.status?.toLowerCase() === "approved",
	);

	const handleSelectVehicle = (vehicle: Vehicle) => {
		vehicleRequest.current++;

		setSelectedVehicle(vehicle);
		setVehicleQuery(vehicle.plate);
		setVehicleDropdown(false);
		setVehicles([]);

		const drivers = (
			vehicle.drivers ??
			vehicle.assigned_drivers ??
			[]
		).filter((driver) => driver.status?.toLowerCase() === "approved");

		setSelectedDriver(drivers.length === 1 ? (drivers[0] ?? null) : null);

		if (drivers.length === 0) {
			toast.error("This vehicle has no approved assigned driver.");
		}
	};

	const handleChangeVehicle = () => {
		vehicleRequest.current++;

		setSelectedVehicle(null);
		setSelectedDriver(null);
		setVehicleQuery("");
		setVehicles([]);
		setVehicleDropdown(false);
	};

	const handleContainerChange = (index: number, value: string) => {
		setContainerNos((current) =>
			current.map((container, i) =>
				i === index ? value : container,
			),
		);
	};

	const handleAddContainer = () => {
		setContainerNos((current) => [...current, ""]);
	};

	const handleRemoveContainer = (index: number) => {
		setContainerNos((current) =>
			current.filter((_, i) => i !== index),
		);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (submitting) return;

		if (!selectedVehicle || !selectedDriver) {
			toast.error("Select a registered vehicle and assigned driver.");
			return;
		}

		const normalizedContainers = containerNos.map((container) =>
			container.trim().toUpperCase(),
		);

		if (normalizedContainers.some((container) => !container)) {
			toast.error("Enter a container number in every field.");
			return;
		}

		if (new Set(normalizedContainers).size !== normalizedContainers.length) {
			toast.error("Remove duplicate container numbers.");
			return;
		}

		if (!appointmentDate) {
			toast.error("Select an appointment date.");
			return;
		}

		const today = new Date();
		const localToday = [
			today.getFullYear(),
			String(today.getMonth() + 1).padStart(2, "0"),
			String(today.getDate()).padStart(2, "0"),
		].join("-");

		if (appointmentDate < localToday) {
			toast.error("Choose today or a future appointment date.");
			return;
		}

		setSubmitting(true);

		try {
			const response = await http.post("/appointments/add/", {
				vehicle_id: selectedVehicle.id,
				driver_id: selectedDriver.id,
				container_nos: normalizedContainers,
				appointment_date: appointmentDate,
				slot_time: slotTime,
			});

			const resp: Resp = response.data;

			if (resp.error) {
				toast.error(
					typeof resp.data === "string"
						? resp.data
						: "Could not book the appointment.",
				);
				return;
			}

			toast.success("Appointment booked successfully.");
			navigate("/portal/appointments");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not book the appointment.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AppShell
			title="Book appointment"
			eyebrow="Gate coordination · Fleet scheduling"
		>
			<div className="mx-auto max-w-3xl space-y-6 pb-10">
				<Button
					type="button"
					variant="ghost"
					onClick={() => navigate("/portal/appointments")}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to appointments
				</Button>

				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate coordination · New booking
					</p>

					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Schedule truck entry
					</h2>

					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Select a registered vehicle and its assigned driver,
						add one or more containers, and choose an arrival slot.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<section className="space-y-5 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex items-center gap-2">
							<span className="grid size-9 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Truck className="size-4" />
							</span>

							<h3 className="font-display text-sm font-bold text-ink">
								Vehicle and assigned driver
							</h3>
						</div>

						<div className="relative">
							<label className={labelClass}>
								Truck registration plate
							</label>

							<div className="relative mt-2">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

								<Input
									value={vehicleQuery}
									onChange={(event) => {
										setVehicleQuery(event.target.value);
										setSelectedVehicle(null);
										setSelectedDriver(null);
										setVehicles([]);
										setVehicleDropdown(true);
									}}
									onFocus={() => setVehicleDropdown(true)}
									onBlur={() => {
										setTimeout(() => setVehicleDropdown(false), 150);
									}}
									placeholder="Type a vehicle plate, make, or model..."
									autoComplete="off"
									required
									className="h-11 border-line bg-sand pl-9 pr-10 text-ink"
								/>

								{searchingVehicles ? (
									<LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-soft" />
								) : (
									<ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
								)}
							</div>

							{vehicleDropdown &&
								!selectedVehicle &&
								vehicleQuery.trim().length >= 2 && (
									<div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-paper shadow-xl">
										{searchingVehicles ? (
											<div className="flex items-center gap-2 p-4 text-sm text-ink-soft">
												<LoaderCircle className="size-4 animate-spin" />
												Searching registered vehicles...
											</div>
										) : vehicles.length > 0 ? (
											vehicles.map((vehicle) => {
												const drivers = (
													vehicle.drivers ??
													vehicle.assigned_drivers ??
													[]
												).filter(
													(driver) =>
														driver.status?.toLowerCase() === "approved",
												);

												return (
													<button
														key={vehicle.id}
														type="button"
														onMouseDown={(event) =>
															event.preventDefault()
														}
														onClick={() =>
															handleSelectVehicle(vehicle)
														}
														className="flex w-full items-center justify-between gap-3 border-b border-line p-3 text-left last:border-0 hover:bg-sand"
													>
														<span>
															<span className="block font-mono text-sm font-bold text-ink">
																{vehicle.plate}
															</span>

															<span className="mt-1 block text-xs text-ink-soft">
																{[
																	vehicle.kind,
																	vehicle.make,
																	vehicle.model,
																	vehicle.year,
																]
																	.filter(Boolean)
																	.join(" · ") ||
																	"Registered vehicle"}
															</span>

															<span className="mt-1 block text-xs text-ink-soft">
																{drivers.length} approved assigned driver(s)
															</span>
														</span>

														<Check className="size-4 shrink-0 text-orange" />
													</button>
												);
											})
										) : (
											<p className="p-4 text-sm text-ink-soft">
												No matching approved vehicles found.
											</p>
										)}
									</div>
								)}

							{!selectedVehicle &&
								vehicleQuery.trim().length < 2 && (
									<p className="mt-2 text-xs text-ink-soft">
										Type at least two characters to search the database.
									</p>
								)}

							{selectedVehicle && (
								<div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
									<div>
										<p className="font-mono text-sm font-bold text-ink">
											{selectedVehicle.plate}
										</p>

										<p className="mt-1 text-xs text-ink-soft">
											{[
												selectedVehicle.kind,
												selectedVehicle.make,
												selectedVehicle.model,
												selectedVehicle.year,
											]
												.filter(Boolean)
												.join(" · ")}
										</p>
									</div>

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleChangeVehicle}
									>
										Change
									</Button>
								</div>
							)}
						</div>

						<div>
							<label className={labelClass}>
								Assigned driver
							</label>

							{!selectedVehicle ? (
								<div className="mt-2 rounded-xl border border-line bg-sand p-4">
									<p className="text-sm text-ink-soft">
										Select a vehicle to display its assigned drivers.
									</p>
								</div>
							) : approvedDrivers.length === 0 ? (
								<div className="mt-2 rounded-xl border border-line bg-sand p-4">
									<p className="text-sm text-ink-soft">
										This vehicle has no approved assigned drivers.
										Choose another vehicle or update its assignment.
									</p>
								</div>
							) : (
								<div className="mt-2 space-y-2">
									{approvedDrivers.map((driver) => (
										<button
											key={driver.id}
											type="button"
											onClick={() => setSelectedDriver(driver)}
											className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
												selectedDriver?.id === driver.id
													? "border-orange bg-orange/5"
													: "border-line bg-sand hover:bg-sand/70"
											}`}
										>
											<span className="flex min-w-0 items-center gap-3">
												<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-ink-soft">
													<UserRound className="size-4" />
												</span>

												<span className="min-w-0">
													<span className="block truncate text-sm font-semibold text-ink">
														{driver.name}
													</span>

													<span className="mt-1 block text-xs text-ink-soft">
														{driver.phone}
													</span>

													{driver.licence_number && (
														<span className="mt-1 block font-mono text-[10px] text-ink-soft">
															Licence: {driver.licence_number}
														</span>
													)}
												</span>
											</span>

											<span
												className={`grid size-5 shrink-0 place-items-center rounded-full border ${
													selectedDriver?.id === driver.id
														? "border-orange bg-orange text-white"
														: "border-line"
												}`}
											>
												{selectedDriver?.id === driver.id && (
													<Check className="size-3" />
												)}
											</span>
										</button>
									))}
								</div>
							)}
						</div>
					</section>

					<section className="space-y-5 rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Cargo and arrival slot
							</h3>

							<p className="mt-2 text-xs leading-5 text-ink-soft">
								Add all containers travelling on this truck.
							</p>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<label className={labelClass}>
									Container numbers ({containerNos.length})
								</label>

								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAddContainer}
									className="gap-1.5"
								>
									<Plus className="size-4" />
									Add Container
								</Button>
							</div>

							{containerNos.map((container, index) => (
								<div
									key={index}
									className="flex items-center gap-2"
								>
									<div className="min-w-0 flex-1">
										<Input
											value={container}
											onChange={(event) =>
												handleContainerChange(
													index,
													event.target.value,
												)
											}
											placeholder={`Container ${index + 1} number`}
											autoComplete="off"
											required
											className="h-11 border-line bg-sand text-ink"
										/>
									</div>

									<Button
										type="button"
										variant="outline"
										size="icon"
										disabled={containerNos.length === 1}
										onClick={() =>
											handleRemoveContainer(index)
										}
										aria-label={`Remove container ${index + 1}`}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<label className="block">
								<span className={labelClass}>
									Appointment date
								</span>

								<Input
									type="date"
									value={appointmentDate}
									onChange={(event) =>
										setAppointmentDate(event.target.value)
									}
									min={(() => {
										const date = new Date();

										return `${date.getFullYear()}-${String(
											date.getMonth() + 1,
										).padStart(2, "0")}-${String(
											date.getDate(),
										).padStart(2, "0")}`;
									})()}
									required
									className="mt-2 h-11 border-line bg-sand text-ink"
								/>
							</label>

							<label className="block">
								<span className={labelClass}>
									Arrival time window
								</span>

								<select
									value={slotTime}
									onChange={(event) =>
										setSlotTime(event.target.value)
									}
									required
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
								>
									{slots.map((slot) => (
										<option key={slot} value={slot}>
											{slot}
										</option>
									))}
								</select>
							</label>
						</div>

						<div className="flex items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
							<Calendar className="mt-0.5 size-4 shrink-0 text-orange" />

							<p className="text-xs leading-5 text-ink-soft">
								The server must validate every container and confirm
								the arrival slot is available before saving the booking.
							</p>
						</div>
					</section>

					<div className="flex flex-wrap justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate("/portal/appointments")}
							disabled={submitting}
						>
							Cancel
						</Button>

						<Button
							type="submit"
							disabled={
								submitting ||
								!selectedVehicle ||
								!selectedDriver ||
								containerNos.some((container) => !container.trim()) ||
								new Set(
									containerNos.map((container) =>
										container.trim().toUpperCase(),
									),
								).size !== containerNos.length ||
								!appointmentDate
							}
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							{submitting ? (
								<>
									<LoaderCircle className="size-4 animate-spin" />
									Booking…
								</>
							) : (
								"Confirm appointment"
							)}
						</Button>
					</div>
				</form>
			</div>
		</AppShell>
	);
}
