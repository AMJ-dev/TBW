import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Container,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Hash,
  MapPin,
  Package,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Truck,
  User,
  Warehouse,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";
import { resolveSrc } from "@/lib/functions";

type ShipmentContainer = {
  id: string;
  shipment_id: string;
  container_no: string;
  size: string | null;
  seal_no: string | null;
  package_count: number | null;
  gross_weight: number | null;
  status: string | null;
  gate_in_at: string | null;
  received_at: string | null;
  stored_at: string | null;
  gate_out_at: string | null;
  cargo_description: string | null;
  package_type: string | null;
  hs_code: string | null;
  customs_tariff_id: string | null;
  tariff_hs_code: string | null;
  customs_tariff_description: string | null;
  item_quantity: number | null;
  unit_of_measure: string | null;
  unit_value: number | null;
  currency: string | null;
  total_value: number | null;
  created_at: string;
  updated_at: string;
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

type Reviewer = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  pics: string | null;
};

type ReviewEvent = {
  id: string;
  decision: string;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  reviewer_id: string;
  reviewer: Reviewer | null;
  created_at: string;
};

type FinanceSummary = {
  invoice_id: string | null;
  invoice_number: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  balance: number | null;
  currency: string;
  invoice_status: string | null;
  payment_cleared: boolean;
  cleared_at: string | null;
  invoice_url: string | null;
};

type InventorySummary = {
  location_type: "yard" | "warehouse" | "examination" | "gate" | "in_transit" | "unknown";
  location_label: string | null;
  placed_at: string | null;
  operator_name: string | null;
  operator_id: string | null;
  stock_balance: number | null;
  movement_count: number | null;
  last_movement_at: string | null;
};

type ActivityEvent = {
  id: string;
  kind:
    | "declaration_review"
    | "gate"
    | "receiving"
    | "placement"
    | "examination"
    | "invoice"
    | "payment"
    | "hold"
    | "release"
    | "other";
  title: string;
  detail: string | null;
  actor_name: string | null;
  actor_id: string | null;
  created_at: string;
  meta?: Record<string, any> | null;
};

type PermittedAction = {
  action: string;
  label: string;
  to_status: string;
  requires_financial_clearance: boolean;
  requires_authority_reference: boolean;
  requires_hold_clear: boolean;
  owner_department: string | null;
  reason: string | null;
};

type ShipmentManifest = {
  id: string;
  manifest_ref: string | null;
  bill_of_lading: string | null;
  vessel: string | null;
  shipping_line: string | null;
  origin_port: string | null;
  eta: string | null;
  containers: any[];
  packages: number | null;
  gross_weight: string | number | null;
  consignee: string | null;
  consignee_type: string | null;
  agent: string | null;
  source: string | null;
  status: string | null;
  notes: string | null;
  review_reason: string | null;
  review_responsible_party: string | null;
  flagged_at: string | null;
  validated_at: string | null;
  received_at: string | null;
  updated_at: string | null;
  consignee_email: string | null;
  consignee_phone: string | null;
  consignee_address: string | null;
  consignee_status: string | null;
  review_status: string | null;
  correction_reason: string | null;
  reviewed_at: string | null;
  matches: any[];
  events: any[];
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
  reviews: ReviewEvent[];
  latest_review_reason: string | null;
  finance: FinanceSummary | null;
  inventory: InventorySummary | null;
  activity: ActivityEvent[];
  permitted_actions: PermittedAction[];
  manifests: ShipmentManifest[];
};

type CargoState = {
  code: string;
  internal_label: string;
  customer_label: string;
  phase?: string;
};

type CurrentConfig = {
  states: CargoState[];
};

