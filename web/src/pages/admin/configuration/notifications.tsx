import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Clock,
  Mail,
  Plus,
  Save,
  Send,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/router-link";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type Channel = "email" | "sms";
type AlertType = "sla" | "exceptions" | "integrations" | "security";

interface NotificationEvent {
  id: string;
  key: string;
  label: string;
  channels: Channel[];
  template: string;
  mandatory: boolean;
}

interface NotificationConfig {
  channelsEnabled: Record<Channel, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  rateLimitPerHour: number;
  digestFrequency: "immediate" | "hourly" | "daily";
  fallbackChannelEnabled: boolean;
  retryCount: number;
  trackDeliveryStatus: boolean;
  transactionalMarketingSplit: boolean;
  internalAlerts: Record<AlertType, boolean>;
  events: NotificationEvent[];
}

const defaultConfig: NotificationConfig = {
  channelsEnabled: { email: true, sms: true },
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  rateLimitPerHour: 10,
  digestFrequency: "immediate",
  fallbackChannelEnabled: true,
  retryCount: 3,
  trackDeliveryStatus: true,
  transactionalMarketingSplit: true,
  internalAlerts: {
    sla: true,
    exceptions: true,
    integrations: true,
    security: true,
  },
  events: [],
};

const channelMeta: Record<
  Channel,
  { label: string; description: string; icon: typeof Mail }
> = {
  email: {
    label: "Email",
    description: "Send operational notifications through email.",
    icon: Mail,
  },
  sms: {
    label: "SMS",
    description: "Send operational notifications through SMS.",
    icon: Smartphone,
  },
};

const alertMeta: Record<
  AlertType,
  { label: string; description: string; icon: typeof Clock }
> = {
  sla: {
    label: "SLA breaches",
    description: "Alert internal teams about service-level deadline breaches.",
    icon: Clock,
  },
  exceptions: {
    label: "Operational exceptions",
    description: "Alert teams about holds and unresolved exceptions.",
    icon: ShieldAlert,
  },
  integrations: {
    label: "Integration failures",
    description: "Alert technical teams about failed integrations.",
    icon: ServerCog,
  },
  security: {
    label: "Security events",
    description: "Alert administrators about important security events.",
    icon: ShieldCheck,
  },
};

function normaliseEvent(raw: any): NotificationEvent {
  const rawChannels = Array.isArray(raw?.channels)
    ? raw.channels
    : Array.isArray(raw?.enabled_channels)
      ? raw.enabled_channels
      : [];

	const channels: Channel[] = (Array.isArray(rawChannels) ? rawChannels : [])
	.map((channel: unknown) => String(channel).toLowerCase())
	.filter((channel): channel is Channel =>
		channel === "email" || channel === "sms"
	);

  return {
    id: String(raw?.id ?? crypto.randomUUID()),
    key: String(raw?.key ?? ""),
    label: String(raw?.label ?? raw?.name ?? ""),
    channels: channels.length ? [...new Set(channels)] : ["email"],
    template: String(raw?.template ?? raw?.template_id ?? ""),
    mandatory: Boolean(raw?.mandatory),
  };
}

