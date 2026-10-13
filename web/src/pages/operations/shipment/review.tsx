import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Container,
  FileCheck2,
  FileText,
  MapPin,
  Package,
  RefreshCcw,
  ShieldAlert,
  Ship,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type ShipmentContainer = {
  id: string;
  container_no: string;
  size: string | null;
  seal_no: string | null;
  package_count: number | null;
  gross_weight: number | null;
};

type ShipmentDocument = {
  id: string;
  document_type: string;
  original_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number;
  uploaded_at: string;
};

type ReviewEvent = {
  id: string;
  decision: string;
  reason: string | null;
  reviewer_id: string;
  created_at: string;
};

type Shipment = {
  id: string;
  shipment_reference: string | null;
  user_id: string;
  organisation_id: string | null;
  organisation_name: string | null;
  shipment_type: string;
  bill_of_lading: string | null;
  booking_number: string | null;
  vessel_name: string | null;
  voyage_number: string | null;
  shipping_line: string | null;
  origin_country: string | null;
  origin_port: string | null;
  destination_port: string | null;
  expected_arrival: string | null;
  consignee: string | null;
  consignee_email: string | null;
  consignee_phone: string | null;
  cargo_description: string | null;
  cargo_category: string;
  package_type: string;
  package_count: number | null;
  gross_weight: number | null;
  volume: number | null;
  hs_code: string | null;
  dangerous_goods: "yes" | "no";
  temperature_controlled: "yes" | "no";
  temperature: string | null;
  special_instructions: string | null;
  customs_reference: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  containers: ShipmentContainer[];
  documents: ShipmentDocument[];
  latest_review_reason?: string | null;
  review_history: ReviewEvent[];
};

type CargoState = {
  code: string;
  internal_label: string;
  customer_label: string;
};

type CargoTransition = {
  from_code: string;
  to_code: string;
  requires_hold_clear: boolean;
  requires_docs: boolean;
  requires_financial_clearance: boolean;
  requires_authority_reference: boolean;
  notifies: boolean;
};

type CurrentConfig = {
  states: CargoState[];
  transitions: CargoTransition[];
};

const normaliseShipment = (raw: any): Shipment => ({
  id: String(raw?.id ?? ""),
  shipment_reference: raw?.shipment_reference ?? null,
  user_id: String(raw?.user_id ?? ""),
  organisation_id: raw?.organisation_id ?? null,
  organisation_name: raw?.organisation_name ?? null,
  shipment_type: String(raw?.shipment_type ?? ""),
  bill_of_lading: raw?.bill_of_lading ?? null,
  booking_number: raw?.booking_number ?? null,
  vessel_name: raw?.vessel_name ?? null,
  voyage_number: raw?.voyage_number ?? null,
  shipping_line: raw?.shipping_line ?? null,
  origin_country: raw?.origin_country ?? null,
  origin_port: raw?.origin_port ?? null,
  destination_port: raw?.destination_port ?? null,
  expected_arrival: raw?.expected_arrival ?? null,
  consignee: raw?.consignee ?? null,
  consignee_email: raw?.consignee_email ?? null,
  consignee_phone: raw?.consignee_phone ?? null,
  cargo_description: raw?.cargo_description ?? null,
  cargo_category: String(raw?.cargo_category ?? ""),
  package_type: String(raw?.package_type ?? ""),
  package_count: raw?.package_count == null ? null : Number(raw.package_count),
  gross_weight: raw?.gross_weight == null ? null : Number(raw.gross_weight),
  volume: raw?.volume == null ? null : Number(raw.volume),
  hs_code: raw?.hs_code ?? null,
  dangerous_goods: raw?.dangerous_goods === "yes" ? "yes" : "no",
  temperature_controlled: raw?.temperature_controlled === "yes" ? "yes" : "no",
  temperature: raw?.temperature ?? null,
  special_instructions: raw?.special_instructions ?? null,
  customs_reference: raw?.customs_reference ?? null,
  status: String(raw?.status ?? "pending_review"),
  created_at: String(raw?.created_at ?? ""),
  updated_at: String(raw?.updated_at ?? ""),
  containers: Array.isArray(raw?.containers)
    ? raw.containers.map((c: any) => ({
        id: String(c?.id ?? ""),
        container_no: String(c?.container_no ?? ""),
        size: c?.size ?? null,
        seal_no: c?.seal_no ?? null,
        package_count:
          c?.package_count == null ? null : Number(c.package_count),
        gross_weight:
          c?.gross_weight == null ? null : Number(c.gross_weight),
      }))
    : [],
  documents: Array.isArray(raw?.documents)
    ? raw.documents.map((d: any) => ({
        id: String(d?.id ?? ""),
        document_type: String(d?.document_type ?? ""),
        original_name: String(d?.original_name ?? ""),
        file_path: String(d?.file_path ?? ""),
        mime_type: d?.mime_type ?? null,
        file_size: Number(d?.file_size ?? 0),
        uploaded_at: String(d?.uploaded_at ?? ""),
      }))
    : [],
  latest_review_reason: raw?.latest_review_reason ?? null,
  review_history: Array.isArray(raw?.review_history)
    ? raw.review_history.map((r: any) => ({
        id: String(r?.id ?? ""),
        decision: String(r?.decision ?? ""),
        reason: r?.reason ?? null,
        reviewer_id: String(r?.reviewer_id ?? ""),
        created_at: String(r?.created_at ?? ""),
      }))
    : [],
});

