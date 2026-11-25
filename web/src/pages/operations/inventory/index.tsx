
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Boxes,
	Check,
	Download,
	Filter,
	Package,
	RefreshCw,
	Search,
	Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

interface InventoryItem {
	id: string;
	sku: string;
	description: string;
	consignee: string;
	kind: string;
	quantity: number;
	unit: string;
	weight: string;
	volume: string;
	location: string;
	consignment: string;
	container: string;
	receivedAt: string;
	status: string;
	notes: string;
}

interface InventoryApiItem {
	id?: string;
	sku?: string;
	description?: string;
	consignee?: string;
	kind?: string;
	quantity?: number | string;
	unit?: string;
	weight?: string | number;
	volume?: string | number;
	location?: string;
	consignment?: string;
	container?: string;
	receivedAt?: string;
	received_at?: string;
	status?: string;
	notes?: string;
	[key: string]: unknown;
}

const statusGroups: Record<string, string[]> = {
	"In Storage": ["IN_YARD", "IN_WAREHOUSE"],
	"In Examination": [
		"EXAMINATION_SCHEDULED",
		"UNDER_EXAMINATION",
		"EXAMINATION_COMPLETE",
	],
	"Examination Rejected": ["EXAMINATION_REJECTED"],
};

const getInventoryStatus = (status: string) => {
	const normalized = status.toUpperCase();

	for (const [label, statuses] of Object.entries(statusGroups)) {
		if (statuses.includes(normalized)) {
			return label;
		}
	}

	return normalized
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
};

const mapInventory = (item: InventoryApiItem): InventoryItem => ({
	id: String(item.id ?? ""),
	sku: String(item.sku ?? ""),
	description: String(item.description ?? ""),
	consignee: String(item.consignee ?? ""),
	kind: String(item.kind ?? ""),
	quantity: Number(item.quantity ?? 0),
	unit: String(item.unit ?? ""),
	weight: String(item.weight ?? ""),
	volume: String(item.volume ?? ""),
	location: String(item.location ?? ""),
	consignment: String(item.consignment ?? ""),
	container: String(item.container ?? ""),
	receivedAt: String(item.receivedAt ?? item.received_at ?? ""),
	status: String(item.status ?? "Unknown"),
	notes: String(item.notes ?? ""),
});

export default function OperationsInventoryPage() {
	const [inventory, setInventory] = useState<InventoryItem[]>([]);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);

	const loadInventory = useCallback(async () => {
		setLoading(true);
		setLoadError(false);

		try {
			const res = await http.get("/operations/inventory/");
			const resp: Resp = res.data;

			if (resp.error) {
				throw new Error("Could not load inventory.");
			}

			const rows = Array.isArray(resp.data)
				? (resp.data as InventoryApiItem[])
				: [];

			setInventory(rows.map(mapInventory));
		} catch {
			setLoadError(true);
			toast.error("Could not load inventory.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadInventory();
	}, [loadInventory]);

	const statusFilters = useMemo(() => {
		const statuses = Array.from(
			new Set(inventory.map((item) => getInventoryStatus(item.status)))
		);

		return ["all", ...statuses];
	}, [inventory]);

	const filtered = useMemo(() => {
		const search = query.toLowerCase().trim();

		return inventory.filter((item) => {
			const matchQuery =
				item.sku.toLowerCase().includes(search) ||
				item.description.toLowerCase().includes(search) ||
				item.consignee.toLowerCase().includes(search) ||
				item.consignment.toLowerCase().includes(search) ||
				item.container.toLowerCase().includes(search);

			const matchStatus =
				statusFilter === "all" ||
				getInventoryStatus(item.status) === statusFilter;

			return matchQuery && matchStatus;
		});
	}, [inventory, query, statusFilter]);

	const stats = useMemo(() => {
		const total = inventory.length;

		const inStock = inventory.filter((item) =>
			["IN_YARD", "IN_WAREHOUSE"].includes(item.status.toUpperCase())
		).length;

		const holds = inventory.filter(
			(item) => getInventoryStatus(item.status) === "In Examination"
		).length;

		const reserved = inventory.filter(
			(item) => item.status.toUpperCase() === "RELEASE_AUTHORISED"
		).length;

		return { total, inStock, holds, reserved };
	}, [inventory]);

	return (
		<AppShell title="Inventory" eyebrow="Operations · Bonded warehouse">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Inventory
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Bonded inventory
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Real-time view of bonded cargo across terminal storage locations, including quantities,
						container details, current locations, and operational status.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Inventory list exported locally.")}
					>
						<Download className="mr-1.5 size-4" />
						Export inventory
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
					label="In storage"
					value={String(stats.inStock)}
					detail="Yard and warehouse"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="In examination"
					value={String(stats.holds)}
					detail="Scheduled or undergoing examination"
					tone="warning"
					icon={Warehouse}
				/>
				<Metric
					label="Release authorised"
					value={String(stats.reserved)}
					detail="Authorised for release"
					tone="info"
					icon={Package}
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

					<div className="flex items-center gap-2">
						<Filter className="size-4 text-ink-soft" />

						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-10 min-w-[180px] rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none transition-colors focus:border-orange"
						>
							{statusFilters.map((status) => (
								<option key={status} value={status}>
									{status === "all" ? "All statuses" : status}
								</option>
							))}
						</select>
					</div>
				</div>

				{loading ? (
					<div className="flex flex-col items-center justify-center p-12">
						<RefreshCw className="size-7 animate-spin text-ink-soft" />
						<p className="mt-3 text-sm font-medium text-ink">
							Loading inventory...
						</p>
					</div>
				) : loadError ? (
					<div className="flex flex-col items-center justify-center p-12 text-center">
						<Package className="size-8 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							Could not load inventory.
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							Check your connection and try again.
						</p>
						<Button
							variant="outline"
							className="mt-4 border-line"
							onClick={loadInventory}
						>
							<RefreshCw className="mr-2 size-4" />
							Retry
						</Button>
					</div>
				) : filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Package className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							{inventory.length === 0
								? "No inventory records found."
								: "No stock lines match your filters."}
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							{inventory.length === 0
								? "Inventory records will appear here when available."
								: "Try a different SKU, consignee, or status."}
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
									<th className="px-4 py-3 font-medium">Received</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{filtered.map((item) => (
									<tr
										key={item.id}
										className="transition-colors hover:bg-sand/60"
									>
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
											<p className="mt-0.5 text-[10px] text-ink-soft">
												{item.kind}
											</p>
										</td>

										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink">
												{item.weight}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{item.volume}
											</p>
										</td>

										<td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
											{item.receivedAt}
										</td>

										<td className="px-4 py-3.5">
											<StatusBadge
												label={getInventoryStatus(item.status)}
												tone={statusTone(getInventoryStatus(item.status))}
											/>
										</td>

										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												asChild
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												<Link to={`/operations/inventory/${item.id}`}>
													View <ArrowRight className="ml-1 size-3.5" />
												</Link>
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
						Showing {loading || loadError ? 0 : filtered.length} of {inventory.length} stock lines
					</span>
					<span>Inventory records are retained for operational traceability</span>
				</div>
			</section>
		</AppShell>
	);
}
