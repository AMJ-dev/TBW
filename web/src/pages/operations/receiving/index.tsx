import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Container,
  Download,
  Filter,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  Scale,
  Warehouse,
} from "lucide-react";
import {
  AppShell,
  Metric,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {http, type Resp} from "@/lib/httpClient";

type ReceivingStatus = string;

interface ReceivingRecord {
  id: string;
  receiving_reference: string;
  shipment_id: string;
  shipment_reference: string;
  bill_of_lading: string;
  gate_pass_number: string;
  container_no: string;
  seal_number: string;
  observed_seal_number: string;
  shipping_line: string;
  vessel_name: string;
  origin_port: string;
  expected_weight: string | number | null;
  actual_weight: string | number | null;
  receiving_location: string;
  cargo_condition: string;
  discrepancy_notes: string;
  status: ReceivingStatus;
  received_at: string | null;
  created_at: string | null;
}

type StatusFilter =
  | "ALL"
  | "RECEIVED"
  | "PENDING"
  | "PARTIAL"
  | "INSPECTING"
  | "DISCREPANCY"
  | "COMPLETED";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All records", value: "ALL" },
  { label: "Received", value: "RECEIVED" },
  { label: "Pending", value: "PENDING" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Inspecting", value: "INSPECTING" },
  { label: "Discrepancies", value: "DISCREPANCY" },
  { label: "Completed", value: "COMPLETED" },
];

const EMPTY_STATS = {
  total: 0,
  received: 0,
  pending: 0,
  partial: 0,
  discrepancies: 0,
};

const labelClass =
  "font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft";

function getValue(
  record: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return "";
}

function normalizeStatus(value: unknown): ReceivingStatus {
  return String(value ?? "PENDING").trim().toUpperCase();
}

function normalizeRecord(value: unknown): ReceivingRecord {
  const record: Record<string, unknown> =
    value !== null && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    id: getValue(record, "id", "receiving_id"),
    receiving_reference: getValue(
      record,
      "receiving_reference",
      "reference",
      "reference_number",
    ),
    shipment_id: getValue(record, "shipment_id"),
    shipment_reference: getValue(
      record,
      "shipment_reference",
      "shipment_ref",
    ),
    bill_of_lading: getValue(
      record,
      "bill_of_lading",
      "bill_of_lading_number",
      "bl_number",
    ),
    gate_pass_number: getValue(
      record,
      "gate_pass_number",
      "gate_pass",
      "gate_pass_reference",
    ),
    container_no: getValue(
      record,
      "container_no",
      "container_number",
      "containerNo",
    ),
    seal_number: getValue(record, "seal_number", "seal_no", "sealNo"),
    observed_seal_number: getValue(
      record,
      "observed_seal_number",
      "observed_seal",
    ),
    shipping_line: getValue(
      record,
      "shipping_line",
      "carrier_name",
      "shippingLine",
    ),
    vessel_name: getValue(record, "vessel_name", "vessel"),
    origin_port: getValue(
      record,
      "origin_port",
      "port_of_origin",
      "originPort",
    ),
    expected_weight:
      (record["expected_weight"] as
        | string
        | number
        | null
        | undefined) ??
      (record["gross_weight"] as
        | string
        | number
        | null
        | undefined) ??
      null,
    actual_weight:
      (record["actual_weight"] as
        | string
        | number
        | null
        | undefined) ??
      (record["verified_weight"] as
        | string
        | number
        | null
        | undefined) ??
      null,
    receiving_location: getValue(
      record,
      "receiving_location",
      "receiving_bay",
      "received_bay",
      "receivedBay",
    ),
    cargo_condition: getValue(record, "cargo_condition", "condition"),
    discrepancy_notes: getValue(
      record,
      "discrepancy_notes",
      "discrepancy_reason",
    ),
    status: normalizeStatus(record["status"]),
    received_at:
      getValue(record, "received_at", "received_on", "timestamp") || null,
    created_at: getValue(record, "created_at") || null,
  };
}

