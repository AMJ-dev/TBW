import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
	type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@/components/router-link";
import { AppShell } from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
	Activity,
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	Check,
	CheckCircle2,
	Clock3,
	Container,
	FileSearch,
	MapPin,
	RefreshCw,
	Search,
	Ship,
	UserRound,
	X,
} from "lucide-react";

type ContainerRecord = {
	id: string;
	container_no: string;
	size: string;
	seal_no: string;
	shipment_reference: string;
	bill_of_lading: string;
	vessel_name: string;
	voyage_number: string;
	shipping_line: string;
	consignee: string;
	cargo_description: string;
	gross_weight: string;
	current_location: string;
	status: string;
};

type ExaminationLocation = {
	id: string;
	name: string;
	code: string;
	kind: string;
	status: string;
};

type ExaminationOfficer = {
	id: string;
	name: string;
	role: string;
};

type ExaminationType = {
	value: string;
	label: string;
	description: string;
};

const examinationTypes: ExaminationType[] = [
	{
		value: "PHYSICAL",
		label: "Physical Examination",
		description: "Physical inspection of cargo and container contents.",
	},
	{
		value: "DOCUMENT",
		label: "Document Examination",
		description: "Verification of shipment and supporting documents.",
	},
	{
		value: "SCANNING",
		label: "Scanning Examination",
		description: "Non-intrusive examination using scanning equipment.",
	},
	{
		value: "JOINT",
		label: "Joint Examination",
		description: "Examination involving multiple authorised agencies.",
	},
];

const inputClass =
	"w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:cursor-not-allowed disabled:opacity-60";

const getString = (value: unknown, fallback = ""): string => {
	if (value === null || value === undefined) return fallback;
	return String(value);
};

const getErrorMessage = (error: any, fallback: string) => {
	const responseData = error?.response?.data;

	if (typeof responseData?.data === "string") {
		return responseData.data;
	}

	if (typeof responseData?.message === "string") {
		return responseData.message;
	}

	if (typeof error?.message === "string") {
		return error.message;
	}

	return fallback;
};

const getArray = (value: unknown): any[] => {
	if (Array.isArray(value)) return value;
	if (Array.isArray((value as any)?.data)) return (value as any).data;
	if (Array.isArray((value as any)?.locations)) return (value as any).locations;
	if (Array.isArray((value as any)?.officers)) return (value as any).officers;
	if (Array.isArray((value as any)?.containers)) return (value as any).containers;
	if (Array.isArray((value as any)?.results)) return (value as any).results;
	return [];
};

const normalizeContainer = (item: any): ContainerRecord => ({
	id: getString(item.container_id ?? item.id),
	container_no: getString(item.container_no ?? item.container_number),
	size: getString(item.container_size ?? item.size),
	seal_no: getString(item.actual_seal_no ?? item.seal_no),
	shipment_reference: getString(item.shipment_reference),
	bill_of_lading: getString(item.bill_of_lading ?? item.bl_number),
	vessel_name: getString(item.vessel_name),
	voyage_number: getString(item.voyage_number),
	shipping_line: getString(item.shipping_line),
	consignee: getString(item.consignee),
	cargo_description: getString(item.cargo_description),
	gross_weight: getString(item.actual_weight ?? item.gross_weight),
	current_location: getString(
		item.current_location_name ??
			item.current_location ??
			item.receiving_location,
	),
	status: getString(item.status ?? item.container_status),
});

const normalizeLocation = (item: any): ExaminationLocation => ({
	id: getString(item.id),
	name: getString(item.location_name),
	code: getString(item.location_code),
	kind: "",
	status: "",
});

const normalizeOfficer = (item: any): ExaminationOfficer => ({
	id: getString(item.id ?? item.user_id ?? item.officer_id),
	name: getString(
		item.full_name ??
			item.name ??
			item.officer_name ??
			item.username,
	),
	role: getString(
		item.role_name ??
			item.role ??
			item.designation ??
			item.position,
		"Examination Officer",
	),
});

function Field({
	label,
	required,
	children,
}: {
	label: string;
	required?: boolean;
	children: ReactNode;
}) {
	return (
		<div className="space-y-2">
			<label className="block text-xs font-semibold text-ink">
				{label}
				{required && <span className="ml-1 text-orange">*</span>}
			</label>
			{children}
		</div>
	);
}

function Detail({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="min-w-0">
			<p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
				{label}
			</p>
			<p className="mt-1 break-words text-sm font-medium text-ink">
				{value || "Not recorded"}
			</p>
		</div>
	);
}