const normaliseState = (raw: any): CargoState => ({
  code: String(raw?.code ?? ""),
  internal_label: String(raw?.internal_label ?? ""),
  customer_label: String(raw?.customer_label ?? ""),
});

const normaliseTransition = (raw: any): CargoTransition => ({
  from_code: String(raw?.from ?? raw?.from_code ?? ""),
  to_code: String(raw?.to ?? raw?.to_code ?? ""),
  requires_hold_clear: Boolean(raw?.requires_hold_clear ?? false),
  requires_docs: Boolean(raw?.requires_docs ?? false),
  requires_financial_clearance: Boolean(
    raw?.requires_financial_clearance ?? false
  ),
  requires_authority_reference: Boolean(
    raw?.requires_authority_reference ?? false
  ),
  notifies: Boolean(raw?.notifies ?? true),
});

const statusTone: Record<
  string,
  { bg: string; text: string; ring: string; dot: string; label: string }
> = {
  pending_review: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Pending review",
  },
  CHANGES_REQUESTED: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Changes requested",
  },
  REJECTED: {
    bg: "bg-coral/10",
    text: "text-coral",
    ring: "ring-coral/30",
    dot: "bg-coral",
    label: "Rejected",
  },
  EXPECTED: {
    bg: "bg-sky/10",
    text: "text-sky-deep",
    ring: "ring-sky/30",
    dot: "bg-sky",
    label: "Expected",
  },
  IN_TRANSIT_TO_TERMINAL: {
    bg: "bg-slate/10",
    text: "text-slate-deep",
    ring: "ring-slate/25",
    dot: "bg-slate",
    label: "In transit",
  },
  ARRIVED_AT_GATE: {
    bg: "bg-slate/10",
    text: "text-slate-deep",
    ring: "ring-slate/25",
    dot: "bg-slate",
    label: "Arrived at gate",
  },
  RECEIVED: {
    bg: "bg-carmine/10",
    text: "text-carmine",
    ring: "ring-carmine/25",
    dot: "bg-carmine",
    label: "Received",
  },
  STORED: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    dot: "bg-teal",
    label: "Stored",
  },
  DOCS_IN_PROGRESS: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Documentation",
  },
  EXAMINATION_SCHEDULED: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Exam scheduled",
  },
  UNDER_EXAMINATION: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Under examination",
  },
  EXAMINATION_COMPLETE: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Examination complete",
  },
  HELD: {
    bg: "bg-coral/10",
    text: "text-coral",
    ring: "ring-coral/30",
    dot: "bg-coral",
    label: "On hold",
  },
  CHARGES_PENDING: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    dot: "bg-orange",
    label: "Charges pending",
  },
  CHARGES_SETTLED: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    dot: "bg-teal",
    label: "Charges settled",
  },
  RELEASE_AUTHORISED: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    dot: "bg-teal",
    label: "Release authorised",
  },
  SLOT_BOOKED: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    dot: "bg-teal",
    label: "Collection booked",
  },
  LOADING: {
    bg: "bg-slate/10",
    text: "text-slate-deep",
    ring: "ring-slate/25",
    dot: "bg-slate",
    label: "Loading",
  },
  GATE_OUT: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    dot: "bg-teal",
    label: "Collected",
  },
  CLOSED: {
    bg: "bg-sand-2",
    text: "text-ink-soft",
    ring: "ring-line",
    dot: "bg-ink-soft",
    label: "Closed",
  },
  OVERSTAYED: {
    bg: "bg-coral/10",
    text: "text-coral",
    ring: "ring-coral/30",
    dot: "bg-coral",
    label: "Overstayed",
  },
  TRANSFERRED_OUT: {
    bg: "bg-sand-2",
    text: "text-ink-soft",
    ring: "ring-line",
    dot: "bg-ink-soft",
    label: "Transferred",
  },
  RETURNED_RE_EXPORTED: {
    bg: "bg-sand-2",
    text: "text-ink-soft",
    ring: "ring-line",
    dot: "bg-ink-soft",
    label: "Returned",
  },
};

