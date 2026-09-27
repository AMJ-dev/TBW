import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Calendar,
	Check,
	ClipboardCheck,
	Download,
	Filter,
	Package,
	Plus,
	RefreshCw,
	Search,
	Warehouse,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StockStatus =
	| "In stock"
	| "Reserved"
	| "Examination hold"
	| "Cycle count pending"
	| "Variance flagged";

interface InventoryItem {
	id: string;
	sku: string;
	description: string;
	consignee: string;
	kind: "Carton" | "Pallet" | "Crate" | "Bag" | "Drum";
	quantity: number;
	unit: string;
	weight: string;
	volume: string;
	location: string;
	consignment: string;
	container: string;
	receivedAt: string;
	lastCountedAt: string;
	status: StockStatus;
	notes: string;
}

const initialInventory: InventoryItem[] = [
	{
		id: "inv-1",
		sku: "TRN-SKU-9021",
		description: "Telecommunications transceivers & fiber hardware",
		consignee: "Atlantic Trade Nigeria Ltd",
		kind: "Carton",
		quantity: 140,
		unit: "cartons",
		weight: "18,420 kg",
		volume: "24.5 m³",
		location: "Aisle A · Rack 03 · Bin 12",
		consignment: "TRN-IMP-002481",
		container: "TRIU1234564",
		receivedAt: "06 Sep 2026",
		lastCountedAt: "10 Sep 2026",
		status: "In stock",
		notes: "Packed on 6 pallets.",
	},
	{
		id: "inv-2",
		sku: "TRN-SKU-9022",
		description: "Pharmaceutical grade glucose excipients",
		consignee: "Kano Freight Forwarders",
		kind: "Bag",
		quantity: 320,
		unit: "bags",
		weight: "16,000 kg",
		volume: "18.0 m³",
		location: "Cold Bay · Rack 01 · Bin 04",
		consignment: "TRN-IMP-002482",
		container: "CMAU4829106",
		receivedAt: "07 Sep 2026",
		lastCountedAt: "11 Sep 2026",
		status: "In stock",
		notes: "Cold chain maintained throughout.",
	},
	{
		id: "inv-3",
		sku: "TRN-SKU-9023",
		description: "Heavy commercial generator spares",
		consignee: "Sahara Energy Logistics",
		kind: "Crate",
		quantity: 14,
		unit: "crates",
		weight: "21,100 kg",
		volume: "42.0 m³",
		location: "Heavy Bay · Floor Area 02",
		consignment: "TRN-IMP-002484",
		container: "MSCU1234560",
		receivedAt: "04 Sep 2026",
		lastCountedAt: "08 Sep 2026",
		status: "Examination hold",
		notes: "Awaiting examination coordination outcome.",
	},
	{
		id: "inv-4",
		sku: "TRN-SKU-9024",
		description: "Solar inverter components & battery modules",
		consignee: "Meridian Customs Services",
		kind: "Pallet",
		quantity: 85,
		unit: "pallets",
		weight: "14,200 kg",
		volume: "35.2 m³",
		location: "Aisle B · Rack 02 · Bin 08",
		consignment: "TRN-IMP-002483",
		container: "TEMU3849204",
		receivedAt: "02 Sep 2026",
		lastCountedAt: "12 Sep 2026",
		status: "Reserved",
		notes: "Reserved for collection under slot booking.",
	},
	{
		id: "inv-5",
		sku: "TRN-SKU-9025",
		description: "Food-grade packaging materials",
		consignee: "Prime Haulage Ltd",
		kind: "Pallet",
		quantity: 62,
		unit: "pallets",
		weight: "12,640 kg",
		volume: "28.0 m³",
		location: "Aisle C · Rack 04 · Bin 02",
		consignment: "TRN-IMP-002485",
		container: "OOLU2948108",
		receivedAt: "01 Sep 2026",
		lastCountedAt: "13 Sep 2026",
		status: "Cycle count pending",
		notes: "Scheduled for cycle count this week.",
	},
	{
		id: "inv-6",
		sku: "TRN-SKU-9026",
		description: "Industrial solvents (non-hazardous)",
		consignee: "Coastal Freight Nigeria",
		kind: "Drum",
		quantity: 48,
		unit: "drums",
		weight: "9,600 kg",
		volume: "16.0 m³",
		location: "Aisle D · Rack 01 · Bin 05",
		consignment: "TRN-IMP-002486",
		container: "MSCU9876540",
		receivedAt: "28 Aug 2026",
		lastCountedAt: "08 Sep 2026",
		status: "Variance flagged",
		notes: "System shows 48 drums; last cycle count recorded 47. Under review.",
	},
];

const statusFilters: (StockStatus | "all")[] = [
	"all",
	"In stock",
	"Reserved",
	"Examination hold",
	"Cycle count pending",
	"Variance flagged",
];

