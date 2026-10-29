import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Edit3,
  Layers3,
  MapPin,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type LocationType = "YARD" | "WAREHOUSE" | "INSPECTION_BAY";

interface TerminalLocation {
  id: string;
  location_name: string;
  location_code: string;
  location_type: LocationType;
  parent_location_id: string;
  capacity: number | null;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LocationPayload {
  id?: string;
  location_name: string;
  location_code: string;
  location_type: LocationType;
  parent_location_id: string | null;
  capacity: number | null;
  description: string;
  is_active: boolean;
  change_reason: string;
}

const emptyLocation: TerminalLocation = {
  id: "",
  location_name: "",
  location_code: "",
  location_type: "YARD",
  parent_location_id: "",
  capacity: null,
  description: "",
  is_active: true,
};

const locationTypes: { value: LocationType; label: string }[] = [
  { value: "YARD", label: "Yard" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "INSPECTION_BAY", label: "Inspection Bay" },
];

const locationTypeLabels: Record<LocationType, string> = {
  YARD: "Yard",
  WAREHOUSE: "Warehouse",
  INSPECTION_BAY: "Inspection Bay",
};

const normaliseLocationType = (value: unknown): LocationType => {
  const normalised = String(value ?? "YARD")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return locationTypes.some((item) => item.value === normalised)
    ? (normalised as LocationType)
    : "YARD";
};

const normaliseLocation = (raw: any): TerminalLocation => ({
  id: String(raw?.id ?? raw?.location_id ?? ""),
  location_name: String(
    raw?.location_name ?? raw?.name ?? raw?.locationName ?? ""
  ),
  location_code: String(
    raw?.location_code ?? raw?.code ?? raw?.locationCode ?? ""
  ),
  location_type: normaliseLocationType(
    raw?.location_type ?? raw?.type ?? raw?.locationType
  ),
  parent_location_id: String(
    raw?.parent_location_id ??
      raw?.parent_id ??
      raw?.parentLocationId ??
      ""
  ),
  capacity:
    raw?.capacity === null ||
    raw?.capacity === undefined ||
    raw?.capacity === ""
      ? null
      : Number(raw.capacity),
  description: String(raw?.description ?? ""),
  is_active:
    raw?.is_active === undefined && raw?.isActive === undefined
      ? true
      : Boolean(raw?.is_active ?? raw?.isActive),
  created_at: raw?.created_at ?? raw?.createdAt,
  updated_at: raw?.updated_at ?? raw?.updatedAt,
});

const getLocationsFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.locations)) return payload.locations;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.locations)) return payload.data.locations;
  if (Array.isArray(payload?.code)) return payload.code;
  if (Array.isArray(payload?.code?.locations)) return payload.code.locations;
  if (Array.isArray(payload?.code?.data)) return payload.code.data;
  return [];
};

const getTypeIcon = (type: LocationType) => {
  switch (type) {
    case "YARD":
      return Boxes;
    case "WAREHOUSE":
      return Warehouse;
    case "INSPECTION_BAY":
      return ShieldCheck;
    default:
      return MapPin;
  }
};

