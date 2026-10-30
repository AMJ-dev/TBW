
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  GitBranch,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "@/components/router-link";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type LaneDirection = "IN" | "OUT" | "BOTH";
type LaneStatus = "active" | "inactive";

interface GateLane {
  id?: string;
  code: string;
  name: string;
  direction: LaneDirection;
  gate_name: string;
  description: string;
  status: LaneStatus;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      data?: string;
    };
  };
  message?: string;
}

interface ApiPayload {
  gate_lanes?: unknown;
  gateLanes?: unknown;
  lanes?: unknown;
  [key: string]: unknown;
}

const emptyLane: GateLane = {
  code: "",
  name: "",
  direction: "BOTH",
  gate_name: "",
  description: "",
  status: "active",
};

interface RawLane {
  id?: unknown;
  code?: unknown;
  lane_code?: unknown;
  name?: unknown;
  lane_name?: unknown;
  direction?: unknown;
  lane_direction?: unknown;
  gate_name?: unknown;
  gate?: unknown;
  description?: unknown;
  status?: unknown;
}

const normaliseLane = (raw: unknown): GateLane => {
  const lane: RawLane =
    raw !== null && typeof raw === "object"
      ? (raw as RawLane)
      : {};

  const direction = String(
    lane.direction ?? lane.lane_direction ?? "BOTH",
  ).toUpperCase();

  const status = String(lane.status ?? "active").toLowerCase();

  const id =
    lane.id !== undefined &&
    lane.id !== null &&
    String(lane.id).trim()
      ? String(lane.id)
      : undefined;

  return {
    ...(id ? { id } : {}),
    code: String(lane.code ?? lane.lane_code ?? ""),
    name: String(lane.name ?? lane.lane_name ?? ""),
    direction:
      direction === "IN" || direction === "OUT" || direction === "BOTH"
        ? direction
        : "BOTH",
    gate_name: String(lane.gate_name ?? lane.gate ?? ""),
    description: String(lane.description ?? ""),
    status: status === "inactive" ? "inactive" : "active",
  };
};

const extractLanes = (resp: Resp): GateLane[] => {
  const responseCode =
    resp.code !== null &&
    typeof resp.code === "object" &&
    !Array.isArray(resp.code)
      ? (resp.code as ApiPayload)
      : {};

  const responseData =
    resp.data !== null &&
    typeof resp.data === "object" &&
    !Array.isArray(resp.data)
      ? (resp.data as ApiPayload)
      : {};

  const candidates = [
    responseCode.gate_lanes,
    responseCode.gateLanes,
    responseCode.lanes,
    responseData.gate_lanes,
    responseData.gateLanes,
    responseData.lanes,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(normaliseLane);
    }
  }

  return [];
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const apiError = error as ApiError;

  return (
    apiError?.response?.data?.message ||
    apiError?.response?.data?.data ||
    apiError?.message ||
    fallback
  );
};

const directionLabel = (direction: LaneDirection): string => {
  if (direction === "IN") return "Entry only";
  if (direction === "OUT") return "Exit only";
  return "Entry & Exit";
};

const formatCount = (count: number) =>
  count.toLocaleString("en-NG");