export default function OperationsInventoryRoute() {
	const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
	const [selected, setSelected] = useState<InventoryItem | null>(null);
	const [isAddOpen, setIsAddOpen] = useState(false);

	const filtered = useMemo(() => {
		return inventory.filter((i) => {
			const matchQuery =
				i.sku.toLowerCase().includes(query.toLowerCase()) ||
				i.description.toLowerCase().includes(query.toLowerCase()) ||
				i.consignee.toLowerCase().includes(query.toLowerCase()) ||
				i.consignment.toLowerCase().includes(query.toLowerCase()) ||
				i.container.toLowerCase().includes(query.toLowerCase());
			const matchStatus = statusFilter === "all" || i.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [inventory, query, statusFilter]);

	const stats = useMemo(() => {
		const total = inventory.length;
		const inStock = inventory.filter((i) => i.status === "In stock").length;
		const holds = inventory.filter((i) => i.status === "Examination hold").length;
		const variances = inventory.filter((i) => i.status === "Variance flagged").length;
		const pendingCounts = inventory.filter((i) => i.status === "Cycle count pending").length;
		return { total, inStock, holds, variances, pendingCounts };
	}, [inventory]);

	const handleAdd = (next: InventoryItem) => {
		setInventory((prev) => [next, ...prev]);
		setIsAddOpen(false);
		toast.success("Inventory record added locally.");
	};

	const handleMarkCounted = (id: string) => {
		setInventory((prev) =>
			prev.map((i) =>
				i.id === id
					? {
							...i,
							status: "In stock" as StockStatus,
							lastCountedAt: new Date().toLocaleDateString("en-GB", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							}),
							notes: `${i.notes} Cycle count completed.`,
						}
					: i
			)
		);
		toast.success("Cycle count recorded.");
		setSelected(null);
	};

	return (
		<AppShell title="Inventory & stock-take" eyebrow="Operations · Bonded warehouse">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Inventory
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Bonded inventory & stock-take
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Real-time bonded stock across aisles, racks, and cold bays. Cycle counts and
						full stock-take adjustments are recorded with variance flags and approved
						adjustments.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Stock-take report exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export stock list
					</Button>
					<Link to="/operations/cycle-count">
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ClipboardCheck className="mr-1.5 size-4" /> Start cycle count
						</Button>
					</Link>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsAddOpen(true)}
					>
						<Plus className="mr-1.5 size-4" /> Add stock record
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Tracked stock lines"
					value={String(stats.total)}
					detail="Bonded inventory"
					tone="info"
					icon={Boxes}
				/>
				<Metric
					label="In stock"
					value={String(stats.inStock)}
					detail="No exception recorded"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Holds & pending"
					value={String(stats.holds + stats.pendingCounts)}
					detail={`${stats.holds} examination · ${stats.pendingCounts} count pending`}
					tone="warning"
					icon={Warehouse}
				/>
				<Metric
					label="Variance flagged"
					value={String(stats.variances)}
					detail="Awaiting supervisor review"
					tone={stats.variances > 0 ? "critical" : "success"}
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
							placeholder="Search by SKU, description, consignee, consignment, or container..."
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
						<Package className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">No stock lines match your filters.</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different SKU, consignee, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1100px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">SKU / description</th>
									<th className="px-4 py-3 font-medium">Consignee</th>
									<th className="px-4 py-3 font-medium">Location</th>
									<th className="px-4 py-3 font-medium">Quantity</th>
									<th className="px-4 py-3 font-medium">Weight / volume</th>
									<th className="px-4 py-3 font-medium">Last counted</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((item) => (
									<tr key={item.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] font-semibold text-orange-deep">
												{item.sku}
											</p>
											<p className="mt-0.5 line-clamp-1 text-[12px] text-ink">
												{item.description}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{item.consignment} · {item.container}
											</p>
										</td>
										<td className="px-4 py-3.5 text-[12px] text-ink">
											{item.consignee}
										</td>
										<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
											{item.location}
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] font-semibold text-ink">
												{item.quantity} {item.unit}
											</p>
											<p className="mt-0.5 text-[10px] text-ink-soft">{item.kind}</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink">{item.weight}</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{item.volume}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink-soft">
												{item.lastCountedAt}
											</p>
											<p className="mt-0.5 text-[10px] text-ink-soft">
												Received {item.receivedAt}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge label={item.status} tone={statusTone(item.status)} />
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelected(item)}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												View <ArrowRight className="ml-1 size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {inventory.length} stock lines
					</span>
					<span>Every adjustment creates an auditable event</span>
				</div>
			</section>

			{selected && (
				<InventoryDetailDialog
					item={selected}
					onClose={() => setSelected(null)}
					onCountComplete={() => handleMarkCounted(selected.id)}
				/>
			)}

			{isAddOpen && (
				<AddInventoryModal
					onClose={() => setIsAddOpen(false)}
					onSubmit={handleAdd}
				/>
			)}
		</AppShell>
	);
}

function InventoryDetailDialog({
	item,
	onClose,
	onCountComplete,
}: {
	item: InventoryItem;
	onClose: () => void;
	onCountComplete: () => void;
}) {
	const isVariance = item.status === "Variance flagged";
	const canCount = item.status === "Cycle count pending" || item.status === "In stock";
	const canResolve = isVariance;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Stock line
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">{item.sku}</h3>
						<p className="mt-1 text-[12px] text-ink-soft">{item.description}</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge label={item.status} tone={statusTone(item.status)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{item.kind}
						</span>
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{item.unit}
						</span>
					</div>

					{isVariance && (
						<div className="flex items-start gap-3 rounded-xl bg-coral/5 p-4 ring-1 ring-coral/20">
							<AlertTriangle className="mt-0.5 size-4 shrink-0 text-coral" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									Variance flagged for review
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									The most recent cycle count differs from the system figure.
									Adjustments require supervisor approval before the stock figure is
									updated.
								</p>
							</div>
						</div>
					)}

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{item.notes}</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["SKU", item.sku, true],
							["Description", item.description],
							["Kind", item.kind],
							["Quantity", `${item.quantity} ${item.unit}`, true],
							["Weight", item.weight, true],
							["Volume", item.volume, true],
							["Location", item.location, true],
							["Consignment", item.consignment, true],
							["Container", item.container, true],
							["Consignee", item.consignee],
							["Received", item.receivedAt, true],
							["Last counted", item.lastCountedAt, true],
						].map(([label, value, mono]) => (
							<div key={label as string}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-sm font-medium text-ink",
										mono && "font-mono"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-start gap-3">
							<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									Cycle count policy
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									Cycle counts are scheduled and can be recorded from the handheld.
									Any variance requires supervisor review before the stock figure is
									adjusted.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						<Link
							to="/portal/cargo/$id"
							params={{ id: item.consignment.split("-").pop() ?? "2481" }}
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								<Package className="mr-1.5 size-4" /> Open consignment
							</Button>
						</Link>
						{canCount && (
							<Button
								onClick={onCountComplete}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Mark cycle count complete
							</Button>
						)}
						{canResolve && (
							<Button
								onClick={onCountComplete}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<RefreshCw className="mr-1.5 size-4" /> Resolve variance
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function AddInventoryModal({
	onClose,
	onSubmit,
}: {
	onClose: () => void;
	onSubmit: (i: InventoryItem) => void;
}) {
	const [sku, setSku] = useState("");
	const [description, setDescription] = useState("");
	const [consignee, setConsignee] = useState("");
	const [kind, setKind] = useState<InventoryItem["kind"]>("Carton");
	const [quantity, setQuantity] = useState("");
	const [unit, setUnit] = useState("cartons");
	const [weight, setWeight] = useState("");
	const [volume, setVolume] = useState("");
	const [location, setLocation] = useState("");
	const [consignment, setConsignment] = useState("");
	const [container, setContainer] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!sku.trim() || !description.trim() || !quantity.trim()) {
			toast.error("SKU, description, and quantity are required.");
			return;
		}
		onSubmit({
			id: `inv-${Date.now()}`,
			sku,
			description,
			consignee: consignee || "—",
			kind,
			quantity: Number(quantity) || 0,
			unit,
			weight: weight || "—",
			volume: volume || "—",
			location: location || "Aisle A · Rack 01 · Bin 01",
			consignment: consignment || "—",
			container: container || "—",
			receivedAt: new Date().toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			lastCountedAt: "—",
			status: "In stock",
			notes: notes || "Stock line added from the operations console.",
		});
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								New stock line
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Add stock to bonded inventory
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								New stock lines are recorded with a SKU, description, and location.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="SKU"
								placeholder="TRN-SKU-9027"
								value={sku}
								onChange={setSku}
								mono
								required
							/>
							<Field
								label="Kind"
								placeholder="Carton"
								value={kind}
								onChange={(v) => setKind(v as InventoryItem["kind"])}
							/>
						</div>

						<Field
							label="Description"
							placeholder="What is the cargo?"
							value={description}
							onChange={setDescription}
							required
						/>

						<Field
							label="Consignee"
							placeholder="Atlantic Trade Nigeria Ltd"
							value={consignee}
							onChange={setConsignee}
						/>

						<div className="grid gap-3 sm:grid-cols-3">
							<Field
								label="Quantity"
								placeholder="120"
								value={quantity}
								onChange={setQuantity}
								mono
								required
							/>
							<Field
								label="Unit"
								placeholder="cartons"
								value={unit}
								onChange={setUnit}
							/>
							<Field
								label="Weight"
								placeholder="18,420 kg"
								value={weight}
								onChange={setWeight}
								mono
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Volume"
								placeholder="24.5 m³"
								value={volume}
								onChange={setVolume}
								mono
							/>
							<Field
								label="Location"
								placeholder="Aisle A · Rack 03 · Bin 12"
								value={location}
								onChange={setLocation}
								mono
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Consignment"
								placeholder="TRN-IMP-002481"
								value={consignment}
								onChange={setConsignment}
								mono
							/>
							<Field
								label="Container"
								placeholder="TRIU1234564"
								value={container}
								onChange={setContainer}
								mono
							/>
						</div>

						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Notes
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Handling notes, packaging details, or other context."
							/>
						</label>
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Add stock line <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}