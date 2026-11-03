import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Download,
	Filter,
	Grid2X2,
	Plus,
	RefreshCw,
	Search,
	Truck,
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
import {http, type Resp} from "@/lib/httpClient";

type MovementStatus =
	| "Positioned"
	| "Moving"
	| "Pending equipment"
	| "Blocked";

type MovementType =
	| "GATE_IN"
	| "YARD_TRANSFER"
	| "EXAMINATION_TO_YARD"
	| "WAREHOUSE_TO_YARD";

	interface YardShipment {
    shipment_id: string;
    shipment_reference: string;
    shipment_type: string;
    bill_of_lading: string;
    booking_number: string;
    vessel_name: string;
    voyage_number: string;
    shipping_line: string;
    origin_country: string;
    origin_port: string;
    destination_port: string;
    expected_arrival: string;
    consignee: string;
    consignee_email: string;
    consignee_phone: string;
    licensed_agent_name: string;
    shipment_cargo_description: string;
    cargo_category: string;
    package_type: string;
    package_count: string;
    shipment_gross_weight: string;
    volume: string;
    shipment_status: string;
    shipment_created_at: string;
}

interface YardLocation {
	id: string;
	code: string;
	name: string;
	kind: string;
	parent_location_id?: string | null;
	parent_name?: string | null;
	status?: string;
	capacity?: number | string | null;
	capacity_unit?: string;
}

interface YardMovementItem {
	id: string;
	billOfLading: string;
	shipmentReference: string;
	containerNo: string;
	movementType: MovementType | string;
	gateLane: string;
	originSlot: string;
	targetSlot: string;
	equipment: string;
	operator: string;
	reason: string;
	status: MovementStatus | string;
	timestamp: string;
	blockedBy?: string;
}

interface ContainerMovementDraft {
	destination: string;
}

interface YardSearchContainer extends YardMovementItem {
	shipmentId: string;
	containerId: string;
	canMove: boolean;
	yardStatus: string;
	yardStatusLabel: string;
	receivingStatus: string;
	receivingLocation: string;
	actualSealNo: string;
	actualWeight: string;
	conditionStatus: string;
	cargoDescription: string;
	lastMovementReference: string;
	lastMovementAt: string;
	vessel_name?: string;
	voyage_number?: string;
	shipping_line?: string;
	container_size?: string;
	seal_no?: string;
}

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const MOVEMENT_LABELS: Record<string, string> = {
	GATE_IN: "Gate In / Receiving",
	YARD_TRANSFER: "Yard Transfer",
	EXAMINATION_TO_YARD: "Examination to Yard",
	WAREHOUSE_TO_YARD: "Warehouse to Yard",
};

const STATUS_FILTERS = [
	"ALL",
	"Positioned",
	"Moving",
	"Pending equipment",
	"Blocked",
] as const;

const REASON_OPTIONS = [
	"Inbound arrival and receiving check",
	"Positioning for examination coordination",
	"Yard restacking",
	"Hold repositioning",
	"Quarantine transfer",
];

const getArray = <T,>(value: unknown): T[] => {
	if (Array.isArray(value)) return value as T[];

	if (typeof value !== "object" || value === null) return [];

	const data = value as Record<string, unknown>;
	const keys = ["items", "records", "rows", "movements", "locations", "data"];

	for (const key of keys) {
		const records = data[key];

		if (Array.isArray(records)) {
			return records as T[];
		}
	}

	return [];
};

const getString = (
	value: unknown,
	fallback = ""
): string => {
	if (value === null || value === undefined) return fallback;
	return String(value);
};

const normalizeLocation = (item: any): YardLocation => ({
	id: getString(item.id ?? item.location_id),
	code: getString(item.code ?? item.location_code),
	name: getString(item.name ?? item.location_name),
	kind: getString(item.kind ?? item.location_type),
	parent_location_id: item.parent_location_id ?? null,
	parent_name: getString(item.parent_name),
	status: getString(item.status),
	capacity: item.capacity ?? null,
	capacity_unit: getString(item.capacity_unit, "TEU"),
});

