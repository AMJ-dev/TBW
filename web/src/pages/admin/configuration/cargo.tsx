import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@/components/router-link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Bell,
  Check,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  GitBranch,
  History,
  Layers,
  LockKeyhole,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

interface StateRow {
  id: string;
  code: string;
  internalLabel: string;
  customerLabel: string;
  terminal: boolean;
  active: boolean;
  system: boolean;
}

interface TransitionRule {
  id: string;
  from: string;
  to: string;
  requiresHoldClear: boolean;
  requiresDocs: boolean;
  requiresFinancialClearance: boolean;
  requiresAuthorityReference: boolean;
  notifies: boolean;
  active: boolean;
}

interface LifecycleBehaviour {
  autoNotifyOnTransition: boolean;
  allowBulkTransitions: boolean;
  splitMergePreservesLineage: boolean;
  pauseStorageOnHold: boolean;
  trackContainerLevel: boolean;
  trackPackageLevel: boolean;
}

interface HoldPolicy {
  id: string;
  type: string;
  authorityRequired: boolean;
  referenceRequired: boolean;
  releaseReasonRequired: boolean;
  enabled: boolean;
}

interface CargoConfig {
  states: StateRow[];
  transitions: TransitionRule[];
  behaviour: LifecycleBehaviour;
  holdPolicies: HoldPolicy[];
  requireDocsForRelease: boolean;
  requireNoActiveHolds: boolean;
  requireFinancialClearance: boolean;
  allowApprovedCreditOrWaiver: boolean;
  requireGateVerification: boolean;
}

const emptyConfig: CargoConfig = {
  states: [],
  transitions: [],
  behaviour: {
    autoNotifyOnTransition: true,
    allowBulkTransitions: true,
    splitMergePreservesLineage: true,
    pauseStorageOnHold: false,
    trackContainerLevel: true,
    trackPackageLevel: true,
  },
  holdPolicies: [],
  requireDocsForRelease: true,
  requireNoActiveHolds: true,
  requireFinancialClearance: true,
  allowApprovedCreditOrWaiver: true,
  requireGateVerification: true,
};

const tabs = [
  { id: "states", label: "Cargo states", icon: Layers },
  { id: "transitions", label: "Transitions", icon: ArrowRightLeft },
  { id: "holds", label: "Holds & release", icon: LockKeyhole },
  { id: "behaviour", label: "Lifecycle behaviour", icon: Activity },
  { id: "audit", label: "Audit preview", icon: History },
] as const;

type TabId = (typeof tabs)[number]["id"];

const normaliseState = (raw: any): StateRow => ({
  id: String(raw?.id ?? raw?.code ?? crypto.randomUUID()),
  code: String(raw?.code ?? ""),
  internalLabel: raw?.internal_label ?? raw?.internalLabel ?? "",
  customerLabel: raw?.customer_label ?? raw?.customerLabel ?? "",
  terminal: Boolean(raw?.terminal ?? false),
  active: Boolean(raw?.active ?? true),
  system: Boolean(raw?.system ?? false),
});

const normaliseTransition = (raw: any): TransitionRule => ({
  id: String(raw?.id ?? `${raw?.from}-${raw?.to}-${crypto.randomUUID()}`),
  from: String(raw?.from ?? ""),
  to: String(raw?.to ?? ""),
  requiresHoldClear: Boolean(
    raw?.requires_hold_clear ?? raw?.requiresHoldClear ?? false
  ),
  requiresDocs: Boolean(raw?.requires_docs ?? raw?.requiresDocs ?? false),
  requiresFinancialClearance: Boolean(
    raw?.requires_financial_clearance ??
      raw?.requiresFinancialClearance ??
      false
  ),
  requiresAuthorityReference: Boolean(
    raw?.requires_authority_reference ??
      raw?.requiresAuthorityReference ??
      false
  ),
  notifies: Boolean(raw?.notifies ?? true),
  active: Boolean(raw?.active ?? true),
});

const normaliseHoldPolicy = (raw: any): HoldPolicy => ({
  id: String(raw?.id ?? raw?.type ?? crypto.randomUUID()),
  type: String(raw?.type ?? ""),
  authorityRequired: Boolean(
    raw?.authority_required ?? raw?.authorityRequired ?? false
  ),
  referenceRequired: Boolean(
    raw?.reference_required ?? raw?.referenceRequired ?? false
  ),
  releaseReasonRequired: Boolean(
    raw?.release_reason_required ?? raw?.releaseReasonRequired ?? true
  ),
  enabled: Boolean(raw?.enabled ?? true),
});

