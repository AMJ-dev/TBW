import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Eye,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import {copy_text} from "@/lib/functions"

type GatePass = {
  id: string;
  passCode: string;
  vehicleId: string;
  truckNo: string;
  driver: string;
  driverPhone: string;
  type: string;
  issuedAt: string;
  appointmentDate: string;
  status: string;
  containerNos: string[];
};

function extractList<T>(resp: Resp): T[] {
  const value = resp.code ?? resp.data;

  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;

    for (const key of ["passes", "gate_passes", "results", "items", "data"]) {
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }

  return [];
}

function normalizePass(item: Record<string, unknown>): GatePass {
  type ContainerItem = {
    container_no?: string | number | null;
    containerNo?: string | number | null;
  };

  const rawContainers: unknown =
    item["container_nos"] ?? item["containerNos"] ?? item["containers"] ?? [];

  let containerNos: string[] = [];

  if (Array.isArray(rawContainers)) {
    containerNos = rawContainers
      .map((container: unknown): string => {
        if (typeof container === "string" || typeof container === "number") {
          return String(container).trim();
        }

        if (typeof container === "object" && container !== null) {
          const value = container as ContainerItem;
          return String(value.container_no ?? value.containerNo ?? "").trim();
        }

        return "";
      })
      .filter((value: string) => value !== "");
  } else if (typeof rawContainers === "string") {
    containerNos = rawContainers
      .split(",")
      .map((value: string) => value.trim())
      .filter((value: string) => value !== "");
  }

  const getString = (...values: unknown[]): string => {
    const value = values.find(
      (entry) => entry !== undefined && entry !== null,
    );

    return value === undefined ? "" : String(value);
  };

  return {
    id: getString(item["id"]),
    passCode: getString(item["pass_code"], item["passCode"]),
    vehicleId: getString(item["vehicle_id"], item["vehicleId"]),
    truckNo: getString(
      item["vehicle_plate"],
      item["plate"],
      item["truckNo"],
    ),
    driver: getString(item["driver_name"], item["driver"]),
    driverPhone: getString(item["driver_phone"], item["driverPhone"]),
    type: getString(item["type"], item["pass_type"]) || "Terminal Entry",
    issuedAt: getString(
      item["issued_at"],
      item["created_at"],
      item["issuedAt"],
    ),
    appointmentDate: getString(item["appointment_date"], item["appointmentDate"]),
    status: getString(item["status"]) || "Unknown",
    containerNos,
  };
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
} 

