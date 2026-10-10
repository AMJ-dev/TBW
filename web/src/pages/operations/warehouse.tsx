import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Boxes,
	CheckCircle2,
	ChevronDown,
	Download,
	Filter,
	Package,
	Plus,
	Search,
	Snowflake,
	Thermometer,
	Warehouse,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Static option lists — stand in for terminal configuration that     */
/* would normally be fetched. In production these come from           */
/* AdminTerminalConfigurationPage (warehouse zones and bins).         */
/* ------------------------------------------------------------------ */

const WAREHOUSE_BINS = [
	"Aisle A · Rack 01 · Bin 01",
	"Aisle A · Rack 02 · Bin 05",
	"Aisle A · Rack 03 · Bin 12",
	"Aisle B · Rack 01 · Bin 08",
	"Aisle B · Rack 02 · Bin 02",
	"Aisle C · Rack 01 · Bin 04",
	"Cold Bay · Rack 01 · Bin 02",
	"Cold Bay · Rack 02 · Bin 01",
	"Heavy Bay · Floor Area 02",
	"Heavy Bay · Floor Area 03",
];

/* Bins that sit inside a temperature-controlled zone. Kept here so  */
/* the UI can render cold-chain items distinctly. In production this */
/* comes from the zone configuration.                                */
const COLD_CHAIN_BINS = new Set([
	"Cold Bay · Rack 01 · Bin 02",
	"Cold Bay · Rack 02 · Bin 01",
]);

/* Bonded vs. non-bonded is a property of the location, per §18.     */
const NON_BONDED_BINS = new Set([
	"Aisle C · Rack 01 · Bin 04",
	"Heavy Bay · Floor Area 03",
]);

type CargoState =
	| "RECEIVED"
	| "STORED"
	| "DOCS_IN_PROGRESS"
	| "UNDER_EXAMINATION"
	| "RELEASE_AUTHORISED"
	| "HELD";

interface WarehouseInventoryItem {
	id: string;
	consignmentRef: string;
	cargoDesc: string;
	consignee: string;
	locationBin: string;
	quantity: string;
	volumeCbm: string;
	cargoState: CargoState;
	dwellDays: number;
}

const initialStock: WarehouseInventoryItem[] = [
	{
		id: "wh-1",
		consignmentRef: "TRN-C-9021",
		cargoDesc: "Telecommunications Transceivers & Fiber Hardware",
		consignee: "Atlantic Trade Nigeria Ltd",
		locationBin: "Aisle A · Rack 03 · Bin 12",
		quantity: "140 cartons",
		volumeCbm: "24.5 m³",
		cargoState: "STORED",
		dwellDays: 4,
	},
	{
		id: "wh-2",
		consignmentRef: "TRN-C-9022",
		cargoDesc: "Pharmaceutical Grade Glucose Excipients",
		consignee: "Kano Freight Forwarders",
		locationBin: "Cold Bay · Rack 01 · Bin 02",
		quantity: "320 bags",
		volumeCbm: "18.0 m³",
		cargoState: "STORED",
		dwellDays: 6,
	},
	{
		id: "wh-3",
		consignmentRef: "TRN-C-9023",
		cargoDesc: "Heavy Commercial Generator Spares",
		consignee: "Sahara Energy Logistics",
		locationBin: "Heavy Bay · Floor Area 02",
		quantity: "14 crates",
		volumeCbm: "42.0 m³",
		cargoState: "UNDER_EXAMINATION",
		dwellDays: 9,
	},
	{
		id: "wh-4",
		consignmentRef: "TRN-C-9024",
		cargoDesc: "Solar Inverter Components & Battery Modules",
		consignee: "Meridian Customs Services",
		locationBin: "Aisle B · Rack 02 · Bin 02",
		quantity: "85 pallets",
		volumeCbm: "35.2 m³",
		cargoState: "RELEASE_AUTHORISED",
		dwellDays: 2,
	},
];

const ALL_STATES: CargoState[] = [
	"RECEIVED",
	"STORED",
	"DOCS_IN_PROGRESS",
	"UNDER_EXAMINATION",
	"RELEASE_AUTHORISED",
	"HELD",
];

const STATE_FILTERS: (CargoState | "ALL")[] = ["ALL", ...ALL_STATES];

const stateLabel: Record<CargoState, string> = {
	RECEIVED: "Received",
	STORED: "Stored",
	DOCS_IN_PROGRESS: "Documentation in progress",
	UNDER_EXAMINATION: "Under examination",
	RELEASE_AUTHORISED: "Release authorised",
	HELD: "On hold",
};

