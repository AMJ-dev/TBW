import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Boxes,
	Building2,
	Layers,
	MapPin,
	Package,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Warehouse,
	Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type LocationKind = "yard" | "warehouse";
type LocationStatus = "active" | "inactive" | "maintenance";
type CapacityUnit = "TEU" | "sqm" | "pallets" | "positions" | "tonnes";

interface EquipmentEntry {
	id: string;
	label: string;
}

interface LocationRow {
	id: string;
	code: string;
	name: string;
	kind: LocationKind;
	bonded: boolean;
	status: LocationStatus;
	capacity: string;
	capacityUnit: CapacityUnit;
	cargoTypes: string;
	security: string;
	equipment: EquipmentEntry[];
	zone: string;
	block: string;
	row: string;
	slot: string;
	tier: string;
	aisle: string;
	rack: string;
	bin: string;
}

interface CargoService {
	id: string;
	label: string;
}

interface HoldReason {
	id: string;
	label: string;
}

interface OperationalArea {
	id: string;
	label: string;
}

interface TerminalConfig {
	terminalName: string;
	terminalCode: string;
	operatingHours: string;
	locations: LocationRow[];
	cargoServices: CargoService[];
	holdReasons: HoldReason[];
	operationalAreas: OperationalArea[];
}

const emptyConfig: TerminalConfig = {
	terminalName: "",
	terminalCode: "",
	operatingHours: "",
	locations: [],
	cargoServices: [],
	holdReasons: [],
	operationalAreas: [],
};

const capacityUnits: { value: CapacityUnit; label: string }[] = [
	{ value: "TEU", label: "TEU" },
	{ value: "sqm", label: "Square metres" },
	{ value: "pallets", label: "Pallets" },
	{ value: "positions", label: "Positions" },
	{ value: "tonnes", label: "Tonnes" },
];

/* Common equipment suggestions — the admin can pick from these or type */
/* a custom value. Suggestions are not exhaustive.                     */
const EQUIPMENT_SUGGESTIONS = [
	"Reach stacker",
	"Forklift",
	"Terminal tractor",
	"Container handler",
	"Pallet jack",
	"Platform weighing scale",
	"Crane",
	"Loading dock equipment",
];

const normaliseEquipment = (raw: any): EquipmentEntry[] => {
	if (!Array.isArray(raw)) {
		if (typeof raw === "string" && raw.trim()) {
			return raw
				.split(",")
				.map((label: string) => label.trim())
				.filter(Boolean)
				.map((label: string) => ({
					id: crypto.randomUUID(),
					label,
				}));
		}
		return [];
	}
	return raw
		.map((item: any) => {
			if (typeof item === "string") {
				return { id: crypto.randomUUID(), label: item };
			}
			return {
				id: String(item?.id ?? crypto.randomUUID()),
				label: item?.label ?? item?.name ?? "",
			};
		})
		.filter((item) => item.label.trim());
};

const normaliseLocation = (raw: any): LocationRow => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	code: raw?.code ?? "",
	name: raw?.name ?? "",
	kind: (raw?.kind ?? "yard") as LocationKind,
	bonded: Boolean(raw?.bonded ?? true),
	status: (raw?.status ?? "active") as LocationStatus,
	capacity:
		raw?.capacity === null || raw?.capacity === undefined
			? ""
			: String(raw.capacity),
	capacityUnit: (raw?.capacity_unit ??
		raw?.capacityUnit ??
		"TEU") as CapacityUnit,
	cargoTypes: raw?.cargo_types ?? raw?.cargoTypes ?? "",
	security: raw?.security ?? "",
	equipment: normaliseEquipment(raw?.equipment),
	zone: raw?.zone ?? "",
	block: raw?.block ?? "",
	row: raw?.row ?? "",
	slot: raw?.slot ?? "",
	tier: raw?.tier ?? "",
	aisle: raw?.aisle ?? "",
	rack: raw?.rack ?? "",
	bin: raw?.bin ?? "",
});

const normaliseCargoService = (raw: any): CargoService => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	label: raw?.label ?? raw?.name ?? "",
});

const normaliseHoldReason = (raw: any): HoldReason => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	label: raw?.label ?? raw?.name ?? "",
});

