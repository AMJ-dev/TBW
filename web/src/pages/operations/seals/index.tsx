
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ClipboardCheck,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type SealStatus =
  | "Verified"
  | "Intact"
  | "Pending verification"
  | "Mismatch"
  | "Broken"
  | "Missing";

type SealEvent =
  | "Initial"
  | "Custody change"
  | "Examination preparation"
  | "Return to storage"
  | "Replacement";

interface SealRecord {
  id: string;
  container: string;
  containerRef: string;
  bl: string;
  consignment: string;
  sealNumber: string;
  previousSeal?: string | undefined;
  sealType: string;
  event: SealEvent;
  location: string;
  recordedBy: string;
  recordedAt: string;
  status: SealStatus;
  notes: string;
  hasPhoto: boolean;
}

interface SealApiRecord {
  id: string;
  container_id?: string;
  container_no?: string;
  container_number?: string;
  bill_of_lading?: string;
  shipment_reference?: string;
  seal_number?: string;
  previous_seal_number?: string | null;
  seal_type?: string;
  event_type?: SealEvent;
  location?: string;
  recorded_by?: string;
  recorded_at?: string;
  status?: SealStatus;
  notes?: string | null;
  photo_path?: string | null;
}

const statusFilters: (SealStatus | "all")[] = [
  "all",
  "Verified",
  "Intact",
  "Pending verification",
  "Mismatch",
  "Broken",
  "Missing",
];

