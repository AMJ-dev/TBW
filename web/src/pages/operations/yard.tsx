import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Download,
	Grid2X2,
	Plus,
	RefreshCw,
	Search,
	Truck,
	Container,
	MapPin,
	Eye,
	Calendar,
	FileText,
	User,
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

interface YardEquipment {
	id: string;
	equipment_name: string;
	equipment_type: string;
	operational_status: string;
}

interface ContainerMovementAssignment {
	destination: string;
	equipmentId: string;
}

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

interface YardMovementLog {
	id?: string;
	action?: string;
	description?: string;
	previous_location_name?: string;
	new_location_name?: string;
	performed_by?: string;
	performed_at?: string;
}

interface YardMovementItem {
	id: string;
	containerId: string;
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
	containerSize: string;
	sealNo: string;
	equipmentCode: string;
	equipmentType: string;
	registrationNumber: string;
	movementReference: string;
	shipmentId: string;
	containerStatus: string;
	logs: YardMovementLog[];

	movement_reference?: string;
	shipment_reference?: string;
	bill_of_lading?: string;
	container_no?: string;
	container_size?: string;
	seal_no?: string;
	container_status?: string;
	movement_type?: string;
	from_location_name?: string;
	to_location_name?: string;
	to_location_code?: string;
	equipment_name?: string;
	equipment_code?: string;
	equipment_type?: string;
	registration_number?: string;
	operator_name?: string;
	moved_by?: string;
	remarks?: string;
	completed_at?: string;
	created_at?: string;
	bookingNumber?: string;
	vesselName?: string;
	voyageNumber?: string;
	shippingLine?: string;
	grossWeight?: string;
	cargoDescription?: string;
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
	bookingNumber: string;
	vesselName: string;
	voyageNumber: string;
	shippingLine: string;
	grossWeight: string;
}

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const MOVEMENT_LABELS: Record<string, string> = {
	GATE_IN: "Gate In / Receiving",
	YARD_TRANSFER: "Yard Transfer",
	EXAMINATION_TO_YARD: "Examination to Yard",
	WAREHOUSE_TO_YARD: "Warehouse to Yard",
	YARD_PLACEMENT: "Yard Placement",
};

const REASON_OPTIONS = [
	"Inbound arrival and receiving check",
	"Positioning for examination coordination",
	"Yard restacking",
	"Hold repositioning",
	"Quarantine transfer",
];

const normalizeEquipment = (item: any): YardEquipment => ({
	id: getString(item.id),
	equipment_name: getString(item.equipment_name),
	equipment_type: getString(item.equipment_type),
	operational_status: getString(item.operational_status),
});

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

const normalizeMovement = (item: any): YardMovementItem => {
	const logs = Array.isArray(item.logs) ? item.logs : [];
	const firstLog = logs[0];
	const origin =
		item.from_location_name ??
		firstLog?.previous_location_name ??
		"Container Receiving Bay";

	return {
		id: getString(item.id ?? item.movement_id),
		containerId: getString(item.container_id),
		billOfLading: getString(item.bill_of_lading),
		shipmentReference: getString(item.shipment_reference),
		containerNo: getString(item.container_no),
		movementType: getString(item.movement_type, "YARD_PLACEMENT"),
		gateLane: getString(item.gate_lane),
		originSlot: getString(origin),
		targetSlot: getString(item.to_location_name),
		equipment: getString(item.equipment_name),
		operator: getString(
			item.operator_name ?? item.moved_by,
			"Not recorded"
		),
		bookingNumber: getString(item.booking_number),
		vesselName: getString(item.vessel_name),
		voyageNumber: getString(item.voyage_number),
		shippingLine: getString(item.shipping_line),
		grossWeight: getString(item.gross_weight),
		cargoDescription: getString(item.cargo_description),
		reason: getString(item.remarks),
		status: getString(item.container_status, "UNKNOWN"),
		timestamp: getString(item.completed_at ?? item.created_at),
		blockedBy: "",
		containerSize: getString(item.container_size ?? item.size),
		sealNo: getString(item.seal_no),
		equipmentCode: getString(item.equipment_code),
		equipmentType: getString(item.equipment_type),
		registrationNumber: getString(item.registration_number),
		movementReference: getString(item.movement_reference),
		shipmentId: getString(item.shipment_id),
		containerStatus: getString(item.container_status),
		logs,

		movement_reference: getString(item.movement_reference),
		shipment_reference: getString(item.shipment_reference),
		bill_of_lading: getString(item.bill_of_lading),
		container_no: getString(item.container_no),
		container_size: getString(item.container_size ?? item.size),
		seal_no: getString(item.seal_no),
		container_status: getString(item.container_status),
		movement_type: getString(item.movement_type, "YARD_PLACEMENT"),
		from_location_name: getString(origin),
		to_location_name: getString(item.to_location_name),
		to_location_code: getString(item.to_location_code),
		equipment_name: getString(item.equipment_name),
		equipment_code: getString(item.equipment_code),
		equipment_type: getString(item.equipment_type),
		registration_number: getString(item.registration_number),
		operator_name: getString(item.operator_name),
		moved_by: getString(item.moved_by),
		remarks: getString(item.remarks),
		completed_at: getString(item.completed_at),
		created_at: getString(item.created_at),
	};
};

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
	containerSize: getString(item.container_size),
	sealNo: getString(item.seal_no),
	equipmentCode: "",
	equipmentType: "",
	registrationNumber: "",
	movementReference: getString(item.last_movement_reference),
	containerStatus: getString(item.container_status ?? item.receiving_status),
	logs: [],
	bookingNumber: getString(item.booking_number),
	vesselName: getString(item.vessel_name),
	voyageNumber: getString(item.voyage_number),
	shippingLine: getString(item.shipping_line),
	grossWeight: getString(item.gross_weight ?? item.actual_weight),
});