export default function AdminGatelaneConfigurationPage() {
  const [lanes, setLanes] = useState<GateLane[]>([]);
  const [form, setForm] = useState<GateLane>({ ...emptyLane });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | LaneStatus
  >("all");
  const [directionFilter, setDirectionFilter] = useState<
    "all" | LaneDirection
  >("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [pendingDeleteLane, setPendingDeleteLane] =
    useState<GateLane | null>(null);
  const [deleteNameConfirmation, setDeleteNameConfirmation] =
    useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await http.get("/admin/config/gate-lanes/");
      const resp: Resp = res.data;

      if (resp.error) {
        setError(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load gate lane configuration.",
        );
        return;
      }

      setLanes(extractLanes(resp));
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "Could not load gate lane configuration.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const filteredLanes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lanes.filter((lane) => {
      const matchesSearch =
        !query ||
        lane.code.toLowerCase().includes(query) ||
        lane.name.toLowerCase().includes(query) ||
        lane.gate_name.toLowerCase().includes(query) ||
        lane.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || lane.status === statusFilter;

      const matchesDirection =
        directionFilter === "all" ||
        lane.direction === directionFilter;

      return matchesSearch && matchesStatus && matchesDirection;
    });
  }, [lanes, search, statusFilter, directionFilter]);

  const activeCount = lanes.filter(
    (lane) => lane.status === "active",
  ).length;

  const inactiveCount = lanes.length - activeCount;

  const entryCount = lanes.filter(
    (lane) => lane.direction === "IN" || lane.direction === "BOTH",
  ).length;

  const exitCount = lanes.filter(
    (lane) => lane.direction === "OUT" || lane.direction === "BOTH",
  ).length;

  const resetForm = () => {
    setForm({ ...emptyLane });
    setEditingId(null);
    setChangeReason("");
    setFormOpen(false);
  };

  const openNewForm = () => {
    setForm({ ...emptyLane });
    setEditingId(null);
    setChangeReason("");
    setFormOpen(true);
  };

  const openEditForm = (lane: GateLane) => {
    if (!lane.id) {
      toast.error(
        "This lane has no database ID. Refresh the list before editing.",
      );
      return;
    }

    setForm({ ...lane });
    setEditingId(lane.id);
    setChangeReason("");
    setFormOpen(true);
  };

  const updateForm = <K extends keyof GateLane>(
    key: K,
    value: GateLane[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!form.code.trim()) {
      toast.error("Lane code is required.");
      return false;
    }

    if (!form.name.trim()) {
      toast.error("Lane name is required.");
      return false;
    }

    const normalisedCode = form.code.trim().toUpperCase();

    const duplicateCode = lanes.some(
      (lane) =>
        lane.id !== editingId &&
        lane.code.trim().toUpperCase() === normalisedCode,
    );

    if (duplicateCode) {
      toast.error("A lane with this code already exists.");
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

  const saveConfiguration = async (
    nextLanes: GateLane[],
    reason?: string,
    deletedIds: string[] = [],
  ): Promise<boolean> => {
    setSaving(true);

    try {
      const formData = new FormData();

      const mappedLanes = nextLanes.map((lane) => ({
        ...(lane.id ? { id: lane.id } : {}),
        code: lane.code.trim().toUpperCase(),
        name: lane.name.trim(),
        direction: lane.direction,
        gate_name: lane.gate_name.trim(),
        description: lane.description.trim(),
        status: lane.status,
        ...(reason?.trim() && lane.id === editingId
          ? { change_reason: reason.trim() }
          : {}),
      }));

      formData.append("gate_lanes", JSON.stringify(mappedLanes));
      formData.append("deleted_ids", JSON.stringify(deletedIds));

      if (reason?.trim()) {
        formData.append("change_reason", reason.trim());
      }

      const res = await http.post(
        "/admin/config/gate-lane/update/",
        formData,
      );

      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not save gate lane configuration.",
        );
        return false;
      }

      return true;
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          "Could not save gate lane configuration.",
        ),
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLane = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (saving || !validateForm()) return;

    const laneToSave: GateLane = {
      ...(editingId ? { id: editingId } : {}),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      direction: form.direction,
      gate_name: form.gate_name.trim(),
      description: form.description.trim(),
      status: form.status,
    };

    const nextLanes = editingId
      ? lanes.map((lane) =>
          lane.id === editingId ? laneToSave : lane,
        )
      : [...lanes, laneToSave];

    const saved = await saveConfiguration(
      nextLanes,
      editingId ? changeReason : undefined,
    );

    if (!saved) return;

    toast.success(
      editingId
        ? "Gate lane updated successfully."
        : "Gate lane created successfully.",
    );

    resetForm();
    await fetchAll();
  };

  const openDeleteDialog = (lane: GateLane) => {
    if (saving) return;

    if (!lane.id) {
      toast.error(
        "This lane has no database ID. Refresh the list before removing it.",
      );
      return;
    }

    setPendingDeleteLane(lane);
    setDeleteNameConfirmation("");
    setDeleteReason("");
  };

  const closeDeleteDialog = () => {
    if (saving) return;

    setPendingDeleteLane(null);
    setDeleteNameConfirmation("");
    setDeleteReason("");
  };

  const handleDeleteLane = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const lane = pendingDeleteLane;

    if (!lane?.id || saving) return;

    const enteredName = deleteNameConfirmation.trim().toLowerCase();
    const expectedName = lane.name.trim().toLowerCase();

    if (enteredName !== expectedName) {
      toast.error("The lane name does not match.");
      return;
    }

    if (!deleteReason.trim()) {
      toast.error("Enter a reason for removing this lane.");
      return;
    }

    if (deleteReason.trim().length > 500) {
      toast.error("The removal reason cannot exceed 500 characters.");
      return;
    }

    const nextLanes = lanes.filter(
      (item) => item.id !== lane.id,
    );

    const saved = await saveConfiguration(
      nextLanes,
      deleteReason.trim(),
      [lane.id],
    );

    if (!saved) return;

    toast.success(`Lane ${lane.code} removed successfully.`);

    setPendingDeleteLane(null);
    setDeleteNameConfirmation("");
    setDeleteReason("");

    await fetchAll();
  };

  if (loading) {
    return (
      <AppShell
        title="Gate Lane Management"
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
        title="Gate Lane Management"
        eyebrow="Administration · Configuration"
      >
        <div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
              <AlertTriangle className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="font-display text-base font-bold text-ink">
                Could not load gate lane configuration
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
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Gate Lane Management"
      eyebrow="Administration · Configuration"
    >
      <div className="space-y-6 pb-8">
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
              Gate Lane Management
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Manage physical gate lanes, movement directions, gate
              assignments, and operational availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void fetchAll()}
              disabled={loading || saving}
              className="border-line text-ink hover:bg-sand"
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>

            <Button
              onClick={openNewForm}
              disabled={saving}
              className="bg-orange text-white hover:bg-orange-deep"
            >
              <Plus className="mr-2 size-4" />
              Add gate lane
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total lanes"
            value={lanes.length}
            description="Configured gate lanes"
            icon={GitBranch}
          />

          <MetricCard
            title="Active lanes"
            value={activeCount}
            description="Currently available for operations"
            icon={CheckCircle2}
          />

          <MetricCard
            title="Entry-capable"
            value={entryCount}
            description="Lanes that permit entry"
            icon={ArrowDownToLine}
          />

          <MetricCard
            title="Exit-capable"
            value={exitCount}
            description={`${formatCount(inactiveCount)} inactive lane${
              inactiveCount === 1 ? "" : "s"
            }`}
            icon={ArrowUpFromLine}
          />
        </div>

        {formOpen && (
          <section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
            <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
                  {editingId ? (
                    <Pencil className="size-5" />
                  ) : (
                    <GitBranch className="size-5" />
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    {editingId ? "Edit gate lane" : "Add gate lane"}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-ink-soft">
                    {editingId
                      ? "Update the selected gate lane configuration."
                      : "Create a gate lane. Its database ID will be generated by the backend."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close form"
                onClick={resetForm}
                disabled={saving}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-sand hover:text-ink disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(event) => void handleSaveLane(event)}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Lane code" required>
                  <Input
                    value={form.code}
                    onChange={(event) =>
                      updateForm("code", event.target.value.toUpperCase())
                    }
                    placeholder="e.g. GATE-IN-01"
                    maxLength={50}
                    required
                    className="border-line focus-visible:ring-orange"
                  />
                </FormField>

                <FormField label="Lane name" required>
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    placeholder="e.g. Main Entry Lane"
                    maxLength={120}
                    required
                    className="border-line focus-visible:ring-orange"
                  />
                </FormField>

                <FormField label="Gate assignment">
                  <Input
                    value={form.gate_name}
                    onChange={(event) =>
                      updateForm("gate_name", event.target.value)
                    }
                    placeholder="e.g. North Gate"
                    maxLength={120}
                    className="border-line focus-visible:ring-orange"
                  />
                </FormField>

                <FormField label="Movement direction" required>
                  <select
                    value={form.direction}
                    onChange={(event) =>
                      updateForm(
                        "direction",
                        event.target.value as LaneDirection,
                      )
                    }
                    className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  >
                    <option value="IN">Entry only</option>
                    <option value="OUT">Exit only</option>
                    <option value="BOTH">Entry and exit</option>
                  </select>
                </FormField>

                <FormField label="Operational status" required>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as LaneStatus,
                      )
                    }
                    className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>

                <FormField label="Description">
                  <Input
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Optional description"
                    maxLength={500}
                    className="border-line focus-visible:ring-orange"
                  />
                </FormField>
              </div>

              {editingId && (
                <section className="rounded-xl bg-sand/50 p-4 ring-1 ring-line">
                  <label className="block">
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      <AlertTriangle className="size-3.5 text-orange" />
                      <strong className="font-semibold text-ink">
                        Change reason
                      </strong>
                      <span className="text-carmine">*</span>
                    </span>

                    <textarea
                      value={changeReason}
                      onChange={(event) =>
                        setChangeReason(event.target.value)
                      }
                      maxLength={500}
                      rows={3}
                      required
                      placeholder="Explain why this gate lane configuration is being changed."
                      className="mt-3 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus-visible:ring-2 focus-visible:ring-orange"
                    />

                    <span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
                      {changeReason.length}/500
                    </span>
                  </label>
                </section>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                  className="border-line text-ink hover:bg-sand"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-orange text-white hover:bg-orange-deep"
                >
                  {saving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {editingId ? "Save changes" : "Create lane"}
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
          <div className="flex flex-col gap-4 border-b border-line p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Gate lane directory
              </h3>
              <p className="mt-1 text-sm leading-5 text-ink-soft">
                Search, inspect, and manage configured entry and exit lanes.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="relative sm:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search lanes..."
                  className="border-line pl-9 focus-visible:ring-orange"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | LaneStatus,
                  )
                }
                aria-label="Filter by status"
                className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={directionFilter}
                onChange={(event) =>
                  setDirectionFilter(
                    event.target.value as "all" | LaneDirection,
                  )
                }
                aria-label="Filter by direction"
                className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <option value="all">All directions</option>
                <option value="IN">Entry only</option>
                <option value="OUT">Exit only</option>
                <option value="BOTH">Entry &amp; exit</option>
              </select>
            </div>
          </div>

          {filteredLanes.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-xl bg-sand text-orange-deep">
                <GitBranch className="size-6" />
              </div>

              <h3 className="mt-4 font-display text-base font-bold text-ink">
                {lanes.length === 0
                  ? "No gate lanes configured"
                  : "No matching gate lanes"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
                {lanes.length === 0
                  ? "Create your first lane to start managing gate movements."
                  : "Try changing the search term or filters."}
              </p>

              {lanes.length === 0 && (
                <Button
                  onClick={openNewForm}
                  className="mt-4 bg-orange text-white hover:bg-orange-deep"
                >
                  <Plus className="mr-2 size-4" />
                  Add first lane
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sand/50">
                    <tr className="border-b border-line">
                      <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:px-6">
                        Lane
                      </th>
                      <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Gate
                      </th>
                      <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Direction
                      </th>
                      <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {filteredLanes.map((lane, index) => (
                      <tr
                        key={lane.id ?? `lane-${index}`}
                        className="transition-colors hover:bg-sand/30"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <p className="font-semibold text-ink">
                            {lane.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] tracking-wide text-ink-soft">
                            {lane.code}
                          </p>
                          {lane.description && (
                            <p className="mt-1 max-w-sm text-xs leading-5 text-ink-soft">
                              {lane.description}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-ink-soft">
                          {lane.gate_name || "Not assigned"}
                        </td>

                        <td className="px-5 py-4">
                          <DirectionBadge direction={lane.direction} />
                        </td>

                        <td className="px-5 py-4">
                          <LaneStatusBadge status={lane.status} />
                        </td>

                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex justify-end gap-1">
                            <ActionButton
                              label="Edit lane"
                              onClick={() => openEditForm(lane)}
                              disabled={saving || !lane.id}
                            >
                              <Pencil className="size-4" />
                            </ActionButton>

                            <ActionButton
                              label="Remove lane"
                              onClick={() => openDeleteDialog(lane)}
                              disabled={saving || !lane.id}
                              danger
                            >
                              <Trash2 className="size-4" />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-line md:hidden">
                {filteredLanes.map((lane, index) => (
                  <article
                    key={lane.id ?? `lane-${index}`}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-ink">
                          {lane.name}
                        </h4>
                        <p className="mt-1 font-mono text-[11px] text-ink-soft">
                          {lane.code}
                        </p>
                        <p className="mt-2 text-sm text-ink-soft">
                          {lane.gate_name || "Not assigned"}
                        </p>
                      </div>

                      <LaneStatusBadge status={lane.status} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <DirectionBadge direction={lane.direction} />

                      <div className="flex gap-1">
                        <ActionButton
                          label="Edit lane"
                          onClick={() => openEditForm(lane)}
                          disabled={saving || !lane.id}
                        >
                          <Pencil className="size-4" />
                        </ActionButton>

                        <ActionButton
                          label="Remove lane"
                          onClick={() => openDeleteDialog(lane)}
                          disabled={saving || !lane.id}
                          danger
                        >
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </div>

                    {lane.description && (
                      <p className="text-sm leading-5 text-ink-soft">
                        {lane.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-sand/30 px-5 py-3 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
              Showing {formatCount(filteredLanes.length)} of{" "}
              {formatCount(lanes.length)} lanes
            </p>

            <p className="text-xs text-ink-soft">
              {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
        </section>
      </div>

      {pendingDeleteLane && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteDialog();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-lane-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-black/10"
          >
            <div className="flex items-start gap-4 border-b border-line p-5 sm:p-6">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-carmine/10 text-carmine">
                <Trash2 className="size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-lane-title"
                  className="font-display text-xl font-bold text-ink"
                >
                  Remove gate lane
                </h2>

                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  This action will permanently remove this lane from the
                  configuration. Confirm the lane details before continuing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={saving}
                aria-label="Close confirmation dialog"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-sand hover:text-ink disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={(event) => void handleDeleteLane(event)}
              className="space-y-5 p-5 sm:p-6"
            >
              <div className="rounded-xl border border-carmine/20 bg-carmine/[0.04] p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-carmine">
                  Lane to be removed
                </p>

                <p className="mt-2 break-words font-display text-lg font-bold text-ink">
                  {pendingDeleteLane.name}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-xs text-ink">
                    {pendingDeleteLane.code}
                  </span>

                  <DirectionBadge direction={pendingDeleteLane.direction} />

                  <LaneStatusBadge status={pendingDeleteLane.status} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delete-lane-name"
                  className="block text-sm font-semibold text-ink"
                >
                  Confirm lane name
                  <span className="ml-1 text-carmine">*</span>
                </label>

                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Type{" "}
                  <span className="font-semibold text-ink">
                    {pendingDeleteLane.name}
                  </span>{" "}
                  to confirm removal.
                </p>

                <Input
                  id="delete-lane-name"
                  autoComplete="off"
                  autoFocus
                  value={deleteNameConfirmation}
                  onChange={(event) =>
                    setDeleteNameConfirmation(event.target.value)
                  }
                  placeholder="Enter the gate lane name"
                  disabled={saving}
                  className="mt-2 border-line focus-visible:ring-carmine"
                />

                {deleteNameConfirmation.length > 0 &&
                  deleteNameConfirmation.trim().toLowerCase() !==
                    pendingDeleteLane.name.trim().toLowerCase() && (
                    <p className="mt-1.5 text-xs text-carmine">
                      The entered name does not match.
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="delete-lane-reason"
                  className="block text-sm font-semibold text-ink"
                >
                  Reason for removal
                  <span className="ml-1 text-carmine">*</span>
                </label>

                <textarea
                  id="delete-lane-reason"
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                  placeholder="Explain why this gate lane is being removed."
                  maxLength={500}
                  rows={3}
                  required
                  disabled={saving}
                  className="mt-2 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus-visible:ring-2 focus-visible:ring-orange disabled:opacity-50"
                />

                <p className="mt-1 text-right font-mono text-[10px] text-ink-soft">
                  {deleteReason.length}/500
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDeleteDialog}
                  disabled={saving}
                  className="border-line text-ink hover:bg-sand"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    saving ||
                    deleteNameConfirmation.trim().toLowerCase() !==
                      pendingDeleteLane.name.trim().toLowerCase() ||
                    !deleteReason.trim()
                  }
                  className="bg-carmine text-white hover:bg-carmine/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}

                  {saving ? "Removing lane..." : "Confirm removal"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof GitBranch;
}) {
  return (
    <section className="rounded-xl bg-paper p-5 ring-1 ring-line">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-soft">{title}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {formatCount(value)}
          </p>
        </div>

        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
          <Icon className="size-5" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-soft">
        {description}
      </p>
    </section>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-carmine">*</span>}
      </span>
      {children}
    </label>
  );
}

function DirectionBadge({
  direction,
}: {
  direction: LaneDirection;
}) {
  const styles: Record<LaneDirection, string> = {
    IN: "border-line bg-sand text-ink",
    OUT: "border-orange/25 bg-orange/10 text-orange-deep",
    BOTH: "border-line bg-paper text-ink-soft",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]",
        styles[direction],
      )}
    >
      {directionLabel(direction)}
    </span>
  );
}

function LaneStatusBadge({
  status,
}: {
  status: LaneStatus;
}) {
  return (
    <StatusBadge
      label={status === "active" ? "Active" : "Inactive"}
      tone={status === "active" ? "success" : "warning"}
    />
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-transparent transition-colors",
        "text-ink-soft hover:border-line hover:bg-sand hover:text-orange-deep",
        "disabled:cursor-not-allowed disabled:opacity-40",
        danger &&
          "hover:border-carmine/20 hover:bg-carmine/5 hover:text-carmine",
      )}
    >
      {children}
    </button>
  );
}