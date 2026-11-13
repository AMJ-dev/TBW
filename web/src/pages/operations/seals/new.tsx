
import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type SealEvent =
  | "Initial"
  | "Custody change"
  | "Examination preparation"
  | "Return to storage"
  | "Replacement";

type SealStatus =
  | "Verified"
  | "Intact"
  | "Pending verification"
  | "Mismatch"
  | "Broken"
  | "Missing";

interface ContainerDetails {
  id: string;
  container_number: string;
  bill_of_lading: string;
  consignment_reference: string;
  shipment_reference: string;
  current_seal_number: string;
  current_location: string;
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#D5D9E2] bg-white px-3 text-sm text-foreground shadow-sm transition-colors hover:border-[#AEB5C2] focus-visible:border-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20";

const labelClass = "mb-1.5 block text-xs font-semibold text-foreground";

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function OperationsSealNewRoute() {
  const navigate = useNavigate();

  const [containerNumber, setContainerNumber] = useState("");
  const [container, setContainer] = useState<ContainerDetails | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  const [form, setForm] = useState({
    sealNumber: "",
    sealType: "Shipping line seal",
    event: "Initial" as SealEvent,
    location: "Receiving",
    status: "Pending verification" as SealStatus,
    notes: "",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const searchContainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const container_number = containerNumber.trim().toUpperCase();

    if (!container_number) {
      toast.error("Enter a container number.");
      return;
    }

    setSearching(true);
    setContainer(null);
    setPhoto(null);

    try {
      const res = await http.post("/operations/seals/search/", {container_number});
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Container could not be found."
        );
        return;
      }

      if (!resp.data || typeof resp.data !== "object") {
        toast.error("No container details were returned.");
        return;
      }

      const data = resp.data as Record<string, any>;

      setContainer({
        id: String(data["id"] ?? data["container_id"] ?? ""),
        container_number: data["container_number"] ?? container_number,
        bill_of_lading: data["bill_of_lading"] ?? data["bl_number"] ?? data["bl"] ?? "",
        consignment_reference: data["consignment_reference"] ?? data["consignment"] ?? "",
        shipment_reference: data["shipment_reference"] ?? "",
        current_seal_number: data["current_seal_number"] ?? data["seal_number"] ?? "",
        current_location: data["current_location"] ?? data["location"] ?? "",
      });

      setForm((current) => ({
        ...current,
        sealNumber: "",
        notes: "",
        event: "Initial",
        status: "Pending verification",
      }));

      toast.success("Container details loaded.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.data ||
          error?.response?.data?.message ||
          "Unable to search for this container."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!container) {
      toast.error("Search for a container first.");
      return;
    }

    if (!container.id) {
      toast.error("The container record does not have a valid ID.");
      return;
    }

    if (!form.sealNumber.trim()) {
      toast.error("Enter the current seal number.");
      return;
    }

    if (!form.sealType || !form.event || !form.location || !form.status) {
      toast.error("Complete all required fields.");
      return;
    }

    const formData = new FormData();

    formData.append("container_id", container.id);
    formData.append("container_number", container.container_number);
    formData.append("seal_number", form.sealNumber.trim());
    formData.append("previous_seal", container.current_seal_number);
    formData.append("seal_type", form.sealType);
    formData.append("event", form.event);
    formData.append("location", form.location);
    formData.append("status", form.status);
    formData.append("notes", form.notes.trim());

    if (photo) {
      formData.append("photo", photo);
    }

    setSaving(true);

    try {
      const res = await http.post("/operations/seals/save/", formData);
      const resp: Resp = res.data;

      if (resp.error) {
        toast.error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not save seal event."
        );
        return;
      }

      toast.success(
        typeof resp.data === "string"
          ? resp.data
          : "Seal event recorded successfully."
      );

      navigate("/operations/seals");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.data ||
          error?.response?.data?.message ||
          "Unable to save seal event."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Record seal event"
      eyebrow="Operations / Seal management"
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                New seal record
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Find a container and record its seal verification or custody
                event.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/operations/seals")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to seals
          </Button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Search className="size-4 text-orange" />

            <div>
              <h3 className="text-sm font-semibold">Container lookup</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Search for the container before recording a seal event.
              </p>
            </div>
          </div>

          <form
            onSubmit={searchContainer}
            className="flex flex-col gap-3 p-5 sm:flex-row"
          >
            <div className="flex-1">
              <Input
                className={inputClass}
                placeholder="Enter container number e.g. MSCU1234567"
                value={containerNumber}
                onChange={(e) => {
                  setContainerNumber(e.target.value.toUpperCase());
                  setContainer(null);
                  setPhoto(null);
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={searching || !containerNumber.trim()}
              className="h-11 rounded-xl bg-orange px-6 text-white hover:bg-orange-deep"
            >
              {searching ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              {searching ? "Searching..." : "Find container"}
            </Button>
          </form>
        </section>

        {container && (
          <>
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />

                  <div>
                    <h3 className="text-sm font-semibold">
                      Container details
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Retrieved from the container record.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Container found
                </span>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <Field label="Container number">
                  <Input
                    className={inputClass}
                    value={container.container_number}
                    readOnly
                  />
                </Field>

                <Field label="Bill of lading">
                  <Input
                    className={inputClass}
                    value={container.bill_of_lading || "—"}
                    readOnly
                  />
                </Field>

                <Field label="Consignment reference">
                  <Input
                    className={inputClass}
                    value={container.consignment_reference || "—"}
                    readOnly
                  />
                </Field>

                <Field label="Shipment reference">
                  <Input
                    className={inputClass}
                    value={container.shipment_reference || "—"}
                    readOnly
                  />
                </Field>

                <Field label="Existing seal number">
                  <Input
                    className={inputClass}
                    value={
                      container.current_seal_number || "No existing seal"
                    }
                    readOnly
                  />
                </Field>

                <Field label="Current location">
                  <Input
                    className={inputClass}
                    value={container.current_location || "—"}
                    readOnly
                  />
                </Field>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                  <ShieldCheck className="size-4 text-orange" />

                  <div>
                    <h3 className="text-sm font-semibold">
                      Seal information
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Record the physical seal as observed.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field label="Current seal number" required>
                    <Input
                      className={inputClass}
                      placeholder="Enter observed seal number"
                      value={form.sealNumber}
                      onChange={(e) => update("sealNumber", e.target.value)}
                    />
                  </Field>

                  <Field label="Previous seal number">
                    <Input
                      className={inputClass}
                      value={container.current_seal_number || "—"}
                      readOnly
                    />
                  </Field>

                  <Field label="Seal type" required>
                    <select
                      className={cn(inputClass, "cursor-pointer")}
                      value={form.sealType}
                      onChange={(e) => update("sealType", e.target.value)}
                    >
                      <option value="Shipping line seal">
                        Shipping line seal
                      </option>
                      <option value="Customs seal">Customs seal</option>
                      <option value="Terminal seal">Terminal seal</option>
                      <option value="High security seal">
                        High security seal
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Event type" required>
                    <select
                      className={cn(inputClass, "cursor-pointer")}
                      value={form.event}
                      onChange={(e) => update("event", e.target.value)}
                    >
                      <option value="Initial">Initial verification</option>
                      <option value="Custody change">Custody change</option>
                      <option value="Examination preparation">
                        Examination preparation
                      </option>
                      <option value="Return to storage">
                        Return to storage
                      </option>
                      <option value="Replacement">Seal replacement</option>
                    </select>
                  </Field>

                  <Field label="Event location" required>
                    <select
                      className={cn(inputClass, "cursor-pointer")}
                      value={form.location}
                      onChange={(e) => update("location", e.target.value)}
                    >
                      <option value="Receiving">Receiving</option>
                      <option value="YARD">Yard</option>
                      <option value="WAREHOUSE">Warehouse</option>
                      <option value="EXAMINATION_BAY">
                        Examination Bay
                      </option>
                    </select>
                  </Field>

                  <Field label="Seal condition / status" required>
                    <select
                      className={cn(inputClass, "cursor-pointer")}
                      value={form.status}
                      onChange={(e) => update("status", e.target.value)}
                    >
                      <option value="Pending verification">
                        Pending verification
                      </option>
                      <option value="Verified">Verified</option>
                      <option value="Intact">Intact</option>
                      <option value="Mismatch">Mismatch</option>
                      <option value="Broken">Broken</option>
                      <option value="Missing">Missing</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-4">
                  <h3 className="text-sm font-semibold">
                    Evidence and notes
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Attach a photo and record relevant observations.
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <Field label="Seal photo">
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-center transition-colors hover:bg-muted/40">
                      <FileText className="mb-2 size-5 text-muted-foreground" />

                      <span className="text-sm font-medium">
                        {photo ? photo.name : "Choose a seal photo"}
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG or WEBP
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) =>
                          setPhoto(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>

                    {photo && (
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                      >
                        <X className="size-3.5" />
                        Remove photo
                      </button>
                    )}
                  </Field>

                  <Field label="Notes / observations">
                    <textarea
                      className="min-h-28 w-full resize-y rounded-xl border border-[#D5D9E2] bg-white px-3 py-2.5 text-sm outline-none transition hover:border-[#AEB5C2] focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-orange/20"
                      placeholder="Describe the seal condition, discrepancies or other observations..."
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => navigate("/operations/seals")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-orange text-white hover:bg-orange-deep"
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {saving ? "Saving..." : "Save seal record"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
