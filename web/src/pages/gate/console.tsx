
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Container,
  LoaderCircle,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type GateDirection = "in" | "out";
type GateDecision = "ADMIT" | "REFER" | "REJECT";

type Readiness = "Ready" | "Needs verification" | "Not ready";

interface QueuedTruck {
  id: string;
  gatePassId: string;
  passCode: string;
  appointmentId: string;
  appointmentRef: string;
  plate: string;
  driverId: string;
  driver: string;
  driverPhone: string;
  company: string;
  appointmentDate: string;
  slotTime: string;
  containerNos: string[];
  consignment: string;
  purpose: string;
  readiness: Readiness;
  notes: string;
  checks: {
    vehicle: boolean;
    driver: boolean;
    appointment: boolean;
    cargo: boolean;
    financial: boolean;
    release: boolean;
  };
  holds: string[];
}

interface GateQueueResponse {
  items?: Record<string, unknown>[];
  queue?: Record<string, unknown>[];
  results?: Record<string, unknown>[];
}

interface GateConsolePageProps {
  direction?: GateDirection;
}

const MAX_ATTEMPTS = 3;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function getString(
  item: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = item[key];

    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  return "";
}

function getBoolean(
  item: Record<string, unknown>,
  ...keys: string[]
): boolean {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
      return ["1", "true", "yes", "passed", "clear", "ready"].includes(
        value.toLowerCase(),
      );
    }
  }

  return false;
}

function getStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    const result: string[] = [];

    for (const entry of value as unknown[]) {
      if (typeof entry === "string" || typeof entry === "number") {
        const text = String(entry).trim();
        if (text) result.push(text);
        continue;
      }

      if (typeof entry === "object" && entry !== null) {
        const item = entry as Record<string, unknown>;
        const container = item["container_no"] ?? item["containerNo"];

        if (typeof container === "string" || typeof container === "number") {
          const text = String(container).trim();
          if (text) result.push(text);
        }
      }
    }

    return result;
  }

  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }

  return [];
}

function normalizeTruck(item: Record<string, unknown>): QueuedTruck {
  const checksValue: unknown = item["checks"];
  const rawChecks: Record<string, unknown> =
    checksValue !== null &&
    typeof checksValue === "object" &&
    !Array.isArray(checksValue)
      ? (checksValue as Record<string, unknown>)
      : {};

  const containers: string[] = getStringArray(
    item["container_nos"] ?? item["containerNos"] ?? item["containers"],
  );

  const readinessValue: string = getString(item, "readiness", "cargo_readiness");
  const normalizedReadiness = readinessValue.trim().toLowerCase();
  const readiness: Readiness =
    normalizedReadiness === "ready"
      ? "Ready"
      : normalizedReadiness === "not ready"
        ? "Not ready"
        : "Needs verification";

  const rawHolds: string[] = getStringArray(
    item["holds"] ?? item["hold_reasons"],
  );

  return {
    id: getString(item, "id", "queue_id", "appointment_id"),
    gatePassId: getString(item, "gate_pass_id", "gatePassId"),
    passCode: getString(item, "pass_code", "passCode"),
    appointmentId: getString(item, "appointment_id", "appointmentId"),
    appointmentRef: getString(
      item,
      "appointment_reference",
      "appointment_ref",
      "appointmentRef",
    ),
    plate: getString(item, "vehicle_plate", "plate", "truck_no"),
    driverId: getString(item, "driver_id", "driverId"),
    driver: getString(item, "driver_name", "driver"),
    driverPhone: getString(item, "driver_phone", "driverPhone"),
    company: getString(item, "transporter", "company", "organisation_name"),
    appointmentDate: getString(item, "appointment_date", "appointmentDate"),
    slotTime: getString(item, "slot_time", "slotTime"),
    containerNos: containers,
    consignment: getString(
      item,
      "shipment_reference",
      "consignment_reference",
      "consignment",
    ),
    purpose: getString(item, "purpose", "type") || "Terminal movement",
    readiness,
    notes: getString(item, "readiness_notes", "notes"),
    checks: {
      vehicle: getBoolean(rawChecks, "vehicle", "vehicle_eligible"),
      driver: getBoolean(rawChecks, "driver", "driver_eligible"),
      appointment: getBoolean(rawChecks, "appointment", "appointment_valid"),
      cargo: getBoolean(rawChecks, "cargo", "cargo_ready"),
      financial: getBoolean(rawChecks, "financial", "financial_clearance"),
      release: getBoolean(rawChecks, "release", "release_authorised"),
    },
    holds: rawHolds,
  };
}

