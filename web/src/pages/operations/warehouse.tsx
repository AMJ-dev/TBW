
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	Boxes,
	CheckCircle2,
	ChevronDown,
	Download,
	Filter,
	Package,
	Plus,
	Search,
	Thermometer,
	Warehouse,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

const COLD_CHAIN_BINS = new Set([
	"Cold Bay · Rack 01 · Bin 02",
	"Cold Bay · Rack 02 · Bin 01",
]);

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
	state: CargoState
): "success" | "warning" | "critical" | "info" | "neutral" => {
	switch (state) {
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

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function OperationsWarehouseRoute() {
	const [stock, setStock] = useState<WarehouseInventoryItem[]>(initialStock);
	const [searchQuery, setSearchQuery] = useState("");
	const [stateFilter, setStateFilter] = useState<CargoState | "ALL">("ALL");
	const [view, setView] = useState<"list" | "intake">("list");

	const filteredStock = useMemo(() => {
		return stock.filter((item) => {
			const query = searchQuery.trim().toLowerCase();

			const matchesSearch =
				!query ||
				item.consignmentRef.toLowerCase().includes(query) ||
				item.cargoDesc.toLowerCase().includes(query) ||
				item.consignee.toLowerCase().includes(query) ||
				item.locationBin.toLowerCase().includes(query);

			const matchesState =
				stateFilter === "ALL" || item.cargoState === stateFilter;

			return matchesSearch && matchesState;
		});
	}, [stock, searchQuery, stateFilter]);

	const handleIntake = (item: WarehouseInventoryItem) => {
		setStock((prev) => [item, ...prev]);
		setView("list");
		toast.success(
			`Cargo ${item.consignmentRef} assigned to ${item.locationBin}.`
		);
	};

	const handleExport = () => {
		if (!stock.length) {
			toast.error("There are no warehouse records to export.");
			return;
		}

		const headers = [
			"Consignment",
			"Cargo Description",
			"Consignee",
			"Location",
			"Quantity",
			"Volume",
			"Status",
			"Dwell Days",
		];

		const rows = stock.map((item) =>
			[
				item.consignmentRef,
				item.cargoDesc,
				item.consignee,
				item.locationBin,
				item.quantity,
				item.volumeCbm,
				item.cargoState,
				item.dwellDays,
			]
				.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
				.join(",")
		);

		const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
			type: "text/csv;charset=utf-8;",
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = "warehouse-inventory.csv";
		link.click();

		URL.revokeObjectURL(url);
	};

	const bondedCount = stock.filter(
		(item) => !NON_BONDED_BINS.has(item.locationBin)
	).length;

	const nonBondedCount = stock.length - bondedCount;

	const coldChainCount = stock.filter((item) =>
		COLD_CHAIN_BINS.has(item.locationBin)
	).length;

	const onHoldCount = stock.filter(
		(item) => item.cargoState === "HELD"
	).length;

	return (
		<AppShell
			title="Warehouse Management"
			eyebrow="Operations · Internal Storage & Inventory"
		>
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						stock={stock}
						filteredStock={filteredStock}
						searchQuery={searchQuery}
						stateFilter={stateFilter}
						onSearchChange={setSearchQuery}
						onStateChange={setStateFilter}
						onNewIntake={() => setView("intake")}
						onExport={handleExport}
						metrics={{
							bondedCount,
							nonBondedCount,
							coldChainCount,
							onHoldCount,
						}}
					/>
				) : (
					<IntakeView
						onCancel={() => setView("list")}
						onSubmit={handleIntake}
						existingCount={stock.length}
					/>
				)}
			</div>
		</AppShell>
	);
}

