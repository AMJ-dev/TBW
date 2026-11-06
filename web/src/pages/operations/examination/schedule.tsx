import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@/components/router-link";
import { AppShell } from "@/components/auth-shell";
import { AnimatePresence, motion } from "framer-motion";
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

const availableContainers: ContainerRecord[] = [
	{
		id: "CNT-001",
		container_no: "JHN-93849",
		size: "40ft",
		seal_no: "JHJB-43984",
		shipment_reference: "TRN-SHP-2026-5D1F6F38F193",
		bill_of_lading: "KSBK-87384",
		vessel_name: "MV Atlantic Star",
		voyage_number: "AS-3874",
		shipping_line: "Oceanic Shipping",
		consignee: "Global Trade Nigeria Ltd",
		cargo_description: "Television and electronic appliances",
		gross_weight: "234.000 kg",
		current_location: "Main Bonded Warehouse",
		status: "IN_WAREHOUSE",
	},
	{
		id: "CNT-002",
		container_no: "JHBJ-374374",
		size: "20ft",
		seal_no: "BKJ-349384",
		shipment_reference: "TRN-SHP-2026-5D1F6F38F193",
		bill_of_lading: "KSBK-87384",
		vessel_name: "MV Atlantic Star",
		voyage_number: "AS-3874",
		shipping_line: "Oceanic Shipping",
		consignee: "Global Trade Nigeria Ltd",
		cargo_description: "Television and electronic appliances",
		gross_weight: "2,323.000 kg",
		current_location: "Heavy Cargo Yard",
		status: "IN_YARD",
	},
	{
		id: "CNT-003",
		container_no: "MSCU-7382910",
		size: "20ft",
		seal_no: "MSC-82719",
		shipment_reference: "TRN-SHP-2026-8A2D4C1F",
		bill_of_lading: "BOL-839202",
		vessel_name: "MV Ocean Pearl",
		voyage_number: "OP-2026-14",
		shipping_line: "Maersk Line",
		consignee: "Prime Imports Ltd",
		cargo_description: "Industrial machinery",
		gross_weight: "8,450.000 kg",
		current_location: "Receiving Area 01",
		status: "RECEIVED",
	},
];

