import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Edit3,
  Forklift,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type EquipmentType =
  | "REACH_STACKER"
  | "FORKLIFT"
  | "TERMINAL_TRACTOR"
  | "MOBILE_CRANE"
  | "GANTRY_CRANE"
  | "TRUCK"
  | "TRAILER"
  | "OTHER";

type EquipmentStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

interface Equipment {
  id: string;
  equipment_name: string;
  equipment_code: string;
  equipment_type: EquipmentType;
  registration_number: string;
  capacity: number | null;
  capacity_unit: string;
  operational_status: EquipmentStatus;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface EquipmentPayload {
  id?: string;
  equipment_name: string;
  equipment_code: string;
  equipment_type: EquipmentType;
  registration_number: string;
  capacity: number | null;
  capacity_unit: string;
  operational_status: EquipmentStatus;
  description: string;
  is_active: boolean;
  change_reason: string;
}

const emptyEquipment: Equipment = {
  id: "",
  equipment_name: "",
  equipment_code: "",
  equipment_type: "REACH_STACKER",
  registration_number: "",
  capacity: null,
  capacity_unit: "TONNES",
  operational_status: "AVAILABLE",
  description: "",
  is_active: true,
};

const equipmentTypes: { value: EquipmentType; label: string }[] = [
  { value: "REACH_STACKER", label: "Reach Stacker" },
  { value: "FORKLIFT", label: "Forklift" },
  { value: "TERMINAL_TRACTOR", label: "Terminal Tractor" },
  { value: "MOBILE_CRANE", label: "Mobile Crane" },
  { value: "GANTRY_CRANE", label: "Gantry Crane" },
  { value: "TRUCK", label: "Truck" },
  { value: "TRAILER", label: "Trailer" },
  { value: "OTHER", label: "Other" },
];

const equipmentStatuses: { value: EquipmentStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OUT_OF_SERVICE", label: "Out of Service" },
];

const typeLabels: Record<EquipmentType, string> = {
  REACH_STACKER: "Reach Stacker",
  FORKLIFT: "Forklift",
  TERMINAL_TRACTOR: "Terminal Tractor",
  MOBILE_CRANE: "Mobile Crane",
  GANTRY_CRANE: "Gantry Crane",
  TRUCK: "Truck",
  TRAILER: "Trailer",
  OTHER: "Other",
};

const statusLabels: Record<EquipmentStatus, string> = {
  AVAILABLE: "Available",
  IN_USE: "In Use",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Out of Service",
};

const normaliseType = (value: unknown): EquipmentType => {
  const type = String(value ?? "OTHER")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return equipmentTypes.some((item) => item.value === type)
    ? (type as EquipmentType)
    : "OTHER";
};

const normaliseStatus = (value: unknown): EquipmentStatus => {
  const status = String(value ?? "AVAILABLE")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return equipmentStatuses.some((item) => item.value === status)
    ? (status as EquipmentStatus)
    : "AVAILABLE";
};

const normaliseEquipment = (raw: any): Equipment => ({
  id: String(raw?.id ?? raw?.equipment_id ?? ""),
  equipment_name: String(
    raw?.equipment_name ?? raw?.name ?? raw?.equipmentName ?? ""
  ),
  equipment_code: String(
    raw?.equipment_code ?? raw?.code ?? raw?.equipmentCode ?? ""
  ),
  equipment_type: normaliseType(
    raw?.equipment_type ?? raw?.type ?? raw?.equipmentType
  ),
  registration_number: String(
    raw?.registration_number ??
      raw?.registration_no ??
      raw?.plate_number ??
      raw?.registrationNumber ??
      ""
  ),
  capacity:
    raw?.capacity === null ||
    raw?.capacity === undefined ||
    raw?.capacity === ""
      ? null
      : Number(raw.capacity),
  capacity_unit: String(
    raw?.capacity_unit ?? raw?.capacityUnit ?? "TONNES"
  ),
  operational_status: normaliseStatus(
    raw?.operational_status ?? raw?.status ?? raw?.operationalStatus
  ),
  description: String(raw?.description ?? ""),
  is_active:
    raw?.is_active === undefined && raw?.isActive === undefined
      ? true
      : Boolean(raw?.is_active ?? raw?.isActive),
  created_at: raw?.created_at ?? raw?.createdAt,
  updated_at: raw?.updated_at ?? raw?.updatedAt,
});

const getEquipmentFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.equipment)) return payload.equipment;
  if (Array.isArray(payload?.equipments)) return payload.equipments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.equipment)) return payload.data.equipment;
  if (Array.isArray(payload?.data?.equipments)) return payload.data.equipments;
  if (Array.isArray(payload?.code)) return payload.code;
  if (Array.isArray(payload?.code?.equipment)) return payload.code.equipment;
  if (Array.isArray(payload?.code?.equipments)) return payload.code.equipments;
  if (Array.isArray(payload?.code?.data)) return payload.code.data;
  return [];
};

