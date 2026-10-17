import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type Manifest = {
  id: string;
  manifest_ref: string;
  bill_of_lading: string;
  vessel: string | null;
  shipping_line: string | null;
  origin_port: string | null;
  eta: string | null;
  containers: number;
  packages: number;
  gross_weight: string | null;
  consignee: string;
  agent: string | null;
  consignee_email: string | null;
  consignee_phone: string | null;
  consignee_address: string | null;
  notes: string | null;
  status: string;
  review_reason: string | null;
  correction_reason: string | null;
  review_status: string | null;
  flagged_at: string | null;
};

type Draft = {
  manifest_ref: string;
  bill_of_lading: string;
  vessel: string;
  shipping_line: string;
  origin_port: string;
  eta: string;
  containers: string;
  packages: string;
  gross_weight: string;
  consignee: string;
  agent: string;
  consignee_email: string;
  consignee_phone: string;
  consignee_address: string;
  notes: string;
};

const emptyDraft: Draft = {
  manifest_ref: "",
  bill_of_lading: "",
  vessel: "",
  shipping_line: "",
  origin_port: "",
  eta: "",
  containers: "0",
  packages: "0",
  gross_weight: "",
  consignee: "",
  agent: "",
  consignee_email: "",
  consignee_phone: "",
  consignee_address: "",
  notes: "",
};

const toDraft = (manifest: Manifest): Draft => ({
  manifest_ref: manifest.manifest_ref ?? "",
  bill_of_lading: manifest.bill_of_lading ?? "",
  vessel: manifest.vessel ?? "",
  shipping_line: manifest.shipping_line ?? "",
  origin_port: manifest.origin_port ?? "",
  eta: manifest.eta ?? "",
  containers: String(manifest.containers ?? 0),
  packages: String(manifest.packages ?? 0),
  gross_weight: manifest.gross_weight ?? "",
  consignee: manifest.consignee ?? "",
  agent: manifest.agent ?? "",
  consignee_email: manifest.consignee_email ?? "",
  consignee_phone: manifest.consignee_phone ?? "",
  consignee_address: manifest.consignee_address ?? "",
  notes: manifest.notes ?? "",
});

const fieldGroups: {
  title: string;
  fields: { name: keyof Draft; label: string; required?: boolean }[];
}[] = [
  {
    title: "Manifest identification",
    fields: [
      { name: "manifest_ref", label: "Manifest reference", required: true },
      { name: "bill_of_lading", label: "Bill of lading", required: true },
      { name: "vessel", label: "Vessel name" },
      { name: "shipping_line", label: "Shipping line" },
    ],
  },
  {
    title: "Arrival and cargo",
    fields: [
      { name: "origin_port", label: "Origin port" },
      { name: "eta", label: "Expected arrival" },
      { name: "containers", label: "Number of containers", required: true },
      { name: "packages", label: "Number of packages", required: true },
      { name: "gross_weight", label: "Gross weight" },
    ],
  },
  {
    title: "Consignee and agent",
    fields: [
      { name: "consignee", label: "Consignee", required: true },
      { name: "agent", label: "Licensed agent" },
      { name: "consignee_email", label: "Consignee email" },
      { name: "consignee_phone", label: "Consignee phone" },
      { name: "consignee_address", label: "Consignee address" },
    ],
  },
];