function Toggle({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        enabled ? "bg-orange" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line">
      <div className="border-b border-line p-5">
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function AdminNotificationsConfigurationPage() {
  const [config, setConfig] = useState<NotificationConfig>(defaultConfig);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await http.get("/admin/config/notifications/");
      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(String(resp.data || "Unable to load notification settings."));
      }

      const data: any = resp.code ?? {};
      const channels = data.channels_enabled ?? {};
      const alerts = data.internal_alerts ?? {};
      const rawEvents = Array.isArray(data.events) ? data.events : [];

      const loaded: NotificationConfig = {
        channelsEnabled: {
          email: Boolean(channels.email ?? true),
          sms: Boolean(channels.sms ?? true),
        },
        quietHoursEnabled: Boolean(data.quiet_hours_enabled ?? true),
        quietHoursStart: String(data.quiet_hours_start ?? "22:00"),
        quietHoursEnd: String(data.quiet_hours_end ?? "07:00"),
        rateLimitPerHour: Number(data.rate_limit_per_hour ?? 10),
        digestFrequency: data.digest_frequency ?? "immediate",
        fallbackChannelEnabled: Boolean(data.fallback_channel_enabled ?? true),
        retryCount: Number(data.retry_count ?? 3),
        trackDeliveryStatus: Boolean(data.track_delivery_status ?? true),
        transactionalMarketingSplit: Boolean(
          data.transactional_marketing_split ?? true
        ),
        internalAlerts: {
          sla: Boolean(alerts.sla ?? true),
          exceptions: Boolean(alerts.exceptions ?? true),
          integrations: Boolean(alerts.integrations ?? true),
          security: Boolean(alerts.security ?? true),
        },
        events: rawEvents.map(normaliseEvent),
      };

      setConfig(loaded);
      setDirty(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.data ??
          err?.message ??
          "Unable to load notification settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const update = <K extends keyof NotificationConfig>(
    key: K,
    value: NotificationConfig[K]
  ) => {
    setConfig((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  };

  const toggleChannel = (channel: Channel) => {
    update("channelsEnabled", {
      ...config.channelsEnabled,
      [channel]: !config.channelsEnabled[channel],
    });
  };

  const toggleAlert = (alert: AlertType) => {
    update("internalAlerts", {
      ...config.internalAlerts,
      [alert]: !config.internalAlerts[alert],
    });
  };

  const updateEvent = (id: string, patch: Partial<NotificationEvent>) => {
    update(
      "events",
      config.events.map((event) =>
        event.id === id ? { ...event, ...patch } : event
      )
    );
  };

  const toggleEventChannel = (event: NotificationEvent, channel: Channel) => {
    const enabled = event.channels.includes(channel);

    if (enabled && event.mandatory && event.channels.length === 1) {
      toast.error("Mandatory events must have at least one channel.");
      return;
    }

    updateEvent(event.id, {
      channels: enabled
        ? event.channels.filter((item) => item !== channel)
        : [...event.channels, channel],
    });
  };

  const addEvent = () => {
    update("events", [
      ...config.events,
      {
        id: crypto.randomUUID(),
        key: "",
        label: "",
        channels: ["email"],
        template: "",
        mandatory: false,
      },
    ]);
  };

  const removeEvent = (event: NotificationEvent) => {
    if (event.mandatory) {
      toast.error("Mandatory events cannot be removed.");
      return;
    }

    update(
      "events",
      config.events.filter((item) => item.id !== event.id)
    );
  };

  const validate = () => {
    if (
      config.quietHoursEnabled &&
      (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(config.quietHoursStart) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(config.quietHoursEnd))
    ) {
      toast.error("Enter valid quiet-hours start and end times.");
      return false;
    }

    if (
      !Number.isInteger(config.rateLimitPerHour) ||
      config.rateLimitPerHour < 1 ||
      config.rateLimitPerHour > 1000
    ) {
      toast.error("Rate limit must be between 1 and 1000.");
      return false;
    }

    if (
      !Number.isInteger(config.retryCount) ||
      config.retryCount < 0 ||
      config.retryCount > 20
    ) {
      toast.error("Retry count must be between 0 and 20.");
      return false;
    }

    if (!config.channelsEnabled.email && !config.channelsEnabled.sms) {
      toast.error("Enable at least one delivery channel.");
      return false;
    }

    if (!config.events.length) {
      toast.error("At least one notification event is required.");
      return false;
    }

    const keys = new Set<string>();

    for (const event of config.events) {
      if (
        !event.key.trim() ||
        !/^[a-z][a-z0-9_]*$/.test(event.key.trim()) ||
        !event.label.trim() ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(event.template.trim()) ||
        !event.channels.length
      ) {
        toast.error(
          "Each event needs a valid key, label, template, and channel."
        );
        return false;
      }

      const key = event.key.trim();

      if (keys.has(key)) {
        toast.error(`Duplicate event key: ${key}`);
        return false;
      }

      keys.add(key);
    }

    for (const key of ["hold_placed", "release_authorised"]) {
      const event = config.events.find((item) => item.key === key);
      if (!event || !event.mandatory) {
        toast.error(`${key} must remain configured as mandatory.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!dirty || saving || !validate()) return;

    setSaving(true);

    try {
      const payload = {
        channels_enabled: config.channelsEnabled,
        quiet_hours_enabled: config.quietHoursEnabled,
        quiet_hours_start: config.quietHoursStart,
        quiet_hours_end: config.quietHoursEnd,
        rate_limit_per_hour: config.rateLimitPerHour,
        digest_frequency: config.digestFrequency,
        fallback_channel_enabled: config.fallbackChannelEnabled,
        retry_count: config.retryCount,
        track_delivery_status: config.trackDeliveryStatus,
        transactional_marketing_split: config.transactionalMarketingSplit,
        internal_alerts: config.internalAlerts,
        events: config.events.map((event) => ({
          id: event.id,
          key: event.key.trim(),
          label: event.label.trim(),
          channels: event.channels,
          template: event.template.trim(),
          mandatory: event.mandatory,
        })),
      };

      const formData = new URLSearchParams();
      formData.set("config", JSON.stringify(payload));
      formData.set("change_reason", "Notification configuration updated");

      const response = await http.post(
        "/admin/config/notifications/update/",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const resp: Resp = response.data;

      if (resp.error) {
        toast.error(String(resp.data || "Unable to save notification settings."));
        return;
      }

      toast.success("Notification settings saved successfully.");
      await fetchAll();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.data ??
          err?.message ??
          "Unable to save notification settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const channelCount = useMemo(
    () => Object.values(config.channelsEnabled).filter(Boolean).length,
    [config.channelsEnabled]
  );

  if (loading) {
    return (
      <AppShell title="Notifications" eyebrow="Administration · Configuration">
        <div className="flex justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
          <span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Notifications" eyebrow="Administration · Configuration">
        <div className="rounded-2xl bg-paper p-6 ring-1 ring-line">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600" />
            <div>
              <p className="font-semibold text-ink">
                Could not load notification configuration
              </p>
              <p className="mt-2 text-sm text-ink-soft">{error}</p>
              <Button className="mt-4" onClick={() => void fetchAll()}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Notifications" eyebrow="Administration · Configuration">
      <div className="space-y-6 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/admin/configuration"
              className="inline-flex items-center gap-2 text-xs text-ink-soft hover:text-orange"
            >
              <ArrowLeft className="size-4" />
              Back to configuration
            </Link>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
              Notifications &amp; Messaging
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Configure notification channels, delivery behaviour, operational
              alerts, and event templates.
            </p>
          </div>
          {dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
        </div>

        <Section
          title="Delivery Channels"
          description={`Enable or disable email and SMS delivery. ${channelCount} of 2 channels enabled.`}
        >
          <div className="divide-y divide-line">
            {(Object.keys(channelMeta) as Channel[]).map((channel) => {
              const meta = channelMeta[channel];
              const Icon = meta.icon;

              return (
                <div
                  key={channel}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 size-5 text-orange" />
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {meta.label}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={config.channelsEnabled[channel]}
                    onToggle={() => toggleChannel(channel)}
                    label={`${meta.label} delivery`}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Delivery Behaviour"
          description="Configure quiet hours, rate limits, retries, and delivery tracking."
        >
          <div className="divide-y divide-line">
            <SettingRow
              title="Quiet hours"
              description="Delay non-mandatory notifications during quiet hours."
              enabled={config.quietHoursEnabled}
              onToggle={() =>
                update("quietHoursEnabled", !config.quietHoursEnabled)
              }
            />

            {config.quietHoursEnabled && (
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <label className="text-xs text-ink-soft">
                  Quiet hours start
                  <Input
                    type="time"
                    value={config.quietHoursStart}
                    onChange={(e) => update("quietHoursStart", e.target.value)}
                    className="mt-2"
                  />
                </label>
                <label className="text-xs text-ink-soft">
                  Quiet hours end
                  <Input
                    type="time"
                    value={config.quietHoursEnd}
                    onChange={(e) => update("quietHoursEnd", e.target.value)}
                    className="mt-2"
                  />
                </label>
              </div>
            )}

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-xs text-ink-soft">
                Rate limit per recipient per hour
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={String(config.rateLimitPerHour)}
                  onChange={(e) =>
                    update("rateLimitPerHour", Number(e.target.value))
                  }
                  className="mt-2"
                />
              </label>

              <label className="text-xs text-ink-soft">
                Retry count
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={String(config.retryCount)}
                  onChange={(e) => update("retryCount", Number(e.target.value))}
                  className="mt-2"
                />
              </label>

              <label className="text-xs text-ink-soft">
                Digest frequency
                <select
                  value={config.digestFrequency}
                  onChange={(e) =>
                    update(
                      "digestFrequency",
                      e.target.value as NotificationConfig["digestFrequency"]
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest</option>
                </select>
              </label>
            </div>

            <SettingRow
              title="Fallback delivery"
              description="Use another enabled channel if primary delivery fails."
              enabled={config.fallbackChannelEnabled}
              onToggle={() =>
                update(
                  "fallbackChannelEnabled",
                  !config.fallbackChannelEnabled
                )
              }
            />

            <SettingRow
              title="Track delivery status"
              description="Record delivery receipts and failures."
              enabled={config.trackDeliveryStatus}
              onToggle={() =>
                update("trackDeliveryStatus", !config.trackDeliveryStatus)
              }
            />

            <SettingRow
              title="Separate transactional and marketing messages"
              description="Respect marketing communication preferences and opt-outs."
              enabled={config.transactionalMarketingSplit}
              onToggle={() =>
                update(
                  "transactionalMarketingSplit",
                  !config.transactionalMarketingSplit
                )
              }
            />
          </div>
        </Section>

        <Section
          title="Internal Operational Alerts"
          description="Control alerts for operational and technical issues."
        >
          <div className="divide-y divide-line">
            {(Object.keys(alertMeta) as AlertType[]).map((alert) => {
              const meta = alertMeta[alert];
              const Icon = meta.icon;

              return (
                <div
                  key={alert}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 size-5 text-orange" />
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {meta.label}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={config.internalAlerts[alert]}
                    onToggle={() => toggleAlert(alert)}
                    label={`${meta.label} alerts`}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Notification Events"
          description="Edit event names, keys, templates, delivery channels, and mandatory status."
        >
          <div className="flex justify-end border-b border-line p-4">
            <Button type="button" variant="outline" onClick={addEvent}>
              <Plus className="mr-2 size-4" />
              Add event
            </Button>
          </div>

          {config.events.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              No notification events configured.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-sand/40 text-xs text-ink-soft">
                    <th className="p-3">Event</th>
                    <th className="p-3">Template</th>
                    <th className="p-3 text-center">Email</th>
                    <th className="p-3 text-center">SMS</th>
                    <th className="p-3 text-center">Mandatory</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {config.events.map((event) => (
                    <tr key={event.id}>
                      <td className="space-y-2 p-3">
                        <Input
                          value={event.label}
                          placeholder="Event label"
                          onChange={(e) =>
                            updateEvent(event.id, { label: e.target.value })
                          }
                        />
                        <Input
                          value={event.key}
                          placeholder="event_key"
                          onChange={(e) =>
                            updateEvent(event.id, {
                              key: e.target.value.trim().toLowerCase(),
                            })
                          }
                          className="font-mono text-xs"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={event.template}
                          placeholder="template_id"
                          onChange={(e) =>
                            updateEvent(event.id, { template: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </td>
                      {(["email", "sms"] as Channel[]).map((channel) => (
                        <td key={channel} className="p-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${event.key} ${channel}`}
                            checked={event.channels.includes(channel)}
                            onChange={() => toggleEventChannel(event, channel)}
                            className="size-4 accent-orange"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${event.key} mandatory`}
                          checked={event.mandatory}
                          disabled={
                            event.key === "hold_placed" ||
                            event.key === "release_authorised"
                          }
                          onChange={(e) =>
                            updateEvent(event.id, {
                              mandatory: e.target.checked,
                            })
                          }
                          className="size-4 accent-orange"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={event.mandatory}
                          onClick={() => removeEvent(event)}
                          aria-label={`Remove ${event.label || event.key}`}
                          className="text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
          <div className="flex items-start gap-3">
            <BellRing className="mt-1 size-5 text-orange" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Messaging requirements
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">
                Actual delivery requires a configured email or SMS provider.
                Marketing communications must respect user consent and opt-outs.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate p-4 text-white shadow-xl">
          <div>
            <p className="text-xs font-semibold">
              {dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Save to apply your notification configuration.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void fetchAll()}
              className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
            >
              Discard
            </Button>
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
              className="bg-orange text-white hover:bg-orange/90"
            >
              <Save className="mr-2 size-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <Activity className="mt-1 size-5 text-orange" />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-xs text-ink-soft">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} label={title} />
    </div>
  );
}