function extractRecords(response: unknown): ReceivingRecord[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const root = response as Record<string, unknown>;
  const payload = root["data"] ?? root;

  if (Array.isArray(payload)) {
    return payload.map(normalizeRecord);
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    const keys = [
      "records",
      "receivings",
      "items",
      "results",
      "rows",
      "data",
    ];

    for (const key of keys) {
      const rows = objectPayload[key];

      if (Array.isArray(rows)) {
        return rows.map(normalizeRecord);
      }
    }
  }

  return [];
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeight(value: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 2,
  }).format(numericValue)} kg`;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    RECEIVED: "Received",
    PENDING: "Pending",
    PARTIAL: "Partial",
    INSPECTING: "Inspecting",
    DISCREPANCY: "Discrepancy",
    EXPECTED: "Expected",
    COMPLETED: "Completed",
    CHANGES_REQUESTED: "Changes requested",
    REJECTED: "Rejected",
  };

  return (
    labels[status] ??
    status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getStatusTone(status: string): string {
  if (["RECEIVED", "COMPLETED"].includes(status)) {
    return "success";
  }

  if (["DISCREPANCY", "REJECTED", "FAILED"].includes(status)) {
    return "critical";
  }

  if (
    ["PENDING", "PARTIAL", "EXPECTED", "INSPECTING"].includes(status)
  ) {
    return "warning";
  }

  return statusTone(status);
}

export default function OperationsReceivingRoute() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<ReceivingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const loadRecords = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

        try {
        const response = await http.get("/operator/receiving/");
        const resp: Resp = response.data;

        if (resp.error) {
            throw new Error(String(resp.data || "Could not load receiving records."));
        }

        const result = extractRecords(resp);

        setRecords(result);
        } catch (error: unknown) {
        setError(
            error instanceof Error
            ? error.message
            : "Could not load receiving records.",
        );
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const stats = useMemo(() => {
    return records.reduce(
      (result, record) => {
        const status = normalizeStatus(record.status);

        result.total += 1;

        if (["RECEIVED", "COMPLETED"].includes(status)) {
          result.received += 1;
        }

        if (["PENDING", "EXPECTED"].includes(status)) {
          result.pending += 1;
        }

        if (status === "PARTIAL") {
          result.partial += 1;
        }

        if (
          ["DISCREPANCY", "REJECTED", "FAILED"].includes(status) ||
          Boolean(record.discrepancy_notes.trim())
        ) {
          result.discrepancies += 1;
        }

        return result;
      },
      { ...EMPTY_STATS },
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((record) => {
      const searchableValues = [
        record.receiving_reference,
        record.shipment_reference,
        record.bill_of_lading,
        record.gate_pass_number,
        record.container_no,
        record.seal_number,
        record.observed_seal_number,
        record.shipping_line,
        record.vessel_name,
        record.origin_port,
        record.receiving_location,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(query),
        );

      const status = normalizeStatus(record.status);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter ||
        (statusFilter === "RECEIVED" && status === "COMPLETED");

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / pageSize),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const exportRecords = () => {
    if (!filteredRecords.length) return;

    const columns: (keyof ReceivingRecord)[] = [
      "receiving_reference",
      "shipment_reference",
      "bill_of_lading",
      "gate_pass_number",
      "container_no",
      "seal_number",
      "observed_seal_number",
      "shipping_line",
      "vessel_name",
      "origin_port",
      "expected_weight",
      "actual_weight",
      "receiving_location",
      "cargo_condition",
      "status",
      "discrepancy_notes",
      "received_at",
    ];

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.join(","),
      ...filteredRecords.map((record) =>
        columns
          .map((column) => escapeCsv(record[column]))
          .join(","),
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `receiving-register-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Cargo Receiving"
      eyebrow="Operations · Inbound Terminal"
    >
      <div className="space-y-6 pb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className={labelClass}>
              Inbound operations / Receiving register
            </p>

            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Cargo receiving
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Verify arriving cargo against existing shipment declarations
              and gate records. Record container condition, seal details,
              actual weight and receiving location.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadRecords(true)}
              disabled={loading || refreshing}
              className="border-line bg-paper text-ink hover:bg-sand"
            >
              {refreshing ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={exportRecords}
              disabled={!filteredRecords.length}
              className="border-line bg-paper text-ink hover:bg-sand"
            >
              <Download className="size-4" />
              Export CSV
            </Button>

            <Button
              type="button"
              onClick={() => navigate("/operations/receiving/new")}
              className="bg-ink text-sand hover:bg-ink/90"
            >
              <PackageCheck className="size-4" />
              New Receiving
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Total receiving records"
            value={String(stats.total)}
            detail="Records returned by the server"
            icon={ClipboardList}
          />

          <Metric
            label="Received"
            value={String(stats.received)}
            detail="Marked received or completed"
            tone="success"
            icon={CheckCircle2}
          />

          <Metric
            label="Pending / partial"
            value={String(stats.pending + stats.partial)}
            detail={`${stats.pending} pending · ${stats.partial} partial`}
            tone="warning"
            icon={Container}
          />

          <Metric
            label="Discrepancies"
            value={String(stats.discrepancies)}
            detail="Records requiring attention"
            tone={stats.discrepancies > 0 ? "critical" : "neutral"}
            icon={AlertTriangle}
          />
        </div>

        <section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
          <div className="border-b border-line p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  Receiving register
                </h2>

                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Search and review physical cargo receiving records.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 sm:w-80">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Shipment, B/L, gate pass, container..."
                    className="h-10 border-line bg-sand pl-9 text-sm text-ink placeholder:text-ink-soft"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="h-10 w-full appearance-none rounded-md border border-line bg-sand pl-9 pr-9 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/10 sm:w-48"
                    aria-label="Filter receiving status"
                  >
                    {STATUS_FILTERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-4 flex flex-col gap-3 rounded-lg border border-coral/30 bg-coral/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-coral" />

                <div>
                  <p className="text-sm font-semibold text-ink">
                    Could not load receiving records
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-ink-soft">
                    {error}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void loadRecords(true)}
                className="border-line bg-paper text-ink hover:bg-sand"
              >
                Try again
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <LoaderCircle className="size-7 animate-spin text-ink-soft" />

              <p className="mt-4 text-sm font-medium text-ink">
                Loading receiving records
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                Retrieving the latest records from the server.
              </p>
            </div>
          ) : !error && filteredRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-sand">
                <Warehouse className="size-6 text-ink-soft" />
              </div>

              <h3 className="mt-4 font-display text-base font-bold text-ink">
                {records.length === 0
                  ? "No receiving records found"
                  : "No matching records"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
                {records.length === 0
                  ? "Receiving records will appear here after they are recorded and returned by the receiving API."
                  : "Try another search term or change the selected status filter."}
              </p>

              {records.length === 0 && (
                <Button
                  type="button"
                  onClick={() => navigate("/operations/receiving/new")}
                  className="mt-4 bg-ink text-sand hover:bg-ink/90"
                >
                  <PackageCheck className="size-4" />
                  New Receiving
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sand/40">
                      <th className="px-4 py-3">
                        <span className={labelClass}>Receiving ref.</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Shipment / B/L</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Container / seal</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Gate pass</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Weight</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Receiving location</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Condition</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Status</span>
                      </th>

                      <th className="px-4 py-3">
                        <span className={labelClass}>Received at</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line">
                    {paginatedRecords.map((record, index) => {
                      const status = normalizeStatus(record.status);

                      return (
                        <tr
                          key={
                            record.id ||
                            record.receiving_reference ||
                            `${record.container_no}-${index}`
                          }
                          className="transition-colors hover:bg-sand/40"
                        >
                          <td className="px-4 py-4">
                            <p className="font-mono text-xs font-semibold text-ink">
                              {record.receiving_reference || "—"}
                            </p>

                            {record.id && (
                              <p className="mt-1 max-w-32 truncate font-mono text-[10px] text-ink-soft">
                                {record.id}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-mono text-xs font-semibold text-ink">
                              {record.shipment_reference || "—"}
                            </p>

                            <p className="mt-1 text-xs text-ink-soft">
                              B/L: {record.bill_of_lading || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-mono text-xs font-semibold text-ink">
                              {record.container_no || "—"}
                            </p>

                            <p className="mt-1 text-xs text-ink-soft">
                              Seal:{" "}
                              {record.observed_seal_number ||
                                record.seal_number ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-mono text-xs text-ink">
                              {record.gate_pass_number || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-mono text-xs text-ink">
                              {formatWeight(record.actual_weight)}
                            </p>

                            {record.expected_weight !== null && (
                              <p className="mt-1 text-[10px] text-ink-soft">
                                Expected: {formatWeight(record.expected_weight)}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="flex items-center gap-2 text-xs text-ink">
                              <Warehouse className="size-3.5 shrink-0 text-ink-soft" />
                              {record.receiving_location || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-xs text-ink">
                              {record.cargo_condition || "—"}
                            </span>

                            {record.discrepancy_notes && (
                              <p
                                className="mt-1 max-w-40 truncate text-[10px] text-coral"
                                title={record.discrepancy_notes}
                              >
                                {record.discrepancy_notes}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge
                              label={statusLabel(status)}
                              tone={getStatusTone(status)}
                            />
                          </td>

                          <td className="px-4 py-4">
                            <span className="whitespace-nowrap text-xs text-ink-soft">
                              {formatDate(
                                record.received_at ?? record.created_at,
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-soft">
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {filteredRecords.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                    {"–"}
                    {Math.min(
                      currentPage * pageSize,
                      filteredRecords.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-ink">
                    {filteredRecords.length}
                  </span>{" "}
                  receiving records
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setPage((value) => Math.max(1, value - 1))
                    }
                    className="border-line bg-paper text-ink hover:bg-sand"
                  >
                    Previous
                  </Button>

                  <span className="min-w-20 text-center font-mono text-xs text-ink-soft">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) =>
                        Math.min(totalPages, value + 1),
                      )
                    }
                    className="border-line bg-paper text-ink hover:bg-sand"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl bg-paper p-4 ring-1 ring-line sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sand">
              <Scale className="size-5 text-ink-soft" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-ink">
                Receiving control
              </h2>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-ink-soft">
                Record receiving against an existing shipment and an eligible
                gate-in container. Verify the observed seal, cargo condition,
                actual weight and assigned receiving location. Record
                discrepancies for review instead of creating a duplicate
                shipment or manifest.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}