const normalizeMovement = (item: any): YardMovementItem => ({
	id: getString(item.id ?? item.movement_id),
	billOfLading: getString(
		item.bill_of_lading ?? item.billOfLading
	),
	shipmentReference: getString(
		item.shipment_reference ?? item.shipmentReference
	),
	containerNo: getString(
		item.container_no ?? item.container_number ?? item.containerNo
	),
	movementType: getString(
		item.movement_type ?? item.movementType
	),
	gateLane: getString(item.gate_lane ?? item.gateLane),
	originSlot: getString(
		item.origin_location_name ??
			item.origin_name ??
			item.origin_slot ??
			item.originSlot
	),
	targetSlot: getString(
		item.destination_location_name ??
			item.destination_name ??
			item.target_slot ??
			item.targetSlot
	),
	equipment: getString(
		item.equipment_name ?? item.equipment
	),
	operator: getString(
		item.operator_name ?? item.operator
	),
	reason: getString(item.reason ?? item.remarks),
	status: getString(item.status, "Pending equipment"),
	timestamp: getString(
		item.created_at ?? item.moved_at ?? item.completed_at ?? item.timestamp
	),
	blockedBy: getString(item.blocked_by ?? item.blockedBy),
});
const normalizeYardShipment = (item: any): YardShipment => ({
    shipment_id: getString(item.shipment_id),
    shipment_reference: getString(item.shipment_reference),
    shipment_type: getString(item.shipment_type),
    bill_of_lading: getString(item.bill_of_lading),
    booking_number: getString(item.booking_number),
    vessel_name: getString(item.vessel_name),
    voyage_number: getString(item.voyage_number),
    shipping_line: getString(item.shipping_line),
    origin_country: getString(item.origin_country),
    origin_port: getString(item.origin_port),
    destination_port: getString(item.destination_port),
    expected_arrival: getString(item.expected_arrival),
    consignee: getString(item.consignee),
    consignee_email: getString(item.consignee_email),
    consignee_phone: getString(item.consignee_phone),
    licensed_agent_name: getString(item.licensed_agent_name),
    shipment_cargo_description: getString(item.shipment_cargo_description),
    cargo_category: getString(item.cargo_category),
    package_type: getString(item.package_type),
    package_count: getString(item.package_count),
    shipment_gross_weight: getString(item.shipment_gross_weight),
    volume: getString(item.volume),
    shipment_status: getString(item.shipment_status),
    shipment_created_at: getString(item.shipment_created_at),
});
const normalizeYardSearchContainer = (item: any): YardSearchContainer => ({
	id: getString(item.container_id),
	shipmentId: getString(item.shipment_id),
	containerId: getString(item.container_id),
	billOfLading: getString(item.bill_of_lading),
	shipmentReference: getString(item.shipment_reference),
	containerNo: getString(item.container_no),
	movementType: "YARD_TRANSFER",
	gateLane: "",
	originSlot: getString(
		item.receiving_location_name ?? item.receiving_location,
		"Not specified"
	),
	targetSlot: "",
	equipment: "",
	operator: "",
	reason: "",
	status: getString(item.yard_status_label ?? item.receiving_status),
	timestamp: getString(item.received_at),
	canMove:
		item.can_move === true ||
		item.can_move === 1 ||
		item.can_move === "1",
	yardStatus: getString(item.yard_status),
	yardStatusLabel: getString(item.yard_status_label),
	receivingStatus: getString(item.receiving_status),
	receivingLocation: getString(
		item.receiving_location_name ?? item.receiving_location,
		"Not specified"
	),
	actualSealNo: getString(item.actual_seal_no),
	actualWeight: getString(item.actual_weight ?? item.gross_weight),
	conditionStatus: getString(item.condition_status),
	cargoDescription: getString(item.cargo_description),
	lastMovementReference: getString(item.last_movement_reference),
	lastMovementAt: getString(item.last_movement_at),
	vessel_name: getString(item.vessel_name),
	voyage_number: getString(item.voyage_number),
	shipping_line: getString(item.shipping_line),
	container_size: getString(item.container_size),
	seal_no: getString(item.seal_no),
});

const getLocationLabel = (location: YardLocation) =>
	[location.code, location.name].filter(Boolean).join(" · ");

