import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Boxes,
	CheckCircle2,
	Clock,
	Download,
	Filter,
	Package,
	Plus,
	Search,
	Snowflake,
	Warehouse,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WarehouseInventoryItem {
	id: string;
	sku: string;
	cargoDesc: string;
	consignee: string;
	locationBin: string;
	quantity: string;
	volumeCbm: string;
	bondedStatus: "Customs Bonded" | "Released" | "Examination Required";
	dwellDays: number;
}

const initialWarehouseStock: WarehouseInventoryItem[] = [
	{
		id: "wh-1",
		sku: "TRN-SKU-9021",
		cargoDesc: "Telecommunications Transceivers & Fiber Hardware",
		consignee: "Atlantic Trade Nigeria Ltd",
		locationBin: "Aisle A · Rack 03 · Bin 12",
		quantity: "140 Cartons",
		volumeCbm: "24.5 m³",
		bondedStatus: "Customs Bonded",
		dwellDays: 4,
	},
	{
		id: "wh-2",
		sku: "TRN-SKU-9022",
		cargoDesc: "Pharmaceutical Grade Glucose Excipients",
		consignee: "Kano Freight Forwarders",
		locationBin: "Cold Bay · Rack 01 · Bin 04",
		quantity: "320 Bags",
		volumeCbm: "18.0 m³",
		bondedStatus: "Customs Bonded",
		dwellDays: 6,
	},
	{
		id: "wh-3",
		sku: "TRN-SKU-9023",
		cargoDesc: "Heavy Commercial Generator Spares",
		consignee: "Sahara Energy Logistics",
		locationBin: "Heavy Bay · Floor Area 02",
		quantity: "14 Crates",
		volumeCbm: "42.0 m³",
		bondedStatus: "Examination Required",
		dwellDays: 9,
	},
	{
		id: "wh-4",
		sku: "TRN-SKU-9024",
		cargoDesc: "Solar Inverter Components & Battery Modules",
		consignee: "Meridian Customs Services",
		locationBin: "Aisle B · Rack 02 · Bin 08",
		quantity: "85 Pallets",
		volumeCbm: "35.2 m³",
		bondedStatus: "Released",
		dwellDays: 2,
	},
];

export default function OperationsWarehouseRoute() {
	const [stock, setStock] = useState<WarehouseInventoryItem[]>(initialWarehouseStock);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [sku, setSku] = useState("");
	const [cargoDesc, setCargoDesc] = useState("");
	const [consignee, setConsignee] = useState("");
	const [locationBin, setLocationBin] = useState("Aisle A · Rack 01 · Bin 01");
	const [quantity, setQuantity] = useState("");
	const [volumeCbm, setVolumeCbm] = useState("");

	const filteredStock = useMemo(() => {
		return stock.filter((s) => {
			const matchQuery =
				s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.cargoDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.locationBin.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL"
					? true
					: s.bondedStatus.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [stock, searchQuery, statusFilter]);

	const handleStockIntake = (e: React.FormEvent) => {
		e.preventDefault();
		if (!cargoDesc || !consignee) {
			toast.error("Please fill in cargo description and consignee.");
			return;
		}

		const nextSku = sku || `TRN-SKU-00${25 + stock.length}`;
		const newItem: WarehouseInventoryItem = {
			id: `wh-${stock.length + 1}`,
			sku: nextSku,
			cargoDesc,
			consignee,
			locationBin,
			quantity: quantity || "1 Unit",
			volumeCbm: volumeCbm.includes("m³") ? volumeCbm : `${volumeCbm || "10"} m³`,
			bondedStatus: "Customs Bonded",
			dwellDays: 0,
		};

		setStock([newItem, ...stock]);
		setIsModalOpen(false);
		setSku("");
		setCargoDesc("");
		setConsignee("");
		setQuantity("");
		setVolumeCbm("");
		toast.success(`Cargo item ${nextSku} slotted locally into ${locationBin}.`);
	};

	return (
		<AppShell title="Bonded Warehouse" eyebrow="Operations · Internal Storage & Inventory">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Secure Storage · Bonded Warehouse Area
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Bonded warehouse inventory & bin allocation
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Tracking of de-stuffed LCL consignments, pallet positions, cold storage
						chambers, and cycle count logs.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Warehouse inventory manifest exported locally.")}
					>
						<Download className="size-4" /> Export Stock List
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Record Bin Intake
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Warehouse Occupancy"
					value="78%"
					detail="22% (1,120 m²) available"
					tone="warning"
					icon={Warehouse}
				/>
				<Metric
					label="Tracked Bins"
					value="284 Active"
					detail="Across Aisles A–D"
					tone="info"
					icon={Package}
				/>
				<Metric
					label="Cold Room Status"
					value="Nominal"
					detail="Continuous sensor check"
					tone="success"
					icon={Snowflake}
				/>
				<Metric
					label="Cycle Counts"
					value="100% Match"
					detail="Zero discrepancy recorded"
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
							placeholder="Search by SKU, cargo description, consignee, or bin location..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Customs Bonded", "Released", "Examination Required"].map((s) => (
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
								<th className="px-4 py-3 font-medium">SKU / Item ID</th>
								<th className="px-4 py-3 font-medium">Cargo Description</th>
								<th className="px-4 py-3 font-medium">Consignee</th>
								<th className="px-4 py-3 font-medium">Bin / Bay Allocation</th>
								<th className="px-4 py-3 font-medium">Qty / Volume</th>
								<th className="px-4 py-3 font-medium">Dwell</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredStock.map((item) => (
								<tr key={item.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{item.sku}
									</td>
									<td
										className="max-w-xs truncate px-4 py-3.5 text-xs font-medium text-ink"
										title={item.cargoDesc}
									>
										{item.cargoDesc}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">{item.consignee}</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-ink">
										{item.locationBin}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{item.quantity} · {item.volumeCbm}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{item.dwellDays} days
									</td>
									<td className="px-4 py-3.5">
										<StatusBadge
											label={item.bondedStatus}
											tone={
												item.bondedStatus === "Released"
													? "success"
													: item.bondedStatus === "Examination Required"
													? "warning"
													: "info"
											}
										/>
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => toast.success(`Cycle count verified for ${item.sku}`)}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											Audit Bin
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredStock.length} of {stock.length} inventory bin positions
					</span>
					<span>Bond WH · Abuja Flagship Facility</span>
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
									Inventory Intake
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Record Warehouse Bin Intake
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleStockIntake} className="mt-5 space-y-4">
							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Cargo Description
								</label>
								<Input
									required
									placeholder="e.g. Telecommunications Hardware Modules"
									value={cargoDesc}
									onChange={(e) => setCargoDesc(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Consignee / Client
								</label>
								<Input
									required
									placeholder="e.g. Atlantic Trade Nigeria Ltd"
									value={consignee}
									onChange={(e) => setConsignee(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Quantity & Packaging
									</label>
									<Input
										placeholder="e.g. 50 Pallets"
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Volume (CBM)
									</label>
									<Input
										placeholder="e.g. 18.5"
										value={volumeCbm}
										onChange={(e) => setVolumeCbm(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Assigned Aisle / Bin Location
								</label>
								<select
									value={locationBin}
									onChange={(e) => setLocationBin(e.target.value)}
									className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
								>
									<option>Aisle A · Rack 01 · Bin 01</option>
									<option>Aisle A · Rack 02 · Bin 05</option>
									<option>Aisle B · Rack 01 · Bin 12</option>
									<option>Cold Bay · Rack 01 · Bin 02</option>
									<option>Heavy Bay · Floor Area 03</option>
								</select>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Save Warehouse Allocation
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}