export default function OperationsSealsRoute() {
  const navigate = useNavigate();

  const [seals, setSeals] = useState<SealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SealStatus | "all">("all");

  const fetchSeals = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);

      const res = await http.get("/operations/seals/");
      const resp: Resp = res.data;

      if (resp.error) {
        throw new Error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load seal events."
        );
      }

      const responseData = resp.data as
        | SealApiRecord[]
        | {
            records?: SealApiRecord[];
            seals?: SealApiRecord[];
          };

      const records: SealApiRecord[] = Array.isArray(responseData)
        ? responseData
        : responseData?.records ?? responseData?.seals ?? [];

        setSeals(
          records.map((item) => ({
            id: item.id,
            container: item.container_no ?? item.container_number ?? "",
            containerRef: item.container_id ?? "",
            bl: item.bill_of_lading ?? "",
            consignment: item.shipment_reference ?? "",
            sealNumber: item.seal_number ?? "",
            previousSeal: item.previous_seal_number ?? undefined,
            sealType: item.seal_type ?? "",
            event: item.event_type ?? "Initial",
            location: item.location ?? "",
            recordedBy: item.recorded_by ?? "System",
            recordedAt: item.recorded_at
              ? new Date(item.recorded_at).toLocaleString()
              : "",
            status: item.status ?? "Pending verification",
            notes: item.notes ?? "",
            hasPhoto: Boolean(item.photo_path),
          }))
        );
    } catch (error) {
      setLoadError(true);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load seal events."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeals();
  }, [fetchSeals]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return seals.filter((seal) => {
      const matchQuery =
        seal.container.toLowerCase().includes(search) ||
        seal.sealNumber.toLowerCase().includes(search) ||
        seal.bl.toLowerCase().includes(search) ||
        seal.consignment.toLowerCase().includes(search);

      const matchStatus =
        statusFilter === "all" || seal.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [seals, query, statusFilter]);

  const stats = useMemo(() => {
    const total = seals.length;

    const verified = seals.filter(
      (seal) => seal.status === "Verified" || seal.status === "Intact"
    ).length;

    const pending = seals.filter(
      (seal) => seal.status === "Pending verification"
    ).length;

    const issues = seals.filter(
      (seal) =>
        seal.status === "Mismatch" ||
        seal.status === "Broken" ||
        seal.status === "Missing"
    ).length;

    return { total, verified, pending, issues };
  }, [seals]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.error("There are no seal events to export.");
      return;
    }

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      [
        "Container",
        "Bill of Lading",
        "Consignment",
        "Seal Number",
        "Previous Seal",
        "Seal Type",
        "Event",
        "Location",
        "Recorded By",
        "Recorded At",
        "Status",
        "Notes",
      ],
      ...filtered.map((seal) => [
        seal.container,
        seal.bl,
        seal.consignment,
        seal.sealNumber,
        seal.previousSeal ?? "",
        seal.sealType,
        seal.event,
        seal.location,
        seal.recordedBy,
        seal.recordedAt,
        seal.status,
        seal.notes,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `TRINU-Seal-Events-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    anchor.click();
    URL.revokeObjectURL(url);

    toast.success("Seal event log exported.");
  };

  return (
    <AppShell title="Seal management" eyebrow="Operations · Seal & custody">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Terminal operations · Seal integrity
            </p>

            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Seal management & custody records
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Every seal event — initial verification, custody change,
              examination preparation, return to storage, or replacement — is
              recorded with a timestamp, actor, and photograph where applicable.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-line bg-paper text-ink hover:bg-sand"
              onClick={handleExport}
              disabled={loading || loadError}
            >
              <Download className="mr-1.5 size-4" />
              Export log
            </Button>

            <Button
              className="bg-orange text-white hover:bg-orange-deep"
              onClick={() => navigate("/operations/seals/new")}
            >
              <Plus className="mr-1.5 size-4" />
              Record seal event
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Total seal events"
            value={String(stats.total)}
            detail="Recorded seal history"
            tone="info"
            icon={ShieldCheck}
          />

          <Metric
            label="Verified or intact"
            value={String(stats.verified)}
            detail="No exception recorded"
            tone="info"
            icon={ClipboardCheck}
          />

          <Metric
            label="Pending verification"
            value={String(stats.pending)}
            detail="Awaiting verification"
            tone="warning"
            icon={ClipboardCheck}
          />

          <Metric
            label="Flagged issues"
            value={String(stats.issues)}
            detail="Mismatch, broken, or missing"
            tone={stats.issues > 0 ? "critical" : "info"}
            icon={ShieldAlert}
          />
        </div>

        <section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />

              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by container, seal number, BL, or consignment..."
                className="h-10 border-line bg-sand pl-9 text-sm text-ink"
                disabled={loadError}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="size-4 text-ink-soft" />

              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  disabled={loadError}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    statusFilter === status
                      ? "bg-ink text-sand"
                      : "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
                  )}
                >
                  {status === "all" ? "All" : status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="mx-auto size-6 animate-spin text-ink-soft" />
              <p className="mt-3 text-sm text-ink-soft">
                Loading seal events...
              </p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-coral/10">
                <ShieldAlert className="size-6 text-coral" />
              </div>

              <h3 className="mt-4 font-semibold text-ink">
                Unable to load seal events
              </h3>

              <p className="mt-1 max-w-md text-sm text-ink-soft">
                Something went wrong while retrieving the seal history.
                Check your connection and try again.
              </p>

              <Button
                onClick={fetchSeals}
                className="mt-5 bg-orange text-white hover:bg-orange-deep"
              >
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="mx-auto size-7 text-ink-soft" />

              <p className="mt-3 font-medium text-ink">
                No seal events match your filters.
              </p>

              <p className="mt-1 text-xs text-ink-soft">
                Try a different container, seal number, or status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    <th className="px-4 py-3 font-medium">Container</th>
                    <th className="px-4 py-3 font-medium">Seal number</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Recorded by</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line">
                  {filtered.map((seal) => (
                    <tr
                      key={seal.id}
                      className="transition-colors hover:bg-sand/60"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-semibold text-ink">
                          {seal.container}
                        </p>

                        <p className="mt-0.5 font-mono text-[10px] text-ink-soft">
                          {seal.consignment}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-semibold text-ink">
                          {seal.sealNumber}
                        </p>

                        {seal.previousSeal &&
                          seal.previousSeal !== seal.sealNumber && (
                            <p className="mt-0.5 font-mono text-[10px] text-coral line-through">
                              {seal.previousSeal}
                            </p>
                          )}

                        <p className="mt-0.5 text-[10px] text-ink-soft">
                          {seal.sealType}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink">
                        {seal.event}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-ink-soft">
                        {seal.location}
                      </td>

                      <td className="px-4 py-3.5 text-[11px] text-ink-soft">
                        {seal.recordedBy}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-ink-soft">
                        {seal.recordedAt}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge
                          label={seal.status}
                          tone={statusTone(seal.status)}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/operations/seal/${seal.id}`)
                          }
                          className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
                        >
                          View
                          <ArrowRight className="ml-1 size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
            <span>
              Showing {loadError ? 0 : filtered.length} of {loadError ? 0 : seals.length} seal events
            </span>

            <span>Mismatch requires supervisor resolution</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