export default function ManifestSupervisorReviewPage() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [correctionReason, setCorrectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => manifests.find((manifest) => manifest.id === selectedId) ?? null,
    [manifests, selectedId],
  );

  const fetchManifests = useCallback(async (preferredId?: string) => {
    setLoading(true);

    try {
      const res = await http.get("operations/manifests/review/");
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load manifest reviews.",
        );
        return;
      }

      const rows = Array.isArray(resp.data)
        ? (resp.data as Manifest[])
        : [];

      setManifests(rows);

      const nextId =
        rows.find((item) => item.id === preferredId)?.id ??
        rows.find((item) => item.id === selectedId)?.id ??
        rows[0]?.id ??
        "";

      setSelectedId(nextId);

      const next = rows.find((item) => item.id === nextId);
      setDraft(next ? toDraft(next) : emptyDraft);
      setCorrectionReason(next?.correction_reason ?? "");
    } catch {
      toast.error("Could not load manifest reviews.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void fetchManifests();
  }, []);

  const filteredManifests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return manifests;

    return manifests.filter((manifest) =>
      [
        manifest.manifest_ref,
        manifest.bill_of_lading,
        manifest.vessel,
        manifest.consignee,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [manifests, search]);

  const selectManifest = (manifest: Manifest) => {
    setSelectedId(manifest.id);
    setDraft(toDraft(manifest));
    setCorrectionReason(manifest.correction_reason ?? "");
  };

  const updateField = (name: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const submitDecision = async (action: "approve" | "return") => {
    if (!selected) {
      toast.error("Select a manifest first.");
      return;
    }

    if (correctionReason.trim().length < 5) {
      toast.error("Enter a correction or return reason of at least 5 characters.");
      return;
    }

    if (
      !draft.manifest_ref.trim() ||
      !draft.bill_of_lading.trim() ||
      !draft.consignee.trim()
    ) {
      toast.error("Manifest reference, bill of lading and consignee are required.");
      return;
    }

    const body = new FormData();
    body.append("id", selected.id);
    body.append("correction_reason", correctionReason.trim());

    Object.entries(draft).forEach(([key, value]) => {
      body.append(key, value);
    });

    setSaving(true);

    try {
      const endpoint =
        action === "approve"
          ? "operations/manifests/review/approve/"
          : "operations/manifests/review/return/";

      const res = await http.post(endpoint, body);
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "The manifest action could not be completed.",
        );
        return;
      }

      toast.success(
        typeof resp.data === "string"
          ? resp.data
          : action === "approve"
            ? "Manifest approved."
            : "Manifest returned to Operations.",
      );

      await fetchManifests();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.data ||
          error?.response?.data?.message ||
          "The manifest action could not be completed.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Manifest Review" eyebrow="Operations">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Operations / Supervisor review
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Manifest review
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Verify flagged manifest details, document corrections, and approve
              or return the record to Operations.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void fetchManifests(selectedId)}
            disabled={loading || saving}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh queue
          </Button>
        </motion.div>

        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Review queue</h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {manifests.length}
                </span>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search manifests..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading review queue...
                </div>
              ) : filteredManifests.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No manifests found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    There are no matching Operations reviews.
                  </p>
                </div>
              ) : (
                filteredManifests.map((manifest) => (
                  <button
                    key={manifest.id}
                    type="button"
                    onClick={() => selectManifest(manifest)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors",
                      selectedId === manifest.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/40 hover:border-border hover:bg-muted",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {manifest.manifest_ref}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {manifest.bill_of_lading}
                        </p>
                      </div>
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-3 truncate text-sm">
                      {manifest.consignee}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusBadge
                        label={manifest.review_status ?? "Pending"}
                        tone={statusTone(manifest.review_status ?? "Pending")}
                      />
                      <span className="text-xs text-muted-foreground">
                        {manifest.flagged_at ?? "Flagged"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="min-w-0 space-y-5">
            {!selected ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 font-semibold">Select a manifest</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Choose a record from the queue to inspect and correct its details.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border bg-card p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Selected manifest
                      </p>
                      <h2 className="mt-1 break-words text-xl font-semibold">
                        {selected.manifest_ref}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Bill of lading: {selected.bill_of_lading}
                      </p>
                    </div>
                    <StatusBadge
                      label={selected.status || "Unknown"}
                      tone={statusTone(selected.status || "Unknown")}
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-medium">Reason flagged for review</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {selected.review_reason || "No reason was supplied."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold">Manifest details</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Edit incorrect information before approving. Required fields
                      are marked.
                    </p>
                  </div>

                  <div className="space-y-7">
                    {fieldGroups.map((group) => (
                      <div key={group.title}>
                        <h3 className="mb-4 text-sm font-semibold">
                          {group.title}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {group.fields.map((field) => (
                            <label
                              key={field.name}
                              className={cn(
                                "block space-y-2",
                                field.name === "consignee_address" && "sm:col-span-2",
                              )}
                            >
                              <span className="text-sm font-medium">
                                {field.label}
                                {field.required && (
                                  <span className="ml-1 text-destructive">*</span>
                                )}
                              </span>
                              <Input
                                value={draft[field.name]}
                                onChange={(event) =>
                                  updateField(field.name, event.target.value)
                                }
                                required={field.required}
                                type={
                                  field.name === "consignee_email"
                                    ? "email"
                                    : "text"
                                }
                                inputMode={
                                  field.name === "containers" ||
                                  field.name === "packages"
                                    ? "numeric"
                                    : undefined
                                }
                                disabled={saving}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Internal notes
                      </label>
                      <textarea
                        value={draft.notes}
                        onChange={(event) =>
                          updateField("notes", event.target.value)
                        }
                        disabled={saving}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Additional manifest notes..."
                      />
                    </div>

                    <div className="rounded-xl border p-4">
                      <label className="mb-2 block text-sm font-semibold">
                        Correction / decision reason
                        <span className="ml-1 text-destructive">*</span>
                      </label>
                      <textarea
                        value={correctionReason}
                        onChange={(event) =>
                          setCorrectionReason(event.target.value)
                        }
                        disabled={saving}
                        required
                        minLength={5}
                        maxLength={2000}
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Explain what was corrected and why, or what Operations must do next..."
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {correctionReason.length}/2000 characters. This reason is
                        saved by the server with the decision.
                      </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void submitDecision("return")}
                        disabled={saving}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Return to Operations
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void submitDecision("approve")}
                        disabled={saving}
                      >
                        {saving ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        {saving ? "Processing..." : "Approve Manifest"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}