const examinationTypes = [
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

const examinationLocations = [
	{ id: "LOC-001", name: "Examination Bay 01", code: "EXM-01" },
	{ id: "LOC-002", name: "Examination Bay 02", code: "EXM-02" },
	{ id: "LOC-003", name: "Examination Bay 03", code: "EXM-03" },
	{ id: "LOC-004", name: "Scanning Bay 01", code: "SCN-01" },
];

const officers = [
	{ id: "USR-001", name: "Mathias Jacobs", role: "Examination Officer" },
	{ id: "USR-002", name: "Daniel Okafor", role: "Senior Examination Officer" },
	{ id: "USR-003", name: "Ibrahim Musa", role: "Examination Officer" },
	{ id: "USR-004", name: "Samuel Ade", role: "Scanning Officer" },
];

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

const inputClass =
	"w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/10";

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
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);

	const results = useMemo(() => {
		const value = query.toLowerCase().trim();

		if (!value) return availableContainers;

		return availableContainers.filter((item) =>
			[
				item.container_no,
				item.shipment_reference,
				item.bill_of_lading,
				item.seal_no,
				item.consignee,
			].some((field) => field.toLowerCase().includes(value)),
		);
	}, [query]);

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
				/>

				<input
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => {
						window.setTimeout(() => setOpen(false), 150);
					}}
					placeholder="Search container, shipment reference, BOL or seal..."
					className={`${inputClass} cursor-text pl-9`}
				/>

				<AnimatePresence>
					{open && (
						<motion.div
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 5 }}
							className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-paper shadow-xl"
						>
							{results.length ? (
								results.map((item) => (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											onSelect(item);
											setQuery(item.container_no);
											setOpen(false);
										}}
										className="flex w-full cursor-pointer items-start justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-sand/70"
									>
										<div className="min-w-0">
											<p className="text-sm font-semibold text-ink">
												{item.container_no}
											</p>
											<p className="mt-1 truncate text-[11px] text-ink-soft">
												{item.shipment_reference}
											</p>
											<p className="mt-1 text-[10px] text-ink-soft">
												{item.bill_of_lading} · {item.size}
											</p>
										</div>

										<span className="shrink-0 rounded-full bg-sand px-2 py-1 text-[9px] font-semibold text-ink-soft">
											{item.status.replaceAll("_", " ")}
										</span>
									</button>
								))
							) : (
								<div className="px-4 py-8 text-center text-xs text-ink-soft">
									No matching containers found.
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

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
									{selected.size} · {selected.seal_no}
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={() => {
								onSelect(null);
								setQuery("");
							}}
							className="cursor-pointer rounded-lg p-1.5 text-ink-soft hover:bg-sand hover:text-ink"
						>
							<X size={16} />
						</button>
					</div>

					<div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
						<Detail
							label="Shipment reference"
							value={selected.shipment_reference}
						/>
						<Detail
							label="Bill of lading"
							value={selected.bill_of_lading}
						/>
						<Detail
							label="Current location"
							value={selected.current_location}
						/>
						<Detail
							label="Container status"
							value={selected.status.replaceAll("_", " ")}
						/>
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
	const [locationId, setLocationId] = useState("");
	const [officerId, setOfficerId] = useState("");
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");
	const [priority, setPriority] = useState("NORMAL");
	const [instructions, setInstructions] = useState("");
	const [errors, setErrors] = useState<string[]>([]);
	const [showConfirmation, setShowConfirmation] = useState(false);

	const selectedLocation = examinationLocations.find(
		(item) => item.id === locationId,
	);

	const selectedOfficer = officers.find(
		(item) => item.id === officerId,
	);

	const selectedType = examinationTypes.find(
		(item) => item.value === examinationType,
	);

	const today = new Date().toLocaleDateString("en-CA");

	const validate = () => {
		const nextErrors: string[] = [];

		if (!selectedContainer) nextErrors.push("Select a container.");
		if (!examinationType) nextErrors.push("Select an examination type.");
		if (!locationId) nextErrors.push("Select an examination location.");
		if (!officerId) nextErrors.push("Assign an examination officer.");
		if (!scheduledDate) nextErrors.push("Select a scheduled date.");
		if (!scheduledTime) nextErrors.push("Select a scheduled time.");

		if (scheduledDate && scheduledDate < today) {
			nextErrors.push("The scheduled date cannot be in the past.");
		}

		setErrors(nextErrors);

		return nextErrors.length === 0;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!validate()) return;

		setShowConfirmation(true);
	};

	const handleFinish = () => {
		setShowConfirmation(false);
		navigate("/operations/examinations");
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
								Select a received container, assign an officer and arrange an
								examination.
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

				<form onSubmit={handleSubmit} className="space-y-5">
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
											className={`${inputClass} cursor-pointer`}
										>
											<option value="">
												Select examination location
											</option>
											{examinationLocations.map((location) => (
												<option key={location.id} value={location.id}>
													{location.name} ({location.code})
												</option>
											))}
										</select>
									</Field>

									<Field label="Examination officer" required>
										<select
											value={officerId}
											onChange={(event) => setOfficerId(event.target.value)}
											className={`${inputClass} cursor-pointer`}
										>
											<option value="">Select responsible officer</option>
											{officers.map((officer) => (
												<option key={officer.id} value={officer.id}>
													{officer.name} — {officer.role}
												</option>
											))}
										</select>
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
											onChange={(event) =>
												setScheduledDate(event.target.value)
											}
											className={`${inputClass} cursor-pointer`}
										/>
									</Field>

									<Field label="Scheduled time" required>
										<input
											type="time"
											value={scheduledTime}
											onChange={(event) =>
												setScheduledTime(event.target.value)
											}
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
												value={instructions}
												onChange={(event) =>
													setInstructions(event.target.value)
												}
												placeholder="Enter instructions or special requirements for the examination..."
												className={`${inputClass} cursor-text resize-y`}
											/>
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
							className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-deep"
						>
							<CalendarDays size={15} />
							Schedule examination
							<ArrowRight size={15} />
						</button>
					</div>
				</form>

				<AnimatePresence>
					{showConfirmation && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
						>
							<motion.div
								initial={{ opacity: 0, y: 15, scale: 0.97 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 10, scale: 0.97 }}
								className="w-full max-w-md rounded-2xl border border-line bg-paper p-6 shadow-2xl"
							>
								<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
									<CheckCircle2 size={25} />
								</div>

								<h3 className="mt-4 text-center text-lg font-semibold text-ink">
									Details validated
								</h3>

								<p className="mt-2 text-center text-sm leading-6 text-ink-soft">
									The examination schedule details are complete. This is a
									UI preview; no examination has been saved.
								</p>

								<div className="mt-5 rounded-xl border border-line bg-sand/50 p-4">
									<p className="text-xs font-semibold text-ink">
										{selectedContainer?.container_no}
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">
										{selectedType?.label}
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">
										{scheduledDate} · {scheduledTime}
									</p>
									<p className="mt-1 text-[11px] text-ink-soft">
										{selectedLocation?.name} · {selectedOfficer?.name}
									</p>
								</div>

								<button
									type="button"
									onClick={handleFinish}
									className="mt-5 w-full cursor-pointer rounded-lg bg-orange px-4 py-3 text-xs font-semibold text-white hover:bg-orange-deep"
								>
									Return to examinations
								</button>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</AppShell>
	);
}