const PHASES: { key: string; label: string; codes: string[] }[] = [
  {
    key: "declaration",
    label: "Declaration",
    codes: ["pending_review", "CHANGES_REQUESTED", "REJECTED", "EXPECTED"],
  },
  {
    key: "transit",
    label: "In transit",
    codes: ["IN_TRANSIT_TO_TERMINAL"],
  },
  {
    key: "gate_receiving",
    label: "Gate & Receiving",
    codes: ["ARRIVED_AT_GATE", "RECEIVED"],
  },
  {
    key: "storage",
    label: "Storage & Examination",
    codes: [
      "STORED",
      "DOCS_IN_PROGRESS",
      "EXAMINATION_SCHEDULED",
      "UNDER_EXAMINATION",
      "EXAMINATION_COMPLETE",
      "HELD",
    ],
  },
  {
    key: "release",
    label: "Release",
    codes: [
      "CHARGES_PENDING",
      "CHARGES_SETTLED",
      "RELEASE_AUTHORISED",
      "SLOT_BOOKED",
      "LOADING",
      "GATE_OUT",
      "CLOSED",
    ],
  },
];

const normaliseReviewer = (raw: any): Reviewer | null => {
  if (!raw || typeof raw !== "object") return null;
  return {
    id: String(raw.id ?? ""),
    full_name: String(raw.full_name ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    pics: raw.pics ?? null,
  };
};

const normaliseReview = (raw: any): ReviewEvent => ({
  id: String(raw?.id ?? ""),
  decision: String(raw?.decision ?? ""),
  from_status: raw?.from_status ?? null,
  to_status: raw?.to_status ?? null,
  reason: raw?.reason ?? null,
  reviewer_id: String(raw?.reviewer_id ?? ""),
  reviewer: normaliseReviewer(raw?.reviewer),
  created_at: String(raw?.created_at ?? ""),
});

const normaliseFinance = (raw: any): FinanceSummary | null => {
  if (!raw || typeof raw !== "object") return null;
  return {
    invoice_id: raw.invoice_id ?? null,
    invoice_number: raw.invoice_number ?? null,
    amount_due: raw.amount_due == null ? null : Number(raw.amount_due),
    amount_paid: raw.amount_paid == null ? null : Number(raw.amount_paid),
    balance: raw.balance == null ? null : Number(raw.balance),
    currency: String(raw.currency ?? "NGN"),
    invoice_status: raw.invoice_status ?? null,
    payment_cleared: Boolean(raw.payment_cleared ?? false),
    cleared_at: raw.cleared_at ?? null,
    invoice_url: raw.invoice_url ?? null,
  };
};

const normaliseInventory = (raw: any): InventorySummary | null => {
  if (!raw || typeof raw !== "object") return null;
  const type = String(raw.location_type ?? "unknown");
  const allowed: InventorySummary["location_type"][] = [
    "yard",
    "warehouse",
    "examination",
    "gate",
    "in_transit",
    "unknown",
  ];
  return {
    location_type: allowed.includes(type as any)
      ? (type as InventorySummary["location_type"])
      : "unknown",
    location_label: raw.location_label ?? null,
    placed_at: raw.placed_at ?? null,
    operator_name: raw.operator_name ?? null,
    operator_id: raw.operator_id ?? null,
    stock_balance:
      raw.stock_balance == null ? null : Number(raw.stock_balance),
    movement_count:
      raw.movement_count == null ? null : Number(raw.movement_count),
    last_movement_at: raw.last_movement_at ?? null,
  };
};

const normaliseActivity = (raw: any): ActivityEvent => {
  const kind = String(raw?.kind ?? "other");
  const allowed: ActivityEvent["kind"][] = [
    "declaration_review",
    "gate",
    "receiving",
    "placement",
    "examination",
    "invoice",
    "payment",
    "hold",
    "release",
    "other",
  ];
  return {
    id: String(raw?.id ?? ""),
    kind: allowed.includes(kind as any)
      ? (kind as ActivityEvent["kind"])
      : "other",
    title: String(raw?.title ?? ""),
    detail: raw?.detail ?? null,
    actor_name: raw?.actor_name ?? null,
    actor_id: raw?.actor_id ?? null,
    created_at: String(raw?.created_at ?? ""),
    meta: raw?.meta ?? null,
  };
};

const normaliseAction = (raw: any): PermittedAction => ({
  action: String(raw?.action ?? raw?.to_status ?? ""),
  label: String(raw?.label ?? raw?.to_status ?? ""),
  to_status: String(raw?.to_status ?? ""),
  requires_financial_clearance: Boolean(raw?.requires_financial_clearance ?? false),
  requires_authority_reference: Boolean(raw?.requires_authority_reference ?? false),
  requires_hold_clear: Boolean(raw?.requires_hold_clear ?? false),
  owner_department: raw?.owner_department ?? null,
  reason: raw?.reason ?? null,
});

const normaliseContainer = (raw: any): ShipmentContainer => ({
  id: String(raw?.id ?? ""),
  shipment_id: String(raw?.shipment_id ?? ""),
  container_no: String(raw?.container_no ?? ""),
  size: raw?.size ?? null,
  seal_no: raw?.seal_no ?? null,
  package_count: raw?.package_count == null ? null : Number(raw.package_count),
  gross_weight: raw?.gross_weight == null ? null : Number(raw.gross_weight),
  status: raw?.status ?? null,
  gate_in_at: raw?.gate_in_at ?? null,
  received_at: raw?.received_at ?? null,
  stored_at: raw?.stored_at ?? null,
  gate_out_at: raw?.gate_out_at ?? null,
  cargo_description: raw?.cargo_description ?? null,
  package_type: raw?.package_type ?? null,
  hs_code: raw?.hs_code ?? null,
  customs_tariff_id: raw?.customs_tariff_id ?? null,
  tariff_hs_code: raw?.tariff_hs_code ?? null,
  customs_tariff_description: raw?.customs_tariff_description ?? null,
  item_quantity: raw?.item_quantity == null ? null : Number(raw.item_quantity),
  unit_of_measure: raw?.unit_of_measure ?? null,
  unit_value: raw?.unit_value == null ? null : Number(raw.unit_value),
  currency: raw?.currency ?? null,
  total_value: raw?.total_value == null ? null : Number(raw.total_value),
  created_at: String(raw?.created_at ?? ""),
  updated_at: String(raw?.updated_at ?? ""),
});

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
    ? raw.containers.map(normaliseContainer)
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
  reviews: Array.isArray(raw?.reviews)
    ? raw.reviews.map(normaliseReview)
    : Array.isArray(raw?.review_history)
    ? raw.review_history.map(normaliseReview)
    : [],
  latest_review_reason: raw?.latest_review_reason ?? null,
  finance: normaliseFinance(raw?.finance),
  inventory: normaliseInventory(raw?.inventory),
  activity: Array.isArray(raw?.activity)
    ? raw.activity.map(normaliseActivity)
    : [],
  permitted_actions: Array.isArray(raw?.permitted_actions)
    ? raw.permitted_actions.map(normaliseAction)
    : [],
  manifests: Array.isArray(raw?.manifests) ? raw.manifests : [],
});