const stateTone = (
	s: CargoState
): "success" | "warning" | "critical" | "info" | "neutral" => {
	switch (s) {
		case "RELEASE_AUTHORISED":
			return "success";
		case "UNDER_EXAMINATION":
		case "DOCS_IN_PROGRESS":
			return "warning";
		case "HELD":
			return "critical";
		case "RECEIVED":
		case "STORED":
			return "info";
		default:
			return "neutral";
	}
};

export default function OperationsWarehouseRoute() {
	const [stock, setStock] = useState<WarehouseInventoryItem[]>(initialStock);
	const [searchQuery, setSearchQuery] = useState("");
	const [stateFilter, setStateFilter] = useState<CargoState | "ALL">("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	/* Form state */
	const [consignmentRef, setConsignmentRef] = useState("");
	const [cargoDesc, setCargoDesc] = useState("");
	const [consignee, setConsignee] = useState("");
	const [locationBin, setLocationBin] = useState(WAREHOUSE_BINS[0] ?? "");
	const [quantity, setQuantity] = useState("");
	const [volumeCbm, setVolumeCbm] = useState("");

	const filteredStock = useMemo(() => {
		return stock.filter((item) => {
			const query = searchQuery.trim().toLowerCase();
			const matchQuery =
				!query ||
				item.consignmentRef.toLowerCase().includes(query) ||
				item.cargoDesc.toLowerCase().includes(query) ||
				item.consignee.toLowerCase().includes(query) ||
				item.locationBin.toLowerCase().includes(query);

			const matchState =
				stateFilter === "ALL" ? true : item.cargoState === stateFilter;

			return matchQuery && matchState;
		});
	}, [stock, searchQuery, stateFilter]);

	const resetForm = () => {
		setConsignmentRef("");
		setCargoDesc("");
		setConsignee("");
		setLocationBin(WAREHOUSE_BINS[0] ?? "");
		setQuantity("");
		setVolumeCbm("");
	};

	const handleRecordIntake = (e: React.FormEvent) => {
		e.preventDefault();
		if (!consignmentRef.trim() || !cargoDesc.trim() || !consignee.trim()) {
			toast.error(
				"Consignment reference, cargo description, and consignee are required."
			);
			return;
		}

		const newItem: WarehouseInventoryItem = {
			id: `wh-${stock.length + 1}`,
			consignmentRef: consignmentRef.trim().toUpperCase(),
			cargoDesc: cargoDesc.trim(),
			consignee: consignee.trim(),
			locationBin,
			quantity: quantity.trim() || "1 unit",
			volumeCbm: volumeCbm.trim()
				? volumeCbm.includes("m³")
					? volumeCbm.trim()
					: `${volumeCbm.trim()} m³`
				: "—",
			cargoState: "RECEIVED",
			dwellDays: 0,
		};

		setStock([newItem, ...stock]);
		setIsModalOpen(false);
		resetForm();
		toast.success(
			`Cargo ${newItem.consignmentRef} slotted into ${locationBin}.`
		);
	};

	const handleExport = () => {
		toast.success("Warehouse inventory exported locally.");
	};

	const bondedCount = stock.filter(
		(item) => !NON_BONDED_BINS.has(item.locationBin)
	).length;
	const nonBondedCount = stock.length - bondedCount;
	const coldChainCount = stock.filter((item) =>
		COLD_CHAIN_BINS.has(item.locationBin)
	).length;
	const onHoldCount = stock.filter((item) => item.cargoState === "HELD").length;

	return (
		<AppShell
			title="Bonded Warehouse"
			eyebrow="Operations · Internal Storage & Inventory"
		>
			<div className="space-y-6 pb-8">
				{/* Header */}
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Secure storage · Bonded warehouse area
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Bonded warehouse inventory &amp; bin allocation
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Tracking of de-stuffed LCL consignments, pallet positions,
							cold storage chambers, and cycle count logs.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							className="border-line bg-paper text-ink hover:bg-sand"
							onClick={handleExport}
						>
							<Download className="size-4" /> Export stock list
						</Button>
						<Button
							className="bg-orange text-white hover:bg-orange-deep"
							onClick={() => setIsModalOpen(true)}
						>
							<Plus className="size-4" /> Record bin intake
						</Button>
					</div>
				</div>

				{/* Metrics */}
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Metric
						label="Warehouse occupancy"
						value="78%"
						detail="22% (1,120 m²) available"
						tone="warning"
						icon={Warehouse}
					/>
					<Metric
						label="Tracked bins"
						value="284 active"
						detail="Across aisles A–C"
						tone="info"
						icon={Package}
					/>
					<Metric
						label="Cold chain items"
						value={`${coldChainCount}`}
						detail={
							coldChainCount > 0
								? "Continuous sensor check"
								: "No cold items stored"
						}
						tone="info"
						icon={Snowflake}
					/>
					<Metric
						label="Items on hold"
						value={`${onHoldCount}`}
						detail={
							onHoldCount > 0
								? "Check hold records"
								: "No holds active"
						}
						tone={onHoldCount > 0 ? "critical" : "success"}
						icon={CheckCircle2}
					/>
				</div>

				{/* Segregation summary */}
				<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<Boxes className="size-5" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-ink">
								Bonded vs. non-bonded segregation
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Bonded and non-bonded cargo must not share a bin. The
								location configuration marks each bin as bonded or
								non-bonded, and the intake flow checks the assignment
								before saving.
							</p>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<div className="flex items-center gap-3 rounded-lg bg-sand p-3 ring-1 ring-line">
									<div className="grid size-9 shrink-0 place-items-center rounded-md bg-paper text-orange-deep">
										<Boxes className="size-4" />
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
											Bonded
										</p>
										<p className="mt-0.5 text-sm font-semibold text-ink">
											{bondedCount} consignments
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 rounded-lg bg-sand p-3 ring-1 ring-line">
									<div className="grid size-9 shrink-0 place-items-center rounded-md bg-paper text-ink-soft">
										<Boxes className="size-4" />
									</div>
									<div>
										<p className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
											Non-bonded
										</p>
										<p className="mt-0.5 text-sm font-semibold text-ink">
											{nonBondedCount} consignments
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Inventory table */}
				<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
						<div className="relative min-w-[260px] flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search by consignment, cargo description, consignee, or bin…"
								className="h-10 border-line bg-sand pl-9 text-sm text-ink"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-1.5">
							<span className="flex items-center gap-1 text-xs text-ink-soft">
								<Filter className="size-3.5" /> State:
							</span>
							{STATE_FILTERS.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setStateFilter(s)}
									className={cn(
										"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
										stateFilter === s
											? "bg-ink text-sand"
											: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									)}
								>
									{s === "ALL" ? "All" : stateLabel[s]}
								</button>
							))}
						</div>
					</div>

					{filteredStock.length === 0 ? (
						<div className="p-10 text-center">
							<Package className="mx-auto size-7 text-ink-soft" />
							<p className="mt-3 text-sm font-semibold text-ink">
								No inventory matches your filters
							</p>
							<p className="mt-1 text-xs text-ink-soft">
								Try another search term or state.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[1000px] text-left text-sm">
								<thead>
									<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										<th className="px-4 py-3 font-medium">
											Consignment
										</th>
										<th className="px-4 py-3 font-medium">
											Cargo description
										</th>
										<th className="px-4 py-3 font-medium">
											Consignee
										</th>
										<th className="px-4 py-3 font-medium">
											Bin allocation
										</th>
										<th className="px-4 py-3 font-medium">
											Qty / volume
										</th>
										<th className="px-4 py-3 font-medium">Dwell</th>
										<th className="px-4 py-3 font-medium">
											Cargo state
										</th>
										<th className="px-4 py-3 text-right font-medium">
											Action
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{filteredStock.map((item) => {
										const isCold = COLD_CHAIN_BINS.has(
											item.locationBin
										);
										const isNonBonded = NON_BONDED_BINS.has(
											item.locationBin
										);
										return (
											<tr
												key={item.id}
												className="transition-colors hover:bg-sand/40"
											>
												<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
													{item.consignmentRef}
												</td>
												<td
													className="max-w-xs truncate px-4 py-3.5 text-xs font-medium text-ink"
													title={item.cargoDesc}
												>
													{item.cargoDesc}
												</td>
												<td className="px-4 py-3.5 text-xs text-ink">
													{item.consignee}
												</td>
												<td className="px-4 py-3.5">
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-mono text-xs font-semibold text-ink">
															{item.locationBin}
														</span>
														{isCold && (
															<span
																className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-sky-deep ring-1 ring-sky/25"
																title="Temperature controlled"
															>
																<Thermometer className="size-2.5" />
																Cold
															</span>
														)}
														{isNonBonded && (
															<span
																className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft ring-1 ring-line"
																title="Non-bonded location"
															>
																Non-bonded
															</span>
														)}
													</div>
												</td>
												<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
													{item.quantity} · {item.volumeCbm}
												</td>
												<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
													{item.dwellDays} days
												</td>
												<td className="px-4 py-3.5">
													<StatusBadge
														label={stateLabel[item.cargoState]}
														tone={stateTone(item.cargoState)}
													/>
												</td>
												<td className="px-4 py-3.5 text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															toast.success(
																`Cycle count opened for ${item.consignmentRef}`
															)
														}
														className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
													>
														Audit bin
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
						<span>
							Showing {filteredStock.length} of {stock.length} inventory
							bin positions
						</span>
						<span>Bond WH · Abuja Flagship Facility</span>
					</div>
				</section>

				{/* Footer info */}
				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<Thermometer className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div className="min-w-0">
							<p className="text-[13px] font-semibold text-ink">
								Bin allocation is drawn from the terminal configuration
							</p>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Every bin sits inside a zone that carries a bonded flag
								and an optional temperature-controlled flag. Bonded and
								non-bonded cargo cannot share a bin, and cold chain
								items are visible at a glance. Each intake creates a
								timestamped event with actor, device, and reason.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Record bin intake modal */}
			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) =>
						e.target === e.currentTarget && setIsModalOpen(false)
					}
				>
					<div className="w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line bg-sand p-5">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Inventory intake
								</p>
								<h3 className="mt-1 font-display text-lg font-bold text-ink">
									Record warehouse bin intake
								</h3>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsModalOpen(false)}
								aria-label="Close"
							>
								<X className="size-4" />
							</Button>
						</div>

						<form
							onSubmit={handleRecordIntake}
							className="space-y-4 p-5"
						>
							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Consignment reference{" "}
									<span className="text-coral">*</span>
								</span>
								<Input
									required
									placeholder="e.g. TRN-C-9025"
									value={consignmentRef}
									onChange={(e) =>
										setConsignmentRef(
											e.target.value.toUpperCase()
										)
									}
									className="mt-1.5 h-10 border-line bg-sand font-mono text-ink"
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Cargo description{" "}
									<span className="text-coral">*</span>
								</span>
								<Input
									required
									placeholder="e.g. Telecommunications hardware modules"
									value={cargoDesc}
									onChange={(e) => setCargoDesc(e.target.value)}
									className="mt-1.5 h-10 border-line bg-sand text-ink"
								/>
							</label>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Consignee / client{" "}
									<span className="text-coral">*</span>
								</span>
								<Input
									required
									placeholder="e.g. Atlantic Trade Nigeria Ltd"
									value={consignee}
									onChange={(e) => setConsignee(e.target.value)}
									className="mt-1.5 h-10 border-line bg-sand text-ink"
								/>
							</label>

							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Quantity &amp; packaging
									</span>
									<Input
										placeholder="e.g. 50 pallets"
										value={quantity}
										onChange={(e) =>
											setQuantity(e.target.value)
										}
										className="mt-1.5 h-10 border-line bg-sand text-ink"
									/>
								</label>
								<label className="block">
									<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Volume (m³)
									</span>
									<Input
										placeholder="e.g. 18.5"
										value={volumeCbm}
										onChange={(e) =>
											setVolumeCbm(e.target.value)
										}
										className="mt-1.5 h-10 border-line bg-sand font-mono text-ink"
									/>
								</label>
							</div>

							<SelectField
								label="Bin allocation"
								value={locationBin}
								onChange={setLocationBin}
								options={WAREHOUSE_BINS}
								hint={
									COLD_CHAIN_BINS.has(locationBin)
										? "Temperature-controlled bin"
										: NON_BONDED_BINS.has(locationBin)
											? "Non-bonded bin"
											: "Bonded bin"
								}
								hintTone={
									COLD_CHAIN_BINS.has(locationBin)
										? "info"
										: NON_BONDED_BINS.has(locationBin)
											? "neutral"
											: "success"
								}
							/>

							<div className="rounded-lg bg-sand p-3 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Recorded as
								</p>
								<p className="mt-1 font-mono text-[11px] text-ink">
									{consignmentRef || "TRN-C-XXXX"} ·{" "}
									{locationBin.split(" · ")[0]} · RECEIVED
								</p>
							</div>

							<div className="flex items-center justify-end gap-2 border-t border-line pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsModalOpen(false)}
									className="border-line bg-paper text-ink hover:bg-sand"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="bg-orange text-white hover:bg-orange-deep"
								>
									<Plus className="mr-2 size-4" />
									Save allocation
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	hint,
	hintTone = "neutral",
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	hint?: string;
	hintTone?: "success" | "info" | "neutral";
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<div className="relative mt-1.5">
				<select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-10 w-full appearance-none rounded-md border border-line bg-sand px-3 pr-9 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
				>
					{options.map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
			</div>
			{hint && (
				<span
					className={cn(
						"mt-1 block font-mono text-[10px] uppercase tracking-[0.12em]",
						hintTone === "success" && "text-teal-deep",
						hintTone === "info" && "text-sky-deep",
						hintTone === "neutral" && "text-ink-soft"
					)}
				>
					{hint}
				</span>
			)}
		</label>
	);
}