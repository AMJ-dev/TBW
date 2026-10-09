import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Flag,
  Globe,
  Save,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type Scope = "public" | "portal" | "operations" | "platform";
type ScopeFilter = "all" | Scope;

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  desc: string;
  scope: Scope;
  enabled: boolean;
  requiresApproval: boolean;
}

interface FlagsConfig {
  auditAllChanges: boolean;
  requireReason: boolean;
  flags: FeatureFlag[];
}

const emptyConfig: FlagsConfig = {
  auditAllChanges: true,
  requireReason: true,
  flags: [],
};

const scopeMeta: Record<Scope, { label: string; icon: LucideIcon }> = {
  public: { label: "Public website", icon: Globe },
  portal: { label: "Customer portal", icon: Users },
  operations: { label: "Operations", icon: Boxes },
  platform: { label: "Platform", icon: Flag },
};

const normaliseFlag = (raw: any): FeatureFlag => ({
  id: String(raw?.id ?? raw?.key ?? crypto.randomUUID()),
  key: raw?.key ?? "",
  label: raw?.label ?? raw?.name ?? "",
  desc: raw?.desc ?? raw?.description ?? "",
  scope: (raw?.scope ?? "platform") as Scope,
  enabled: Boolean(raw?.enabled ?? false),
  requiresApproval: Boolean(
    raw?.requires_approval ?? raw?.requiresApproval ?? false
  ),
});