const getStatusTone = (status: EquipmentStatus) => {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "IN_USE":
      return "info";
    case "MAINTENANCE":
      return "warning";
    case "OUT_OF_SERVICE":
      return "danger";
    default:
      return "default";
  }
};

const getEquipmentIcon = (type: EquipmentType) => {
  switch (type) {
    case "REACH_STACKER":
    case "FORKLIFT":
    case "GANTRY_CRANE":
    case "MOBILE_CRANE":
      return Forklift;
    case "TERMINAL_TRACTOR":
    case "TRUCK":
    case "TRAILER":
      return Truck;
    default:
      return Settings2;
  }
};

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  detail: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {value}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{detail}</p>
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            tone === "success"
              ? "bg-emerald-500/10 text-emerald-700"
              : tone === "warning"
                ? "bg-amber-500/10 text-amber-700"
                : "bg-orange/10 text-orange"
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminEquipmentConfigurationPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<Equipment>(emptyEquipment);
  const [changeReason, setChangeReason] = useState("");

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await http.get("/admin/config/equipment/");
      const resp: Resp = res.data;

      if (resp.error) {
        setError(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load equipment."
        );
        return;
      }

      const responsePayload: any = resp.code ?? resp.data ?? res.data;
      setEquipment(getEquipmentFromResponse(responsePayload).map(normaliseEquipment));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.data ||
          "Could not load equipment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEquipment();
  }, [fetchEquipment]);

  const activeCount = equipment.filter((item) => item.is_active).length;
  const inactiveCount = equipment.length - activeCount;
  const availableCount = equipment.filter(
    (item) => item.operational_status === "AVAILABLE" && item.is_active
  ).length;
  const maintenanceCount = equipment.filter(
    (item) => item.operational_status === "MAINTENANCE"
  ).length;

  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        !query ||
        item.equipment_name.toLowerCase().includes(query) ||
        item.equipment_code.toLowerCase().includes(query) ||
        item.registration_number.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        typeLabels[item.equipment_type].toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" || item.equipment_type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.operational_status === statusFilter;

      const matchesActive =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && item.is_active) ||
        (activeFilter === "INACTIVE" && !item.is_active);

      return matchesSearch && matchesType && matchesStatus && matchesActive;
    });
  }, [equipment, search, typeFilter, statusFilter, activeFilter]);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyEquipment);
    setChangeReason("");
    setView("form");
  };

  const openEdit = (item: Equipment) => {
    setEditingId(item.id);
    setForm({ ...item });
    setChangeReason("");
    setView("form");
  };

  const closeEditor = () => {
    if (saving) return;
    setView("list");
    setEditingId("");
    setForm(emptyEquipment);
    setChangeReason("");
  };

  const updateForm = <K extends keyof Equipment>(
    key: K,
    value: Equipment[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const validate = () => {
    if (!form.equipment_name.trim()) {
      toast.error("Enter an equipment name.");
      return false;
    }

    if (!form.equipment_code.trim()) {
      toast.error("Enter an equipment code.");
      return false;
    }

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(form.equipment_code.trim())) {
      toast.error(
        "Use only letters, numbers, hyphens and underscores in the equipment code."
      );
      return false;
    }

    const duplicate = equipment.some(
      (item) =>
        item.equipment_code.toLowerCase() ===
          form.equipment_code.trim().toLowerCase() &&
        item.id !== editingId
    );

    if (duplicate) {
      toast.error("An equipment record with this code already exists.");
      return false;
    }

    if (
      form.capacity !== null &&
      (!Number.isFinite(form.capacity) || form.capacity < 0)
    ) {
      toast.error("Capacity must be a valid non-negative number.");
      return false;
    }

    if (editingId && !changeReason.trim()) {
      toast.error("Enter a reason for this configuration change.");
      return false;
    }

    if (changeReason.trim().length > 500) {
      toast.error("The change reason cannot exceed 500 characters.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;

    const payload: EquipmentPayload = {
      ...(editingId ? { id: editingId } : {}),
      equipment_name: form.equipment_name.trim(),
      equipment_code: form.equipment_code.trim().toUpperCase(),
      equipment_type: form.equipment_type,
      registration_number: form.registration_number.trim().toUpperCase(),
      capacity: form.capacity,
      capacity_unit: form.capacity_unit,
      operational_status: form.operational_status,
      description: form.description.trim(),
      is_active: form.is_active,
      change_reason: changeReason.trim(),
    };

    setSaving(true);

    try {
      const res = await http.post(
        "admin/config/equipment/update/",
        payload
      );
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not save the equipment."
        );
        return;
      }

      toast.success(
        editingId
          ? "Equipment updated successfully."
          : "Equipment created successfully."
      );

      setView("list");
      setEditingId("");
      setForm(emptyEquipment);
      setChangeReason("");
      await fetchEquipment();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.data ||
          "Could not save the equipment."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25";

  return (
    <AppShell title="Equipment Management" eyebrow="Administration · Configuration">
      <div className="relative min-h-[80vh]">
        <AnimatePresence mode="wait" initial={false}>
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ x: "-30%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-30%", opacity: 0, position: "absolute" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full space-y-6 pb-12"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                    Equipment configuration
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
                    Equipment Management
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                    Register and manage the equipment used for cargo handling,
                    terminal movement and daily operations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchEquipment()}
                    disabled={loading}
                    className="gap-2 border-line bg-paper text-ink hover:bg-sand"
                  >
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    onClick={openCreate}
                    className="gap-2 bg-orange text-white hover:bg-orange-deep"
                  >
                    <CirclePlus className="size-4" />
                    Add equipment
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-carmine/20 bg-carmine/5 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-carmine" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      Could not refresh equipment
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{error}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total equipment"
                  value={equipment.length}
                  icon={Truck}
                  detail="All registered equipment"
                />
                <StatCard
                  label="Available"
                  value={availableCount}
                  icon={CheckCircle2}
                  detail="Ready for assignment"
                  tone="success"
                />
                <StatCard
                  label="Under maintenance"
                  value={maintenanceCount}
                  icon={Wrench}
                  detail="Currently being serviced"
                  tone="warning"
                />
                <StatCard
                  label="Inactive records"
                  value={inactiveCount}
                  icon={Activity}
                  detail={`${activeCount} active records`}
                />
              </div>

              <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_210px_170px]">
                  <label className="relative block">
                    <span className="sr-only">Search equipment</span>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, code or registration..."
                      className="h-11 border-line bg-sand pl-10 text-ink focus:ring-orange/30"
                    />
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-11 rounded-xl border border-line bg-sand px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-orange/30"
                  >
                    <option value="ALL">All equipment types</option>
                    {equipmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-11 rounded-xl border border-line bg-sand px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-orange/30"
                  >
                    <option value="ALL">All operational statuses</option>
                    {equipmentStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={activeFilter}
                    onChange={(event) => setActiveFilter(event.target.value)}
                    className="h-11 rounded-xl border border-line bg-sand px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-orange/30"
                  >
                    <option value="ALL">All records</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                <div className="flex flex-col justify-between gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-ink">Registered equipment</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      {filteredEquipment.length} of {equipment.length} equipment records
                    </p>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Select a record to update its configuration
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-ink-soft">
                    <RefreshCw className="size-4 animate-spin text-orange" />
                    Loading equipment...
                  </div>
                ) : filteredEquipment.length === 0 ? (
                  <div className="flex flex-col items-center px-5 py-16 text-center">
                    <div className="rounded-2xl bg-sand p-4 text-ink-soft">
                      <Truck className="size-7" />
                    </div>
                    <h3 className="mt-4 font-semibold text-ink">
                      {equipment.length === 0
                        ? "No equipment registered"
                        : "No matching equipment"}
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-ink-soft">
                      {equipment.length === 0
                        ? "Add your first equipment record to make it available for terminal operations."
                        : "Try changing your search or filter selections."}
                    </p>
                    {equipment.length === 0 && (
                      <Button
                        type="button"
                        onClick={openCreate}
                        className="mt-5 gap-2 bg-orange text-white hover:bg-orange-deep"
                      >
                        <CirclePlus className="size-4" />
                        Add equipment
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead className="bg-sand/70">
                        <tr className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          <th className="px-5 py-3 font-semibold">Equipment</th>
                          <th className="px-5 py-3 font-semibold">Type</th>
                          <th className="px-5 py-3 font-semibold">Registration</th>
                          <th className="px-5 py-3 font-semibold">Capacity</th>
                          <th className="px-5 py-3 font-semibold">Operational status</th>
                          <th className="px-5 py-3 font-semibold">Record</th>
                          <th className="px-5 py-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {filteredEquipment.map((item) => {
                          const Icon = getEquipmentIcon(item.equipment_type);

                          return (
                            <tr
                              key={item.id || item.equipment_code}
                              className="transition-colors hover:bg-sand/40"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-orange/10 p-2.5 text-orange">
                                    <Icon className="size-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-ink">
                                      {item.equipment_name}
                                    </p>
                                    <p className="mt-0.5 font-mono text-xs text-ink-soft">
                                      {item.equipment_code}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-ink">
                                {typeLabels[item.equipment_type]}
                              </td>
                              <td className="px-5 py-4 text-sm text-ink">
                                {item.registration_number || "—"}
                              </td>
                              <td className="px-5 py-4 text-sm text-ink">
                                {item.capacity === null
                                  ? "—"
                                  : `${item.capacity.toLocaleString()} ${item.capacity_unit.toLowerCase()}`}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge
                                  label={statusLabels[item.operational_status]}
                                  tone={getStatusTone(item.operational_status)}
                                />
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge
                                  label={item.is_active ? "Active" : "Inactive"}
                                  tone={item.is_active ? "success" : "muted"}
                                />
                              </td>
                              <td className="px-5 py-4 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEdit(item)}
                                  className="gap-2 border-line bg-paper text-ink hover:bg-sand"
                                >
                                  <Edit3 className="size-3.5" />
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "form" && (
            <motion.div
              key="form"
              initial={{ x: "30%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "30%", opacity: 0, position: "absolute" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full space-y-6 pb-12"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={closeEditor}
                    disabled={saving}
                    className="border-line bg-paper text-ink hover:bg-sand"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                      Equipment configuration
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                      {editingId ? "Update equipment" : "Register equipment"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingId && (
                    <StatusBadge
                      label={form.is_active ? "Active record" : "Inactive record"}
                      tone={form.is_active ? "success" : "muted"}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-semibold text-ink">Equipment details</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Enter the identification details used to recognise this equipment.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-ink">
                          Equipment name <span className="text-carmine">*</span>
                        </span>
                        <Input
                          value={form.equipment_name}
                          onChange={(event) =>
                            updateForm("equipment_name", event.target.value)
                          }
                          placeholder="e.g. Reach Stacker 01"
                          className="mt-1.5 h-11 border-line bg-sand text-ink focus:ring-orange/30"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-ink">
                          Equipment code <span className="text-carmine">*</span>
                        </span>
                        <Input
                          value={form.equipment_code}
                          onChange={(event) =>
                            updateForm("equipment_code", event.target.value.toUpperCase())
                          }
                          placeholder="e.g. RS-001"
                          className="mt-1.5 h-11 border-line bg-sand font-mono text-ink focus:ring-orange/30"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-ink">
                          Equipment type <span className="text-carmine">*</span>
                        </span>
                        <select
                          value={form.equipment_type}
                          onChange={(event) =>
                            updateForm("equipment_type", event.target.value as EquipmentType)
                          }
                          className={selectClass}
                        >
                          {equipmentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-ink">
                          Registration / plate number
                        </span>
                        <Input
                          value={form.registration_number}
                          onChange={(event) =>
                            updateForm("registration_number", event.target.value.toUpperCase())
                          }
                          placeholder="Enter registration number"
                          className="mt-1.5 h-11 border-line bg-sand text-ink focus:ring-orange/30"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                      <h3 className="font-semibold text-ink">Capacity and availability</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Record the equipment capacity and its current operational state.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-medium text-ink">Capacity</span>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={form.capacity ?? ""}
                          onChange={(event) =>
                            updateForm(
                              "capacity",
                              event.target.value === "" ? null : Number(event.target.value)
                            )
                          }
                          placeholder="e.g. 45"
                          className="mt-1.5 h-11 border-line bg-sand text-ink focus:ring-orange/30"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-ink">Capacity unit</span>
                        <select
                          value={form.capacity_unit}
                          onChange={(event) =>
                            updateForm("capacity_unit", event.target.value)
                          }
                          className={selectClass}
                        >
                          <option value="TONNES">Tonnes</option>
                          <option value="KG">Kilograms</option>
                          <option value="TEU">TEU</option>
                          <option value="CONTAINERS">Containers</option>
                          <option value="PALLETS">Pallets</option>
                          <option value="TRIPS">Trips</option>
                        </select>
                      </label>

                      <label className="block sm:col-span-2">
                        <span className="text-sm font-medium text-ink">
                          Operational status
                        </span>
                        <select
                          value={form.operational_status}
                          onChange={(event) =>
                            updateForm(
                              "operational_status",
                              event.target.value as EquipmentStatus
                            )
                          }
                          className={selectClass}
                        >
                          {equipmentStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-ink">Additional information</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Add optional notes to help identify or manage this equipment.
                      </p>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium text-ink">Description</span>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        rows={4}
                        placeholder="Enter equipment description or operating notes..."
                        className="mt-1.5 w-full resize-y rounded-xl border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
                      />
                    </label>

                    {editingId && (
                      <label className="mt-5 block">
                        <span className="text-sm font-medium text-ink">
                          Reason for change <span className="text-carmine">*</span>
                        </span>
                        <textarea
                          value={changeReason}
                          onChange={(event) => setChangeReason(event.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Explain why this equipment configuration is being updated..."
                          className="mt-1.5 w-full resize-y rounded-xl border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
                        />
                        <p className="mt-1 text-right text-xs text-ink-soft">
                          {changeReason.length}/500
                        </p>
                      </label>
                    )}
                  </section>
                </div>

                <aside className="space-y-5">
                  <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-orange/10 p-3 text-orange">
                        {(() => {
                          const Icon = getEquipmentIcon(form.equipment_type);
                          return <Icon className="size-6" />;
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-ink-soft">Equipment preview</p>
                        <p className="truncate font-semibold text-ink">
                          {form.equipment_name || "New equipment"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-soft">Code</span>
                        <span className="font-mono font-medium text-ink">
                          {form.equipment_code || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-soft">Type</span>
                        <span className="text-right font-medium text-ink">
                          {typeLabels[form.equipment_type]}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-soft">Capacity</span>
                        <span className="font-medium text-ink">
                          {form.capacity === null
                            ? "—"
                            : `${form.capacity} ${form.capacity_unit.toLowerCase()}`}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-ink-soft">Status</span>
                        <StatusBadge
                          label={statusLabels[form.operational_status]}
                          tone={getStatusTone(form.operational_status)}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-ink">Record status</h3>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          Inactive equipment cannot be selected for new operational assignments.
                        </p>
                      </div>
                      <Activity className="size-5 text-orange" />
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl bg-sand p-3">
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          Active equipment
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {form.is_active ? "Available for assignment" : "Unavailable for assignment"}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          updateForm("is_active", event.target.checked)
                        }
                        className="size-4 accent-[#FF6600]"
                      />
                    </label>
                  </section>

                  <div className="rounded-2xl border border-orange/20 bg-orange/5 p-4">
                    <div className="flex gap-3">
                      <Clock3 className="mt-0.5 size-5 shrink-0 text-orange" />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Operational availability
                        </p>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          Equipment marked as under maintenance or out of service should not be assigned to container movements.
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="sticky bottom-3 z-10 flex flex-col-reverse justify-end gap-2 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                  disabled={saving}
                  className="border-line bg-paper text-ink hover:bg-sand"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="gap-2 bg-orange text-white hover:bg-orange-deep"
                >
                  {saving ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Register equipment"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