const getLocationLabel = (location: YardLocation) =>
	[location.code, location.name].filter(Boolean).join(" · ");

const getMovementLabel = (movementType: string) =>
	MOVEMENT_LABELS[movementType] ??
	(movementType
		? movementType.replaceAll("_", " ")
		: "Yard Placement");

export default function OperationsYardRoute() {
	const [movements, setMovements] = useState<YardMovementItem[]>([]);
	const [yardLocations, setYardLocations] = useState<YardLocation[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingLocations, setLoadingLocations] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [view, setView] = useState<"list" | "intake" | "details">("list");
	const [yardEquipment, setYardEquipment] = useState<YardEquipment[]>([]);
	const [loadingEquipment, setLoadingEquipment] = useState(false);
	const [selectedMovement, setSelectedMovement] = useState<YardMovementItem | null>(null);

	const handleMovementClick = (movement: YardMovementItem) => {
		setSelectedMovement(movement);
		setView("details");
	};

	const handleBackFromDetails = () => {
		setView("list");
		setSelectedMovement(null);
	};

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

	const fetchYardEquipment = useCallback(async () => {
		try {
			setLoadingEquipment(true);

			const response = await http.get("/operator/yards/equipments/");
			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not load available equipment."
				);
			}

			const data = resp.data as { equipments?: any[] };

			setYardEquipment(
				(Array.isArray(data?.equipments) ? data.equipments : [])
					.map(normalizeEquipment)
					.filter(
						(item) =>
							item.id &&
							item.operational_status === "AVAILABLE"
					)
			);
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.message ||
					"Could not load available equipment."
			);
			setYardEquipment([]);
		} finally {
			setLoadingEquipment(false);
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
		void fetchYardEquipment();
	}, [fetchMovements, fetchYardLocations, fetchYardEquipment]);

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

			return !query || searchable.includes(query);
		});
	}, [movements, searchQuery]);

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

	const yardMetrics = useMemo(() => {
		const latestByContainer = new Map<string, YardMovementItem>();

		const sortedMovements = [...movements].sort(
			(a, b) =>
				new Date(b.timestamp.replace(" ", "T")).getTime() -
				new Date(a.timestamp.replace(" ", "T")).getTime()
		);

		sortedMovements.forEach((movement) => {
			const key = movement.containerId || movement.containerNo;

			if (key && !latestByContainer.has(key)) {
				latestByContainer.set(key, movement);
			}
		});

		const currentYardContainers = Array.from(
			latestByContainer.values()
		).filter((movement) => movement.status === "IN_YARD");

		const occupiedLocations = new Set(
			currentYardContainers
				.map((movement) => movement.targetSlot)
				.filter(Boolean)
		);

		return {
			totalMovements: movements.length,
			availableEquipment: yardEquipment.length,
			containersInYard: currentYardContainers.length,
			occupiedLocations: occupiedLocations.size,
		};
	}, [movements, yardEquipment]);

	return (
		<AppShell
			title="Yard Management"
			eyebrow="Operations · Ground Stacking & Movement"
		>
			<div className="relative overflow-hidden">
				<AnimatePresence mode="wait" initial={false}>
					{view === "list" && (
						<motion.div
							key="yard-list"
							initial={{ opacity: 0, x: -35 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -35 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
						>
							<ListView
								movements={movements}
								filteredMovements={filteredMovements}
								searchQuery={searchQuery}
								loading={loading}
								onSearchChange={setSearchQuery}
								onNewMovement={() => setView("intake")}
								onExport={handleExport}
								onRefresh={fetchMovements}
								metrics={yardMetrics}
								onMovementClick={handleMovementClick}
							/>
						</motion.div>
					)}

					{view === "intake" && (
						<motion.div
							key="yard-intake"
							initial={{ opacity: 0, x: 35 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 35 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
						>
							<IntakeView
								yardLocations={yardLocations}
								loadingLocations={loadingLocations}
								yardEquipment={yardEquipment}
								loadingEquipment={loadingEquipment}
								onCancel={() => setView("list")}
								onSaved={async () => {
									await fetchMovements();
									setView("list");
								}}
							/>
						</motion.div>
					)}

					{view === "details" && selectedMovement && (
						<motion.div
							key={`yard-details-${selectedMovement.id}`}
							initial={{ opacity: 0, x: 35 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 35 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
						>
							<YardMovementDetails
								movement={selectedMovement}
								onBack={handleBackFromDetails}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</AppShell>
	);
}

function ListView({
	movements,
	filteredMovements,
	searchQuery,
	loading,
	onSearchChange,
	onNewMovement,
	onExport,
	onRefresh,
	metrics,
	onMovementClick,
}: {
	movements: YardMovementItem[];
	filteredMovements: YardMovementItem[];
	searchQuery: string;
	loading: boolean;
	onSearchChange: (value: string) => void;
	onNewMovement: () => void;
	onExport: () => void;
	onRefresh: () => Promise<void>;
	onMovementClick: (movement: YardMovementItem) => void;
	metrics: {
		totalMovements: number;
		availableEquipment: number;
		containersInYard: number;
		occupiedLocations: number;
	};
}) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total Movements"
					value={String(metrics.totalMovements)}
					icon={Grid2X2}
				/>

				<Metric
					label="Available Equipment"
					value={String(metrics.availableEquipment)}
					icon={Truck}
				/>

				<Metric
					label="Containers in Yard"
					value={String(metrics.containersInYard)}
					icon={Container}
				/>

				<Metric
					label="Occupied Yard Locations"
					value={String(metrics.occupiedLocations)}
					icon={MapPin}
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
								<th className="px-4 py-4 text-right font-semibold">Action</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-line">
							{loading ? (
								<tr>
									<td colSpan={10} className="px-4 py-12 text-center text-ink-soft">
										Loading movements...
									</td>
								</tr>
							) : filteredMovements.length === 0 ? (
								<tr>
									<td colSpan={10} className="px-4 py-12 text-center">
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
										className="transition-colors hover:bg-sand/60"
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
												label={
													movement.status === "IN_YARD"
														? "In Yard"
														: movement.status.replaceAll("_", " ")
												}
												tone={statusTone(movement.status)}
											/>
										</td>

										<td className="px-4 py-4 text-xs text-ink-soft">
											{movement.timestamp
												? new Date(movement.timestamp).toLocaleString()
												: "—"}
										</td>

										<td className="px-4 py-4 text-right">
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() => onMovementClick(movement)}
												className="gap-2 cursor-pointer"
											>
												<Eye className="h-4 w-4" />
												View
											</Button>
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
	yardEquipment,
	loadingEquipment,
	onCancel,
	onSaved,
}: {
	yardLocations: YardLocation[];
	loadingLocations: boolean;
	yardEquipment: YardEquipment[];
	loadingEquipment: boolean;
	onCancel: () => void;
	onSaved: () => Promise<void>;
}) {
	const [query, setQuery] = useState("");
	const [shipment, setShipment] = useState<YardShipment | null>(null);
	const [searchResults, setSearchResults] = useState<YardSearchContainer[]>([]);
	const [assignments, setAssignments] = useState<
		Record<string, ContainerMovementAssignment>
	>({});
	const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
	const [bulkDestination, setBulkDestination] = useState("");
	const [bulkEquipment, setBulkEquipment] = useState("");
	const [reason, setReason] = useState(REASON_OPTIONS[0]);
	const [remarks, setRemarks] = useState("");
	const [searching, setSearching] = useState(false);
	const [saving, setSaving] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [searchWhere, setSearchWhere] = useState("bill_of_lading");

	const eligibleContainers = useMemo(
		() => searchResults.filter((container) => container.canMove),
		[searchResults]
	);

	const selectedEligibleContainers = useMemo(
		() =>
			eligibleContainers.filter((container) =>
				selectedContainers.includes(container.containerId)
			),
		[eligibleContainers, selectedContainers]
	);

	const getAssignment = (containerId: string) =>
		assignments[containerId] ?? {
			destination: "",
			equipmentId: "",
		};

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
		setAssignments({});

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
				shipmentData
					? normalizeYardShipment(shipmentData)
					: null
			);

			setSearchResults(
				containerData.map(normalizeYardSearchContainer)
			);

			if (!shipmentData || !containerData.length) {
				toast.info(
					"No shipment containers found for the supplied identifier."
				);
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

	const toggleContainer = (
		containerId: string,
		checked: boolean
	) => {
		setSelectedContainers((current) =>
			checked
				? [...new Set([...current, containerId])]
				: current.filter((id) => id !== containerId)
		);
	};

	const updateAssignment = (
		containerId: string,
		field: keyof ContainerMovementAssignment,
		value: string
	) => {
		setAssignments((current) => ({
			...current,
			[containerId]: {
				...getAssignment(containerId),
				[field]: value,
			},
		}));
	};

	const applyBulkAssignment = () => {
		if (!selectedEligibleContainers.length) {
			toast.error("Select eligible containers first.");
			return;
		}

		if (!bulkDestination) {
			toast.error("Select a yard destination.");
			return;
		}

		setAssignments((current) => {
			const updated = { ...current };

			selectedEligibleContainers.forEach((container) => {
				updated[container.containerId] = {
					destination: bulkDestination,
					equipmentId: bulkEquipment,
				};
			});

			return updated;
		});

		toast.success("Destination and equipment applied to selected containers.");
	};

	const containersToMove = useMemo(
		() =>
			eligibleContainers.filter((container) => {
				const assignment = assignments[container.containerId];

				return (
					selectedContainers.includes(container.containerId) &&
					Boolean(assignment?.destination)
				);
			}),
		[eligibleContainers, selectedContainers, assignments]
	);

	const handleSave = async () => {
		if (!shipment?.shipment_id) {
			toast.error("Shipment information is missing. Search again.");
			return;
		}

		if (!selectedEligibleContainers.length) {
			toast.error("Select at least one eligible container.");
			return;
		}

		if (
			containersToMove.length !== selectedEligibleContainers.length
		) {
			toast.error("Assign a yard destination to every selected container.");
			return;
		}

		const containers = containersToMove.map((container) => {
			const assignment = assignments[container.containerId];

			return {
				container_id: container.containerId,
				to_location_id: assignment?.destination ?? "",
				equipment_id: assignment?.equipmentId || null,
				remarks: [reason, remarks.trim()]
					.filter(Boolean)
					.join(" — "),
			};
		});

		setSaving(true);

		try {
			const response = await http.post("/operator/yards/save/", {
				shipment_id: shipment.shipment_id,
				containers,
			});

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Could not complete yard placement."
				);
			}

			toast.success(
				`${containers.length} container${containers.length === 1 ? "" : "s"} placed successfully.`
			);

			await onSaved();
		} catch (error: any) {
			toast.error(
				error?.response?.data?.data ||
					error?.message ||
					"Could not complete yard placement."
			);
		} finally {
			setSaving(false);
		}
	};

	const allEligibleSelected =
		eligibleContainers.length > 0 &&
		eligibleContainers.every((container) =>
			selectedContainers.includes(container.containerId)
		);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={onCancel}
						disabled={saving}
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
							setAssignments({});
							setShipment(null);
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
							value={String(
								searchResults.filter((item) => item.yardStatus === "READY").length
							)}
							icon={CheckCircle2}
						/>
						<Metric
							label="Not Received"
							value={String(
								searchResults.filter((item) => item.yardStatus === "NOT_RECEIVED").length
							)}
							icon={Truck}
						/>
						<Metric
							label="Already in Yard"
							value={String(
								searchResults.filter((item) => item.yardStatus === "IN_YARD").length
							)}
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
											: eligibleContainers.map((item) => item.containerId)
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
									container.containerId
								);
								const assignment = getAssignment(container.containerId);

								return (
									<div
										key={container.containerId}
										className={cn(
											"rounded-xl border p-4 transition-colors",
											selected
												? "border-orange/60 bg-orange/[0.035]"
												: "border-line"
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
															event.target.checked
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

											<div className="grid w-full gap-3 xl:max-w-[280px]">
												<SelectField
													label="Yard Destination"
													value={assignment.destination}
													onChange={(value) =>
														updateAssignment(
															container.containerId,
															"destination",
															value
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

												<SelectField
													label="Equipment"
													value={assignment.equipmentId}
													onChange={(value) =>
														updateAssignment(
															container.containerId,
															"equipmentId",
															value
														)
													}
													options={yardEquipment.map((equipment) => ({
														value: equipment.id,
														label: `${equipment.equipment_name} · ${equipment.equipment_type}`,
													}))}
													disabled={
														!container.canMove ||
														!selected ||
														saving
													}
													loading={loadingEquipment}
													placeholder="Select equipment"
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
							Bulk Assignment
						</h3>

						<p className="mt-1 text-xs text-ink-soft">
							Apply one destination and equipment to all selected containers.
						</p>

						<div className="mt-4 grid gap-3 sm:grid-cols-2">
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

							<SelectField
								label="Equipment"
								value={bulkEquipment}
								onChange={setBulkEquipment}
								options={yardEquipment.map((equipment) => ({
									value: equipment.id,
									label: `${equipment.equipment_name} · ${equipment.equipment_type}`,
								}))}
								disabled={
									loadingEquipment ||
									selectedEligibleContainers.length === 0
								}
								loading={loadingEquipment}
								placeholder="Select equipment"
							/>
						</div>

						<Button
							variant="outline"
							className="mt-3"
							onClick={applyBulkAssignment}
							disabled={
								!bulkDestination ||
								selectedEligibleContainers.length === 0
							}
						>
							Apply to Selected
						</Button>
					</div>

					<div className="rounded-xl border border-line bg-paper p-5">
						<label className={labelClass}>Movement Reason</label>

						<select
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							disabled={saving}
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
							disabled={saving}
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
								Selected containers are submitted together as one placement request.
							</p>
						</div>

						<Button
							onClick={() => void handleSave()}
							disabled={
								saving ||
								containersToMove.length === 0 ||
								containersToMove.length !== selectedEligibleContainers.length
							}
							className="gap-2 bg-orange text-white hover:bg-orange/90"
						>
							{saving ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<CheckCircle2 className="h-4 w-4" />
							)}
							{saving ? "Submitting..." : "Complete Placement"}
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

function YardMovementDetails({
	movement,
	onBack,
}: {
	movement: YardMovementItem;
	onBack: () => void;
}) {
	const formatDate = (value?: string) => {
		if (!value) return "Not recorded";

		const date = new Date(value.replace(" ", "T"));

		if (Number.isNaN(date.getTime())) return value;

		return date.toLocaleString();
	};

	const DetailItem = ({
		label,
		value,
	}: {
		label: string;
		value?: string | number | null | undefined;
	}) => (
		<div className="min-w-0 space-y-1">
			<p className="text-xs text-ink-soft">{label}</p>
			<p className="break-words text-sm font-medium text-ink">
				{value !== null && value !== undefined && value !== ""
					? value
					: "Not recorded"}
			</p>
		</div>
	);

	const logs = movement.logs ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={onBack}
						className="shrink-0 cursor-pointer"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>

					<div>
						<h2 className="text-xl font-semibold text-ink">
							Yard Movement Details
						</h2>
						<p className="mt-1 text-sm text-ink-soft">
							{movement.movementReference || "Movement record"}
						</p>
					</div>
				</div>

				<StatusBadge
					label={movement.containerStatus || "Unknown"}
					tone={statusTone(movement.containerStatus || "")}
				/>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5">
				<p className={labelClass}>Movement Reference</p>
				<p className="mt-1 text-lg font-semibold text-ink">
					{movement.movementReference || "Not recorded"}
				</p>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Container className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">
						Container Information
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					<DetailItem label="Container number" value={movement.containerNo} />
					<DetailItem label="Container size" value={movement.containerSize} />
					<DetailItem label="Seal number" value={movement.sealNo} />
					<DetailItem label="Container status" value={movement.containerStatus} />
					<DetailItem label="Gross weight" value={movement.grossWeight} />
					<DetailItem label="Cargo description" value={movement.cargoDescription} />
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<FileText className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">
						Shipment Information
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					<DetailItem label="Shipment reference" value={movement.shipmentReference} />
					<DetailItem label="Bill of lading" value={movement.billOfLading} />
					<DetailItem label="Booking number" value={movement.bookingNumber} />
					<DetailItem label="Vessel" value={movement.vesselName} />
					<DetailItem label="Voyage" value={movement.voyageNumber} />
					<DetailItem label="Shipping line" value={movement.shippingLine} />
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<MapPin className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">Movement Route</h3>
				</div>

				<div className="grid grid-cols-1 gap-4 rounded-xl bg-sand/50 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
					<div>
						<p className={labelClass}>From location</p>
						<p className="mt-1 text-sm font-medium text-ink">
							{movement.originSlot || "Container Receiving Bay"}
						</p>
					</div>

					<ArrowRight className="hidden h-5 w-5 text-orange sm:block" />

					<div>
						<p className={labelClass}>To location</p>
						<p className="mt-1 text-sm font-medium text-ink">
							{movement.targetSlot || "Not recorded"}
						</p>
					</div>
				</div>

				<DetailItem
					label="Movement type"
					value={getMovementLabel(movement.movementType)}
				/>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Truck className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">
						Equipment Information
					</h3>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					<DetailItem label="Equipment" value={movement.equipment} />
					<DetailItem label="Equipment code" value={movement.equipmentCode} />
					<DetailItem label="Equipment type" value={movement.equipmentType} />
					<DetailItem label="Registration number" value={movement.registrationNumber} />
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<User className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">
						Operator Information
					</h3>
				</div>

				<DetailItem label="Moved by" value={movement.operator} />
			</div>

			<div className="rounded-xl border border-line bg-paper p-5 space-y-4">
				<div className="flex items-center gap-2">
					<Calendar className="h-[18px] text-orange" />
					<h3 className="text-sm font-semibold text-ink">
						Movement Information
					</h3>
				</div>

				<DetailItem
					label="Completed at"
					value={formatDate(movement.timestamp)}
				/>

				<div className="space-y-1">
					<p className={labelClass}>Remarks</p>
					<p className="rounded-lg bg-sand/50 p-3 text-sm text-ink">
						{movement.reason || "No remarks provided"}
					</p>
				</div>
			</div>

			<div className="rounded-xl border border-line bg-paper p-5">
				<div>
					<h3 className="text-sm font-semibold text-ink">
						Movement Activity
					</h3>
					<p className="mt-1 text-xs text-ink-soft">
						Recorded activities for this movement
					</p>
				</div>

				{logs.length === 0 ? (
					<div className="mt-4 rounded-xl border border-dashed border-line p-5 text-center">
						<p className="text-sm text-ink-soft">
							No additional activity records found.
						</p>
					</div>
				) : (
					<div className="mt-5 space-y-4">
						{logs.map((log, index) => (
							<div key={log.id || index} className="flex gap-3">
								<div className="flex flex-col items-center">
									<div className="h-2.5 w-2.5 rounded-full bg-orange" />
									{index !== logs.length - 1 && (
										<div className="mt-1 w-px flex-1 bg-line" />
									)}
								</div>

								<div className="min-w-0 flex-1 pb-3">
									<p className="text-sm font-semibold text-ink">
										{log.action || "Movement activity"}
									</p>

									{log.description && (
										<p className="mt-1 text-sm text-ink-soft">
											{log.description}
										</p>
									)}

									<p className="mt-2 text-xs text-ink-soft">
										{log.performed_by || "Not recorded"}
										{" · "}
										{formatDate(log.performed_at)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="flex justify-start">
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					className="gap-2 cursor-pointer"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to movements
				</Button>
			</div>
		</div>
	);
}