const getMovementLabel = (movementType: string) =>
	MOVEMENT_LABELS[movementType] ?? movementType.replaceAll("_", " ");

const getMovementType = (location: string): MovementType => {
	const value = location.toLowerCase();

	if (value.includes("examination")) return "EXAMINATION_TO_YARD";
	if (value.includes("warehouse")) return "WAREHOUSE_TO_YARD";

	return "YARD_TRANSFER";
};

export default function OperationsYardRoute() {
	const [movements, setMovements] = useState<YardMovementItem[]>([]);
	const [yardLocations, setYardLocations] = useState<YardLocation[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingLocations, setLoadingLocations] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] =
		useState<string>("ALL");
	const [view, setView] = useState<"list" | "intake">("list");

	const fetchMovements = useCallback(async () => {
		try {
			setLoading(true);

			const response = await http.get("/operator/yards/");
			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not load yard movements."
				);
			}

			const rows = getArray<any>(resp.data);

			setMovements(rows.map(normalizeMovement));
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.response?.data?.message ||
					"Could not load yard movements."
			);
			setMovements([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchYardLocations = useCallback(async () => {
		try {
			setLoadingLocations(true);

			const response = await http.post(
				"/admin/config/search-location/",
				{
					q: "YARD",
				}
			);

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not load configured yard locations."
				);
			}

			const rows = Array.isArray((resp.code as any)?.locations)
				? (resp.code as any).locations
				: [];

			setYardLocations(
				rows
					.map(normalizeLocation)
					.filter((location: YardLocation) => location.id)
			);

		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.message ||
					"Could not load configured yard locations."
			);

			setYardLocations([]);
		} finally {
			setLoadingLocations(false);
		}
	}, []);

	useEffect(() => {
		void fetchMovements();
		void fetchYardLocations();
	}, [fetchMovements, fetchYardLocations]);

	const filteredMovements = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();

		return movements.filter((movement) => {
			const searchable = [
				movement.billOfLading,
				movement.shipmentReference,
				movement.containerNo,
				movement.movementType,
				movement.gateLane,
				movement.originSlot,
				movement.targetSlot,
				movement.equipment,
				movement.operator,
				movement.reason,
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

	const activeEquipmentCount = new Set(
		movements
			.filter(
				(movement) =>
					movement.status === "Moving" ||
					movement.status === "Positioned"
			)
			.map((movement) => movement.equipment)
			.filter(Boolean)
	).size;

	const pendingCount = movements.filter(
		(movement) =>
			movement.status === "Pending equipment" ||
			movement.status === "Moving"
	).length;

	const blockedCount = movements.filter(
		(movement) => movement.status === "Blocked"
	).length;

	const handleExport = () => {
		if (!movements.length) {
			toast.error("There are no movement records to export.");
			return;
		}

		const headers = [
			"Bill of Lading",
			"Shipment Reference",
			"Container",
			"Movement Type",
			"Origin",
			"Destination",
			"Gate Lane",
			"Equipment",
			"Operator",
			"Reason",
			"Status",
			"Timestamp",
		];

		const rows = movements.map((movement) =>
			[
				movement.billOfLading,
				movement.shipmentReference,
				movement.containerNo,
				movement.movementType,
				movement.originSlot,
				movement.targetSlot,
				movement.gateLane,
				movement.equipment,
				movement.operator,
				movement.reason,
				movement.status,
				movement.timestamp,
			]
				.map((value) =>
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
		link.download = "yard-movements.csv";
		link.click();

		URL.revokeObjectURL(url);
	};

	return (
		<AppShell
			title="Yard Management"
			eyebrow="Operations · Ground Stacking & Movement"
		>
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						movements={movements}
						filteredMovements={filteredMovements}
						searchQuery={searchQuery}
						statusFilter={statusFilter}
						loading={loading}
						onSearchChange={setSearchQuery}
						onStatusChange={setStatusFilter}
						onNewMovement={() => setView("intake")}
						onExport={handleExport}
						onRefresh={fetchMovements}
						metrics={{
							activeEquipmentCount,
							pendingCount,
							blockedCount,
						}}
					/>
				) : (
					<IntakeView
						yardLocations={yardLocations}
						loadingLocations={loadingLocations}
						onCancel={() => setView("list")}
						onSaved={async () => {
							await fetchMovements();
							setView("list");
						}}
					/>
				)}
			</div>
		</AppShell>
	);
}
function ListView({
	movements,
	filteredMovements,
	searchQuery,
	statusFilter,
	loading,
	onSearchChange,
	onStatusChange,
	onNewMovement,
	onExport,
	onRefresh,
	metrics,
}: {
	movements: YardMovementItem[];
	filteredMovements: YardMovementItem[];
	searchQuery: string;
	statusFilter: string;
	loading: boolean;
	onSearchChange: (value: string) => void;
	onStatusChange: (value: string) => void;
	onNewMovement: () => void;
	onExport: () => void;
	onRefresh: () => Promise<void>;
	metrics: {
		activeEquipmentCount: number;
		pendingCount: number;
		blockedCount: number;
	};
}) {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Movements"
					value={String(movements.length)}
					icon={Grid2X2}
				/>
				<Metric
					label="Active Equipment"
					value={String(metrics.activeEquipmentCount)}
					icon={Truck}
				/>
				<Metric
					label="Pending Movements"
					value={String(metrics.pendingCount)}
					icon={RefreshCw}
				/>
				<Metric
					label="Blocked Movements"
					value={String(metrics.blockedCount)}
					icon={Filter}
				/>
			</div>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-ink">
						Yard Movement History
					</h2>
					<p className="mt-1 text-sm text-ink-soft">
						Track container movements and completed yard placements.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => void onRefresh()}
						disabled={loading}
						className="gap-2"
					>
						<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
						Refresh
					</Button>

					<Button
						variant="outline"
						onClick={onExport}
						className="gap-2"
					>
						<Download className="h-4 w-4" />
						Export CSV
					</Button>

					<Button
						onClick={onNewMovement}
						className="gap-2 bg-orange text-white hover:bg-orange/90"
					>
						<Plus className="h-4 w-4" />
						New Placement
					</Button>
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper">
				<div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(event) => onSearchChange(event.target.value)}
							placeholder="Search B/L, shipment reference, container..."
							className="pl-9"
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						{STATUS_FILTERS.map((status) => (
							<button
								type="button"
								key={status}
								onClick={() => onStatusChange(status)}
								className={cn(
									"rounded-full border px-3 py-2 text-xs font-medium transition-colors",
									statusFilter === status
										? "border-orange bg-orange text-white"
										: "border-line text-ink-soft hover:border-orange/50 hover:text-ink",
								)}
							>
								{status === "ALL" ? "All" : status}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[1050px] text-left text-sm">
						<thead className="border-b border-line bg-sand/50 text-[10px] uppercase tracking-wider text-ink-soft">
							<tr>
								<th className="px-4 py-4 font-semibold">Shipment</th>
								<th className="px-4 py-4 font-semibold">Container</th>
								<th className="px-4 py-4 font-semibold">Movement</th>
								<th className="px-4 py-4 font-semibold">Origin</th>
								<th className="px-4 py-4 font-semibold">Destination</th>
								<th className="px-4 py-4 font-semibold">Equipment</th>
								<th className="px-4 py-4 font-semibold">Operator</th>
								<th className="px-4 py-4 font-semibold">Status</th>
								<th className="px-4 py-4 font-semibold">Date</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-line">
							{loading ? (
								<tr>
									<td colSpan={9} className="px-4 py-12 text-center text-ink-soft">
										Loading movements...
									</td>
								</tr>
							) : filteredMovements.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-4 py-12 text-center">
										<p className="font-medium text-ink">
											No movements found
										</p>
										<p className="mt-1 text-xs text-ink-soft">
											There are no records matching your search.
										</p>
									</td>
								</tr>
							) : (
								filteredMovements.map((movement) => (
									<tr
										key={movement.id}
										className="transition-colors hover:bg-sand/30"
									>
										<td className="px-4 py-4">
											<p className="font-medium text-ink">
												{movement.billOfLading || "—"}
											</p>
											<p className="mt-1 text-xs text-ink-soft">
												{movement.shipmentReference || "—"}
											</p>
										</td>

										<td className="px-4 py-4 font-medium text-ink">
											{movement.containerNo || "—"}
										</td>

										<td className="px-4 py-4 text-ink-soft">
											{getMovementLabel(movement.movementType)}
										</td>

										<td className="px-4 py-4 text-ink-soft">
											{movement.originSlot || "—"}
										</td>

										<td className="px-4 py-4 text-ink">
											{movement.targetSlot || "—"}
										</td>

										<td className="px-4 py-4 text-ink-soft">
											{movement.equipment || "—"}
										</td>

										<td className="px-4 py-4 text-ink-soft">
											{movement.operator || "—"}
										</td>

										<td className="px-4 py-4">
											<StatusBadge
												label={movement.status}
												tone={statusTone(movement.status)}
											/>
										</td>

										<td className="px-4 py-4 text-xs text-ink-soft">
											{movement.timestamp
												? new Date(movement.timestamp).toLocaleString()
												: "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="border-t border-line px-4 py-3">
					<p className="text-xs text-ink-soft">
						Showing {filteredMovements.length} of {movements.length} movements
					</p>
				</div>
			</div>
		</div>
	);
}

function IntakeView({
	yardLocations,
	loadingLocations,
	onCancel,
	onSaved,
}: {
	yardLocations: YardLocation[];
	loadingLocations: boolean;
	onCancel: () => void;
	onSaved: () => Promise<void>;
}) {
	const [query, setQuery] = useState("");
	const [shipment, setShipment] = useState<YardShipment | null>(null);
	const [searchResults, setSearchResults] = useState<YardSearchContainer[]>([]);
	const [drafts, setDrafts] = useState<Record<string, ContainerMovementDraft>>({});
	const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
	const [bulkDestination, setBulkDestination] = useState("");
	const [reason, setReason] = useState(REASON_OPTIONS[0]);
	const [remarks, setRemarks] = useState("");
	const [searching, setSearching] = useState(false);
	const [saving, setSaving] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [searchWhere, setSearchWhere] = useState("bill_of_lading");
	

	const eligibleContainers = useMemo(
		() => searchResults.filter((container) => container.canMove),
		[searchResults],
	);

	const selectedEligibleContainers = useMemo(
		() =>
			eligibleContainers.filter((container) =>
				selectedContainers.includes(container.containerId),
			),
		[eligibleContainers, selectedContainers],
	);

	const getDraft = (containerId: string) => drafts[containerId] ?? { destination: "" };

	const handleSearch = async () => {
		const value = query.trim();

		if (!value) {
			toast.error("Enter a search value.");
			return;
		}

		setSearching(true);
		setHasSearched(true);
		setShipment(null);
		setSearchResults([]);
		setSelectedContainers([]);
		setDrafts({});

		try {
			const response = await http.post("/operator/yards/search/", {
				q: value,
				where: searchWhere,
			});

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not search shipment containers."
				);
			}

			const result = resp.data as {
				shipment?: any;
				containers?: any[];
			};

			const shipmentData = result?.shipment;
			const containerData = Array.isArray(result?.containers)
				? result.containers
				: [];

			setShipment(
				shipmentData ? normalizeYardShipment(shipmentData) : null
			);

			const rows = containerData.map(normalizeYardSearchContainer);

			setSearchResults(rows);

			if (!shipmentData || !rows.length) {
				toast.info("No shipment containers found for the supplied identifier.");
			}
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.message ||
					"Could not search shipment containers."
			);

			setShipment(null);
			setSearchResults([]);
		} finally {
			setSearching(false);
		}
	};

	const toggleContainer = (containerId: string, checked: boolean) => {
		setSelectedContainers((current) =>
			checked
				? [...new Set([...current, containerId])]
				: current.filter((id) => id !== containerId),
		);
	};

	const updateDestination = (
		containerId: string,
		destination: string,
	) => {
		setDrafts((current) => ({
			...current,
			[containerId]: {
				destination,
			},
		}));
	};

	const applyBulkDestination = () => {
		if (!bulkDestination) {
			toast.error("Select a yard destination.");
			return;
		}

		if (!selectedEligibleContainers.length) {
			toast.error("Select eligible containers first.");
			return;
		}

		setDrafts((current) => {
			const updated = { ...current };

			selectedEligibleContainers.forEach((container) => {
				updated[container.containerId] = {
					destination: bulkDestination,
				};
			});

			return updated;
		});

		toast.success("Destination applied to selected containers.");
	};

	const containersToMove = useMemo(
		() =>
			eligibleContainers.filter(
				(container) =>
					selectedContainers.includes(container.containerId) &&
					Boolean(getDraft(container.containerId).destination),
			),
		[eligibleContainers, selectedContainers, drafts],
	);

	const handleSave = async () => {
		if (!containersToMove.length) {
			toast.error("Select containers and assign their yard destinations.");
			return;
		}

		setSaving(true);

		let successful = 0;
		let failed = 0;

		try {
			for (const container of containersToMove) {
				const destinationId = getDraft(container.containerId).destination;

				try {
					const response = await http.post("/operator/yards/save/", {
						shipment_id: container.shipmentId,
						container_id: container.containerId,
						to_location_id: destinationId,
						remarks: [reason, remarks.trim()]
							.filter(Boolean)
							.join(" — "),
					});

					const resp: Resp = response.data;

					if (resp.error) {
						failed++;
					} else {
						successful++;
					}
				} catch {
					failed++;
				}
			}

			if (successful) {
				toast.success(
					`${successful} container${successful === 1 ? "" : "s"} placed successfully.`,
				);
			}

			if (failed) {
				toast.error(
					`${failed} container${failed === 1 ? "" : "s"} could not be placed.`,
				);
			}

			if (successful) {
				await onSaved();
			}
		} finally {
			setSaving(false);
		}
	};

	const allEligibleSelected =
		eligibleContainers.length > 0 &&
		eligibleContainers.every((container) =>
			selectedContainers.includes(container.containerId),
		);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={onCancel}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>

					<div>
						<h2 className="text-lg font-semibold text-ink">
							New Yard Placement
						</h2>
						<p className="mt-1 text-sm text-ink-soft">
							Find a shipment and assign its received containers to yard locations.
						</p>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5">
				<label className={labelClass}>
					Search Shipment / Container
				</label>

				<p className="mt-1 text-xs text-ink-soft">
					Choose the identifier you want to search with.
				</p>

				<div className="mt-3 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_auto]">
					<select
						value={searchWhere}
						onChange={(event) => {
							setSearchWhere(event.target.value);
							setQuery("");
							setSearchResults([]);
							setSelectedContainers([]);
							setDrafts({});
							setHasSearched(false);
						}}
						disabled={searching || saving}
						className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-orange disabled:opacity-50"
					>
						<option value="bill_of_lading">Bill of Lading</option>
						<option value="shipment_reference">Shipment Reference</option>
						<option value="container_number">Container Number</option>
						<option value="seal_number">Seal Number</option>
					</select>

					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />

						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									void handleSearch();
								}
							}}
							placeholder={`Enter ${
								searchWhere === "bill_of_lading"
									? "Bill of Lading"
									: searchWhere === "shipment_reference"
									? "Shipment Reference"
									: searchWhere === "container_number"
										? "Container Number"
										: "Seal Number"
							}...`}
							className="pl-9"
							disabled={searching || saving}
						/>
					</div>

					<Button
						onClick={() => void handleSearch()}
						disabled={searching || saving || !query.trim()}
						className="gap-2 bg-orange text-white hover:bg-orange/90"
					>
						<Search className="h-4 w-4" />
						{searching ? "Searching..." : "Search"}
					</Button>
				</div>
			</div>

			{searchResults.length > 0 && (
				<>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<Metric
							label="Total Containers"
							value={String(searchResults.length)}
							icon={Grid2X2}
						/>
						<Metric
							label="Ready for Placement"
							value={String(searchResults.filter((item) => item.yardStatus === "READY").length)}
							icon={CheckCircle2}
						/>
						<Metric
							label="Not Received"
							value={String(searchResults.filter((item) => item.yardStatus === "NOT_RECEIVED").length)}
							icon={Truck}
						/>
						<Metric
							label="Already in Yard"
							value={String(searchResults.filter((item) => item.yardStatus === "IN_YARD").length)}
							icon={Grid2X2}
						/>
					</div>

					<div className="rounded-xl border border-line bg-paper">
						<div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h3 className="font-semibold text-ink">
									Shipment Containers
								</h3>
								<p className="mt-1 text-xs text-ink-soft">
									{shipment?.bill_of_lading || "—"} · {shipment?.shipment_reference || "—"}
								</p>
							</div>

							<Button
								variant="outline"
								size="sm"
								disabled={!eligibleContainers.length || saving}
								onClick={() =>
									setSelectedContainers(
										allEligibleSelected
											? []
											: eligibleContainers.map((item) => item.containerId),
									)
								}
							>
								{allEligibleSelected ? "Deselect All" : "Select Eligible"}
							</Button>
						</div>

						<div className="space-y-4 p-5">
							<div className="grid gap-4 rounded-lg bg-sand/50 p-4 sm:grid-cols-2 xl:grid-cols-4">
								<div>
									<p className={labelClass}>Vessel</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.vessel_name || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Voyage</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.voyage_number || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Shipping Line</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.shipping_line || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Shipment Status</p>
									<div className="mt-1">
										<StatusBadge
											label={shipment?.shipment_status || "—"}
											tone={statusTone(shipment?.shipment_status || "")}
										/>
									</div>
								</div>

								<div>
									<p className={labelClass}>Origin Port</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.origin_port || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Destination Port</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.destination_port || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Consignee</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.consignee || "—"}
									</p>
								</div>

								<div>
									<p className={labelClass}>Licensed Agent</p>
									<p className="mt-1 text-sm font-medium text-ink">
										{shipment?.licensed_agent_name || "—"}
									</p>
								</div>
							</div>

							{searchResults.map((container) => {
								const selected = selectedContainers.includes(
									container.containerId,
								);

								const destination = getDraft(
									container.containerId,
								).destination;

								return (
									<div
										key={container.containerId}
										className={cn(
											"rounded-xl border p-4 transition-colors",
											selected
												? "border-orange/60 bg-orange/[0.035]"
												: "border-line",
										)}
									>
										<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
											<div className="flex min-w-0 flex-1 items-start gap-3">
												<input
													type="checkbox"
													checked={selected}
													disabled={!container.canMove || saving}
													onChange={(event) =>
														toggleContainer(
															container.containerId,
															event.target.checked,
														)
													}
													className="mt-1 h-4 w-4 accent-orange disabled:cursor-not-allowed"
												/>

												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<h4 className="font-semibold text-ink">
															{container.containerNo}
														</h4>

														<span className="rounded-md bg-sand px-2 py-1 text-[10px] font-semibold text-ink-soft">
															{container.container_size ?? "—"}
														</span>

														<StatusBadge
															label={container.yardStatusLabel}
															tone={
																container.yardStatus === "READY"
																	? "success"
																	: container.yardStatus === "NOT_RECEIVED"
																		? "warning"
																		: "info"
															}
														/>
													</div>

													<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
														<div>
															<p className={labelClass}>Expected Seal</p>
															<p className="mt-1 text-sm text-ink">
																{container.seal_no ?? "—"}
															</p>
														</div>

														<div>
															<p className={labelClass}>Actual Seal</p>
															<p className="mt-1 text-sm text-ink">
																{container.actualSealNo || "—"}
															</p>
														</div>

														<div>
															<p className={labelClass}>Actual Weight</p>
															<p className="mt-1 text-sm text-ink">
																{container.actualWeight || "—"}
															</p>
														</div>

														<div>
															<p className={labelClass}>Condition</p>
															<p className="mt-1 text-sm text-ink">
																{container.conditionStatus || "—"}
															</p>
														</div>
													</div>

													<div className="mt-4 grid gap-3 sm:grid-cols-2">
														<div>
															<p className={labelClass}>Receiving Location</p>
															<p className="mt-1 text-sm text-ink">
																{container.receivingLocation || "—"}
															</p>
														</div>

														<div>
															<p className={labelClass}>Received At</p>
															<p className="mt-1 text-sm text-ink">
																{container.timestamp
																	? new Date(container.timestamp).toLocaleString()
																	: "—"}
															</p>
														</div>
													</div>

													{container.cargoDescription && (
														<div className="mt-4">
															<p className={labelClass}>Cargo Description</p>
															<p className="mt-1 text-sm text-ink-soft">
																{container.cargoDescription}
															</p>
														</div>
													)}

													{container.yardStatus === "NOT_RECEIVED" && (
														<div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
															This container has not been received and cannot be placed in the yard yet.
														</div>
													)}

													{container.yardStatus === "IN_YARD" && (
														<div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
															This container already has a yard placement record.
															{container.lastMovementReference
																? ` Reference: ${container.lastMovementReference}`
																: ""}
														</div>
													)}
												</div>
											</div>

											<div className="w-full xl:max-w-[260px]">
												<SelectField
													label="Yard Destination"
													value={destination}
													onChange={(value) =>
														updateDestination(
															container.containerId,
															value,
														)
													}
													options={yardLocations.map((location) => ({
														value: location.id,
														label: getLocationLabel(location),
													}))}
													disabled={
														!container.canMove ||
														!selected ||
														saving
													}
													loading={loadingLocations}
													placeholder={
														container.canMove
															? "Select yard location"
															: "Not eligible"
													}
												/>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="rounded-xl border border-line bg-paper p-5">
						<h3 className="font-semibold text-ink">
							Bulk Destination
						</h3>

						<p className="mt-1 text-xs text-ink-soft">
							Apply the same destination to all selected eligible containers.
						</p>

						<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
							<div className="flex-1">
								<SelectField
									label="Destination"
									value={bulkDestination}
									onChange={setBulkDestination}
									options={yardLocations.map((location) => ({
										value: location.id,
										label: getLocationLabel(location),
									}))}
									disabled={
										loadingLocations ||
										selectedEligibleContainers.length === 0
									}
									loading={loadingLocations}
									placeholder="Select destination"
								/>
							</div>

							<Button
								variant="outline"
								onClick={applyBulkDestination}
								disabled={
									!bulkDestination ||
									selectedEligibleContainers.length === 0
								}
							>
								Apply to Selected
							</Button>
						</div>
					</div>

					<div className="rounded-xl border border-line bg-paper p-5">
						<label className={labelClass}>Movement Reason</label>

						<select
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							className="mt-2 h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-orange sm:max-w-md"
						>
							{REASON_OPTIONS.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>

						<label className={cn(labelClass, "mt-4")}>
							Additional Remarks
						</label>

						<textarea
							value={remarks}
							onChange={(event) => setRemarks(event.target.value)}
							rows={3}
							placeholder="Enter additional remarks..."
							className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-orange"
						/>
					</div>

					<div className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-semibold text-ink">
								{containersToMove.length} container
								{containersToMove.length === 1 ? "" : "s"} ready for placement
							</p>
							<p className="mt-1 text-xs text-ink-soft">
								Only received containers with a destination will be submitted.
							</p>
						</div>

						<Button
							onClick={() => void handleSave()}
							disabled={saving || containersToMove.length === 0}
							className="gap-2 bg-orange text-white hover:bg-orange/90"
						>
							{saving ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<CheckCircle2 className="h-4 w-4" />
							)}
							{saving ? "Saving..." : "Complete Placement"}
							<ArrowRight className="h-4 w-4" />
						</Button>
					</div>
				</>
			)}

			{hasSearched && searchResults.length === 0 && !searching && (
				<div className="rounded-xl border border-dashed border-line bg-paper px-5 py-12 text-center">
					<Search className="mx-auto mb-3 h-6 w-6 text-ink-soft" />

					<p className="font-medium text-ink">
						No shipment containers found
					</p>

					<p className="mt-1 text-sm text-ink-soft">
						Check the selected search type and identifier, then try again.
					</p>
				</div>
			)}
		</div>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder,
	disabled = false,
	loading = false,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
	disabled?: boolean;
	loading?: boolean;
}) {
	return (
		<div className="space-y-2">
			<label className={labelClass}>{label}</label>

			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
				className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/10 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<option value="">
					{loading
						? "Loading locations..."
						: placeholder ?? "Select destination"}
				</option>

				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}