function ListView({
	stock,
	filteredStock,
	searchQuery,
	stateFilter,
	onSearchChange,
	onStateChange,
	onNewIntake,
	onExport,
	metrics,
}: {
	stock: WarehouseInventoryItem[];
	filteredStock: WarehouseInventoryItem[];
	searchQuery: string;
	stateFilter: CargoState | "ALL";
	onSearchChange: (value: string) => void;
	onStateChange: (value: CargoState | "ALL") => void;
	onNewIntake: () => void;
	onExport: () => void;
	metrics: {
		bondedCount: number;
		nonBondedCount: number;
		coldChainCount: number;
		onHoldCount: number;
	};
}) {
	return (
		<div className="space-y-6 pb-8">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Inventory"
					value={String(stock.length)}
					icon={Package}
				/>
				<Metric
					label="Bonded Inventory"
					value={String(metrics.bondedCount)}
					icon={Boxes}
				/>
				<Metric
					label="Non-bonded Inventory"
					value={String(metrics.nonBondedCount)}
					icon={Warehouse}
				/>
				<Metric
					label="Items on Hold"
					value={String(metrics.onHoldCount)}
					icon={CheckCircle2}
				/>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-ink">
						Warehouse Inventory
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Track stored cargo, storage locations and inventory status.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Download className="size-4" />
						Export
					</Button>

					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewIntake}
					>
						<Plus className="size-4" />
						Record Intake
					</Button>
				</div>
			</div>

			<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="relative w-full lg:max-w-md">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(event) => onSearchChange(event.target.value)}
							placeholder="Search consignment, cargo, consignee or bin..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<span className="mr-1 flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" />
							Status:
						</span>

						{STATE_FILTERS.map((state) => (
							<button
								key={state}
								type="button"
								onClick={() => onStateChange(state)}
								className={cn(
									"rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
									stateFilter === state
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{state === "ALL" ? "All" : stateLabel[state]}
							</button>
						))}
					</div>
				</div>

				{filteredStock.length === 0 ? (
					<div className="p-10 text-center">
						<Package className="mx-auto size-8 text-ink-soft" />
						<p className="mt-3 text-sm font-semibold text-ink">
							No warehouse inventory found
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Try changing your search or status filter.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1050px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Consignment</th>
									<th className="px-4 py-3 font-medium">Cargo description</th>
									<th className="px-4 py-3 font-medium">Consignee</th>
									<th className="px-4 py-3 font-medium">Storage location</th>
									<th className="px-4 py-3 font-medium">Quantity / Volume</th>
									<th className="px-4 py-3 font-medium">Dwell</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 text-right font-medium">Action</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{filteredStock.map((item) => {
									const isCold = COLD_CHAIN_BINS.has(item.locationBin);
									const isNonBonded = NON_BONDED_BINS.has(item.locationBin);

									return (
										<tr
											key={item.id}
											className="transition-colors hover:bg-sand/40"
										>
											<td className="px-4 py-3.5">
												<p className="font-mono text-xs font-semibold text-orange-deep">
													{item.consignmentRef}
												</p>
											</td>

											<td className="max-w-xs px-4 py-3.5">
												<p
													className="truncate text-xs font-medium text-ink"
													title={item.cargoDesc}
												>
													{item.cargoDesc}
												</p>
											</td>

											<td className="px-4 py-3.5 text-xs text-ink">
												{item.consignee}
											</td>

											<td className="px-4 py-3.5">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-mono text-xs font-medium text-ink">
														{item.locationBin}
													</span>

													{isCold && (
														<span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-sky-deep ring-1 ring-sky/25">
															<Thermometer className="size-2.5" />
															Cold
														</span>
													)}

													{isNonBonded && (
														<span className="rounded-full bg-sand px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-soft ring-1 ring-line">
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
													Audit
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
						Showing {filteredStock.length} of {stock.length} inventory records
					</span>
					<span>Warehouse Inventory</span>
				</div>
			</section>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	existingCount,
}: {
	onCancel: () => void;
	onSubmit: (item: WarehouseInventoryItem) => void;
	existingCount: number;
}) {
	const [consignmentRef, setConsignmentRef] = useState("");
	const [cargoDesc, setCargoDesc] = useState("");
	const [consignee, setConsignee] = useState("");
	const [locationBin, setLocationBin] = useState(WAREHOUSE_BINS[0] ?? "");
	const [quantity, setQuantity] = useState("");
	const [volumeCbm, setVolumeCbm] = useState("");

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		if (!consignmentRef.trim() || !cargoDesc.trim() || !consignee.trim()) {
			toast.error(
				"Consignment reference, cargo description, and consignee are required."
			);
			return;
		}

		const item: WarehouseInventoryItem = {
			id: `wh-${existingCount + 1}`,
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

		onSubmit(item);
	};

	const isCold = COLD_CHAIN_BINS.has(locationBin);
	const isNonBonded = NON_BONDED_BINS.has(locationBin);

	return (
		<form onSubmit={handleSubmit} className="space-y-6 pb-24">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to inventory
				</Button>
			</div>

			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Secure storage · Warehouse operations
				</p>
				<h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
					Record warehouse intake
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Record cargo received for warehouse storage and assign its storage
					location.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="text-sm font-bold text-ink">Consignment details</h3>
					<p className="mt-1 text-xs text-ink-soft">
						Identify the cargo being stored.
					</p>
				</div>

				<div className="space-y-5 p-5 sm:p-6">
					<label className="block">
						<span className={labelClass}>
							Consignment reference <span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. TRN-C-9025"
							value={consignmentRef}
							onChange={(event) =>
								setConsignmentRef(event.target.value.toUpperCase())
							}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Cargo description <span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. Telecommunications hardware modules"
							value={cargoDesc}
							onChange={(event) => setCargoDesc(event.target.value)}
							className="mt-1.5 h-11 border-line bg-sand text-ink"
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Consignee / client <span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. Atlantic Trade Nigeria Ltd"
							value={consignee}
							onChange={(event) => setConsignee(event.target.value)}
							className="mt-1.5 h-11 border-line bg-sand text-ink"
						/>
					</label>

					<div className="grid gap-4 sm:grid-cols-2">
						<label className="block">
							<span className={labelClass}>Quantity & packaging</span>
							<Input
								placeholder="e.g. 50 pallets"
								value={quantity}
								onChange={(event) => setQuantity(event.target.value)}
								className="mt-1.5 h-11 border-line bg-sand text-ink"
							/>
						</label>

						<label className="block">
							<span className={labelClass}>Volume (m³)</span>
							<Input
								placeholder="e.g. 18.5"
								value={volumeCbm}
								onChange={(event) => setVolumeCbm(event.target.value)}
								className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
							/>
						</label>
					</div>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="text-sm font-bold text-ink">Storage allocation</h3>
					<p className="mt-1 text-xs text-ink-soft">
						Select the warehouse location for this cargo.
					</p>
				</div>

				<div className="space-y-5 p-5 sm:p-6">
					<SelectField
						label="Storage location"
						value={locationBin}
						onChange={setLocationBin}
						options={WAREHOUSE_BINS}
						hint={
							isCold
								? "Temperature-controlled location"
								: isNonBonded
								? "Non-bonded location"
								: "Bonded location"
						}
						hintTone={
							isCold ? "info" : isNonBonded ? "neutral" : "success"
						}
					/>

					<div className="rounded-lg bg-sand p-3 ring-1 ring-line">
						<p className={labelClass}>Allocation preview</p>
						<p className="mt-1 font-mono text-[11px] text-ink">
							{consignmentRef || "TRN-C-XXXX"} ·{" "}
							{locationBin.split(" · ")[0]} · RECEIVED
						</p>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Warehouse intake
						</p>
						<p className="mt-0.5 text-xs text-sand/75">
							{consignmentRef || "Reference pending"} ·{" "}
							{locationBin.split(" · ")[0]}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							<Plus className="size-4" />
							Save allocation
						</Button>
					</div>
				</div>
			</div>
		</form>
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
			<span className={labelClass}>{label}</span>

			<div className="relative mt-1.5">
				<select
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-11 w-full appearance-none rounded-md border border-line bg-sand px-3 pr-9 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
				>
					{options.map((option) => (
						<option key={option} value={option}>
							{option}
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