function ContainerSelector({
	selected,
	onSelect,
}: {
	selected: ContainerRecord | null;
	onSelect: (container: ContainerRecord | null) => void;
}) {
	const [searchType, setSearchType] = useState("container_no");
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ContainerRecord[]>([]);
	const [searching, setSearching] = useState(false);
	const [open, setOpen] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const searchOptions = [
		{ value: "bill_of_lading", label: "Bill of Lading" },
		{ value: "shipment_reference", label: "Shipment Reference" },
		{ value: "container_no", label: "Container Number" },
		{ value: "seal_no", label: "Seal Number" },
	];

	const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
		event?.preventDefault();

		const value = query.trim();

		if (!value) {
			setResults([]);
			setHasSearched(false);
			toast.error("Enter a search value.");
			return;
		}

		try {
			setSearching(true);
			setHasSearched(false);
			setOpen(false);

			const response = await http.post("/operator/examination/search/", {
				q: value,
				where: searchType,
			});

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not search containers."),
				);
			}

			const data = resp.data as any;
			const rows = getArray(data?.containers ?? data);

			const normalized = rows
				.map(normalizeContainer)
				.filter((item) => item.id && item.container_no);

			setResults(normalized);
			setHasSearched(true);
			setOpen(true);

			if (!normalized.length) {
				toast.info("No matching containers were found.");
			}
		} catch (error: any) {
			setResults([]);
			setHasSearched(true);
			setOpen(true);
			toast.error(
				getErrorMessage(error, "Could not search containers."),
			);
		} finally {
			setSearching(false);
		}
	};

	return (
		<div className="space-y-3">
			<div className="grid gap-3 sm:grid-cols-[190px_minmax(0,1fr)]">
				<div>
					<label className="mb-2 block text-xs font-semibold text-ink">
						Search by
					</label>
					<select
						value={searchType}
						onChange={(event) => {
							setSearchType(event.target.value);
							setQuery("");
							setResults([]);
							setHasSearched(false);
							setOpen(false);
							onSelect(null);
						}}
						className={`${inputClass} cursor-pointer`}
					>
						{searchOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="mb-2 block text-xs font-semibold text-ink">
						{searchOptions.find((item) => item.value === searchType)?.label}
					</label>
					<form onSubmit={handleSearch} className="flex gap-2">
						<div className="relative min-w-0 flex-1">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
							/>
							<input
								value={query}
								onChange={(event) => {
									setQuery(event.target.value);
									setOpen(false);
									setHasSearched(false);
								}}
								placeholder={`Enter ${searchOptions
									.find((item) => item.value === searchType)
									?.label.toLowerCase()}...`}
								className={`${inputClass} cursor-text pl-9`}
							/>
						</div>

						<button
							type="button"
							onClick={() => void handleSearch()}
							disabled={searching || !query.trim()}
							className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-60"
						>
							{searching ? (
								<RefreshCw size={15} className="animate-spin" />
							) : (
								<Search size={15} />
							)}
							Search
						</button>
					</form>
				</div>
			</div>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 5 }}
						className="overflow-hidden rounded-xl border border-line bg-paper shadow-lg"
					>
						<div className="flex items-center justify-between border-b border-line px-4 py-3">
							<p className="text-xs font-semibold text-ink">
								Search results
							</p>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="cursor-pointer rounded-md p-1 text-ink-soft hover:bg-sand"
							>
								<X size={15} />
							</button>
						</div>

						{searching ? (
							<div className="flex items-center justify-center gap-2 p-6 text-xs text-ink-soft">
								<RefreshCw size={15} className="animate-spin" />
								Searching containers...
							</div>
						) : results.length ? (
							<div className="max-h-72 divide-y divide-line overflow-y-auto">
								{results.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											onSelect(item);
											setQuery(
												searchType === "seal_no"
													? item.seal_no
													: searchType === "shipment_reference"
														? item.shipment_reference
														: searchType === "bill_of_lading"
															? item.bill_of_lading
															: item.container_no,
											);
											setOpen(false);
										}}
										className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-sand/70"
									>
										<div className="min-w-0">
											<p className="text-sm font-semibold text-ink">
												{item.container_no}
											</p>
											<p className="mt-1 truncate text-[11px] text-ink-soft">
												{item.shipment_reference || "No shipment reference"}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.bill_of_lading || "No BOL"} ·{" "}
												{item.seal_no || "No seal recorded"}
											</p>
										</div>

										<span className="shrink-0 rounded-full bg-sand px-2 py-1 text-[9px] font-semibold text-ink-soft">
											{item.status.replaceAll("_", " ") || "Unknown"}
										</span>
									</button>
								))}
							</div>
						) : hasSearched ? (
							<div className="px-4 py-8 text-center text-xs text-ink-soft">
								No matching containers found.
							</div>
						) : null}
					</motion.div>
				)}
			</AnimatePresence>

			{selected && (
				<div className="rounded-xl border border-orange/25 bg-orange/[0.035] p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-orange/10 p-2.5 text-orange">
								<Container size={20} />
							</div>
							<div>
								<p className="text-sm font-semibold text-ink">
									{selected.container_no}
								</p>
								<p className="mt-1 text-[11px] text-ink-soft">
									{selected.size || "Size not recorded"} ·{" "}
									{selected.seal_no || "No seal recorded"}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={() => {
								onSelect(null);
								setQuery("");
								setResults([]);
								setHasSearched(false);
							}}
							className="cursor-pointer rounded-lg p-1.5 text-ink-soft hover:bg-sand hover:text-ink"
						>
							<X size={16} />
						</button>
					</div>

					<div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
						<Detail label="Shipment reference" value={selected.shipment_reference} />
						<Detail label="Bill of lading" value={selected.bill_of_lading} />
						<Detail label="Current location" value={selected.current_location} />
						<Detail label="Container status" value={selected.status.replaceAll("_", " ")} />
					</div>
				</div>
			)}
		</div>
	);
}