const normaliseOperationalArea = (raw: any): OperationalArea => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	label: raw?.label ?? raw?.name ?? "",
});

export default function AdminTerminalConfigurationPage() {
	const [config, setConfig] = useState<TerminalConfig>(emptyConfig);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [dirty, setDirty] = useState(false);
	const [changeReason, setChangeReason] = useState("");

	/* Per-location draft string for the "add custom equipment" input. */
	const [equipmentDrafts, setEquipmentDrafts] = useState<
		Record<string, string>
	>({});

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/terminal/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load terminal configuration.");
				return;
			}
			const payload: any = resp.code ?? {};

			const rawLocations: any[] = Array.isArray(payload.locations)
				? payload.locations
				: [];
			const rawServices: any[] = Array.isArray(payload.cargo_services)
				? payload.cargo_services
				: Array.isArray(payload.cargoServices)
					? payload.cargoServices
					: [];
			const rawHolds: any[] = Array.isArray(payload.hold_reasons)
				? payload.hold_reasons
				: Array.isArray(payload.holdReasons)
					? payload.holdReasons
					: [];
			const rawAreas: any[] = Array.isArray(payload.operational_areas)
				? payload.operational_areas
				: Array.isArray(payload.operationalAreas)
					? payload.operationalAreas
					: [];

			setConfig({
				terminalName:
					payload.terminal_name ?? payload.terminalName ?? "",
				terminalCode:
					payload.terminal_code ?? payload.terminalCode ?? "",
				operatingHours:
					payload.operating_hours ?? payload.operatingHours ?? "",
				locations: rawLocations.map(normaliseLocation),
				cargoServices: rawServices.map(normaliseCargoService),
				holdReasons: rawHolds.map(normaliseHoldReason),
				operationalAreas: rawAreas.map(normaliseOperationalArea),
			});
			setChangeReason("");
			setEquipmentDrafts({});
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load terminal configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof TerminalConfig>(
		key: K,
		value: TerminalConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	};

	const addLocation = () => {
		setConfig((prev) => ({
			...prev,
			locations: [
				...prev.locations,
				{
					id: `loc-${Date.now()}`,
					code: "",
					name: "",
					kind: "yard",
					bonded: true,
					status: "active",
					capacity: "",
					capacityUnit: "TEU",
					cargoTypes: "",
					security: "",
					equipment: [],
					zone: "",
					block: "",
					row: "",
					slot: "",
					tier: "",
					aisle: "",
					rack: "",
					bin: "",
				},
			],
		}));
		setDirty(true);
	};

	const updateLocation = (id: string, patch: Partial<LocationRow>) => {
		setConfig((prev) => ({
			...prev,
			locations: prev.locations.map((location) =>
				location.id === id ? { ...location, ...patch } : location
			),
		}));
		setDirty(true);
	};

	const removeLocation = (id: string) => {
		setConfig((prev) => ({
			...prev,
			locations: prev.locations.filter((location) => location.id !== id),
		}));
		setDirty(true);
	};

	/* ---------------------------------------------------------------- */
	/* Equipment assigned — free-form entries per location              */
	/* ---------------------------------------------------------------- */

	const addEquipmentFromSuggestion = (
		locationId: string,
		label: string
	) => {
		const trimmed = label.trim();
		if (!trimmed) return;
		setConfig((prev) => ({
			...prev,
			locations: prev.locations.map((location) => {
				if (location.id !== locationId) return location;
				const exists = location.equipment.some(
					(e) =>
						e.label.toLowerCase() === trimmed.toLowerCase()
				);
				if (exists) return location;
				return {
					...location,
					equipment: [
						...location.equipment,
						{ id: crypto.randomUUID(), label: trimmed },
					],
				};
			}),
		}));
		setDirty(true);
	};

	const addEquipmentFromDraft = (locationId: string) => {
		const draft = (equipmentDrafts[locationId] ?? "").trim();
		if (!draft) {
			toast.error("Type an equipment name first.");
			return;
		}
		addEquipmentFromSuggestion(locationId, draft);
		setEquipmentDrafts((prev) => ({ ...prev, [locationId]: "" }));
	};

	const updateEquipmentEntry = (
		locationId: string,
		equipmentId: string,
		label: string
	) => {
		setConfig((prev) => ({
			...prev,
			locations: prev.locations.map((location) => {
				if (location.id !== locationId) return location;
				return {
					...location,
					equipment: location.equipment.map((entry) =>
						entry.id === equipmentId
							? { ...entry, label }
							: entry
					),
				};
			}),
		}));
		setDirty(true);
	};

	const removeEquipmentEntry = (
		locationId: string,
		equipmentId: string
	) => {
		setConfig((prev) => ({
			...prev,
			locations: prev.locations.map((location) => {
				if (location.id !== locationId) return location;
				return {
					...location,
					equipment: location.equipment.filter(
						(entry) => entry.id !== equipmentId
					),
				};
			}),
		}));
		setDirty(true);
	};

	/* ---------------------------------------------------------------- */
	/* Cargo services                                                   */
	/* ---------------------------------------------------------------- */

	const addCargoService = () => {
		setConfig((prev) => ({
			...prev,
			cargoServices: [
				...prev.cargoServices,
				{ id: `service-${Date.now()}`, label: "" },
			],
		}));
		setDirty(true);
	};

	const updateCargoService = (id: string, label: string) => {
		setConfig((prev) => ({
			...prev,
			cargoServices: prev.cargoServices.map((service) =>
				service.id === id ? { ...service, label } : service
			),
		}));
		setDirty(true);
	};

	const removeCargoService = (id: string) => {
		setConfig((prev) => ({
			...prev,
			cargoServices: prev.cargoServices.filter(
				(service) => service.id !== id
			),
		}));
		setDirty(true);
	};

	/* ---------------------------------------------------------------- */
	/* Hold reasons                                                     */
	/* ---------------------------------------------------------------- */

	const addHoldReason = () => {
		setConfig((prev) => ({
			...prev,
			holdReasons: [
				...prev.holdReasons,
				{ id: `hold-${Date.now()}`, label: "" },
			],
		}));
		setDirty(true);
	};

	const updateHoldReason = (id: string, label: string) => {
		setConfig((prev) => ({
			...prev,
			holdReasons: prev.holdReasons.map((reason) =>
				reason.id === id ? { ...reason, label } : reason
			),
		}));
		setDirty(true);
	};

	const removeHoldReason = (id: string) => {
		setConfig((prev) => ({
			...prev,
			holdReasons: prev.holdReasons.filter((reason) => reason.id !== id),
		}));
		setDirty(true);
	};

	/* ---------------------------------------------------------------- */
	/* Operational areas                                                */
	/* ---------------------------------------------------------------- */

	const addOperationalArea = () => {
		setConfig((prev) => ({
			...prev,
			operationalAreas: [
				...prev.operationalAreas,
				{ id: `area-${Date.now()}`, label: "" },
			],
		}));
		setDirty(true);
	};

	const updateOperationalArea = (id: string, label: string) => {
		setConfig((prev) => ({
			...prev,
			operationalAreas: prev.operationalAreas.map((area) =>
				area.id === id ? { ...area, label } : area
			),
		}));
		setDirty(true);
	};

	const removeOperationalArea = (id: string) => {
		setConfig((prev) => ({
			...prev,
			operationalAreas: prev.operationalAreas.filter(
				(area) => area.id !== id
			),
		}));
		setDirty(true);
	};

	const validate = () => {
		if (!config.terminalName.trim()) {
			toast.error("Terminal name is required.");
			return false;
		}
		if (!config.terminalCode.trim()) {
			toast.error("Terminal code is required.");
			return false;
		}

		const invalidLocation = config.locations.some(
			(location) =>
				!location.code.trim() ||
				!location.name.trim() ||
				!location.zone.trim() ||
				(location.capacity !== "" &&
					(!Number.isFinite(Number(location.capacity)) ||
						Number(location.capacity) < 0))
		);
		if (invalidLocation) {
			toast.error(
				"Each location needs a code, name, and zone, and a valid capacity."
			);
			return false;
		}

		const emptyEquipment = config.locations.find((location) =>
			location.equipment.some((entry) => !entry.label.trim())
		);
		if (emptyEquipment) {
			toast.error(
				"Remove empty equipment entries or fill them in before saving."
			);
			return false;
		}

		const duplicateEquipment = config.locations.find((location) => {
			const labels = location.equipment.map((entry) =>
				entry.label.trim().toLowerCase()
			);
			return new Set(labels).size !== labels.length;
		});
		if (duplicateEquipment) {
			toast.error(
				`Duplicate equipment listed on "${duplicateEquipment.name}".`
			);
			return false;
		}

		const emptyService = config.cargoServices.find(
			(service) => !service.label.trim()
		);
		if (emptyService) {
			toast.error(
				"Every cargo service needs a label, or remove the empty row."
			);
			return false;
		}

		const serviceLabels = config.cargoServices.map((s) =>
			s.label.trim().toLowerCase()
		);
		const duplicateService = serviceLabels.find(
			(label, index) => serviceLabels.indexOf(label) !== index
		);
		if (duplicateService) {
			toast.error(`Duplicate cargo service: "${duplicateService}".`);
			return false;
		}

		const emptyHold = config.holdReasons.find(
			(reason) => !reason.label.trim()
		);
		if (emptyHold) {
			toast.error(
				"Every hold reason needs a label, or remove the empty row."
			);
			return false;
		}

		const holdLabels = config.holdReasons.map((r) =>
			r.label.trim().toLowerCase()
		);
		const duplicateHold = holdLabels.find(
			(label, index) => holdLabels.indexOf(label) !== index
		);
		if (duplicateHold) {
			toast.error(`Duplicate hold reason: "${duplicateHold}".`);
			return false;
		}

		const emptyArea = config.operationalAreas.find(
			(area) => !area.label.trim()
		);
		if (emptyArea) {
			toast.error(
				"Every operational area needs a label, or remove the empty row."
			);
			return false;
		}

		const areaLabels = config.operationalAreas.map((a) =>
			a.label.trim().toLowerCase()
		);
		const duplicateArea = areaLabels.find(
			(label, index) => areaLabels.indexOf(label) !== index
		);
		if (duplicateArea) {
			toast.error(`Duplicate operational area: "${duplicateArea}".`);
			return false;
		}

		return true;
	};

	const handleSave = async () => {
		if (!dirty || saving) return;
		if (!validate()) return;

		setSaving(true);
		try {
			const payload = {
				terminal_name: config.terminalName.trim(),
				terminal_code: config.terminalCode.trim(),
				operating_hours: config.operatingHours.trim(),
				locations: config.locations.map((location) => ({
					id: location.id,
					code: location.code.trim(),
					name: location.name.trim(),
					kind: location.kind,
					bonded: location.bonded,
					status: location.status,
					capacity:
						location.capacity === ""
							? null
							: Number(location.capacity),
					capacity_unit: location.capacityUnit,
					cargo_types: location.cargoTypes.trim(),
					security: location.security.trim(),
					equipment: location.equipment.map((entry) => ({
						id: entry.id,
						label: entry.label.trim(),
					})),
					zone: location.zone.trim(),
					block: location.block.trim(),
					row: location.row.trim(),
					slot: location.slot.trim(),
					tier: location.tier.trim(),
					aisle: location.aisle.trim(),
					rack: location.rack.trim(),
					bin: location.bin.trim(),
				})),
				cargo_services: config.cargoServices.map((service) => ({
					id: service.id,
					label: service.label.trim(),
				})),
				hold_reasons: config.holdReasons.map((reason) => ({
					id: reason.id,
					label: reason.label.trim(),
				})),
				operational_areas: config.operationalAreas.map((area) => ({
					id: area.id,
					label: area.label.trim(),
				})),
				change_reason: changeReason.trim(),
			};

			const res = await http.post(
				"/admin/config/terminal/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the terminal configuration."
				);
				return;
			}
			toast.success("Terminal configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the terminal configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		setChangeReason("");
		setEquipmentDrafts({});
		await fetchAll();
		toast.message("Changes discarded.");
	};

	if (loading) {
		return (
			<AppShell
				title="Terminal Operations"
				eyebrow="Administration · Configuration"
			>
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell
				title="Terminal Operations"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load terminal configuration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error}
							</p>
						</div>
					</div>
					<div className="mt-5">
						<Button
							onClick={() => void fetchAll()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell
			title="Terminal Operations"
			eyebrow="Administration · Configuration"
		>
			<div className="space-y-6 pb-8">
				{/* Header */}
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<Link
							to="/admin/configuration"
							className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
						>
							<ArrowLeft className="size-3.5" />
							Back to configuration
						</Link>
						<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
							Terminal Operations
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Configure terminal identity, operating hours, cargo
							services, storage locations, operational areas, and hold
							reasons. Changes apply to new operational events;
							historical records retain their original configuration.
						</p>
					</div>
					{dirty && (
						<StatusBadge label="Unsaved changes" tone="warning" />
					)}
				</div>

				{/* Info banner */}
				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<ShieldCheck className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-ink">
								Operational rules
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Location hierarchy, bonded segregation, cargo
								services, operational areas, and hold reasons are
								configurable. Operational movements and holds retain
								their own event history and audit trail.
							</p>
						</div>
					</div>
				</div>

				{/* Terminal identity */}
				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5">
						<h3 className="font-display text-sm font-bold text-ink">
							Terminal identity
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							The facility name, unique terminal code, and normal
							operating hours.
						</p>
					</div>
					<div className="grid gap-4 p-5 sm:grid-cols-2">
						<Field
							label="Terminal name"
							required
							icon={Building2}
							value={config.terminalName}
							onChange={(value) => update("terminalName", value)}
							placeholder="e.g. Abuja Flagship Facility"
						/>
						<Field
							label="Terminal code"
							required
							icon={Building2}
							value={config.terminalCode}
							onChange={(value) => update("terminalCode", value)}
							placeholder="e.g. TRN-ABJ-01"
							mono
						/>
						<Field
							label="Operating hours"
							icon={Building2}
							value={config.operatingHours}
							onChange={(value) => update("operatingHours", value)}
							placeholder="e.g. 08:00–18:00"
							mono
						/>
					</div>
				</section>

				{/* Zones & Locations */}
				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Zones &amp; Locations
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Configure yard zones with blocks, rows, slots and
								tiers, or warehouse zones with aisles, racks and
								bins. Add the equipment assigned to each location.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addLocation}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							<Plus className="size-3.5" />
							Add location
						</Button>
					</div>

					{config.locations.length === 0 ? (
						<div className="p-6 text-center text-sm text-ink-soft">
							No locations configured.
						</div>
					) : (
						<ul className="divide-y divide-line">
							{config.locations.map((location) => (
								<li key={location.id} className="p-5">
									<div className="flex flex-wrap items-start gap-4">
										<div
											className={cn(
												"grid size-10 shrink-0 place-items-center rounded-lg text-white",
												location.kind === "warehouse"
													? "bg-orange"
													: "bg-slate"
											)}
										>
											{location.kind === "warehouse" ? (
												<Warehouse className="size-5" />
											) : (
												<Boxes className="size-5" />
											)}
										</div>

										<div className="min-w-[220px] flex-1 space-y-5">
											{/* Zone */}
											<div className="rounded-lg border border-line p-3">
												<p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
													<Layers className="size-3.5 text-orange" />
													Zone
												</p>
												<div className="grid gap-3 sm:grid-cols-3">
													<SmallField
														label="Zone name"
														value={location.zone}
														onChange={(value) =>
															updateLocation(location.id, {
																zone: value,
															})
														}
														placeholder="e.g. Container Yard A"
													/>
													<label className="block">
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
															Zone type
														</span>
														<select
															value={location.kind}
															onChange={(event) => {
																const kind = event.target
																	.value as LocationKind;
																updateLocation(location.id, {
																	kind,
																	capacityUnit:
																		kind === "yard"
																			? "TEU"
																			: "sqm",
																});
															}}
															className="mt-1 h-9 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
														>
															<option value="yard">Yard</option>
															<option value="warehouse">
																Warehouse
															</option>
														</select>
													</label>
													<label className="block">
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
															Status
														</span>
														<select
															value={location.status}
															onChange={(event) =>
																updateLocation(location.id, {
																	status: event.target
																		.value as LocationStatus,
																})
															}
															className="mt-1 h-9 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
														>
															<option value="active">Active</option>
															<option value="inactive">
																Inactive
															</option>
															<option value="maintenance">
																Maintenance
															</option>
														</select>
													</label>
												</div>
											</div>

											{/* Identity */}
											<div className="grid gap-3 sm:grid-cols-3">
												<SmallField
													label="Location code"
													value={location.code}
													onChange={(value) =>
														updateLocation(location.id, {
															code: value,
														})
													}
													placeholder="CY-A"
													mono
												/>
												<SmallField
													label="Location name"
													value={location.name}
													onChange={(value) =>
														updateLocation(location.id, {
															name: value,
														})
													}
													placeholder="Container Yard A"
												/>
												<label className="flex items-end pb-2">
													<label className="inline-flex items-center gap-2 text-[12px] text-ink">
														<input
															type="checkbox"
															checked={location.bonded}
															onChange={(event) =>
																updateLocation(location.id, {
																	bonded:
																		event.target.checked,
																})
															}
															className="size-4 accent-orange"
														/>
														Bonded location
													</label>
												</label>
											</div>

											{/* Capacity & cargo types */}
											<div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.5fr]">
												<SmallField
													label="Capacity"
													value={location.capacity}
													onChange={(value) =>
														updateLocation(location.id, {
															capacity: value,
														})
													}
													placeholder="120"
												/>
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Capacity unit
													</span>
													<select
														value={location.capacityUnit}
														onChange={(event) =>
															updateLocation(location.id, {
																capacityUnit: event.target
																	.value as CapacityUnit,
															})
														}
														className="mt-1 h-9 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
													>
														{capacityUnits.map((unit) => (
															<option
																key={unit.value}
																value={unit.value}
															>
																{unit.label}
															</option>
														))}
													</select>
												</label>
												<SmallField
													label="Cargo types supported"
													value={location.cargoTypes}
													onChange={(value) =>
														updateLocation(location.id, {
															cargoTypes: value,
														})
													}
													placeholder="Containerised cargo, general cargo"
												/>
											</div>

											{/* Hierarchy */}
											{location.kind === "yard" ? (
												<div className="rounded-lg border border-line p-3">
													<p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
														<MapPin className="size-3.5 text-orange" />
														Yard hierarchy
													</p>
													<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
														<SmallField
															label="Block"
															value={location.block}
															onChange={(value) =>
																updateLocation(location.id, {
																	block: value,
																})
															}
															placeholder="A"
														/>
														<SmallField
															label="Row"
															value={location.row}
															onChange={(value) =>
																updateLocation(location.id, {
																	row: value,
																})
															}
															placeholder="01"
														/>
														<SmallField
															label="Slot"
															value={location.slot}
															onChange={(value) =>
																updateLocation(location.id, {
																	slot: value,
																})
															}
															placeholder="01"
														/>
														<SmallField
															label="Tier"
															value={location.tier}
															onChange={(value) =>
																updateLocation(location.id, {
																	tier: value,
																})
															}
															placeholder="Ground or 1"
														/>
													</div>
												</div>
											) : (
												<div className="rounded-lg border border-line p-3">
													<p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
														<Warehouse className="size-3.5 text-orange" />
														Warehouse hierarchy
													</p>
													<div className="grid gap-3 sm:grid-cols-3">
														<SmallField
															label="Aisle"
															value={location.aisle}
															onChange={(value) =>
																updateLocation(location.id, {
																	aisle: value,
																})
															}
															placeholder="A"
														/>
														<SmallField
															label="Rack"
															value={location.rack}
															onChange={(value) =>
																updateLocation(location.id, {
																	rack: value,
																})
															}
															placeholder="R01"
														/>
														<SmallField
															label="Bin"
															value={location.bin}
															onChange={(value) =>
																updateLocation(location.id, {
																	bin: value,
																})
															}
															placeholder="B01"
														/>
													</div>
												</div>
											)}

											{/* Equipment assigned */}
											<div className="rounded-lg border border-line p-3">
												<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
													<p className="flex items-center gap-2 text-xs font-semibold text-ink">
														<Wrench className="size-3.5 text-orange" />
														Equipment assigned
													</p>
													<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														{location.equipment.length}{" "}
														{location.equipment.length === 1
															? "item"
															: "items"}
													</span>
												</div>

												{/* Existing equipment entries */}
												{location.equipment.length > 0 && (
													<ul className="space-y-2">
														{location.equipment.map(
															(entry) => (
																<li
																	key={entry.id}
																	className="flex items-center gap-2"
																>
																	<Input
																		value={
																			entry.label
																		}
																		onChange={(
																			event
																		) =>
																			updateEquipmentEntry(
																				location.id,
																				entry.id,
																				event
																					.target
																					.value
																			)
																		}
																		placeholder="Equipment name"
																		className="h-9 border-line bg-paper text-xs text-ink"
																	/>
																	<button
																		type="button"
																		onClick={() =>
																			removeEquipmentEntry(
																				location.id,
																				entry.id
																			)
																		}
																		aria-label={`Remove ${entry.label}`}
																		className="grid size-9 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
																	>
																		<Trash2 className="size-3.5" />
																	</button>
																</li>
															)
														)}
													</ul>
												)}

												{/* Add custom equipment */}
												<div className="mt-3 flex flex-wrap items-center gap-2">
													<Input
														value={
															equipmentDrafts[
																location.id
															] ?? ""
														}
														onChange={(event) =>
															setEquipmentDrafts(
																(prev) => ({
																	...prev,
																	[location.id]:
																		event.target
																			.value,
																})
															)
														}
														onKeyDown={(event) => {
															if (
																event.key ===
																"Enter"
															) {
																event.preventDefault();
																addEquipmentFromDraft(
																	location.id
																);
															}
														}}
														placeholder="Type equipment and press Enter"
														className="h-9 min-w-[220px] flex-1 border-line bg-paper text-xs text-ink"
													/>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() =>
															addEquipmentFromDraft(
																location.id
															)
														}
														className="h-9 border-line bg-paper text-ink hover:bg-sand"
													>
														<Plus className="size-3.5" />
														Add
													</Button>
												</div>

												{/* Suggestions */}
												<div className="mt-3 border-t border-line pt-3">
													<p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
														Quick add
													</p>
													<div className="flex flex-wrap gap-1.5">
														{EQUIPMENT_SUGGESTIONS.map(
															(item) => {
																const already =
																	location.equipment.some(
																		(e) =>
																			e.label.toLowerCase() ===
																			item.toLowerCase()
																	);
																return (
																	<button
																		key={item}
																		type="button"
																		disabled={already}
																		onClick={() =>
																			addEquipmentFromSuggestion(
																				location.id,
																				item
																			)
																		}
																		className={cn(
																			"rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
																			already
																				? "cursor-not-allowed border-line bg-sand text-ink-soft/60"
																				: "border-line bg-paper text-ink-soft hover:border-orange hover:bg-orange/5 hover:text-orange"
																		)}
																	>
																		+ {item}
																	</button>
																);
															}
														)}
													</div>
												</div>
											</div>

											{/* Security */}
											<SmallField
												label="Security provisions"
												value={location.security}
												onChange={(value) =>
													updateLocation(location.id, {
														security: value,
													})
												}
												placeholder="e.g. Controlled access, CCTV, patrols"
											/>
										</div>

										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeLocation(location.id)}
											className="text-carmine hover:bg-carmine/10"
										>
											<Trash2 className="size-3.5" />
											Remove
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>

				{/* Operational areas */}
				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Operational areas
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Non-storage destinations used in operational
								workflows. The yard page uses these as movement
								targets alongside storage positions.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addOperationalArea}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							<Plus className="size-3.5" />
							Add area
						</Button>
					</div>

					{config.operationalAreas.length === 0 ? (
						<div className="p-6 text-center text-sm text-ink-soft">
							No operational areas configured.
						</div>
					) : (
						<ul className="divide-y divide-line">
							{config.operationalAreas.map((area) => (
								<li
									key={area.id}
									className="flex flex-wrap items-center gap-3 p-5"
								>
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<MapPin className="size-4" />
									</div>
									<Input
										value={area.label}
										onChange={(event) =>
											updateOperationalArea(
												area.id,
												event.target.value
											)
										}
										placeholder="e.g. Examination Bay 01"
										className="h-11 min-w-[220px] flex-1 border-line bg-sand text-ink"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeOperationalArea(area.id)}
										aria-label={`Remove ${
											area.label || "area"
										}`}
										className="text-carmine hover:bg-carmine/10"
									>
										<Trash2 className="size-3.5" />
										Remove
									</Button>
								</li>
							))}
						</ul>
					)}
				</section>

				{/* Cargo services */}
				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Cargo services
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Cargo categories the terminal is licensed and equipped
								to handle. These appear in intake forms and public
								service listings.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addCargoService}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							<Plus className="size-3.5" />
							Add service
						</Button>
					</div>

					{config.cargoServices.length === 0 ? (
						<div className="p-6 text-center text-sm text-ink-soft">
							No cargo services configured.
						</div>
					) : (
						<ul className="divide-y divide-line">
							{config.cargoServices.map((service) => (
								<li
									key={service.id}
									className="flex flex-wrap items-center gap-3 p-5"
								>
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Package className="size-4" />
									</div>
									<Input
										value={service.label}
										onChange={(event) =>
											updateCargoService(
												service.id,
												event.target.value
											)
										}
										placeholder="e.g. Containerised cargo"
										className="h-11 min-w-[220px] flex-1 border-line bg-sand text-ink"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeCargoService(service.id)}
										aria-label={`Remove ${
											service.label || "service"
										}`}
										className="text-carmine hover:bg-carmine/10"
									>
										<Trash2 className="size-3.5" />
										Remove
									</Button>
								</li>
							))}
						</ul>
					)}
				</section>

				{/* Hold reasons */}
				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
						<div>
							<h3 className="font-display text-sm font-bold text-ink">
								Hold reasons
							</h3>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Reasons available to authorised staff when placing a
								hold. The actual hold workflow separately captures
								authority, reference, actor, timestamp, and lift
								details.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addHoldReason}
							className="border-line bg-paper text-ink hover:bg-sand"
						>
							<Plus className="size-3.5" />
							Add reason
						</Button>
					</div>

					{config.holdReasons.length === 0 ? (
						<div className="p-6 text-center text-sm text-ink-soft">
							No hold reasons configured.
						</div>
					) : (
						<ul className="divide-y divide-line">
							{config.holdReasons.map((reason) => (
								<li
									key={reason.id}
									className="flex flex-wrap items-center gap-3 p-5"
								>
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
										<Layers className="size-4" />
									</div>
									<Input
										value={reason.label}
										onChange={(event) =>
											updateHoldReason(
												reason.id,
												event.target.value
											)
										}
										placeholder="e.g. Seal mismatch"
										className="h-11 min-w-[220px] flex-1 border-line bg-sand text-ink"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeHoldReason(reason.id)}
										aria-label={`Remove ${
											reason.label || "reason"
										}`}
										className="text-carmine hover:bg-carmine/10"
									>
										<Trash2 className="size-3.5" />
										Remove
									</Button>
								</li>
							))}
						</ul>
					)}
				</section>

				{/* Change reason */}
				{dirty && (
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<label className="block">
							<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<AlertTriangle className="size-3.5 text-orange" />
								Reason for change
							</span>
							<textarea
								value={changeReason}
								onChange={(event) =>
									setChangeReason(event.target.value)
								}
								maxLength={500}
								rows={3}
								placeholder="Explain why this configuration is being changed."
								className="mt-2 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
							/>
							<span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
								{changeReason.length}/500
							</span>
						</label>
					</section>
				)}

				{/* Info footer */}
				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div className="min-w-0">
							<p className="text-[13px] font-semibold text-ink">
								Location capacity and allocation
							</p>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Capacity is stored as a numeric value with a unit.
								Operational allocation logic prevents double
								allocation of occupied positions and retains an
								auditable movement history. Current occupancy comes
								from operational records, not from configuration.
							</p>
						</div>
					</div>
				</div>

				{/* Sticky actions */}
				<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								{dirty ? "Unsaved changes" : "All changes saved"}
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{dirty
									? "Save to apply terminal, location, equipment, service, area, and hold changes."
									: "No pending changes."}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleDiscard}
								disabled={!dirty || saving}
								className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
							>
								Discard
							</Button>
							<Button
								type="button"
								onClick={handleSave}
								disabled={!dirty || saving}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								<Save className="size-4" />
								{saving ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	icon: Icon,
	mono,
	required,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Building2;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
				{required && <span className="text-coral">*</span>}
			</span>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1.5 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}

function SmallField({
	label,
	value,
	onChange,
	placeholder,
	mono,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	mono?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1 h-9 border-line bg-paper text-[13px] text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}