export default function AdminLocationsConfigurationPage() {
  const [locations, setLocations] = useState<TerminalLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<TerminalLocation>(emptyLocation);
  const [changeReason, setChangeReason] = useState("");

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await http.get("/admin/config/locations/");
      const resp: Resp = res.data;

      if (resp.error) {
        setError(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load terminal locations."
        );
        return;
      }

      const payload: any = resp.code ?? resp.data ?? res.data;
      const rows = getLocationsFromResponse(payload);

      setLocations(rows.map(normaliseLocation));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.data ||
          "Could not load terminal locations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const activeCount = locations.filter((item) => item.is_active).length;
  const inactiveCount = locations.length - activeCount;

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        !query ||
        location.location_name.toLowerCase().includes(query) ||
        location.location_code.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query) ||
        locationTypeLabels[location.location_type].toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" || location.location_type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && location.is_active) ||
        (statusFilter === "INACTIVE" && !location.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [locations, search, typeFilter, statusFilter]);

  const parentOptions = useMemo(
    () =>
      locations.filter(
        (location) =>
          location.is_active &&
          location.id !== editingId &&
          location.location_type === form.location_type
      ),
    [locations, editingId, form.location_type]
  );

  const openCreate = () => {
    setEditingId("");
    setForm(emptyLocation);
    setChangeReason("");
    setView("form");
  };

  const openEdit = (location: TerminalLocation) => {
    setEditingId(location.id);
    setForm({ ...location });
    setChangeReason("");
    setView("form");
  };

  const closeEditor = () => {
    if (saving) return;
    setView("list");
    setEditingId("");
    setForm(emptyLocation);
    setChangeReason("");
  };

  const updateForm = <K extends keyof TerminalLocation>(
    key: K,
    value: TerminalLocation[K]
  ) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      
      if (key === "location_type") {
        const isValidParent = locations.some(
          (loc) => loc.id === next.parent_location_id && loc.location_type === value
        );
        if (!isValidParent) {
          next.parent_location_id = "";
        }
      }
      
      return next;
    });
  };

  const validate = () => {
    if (!form.location_name.trim()) {
      toast.error("Enter a location name.");
      return false;
    }

    if (!form.location_code.trim()) {
      toast.error("Enter a location code.");
      return false;
    }

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(form.location_code.trim())) {
      toast.error(
        "Use only letters, numbers, hyphens and underscores in the location code."
      );
      return false;
    }

    const duplicate = locations.some(
      (location) =>
        location.location_code.toLowerCase() ===
          form.location_code.trim().toLowerCase() &&
        location.id !== editingId
    );

    if (duplicate) {
      toast.error("A location with this code already exists.");
      return false;
    }

    if (form.parent_location_id && form.parent_location_id === editingId) {
      toast.error("A location cannot be its own parent.");
      return false;
    }

    if (
      form.capacity !== null &&
      (!Number.isFinite(form.capacity) ||
        form.capacity < 0 ||
        !Number.isInteger(form.capacity))
    ) {
      toast.error("Capacity must be a non-negative whole number.");
      return false;
    }

    // Only validate change reason when editing
    if (editingId) {
      if (!changeReason.trim()) {
        toast.error("Enter a reason for this configuration change.");
        return false;
      }

      if (changeReason.trim().length > 500) {
        toast.error("The change reason cannot exceed 500 characters.");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;

    const payload: LocationPayload = {
      ...(editingId ? { id: editingId } : {}),
      location_name: form.location_name.trim(),
      location_code: form.location_code.trim().toUpperCase(),
      location_type: form.location_type,
      parent_location_id: form.parent_location_id || null,
      capacity: form.capacity,
      description: form.description.trim(),
      is_active: form.is_active,
      change_reason: changeReason.trim(),
    };

    setSaving(true);

    try {
      const res = await http.post("admin/config/location/update/", payload);
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not save the location."
        );
        return;
      }

      toast.success(
        editingId
          ? "Location updated successfully."
          : "Location created successfully."
      );

      setView("list");
      setEditingId("");
      setForm(emptyLocation);
      setChangeReason("");

      await fetchLocations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.data ||
          "Could not save the location."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25";

  return (
    <AppShell
      title="Terminal Locations"
      eyebrow="Administration · Configuration"
    >
      <div className="relative min-h-[80vh]">
        <AnimatePresence mode="wait" initial={false}>
          
          {/* LIST VIEW */}
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
                    Facility configuration
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
                    Terminal Locations
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                    Configure the yards, warehouses, and inspection areas used by terminal operations.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchLocations()}
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
                    Add location
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-carmine/20 bg-carmine/5 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-carmine" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      Could not refresh locations
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-soft">{error}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total locations"
                  value={locations.length}
                  icon={MapPin}
                  detail="All configured locations"
                  tone="default"
                />
                <StatCard
                  label="Active locations"
                  value={activeCount}
                  icon={CheckCircle2}
                  detail="Available for operations"
                  tone="success"
                />
                <StatCard
                  label="Inactive locations"
                  value={inactiveCount}
                  icon={Activity}
                  detail="Unavailable for new assignments"
                  tone="warning"
                />
                <StatCard
                  label="Configured areas"
                  value={locations.length}
                  icon={Layers3}
                  detail="Locations and facility areas"
                  tone="default"
                />
              </div>

              <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
                  <label className="relative block">
                    <span className="sr-only">Search locations</span>
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name, code or description..."
                      className="h-11 border-line bg-sand pl-10 text-ink focus:ring-orange/30"
                    />
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-11 rounded-xl border border-line bg-sand px-3 text-sm font-medium text-ink outline-none focus:ring-2 focus:ring-orange/30"
                  >
                    <option value="ALL">All location types</option>
                    {locationTypes.map((type) => (
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
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                  <p className="text-xs text-ink-soft">
                    Showing{" "}
                    <span className="font-semibold text-ink">
                      {filteredLocations.length}
                    </span>{" "}
                    of {locations.length} locations
                  </p>
                  {(search || typeFilter !== "ALL" || statusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setTypeFilter("ALL");
                        setStatusFilter("ALL");
                      }}
                      className="text-xs font-semibold text-orange-deep hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                {loading && locations.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-ink-soft">
                      <span className="size-5 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
                      Loading terminal locations...
                    </div>
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sand text-ink-soft">
                      <MapPin className="size-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-ink">
                      {locations.length === 0
                        ? "No locations configured"
                        : "No matching locations"}
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
                      {locations.length === 0
                        ? "Add your terminal's yards, warehouses and inspection areas to get started."
                        : "Try a different search term or change the filters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead>
                        <tr className="border-b border-line bg-sand/40">
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Location
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Type
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Parent
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Capacity
                          </th>
                          <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {filteredLocations.map((location) => {
                          const Icon = getTypeIcon(location.location_type);
                          const parent = locations.find(
                            (item) => item.id === location.parent_location_id
                          );

                          return (
                            <tr
                              key={location.id || location.location_code}
                              className="group transition-colors hover:bg-sand/30"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep ring-1 ring-orange/20 transition group-hover:bg-orange group-hover:text-white">
                                    <Icon className="size-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-ink">
                                      {location.location_name || "Unnamed location"}
                                    </p>
                                    <p className="mt-1 font-mono text-[10px] font-medium tracking-wide text-ink-soft">
                                      {location.location_code || "NO CODE"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink">
                                  {locationTypeLabels[location.location_type]}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-ink-soft">
                                {parent?.location_name || "Top-level location"}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm text-ink">
                                  {location.capacity === null
                                    ? "Not set"
                                    : `${location.capacity.toLocaleString()} TEU`}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge
                                  label={location.is_active ? "Active" : "Inactive"}
                                  tone={location.is_active ? "success" : "warning"}
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(location)}
                                  className="h-8 gap-1.5 border-line bg-paper text-xs text-ink opacity-70 transition hover:bg-sand hover:opacity-100"
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
              </section>

              <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-5">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-orange-deep" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Location assignment and storage rules
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    Locations identify where cargo is physically handled or stored.
                    Storage Rules separately control free periods, storage rates and
                    overstay calculations. Deactivating a location should prevent new
                    assignments without erasing historical location records.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* FORM VIEW */}
          {view === "form" && (
            <motion.div
              key="form"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0, position: "absolute" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="mx-auto w-full max-w-3xl space-y-6 pb-12"
            >
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink"
                >
                  <ArrowLeft className="size-4" />
                  Back to Locations
                </button>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                    Facility configuration
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                    {editingId ? "Edit Location" : "Add Location"}
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    {editingId
                      ? "Update the location details and operational availability."
                      : "Configure the location details and operational availability."}
                  </p>
                </div>
              </div>

              <section className="rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-8">
                <h3 className="text-sm font-semibold text-ink">
                  Location information
                </h3>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Names and codes should be clear enough for operators to
                  identify the correct physical area.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Location name" required>
                    <Input
                      value={form.location_name}
                      onChange={(event) =>
                        updateForm("location_name", event.target.value)
                      }
                      placeholder="e.g. Yard A"
                      maxLength={120}
                      className="h-11 border-line bg-sand text-ink"
                    />
                  </Field>

                  <Field label="Location code" required>
                    <Input
                      value={form.location_code}
                      onChange={(event) =>
                        updateForm(
                          "location_code",
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="e.g. YARD-A"
                      maxLength={50}
                      className="h-11 border-line bg-sand font-mono text-ink"
                    />
                  </Field>

                  <Field label="Location type" required>
                    <select
                      value={form.location_type}
                      onChange={(event) =>
                        updateForm(
                          "location_type",
                          event.target.value as LocationType
                        )
                      }
                      className={selectClass}
                    >
                      {locationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Parent location">
                    <select
                      value={form.parent_location_id}
                      onChange={(event) =>
                        updateForm("parent_location_id", event.target.value)
                      }
                      className={selectClass}
                    >
                      <option value="">No parent (top-level)</option>
                      {parentOptions.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.location_name} ({location.location_code})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Capacity (TEU)">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.capacity === null ? "" : String(form.capacity)}
                      onChange={(event) =>
                        updateForm(
                          "capacity",
                          event.target.value === ""
                            ? null
                            : Number(event.target.value)
                        )
                      }
                      placeholder="Leave blank if unlimited or unknown"
                      className="h-11 border-line bg-sand text-ink"
                    />
                  </Field>

                  <Field label="Description" className="sm:col-span-2">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      maxLength={500}
                      rows={3}
                      placeholder="Describe the location and its intended use..."
                      className="mt-1.5 w-full rounded-xl border border-line bg-sand p-4 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
                    />
                    <p className="mt-1 text-right font-mono text-[10px] text-ink-soft">
                      {form.description.length}/500
                    </p>
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-sand/30 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
                        form.is_active
                          ? "bg-teal/10 text-teal-deep ring-teal/20"
                          : "bg-sand-2 text-ink-soft ring-line"
                      )}
                    >
                      {form.is_active ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <Clock3 className="size-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        Location availability
                      </p>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">
                        {form.is_active
                          ? "This location can be selected for new operational assignments."
                          : "This location should not be used for new assignments. Historical records should remain available."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_active}
                    aria-label="Location active status"
                    onClick={() => updateForm("is_active", !form.is_active)}
                    className={cn(
                      "inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                      form.is_active ? "bg-orange" : "bg-sand-2"
                    )}
                  >
                    <span
                      className={cn(
                        "size-5 rounded-full bg-white shadow-sm transition-transform",
                        form.is_active ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </section>

              {/* ONLY SHOW CHANGE REASON WHEN EDITING */}
              {editingId && (
                <section className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
                  <Field label="Reason for configuration change" required>
                    <textarea
                      value={changeReason}
                      onChange={(event) => setChangeReason(event.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Explain why this location is being changed..."
                      className="mt-1.5 w-full rounded-xl border border-line bg-sand p-4 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
                    />
                  </Field>
                  <p className="mt-1 text-right font-mono text-[10px] text-ink-soft">
                    {changeReason.length}/500
                  </p>
                </section>
              )}

              <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 shadow-lg sm:px-6">
                <p className="max-w-xs text-xs leading-5 text-ink-soft">
                  {editingId
                    ? "Changes will apply to the selected location."
                    : "The new location will be added to terminal configuration."}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditor}
                    disabled={saving}
                    className="h-11 border-line bg-paper px-6 text-ink hover:bg-sand"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="h-11 gap-2 bg-orange px-6 text-white hover:bg-orange-deep disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save changes"
                        : "Create location"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof MapPin;
  detail: string;
  tone?: "default" | "success" | "warning";
}) {
  const iconStyles = {
    default: "bg-orange/10 text-orange-deep",
    success: "bg-teal/10 text-teal-deep",
    warning: "bg-coral/10 text-coral",
  };

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {value.toLocaleString("en-NG")}
          </p>
        </div>
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", iconStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">{detail}</p>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold text-ink">
        {label}
        {required && <span className="ml-1 text-carmine">*</span>}
      </span>
      {children}
    </label>
  );
}