function extractQueue(resp: Resp): QueuedTruck[] {
  const payload = resp.code ?? resp.data;

  if (Array.isArray(payload)) {
    return payload.map((item) =>
      normalizeTruck(item as Record<string, unknown>),
    );
  }

  if (payload && typeof payload === "object") {
    const result = payload as GateQueueResponse;
    const list = result.items ?? result.queue ?? result.results;

    if (Array.isArray(list)) {
      return list.map(normalizeTruck);
    }
  }

  return [];
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function GateConsolePage({
  direction,
}: GateConsolePageProps = {}) {
  const location = useLocation();

  const resolvedDirection: GateDirection =
    direction ?? (location.pathname.endsWith("/out") ? "out" : "in");

  return (
    <GateConsole
      key={resolvedDirection}
      direction={resolvedDirection}
    />
  );
}

export function GateInPage() {
  return <GateConsolePage direction="in" />;
}

export function GateOutPage() {
  return <GateConsolePage direction="out" />;
}

function GateConsole({ direction }: { direction: GateDirection }) {
  const isGateIn = direction === "in";

  const queueEndpoint = isGateIn
    ? "gate/in/queue/"
    : "gate/out/queue/";

  const [queue, setQueue] = useState<QueuedTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<QueuedTruck | null>(null);

  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [supervisorApprovalRef, setSupervisorApprovalRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [filter, setFilter] = useState("ALL");
  const requestRef = useRef(0);
  const submitLock = useRef(false);

  const loadQueue = useCallback(async (manual = false) => {
    const requestId = ++requestRef.current;

    if (manual) setRetrying(true);
    else setLoading(true);

    setLoadError(null);

    let message = "Could not load the gate queue.";

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const response = await http.get(queueEndpoint);
          const resp: Resp = response.data;

          if (resp.error) {
            throw new Error(String(resp.data || message));
          }

          const result = extractQueue(resp);

          if (requestRef.current === requestId) {
            setQueue(result);
            setLoadError(null);
          }

          return;
        } catch (error: unknown) {
          message =
            error instanceof Error ? error.message : message;

          if (attempt < MAX_ATTEMPTS) {
            await wait(attempt * 1000);
          }
        }
      }

      if (requestRef.current === requestId) {
        setLoadError(message);
      }

      toast.error("Unable to load the queue after 3 attempts.");
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
        setRetrying(false);
      }
    }
  }, [queueEndpoint]);

  useEffect(() => {
    void loadQueue();

    return () => {
      requestRef.current++;
    };
  }, [loadQueue]);

  const filteredQueue = useMemo(() => {
    const query = search.trim().toLowerCase();

    return queue.filter((truck) => {
      const matchesQuery =
        !query ||
        [
          truck.plate,
          truck.passCode,
          truck.appointmentRef,
          truck.driver,
          truck.driverPhone,
          truck.consignment,
          ...truck.containerNos,
        ].some((value) => value.toLowerCase().includes(query));

      const matchesFilter =
        filter === "ALL" ||
        truck.readiness.toLowerCase() === filter.toLowerCase();

      return matchesQuery && matchesFilter;
    });
  }, [queue, search, filter]);

  const readyCount = queue.filter(
    (truck) => truck.readiness === "Ready",
  ).length;

  const verificationCount = queue.filter(
    (truck) => truck.readiness === "Needs verification",
  ).length;

  const blockedCount = queue.filter(
    (truck) => truck.readiness === "Not ready",
  ).length;

  const clearActive = () => {
    if (submitting) return;

    setActive(null);
    setDecision(null);
    setDecisionReason("");
    setOverrideReason("");
    setSupervisorApprovalRef("");
    setLookupError(null);
  };

  const findTruck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();

    if (query.length < 2) {
      toast.error("Enter a vehicle plate or gate-pass reference.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await http.post("gate/passes/verify/", {direction,q: query});

      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(
          String(resp.data || "No matching booking or gate pass found."),
        );
      }

      if (!resp.code || typeof resp.code !== "object") {
        throw new Error("The verification API returned no pass details.");
      }

      const truck = normalizeTruck(
        resp.code as Record<string, unknown>,
      );

      if (!truck.id) {
        throw new Error("The verification response is missing its record ID.");
      }

      setActive(truck);
      setDecision(null);
      setDecisionReason("");
      setOverrideReason("");
      setSupervisorApprovalRef("");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not verify the gate pass.";

      setLookupError(message);
      toast.error(message);
    } finally {
      setLookupLoading(false);
    }
  };

  const submitDecision = async () => {
    if (!active || !decision || submitLock.current) return;

    if (
      (decision === "REFER" || decision === "REJECT") &&
      decisionReason.trim().length < 5
    ) {
      toast.error("Provide a reason of at least 5 characters.");
      return;
    }

    const overrideNeeded =
      decision === "ADMIT" &&
      active.readiness !== "Ready";

    if (overrideNeeded && overrideReason.trim().length < 5) {
      toast.error("A supervisor override reason is required.");
      return;
    }

    if (overrideNeeded && !supervisorApprovalRef.trim()) {
      toast.error("Enter the supervisor approval reference.");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      const response = await http.post("gate/decision/", {
        direction,
        record_id: active.id,
        gate_pass_id: active.gatePassId,
        pass_code: active.passCode,
        decision,
        reason: decisionReason.trim(),
        override_reason: overrideReason.trim(),
        supervisor_approval_ref: supervisorApprovalRef.trim(),
      });

      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(
          String(resp.data || "The gate decision was not accepted."),
        );
      }

      toast.success(
        resp.data
          ? String(resp.data)
          : `${decision} recorded successfully.`,
      );

      setActive(null);
      setDecision(null);
      setDecisionReason("");
      setOverrideReason("");
      setSupervisorApprovalRef("");

      await loadQueue(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not record the gate decision.";

      toast.error(message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const allGateInChecksPassed =
    active?.checks.vehicle &&
    active?.checks.driver &&
    active?.checks.appointment &&
    active?.checks.cargo;

  const allGateOutChecksPassed =
    active?.checks.vehicle &&
    active?.checks.driver &&
    active?.checks.release &&
    active?.checks.financial;

  const checksPassed = isGateIn
    ? Boolean(allGateInChecksPassed)
    : Boolean(allGateOutChecksPassed);

  return (
    <AppShell
      title={isGateIn ? "Gate In" : "Gate Out"}
      eyebrow={
        isGateIn
          ? "Gate Control · Inbound"
          : "Gate Control · Outbound"
      }
    >
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Gate control · {isGateIn ? "Inbound" : "Outbound"}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
              {isGateIn
                ? "Verify and admit vehicles"
                : "Verify and clear departures"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              {isGateIn
                ? "Verify the pass, appointment, vehicle, driver and cargo readiness before admission."
                : "Verify release authority, applicable clearances, seals and loaded quantities before departure."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={loading || retrying}
              onClick={() => void loadQueue(true)}
              className="border-line bg-paper text-ink"
            >
              {loading || retrying ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Refresh queue
            </Button>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <GateStat
            label="Queue"
            value={String(queue.length)}
            detail="Records returned by server"
            icon={Truck}
            tone="info"
          />
          <GateStat
            label="Ready"
            value={String(readyCount)}
            detail="Marked ready by the server"
            icon={ShieldCheck}
            tone="success"
          />
          <GateStat
            label="Needs verification"
            value={String(verificationCount)}
            detail="Review before proceeding"
            icon={Clock3}
            tone="warning"
          />
          <GateStat
            label="Not ready"
            value={String(blockedCount)}
            detail="Resolve blockers"
            icon={ShieldAlert}
            tone="critical"
          />
        </div>

        <section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep">
              <ScanLine className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">
                Verify gate pass or vehicle
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                Scan a QR code using your scanner integration, or enter the
                pass reference or plate below.
              </p>
            </div>
          </div>

          <form
            onSubmit={findTruck}
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
          >
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter pass reference or vehicle plate"
              className="h-12 border-line bg-sand font-mono text-sm uppercase text-ink"
            />
            <Button
              type="submit"
              disabled={lookupLoading}
              className="h-12 bg-orange px-5 text-white hover:bg-orange-deep"
            >
              {lookupLoading ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              Verify
            </Button>
          </form>

          {lookupError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{lookupError}</p>
            </div>
          )}
        </section>

        {active ? (
          <section className="rounded-xl bg-paper ring-1 ring-line">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                  Verified movement record
                </p>
                <h3 className="mt-1 font-display text-lg font-bold text-ink">
                  {active.plate || "Vehicle"}
                </h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Pass: {active.passCode || "Not returned"}
                </p>
              </div>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={clearActive}
                className="border-line bg-paper text-ink"
              >
                <X className="mr-2 size-4" />
                Close review
              </Button>
            </header>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Detail label="Driver" value={active.driver} />
                  <Detail label="Driver phone" value={active.driverPhone} />
                  <Detail label="Transporter" value={active.company} />
                  <Detail label="Appointment" value={active.appointmentRef} />
                  <Detail
                    label="Appointment date"
                    value={formatDate(active.appointmentDate)}
                  />
                  <Detail label="Slot" value={active.slotTime} />
                  <Detail label="Consignment" value={active.consignment} />
                  <Detail label="Purpose" value={active.purpose} />
                </div>

                <div className="border-t border-line pt-4">
                  <h4 className="flex items-center gap-2 font-semibold text-ink">
                    <Container className="size-4" />
                    Containers ({active.containerNos.length})
                  </h4>

                  {active.containerNos.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.containerNos.map((container, index) => (
                        <span
                          key={`${container}-${index}`}
                          className="rounded-md border border-line bg-sand px-3 py-2 font-mono text-xs text-ink"
                        >
                          {container}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-soft">
                      No containers were returned by the server.
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-sand p-4">
                  <p className="text-sm font-semibold text-ink">
                    Server readiness
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      label={active.readiness}
                      tone={statusTone(active.readiness)}
                    />
                  </div>
                  {active.notes && (
                    <p className="mt-2 text-sm text-ink-soft">
                      {active.notes}
                    </p>
                  )}
                  {active.holds.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-red-700">
                        Recorded holds
                      </p>
                      {active.holds.map((hold, index) => (
                        <p
                          key={`${hold}-${index}`}
                          className="text-xs text-red-700"
                        >
                          • {hold}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-line p-4">
                  <p className="text-sm font-semibold text-ink">
                    Verification results
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(
                      isGateIn
                        ? ([
                            ["Vehicle eligible", active.checks.vehicle],
                            ["Driver eligible", active.checks.driver],
                            ["Appointment valid", active.checks.appointment],
                            ["Cargo ready", active.checks.cargo],
                          ] as Array<[string, boolean]>)
                        : ([
                            ["Vehicle eligible", active.checks.vehicle],
                            ["Driver eligible", active.checks.driver],
                            ["Release authorised", active.checks.release],
                            ["Financial clearance", active.checks.financial],
                          ] as Array<[string, boolean]>)
                    ).map(([label, passed]) => (
                      <div
                        key={String(label)}
                        className="flex items-center gap-2 text-xs"
                      >
                        {passed ? (
                          <ShieldCheck className="size-4 text-teal-deep" />
                        ) : (
                          <AlertTriangle className="size-4 text-orange-deep" />
                        )}
                        <span className="text-ink">{String(label)}</span>
                        <span className="ml-auto text-ink-soft">
                          {passed ? "Passed" : "Unverified"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-ink-soft">
                    These are the results returned by the verification API.
                    The server must revalidate them when saving a decision.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                    Gate decision
                  </p>
                  <div className="mt-3 grid gap-2">
                    <DecisionButton
                      label="ADMIT"
                      detail={
                        isGateIn
                          ? "Record entry into the terminal."
                          : "Record authorised departure."
                      }
                      icon={Check}
                      tone="success"
                      active={decision === "ADMIT"}
                      onClick={() => setDecision("ADMIT")}
                    />
                    <DecisionButton
                      label="REFER"
                      detail="Send the movement for further verification."
                      icon={AlertTriangle}
                      tone="warning"
                      active={decision === "REFER"}
                      onClick={() => setDecision("REFER")}
                    />
                    <DecisionButton
                      label="REJECT"
                      detail="Reject the attempted movement with a reason."
                      icon={X}
                      tone="critical"
                      active={decision === "REJECT"}
                      onClick={() => setDecision("REJECT")}
                    />
                  </div>
                </div>

                {(decision === "REFER" || decision === "REJECT") && (
                  <label className="block">
                    <span className="text-xs font-semibold text-ink">
                      {decision === "REFER"
                        ? "Reason for referral"
                        : "Reason for rejection"}
                    </span>
                    <textarea
                      value={decisionReason}
                      onChange={(event) =>
                        setDecisionReason(event.target.value)
                      }
                      minLength={5}
                      maxLength={1000}
                      required
                      placeholder="Explain the issue for the audit record..."
                      className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
                    />
                  </label>
                )}

                {decision === "ADMIT" && active.readiness !== "Ready" && (
                  <div className="space-y-3 rounded-xl border border-orange/30 bg-orange/5 p-4">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Supervisor approval required
                        </p>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          A reason alone is not approval. The server must
                          verify the supervisor's authority and approval
                          reference before accepting an override.
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="text-xs font-semibold text-ink">
                        Override reason
                      </span>
                      <textarea
                        value={overrideReason}
                        onChange={(event) =>
                          setOverrideReason(event.target.value)
                        }
                        minLength={5}
                        maxLength={1000}
                        className="mt-2 min-h-20 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
                        placeholder="Explain the exceptional circumstances..."
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-ink">
                        Supervisor approval reference
                      </span>
                      <Input
                        value={supervisorApprovalRef}
                        onChange={(event) =>
                          setSupervisorApprovalRef(event.target.value)
                        }
                        maxLength={100}
                        className="mt-2 border-line bg-paper text-ink"
                        placeholder="Enter approved reference"
                      />
                    </label>
                  </div>
                )}

                {decision === "ADMIT" && active.readiness === "Ready" && !checksPassed && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    One or more required verification checks have not passed.
                    The backend must block admission or departure unless a
                    permitted, supervisor-approved exception applies.
                  </div>
                )}

                <Button
                  className={cn(
                    "h-11 w-full text-white",
                    decision === "REJECT"
                      ? "bg-coral hover:bg-coral/90"
                      : decision === "REFER"
                        ? "bg-orange hover:bg-orange-deep"
                        : "bg-teal-deep hover:bg-teal-deep/90",
                  )}
                  disabled={
                    !decision ||
                    submitting ||
                    (decision === "REFER" && decisionReason.trim().length < 5) ||
                    (decision === "REJECT" && decisionReason.trim().length < 5) ||
                    (decision === "ADMIT" &&
                      active.readiness !== "Ready" &&
                      (overrideReason.trim().length < 5 ||
                        !supervisorApprovalRef.trim()))
                  }
                  onClick={() => void submitDecision()}
                >
                  {submitting ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 size-4" />
                  )}
                  {submitting
                    ? "Recording decision..."
                    : decision
                      ? `Confirm ${decision}`
                      : "Select a decision"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-line bg-paper text-ink"
                  disabled={submitting}
                  onClick={clearActive}
                >
                  Cancel review
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
              <div>
                <h3 className="font-semibold text-ink">
                  {isGateIn ? "Inbound queue" : "Outbound queue"}
                </h3>
                <p className="mt-1 text-xs text-ink-soft">
                  {filteredQueue.length} matching records
                </p>
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-9 rounded-md border border-line bg-sand px-3 text-sm text-ink"
              >
                <option value="ALL">All readiness</option>
                <option value="Ready">Ready</option>
                <option value="Needs verification">Needs verification</option>
                <option value="Not ready">Not ready</option>
              </select>
            </div>

            <div className="border-b border-line p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter loaded queue by plate, driver, pass or container..."
                  className="border-line bg-sand pl-9 text-sm text-ink"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-ink-soft">
                <LoaderCircle className="mx-auto mb-3 size-6 animate-spin" />
                Loading live queue...
              </div>
            ) : loadError ? (
              <div className="p-10 text-center">
                <AlertTriangle className="mx-auto mb-3 size-7 text-red-500" />
                <p className="font-semibold text-ink">
                  Could not load the gate queue
                </p>
                <p className="mt-2 text-sm text-ink-soft">{loadError}</p>
                <Button
                  variant="outline"
                  disabled={retrying}
                  onClick={() => void loadQueue(true)}
                  className="mt-4 border-line bg-paper text-ink"
                >
                  {retrying ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Try Again
                </Button>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="mx-auto size-7 text-ink-soft" />
                <p className="mt-3 font-semibold text-ink">
                  No matching movements
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Try another filter or verify a pass using the search above.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {filteredQueue.map((truck) => (
                  <li
                    key={truck.id}
                    className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-sand/40 sm:px-5"
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                      <Truck className="size-5" />
                    </div>

                    <div className="min-w-[200px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-ink">
                          {truck.plate || "Plate unavailable"}
                        </p>
                        <StatusBadge
                          label={truck.readiness}
                          tone={statusTone(truck.readiness)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {truck.driver || "Driver unavailable"}
                        {truck.company ? ` · ${truck.company}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-ink-soft">
                        {truck.passCode || truck.appointmentRef || "No reference"}
                        {truck.slotTime ? ` · ${truck.slotTime}` : ""}
                      </p>
                    </div>

                    <div className="min-w-[170px]">
                      <p className="text-xs text-ink-soft">
                        Containers ({truck.containerNos.length})
                      </p>
                      <p className="mt-1 font-mono text-xs text-ink">
                        {truck.containerNos.slice(0, 2).join(", ") || "—"}
                        {truck.containerNos.length > 2
                          ? ` +${truck.containerNos.length - 2} more`
                          : ""}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      disabled={!truck.id}
                      className="ml-auto border-line bg-paper text-ink"
                      onClick={() => {
                        setActive(truck);
                        setDecision(null);
                        setDecisionReason("");
                        setOverrideReason("");
                        setSupervisorApprovalRef("");
                      }}
                    >
                      Review
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">
        {value || "—"}
      </p>
    </div>
  );
}

function DecisionButton({
  label,
  detail,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  detail: string;
  icon: LucideIcon;
  tone: "success" | "warning" | "critical";
  active: boolean;
  onClick: () => void;
}) {
  const classes = {
    success: active
      ? "border-teal bg-teal/10 ring-1 ring-teal/30"
      : "border-line bg-sand hover:bg-sand-2",
    warning: active
      ? "border-orange bg-orange/10 ring-1 ring-orange/30"
      : "border-line bg-sand hover:bg-sand-2",
    critical: active
      ? "border-coral bg-coral/10 ring-1 ring-coral/30"
      : "border-line bg-sand hover:bg-sand-2",
  };

  const iconClasses = {
    success: "text-teal-deep",
    warning: "text-orange-deep",
    critical: "text-coral",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        classes[tone],
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md bg-paper ring-1 ring-line",
          iconClasses[tone],
        )}
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block font-mono text-xs font-semibold text-ink">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-ink-soft">
          {detail}
        </span>
      </span>
    </button>
  );
}

function GateStat({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "info" | "success" | "warning" | "critical";
}) {
  const colors = {
    info: "text-ink-soft",
    success: "text-teal-deep",
    warning: "text-orange-deep",
    critical: "text-coral",
  };

  return (
    <div className="rounded-xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </span>
        <Icon className={cn("size-4", colors[tone])} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
    </div>
  );
}