const normaliseState = (raw: any): CargoState => ({
  code: String(raw?.code ?? ""),
  internal_label: String(raw?.internal_label ?? ""),
  customer_label: String(raw?.customer_label ?? ""),
  phase: raw?.phase ?? undefined,
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
};

const decisionTone: Record<
  string,
  { bg: string; text: string; ring: string; label: string; icon: typeof CheckCircle2 }
> = {
  APPROVED: {
    bg: "bg-teal/10",
    text: "text-teal-deep",
    ring: "ring-teal/30",
    label: "Approved",
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: "bg-coral/10",
    text: "text-coral",
    ring: "ring-coral/30",
    label: "Rejected",
    icon: XCircle,
  },
  RETURNED: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    label: "Returned",
    icon: FileCheck2,
  },
  CHANGES_REQUESTED: {
    bg: "bg-orange/10",
    text: "text-orange-deep",
    ring: "ring-orange/30",
    label: "Changes requested",
    icon: FileCheck2,
  },
};

const activityKindMeta: Record<
  ActivityEvent["kind"],
  { icon: typeof CheckCircle2; tone: string; label: string }
> = {
  declaration_review: {
    icon: FileCheck2,
    tone: "bg-sky/10 text-sky-deep ring-sky/25",
    label: "Declaration",
  },
  gate: {
    icon: Truck,
    tone: "bg-slate/10 text-slate-deep ring-slate/25",
    label: "Gate",
  },
  receiving: {
    icon: Package,
    tone: "bg-carmine/10 text-carmine ring-carmine/25",
    label: "Receiving",
  },
  placement: {
    icon: MapPin,
    tone: "bg-teal/10 text-teal-deep ring-teal/30",
    label: "Placement",
  },
  examination: {
    icon: ShieldCheck,
    tone: "bg-orange/10 text-orange-deep ring-orange/30",
    label: "Examination",
  },
  invoice: {
    icon: Receipt,
    tone: "bg-sand-2 text-ink-soft ring-line",
    label: "Invoice",
  },
  payment: {
    icon: CreditCard,
    tone: "bg-teal/10 text-teal-deep ring-teal/30",
    label: "Payment",
  },
  hold: {
    icon: ShieldAlert,
    tone: "bg-coral/10 text-coral ring-coral/30",
    label: "Hold",
  },
  release: {
    icon: CheckCircle2,
    tone: "bg-teal/10 text-teal-deep ring-teal/30",
    label: "Release",
  },
  other: {
    icon: Clock3,
    tone: "bg-sand-2 text-ink-soft ring-line",
    label: "Event",
  },
};