export default function GatePassesRoute() {
  const navigate = useNavigate();
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Retry parameters
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  const fetchPassesWithRetry = useCallback(async (attempt = 1): Promise<void> => {
    try {
      const response = await http.get("gate-passes/");
      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(String(resp.data || "Could not load gate passes."));
      }

      setPasses(
        extractList<Record<string, unknown>>(resp).map(normalizePass),
      );
      setError(null);
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        // Wait before retrying (exponential backoff: 1s, 2s, etc.)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return fetchPassesWithRetry(attempt + 1);
      }
      
      // Max retries reached
      const errorMessage = err?.message || "Could not load gate passes after multiple attempts.";
      setError(errorMessage);
      setPasses([]);
      toast.error(errorMessage);
    }
  }, []);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    await fetchPassesWithRetry(1);
    
    setLoading(false);
  }, [fetchPassesWithRetry]);

  useEffect(() => {
    void loadPasses();
  }, [loadPasses]);

  const filteredPasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return passes.filter((pass) => {
      const matchesQuery =
        !query ||
        [
          pass.passCode,
          pass.truckNo,
          pass.driver,
          pass.driverPhone,
          ...pass.containerNos,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "ALL" ||
        pass.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  }, [passes, searchQuery, statusFilter]);

  const activeCount = passes.filter(
    (pass) => pass.status.toLowerCase() === "active",
  ).length;

  const redeemedCount = passes.filter(
    (pass) => pass.status.toLowerCase() === "redeemed",
  ).length;

  const expiredCount = passes.filter(
    (pass) => pass.status.toLowerCase() === "expired",
  ).length;

  const exportCsv = () => {
    const rows = [
      [
        "Pass Code",
        "Truck Plate",
        "Driver",
        "Driver Phone",
        "Containers",
        "Type",
        "Issued At",
        "Appointment Date",
        "Status",
      ],
      ...filteredPasses.map((pass) => [
        pass.passCode,
        pass.truckNo,
        pass.driver,
        pass.driverPhone,
        pass.containerNos.join("; "),
        pass.type,
        pass.issuedAt,
        pass.appointmentDate,
        pass.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gate-passes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Gate Passes" eyebrow="Gate Control · Security Credentials">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Security control · Gate pass records
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Gate passes & clearances
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Manage passes linked to approved vehicles, assigned drivers and
              shipment containers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-line bg-paper text-ink"
              onClick={exportCsv}
              disabled={loading || filteredPasses.length === 0}
            >
              <Download className="size-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              className="border-line bg-paper text-ink"
              onClick={() => void loadPasses()}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Global Error Banner with Retry */}
        {error && !loading && (
          <div className="rounded-xl border border-carmine/25 bg-carmine/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-carmine" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Failed to synchronise gate passes
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">{error}</p>
                </div>
              </div>
              <Button
                onClick={() => void loadPasses()}
                className="bg-carmine text-white hover:bg-carmine/90"
              >
                <RefreshCw className="mr-2 size-4" />
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Active Passes"
            value={String(activeCount)}
            detail="Based on loaded records"
            tone="success"
            icon={ShieldCheck}
          />
          <Metric
            label="Redeemed"
            value={String(redeemedCount)}
            detail="Passes already used"
            tone="info"
            icon={CheckCircle2}
          />
          <Metric
            label="Expired"
            value={String(expiredCount)}
            detail="Passes no longer valid"
            tone="warning"
            icon={ShieldAlert}
          />
          <Metric
            label="Total Passes"
            value={String(passes.length)}
            detail="Records returned by the API"
            tone="info"
            icon={Ticket}
          />
        </div>

        <section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search pass, plate, driver or container..."
                className="h-10 border-line bg-sand pl-9 text-sm text-ink"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-ink-soft" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-line bg-sand px-3 text-sm text-ink"
              >
                <option value="ALL">All statuses</option>
                <option value="Active">Active</option>
                <option value="Redeemed">Redeemed</option>
                <option value="Revoked">Revoked</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  <th className="px-4 py-3 font-medium">Pass Code</th>
                  <th className="px-4 py-3 font-medium">Truck Plate</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Containers</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Appointment Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center text-ink-soft">
                      <LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />
                      Loading gate passes...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center">
                      <AlertTriangle className="mx-auto mb-2 size-6 text-carmine" />
                      <p className="font-medium text-ink">Data unavailable</p>
                      <p className="mt-1 mb-4 text-xs text-ink-soft">
                        Please check your connection or retry.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => void loadPasses()}
                        className="border-line bg-paper text-ink"
                      >
                        <RefreshCw className="mr-2 size-4" /> Try Again
                      </Button>
                    </td>
                  </tr>
                ) : filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-14 text-center">
                      <Ticket className="mx-auto mb-2 size-6 text-ink-soft" />
                      <p className="font-medium text-ink">No gate passes found</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Try another search or issue a new pass.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((pass) => (
                    <tr key={pass.id} className="transition-colors hover:bg-sand/50">
                      <td className="cursor-pointer px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep" onClick={()=>copy_text(pass.passCode)}>
                        {pass.passCode || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
                        {pass.truckNo || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-ink">
                          {pass.driver || "—"}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {pass.driverPhone}
                        </p>
                      </td>
                      <td className="max-w-[240px] px-4 py-3.5">
                        {pass.containerNos.length ? (
                          <div className="flex flex-wrap gap-1">
                            {pass.containerNos.map((container) => (
                              <span
                                key={container}
                                className="rounded bg-sand px-2 py-1 font-mono text-[10px] text-ink"
                              >
                                {container}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink">
                        {pass.type}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-ink-soft">
                        {formatDate(pass.appointmentDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          label={pass.status}
                          tone={statusTone(pass.status)}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-line bg-paper text-ink"
                          onClick={() => navigate(`/portal/passes/${pass.id}`)}
                        >
                          <Eye className="mr-2 size-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line px-4 py-3 text-xs text-ink-soft">
            Showing {filteredPasses.length} of {passes.length} loaded records
          </div>
        </section>
      </motion.div>
    </AppShell>
  );
}