export default function AdminCargoConfigurationPage() {
  const [config, setConfig] = useState<CargoConfig>(emptyConfig);
  const [savedConfig, setSavedConfig] = useState<CargoConfig>(emptyConfig);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<TabId>("states");
  const [stateSearch, setStateSearch] = useState("");
  const [transitionSearch, setTransitionSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showAddTransition, setShowAddTransition] = useState(false);
  const [newTransition, setNewTransition] = useState({
    from: "",
    to: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/config/cargo/");
      const resp: Resp = res.data;
      if (resp.error) {
        setError(resp.data || "Could not load cargo configuration.");
        return;
      }
      const payload: any = resp.code ?? {};

      const rawStates: any[] = Array.isArray(payload.states) ? payload.states : [];
      const rawTransitions: any[] = Array.isArray(payload.transitions)
        ? payload.transitions
        : [];
      const rawHolds: any[] = Array.isArray(payload.hold_policies)
        ? payload.hold_policies
        : Array.isArray(payload.holdPolicies)
          ? payload.holdPolicies
          : [];

      const behaviourRaw = payload.behaviour ?? payload.behavior ?? {};

      const loaded: CargoConfig = {
        states: rawStates.map(normaliseState),
        transitions: rawTransitions.map(normaliseTransition),
        behaviour: {
          autoNotifyOnTransition: Boolean(
            behaviourRaw.auto_notify_on_transition ??
              behaviourRaw.autoNotifyOnTransition ??
              true
          ),
          allowBulkTransitions: Boolean(
            behaviourRaw.allow_bulk_transitions ??
              behaviourRaw.allowBulkTransitions ??
              true
          ),
          splitMergePreservesLineage: Boolean(
            behaviourRaw.split_merge_preserves_lineage ??
              behaviourRaw.splitMergePreservesLineage ??
              true
          ),
          pauseStorageOnHold: Boolean(
            behaviourRaw.pause_storage_on_hold ??
              behaviourRaw.pauseStorageOnHold ??
              false
          ),
          trackContainerLevel: Boolean(
            behaviourRaw.track_container_level ??
              behaviourRaw.trackContainerLevel ??
              true
          ),
          trackPackageLevel: Boolean(
            behaviourRaw.track_package_level ??
              behaviourRaw.trackPackageLevel ??
              true
          ),
        },
        holdPolicies: rawHolds.map(normaliseHoldPolicy),
        requireDocsForRelease: Boolean(
          payload.require_docs_for_release ??
            payload.requireDocsForRelease ??
            true
        ),
        requireNoActiveHolds: Boolean(
          payload.require_no_active_holds ??
            payload.requireNoActiveHolds ??
            true
        ),
        requireFinancialClearance: Boolean(
          payload.require_financial_clearance ??
            payload.requireFinancialClearance ??
            true
        ),
        allowApprovedCreditOrWaiver: Boolean(
          payload.allow_approved_credit_or_waiver ??
            payload.allowApprovedCreditOrWaiver ??
            true
        ),
        requireGateVerification: Boolean(
          payload.require_gate_verification ??
            payload.requireGateVerification ??
            true
        ),
      };

      setConfig(loaded);
      setSavedConfig(loaded);
      setDirty(false);

      const first = loaded.states.find((s) => s.active)?.code ?? "";
      const second =
        loaded.states.filter((s) => s.active)[1]?.code ?? "";
      setNewTransition({ from: first, to: second });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not load cargo configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markDirty = () => setDirty(true);

  const updateState = (id: string, patch: Partial<StateRow>) => {
    setConfig((prev) => ({
      ...prev,
      states: prev.states.map((state) =>
        state.id === id ? { ...state, ...patch } : state
      ),
    }));
    markDirty();
  };

  const addState = () => {
    const code = `CUSTOM_STATE_${config.states.length + 1}`;
    setConfig((prev) => ({
      ...prev,
      states: [
        ...prev.states,
        {
          id: `s-${Date.now()}`,
          code,
          internalLabel: "New state",
          customerLabel: "New status",
          terminal: false,
          active: true,
          system: false,
        },
      ],
    }));
    markDirty();
    toast.message("Custom state added. Review its code and labels before saving.");
  };

  const removeState = (id: string) => {
    const state = config.states.find((item) => item.id === id);
    if (!state || state.system) {
      toast.error(
        "Standard lifecycle states cannot be deleted. Deactivate a custom state if needed."
      );
      return;
    }
    if (
      config.transitions.some(
        (item) => item.from === state.code || item.to === state.code
      )
    ) {
      toast.error(
        "This state is referenced by a transition. Remove or update those rules first."
      );
      return;
    }
    setConfig((prev) => ({
      ...prev,
      states: prev.states.filter((item) => item.id !== id),
    }));
    markDirty();
  };

  const updateTransition = (id: string, patch: Partial<TransitionRule>) => {
    setConfig((prev) => ({
      ...prev,
      transitions: prev.transitions.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
    markDirty();
  };

  const addTransition = () => {
    const from = newTransition.from;
    const to = newTransition.to;
    if (!from || !to || from === to) {
      toast.error("Choose two different states for a transition.");
      return;
    }
    if (
      config.transitions.some(
        (item) => item.from === from && item.to === to
      )
    ) {
      toast.error("That transition already exists.");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      transitions: [
        ...prev.transitions,
        {
          id: `t-${Date.now()}`,
          from,
          to,
          requiresHoldClear: true,
          requiresDocs: false,
          requiresFinancialClearance: false,
          requiresAuthorityReference: false,
          notifies: true,
          active: true,
        },
      ],
    }));
    setShowAddTransition(false);
    markDirty();
  };

  const removeTransition = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((item) => item.id !== id),
    }));
    markDirty();
  };

  const updateBehaviour = <K extends keyof LifecycleBehaviour>(
    key: K,
    value: LifecycleBehaviour[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      behaviour: { ...prev.behaviour, [key]: value },
    }));
    markDirty();
  };

  const updateHoldPolicy = (id: string, patch: Partial<HoldPolicy>) => {
    setConfig((prev) => ({
      ...prev,
      holdPolicies: prev.holdPolicies.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
    markDirty();
  };

  const updateReleasePolicy = (
    key: keyof Pick<
      CargoConfig,
      | "requireDocsForRelease"
      | "requireNoActiveHolds"
      | "requireFinancialClearance"
      | "allowApprovedCreditOrWaiver"
      | "requireGateVerification"
    >,
    value: boolean
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const activeStates = config.states.filter((state) => state.active);
    const codes = activeStates.map((state) => state.code.trim().toUpperCase());
    if (
      activeStates.some(
        (state) =>
          !state.code.trim() ||
          !state.internalLabel.trim() ||
          !state.customerLabel.trim()
      )
    )
      errors.push("Every active state must have a code and both labels.");
    if (new Set(codes).size !== codes.length)
      errors.push("Active state codes must be unique.");
    for (const transition of config.transitions.filter((item) => item.active)) {
      if (transition.from === transition.to)
        errors.push(
          `Transition ${transition.from} → ${transition.to} points to the same state.`
        );
      if (
        !activeStates.some((state) => state.code === transition.from) ||
        !activeStates.some((state) => state.code === transition.to)
      )
        errors.push(
          `Transition ${transition.from} → ${transition.to} references an inactive or missing state.`
        );
    }
    const transitionKeys = config.transitions
      .filter((item) => item.active)
      .map((item) => `${item.from}::${item.to}`);
    if (new Set(transitionKeys).size !== transitionKeys.length)
      errors.push("Active transition rules must be unique.");
    if (!config.requireNoActiveHolds)
      errors.push(
        "Release authorisation is not configured to require all holds to be cleared."
      );
    if (!config.requireGateVerification)
      errors.push("Independent gate verification is disabled.");
    return [...new Set(errors)];
  }, [config]);

  const filteredStates = config.states.filter(
    (state) =>
      (showInactive || state.active) &&
      `${state.code} ${state.internalLabel} ${state.customerLabel}`
        .toLowerCase()
        .includes(stateSearch.toLowerCase())
  );
  const filteredTransitions = config.transitions.filter(
    (transition) =>
      (showInactive || transition.active) &&
      `${transition.from} ${transition.to}`
        .toLowerCase()
        .includes(transitionSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!dirty || saving) return;
    if (validationErrors.length) {
      toast.error("Review the configuration issues before saving.");
      if (activeTab === "states") setActiveTab("states");
      else if (
        validationErrors.some((error) =>
          error.toLowerCase().includes("transition")
        )
      )
        setActiveTab("transitions");
      else setActiveTab("holds");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        states: config.states.map((state) => ({
          id: state.id,
          code: state.code.trim().toUpperCase(),
          internal_label: state.internalLabel.trim(),
          customer_label: state.customerLabel.trim(),
          terminal: state.terminal,
          active: state.active,
        })),
        transitions: config.transitions.map((t) => ({
          id: t.id,
          from: t.from,
          to: t.to,
          requires_hold_clear: t.requiresHoldClear,
          requires_docs: t.requiresDocs,
          requires_financial_clearance: t.requiresFinancialClearance,
          requires_authority_reference: t.requiresAuthorityReference,
          notifies: t.notifies,
          active: t.active,
        })),
        behaviour: {
          auto_notify_on_transition: config.behaviour.autoNotifyOnTransition,
          allow_bulk_transitions: config.behaviour.allowBulkTransitions,
          split_merge_preserves_lineage:
            config.behaviour.splitMergePreservesLineage,
          pause_storage_on_hold: config.behaviour.pauseStorageOnHold,
          track_container_level: config.behaviour.trackContainerLevel,
          track_package_level: config.behaviour.trackPackageLevel,
        },
        hold_policies: config.holdPolicies.map((p) => ({
          id: p.id,
          type: p.type,
          authority_required: p.authorityRequired,
          reference_required: p.referenceRequired,
          release_reason_required: p.releaseReasonRequired,
          enabled: p.enabled,
        })),
        require_docs_for_release: config.requireDocsForRelease,
        require_no_active_holds: config.requireNoActiveHolds,
        require_financial_clearance: config.requireFinancialClearance,
        allow_approved_credit_or_waiver: config.allowApprovedCreditOrWaiver,
        require_gate_verification: config.requireGateVerification,
      };

      const res = await http.post("/admin/config/cargo/update/", payload);
      const resp: Resp = res.data;
      if (resp.error) {
        toast.error(resp.data || "Could not save the cargo configuration.");
        return;
      }
      toast.success("Cargo configuration saved. Change logged.");
      await fetchAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Could not save the cargo configuration."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    await fetchAll();
    toast.message("Changes discarded.");
  };

  const activeStateCount = config.states.filter((state) => state.active).length;
  const activeTransitionCount = config.transitions.filter(
    (transition) => transition.active
  ).length;
  const terminalStateCount = config.states.filter(
    (state) => state.active && state.terminal
  ).length;

  if (loading) {
    return (
      <AppShell title="Cargo & Lifecycle" eyebrow="Administration · Configuration">
        <div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
          <span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Cargo & Lifecycle" eyebrow="Administration · Configuration">
        <div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">
                Could not load cargo configuration
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{error}</p>
            </div>
          </div>
          <div className="mt-5">
            <Button
              onClick={() => void fetchAll()}
              className="bg-orange text-white hover:bg-orange-deep"
            >
              Try again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Cargo & Lifecycle" eyebrow="Administration · Configuration">
      <div className="space-y-6 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/admin/configuration"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
            >
              <ArrowLeft className="size-3.5" /> Back to configuration
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Cargo &amp; Lifecycle
              </h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
              Configure cargo states, permitted transitions, hold requirements,
              release checks and lifecycle behaviour. Every change is logged.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Layers}
            label="Active states"
            value={String(activeStateCount).padStart(2, "0")}
            detail="Configured lifecycle states"
          />
          <MetricCard
            icon={ArrowRightLeft}
            label="Active transitions"
            value={String(activeTransitionCount).padStart(2, "0")}
            detail="Permitted state changes"
          />
          <MetricCard
            icon={LockKeyhole}
            label="Hold categories"
            value={String(
              config.holdPolicies.filter((item) => item.enabled).length
            ).padStart(2, "0")}
            detail="Configured hold controls"
          />
          <MetricCard
            icon={ShieldCheck}
            label="Terminal states"
            value={String(terminalStateCount).padStart(2, "0")}
            detail="End-of-lifecycle markers"
          />
        </div>

        <div className="rounded-xl border border-orange/20 bg-orange/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  Lifecycle controls and auditability
                </h3>
                <StatusBadge label="Policy-sensitive" tone="warning" />
              </div>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                The platform records the terminal's operational actions; it must
                not make Customs decisions. Release requires a recorded authority
                reference, cleared holds, required documents and an approved
                financial clearance path. Every actual cargo state change creates
                an immutable event on the server.
              </p>
            </div>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="rounded-xl border border-carmine/25 bg-carmine/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-carmine" />
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Configuration needs attention
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-ink-soft">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-line">
          <nav
            className="flex gap-1 overflow-x-auto pb-px"
            aria-label="Cargo configuration sections"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:px-4",
                  activeTab === id
                    ? "border-orange text-orange-deep"
                    : "border-transparent text-ink-soft hover:text-ink"
                )}
              >
                <Icon className="size-4" />
                {label}
                {id === "holds" && (
                  <span className="rounded-full bg-sand px-1.5 py-0.5 text-[10px]">
                    {config.holdPolicies.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "states" && (
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <SectionHeader
              title="Cargo states"
              description="Standard lifecycle codes are protected. Labels can be edited, and custom states must be validated before activation."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addState}
                  className="border-line bg-paper text-ink hover:bg-sand"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Add custom state
                </Button>
              }
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={stateSearch}
                  onChange={(event) => setStateSearch(event.target.value)}
                  placeholder="Search state code or label"
                  className="h-9 border-line bg-paper pl-9 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                  className="size-4 accent-orange"
                />
                Show inactive
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    <th className="px-4 py-3 font-medium">State code</th>
                    <th className="px-4 py-3 font-medium">Internal label</th>
                    <th className="px-4 py-3 font-medium">Customer label</th>
                    <th className="px-4 py-3 font-medium">Terminal state</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredStates.map((state) => (
                    <tr key={state.id} className="hover:bg-sand/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={state.code}
                            disabled={state.system}
                            onChange={(event) =>
                              updateState(state.id, {
                                code: event.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9_]/g, "_"),
                              })
                            }
                            className="h-9 min-w-52 border-line bg-paper font-mono text-[11px] text-ink disabled:opacity-75"
                          />
                          {state.system && (
                            <span title="Standard state code is protected">
                              <LockKeyhole className="size-3.5 text-ink-soft" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={state.internalLabel}
                          onChange={(event) =>
                            updateState(state.id, {
                              internalLabel: event.target.value,
                            })
                          }
                          className="h-9 min-w-44 border-line bg-paper text-xs text-ink"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={state.customerLabel}
                          onChange={(event) =>
                            updateState(state.id, {
                              customerLabel: event.target.value,
                            })
                          }
                          className="h-9 min-w-44 border-line bg-paper text-xs text-ink"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-xs text-ink">
                          <input
                            type="checkbox"
                            checked={state.terminal}
                            disabled={state.system}
                            onChange={(event) =>
                              updateState(state.id, {
                                terminal: event.target.checked,
                              })
                            }
                            className="size-4 accent-orange disabled:opacity-50"
                          />
                          Terminal
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={state.active ? "Active" : "Inactive"}
                          tone={state.active ? "success" : "neutral"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateState(state.id, { active: !state.active })
                            }
                            disabled={state.system}
                            className="border-line bg-paper text-ink hover:bg-sand disabled:opacity-50"
                          >
                            {state.active ? "Deactivate" : "Activate"}
                          </Button>
                          {!state.system && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeState(state.id)}
                              className="text-carmine hover:bg-carmine/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStates.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-ink-soft"
                      >
                        No states match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-sand/20 px-5 py-3 text-[11px] text-ink-soft">
              <span>
                Standard codes are protected to avoid breaking existing cargo
                records.
              </span>
              <span>{filteredStates.length} states shown</span>
            </div>
          </section>
        )}

        {activeTab === "transitions" && (
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <SectionHeader
              title="Permitted transitions"
              description="Only active transition rules should be accepted by the backend. Release-related rules require authority, document, hold and finance checks."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTransition((value) => !value)}
                  className="border-line bg-paper text-ink hover:bg-sand"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Add transition
                </Button>
              }
            />
            {showAddTransition && (
              <div className="grid gap-3 border-b border-line bg-sand/20 p-5 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
                <div>
                  <FieldLabel>From state</FieldLabel>
                  <select
                    value={newTransition.from}
                    onChange={(event) =>
                      setNewTransition((prev) => ({
                        ...prev,
                        from: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-line bg-paper px-3 text-xs text-ink"
                  >
                    {config.states
                      .filter((state) => state.active)
                      .map((state) => (
                        <option key={state.id} value={state.code}>
                          {state.code}
                        </option>
                      ))}
                  </select>
                </div>
                <ArrowRightLeft className="hidden size-4 text-ink-soft sm:block" />
                <div>
                  <FieldLabel>To state</FieldLabel>
                  <select
                    value={newTransition.to}
                    onChange={(event) =>
                      setNewTransition((prev) => ({
                        ...prev,
                        to: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-line bg-paper px-3 text-xs text-ink"
                  >
                    {config.states
                      .filter((state) => state.active)
                      .map((state) => (
                        <option key={state.id} value={state.code}>
                          {state.code}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addTransition}
                    className="bg-orange text-white hover:bg-orange-deep"
                  >
                    <Check className="mr-1.5 size-4" />
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddTransition(false)}
                    className="border-line bg-paper text-ink"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={transitionSearch}
                  onChange={(event) => setTransitionSearch(event.target.value)}
                  placeholder="Search from or to state"
                  className="h-9 border-line bg-paper pl-9 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(event) => setShowInactive(event.target.checked)}
                  className="size-4 accent-orange"
                />
                Show inactive
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                    <th className="px-4 py-3 font-medium">From → To</th>
                    <th className="px-3 py-3 text-center font-medium">
                      Holds cleared
                    </th>
                    <th className="px-3 py-3 text-center font-medium">
                      Docs required
                    </th>
                    <th className="px-3 py-3 text-center font-medium">
                      Financial check
                    </th>
                    <th className="px-3 py-3 text-center font-medium">
                      Authority ref.
                    </th>
                    <th className="px-3 py-3 text-center font-medium">Notify</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredTransitions.map((transition) => (
                    <tr key={transition.id} className="hover:bg-sand/30">
                      <td className="px-4 py-3">
                        <div className="flex min-w-64 items-center gap-2">
                          <span className="rounded-md border border-line bg-sand/40 px-2 py-1 font-mono text-[10px] text-ink">
                            {transition.from}
                          </span>
                          <ArrowRightLeft className="size-3.5 shrink-0 text-ink-soft" />
                          <span className="rounded-md border border-line bg-sand/40 px-2 py-1 font-mono text-[10px] text-ink">
                            {transition.to}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={transition.requiresHoldClear}
                          onChange={(event) =>
                            updateTransition(transition.id, {
                              requiresHoldClear: event.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={transition.requiresDocs}
                          onChange={(event) =>
                            updateTransition(transition.id, {
                              requiresDocs: event.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={transition.requiresFinancialClearance}
                          onChange={(event) =>
                            updateTransition(transition.id, {
                              requiresFinancialClearance: event.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={transition.requiresAuthorityReference}
                          onChange={(event) =>
                            updateTransition(transition.id, {
                              requiresAuthorityReference: event.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={transition.notifies}
                          onChange={(event) =>
                            updateTransition(transition.id, {
                              notifies: event.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          label={transition.active ? "Active" : "Inactive"}
                          tone={transition.active ? "success" : "neutral"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateTransition(transition.id, {
                                active: !transition.active,
                              })
                            }
                            className="border-line bg-paper text-ink hover:bg-sand"
                          >
                            {transition.active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTransition(transition.id)}
                            className="text-carmine hover:bg-carmine/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransitions.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-ink-soft"
                      >
                        No transitions match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line bg-sand/20 px-5 py-3 text-[11px] leading-5 text-ink-soft">
              The backend independently validates every transition and records
              authorised overrides with a reason and audit trail.
            </div>
          </section>
        )}

        {activeTab === "holds" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-line bg-paper">
              <SectionHeader
                title="Hold categories and release controls"
                description="Every hold records its type, authority where applicable, reference, reason, actor and timestamp. Hold release requires an authorised actor and a release reason."
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      <th className="px-4 py-3 font-medium">Hold type</th>
                      <th className="px-3 py-3 text-center font-medium">
                        Authority required
                      </th>
                      <th className="px-3 py-3 text-center font-medium">
                        Reference required
                      </th>
                      <th className="px-3 py-3 text-center font-medium">
                        Release reason
                      </th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {config.holdPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-sand/30">
                        <td className="px-4 py-4 font-medium text-ink">
                          {policy.type}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={policy.authorityRequired}
                            onChange={(event) =>
                              updateHoldPolicy(policy.id, {
                                authorityRequired: event.target.checked,
                              })
                            }
                            className="size-4 accent-orange"
                          />
                        </td>
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={policy.referenceRequired}
                            onChange={(event) =>
                              updateHoldPolicy(policy.id, {
                                referenceRequired: event.target.checked,
                              })
                            }
                            className="size-4 accent-orange"
                          />
                        </td>
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={policy.releaseReasonRequired}
                            onChange={(event) =>
                              updateHoldPolicy(policy.id, {
                                releaseReasonRequired: event.target.checked,
                              })
                            }
                            className="size-4 accent-orange"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            label={policy.enabled ? "Enabled" : "Disabled"}
                            tone={policy.enabled ? "success" : "neutral"}
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateHoldPolicy(policy.id, {
                                enabled: !policy.enabled,
                              })
                            }
                            className="border-line bg-paper text-ink hover:bg-sand"
                          >
                            {policy.enabled ? "Disable" : "Enable"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-line bg-sand/20 px-5 py-3 text-[11px] leading-5 text-ink-soft">
                A hold is a separate operational record; the HELD cargo state
                alone is not sufficient to manage multiple concurrent holds or
                their release history.
              </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-line bg-paper">
              <SectionHeader
                title="Release authorisation policy"
                description="These are mandatory operational checks before release and gate-out. The terminal records external authority decisions but does not make them."
              />
              <div className="divide-y divide-line">
                <PolicyToggle
                  icon={FileCheck2}
                  title="Required documents verified"
                  description="Required documents must be present, valid and verified before release."
                  checked={config.requireDocsForRelease}
                  onChange={(value) =>
                    updateReleasePolicy("requireDocsForRelease", value)
                  }
                  locked
                />
                <PolicyToggle
                  icon={LockKeyhole}
                  title="All active holds cleared"
                  description="Release is blocked while any applicable hold remains active."
                  checked={config.requireNoActiveHolds}
                  onChange={(value) =>
                    updateReleasePolicy("requireNoActiveHolds", value)
                  }
                  locked
                />
                <PolicyToggle
                  icon={ClipboardCheck}
                  title="Financial clearance required"
                  description="Check payment/clearance status or an explicitly approved credit or waiver path."
                  checked={config.requireFinancialClearance}
                  onChange={(value) =>
                    updateReleasePolicy("requireFinancialClearance", value)
                  }
                />
                <PolicyToggle
                  icon={Check}
                  title="Approved credit or waiver may satisfy the financial path"
                  description="Only an authorised, recorded approval can replace normal settlement requirements."
                  checked={config.allowApprovedCreditOrWaiver}
                  onChange={(value) =>
                    updateReleasePolicy("allowApprovedCreditOrWaiver", value)
                  }
                />
                <PolicyToggle
                  icon={ShieldCheck}
                  title="Independent verification at gate"
                  description="Gate staff must verify the release authorisation and its authority reference."
                  checked={config.requireGateVerification}
                  onChange={(value) =>
                    updateReleasePolicy("requireGateVerification", value)
                  }
                  locked
                />
              </div>
            </section>
          </div>
        )}

        {activeTab === "behaviour" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-line bg-paper">
              <SectionHeader
                title="Lifecycle behaviour"
                description="Cross-cutting behaviour that applies across lifecycle transitions. Storage clock policy remains aligned with the central storage configuration."
              />
              <div className="divide-y divide-line">
                <PolicyToggle
                  icon={Bell}
                  title="Auto-notify on transitions"
                  description="Dispatch event-driven notifications, subject to the per-transition notification setting and recipient preferences."
                  checked={config.behaviour.autoNotifyOnTransition}
                  onChange={(value) =>
                    updateBehaviour("autoNotifyOnTransition", value)
                  }
                />
                <PolicyToggle
                  icon={Layers}
                  title="Allow bulk transitions"
                  description="Permit multi-unit transitions with per-unit exception reporting and no silent partial failures."
                  checked={config.behaviour.allowBulkTransitions}
                  onChange={(value) =>
                    updateBehaviour("allowBulkTransitions", value)
                  }
                />
                <PolicyToggle
                  icon={GitBranch}
                  title="Split/merge preserves lineage"
                  description="Retain parent-child relationships when consignments, containers or packages are split or merged."
                  checked={config.behaviour.splitMergePreservesLineage}
                  onChange={(value) =>
                    updateBehaviour("splitMergePreservesLineage", value)
                  }
                  locked
                />
                <PolicyToggle
                  icon={Clock3}
                  title="Pause storage clock on authorised hold"
                  description="Use the central storage policy and pause only when the applicable hold/pause condition is authorised."
                  checked={config.behaviour.pauseStorageOnHold}
                  onChange={(value) =>
                    updateBehaviour("pauseStorageOnHold", value)
                  }
                />
                <PolicyToggle
                  icon={Layers}
                  title="Track at container level"
                  description="Support status, location, movements and exceptions for each container unit."
                  checked={config.behaviour.trackContainerLevel}
                  onChange={(value) =>
                    updateBehaviour("trackContainerLevel", value)
                  }
                  locked
                />
                <PolicyToggle
                  icon={Layers}
                  title="Track at package level"
                  description="Support package-level quantity, location, movement and lineage within a consignment."
                  checked={config.behaviour.trackPackageLevel}
                  onChange={(value) =>
                    updateBehaviour("trackPackageLevel", value)
                  }
                  locked
                />
              </div>
            </section>
            <section className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-5 text-orange-deep" />
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Storage clock integration
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-ink-soft">
                    The storage clock starts when cargo reaches{" "}
                    <code className="rounded bg-sand px-1 py-0.5">STORED</code>{" "}
                    and ends at{" "}
                    <code className="rounded bg-sand px-1 py-0.5">GATE_OUT</code>.
                    Free days, charging unit, progressive escalation and pause
                    conditions are configured in Storage Rates &amp; Free Period.
                    This page does not create a conflicting second set of tariff
                    settings.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-line bg-paper">
              <SectionHeader
                title="Configuration change preview"
                description="This preview shows the kind of change summary the backend persists. Actual audit records are written on save."
              />
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-xl border border-line p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <History className="size-4 text-ink-soft" />
                    Last saved
                  </div>
                  <p className="mt-3 text-2xl font-bold text-ink">
                    {savedConfig.states.length + savedConfig.transitions.length}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    States and transition rules in the last confirmed save.
                  </p>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Activity className="size-4 text-ink-soft" />
                    Pending edits
                  </div>
                  <p className="mt-3 text-2xl font-bold text-ink">
                    {dirty ? "Unsaved" : "None"}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {dirty
                      ? "Changes will be included in the next save."
                      : "No unsaved changes."}
                  </p>
                </div>
              </div>
              <div className="border-t border-line px-5 py-4">
                <h4 className="text-xs font-semibold text-ink">
                  Audit record captures
                </h4>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    "Actor ID",
                    "Timestamp",
                    "Entity and record ID",
                    "Before and after values",
                    "Reason for change",
                    "Request/correlation ID",
                    "IP/device context where available",
                    "Approval/override details",
                    "Immutable event reference",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg bg-sand/30 px-3 py-2 text-xs text-ink"
                    >
                      <Check className="size-3.5 text-orange-deep" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-sand/75">
                {dirty
                  ? "Save to apply state, transition, hold, and behaviour changes."
                  : "No pending changes."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={!dirty || saving}
                className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
              >
                Discard
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
              >
                <Save className="mr-2 size-4" />
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <Icon className="size-4 text-orange-deep" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-ink">
        {value}
      </div>
      <p className="mt-1 text-[11px] text-ink-soft">{detail}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
      <div className="min-w-0">
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-ink-soft">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
      {children}
    </label>
  );
}

function PolicyToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  locked = false,
}: {
  icon: typeof Layers;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-ink">{title}</p>
            {locked && (
              <span title="Required or strongly recommended policy">
                <LockKeyhole className="size-3 text-ink-soft" />
              </span>
            )}
          </div>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-ink-soft">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange/40",
          checked ? "bg-orange" : "bg-sand-2"
        )}
      >
        <span
          className={cn(
            "size-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}