const humanise = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : "—";

const formatDateTime = (value: string | null | undefined) =>
  value ? value.slice(0, 16).replace("T", " ") : "—";

const formatMoney = (
  value: number | null | undefined,
  currency = "NGN"
): string => {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

function phaseIndexForStatus(status: string): number {
  const index = PHASES.findIndex((phase) => phase.codes.includes(status));
  return index === -1 ? 0 : index;
}

function ShipmentProgress({
  status,
  customerLabel,
}: {
  status: string;
  customerLabel?: string | undefined;
}) {
  const current = phaseIndexForStatus(status);

  return (
    <section className="rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_1px_3px_0_rgba(0,0,0,0.04)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
            <Hash className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-sm font-bold tracking-tight text-ink">
              Shipment progress
            </h2>
            {customerLabel && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                {customerLabel}
              </p>
            )}
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          Phase {current + 1} / {PHASES.length}
        </span>
      </div>

      <ol className="flex items-start gap-2">
        {PHASES.map((phase, index) => {
          const reached = index <= current;
          const isCurrent = index === current;
          return (
            <li key={phase.key} className="flex min-w-0 flex-1 flex-col gap-2">
              <span
                className={cn(
                  "truncate font-mono text-[10px] uppercase tracking-[0.12em]",
                  isCurrent
                    ? "text-orange-deep"
                    : reached
                    ? "text-ink"
                    : "text-ink-soft"
                )}
              >
                {phase.label}
              </span>
              <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-sand-2">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: reached ? "100%" : "0%" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    isCurrent ? "bg-orange" : "bg-teal"
                  )}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

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

function DecisionPill({ decision }: { decision: string }) {
  const tone = decisionTone[decision] ?? {
    bg: "bg-sand-2",
    text: "text-ink-soft",
    ring: "ring-line",
    label: humanise(decision),
    icon: FileText,
  };
  const Icon = tone.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ring-1 ring-inset",
        tone.bg,
        tone.text,
        tone.ring
      )}
    >
      <Icon className="size-3" />
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

function ReviewerAvatar({ reviewer }: { reviewer: Reviewer | null }) {
  if (!reviewer) {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-ink-soft ring-1 ring-line">
        <User className="size-3.5" />
      </span>
    );
  }

  const initials = reviewer.full_name
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasPhoto = reviewer.pics && !reviewer.pics.endsWith("avatar.png");

  if (hasPhoto) {
    return (
      <img
        src={resolveSrc(reviewer.pics ?? "")}
        alt={reviewer.full_name}
        className="size-8 shrink-0 rounded-full object-cover ring-1 ring-line"
      />
    );
  }

  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-display text-[11px] font-semibold text-sand">
      {initials || "—"}
    </span>
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
  const [showHistory, setShowHistory] = useState(true);
  const [showActivity, setShowActivity] = useState(true);

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
          setConfig({
            states: Array.isArray(states) ? states.map(normaliseState) : [],
          });
        }

        const payload: any =
          shipmentResp.code?.shipment ?? shipmentResp.code ?? {};
        const reviews =
          shipmentResp.code?.reviews ??
          shipmentResp.code?.review_history ??
          payload.reviews ??
          [];
        const latestReviewReason =
          shipmentResp.code?.latest_review_reason ??
          payload.latest_review_reason ??
          null;

        setShipment(
          normaliseShipment({
            ...payload,
            manifests: shipmentResp.code?.manifests ?? payload.manifests ?? [],
            reviews,
            latest_review_reason: latestReviewReason,
          })
        );
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

  const reviews = shipment?.reviews ?? [];
  const activity = shipment?.activity ?? [];
  const finance = shipment?.finance ?? null;
  const inventory = shipment?.inventory ?? null;

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
            onClick={() => navigate("/operations/shipments/review")}
          >
            Back to shipments
          </Button>
        </div>
      </AppShell>
    );
  }

  const reference =
    shipment.shipment_reference ?? `${shipment.id.slice(0, 8)}…`;
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
                onClick={() => navigate("/operations/shipments/review")}
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
                disabled={refreshing}
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

        <ShipmentProgress
          status={shipment.status}
          customerLabel={currentState?.customer_label}
        />

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
                  label="Gross weight (KG)"
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
                <div className="grid gap-4">
                  {shipment.containers.map((container, index) => (
                    <div
                      key={container.id}
                      className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm"
                    >
                      {/* Container Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand/50 px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-lg bg-orange/10 text-orange-deep ring-1 ring-orange/20">
                            <Container className="size-4" />
                          </span>
                          <div>
                            <p className="font-mono text-[14px] font-bold text-ink">
                              {container.container_no || "—"}
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                              Container {index + 1}
                            </p>
                          </div>
                        </div>
                        {container.status && (
                          <StatusPill status={container.status} />
                        )}
                      </div>

                      {/* Container Details */}
                      <div className="grid gap-6 p-5 sm:grid-cols-2">
                        <div className="space-y-4">
                          <Field
                            label="Cargo Description"
                            value={container.cargo_description || container.customs_tariff_description}
                          />
                          <div className="rounded-xl border border-teal/20 bg-teal/5 p-3.5">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-deep" />
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-teal-deep">
                                  Customs / HS Classification
                                </p>
                                <p className="mt-1 font-mono text-[13px] font-bold text-ink">
                                  {container.hs_code || container.tariff_hs_code || "—"}
                                </p>
                                {container.customs_tariff_id && (
                                  <p className="mt-1 font-mono text-[9px] text-ink-soft">
                                    Tariff ID: {container.customs_tariff_id}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <Field label="Size" value={container.size} />
                          <Field label="Seal Number" value={container.seal_no} mono />
                          <Field label="Packages" value={container.package_count} mono />
                          <Field
                            label="Gross Weight"
                            value={container.gross_weight == null ? null : `${container.gross_weight} kg`}
                            mono
                          />
                          <Field label="Unit Value" value={formatMoney(container.unit_value, container.currency || "NGN")} mono />
                          <Field label="Total Value" value={formatMoney(container.total_value, container.currency || "NGN")} mono />
                        </div>
                      </div>

                      {/* Container Timeline */}
                      {(container.gate_in_at || container.received_at || container.stored_at || container.gate_out_at) && (
                        <div className="border-t border-line bg-sand/20 px-5 py-3">
                          <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                            Container Movement
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                            <div>
                              <p className="font-mono text-[8px] uppercase text-ink-soft">Gate In</p>
                              <p className="mt-0.5 text-[11px] text-ink">{formatDateTime(container.gate_in_at)}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[8px] uppercase text-ink-soft">Received</p>
                              <p className="mt-0.5 text-[11px] text-ink">{formatDateTime(container.received_at)}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[8px] uppercase text-ink-soft">Stored</p>
                              <p className="mt-0.5 text-[11px] text-ink">{formatDateTime(container.stored_at)}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[8px] uppercase text-ink-soft">Gate Out</p>
                              <p className="mt-0.5 text-[11px] text-ink">{formatDateTime(container.gate_out_at)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                          href={resolveSrc(document.file_path)}
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

            <Block title="Manifest details" icon={<FileCheck2 className="size-4" />}>
              {shipment.manifests.length === 0 ? (
                <p className="text-sm leading-6 text-ink-soft">
                  No manifest has been linked to this shipment yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {shipment.manifests.map((manifest) => (
                    <div key={manifest.id} className="rounded-xl border border-line p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Manifest reference</p>
                          <h3 className="mt-1 text-base font-bold text-ink">{manifest.manifest_ref || "—"}</h3>
                          <p className="mt-1 font-mono text-[11px] text-ink-soft">{manifest.id}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {manifest.status && <StatusPill status={manifest.status} />}
                          {manifest.review_status && <DecisionPill decision={manifest.review_status.toUpperCase()} />}
                        </div>
                      </div>
                      <div className="grid gap-x-5 gap-y-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Manifest bill of lading" value={manifest.bill_of_lading} />
                        <Field label="Manifest vessel" value={manifest.vessel} />
                        <Field label="Shipping line" value={manifest.shipping_line} />
                        <Field label="Origin port" value={manifest.origin_port} />
                        <Field label="Manifest ETA" value={manifest.eta} />
                        <Field label="Source" value={manifest.source} />
                        <Field label="Consignee" value={manifest.consignee} />
                        <Field label="Consignee type" value={manifest.consignee_type} />
                        <Field label="Consignee status" value={manifest.consignee_status} />
                        <Field label="Consignee email" value={manifest.consignee_email} />
                        <Field label="Consignee phone" value={manifest.consignee_phone} />
                        <Field label="Consignee address" value={manifest.consignee_address} />
                        <Field label="Agent" value={manifest.agent} />
                        <Field label="Packages" value={manifest.packages} />
                        <Field label="Gross weight" value={manifest.gross_weight} />
                        <Field label="Flagged at" value={formatDateTime(manifest.flagged_at)} />
                        <Field label="Validated at" value={formatDateTime(manifest.validated_at)} />
                        <Field label="Received at" value={formatDateTime(manifest.received_at)} />
                        <Field label="Last updated" value={formatDateTime(manifest.updated_at)} />
                        <Field label="Reviewed at" value={formatDateTime(manifest.reviewed_at)} />
                        <Field label="Review responsible party" value={manifest.review_responsible_party} />
                      </div>
                      {(manifest.review_reason || manifest.correction_reason || manifest.notes) && (
                        <div className="space-y-3 border-t border-line pt-4">
                          {manifest.review_reason && <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Review reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{manifest.review_reason}</p></div>}
                          {manifest.correction_reason && <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Correction reason</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{manifest.correction_reason}</p></div>}
                          {manifest.notes && <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Manifest notes</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{manifest.notes}</p></div>}
                        </div>
                      )}
                      {manifest.matches?.length > 0 && (
                        <div className="mt-4 border-t border-line pt-4">
                          <h4 className="text-sm font-semibold text-ink">Shipment matching</h4>
                          <div className="mt-3 space-y-2">
                            {manifest.matches.map((match: any) => (
                              <div key={match.id} className="rounded-lg bg-sand/50 p-3 text-sm">
                                <p className="font-medium text-ink">{humanise(String(match.match_method || "Manual match"))}</p>
                                <p className="mt-1 text-xs text-ink-soft">Matched by {match.matched_by_name || match.matched_by || "—"} · Confirmed by {match.confirmed_by_name || match.confirmed_by || "—"}</p>
                                <p className="mt-1 text-xs text-ink-soft">{formatDateTime(match.matched_at)}</p>
                                {match.notes && <p className="mt-2 text-sm text-ink-soft">{match.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {manifest.containers?.length > 0 && (
                        <div className="mt-4 border-t border-line pt-4">
                          <h4 className="text-sm font-semibold text-ink">Manifest containers</h4>
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[520px] text-left text-sm">
                              <thead><tr className="border-b border-line text-xs text-ink-soft"><th className="px-2 py-2 font-medium">Container</th><th className="px-2 py-2 font-medium">Size</th><th className="px-2 py-2 font-medium">Seal</th><th className="px-2 py-2 font-medium">Packages</th><th className="px-2 py-2 font-medium">Weight</th></tr></thead>
                              <tbody>{manifest.containers.map((container: any, index: number) => <tr key={container.id || index} className="border-b border-line/70"><td className="px-2 py-2 font-mono">{container.container_no || container.container_number || "—"}</td><td className="px-2 py-2">{container.size || container.container_size || "—"}</td><td className="px-2 py-2 font-mono">{container.seal_no || container.seal_number || "—"}</td><td className="px-2 py-2">{container.package_count ?? container.packages ?? "—"}</td><td className="px-2 py-2">{container.gross_weight ?? "—"}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      {manifest.events?.length > 0 && (
                        <div className="mt-4 border-t border-line pt-4">
                          <h4 className="text-sm font-semibold text-ink">Manifest history</h4>
                          <ol className="mt-3 space-y-3 border-l border-line pl-4">
                            {manifest.events.map((event: any) => (
                              <li key={event.id} className="relative">
                                <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-orange" />
                                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-ink">{humanise(String(event.action || "Event"))}</p><span className="font-mono text-[10px] text-ink-soft">{formatDateTime(event.created_at)}</span></div>
                                <p className="mt-1 text-xs text-ink-soft">{event.actor_name || "Operator"}{event.from_status || event.to_status ? ` · ${event.from_status || "—"} → ${event.to_status || "—"}` : ""}</p>
                                {event.details && <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-ink-soft">{String(event.details).startsWith("{") ? (() => { try { const parsed = JSON.parse(event.details); return [parsed.reason, parsed.responsible_party && `Responsible: ${parsed.responsible_party}`].filter(Boolean).join(" · ") || event.details; } catch { return event.details; } })() : event.details}</p>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block
              title="Shipment activity"
              icon={<Clock3 className="size-4" />}
              action={
                activity.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowActivity((v) => !v)}
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
                  >
                    {showActivity ? "Hide" : "Show"}
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform",
                        showActivity && "rotate-180"
                      )}
                    />
                  </button>
                ) : undefined
              }
            >
              {activity.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-sand/40 p-8 text-center">
                  <Clock3 className="mx-auto size-6 text-ink-soft" />
                  <p className="mt-2 text-sm font-medium text-ink">
                    No activity recorded
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Events will appear here as the shipment moves through the
                    terminal.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {showActivity && (
                    <motion.ol
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative space-y-5 overflow-hidden border-l border-line pl-5"
                    >
                      {activity.map((event, index) => {
                        const meta = activityKindMeta[event.kind];
                        const Icon = meta.icon;
                        return (
                          <li key={event.id} className="relative">
                            <span
                              className={cn(
                                "absolute -left-[27px] top-1 grid size-5 place-items-center rounded-full ring-4 ring-paper",
                                index === 0 ? "bg-orange text-white" : "bg-line"
                              )}
                            >
                              {index === 0 && (
                                <span className="size-1.5 rounded-full bg-white" />
                              )}
                            </span>
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
                                  meta.tone
                                )}
                              >
                                <Icon className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <p className="text-[13px] font-semibold text-ink">
                                    {event.title}
                                  </p>
                                  <span className="font-mono text-[10px] text-ink-soft">
                                    {formatDateTime(event.created_at)}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ring-1 ring-inset",
                                      meta.tone
                                    )}
                                  >
                                    {meta.label}
                                  </span>
                                  {event.actor_name && (
                                    <span className="font-mono text-[10px] text-ink-soft">
                                      {event.actor_name}
                                    </span>
                                  )}
                                </div>
                                {event.detail && (
                                  <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-ink-soft">
                                    {event.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </motion.ol>
                  )}
                </AnimatePresence>
              )}
            </Block>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
            <Block title="Applicant" icon={<Building2 className="size-4" />}>
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
                <Field label="Email" value={shipment.consignee_email} mono />
                <Field label="Phone" value={shipment.consignee_phone} mono />
              </div>
            </Block>

            <Block title="Finance" icon={<Banknote className="size-4" />}>
              {!finance ? (
                <p className="rounded-xl border border-dashed border-line bg-sand/40 p-5 text-sm text-ink-soft">
                  No invoice has been raised against this shipment yet.
                </p>
              ) : (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3.5",
                      finance.payment_cleared
                        ? "border-teal/30 bg-teal/5"
                        : "border-orange/30 bg-orange/5"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        finance.payment_cleared
                          ? "bg-teal/15 text-teal-deep"
                          : "bg-orange/15 text-orange-deep"
                      )}
                    >
                      {finance.payment_cleared ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Clock3 className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink">
                        {finance.payment_cleared
                          ? "Payment cleared"
                          : "Payment not cleared"}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                        {finance.payment_cleared && finance.cleared_at
                          ? `Cleared ${formatDate(finance.cleared_at)}`
                          : finance.invoice_status
                          ? humanise(finance.invoice_status)
                          : "Awaiting settlement"}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-4">
                    <Field
                      label="Invoice number"
                      value={finance.invoice_number}
                      mono
                      icon={Receipt}
                    />
                    <Field
                      label="Invoice status"
                      value={
                        finance.invoice_status
                          ? humanise(finance.invoice_status)
                          : null
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Amount due"
                        value={formatMoney(finance.amount_due, finance.currency)}
                        mono
                      />
                      <Field
                        label="Amount paid"
                        value={formatMoney(finance.amount_paid, finance.currency)}
                        mono
                      />
                    </div>
                    <div className="rounded-xl bg-sand/60 p-3.5 ring-1 ring-line">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Balance
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 font-display text-xl font-bold tracking-tight",
                          finance.balance && finance.balance > 0
                            ? "text-coral"
                            : "text-teal-deep"
                        )}
                      >
                        {formatMoney(finance.balance, finance.currency)}
                      </p>
                    </div>
                  </dl>

                  {finance.invoice_url && (
                    <Link
                      to={finance.invoice_url}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-deep hover:underline"
                    >
                      View invoice
                      <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              )}
            </Block>

            <Block
              title="Location & inventory"
              icon={<Warehouse className="size-4" />}
            >
              {!inventory ? (
                <p className="rounded-xl border border-dashed border-line bg-sand/40 p-5 text-sm text-ink-soft">
                  No placement record on file yet.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-line bg-sand/40 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-orange-deep ring-1 ring-line">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                        Current location
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-ink">
                        {inventory.location_label ||
                          humanise(inventory.location_type)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                        {humanise(inventory.location_type)}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-4">
                    <Field
                      label="Placed at"
                      value={formatDateTime(inventory.placed_at)}
                      icon={Clock3}
                    />
                    <Field
                      label="Responsible operator"
                      value={inventory.operator_name}
                      icon={User}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Stock balance"
                        value={inventory.stock_balance}
                        mono
                      />
                      <Field
                        label="Movements"
                        value={inventory.movement_count}
                        mono
                      />
                    </div>
                    <Field
                      label="Last movement"
                      value={formatDateTime(inventory.last_movement_at)}
                    />
                  </dl>
                </div>
              )}
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

            {reviews.length > 0 && (
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
                        {reviews.map((event, index) => (
                          <li key={event.id} className="relative">
                            <span
                              className={cn(
                                "absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-paper",
                                index === 0 ? "bg-orange" : "bg-line"
                              )}
                            />
                            <div className="flex items-start gap-3">
                              <ReviewerAvatar reviewer={event.reviewer} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-ink">
                                    {event.reviewer?.full_name || "Operator"}
                                  </p>
                                  <span className="font-mono text-[10px] text-ink-soft">
                                    {formatDateTime(event.created_at)}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <DecisionPill decision={event.decision} />
                                  {event.from_status && event.to_status && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sand-2 px-2 py-0.5 font-mono text-[10px] text-ink-soft ring-1 ring-line">
                                      {humanise(event.from_status)}
                                      <ArrowRight className="size-2.5" />
                                      {humanise(event.to_status)}
                                    </span>
                                  )}
                                </div>
                                {event.reviewer?.email && (
                                  <p className="mt-1.5 font-mono text-[10px] text-ink-soft">
                                    {event.reviewer.email}
                                  </p>
                                )}
                                {event.reason && (
                                  <p className="mt-2 rounded-lg bg-sand/50 p-3 text-[13px] leading-5 text-ink-soft">
                                    {event.reason}
                                  </p>
                                )}
                              </div>
                            </div>
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

      </div>
    </AppShell>
  );
}