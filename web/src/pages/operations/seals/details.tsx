import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Container,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

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
  photoPath: string | null;
  hasPhoto: boolean;
}

interface SealApiRecord {
  id: string;
  container_id: string;
  container_no: string;
  container_size?: string;
  shipment_id: string;
  shipment_reference?: string;
  bill_of_lading?: string;
  seal_number: string;
  previous_seal_number?: string | null;
  seal_type: string;
  event_type: string;
  location: string;
  status: string;
  notes?: string | null;
  photo_path?: string | null;
  recorded_by?: string | null;
  recorded_at: string;
}

const validStatuses: SealStatus[] = [
  "Verified",
  "Intact",
  "Pending verification",
  "Mismatch",
  "Broken",
  "Missing",
];

const validEvents: SealEvent[] = [
  "Initial",
  "Custody change",
  "Examination preparation",
  "Return to storage",
  "Replacement",
];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapSealRecord(record: SealApiRecord): SealRecord {
  const status = validStatuses.includes(record.status as SealStatus)
    ? (record.status as SealStatus)
    : "Pending verification";

  const event = validEvents.includes(record.event_type as SealEvent)
    ? (record.event_type as SealEvent)
    : "Initial";

  return {
    id: record.id,
    container: record.container_no || "—",
    containerRef: record.container_id || "—",
    bl: record.bill_of_lading || "—",
    consignment: record.shipment_reference || "—",
    sealNumber: record.seal_number || "—",
    previousSeal: record.previous_seal_number || undefined,
    sealType: record.seal_type || "—",
    event,
    location: record.location || "—",
    recordedBy: record.recorded_by || "—",
    recordedAt: formatDate(record.recorded_at),
    status,
    notes: record.notes || "",
    photoPath: record.photo_path ? resolveSrc(record.photo_path) : null,
    hasPhoto: Boolean(record.photo_path),
  };
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-semibold text-ink ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default function OperationsSealDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [seal, setSeal] = useState<SealRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchSeal = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    setNotFound(false);

    try {
      const res = await http.get(`/operations/seals/${id}/`);
      const resp: Resp = res.data;

      if (resp.error) {
        throw new Error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load seal details."
        );
      }

      const responseData = resp.data as
        | SealApiRecord
        | { record?: SealApiRecord; seal?: SealApiRecord };

      const record: SealApiRecord | undefined =
        "id" in responseData
          ? responseData
          : responseData.record ?? responseData.seal;

      if (!record?.id) {
        setNotFound(true);
        setSeal(null);
        return;
      }

      setSeal(mapSealRecord(record));
    } catch (error) {
      setLoadError(true);
      setSeal(null);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load seal details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSeal();
  }, [fetchSeal]);

  if (loading) {
    return (
      <AppShell
        title="Seal details"
        eyebrow="Operations · Seal management"
      >
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-paper">
          <Loader2 className="size-8 animate-spin text-orange" />
          <p className="mt-4 text-sm font-medium text-ink-soft">
            Loading seal details...
          </p>
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell
        title="Seal details"
        eyebrow="Operations · Seal management"
      >
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-paper px-6 text-center">
          <ShieldAlert className="size-10 text-coral" />

          <h2 className="mt-4 text-lg font-semibold text-ink">
            Unable to load seal details
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
            Something went wrong while retrieving this seal event. Check your
            connection and try again.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              onClick={fetchSeal}
              className="bg-orange text-white hover:bg-orange-deep"
            >
              <RefreshCw className="mr-2 size-4" />
              Retry
            </Button>

            <Button
              variant="outline"
              className="border-line bg-paper text-ink hover:bg-sand"
              onClick={() => navigate("/operations/seals")}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to seal management
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (notFound || !seal) {
    return (
      <AppShell
        title="Seal details"
        eyebrow="Operations · Seal management"
      >
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-line bg-paper px-6 text-center">
          <ShieldAlert className="size-10 text-ink-soft" />

          <h2 className="mt-4 text-lg font-semibold text-ink">
            Seal record not found
          </h2>

          <p className="mt-2 max-w-md text-sm text-ink-soft">
            The seal event you are looking for does not exist or may no longer
            be available.
          </p>

          <Button
            className="mt-5 bg-orange text-white hover:bg-orange-deep"
            onClick={() => navigate("/operations/seals")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to seal management
          </Button>
        </div>
      </AppShell>
    );
  }

  const isIssue =
    seal.status === "Mismatch" ||
    seal.status === "Broken" ||
    seal.status === "Missing";

  const isVerified =
    seal.status === "Verified" || seal.status === "Intact";

  return (
    <AppShell
      title="Seal event details"
      eyebrow="Operations · Seal management"
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="border-line bg-paper text-ink hover:bg-sand"
            onClick={() => navigate("/operations/seals")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to seal management
          </Button>

          <StatusBadge
            label={seal.status}
            tone={statusTone(seal.status)}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-deep">
                  Seal event reference
                </p>

                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
                  {seal.sealNumber}
                </h2>

                <p className="mt-1 text-sm text-ink-soft">
                  {seal.container} · {seal.consignment}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <p className="text-xs text-ink-soft">Event type</p>
              <p className="text-sm font-semibold text-ink">
                {seal.event === "Initial"
                  ? "Initial verification"
                  : seal.event}
              </p>
              <p className="font-mono text-[10px] text-ink-soft">
                {seal.recordedAt}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <div className="flex items-center gap-3 rounded-xl bg-sand p-4">
              <Container className="size-5 shrink-0 text-orange" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Container
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold text-ink">
                  {seal.container}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-sand p-4">
              <ShieldCheck className="size-5 shrink-0 text-orange" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Seal number
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold text-ink">
                  {seal.sealNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-sand p-4">
              {isIssue ? (
                <AlertTriangle className="size-5 shrink-0 text-coral" />
              ) : isVerified ? (
                <CheckCircle2 className="size-5 shrink-0 text-orange" />
              ) : (
                <ClipboardCheck className="size-5 shrink-0 text-orange" />
              )}

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Verification status
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {seal.status}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isIssue && (
          <section className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/5 p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-coral" />

            <div>
              <h3 className="text-sm font-semibold text-ink">
                Seal discrepancy flagged
              </h3>
              <p className="mt-1 text-sm leading-6 text-ink-soft">
                This seal has been flagged as {seal.status.toLowerCase()}.
                Supervisor review is required before the cargo can progress.
                Preserve the original seal event and its evidence as part of
                the audit history.
              </p>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <Container className="size-4 text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Shipment information
              </h3>
            </div>

            <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
              <DetailItem
                label="Container number"
                value={seal.container}
                mono
              />
              <DetailItem
                label="Container reference"
                value={seal.containerRef}
                mono
              />
              <DetailItem
                label="Bill of lading"
                value={seal.bl}
                mono
              />
              <DetailItem
                label="Consignment reference"
                value={seal.consignment}
                mono
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <ShieldCheck className="size-4 text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Seal information
              </h3>
            </div>

            <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
              <DetailItem
                label="Current seal number"
                value={seal.sealNumber}
                mono
              />
              <DetailItem
                label="Previous seal number"
                value={seal.previousSeal ?? "—"}
                mono
              />
              <DetailItem label="Seal type" value={seal.sealType} />
              <DetailItem
                label="Event type"
                value={
                  seal.event === "Initial"
                    ? "Initial verification"
                    : seal.event
                }
              />
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <MapPin className="size-4 text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Event location
              </h3>
            </div>

            <div className="space-y-5 p-5">
              <DetailItem label="Recorded location" value={seal.location} />
              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem
                  label="Event status"
                  value={seal.status}
                />
                <DetailItem label="Event type" value={seal.event} />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
              <User className="size-4 text-orange" />
              <h3 className="text-sm font-semibold text-ink">
                Recording information
              </h3>
            </div>

            <div className="space-y-5 p-5">
              <DetailItem label="Recorded by" value={seal.recordedBy} />
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 size-4 shrink-0 text-orange" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Date and time recorded
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {seal.recordedAt}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <FileText className="size-4 text-orange" />
            <h3 className="text-sm font-semibold text-ink">
              Observations and evidence
            </h3>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                Recorded notes
              </p>

              <p className="mt-2 rounded-xl bg-sand p-4 text-sm leading-6 text-ink">
                {seal.notes || "No observations recorded."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div className="flex items-start gap-3">
                {seal.hasPhoto ? (
                  <CheckCircle2 className="mt-0.5 size-5 text-orange" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-5 text-ink-soft" />
                )}

                <div>
                  <p className="text-sm font-semibold text-ink">
                    {seal.hasPhoto
                      ? "Photograph on file"
                      : "No photograph recorded"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    {seal.hasPhoto
                      ? "A photograph was recorded for this seal event."
                      : "No photograph was attached to this seal event."}
                  </p>
                </div>
              </div>

              {seal.photoPath && (
                <a
                  href={seal.photoPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-orange hover:underline"
                >
                  View photograph
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            variant="outline"
            className="border-line bg-paper text-ink hover:bg-sand"
            onClick={() => navigate("/operations/seals")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to seal management
          </Button>
        </div>
      </div>
    </AppShell>
  );
}