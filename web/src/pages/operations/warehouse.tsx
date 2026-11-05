import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	Boxes,
	Check,
	CheckCircle2,
	ChevronDown,
	Clock3,
	MapPin,
	Package,
	RefreshCw,
	Search,
	Warehouse,
} from "lucide-react";
import {
	AppShell,
	StatusBadge,
	statusTone,
	Metric,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type SearchWhere =
	| "bill_of_lading"
	| "shipment_reference"
	| "container_number"
	| "seal_number";

interface WarehouseLocation {
	id: string;
	code: string;
	name: string;
	kind: string;
	status: string;
	parent_name?: string;
	capacity?: number | string | null;
	capacity_unit?: string;
}

interface ShipmentDetails {
	id: string;
	shipment_id: string;
	shipment_reference: string;
	bill_of_lading: string;
	consignee: string;
	vessel_name: string;
	voyage_number: string;
	shipping_line: string;
	status: string;
}

interface ShipmentContainer {
	container_id: string;
	shipment_id: string;
	container_no: string;
	size: string;
	seal_no: string;
	actual_seal_no: string;
	gross_weight: string | number | null;
	actual_weight: string | number | null;
	cargo_description: string;
	package_count: string | number | null;
	package_type: string;
	status: string;
	current_location_id: string;
	current_location_name: string;
	current_location_code: string;
	current_location_kind: string;
	receiving_status: string;
	can_move: boolean | number;
}

interface WarehouseMovement {
	id: string;
	movement_reference: string;
	shipment_id: string;
	container_id: string;
	shipment_reference: string;
	bill_of_lading: string;
	container_no: string;
	origin_location_name: string;
	origin_location_code: string;
	destination_location_name: string;
	destination_location_code: string;
	remarks: string;
	moved_by: string;
	completed_at: string;
	created_at: string;
	status: string;
}

interface ContainerDraft {
	to_location_id: string;
	remarks: string;
}

const SEARCH_OPTIONS: {
	value: SearchWhere;
	label: string;
}[] = [
	{ value: "bill_of_lading", label: "Bill of Lading" },
	{ value: "shipment_reference", label: "Shipment Reference" },
	{ value: "container_number", label: "Container Number" },
	{ value: "seal_number", label: "Seal Number" },
];

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const getString = (value: unknown, fallback = ""): string => {
	if (value === null || value === undefined) return fallback;
	return String(value);
};

const getLocationLabel = (location: WarehouseLocation) =>
	[location.code, location.name].filter(Boolean).join(" · ");

const normalizeLocation = (item: any): WarehouseLocation => ({
	id: getString(item.id ?? item.location_id),
	code: getString(item.code ?? item.location_code),
	name: getString(item.name ?? item.location_name),
	kind: getString(item.kind ?? item.location_type),
	status: getString(item.status),
	parent_name: getString(item.parent_name),
	capacity: item.capacity ?? null,
	capacity_unit: getString(item.capacity_unit),
});

const normalizeContainer = (item: any): ShipmentContainer => ({
	container_id: getString(item.container_id ?? item.id),
	shipment_id: getString(item.shipment_id),
	container_no: getString(
		item.container_no ?? item.container_number
	),
	size: getString(item.size ?? item.container_size),
	seal_no: getString(item.seal_no),
	actual_seal_no: getString(
		item.actual_seal_no ?? item.seal_no
	),
	gross_weight: item.gross_weight ?? null,
	actual_weight: item.actual_weight ?? null,
	cargo_description: getString(item.cargo_description),
	package_count: item.package_count ?? null,
	package_type: getString(item.package_type),
	status: getString(item.status),
	current_location_id: getString(item.current_location_id),
	current_location_name: getString(
		item.current_location_name ??
			item.current_location ??
			item.receiving_location_name
	),
	current_location_code: getString(
		item.current_location_code
	),
	current_location_kind: getString(
		item.current_location_kind ??
			item.location_kind
	),
	receiving_status: getString(item.receiving_status),
	can_move:
		item.can_move === true ||
		item.can_move === 1 ||
		item.can_move === "1",
});

const normalizeShipment = (item: any): ShipmentDetails => ({
	id: getString(item.id ?? item.shipment_id),
	shipment_id: getString(item.shipment_id ?? item.id),
	shipment_reference: getString(item.shipment_reference),
	bill_of_lading: getString(item.bill_of_lading),
	consignee: getString(item.consignee),
	vessel_name: getString(item.vessel_name),
	voyage_number: getString(item.voyage_number),
	shipping_line: getString(item.shipping_line),
	status: getString(item.status),
});

const normalizeMovement = (item: any): WarehouseMovement => ({
	id: getString(item.id ?? item.movement_id),
	movement_reference: getString(item.movement_reference),
	shipment_id: getString(item.shipment_id),
	container_id: getString(item.container_id),
	shipment_reference: getString(item.shipment_reference),
	bill_of_lading: getString(item.bill_of_lading),
	container_no: getString(
		item.container_no ?? item.container_number
	),
	origin_location_name: getString(
		item.origin_location_name ?? item.origin_name
	),
	origin_location_code: getString(
		item.origin_location_code ?? item.origin_code
	),
	destination_location_name: getString(
		item.destination_location_name ?? item.destination_name
	),
	destination_location_code: getString(
		item.destination_location_code ?? item.destination_code
	),
	remarks: getString(item.remarks),
	moved_by: getString(item.moved_by),
	completed_at: getString(item.completed_at),
	created_at: getString(item.created_at),
	status: getString(item.status, "COMPLETED"),
});

export default function WarehouseManagementPage() {
	const [movements, setMovements] = useState<WarehouseMovement[]>([]);
	const [warehouseLocations, setWarehouseLocations] = useState<
		WarehouseLocation[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [loadingLocations, setLoadingLocations] = useState(false);
	const [view, setView] = useState<"list" | "placement">("list");
	const [selectedMovement, setSelectedMovement] =
		useState<WarehouseMovement | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchWhere, setSearchWhere] =
		useState<SearchWhere>("bill_of_lading");
	const [statusFilter, setStatusFilter] = useState("ALL");

	const fetchMovements = useCallback(async () => {
		try {
			setLoading(true);

			const res = await http.get("/operator/warehouses/");
			const resp: Resp = res.data;
			const data = resp.data as any;

			if (resp.error) {
				throw new Error(
					getString(data, "Could not load warehouse movements.")
				);
			}

			const rows = Array.isArray(data)
				? data
				: Array.isArray(data?.movements)
					? data.movements
					: [];

			setMovements(rows.map(normalizeMovement));
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					error?.message ||
					"Could not load warehouse movements."
			);
			setMovements([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchWarehouseLocations = useCallback(async () => {
		try {
			setLoadingLocations(true);

			const res = await http.post(
				"/admin/config/search-location/",
				{
					q: "WAREHOUSE",
				}
			);

			const resp: Resp = res.data;
			const data = resp.data as any;
			const code = resp.code as any;

			if (resp.error) {
				throw new Error("Could not load warehouse locations.");
			}

			const rows = Array.isArray(data)
				? data
				: Array.isArray(data?.locations)
					? data.locations
					: Array.isArray(code?.locations)
						? code.locations
						: [];

			setWarehouseLocations(
				rows
					.map(normalizeLocation)
					.filter(
						(location: WarehouseLocation) =>
							location.id &&
							location.kind.toUpperCase() === "WAREHOUSE" &&
							location.status.toLowerCase() === "active"
					)
			);
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					error?.message ||
					"Could not load warehouse locations."
			);
			setWarehouseLocations([]);
		} finally {
			setLoadingLocations(false);
		}
	}, []);

	useEffect(() => {
		void fetchMovements();
		void fetchWarehouseLocations();
	}, [fetchMovements, fetchWarehouseLocations]);

	const filteredMovements = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		return movements.filter((movement) => {
			const searchable = [
				movement.movement_reference,
				movement.shipment_reference,
				movement.bill_of_lading,
				movement.container_no,
				movement.origin_location_name,
				movement.origin_location_code,
				movement.destination_location_name,
				movement.destination_location_code,
				movement.moved_by,
				movement.remarks,
			]
				.join(" ")
				.toLowerCase();

			const matchesQuery =
				!query || searchable.includes(query);

			const matchesStatus =
				statusFilter === "ALL" ||
				movement.status === statusFilter;

			return matchesQuery && matchesStatus;
		});
	}, [movements, searchQuery, statusFilter]);

	const storedContainers = new Set(
		movements.map((movement) => movement.container_id)
	).size;

	const uniqueWarehouses = new Set(
		movements
			.map(
				(movement) =>
					movement.destination_location_code ||
					movement.destination_location_name
			)
			.filter(Boolean)
	).size;

	const handleExport = () => {
		if (!movements.length) {
			toast.error("There are no warehouse movements to export.");
			return;
		}

		const headers = [
			"Movement Reference",
			"Shipment Reference",
			"Bill of Lading",
			"Container",
			"Origin",
			"Warehouse",
			"Operator",
			"Remarks",
			"Completed At",
		];

		const rows = movements.map((movement) =>
			[
				movement.movement_reference,
				movement.shipment_reference,
				movement.bill_of_lading,
				movement.container_no,
				movement.origin_location_name,
				movement.destination_location_name,
				movement.moved_by,
				movement.remarks,
				movement.completed_at || movement.created_at,
			]
				.map(
					(value) =>
						`"${String(value ?? "").replaceAll('"', '""')}"`
				)
				.join(",")
		);

		const csv = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csv], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = url;
		link.download = "warehouse-movements.csv";
		link.click();

		URL.revokeObjectURL(url);
	};

	return (
		<AppShell
			title="Warehouse Management"
			eyebrow="Operations · Warehouse Storage & Placement"
		>
			<div className="overflow-hidden">
				{view === "list" ? (
					<MovementList
						movements={movements}
						filteredMovements={filteredMovements}
						loading={loading}
						searchQuery={searchQuery}
						statusFilter={statusFilter}
						onSearchChange={setSearchQuery}
						onStatusChange={setStatusFilter}
						onNewPlacement={() => {
							setSelectedMovement(null);
							setView("placement");
						}}
						onRefresh={fetchMovements}
						onExport={handleExport}
						onSelectMovement={setSelectedMovement}
						warehouseCount={uniqueWarehouses}
						storedCount={storedContainers}
					/>
				) : (
					<WarehousePlacement
						warehouseLocations={warehouseLocations}
						loadingLocations={loadingLocations}
						onCancel={() => setView("list")}
						onSaved={async () => {
							await fetchMovements();
							setView("list");
						}}
					/>
				)}
			</div>

			{selectedMovement && (
				<MovementDetails
					movement={selectedMovement}
					onClose={() => setSelectedMovement(null)}
				/>
			)}
		</AppShell>
	);
}

function MovementList({
	movements,
	filteredMovements,
	loading,
	searchQuery,
	statusFilter,
	onSearchChange,
	onStatusChange,
	onNewPlacement,
	onRefresh,
	onExport,
	onSelectMovement,
	warehouseCount,
	storedCount,
}: {
	movements: WarehouseMovement[];
	filteredMovements: WarehouseMovement[];
	loading: boolean;
	searchQuery: string;
	statusFilter: string;
	onSearchChange: (value: string) => void;
	onStatusChange: (value: string) => void;
	onNewPlacement: () => void;
	onRefresh: () => void;
	onExport: () => void;
	onSelectMovement: (movement: WarehouseMovement) => void;
	warehouseCount: number;
	storedCount: number;
}) {
	return (
		<div
			className="space-y-6 pb-8"
			style={{
				animation:
					"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<style>{`
				@keyframes slideInFromRight {
					from { opacity: 0; transform: translateX(24px); }
					to { opacity: 1; transform: translateX(0); }
				}
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Storage · Warehouse placement
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Warehouse storage &amp; placement
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Receive eligible containers from the yard into
						configured warehouse locations and maintain a
						record of every completed placement.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onRefresh}
						disabled={loading}
					>
						<RefreshCw
							className={cn(
								"size-4",
								loading && "animate-spin"
							)}
						/>
						Refresh
					</Button>

					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Package className="size-4" />
						Export log
					</Button>

					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewPlacement}
					>
						<Warehouse className="size-4" />
						New placement
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Movement records"
					value={movements.length.toLocaleString()}
					detail="Completed warehouse movements"
					tone="info"
					icon={Boxes}
				/>

				<Metric
					label="Containers stored"
					value={storedCount.toLocaleString()}
					detail="Containers with warehouse movement records"
					tone="success"
					icon={Package}
				/>

				<Metric
					label="Active warehouses used"
					value={warehouseCount.toLocaleString()}
					detail="Destinations in movement history"
					tone="info"
					icon={Warehouse}
				/>

				<Metric
					label="Available destinations"
					value="Configured"
					detail="Loaded from terminal locations"
					tone="info"
					icon={MapPin}
				/>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(event) =>
								onSearchChange(event.target.value)
							}
							placeholder="Search by container, shipment, warehouse, or movement reference…"
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-xs text-ink-soft">
							Status:
						</span>

						{["ALL", "COMPLETED"].map((status) => (
							<button
								key={status}
								type="button"
								onClick={() => onStatusChange(status)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === status
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{status === "ALL" ? "All" : "Completed"}
							</button>
						))}
					</div>
				</div>

				{loading ? (
					<div className="p-10 text-center">
						<RefreshCw className="mx-auto size-6 animate-spin text-orange" />
						<p className="mt-3 text-sm text-ink-soft">
							Loading warehouse movements...
						</p>
					</div>
				) : filteredMovements.length === 0 ? (
					<div className="p-10 text-center">
						<Warehouse className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 text-sm font-semibold text-ink">
							{movements.length
								? "No movements match your search"
								: "No warehouse movements found"}
						</p>
						<p className="mt-1 text-xs text-ink-soft">
							{movements.length
								? "Try another search term or filter."
								: "Completed warehouse placements will appear here."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1050px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">
										Container
									</th>
									<th className="px-4 py-3 font-medium">
										Shipment
									</th>
									<th className="px-4 py-3 font-medium">
										Origin
									</th>
									<th className="px-4 py-3 font-medium">
										Warehouse destination
									</th>
									<th className="px-4 py-3 font-medium">
										Movement reference
									</th>
									<th className="px-4 py-3 font-medium">
										Operator
									</th>
									<th className="px-4 py-3 font-medium">
										Status
									</th>
									<th className="px-4 py-3 text-right font-medium">
										Completed
									</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-line">
								{filteredMovements.map((movement) => (
									<tr
										key={movement.id}
										onClick={() =>
											onSelectMovement(movement)
										}
										className="cursor-pointer transition-colors hover:bg-sand/40"
									>
										<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
											{movement.container_no || "—"}
										</td>

										<td className="px-4 py-3.5">
											<p className="font-mono text-xs text-ink">
												{movement.shipment_reference ||
													"—"}
											</p>
											<p className="mt-1 font-mono text-[10px] text-ink-soft">
												{movement.bill_of_lading ||
													"—"}
											</p>
										</td>

										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{movement.origin_location_name ||
												"—"}
										</td>

										<td className="px-4 py-3.5">
											<p className="text-xs font-semibold text-orange-deep">
												{movement.destination_location_name ||
													"—"}
											</p>
											{movement.destination_location_code && (
												<p className="mt-1 font-mono text-[10px] text-ink-soft">
													{
														movement.destination_location_code
													}
												</p>
											)}
										</td>

										<td className="px-4 py-3.5 font-mono text-[10px] text-ink-soft">
											{movement.movement_reference ||
												"—"}
										</td>

										<td className="px-4 py-3.5 text-xs text-ink">
											{movement.moved_by || "—"}
										</td>

										<td className="px-4 py-3.5">
											<StatusBadge
												label={movement.status}
												tone={statusTone(
													movement.status
												)}
											/>
										</td>

										<td className="px-4 py-3.5 text-right font-mono text-[10px] text-ink-soft">
											{movement.completed_at ||
												movement.created_at ||
												"—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredMovements.length} of{" "}
						{movements.length} warehouse movements
					</span>
					<span>Each placement creates a movement record</span>
				</div>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Warehouse movements are recorded separately
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Only containers already received into the yard
							can be placed into a warehouse. Each completed
							placement updates the container's current
							location and creates a warehouse movement
							history record.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function WarehousePlacement({
	warehouseLocations,
	loadingLocations,
	onCancel,
	onSaved,
}: {
	warehouseLocations: WarehouseLocation[];
	loadingLocations: boolean;
	onCancel: () => void;
	onSaved: () => Promise<void>;
}) {
	const [query, setQuery] = useState("");
	const [searchWhere, setSearchWhere] =
		useState<SearchWhere>("bill_of_lading");
	const [shipment, setShipment] =
		useState<ShipmentDetails | null>(null);
	const [containers, setContainers] = useState<ShipmentContainer[]>([]);
	const [selectedContainers, setSelectedContainers] = useState<
		string[]
	>([]);
	const [drafts, setDrafts] = useState<
		Record<string, ContainerDraft>
	>({});
	const [searching, setSearching] = useState(false);
	const [saving, setSaving] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const eligibleContainers = useMemo(
		() =>
			containers.filter(
				(container) =>
					container.can_move &&
					container.status === "IN_YARD"
			),
		[containers]
	);

	const getDraft = (containerId: string): ContainerDraft =>
		drafts[containerId] ?? {
			to_location_id: "",
			remarks: "",
		};

	const updateDraft = (
		containerId: string,
		updates: Partial<ContainerDraft>
	) => {
		setDrafts((previous) => ({
			...previous,
			[containerId]: {
				...(previous[containerId] ?? {
					to_location_id: "",
					remarks: "",
				}),
				...updates,
			},
		}));
	};

	const handleSearch = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();

		const value = query.trim();

		if (!value) {
			toast.error("Enter a value to search for.");
			return;
		}

		try {
			setSearching(true);
			setHasSearched(false);
			setShipment(null);
			setContainers([]);
			setSelectedContainers([]);
			setDrafts({});

			const res = await http.post(
				"/operator/warehouses/search/",
				{
					q: value,
					where: searchWhere,
				}
			);

			const resp: Resp = res.data;
			const data = resp.data as any;

			if (resp.error) {
				throw new Error(
					getString(
						data,
						"No matching shipment or container was found."
					)
				);
			}

			const shipmentData = data?.shipment ?? data;
			const containerRows: unknown[] = Array.isArray(data?.containers)
				? data.containers
				: [];

			if (!shipmentData?.shipment_id && !shipmentData?.id) {
				throw new Error(
					"No matching shipment or container was found."
				);
			}

			const normalizedShipment =
				normalizeShipment(shipmentData);

			const normalizedContainers: ShipmentContainer[] =
				containerRows.map(normalizeContainer);

			setShipment(normalizedShipment);
			setContainers(normalizedContainers);
			setHasSearched(true);

			if (!normalizedContainers.length) {
				toast.error(
					"No containers were found under this shipment."
				);
			} else if (
				!normalizedContainers.some(
					(container) =>
						container.can_move &&
						container.status === "IN_YARD"
				)
			) {
				toast.error(
					"No containers in this shipment are currently eligible for warehouse placement."
				);
			}
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					error?.message ||
					"Could not search for the shipment."
			);
		} finally {
			setSearching(false);
		}
	};

	const toggleContainer = (
		containerId: string,
		checked: boolean
	) => {
		setSelectedContainers((previous) =>
			checked
				? [...previous, containerId]
				: previous.filter((id) => id !== containerId)
		);
	};

	const toggleAll = (checked: boolean) => {
		setSelectedContainers(
			checked
				? eligibleContainers.map(
						(container) => container.container_id
					)
				: []
		);
	};

	const applyDestinationToSelected = () => {
		if (!selectedContainers.length) {
			toast.error("Select at least one eligible container.");
			return;
		}

		const destination = eligibleContainers
			.map(
				(container) =>
					getDraft(container.container_id).to_location_id
			)
			.find(Boolean);

		if (!destination) {
			toast.error(
				"Choose a warehouse destination for one container first."
			);
			return;
		}

		setDrafts((previous) => {
			const next = { ...previous };

			selectedContainers.forEach((containerId) => {
				next[containerId] = {
					...(next[containerId] ?? {
						to_location_id: "",
						remarks: "",
					}),
					to_location_id: destination,
				};
			});

			return next;
		});

		toast.success(
			`Destination applied to ${selectedContainers.length} selected container(s).`
		);
	};

	const containersToMove = eligibleContainers.filter((container) =>
		selectedContainers.includes(container.container_id)
	);

	const handleSubmit = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();

		if (!shipment) {
			toast.error("Search for a shipment first.");
			return;
		}

		if (!containersToMove.length) {
			toast.error("Select at least one container to place.");
			return;
		}

		const invalidContainer = containersToMove.find((container) => {
			const destination = getDraft(
				container.container_id
			).to_location_id;

			return (
				!destination ||
				!warehouseLocations.some(
					(location) => location.id === destination
				)
			);
		});

		if (invalidContainer) {
			toast.error(
				`Select a valid warehouse destination for ${invalidContainer.container_no}.`
			);
			return;
		}

		try {
			setSaving(true);

			const formData = new FormData();

			formData.append("shipment_id", shipment.shipment_id);
			formData.append(
				"containers",
				JSON.stringify(
					containersToMove.map((container) => ({
						container_id: container.container_id,
						to_location_id: getDraft(
							container.container_id
						).to_location_id,
						remarks: getDraft(container.container_id)
							.remarks,
					}))
				)
			);

			const res = await http.post(
				"/operator/warehouses/save/",
				formData
			);

			const resp: Resp = res.data;
			const data = resp.data as any;

			if (resp.error) {
				throw new Error(
					getString(
						data,
						"Could not save warehouse placement."
					)
				);
			}

			toast.success(
				`${containersToMove.length} container(s) placed into the warehouse.`
			);

			await onSaved();
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					error?.message ||
					"Could not save warehouse placement."
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className="space-y-6 pb-8"
			style={{
				animation:
					"slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						className="size-9 border-line bg-paper text-ink hover:bg-sand"
						onClick={onCancel}
					>
						<ArrowLeft className="size-4" />
					</Button>

					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
							Warehouse operations
						</p>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
							New warehouse placement
						</h2>
					</div>
				</div>

				<StatusBadge
					label="Container placement"
					tone="info"
				/>
			</div>

			<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="mb-4">
					<h3 className="text-sm font-semibold text-ink">
						Find shipment or container
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Search using a Bill of Lading, shipment
						reference, container number, or seal number.
					</p>
				</div>

				<form
					onSubmit={handleSearch}
					className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]"
				>
					<div>
						<label className={labelClass}>
							Search by
						</label>
						<div className="relative mt-1.5">
							<select
								value={searchWhere}
								onChange={(event) =>
									setSearchWhere(
										event.target.value as SearchWhere
									)
								}
								className="h-10 w-full appearance-none rounded-lg border border-line bg-sand px-3 pr-9 text-sm text-ink outline-none focus:border-orange"
							>
								{SEARCH_OPTIONS.map((option) => (
									<option
										key={option.value}
										value={option.value}
									>
										{option.label}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						</div>
					</div>

					<div>
						<label className={labelClass}>
							Search value
						</label>
						<Input
							value={query}
							onChange={(event) =>
								setQuery(event.target.value)
							}
							placeholder="Enter search value..."
							className="mt-1.5 h-10 border-line bg-sand text-sm text-ink"
						/>
					</div>

					<div className="flex items-end">
						<Button
							type="submit"
							disabled={searching}
							className="h-10 w-full bg-orange text-white hover:bg-orange-deep md:w-auto"
						>
							{searching ? (
								<RefreshCw className="size-4 animate-spin" />
							) : (
								<Search className="size-4" />
							)}
							Search
						</Button>
					</div>
				</form>
			</section>

			{shipment && (
				<>
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className={labelClass}>
									Shipment information
								</p>
								<h3 className="mt-1 font-mono text-lg font-bold text-ink">
									{shipment.shipment_reference || "—"}
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									Bill of Lading:{" "}
									<span className="font-mono text-ink">
										{shipment.bill_of_lading || "—"}
									</span>
								</p>
							</div>

							<StatusBadge
								label={shipment.status || "Unknown"}
								tone={statusTone(shipment.status)}
							/>
						</div>

						<div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
							<InfoItem
								label="Consignee"
								value={shipment.consignee}
							/>
							<InfoItem
								label="Shipping line"
								value={shipment.shipping_line}
							/>
							<InfoItem
								label="Vessel"
								value={shipment.vessel_name}
							/>
							<InfoItem
								label="Voyage number"
								value={shipment.voyage_number}
							/>
						</div>
					</section>

					<form onSubmit={handleSubmit} className="space-y-5">
						<section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
							<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
								<div>
									<h3 className="text-sm font-semibold text-ink">
										Shipment containers
									</h3>
									<p className="mt-1 text-xs text-ink-soft">
										Select containers currently in the
										yard and assign their warehouse
										destinations.
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-md bg-sand px-2.5 py-1 font-mono text-[10px] text-ink-soft">
										{eligibleContainers.length} eligible
									</span>
									<span className="rounded-md bg-orange/10 px-2.5 py-1 font-mono text-[10px] text-orange-deep">
										{selectedContainers.length} selected
									</span>
								</div>
							</div>

							{eligibleContainers.length > 0 && (
								<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand/30 px-4 py-3">
									<label className="flex cursor-pointer items-center gap-2 text-xs text-ink">
										<input
											type="checkbox"
											checked={
												selectedContainers.length ===
													eligibleContainers.length &&
												eligibleContainers.length > 0
											}
											onChange={(event) =>
												toggleAll(
													event.target.checked
												)
											}
											className="size-4 accent-orange"
										/>
										Select all eligible containers
									</label>

									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={applyDestinationToSelected}
										className="border-line bg-paper text-ink hover:bg-sand"
									>
										<Check className="size-3.5" />
										Apply destination to selected
									</Button>
								</div>
							)}

							{containers.length === 0 ? (
								<div className="p-8 text-center">
									<Package className="mx-auto size-7 text-ink-soft" />
									<p className="mt-3 text-sm font-semibold text-ink">
										No containers found
									</p>
								</div>
							) : (
								<div className="divide-y divide-line">
									{containers.map((container) => {
										const eligible =
											container.can_move &&
											container.status === "IN_YARD";
										const selected =
											selectedContainers.includes(
												container.container_id
											);
										const draft = getDraft(
											container.container_id
										);

										return (
											<div
												key={container.container_id}
												className={cn(
													"p-4 transition-colors",
													selected &&
														"bg-orange/[0.035]"
												)}
											>
												<div className="flex flex-wrap items-start gap-3">
													<div className="pt-1">
														<input
															type="checkbox"
															checked={selected}
															disabled={!eligible}
															onChange={(event) =>
																toggleContainer(
																	container.container_id,
																	event.target.checked
																)
															}
															className="size-4 accent-orange"
														/>
													</div>

													<div className="min-w-0 flex-1">
														<div className="flex flex-wrap items-center gap-2">
															<p className="font-mono text-sm font-bold text-ink">
																{container.container_no ||
																	"Unnamed container"}
															</p>
															{container.size && (
																<span className="rounded bg-sand px-2 py-0.5 font-mono text-[10px] text-ink-soft">
																	{container.size}
																</span>
															)}
															<StatusBadge
																label={
																	container.status ||
																	"Unknown"
																}
																tone={statusTone(
																	container.status
																)}
															/>
														</div>

														<div className="mt-2 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
															<InfoItem
																label="Seal number"
																value={
																	container.actual_seal_no ||
																	container.seal_no
																}
															/>
															<InfoItem
																label="Current location"
																value={
																	container.current_location_name ||
																	container.current_location_code
																}
															/>
															<InfoItem
																label="Weight"
																value={
																	container.actual_weight ??
																	container.gross_weight
																}
															/>
															<InfoItem
																label="Package count"
																value={
																	container.package_count
																}
															/>
														</div>

														{container.cargo_description && (
															<p className="mt-2 text-xs leading-5 text-ink-soft">
																{container.cargo_description}
															</p>
														)}

														{eligible ? (
															<div className="mt-4 grid gap-3 md:grid-cols-2">
																<div>
																	<label
																		className={
																			labelClass
																		}
																	>
																		Warehouse destination
																	</label>
																	<div className="relative mt-1.5">
																		<select
																			value={
																				draft.to_location_id
																			}
																			onChange={(
																				event
																			) =>
																				updateDraft(
																					container.container_id,
																					{
																						to_location_id:
																							event
																								.target
																								.value,
																					}
																				)
																			}
																			disabled={
																				loadingLocations
																			}
																			className="h-10 w-full appearance-none rounded-lg border border-line bg-sand px-3 pr-9 text-sm text-ink outline-none focus:border-orange disabled:opacity-60"
																		>
																			<option value="">
																				Select warehouse
																			</option>
																			{warehouseLocations.map(
																				(location) => (
																					<option
																						key={
																							location.id
																						}
																						value={
																							location.id
																						}
																					>
																						{getLocationLabel(
																							location
																						)}
																					</option>
																				)
																			)}
																		</select>
																		<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
																	</div>
																</div>

																<div>
																	<label
																		className={
																			labelClass
																		}
																	>
																		Remarks
																	</label>
																	<Input
																		value={
																			draft.remarks
																		}
																		onChange={(
																			event
																		) =>
																			updateDraft(
																				container.container_id,
																				{
																					remarks:
																						event
																							.target
																							.value,
																				}
																			)
																		}
																		placeholder="Optional placement remarks"
																		className="mt-1.5 h-10 border-line bg-sand text-sm text-ink"
																	/>
																</div>
															</div>
														) : (
															<div className="mt-3 rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">
																This container is
																not eligible for
																warehouse
																placement. It must
																be received and
																currently located
																in the yard.
															</div>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							)}

							<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sand/30 px-4 py-3">
								<p className="text-xs text-ink-soft">
									{selectedContainers.length} of{" "}
									{eligibleContainers.length} eligible
									containers selected
								</p>
								<p className="font-mono text-[10px] text-ink-soft">
									Only IN_YARD containers can be placed
								</p>
							</div>
						</section>

						<div className="flex flex-wrap items-center justify-between gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
								className="border-line bg-paper text-ink hover:bg-sand"
							>
								Cancel
							</Button>

							<Button
								type="submit"
								disabled={
									saving ||
									!containersToMove.length ||
									loadingLocations
								}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								{saving ? (
									<RefreshCw className="size-4 animate-spin" />
								) : (
									<Warehouse className="size-4" />
								)}
								{saving
									? "Saving placement..."
									: `Place ${containersToMove.length || ""} container(s)`}
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</form>
				</>
			)}

			{!shipment && hasSearched && (
				<div className="rounded-2xl bg-paper p-8 text-center ring-1 ring-line">
					<Package className="mx-auto size-7 text-ink-soft" />
					<p className="mt-3 text-sm font-semibold text-ink">
						No shipment details available
					</p>
				</div>
			)}

			{!shipment && !hasSearched && (
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line">
					<div className="flex items-start gap-3">
						<ArrowDown className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div>
							<p className="text-sm font-semibold text-ink">
								How warehouse placement works
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Search for an existing shipment, review its
								containers, select containers currently in
								the yard, and assign each one to an active
								warehouse location. The system records the
								movement and updates the container's current
								location.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function InfoItem({
	label,
	value,
}: {
	label: string;
	value: unknown;
}) {
	return (
		<div className="min-w-0">
			<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
				{label}
			</p>
			<p className="mt-1 truncate text-xs font-medium text-ink">
				{value === null || value === undefined || value === ""
					? "—"
					: String(value)}
			</p>
		</div>
	);
}

function MovementDetails({
	movement,
	onClose,
}: {
	movement: WarehouseMovement;
	onClose: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
			<div className="w-full max-w-xl overflow-hidden rounded-2xl bg-paper shadow-2xl">
				<div className="flex items-start justify-between gap-3 border-b border-line p-5">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
							Warehouse movement details
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{movement.container_no || "Container movement"}
						</h3>
						<p className="mt-1 font-mono text-xs text-ink-soft">
							{movement.movement_reference || movement.id}
						</p>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						Close
					</Button>
				</div>

				<div className="space-y-5 p-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<InfoItem
							label="Shipment reference"
							value={movement.shipment_reference}
						/>
						<InfoItem
							label="Bill of Lading"
							value={movement.bill_of_lading}
						/>
						<InfoItem
							label="Origin location"
							value={movement.origin_location_name}
						/>
						<InfoItem
							label="Destination warehouse"
							value={movement.destination_location_name}
						/>
						<InfoItem
							label="Destination code"
							value={movement.destination_location_code}
						/>
						<InfoItem
							label="Operator"
							value={movement.moved_by}
						/>
						<InfoItem
							label="Completed at"
							value={
								movement.completed_at ||
								movement.created_at
							}
						/>
						<InfoItem
							label="Movement status"
							value={movement.status}
						/>
					</div>

					<div className="rounded-xl bg-sand p-4">
						<p className={labelClass}>Movement remarks</p>
						<p className="mt-2 text-sm leading-6 text-ink">
							{movement.remarks || "No remarks recorded."}
						</p>
					</div>

					<div className="flex items-center gap-2 text-xs text-ink-soft">
						<Clock3 className="size-4" />
						This record represents a completed warehouse
						movement.
					</div>
				</div>
			</div>
		</div>
	);
}