const humanise = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : "—";

const formatDateTime = (value: string | null | undefined) =>
  value ? value.slice(0, 16).replace("T", " ") : "—";

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? {
    bg: "bg-sand-2",
    text: "text-ink-soft",
    ring: "ring-line",
    dot: "bg-ink-soft",
    label: humanise(status),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ring-1 ring-inset",
        tone.bg,
        tone.text,
        tone.ring
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}

function Field({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  icon?: typeof Ship;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 break-words text-sm font-medium text-ink",
          mono && "font-mono",
          empty && "text-ink-soft"
        )}
      >
        {empty ? "—" : value}
      </p>
    </div>
  );
}

function Block({
  title,
  icon,
  children,
  action,
  className,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_1px_3px_0_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line bg-sand/40 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
            {icon}
          </span>
          <h2 className="font-display text-sm font-bold tracking-tight text-ink">
            {title}
          </h2>
        </div>
        {action}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.section>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Ship;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-line bg-paper p-3.5 transition-colors hover:border-orange/30 hover:bg-orange/[0.02]">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sand text-orange-deep ring-1 ring-line transition-colors group-hover:bg-orange group-hover:text-white group-hover:ring-orange">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </p>
        <p className="mt-0.5 truncate font-display text-[13px] font-bold text-ink">
          {value}
        </p>
      </div>
    </div>
  );
}

const primaryBtn =
  "bg-orange text-white hover:bg-orange-deep disabled:opacity-60 shadow-sm";
const softBtn =
  "border-line bg-paper text-ink hover:bg-sand disabled:opacity-60";