export default function ScheduleExaminationPage() {
	const navigate = useNavigate();

	const [selectedContainer, setSelectedContainer] =
		useState<ContainerRecord | null>(null);
	const [examinationType, setExaminationType] = useState("PHYSICAL");
	const [locations, setLocations] = useState<ExaminationLocation[]>([]);
	const [officers, setOfficers] = useState<ExaminationOfficer[]>([]);
	const [locationId, setLocationId] = useState("");
	const [officerId, setOfficerId] = useState("");
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");
	const [priority, setPriority] = useState("NORMAL");
	const [instructions, setInstructions] = useState("");
	const [errors, setErrors] = useState<string[]>([]);
	const [loadingLocations, setLoadingLocations] = useState(true);
	const [loadingOfficers, setLoadingOfficers] = useState(true);
	const [saving, setSaving] = useState(false);

	const today = useMemo(
		() => {
			const date = new Date();
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		},
		[],
	);

	const selectedLocation = locations.find(
		(item) => item.id === locationId,
	);

	const selectedOfficer = officers.find(
		(item) => item.id === officerId,
	);

	const selectedType = examinationTypes.find(
		(item) => item.value === examinationType,
	);

	const fetchLocations = useCallback(async () => {
		try {
			setLoadingLocations(true);

			const response = await http.post(
				"/admin/config/search-location/",
				{ q: "EXAMINATION_BAY" },
			);

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not load examination locations."),
				);
			}

			const code = resp.code as any;
			const rows = Array.isArray(code?.locations)
				? code.locations
				: [];

			const normalized = rows
				.map(normalizeLocation)
				.filter((location: ExaminationLocation) => location.id && location.name);

			setLocations(normalized);
		} catch (error: any) {
			setLocations([]);
			toast.error(
				getErrorMessage(error, "Could not load examination locations."),
			);
		} finally {
			setLoadingLocations(false);
		}
	}, []);

	const fetchOfficers = useCallback(async () => {
		try {
			setLoadingOfficers(true);

			const response = await http.get(
				"/operator/examination/officers/",
			);

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not load examination officers."),
				);
			}

			const data = resp.data as any;
			const code = resp.code as any;

			const rows = Array.isArray(data?.officers)
				? data.officers
				: Array.isArray(code?.officers)
					? code.officers
					: getArray(data);

			const normalized = rows
				.map(normalizeOfficer)
				.filter((officer: ExaminationOfficer) => officer.id && officer.name);

			setOfficers(normalized);
		} catch (error: any) {
			setOfficers([]);
			toast.error(
				getErrorMessage(error, "Could not load examination officers."),
			);
		} finally {
			setLoadingOfficers(false);
		}
	}, []);

	useEffect(() => {
		void fetchLocations();
		void fetchOfficers();
	}, [fetchLocations, fetchOfficers]);

	const validate = () => {
		const nextErrors: string[] = [];

		if (!selectedContainer) {
			nextErrors.push("Select a container.");
		}

		if (!examinationType) {
			nextErrors.push("Select an examination type.");
		}

		if (!locationId || !selectedLocation) {
			nextErrors.push("Select an examination location.");
		}

		if (!officerId || !selectedOfficer) {
			nextErrors.push("Assign an examination officer.");
		}

		if (!scheduledDate) {
			nextErrors.push("Select a scheduled date.");
		}

		if (!scheduledTime) {
			nextErrors.push("Select a scheduled time.");
		}

		if (scheduledDate && scheduledDate < today) {
			nextErrors.push("The scheduled date cannot be in the past.");
		}

		if (
			scheduledDate === today &&
			scheduledTime &&
			(() => {
				const [hours = 0, minutes = 0] = scheduledTime.split(":").map(Number);
				const selected = new Date();
				selected.setHours(hours, minutes, 0, 0);
				return selected.getTime() < Date.now();
			})()
		) {
			nextErrors.push("The scheduled time cannot be in the past.");
		}

		if (instructions.length > 5000) {
			nextErrors.push("Instructions cannot exceed 5,000 characters.");
		}

		setErrors(nextErrors);

		return nextErrors.length === 0;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (saving) return;

		if (!validate()) {
			toast.error("Please correct the required fields.");
			return;
		}

		if (!selectedContainer || !selectedLocation || !selectedOfficer) {
			return;
		}

		try {
			setSaving(true);

			const payload = {
				container_id: selectedContainer.id,
				examination_type: examinationType,
				location_id: locationId,
				officer_id: officerId,
				scheduled_date: scheduledDate,
				scheduled_time: scheduledTime,
				priority,
				instructions: instructions.trim(),
			};

			const response = await http.post(
				"/operator/examination/save/",
				payload,
			);

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					getString(resp.data, "Could not schedule examination."),
				);
			}

			toast.success(
				getString(resp.data, "Examination scheduled successfully."),
			);

			navigate("/operations/examinations");
		} catch (error: any) {
			toast.error(
				getErrorMessage(error, "Could not schedule examination."),
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppShell title="Schedule Examination" eyebrow="Operations">
			<div className="space-y-6 pb-10">
				<div>
					<Link
						to="/operations/examinations"
						className="mb-4 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft hover:text-orange"
					>
						<ArrowLeft size={15} />
						Back to examinations
					</Link>

					<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
						<div>
							<div className="mb-2 flex items-center gap-2 text-xs text-ink-soft">
								<span>Operations</span>
								<ArrowRight size={12} />
								<Link
									to="/operations/examinations"
									className="cursor-pointer hover:text-orange"
								>
									Examinations
								</Link>
								<ArrowRight size={12} />
								<span className="font-medium text-orange">Schedule</span>
							</div>

							<h2 className="text-2xl font-semibold tracking-tight text-ink">
								Schedule examination
							</h2>

							<p className="mt-1 text-sm text-ink-soft">
								Select a container, assign an officer and arrange an examination.
							</p>
						</div>

						<div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
							<CalendarDays size={16} className="text-orange" />
							<span className="text-xs font-medium text-ink">
								New examination schedule
							</span>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="gap-2">
					<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
						<div className="space-y-5">
							<section className="overflow-visible rounded-xl border border-line bg-paper">
								<div className="flex items-center gap-3 border-b border-line px-5 py-4">
									<div className="rounded-lg bg-orange/10 p-2 text-orange">
										<Container size={18} />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-ink">
											Select container
										</h3>
										<p className="mt-1 text-xs text-ink-soft">
											Find an existing container to schedule for examination.
										</p>
									</div>
								</div>

								<div className="space-y-4 p-5">
									<Field label="Search container" required>
										<ContainerSelector
											selected={selectedContainer}
											onSelect={setSelectedContainer}
										/>
									</Field>

									{selectedContainer && (
										<div className="rounded-lg border border-line p-4">
											<div className="mb-4 flex items-center gap-2">
												<Ship size={16} className="text-orange" />
												<h4 className="text-xs font-semibold text-ink">
													Shipment information
												</h4>
											</div>

											<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
												<Detail
													label="Vessel"
													value={selectedContainer.vessel_name}
												/>
												<Detail
													label="Voyage"
													value={selectedContainer.voyage_number}
												/>
												<Detail
													label="Shipping line"
													value={selectedContainer.shipping_line}
												/>
												<Detail
													label="Consignee"
													value={selectedContainer.consignee}
												/>
												<Detail
													label="Cargo description"
													value={selectedContainer.cargo_description}
												/>
												<Detail
													label="Gross weight"
													value={selectedContainer.gross_weight}
												/>
											</div>
										</div>
									)}
								</div>
							</section>

							<section className="rounded-xl border border-line bg-paper">
								<div className="flex items-center gap-3 border-b border-line px-5 py-4">
									<div className="rounded-lg bg-orange/10 p-2 text-orange">
										<FileSearch size={18} />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-ink">
											Examination setup
										</h3>
										<p className="mt-1 text-xs text-ink-soft">
											Specify the type and location of the examination.
										</p>
									</div>
								</div>

								<div className="grid gap-5 p-5">
									<Field label="Examination type" required>
										<div className="grid gap-3 sm:grid-cols-2">
											{examinationTypes.map((type) => (
												<button
													key={type.value}
													type="button"
													onClick={() => setExaminationType(type.value)}
													className={`cursor-pointer rounded-xl border p-4 text-left transition ${
														examinationType === type.value
															? "border-orange bg-orange/[0.04] ring-1 ring-orange/20"
															: "border-line hover:border-orange/40"
													}`}
												>
													<div className="flex items-center justify-between gap-2">
														<p className="text-xs font-semibold text-ink">
															{type.label}
														</p>
														<span
															className={`flex h-5 w-5 items-center justify-center rounded-full border ${
																examinationType === type.value
																	? "border-orange bg-orange text-white"
																	: "border-line text-transparent"
															}`}
														>
															<Check size={12} />
														</span>
													</div>
													<p className="mt-2 text-[11px] leading-5 text-ink-soft">
														{type.description}
													</p>
												</button>
											))}
										</div>
									</Field>

									<Field label="Examination location" required>
										<select
											value={locationId}
											onChange={(event) => setLocationId(event.target.value)}
											disabled={loadingLocations || locations.length === 0}
											className={`${inputClass} cursor-pointer`}
										>
											<option value="">
												{loadingLocations
													? "Loading examination locations..."
													: locations.length
														? "Select examination location"
														: "No examination locations available"}
											</option>
											{locations.map((location) => (
												<option key={location.id} value={location.id}>
													{[location.code, location.name].filter(Boolean).join(" · ")}
												</option>
											))}
										</select>
										{!loadingLocations && !locations.length && (
											<button
												type="button"
												onClick={() => void fetchLocations()}
												className="mt-2 cursor-pointer text-xs font-semibold text-orange hover:text-orange-deep"
											>
												Retry loading locations
											</button>
										)}
									</Field>

									<Field label="Examination officer" required>
										<select
											value={officerId}
											onChange={(event) => setOfficerId(event.target.value)}
											disabled={loadingOfficers || officers.length === 0}
											className={`${inputClass} cursor-pointer`}
										>
											<option value="">
												{loadingOfficers
													? "Loading examination officers..."
													: officers.length
														? "Select responsible officer"
														: "No examination officers available"}
											</option>
											{officers.map((officer) => (
												<option key={officer.id} value={officer.id}>
													{officer.name} — {officer.role}
												</option>
											))}
										</select>
										{!loadingOfficers && !officers.length && (
											<button
												type="button"
												onClick={() => void fetchOfficers()}
												className="mt-2 cursor-pointer text-xs font-semibold text-orange hover:text-orange-deep"
											>
												Retry loading officers
											</button>
										)}
									</Field>
								</div>
							</section>

							<section className="rounded-xl border border-line bg-paper">
								<div className="flex items-center gap-3 border-b border-line px-5 py-4">
									<div className="rounded-lg bg-orange/10 p-2 text-orange">
										<Clock3 size={18} />
									</div>
									<div>
										<h3 className="text-sm font-semibold text-ink">
											Schedule and instructions
										</h3>
										<p className="mt-1 text-xs text-ink-soft">
											Set the examination date, time and priority.
										</p>
									</div>
								</div>

								<div className="grid gap-5 p-5 sm:grid-cols-2">
									<Field label="Scheduled date" required>
										<input
											type="date"
											value={scheduledDate}
											min={today}
											onChange={(event) => setScheduledDate(event.target.value)}
											className={`${inputClass} cursor-pointer`}
										/>
									</Field>

									<Field label="Scheduled time" required>
										<input
											type="time"
											value={scheduledTime}
											onChange={(event) => setScheduledTime(event.target.value)}
											className={`${inputClass} cursor-pointer`}
										/>
									</Field>

									<Field label="Priority">
										<select
											value={priority}
											onChange={(event) => setPriority(event.target.value)}
											className={`${inputClass} cursor-pointer`}
										>
											<option value="LOW">Low</option>
											<option value="NORMAL">Normal</option>
											<option value="HIGH">High</option>
											<option value="URGENT">Urgent</option>
										</select>
									</Field>

									<div className="sm:col-span-2">
										<Field label="Instructions / special remarks">
											<textarea
												rows={4}
												maxLength={5000}
												value={instructions}
												onChange={(event) => setInstructions(event.target.value)}
												placeholder="Enter instructions or special requirements for the examination..."
												className={`${inputClass} cursor-text resize-y`}
											/>
											<p className="text-right text-[10px] text-ink-soft">
												{instructions.length.toLocaleString()} / 5,000
											</p>
										</Field>
									</div>
								</div>
							</section>
						</div>

						<aside className="space-y-4">
							<div className="rounded-xl border border-line bg-paper p-5">
								<h3 className="text-sm font-semibold text-ink">
									Schedule summary
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Review the examination assignment before scheduling.
								</p>

								<div className="mt-5 space-y-4">
									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-sand p-2 text-orange">
											<Container size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-wider text-ink-soft">
												Container
											</p>
											<p className="mt-1 break-all text-xs font-semibold text-ink">
												{selectedContainer?.container_no || "Not selected"}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-sand p-2 text-orange">
											<FileSearch size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-wider text-ink-soft">
												Examination type
											</p>
											<p className="mt-1 text-xs font-semibold text-ink">
												{selectedType?.label || "Not selected"}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-sand p-2 text-orange">
											<MapPin size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-wider text-ink-soft">
												Location
											</p>
											<p className="mt-1 text-xs font-semibold text-ink">
												{selectedLocation?.name || "Not selected"}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-sand p-2 text-orange">
											<UserRound size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-wider text-ink-soft">
												Assigned officer
											</p>
											<p className="mt-1 text-xs font-semibold text-ink">
												{selectedOfficer?.name || "Not assigned"}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3">
										<div className="rounded-lg bg-sand p-2 text-orange">
											<CalendarDays size={16} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] uppercase tracking-wider text-ink-soft">
												Scheduled date and time
											</p>
											<p className="mt-1 text-xs font-semibold text-ink">
												{scheduledDate || "Date not selected"}
											</p>
											<p className="mt-1 text-[11px] text-ink-soft">
												{scheduledTime || "Time not selected"}
											</p>
										</div>
									</div>
								</div>

								<div className="mt-5 rounded-lg bg-sand/70 p-3">
									<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
										Priority
									</p>
									<p className="mt-1 text-xs font-semibold text-ink">
										{priority}
									</p>
								</div>

								{instructions.trim() && (
									<div className="mt-4 rounded-lg border border-line p-3">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
											Instructions
										</p>
										<p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink">
											{instructions}
										</p>
									</div>
								)}
							</div>

							<div className="rounded-xl border border-orange/20 bg-orange/[0.035] p-4">
								<div className="flex items-center gap-2">
									<Activity size={16} className="text-orange" />
									<p className="text-xs font-semibold text-ink">
										Workflow information
									</p>
								</div>
								<p className="mt-2 text-xs leading-5 text-ink-soft">
									Scheduling assigns the examination. The assigned officer
									will record the findings and submit the report for review
									after completing the examination.
								</p>
							</div>

							{errors.length > 0 && (
								<div className="rounded-xl border border-red-200 bg-red-50 p-4">
									<p className="text-xs font-semibold text-red-700">
										Please complete the required fields
									</p>
									<ul className="mt-2 space-y-1">
										{errors.map((error) => (
											<li key={error} className="text-[11px] text-red-600">
												{error}
											</li>
										))}
									</ul>
								</div>
							)}
						</aside>
					</div>

					<div className="flex flex-col-reverse justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
						<Link
							to="/operations/examinations"
							className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-ink hover:bg-sand"
						>
							Cancel
						</Link>

						<button
							type="submit"
							disabled={
								saving ||
								loadingLocations ||
								loadingOfficers ||
								!locations.length ||
								!officers.length
							}
							className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:opacity-60"
						>
							{saving ? (
								<RefreshCw size={15} className="animate-spin" />
							) : (
								<CalendarDays size={15} />
							)}
							{saving ? "Saving examination..." : "Schedule examination"}
							<ArrowRight size={15} />
						</button>
					</div>
				</form>
			</div>
		</AppShell>
	);
}