export default function AdminFeatureFlagsPage() {
  const [config, setConfig] = useState<FlagsConfig>(emptyConfig);
  const [savedConfig, setSavedConfig] = useState<FlagsConfig>(emptyConfig);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [search, setSearch] = useState("");
  const [changeReason, setChangeReason] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/config/feature-flags/");
      const resp: Resp = res.data;
      if (resp.error) {
        setError(resp.data || "Could not load feature flags.");
        return;
      }
      const payload: any = resp.code ?? {};
      const rawFlags: any[] = Array.isArray(payload.flags)
        ? payload.flags
        : [];

      const loaded: FlagsConfig = {
        auditAllChanges: Boolean(
          payload.audit_all_changes ?? payload.auditAllChanges ?? true
        ),
        requireReason: Boolean(
          payload.require_reason ?? payload.requireReason ?? true
        ),
        flags: rawFlags.map(normaliseFlag),
      };

      setConfig(loaded);
      setSavedConfig(loaded);
      setChangeReason("");
      setDirty(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Could not load feature flags."
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

  const updateFlag = (id: string) => {
    const flag = config.flags.find((item) => item.id === id);
    if (!flag) return;

    if (flag.requiresApproval) {
      toast.warning(
        "This flag requires an approval workflow and cannot be toggled here."
      );
      return;
    }

    setConfig((current) => ({
      ...current,
      flags: current.flags.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
    markDirty();
  };

  const updateSetting = (
    key: "auditAllChanges" | "requireReason",
    value: boolean
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
    markDirty();
  };

  const handleSave = async () => {
    if (!dirty || saving) return;

    if (config.requireReason && !changeReason.trim()) {
      toast.error("Enter a reason before saving.");
      return;
    }
    if (changeReason.trim().length > 500) {
      toast.error("Change reason cannot exceed 500 characters.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        audit_all_changes: config.auditAllChanges,
        require_reason: config.requireReason,
        change_reason: changeReason.trim(),
        flags: config.flags.map((flag) => ({
          id: flag.id,
          key: flag.key,
          enabled: flag.enabled,
        })),
      };

      const res = await http.post(
        "/admin/config/feature-flags/update/",
        payload
      );
      const resp: Resp = res.data;
      if (resp.error) {
        toast.error(resp.data || "Could not save the feature flags.");
        return;
      }
      toast.success("Feature flags saved. Change logged.");
      await fetchAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not save the feature flags."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    setChangeReason("");
    await fetchAll();
    toast.message("Changes discarded.");
  };

  const query = search.trim().toLowerCase();

  const visibleFlags = useMemo(
    () =>
      config.flags.filter((flag) => {
        const matchesScope =
          scopeFilter === "all" || flag.scope === scopeFilter;
        const matchesSearch =
          !query ||
          flag.label.toLowerCase().includes(query) ||
          flag.key.toLowerCase().includes(query) ||
          flag.desc.toLowerCase().includes(query);
        return matchesScope && matchesSearch;
      }),
    [config.flags, scopeFilter, query]
  );

  const enabledCount = config.flags.filter((flag) => flag.enabled).length;
  const disabledCount = config.flags.length - enabledCount;
  const approvalCount = config.flags.filter(
    (flag) => flag.requiresApproval
  ).length;

  if (loading) {
    return (
      <AppShell
        title="Feature Flags"
        eyebrow="Administration · Platform Control"
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
        title="Feature Flags"
        eyebrow="Administration · Platform Control"
      >
        <div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">
                Could not load feature flags
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
    <AppShell
      title="Feature Flags"
      eyebrow="Administration · Platform Control"
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

            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Feature Flags
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Manage controlled platform capabilities and approval
              requirements. Every change is logged.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <StatusBadge label="Unsaved changes" tone="warning" />
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total flags"
            value={config.flags.length}
            description="Configured on the platform"
            icon={Flag}
          />
          <MetricCard
            label="Enabled"
            value={enabledCount}
            description="Currently active"
            icon={ShieldCheck}
          />
          <MetricCard
            label="Disabled"
            value={disabledCount}
            description="Not active"
            icon={Flag}
          />
          <MetricCard
            label="Approval required"
            value={approvalCount}
            description="Controlled toggles"
            icon={ShieldCheck}
          />
        </div>

        <section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
          <h3 className="font-display text-sm font-bold text-ink">
            Change controls
          </h3>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            Policy applied to every flag change.
          </p>

          <div className="mt-3 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  Audit all changes
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Record the actor, timestamp, previous value, new value,
                  and reason for every change.
                </p>
              </div>
              <Toggle
                checked={config.auditAllChanges}
                onChange={() =>
                  updateSetting("auditAllChanges", !config.auditAllChanges)
                }
                label="Audit all changes"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  Require a change reason
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Require a reason before any flag change is saved.
                </p>
              </div>
              <Toggle
                checked={config.requireReason}
                onChange={() =>
                  updateSetting("requireReason", !config.requireReason)
                }
                label="Require a change reason"
              />
            </div>
          </div>

          {dirty && (
            <div className="mt-4 border-t border-line pt-4">
              <label className="block">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  <AlertTriangle className="size-3.5 text-orange" />
                  Reason for change
                  {config.requireReason && (
                    <span className="text-coral">*</span>
                  )}
                </span>
                <textarea
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                  placeholder="Explain why these feature flags are being changed."
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
                />
                <span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
                  {changeReason.length}/500
                </span>
              </label>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
          <div className="space-y-4 border-b border-line p-5">
            <div>
              <h3 className="font-display text-sm font-bold text-ink">
                Platform flags
              </h3>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                Search and filter by scope. Flags requiring approval are shown
                but cannot be toggled here.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, key or description"
                  className="h-10 border-line bg-sand pl-9 text-sm text-ink"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  ["all", "public", "portal", "operations", "platform"] as const
                ).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setScopeFilter(scope)}
                    className={cn(
                      "rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      scopeFilter === scope
                        ? "bg-orange text-white"
                        : "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
                    )}
                  >
                    {scope === "all" ? "All" : scopeMeta[scope].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {visibleFlags.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="mx-auto size-7 text-ink-soft" />
              <p className="mt-3 text-sm font-semibold text-ink">
                No matching flags
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Try another search term or scope.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {visibleFlags.map((flag) => {
                const ScopeIcon = scopeMeta[flag.scope].icon;
                return (
                  <li
                    key={flag.id}
                    className="flex flex-wrap items-start justify-between gap-4 p-5"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
                        <ScopeIcon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink">
                            {flag.label}
                          </p>
                          <StatusBadge
                            label={flag.enabled ? "Enabled" : "Disabled"}
                            tone={flag.enabled ? "success" : "neutral"}
                          />
                          {flag.requiresApproval && (
                            <StatusBadge
                              label="Approval required"
                              tone="warning"
                            />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          {flag.desc}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-mono text-[10px] text-ink-soft">
                            {flag.key}
                          </span>
                          <span className="text-[10px] text-ink-soft">
                            {scopeMeta[flag.scope].label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-soft">
                        {flag.requiresApproval
                          ? "Restricted"
                          : flag.enabled
                            ? "On"
                            : "Off"}
                      </span>
                      <Toggle
                        checked={flag.enabled}
                        disabled={flag.requiresApproval}
                        onChange={() => updateFlag(flag.id)}
                        label={`Toggle ${flag.label}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-orange-deep" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Approval and audit requirements
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                Flags marked as approval-required are gated by a server-side
                approval workflow that verifies the approver's identity and
                permissions. Every change is recorded with the actor,
                timestamp, prior value, new value, and reason.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-sand/75">
                {dirty
                  ? "Save to apply flag and policy changes."
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

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
        checked ? "bg-orange" : "bg-sand-2",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">{label}</p>
        <Icon className="size-4 text-orange" />
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{description}</p>
    </div>
  );
}