export default function OperationsShipmentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [config, setConfig] = useState<CurrentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [authorityReference, setAuthorityReference] = useState("");
  const [financialReference, setFinancialReference] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [shipmentRes, configRes] = await Promise.all([
          http.get(`/operator/shipment/${id}/`),
          http.get("/portal/shipment/config/"),
        ]);

        const shipmentResp: Resp = shipmentRes.data;
        const configResp: Resp = configRes.data;

        if (shipmentResp.error) {
          toast.error(shipmentResp.data || "Could not load shipment.");
          setShipment(null);
          return;
        }

        if (!configResp.error) {
          const payload: any = configResp.code ?? {};
          const states = payload.cargo_states ?? payload.states ?? [];
          const transitions =
            payload.cargo_transitions ?? payload.transitions ?? [];
          setConfig({
            states: Array.isArray(states) ? states.map(normaliseState) : [],
            transitions: Array.isArray(transitions)
              ? transitions.map(normaliseTransition)
              : [],
          });
        }

        const payload: any =
          shipmentResp.code?.shipment ?? shipmentResp.code ?? {};
        setShipment(normaliseShipment(payload));
      } catch (err: any) {
        toast.error(
          err?.response?.data?.data ||
            err?.response?.data?.message ||
            "Could not load shipment."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const stateLookup = useMemo(() => {
    const map = new Map<string, CargoState>();
    config?.states.forEach((state) => map.set(state.code, state));
    return map;
  }, [config]);

  const isPendingReview =
    shipment?.status === "pending_review" ||
    shipment?.status === "CHANGES_REQUESTED";

  const availableTransitions = useMemo(() => {
    if (!config || !shipment || isPendingReview || shipment.status === "REJECTED")
      return [];
    return config.transitions.filter((t) => t.from_code === shipment.status);
  }, [config, shipment, isPendingReview]);

  const requiresFinancial = availableTransitions.some(
    (t) => t.requires_financial_clearance
  );
  const requiresAuthority = availableTransitions.some(
    (t) => t.requires_authority_reference
  );
  const requiresHold = availableTransitions.some((t) => t.requires_hold_clear);

  const canSubmitTransition =
    (!requiresAuthority || authorityReference.trim() !== "") &&
    (!requiresFinancial || financialReference.trim() !== "");

  const handleReview = async (
    decision: "approve" | "reject" | "return"
  ) => {
    if (!shipment || !id || submitting) return;

    if (decision !== "approve" && actionNote.trim().length < 5) {
      toast.error("Enter a clear reason of at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new URLSearchParams();
      body.set("id", id);
      body.set("action", decision);
      body.set("note", actionNote.trim());

      const response = await http.post(
        "/operator/shipment/transition/",
        body,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      const resp: Resp = response.data;
      if (resp.error) {
        toast.error(resp.data || "Could not review declaration.");
        return;
      }

      toast.success(resp.data || "Declaration review saved.");
      setActionNote("");
      await fetchAll(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          "Could not review declaration."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (toCode: string) => {
    if (!shipment || !id || submitting) return;
    if (!canSubmitTransition) {
      toast.error("Provide the required references before proceeding.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new URLSearchParams();
      body.set("id", id);
      body.set("to_status", toCode);
      body.set("note", actionNote.trim());
      if (holdReason.trim()) body.set("hold_reason", holdReason.trim());
      if (authorityReference.trim())
        body.set("authority_reference", authorityReference.trim());
      if (financialReference.trim())
        body.set("financial_reference", financialReference.trim());

      const response = await http.post(
        "/operator/shipment/transition/",
        body,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      const resp: Resp = response.data;
      if (resp.error) {
        toast.error(resp.data || "Could not update shipment.");
        return;
      }

      toast.success(resp.data || "Shipment updated.");
      setActionNote("");
      setHoldReason("");
      setAuthorityReference("");
      setFinancialReference("");
      await fetchAll(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.data ||
          err?.response?.data?.message ||
          "Could not update shipment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Shipment review" eyebrow="Operations · Shipment">
        <div className="flex items-center justify-center rounded-2xl border border-line bg-paper p-12">
          <span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
        </div>
      </AppShell>
    );
  }

  if (!shipment) {
    return (
      <AppShell title="Shipment review" eyebrow="Operations · Shipment">
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 size-5 text-carmine" />
            <div>
              <h2 className="font-display font-bold text-ink">
                Shipment not found
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                The shipment does not exist or is not visible to your role.
              </p>
            </div>
          </div>
          <Button
            className={cn("mt-5", primaryBtn)}
            onClick={() => navigate("/operations/shipments")}
          >
            Back to shipments
          </Button>
        </div>
      </AppShell>
    );
  }

  const reference =
    shipment.shipment_reference ?? `${shipment.id.slice(0, 8)}…`;
  const declarationIsReviewable =
    shipment.status === "pending_review" ||
    shipment.status === "CHANGES_REQUESTED";
  const currentState = stateLookup.get(shipment.status);
  const routeLine = `${shipment.origin_port || shipment.origin_country || "—"} → ${
    shipment.destination_port || "—"
  }`;

  return (
    <AppShell title="Shipment review" eyebrow="Operations · Shipment">
      <div className="mx-auto max-w-[1400px] space-y-5 pb-10">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_8px_24px_-8px_rgba(0,0,0,0.06)]"
        >
          <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-orange/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 size-80 rounded-full bg-carmine/5 blur-3xl" />

          <div className="relative p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8", softBtn)}
                onClick={() => navigate("/operations/shipments")}
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Shipments
              </Button>
              <span className="text-ink-soft/40">/</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                Declaration
              </span>
              <span className="text-ink-soft/40">/</span>
              <span className="font-mono text-[11px] text-ink-soft">
                {reference}
              </span>

              <Button
                variant="ghost"
                size="sm"
                disabled={refreshing || submitting}
                onClick={() => void fetchAll(true)}
                className="ml-auto h-8 text-ink-soft hover:bg-sand hover:text-ink"
              >
                <RefreshCcw
                  className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={shipment.status} />
                  {currentState?.customer_label && (
                    <span className="rounded-full bg-sand-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line">
                      {currentState.customer_label}
                    </span>
                  )}
                  <span className="rounded-full bg-sand-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line">
                    {humanise(shipment.shipment_type || "—")}
                  </span>
                </div>

                <h1 className="mt-4 break-words font-display text-3xl font-bold tracking-tight text-ink sm:text-[34px]">
                  {reference}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                  {shipment.cargo_description ||
                    "Review the declaration, verify supporting information, and record the decision before the cargo enters terminal operations."}
                </p>
              </div>

              <div className="grid w-full max-w-[520px] grid-cols-2 gap-2.5 sm:grid-cols-2">
                <Stat
                  label="Vessel"
                  value={shipment.vessel_name || "—"}
                  icon={Ship}
                />
                <Stat
                  label="Bill of lading"
                  value={shipment.bill_of_lading || "—"}
                  icon={FileText}
                />
                <Stat
                  label="Expected arrival"
                  value={formatDate(shipment.expected_arrival)}
                  icon={CalendarDays}
                />
                <Stat label="Route" value={routeLine} icon={MapPin} />
              </div>
            </div>

            {shipment.status === "REJECTED" && (
              <div className="mt-6 flex gap-3 rounded-xl border border-coral/30 bg-coral/5 p-4">
                <XCircle className="mt-0.5 size-5 shrink-0 text-coral" />
                <div>
                  <p className="font-display text-sm font-bold text-ink">
                    Declaration rejected
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    {shipment.latest_review_reason ||
                      "No rejection reason was returned by the API."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {declarationIsReviewable && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-orange/30 bg-gradient-to-br from-orange/[0.07] via-orange/[0.03] to-paper shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(255,102,0,0.25)]"
          >
            <div className="flex items-start gap-4 border-b border-orange/20 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange text-white shadow-sm">
                <ShieldAlert className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold tracking-tight text-ink">
                  Declaration decision required
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  Approving moves this declaration to{" "}
                  <strong className="font-semibold text-orange-deep">
                    EXPECTED
                  </strong>
                  . Rejection and correction requests require a reason and are
                  retained in the review history.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <label className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Review note / reason
                  </span>
                  <span className="font-mono text-[10px] text-ink-soft">
                    {actionNote.length}/500
                  </span>
                </div>
                <textarea
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Explain why it is being rejected or what the applicant must correct..."
                  className="mt-2 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-orange focus:ring-2 focus:ring-orange/15"
                />
              </label>

              <div className="flex flex-col gap-2 border-t border-orange/15 pt-5 sm:flex-row sm:flex-wrap">
                <Button
                  disabled={submitting}
                  onClick={() => void handleReview("approve")}
                  className="bg-teal-deep text-white shadow-sm hover:bg-teal-deep/90 disabled:opacity-60"
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  {submitting ? "Saving…" : "Approve declaration"}
                </Button>
                <Button
                  disabled={submitting || actionNote.trim().length < 5}
                  variant="outline"
                  onClick={() => void handleReview("return")}
                  className="border-orange/30 bg-paper text-orange-deep hover:bg-orange/10 disabled:opacity-60"
                >
                  <FileCheck2 className="mr-2 size-4" /> Return for correction
                </Button>
                <Button
                  disabled={submitting || actionNote.trim().length < 5}
                  variant="destructive"
                  onClick={() => void handleReview("reject")}
                  className="disabled:opacity-60"
                >
                  <XCircle className="mr-2 size-4" /> Reject declaration
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-5">
            <Block title="Shipment information" icon={<Ship className="size-4" />}>
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Shipment type"
                  value={humanise(shipment.shipment_type || "—")}
                />
                <Field
                  label="Bill of lading"
                  value={shipment.bill_of_lading}
                  mono
                />
                <Field
                  label="Booking number"
                  value={shipment.booking_number}
                  mono
                />
                <Field label="Vessel name" value={shipment.vessel_name} />
                <Field label="Voyage number" value={shipment.voyage_number} />
                <Field label="Shipping line" value={shipment.shipping_line} />
                <Field label="Origin country" value={shipment.origin_country} />
                <Field label="Origin port" value={shipment.origin_port} />
                <Field
                  label="Destination port"
                  value={shipment.destination_port}
                />
                <Field
                  label="Expected arrival"
                  value={formatDate(shipment.expected_arrival)}
                />
                <Field
                  label="Customs reference"
                  value={shipment.customs_reference}
                  mono
                />
                <Field label="HS code" value={shipment.hs_code} mono />
              </div>
            </Block>

            <Block title="Cargo details" icon={<Package className="size-4" />}>
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Description"
                  value={shipment.cargo_description}
                />
                <Field label="Category" value={shipment.cargo_category} />
                <Field label="Package type" value={shipment.package_type} />
                <Field label="Package count" value={shipment.package_count} />
                <Field
                  label="Gross weight"
                  value={
                    shipment.gross_weight == null
                      ? null
                      : `${shipment.gross_weight} kg`
                  }
                />
                <Field
                  label="Volume"
                  value={shipment.volume == null ? null : `${shipment.volume} m³`}
                />
                <Field
                  label="Dangerous goods"
                  value={humanise(shipment.dangerous_goods)}
                />
                <Field
                  label="Temperature controlled"
                  value={humanise(shipment.temperature_controlled)}
                />
                <Field label="Temperature" value={shipment.temperature} />
              </div>

              {shipment.special_instructions && (
                <div className="mt-6 rounded-xl border border-orange/20 bg-orange/[0.04] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
                    Special instructions
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">
                    {shipment.special_instructions}
                  </p>
                </div>
              )}
            </Block>

            <Block title="Containers" icon={<Container className="size-4" />}>
              {shipment.containers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-sand/40 p-8 text-center">
                  <Container className="mx-auto size-6 text-ink-soft" />
                  <p className="mt-2 text-sm font-medium text-ink">
                    No containers attached
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    This declaration does not include container records.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-sand/50 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        <th className="px-4 py-3 font-medium">
                          Container number
                        </th>
                        <th className="px-4 py-3 font-medium">Size</th>
                        <th className="px-4 py-3 font-medium">Seal number</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Packages
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          Gross weight
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {shipment.containers.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-sand/40"
                        >
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-ink">
                            {item.container_no || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-soft">
                            {item.size || "—"}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
                            {item.seal_no || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right text-xs text-ink-soft">
                            {item.package_count ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
                            {item.gross_weight == null
                              ? "—"
                              : `${item.gross_weight} kg`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Block>

            <Block
              title="Supporting documents"
              icon={<FileText className="size-4" />}
              action={
                shipment.documents.length > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    {shipment.documents.length} file
                    {shipment.documents.length === 1 ? "" : "s"}
                  </span>
                )
              }
            >
              {shipment.documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-sand/40 p-8 text-center">
                  <FileText className="mx-auto size-6 text-ink-soft" />
                  <p className="mt-2 text-sm font-medium text-ink">
                    No documents uploaded
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    The applicant has not attached supporting documents.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {shipment.documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-background p-3 transition-colors hover:border-orange/30"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand text-orange-deep ring-1 ring-line">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {document.original_name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                          {humanise(document.document_type)} ·{" "}
                          {(document.file_size / 1024).toFixed(1)} KB ·{" "}
                          {formatDate(document.uploaded_at)}
                        </p>
                      </div>
                      {document.file_path && (
                        <a
                          href={document.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold text-orange-deep transition-colors hover:bg-orange/10"
                        >
                          Open
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
            <Block
              title="Applicant"
              icon={<Building2 className="size-4" />}
            >
              <div className="space-y-4">
                <Field
                  label="Organisation"
                  value={shipment.organisation_name}
                />
                <Field
                  label="Consignee"
                  value={shipment.consignee}
                  icon={User}
                />
                <Field
                  label="Email"
                  value={shipment.consignee_email}
                  mono
                />
                <Field
                  label="Phone"
                  value={shipment.consignee_phone}
                  mono
                />
              </div>
            </Block>

            <Block title="Timeline" icon={<Clock3 className="size-4" />}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-soft ring-1 ring-line">
                    <CalendarDays className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Submitted
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatDateTime(shipment.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-soft ring-1 ring-line">
                    <RefreshCcw className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatDateTime(shipment.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-soft ring-1 ring-line">
                    <MapPin className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                      Route
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {routeLine}
                    </p>
                  </div>
                </div>
              </div>
            </Block>

            {shipment.review_history.length > 0 && (
              <Block
                title="Review history"
                icon={<User className="size-4" />}
                action={
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
                  >
                    {showHistory ? "Hide" : "Show"}
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform",
                        showHistory && "rotate-180"
                      )}
                    />
                  </button>
                }
              >
                <AnimatePresence initial={false}>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ol className="relative space-y-5 border-l border-line pl-5">
                        {shipment.review_history.map((event, index) => (
                          <li key={event.id} className="relative">
                            <span
                              className={cn(
                                "absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-paper",
                                index === 0 ? "bg-orange" : "bg-line"
                              )}
                            />
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {humanise(event.decision)}
                              </p>
                              <span className="font-mono text-[10px] text-ink-soft">
                                {formatDateTime(event.created_at)}
                              </span>
                            </div>
                            <p className="mt-0.5 font-mono text-[10px] text-ink-soft">
                              {event.reviewer_id}
                            </p>
                            {event.reason && (
                              <p className="mt-2 rounded-lg bg-sand/50 p-3 text-[13px] leading-5 text-ink-soft">
                                {event.reason}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Block>
            )}
          </aside>
        </div>

        {!declarationIsReviewable && shipment.status !== "REJECTED" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
            <header className="flex items-center gap-3 border-b border-line bg-sand/40 px-5 py-4 sm:px-6">
              <span className="grid size-8 place-items-center rounded-lg bg-teal/10 text-teal-deep ring-1 ring-teal/20">
                <CheckCircle2 className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-bold tracking-tight text-ink">
                  Cargo operations
                </h2>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  Declaration review complete · transitions come from the active
                  lifecycle configuration
                </p>
              </div>
            </header>

            <div className="p-5 sm:p-6">
              {availableTransitions.length > 0 ? (
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="block lg:col-span-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                          Operational note
                        </span>
                        <span className="font-mono text-[10px] text-ink-soft">
                          {actionNote.length}/500
                        </span>
                      </div>
                      <textarea
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="mt-2 w-full rounded-xl border border-line bg-background px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-orange focus:ring-2 focus:ring-orange/15"
                        placeholder="Add an optional note for this status change"
                      />
                    </label>

                    {requiresAuthority && (
                      <label className="block">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                          Authority reference
                        </span>
                        <input
                          value={authorityReference}
                          onChange={(e) =>
                            setAuthorityReference(e.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/15"
                        />
                      </label>
                    )}

                    {requiresFinancial && (
                      <label className="block">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                          Financial reference
                        </span>
                        <input
                          value={financialReference}
                          onChange={(e) =>
                            setFinancialReference(e.target.value)
                          }
                          className="mt-2 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/15"
                        />
                      </label>
                    )}

                    {requiresHold && (
                      <label className="block lg:col-span-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                          Hold reason (if applicable)
                        </span>
                        <input
                          value={holdReason}
                          onChange={(e) => setHoldReason(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-line bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/15"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-line pt-5">
                    {availableTransitions.map((transition) => (
                      <Button
                        key={`${transition.from_code}-${transition.to_code}`}
                        disabled={submitting || !canSubmitTransition}
                        onClick={() => void handleTransition(transition.to_code)}
                        className={cn(primaryBtn, "disabled:opacity-60")}
                      >
                        {humanise(transition.to_code)}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-line bg-sand/40 p-5 text-sm text-ink-soft">
                  No transitions are configured for the current status.
                </p>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </AppShell>
  );
}