import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  ClipboardList,
  Container,
  FileText,
  Info,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ContainerItem = {
  id: number;
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  cargoDescription: string;
  grossWeight: string;
  packages: string;
};

const containerTypes = [
  "20FT Standard",
  "40FT Standard",
  "40FT High Cube",
  "20FT Reefer",
  "40FT Reefer",
  "20FT Open Top",
  "40FT Open Top",
];

const initialContainer = (): ContainerItem => ({
  id: Date.now() + Math.random(),
  containerNumber: "",
  containerType: "40FT Standard",
  sealNumber: "",
  cargoDescription: "",
  grossWeight: "",
  packages: "",
});

const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const inputClass =
  "mt-1.5 h-11 border-line bg-sand text-ink placeholder:text-ink-soft/60";

const textareaClass =
  "mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const cardClass = "rounded-2xl bg-paper ring-1 ring-line";

export default function DirectIntakePage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("manifest_omission");
  const [billOfLading, setBillOfLading] = useState("");
  const [shippingLine, setShippingLine] = useState("");
  const [vessel, setVessel] = useState("");
  const [voyage, setVoyage] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [originPort, setOriginPort] = useState("");
  const [consignee, setConsignee] = useState("");
  const [consigneeEmail, setConsigneeEmail] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [licensedAgent, setLicensedAgent] = useState("");
  const [explanation, setExplanation] = useState("");
  const [containers, setContainers] = useState<ContainerItem[]>([
    initialContainer(),
  ]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [declaration, setDeclaration] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [requestReference, setRequestReference] = useState("");

  const updateContainer = (
    id: number,
    field: keyof ContainerItem,
    value: string,
  ) => {
    setContainers((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addContainer = () => {
    setContainers((current) => [...current, initialContainer()]);
  };

  const removeContainer = (id: number) => {
    setContainers((current) =>
      current.length > 1
        ? current.filter((item) => item.id !== id)
        : current,
    );
  };

  const addDocuments = (files: FileList | null) => {
    if (!files) return;
    setDocuments((current) => [
      ...current,
      ...Array.from(files).filter(
        (file) =>
          !current.some(
            (existing) =>
              existing.name === file.name && existing.size === file.size,
          ),
      ),
    ]);
  };

  const removeDocument = (index: number) => {
    setDocuments((current) => current.filter((_, i) => i !== index));
  };

  const completedContainers = containers.filter(
    (item) =>
      item.containerNumber.trim() && item.cargoDescription.trim(),
  ).length;

  const filledFields = [
    billOfLading,
    shippingLine,
    vessel,
    arrivalDate,
    consignee,
    explanation,
  ].filter((value) => value.trim()).length;

  const handleContinue = () => {
    if (step === 1) {
      if (
        !billOfLading.trim() ||
        !shippingLine.trim() ||
        !vessel.trim() ||
        !arrivalDate
      ) {
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (
        containers.some(
          (item) =>
            !item.containerNumber.trim() ||
            !item.cargoDescription.trim(),
        )
      ) {
        return;
      }
      setStep(3);
    }
  };

  const handlePrepare = () => {
    if (!declaration) return;

    setRequestReference(
      `TRN-DI-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,
    );
    setPrepared(true);
  };

  const steps = [
    { number: 1, title: "Shipment information" },
    { number: 2, title: "Container details" },
    { number: 3, title: "Documents & review" },
  ];

  return (
    <AppShell title="Direct intake" eyebrow="Portal · Cargo requests">
      <div
        className="space-y-6 pb-8"
        style={{
          animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/portal/shipments")}
            className="-ml-3 mb-4 gap-2 text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to shipments
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Organisation portal · Special request
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Direct Intake
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                Request operational approval for cargo that is missing from
                the carrier manifest. Supply the original shipping
                information, affected containers, and supporting evidence.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-paper p-3.5 ring-1 ring-line">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Request reference
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-ink">
                  {requestReference || "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {prepared ? (
          <section className={`${cardClass} px-5 py-14 text-center sm:px-10`}>
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal/10 text-teal-deep">
              <Check className="size-8" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-ink">
              Request preview prepared
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-soft">
              Your direct intake request has been prepared for demonstration.
              Nothing has been submitted or saved to the server.
            </p>
            <div className="mx-auto mt-5 max-w-md rounded-xl border border-line bg-sand p-4 text-left">
              <p className={labelClass}>Local reference</p>
              <p className="mt-2 font-mono text-sm font-semibold text-ink">
                {requestReference}
              </p>
              <p className="mt-3 text-xs text-ink-soft">
                {containers.length} container(s) · {documents.length} supporting
                document(s)
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPrepared(false)}
                className="border-line"
              >
                Return to request
              </Button>
              <Button
                onClick={() => navigate("/portal/shipments")}
                className="gap-2 bg-orange text-white hover:bg-orange-deep"
              >
                Back to shipments
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className={`${cardClass} p-5 sm:p-6`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">
                    Direct intake application
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    Complete each section before preparing your request.
                  </p>
                </div>
                <span className="rounded-full bg-orange/10 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-deep">
                  Step {step} of 3
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {steps.map((item) => {
                  const active = step === item.number;
                  const complete = step > item.number;

                  return (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => {
                        if (item.number < step) setStep(item.number);
                      }}
                      className="min-w-0 text-left"
                    >
                      <div
                        className={cn(
                          "mb-3 h-1.5 rounded-full transition-colors",
                          active || complete ? "bg-orange" : "bg-line",
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                            complete
                              ? "bg-teal text-white"
                              : active
                                ? "bg-orange/10 text-orange-deep"
                                : "bg-sand text-ink-soft",
                          )}
                        >
                          {complete ? (
                            <Check className="size-3.5" />
                          ) : (
                            item.number
                          )}
                        </span>
                        <span
                          className={cn(
                            "hidden text-xs sm:block",
                            active
                              ? "font-semibold text-ink"
                              : "text-ink-soft",
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {step === 1 && (
              <>
                <section className={`${cardClass} overflow-visible`}>
                  <div className="border-b border-line p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-bold text-ink">
                          Original shipment details
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          Reference the carrier shipment so Operations can
                          investigate the missing manifest entry.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                    <label className="block">
                      <span className={labelClass}>
                        Bill of lading <span className="text-coral">*</span>
                      </span>
                      <Input
                        required
                        value={billOfLading}
                        onChange={(e) => setBillOfLading(e.target.value)}
                        placeholder="Enter carrier B/L number"
                        className={cn(inputClass, "font-mono")}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>
                        Shipping line <span className="text-coral">*</span>
                      </span>
                      <Input
                        required
                        value={shippingLine}
                        onChange={(e) => setShippingLine(e.target.value)}
                        placeholder="Enter shipping line"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>
                        Vessel name <span className="text-coral">*</span>
                      </span>
                      <Input
                        required
                        value={vessel}
                        onChange={(e) => setVessel(e.target.value)}
                        placeholder="Enter vessel name"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Voyage number</span>
                      <Input
                        value={voyage}
                        onChange={(e) => setVoyage(e.target.value)}
                        placeholder="Enter voyage number"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>
                        Expected arrival <span className="text-coral">*</span>
                      </span>
                      <Input
                        required
                        type="date"
                        value={arrivalDate}
                        onChange={(e) => setArrivalDate(e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Origin port</span>
                      <Input
                        value={originPort}
                        onChange={(e) => setOriginPort(e.target.value)}
                        placeholder="Enter port of origin"
                        className={inputClass}
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className={labelClass}>
                        Reason for direct intake
                      </span>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className={cn(
                          inputClass,
                          "w-full rounded-md border px-3",
                        )}
                      >
                        <option value="manifest_omission">
                          Container omitted from carrier manifest
                        </option>
                        <option value="manifest_error">
                          Incorrect or incomplete manifest information
                        </option>
                        <option value="late_documentation">
                          Shipping documentation received late
                        </option>
                        <option value="other">Other reason</option>
                      </select>
                    </label>

                    <label className="block sm:col-span-2">
                      <span className={labelClass}>
                        Explanation <span className="text-coral">*</span>
                      </span>
                      <textarea
                        required
                        rows={4}
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Explain why the cargo is missing from the manifest and provide any relevant references..."
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </section>

                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-ink-soft">
                      <ClipboardList className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        Consignee and clearing agent
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">
                        Identify who owns or receives the cargo and the
                        licensed agent handling clearance.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>
                        Consignee name <span className="text-coral">*</span>
                      </span>
                      <Input
                        required
                        value={consignee}
                        onChange={(e) => setConsignee(e.target.value)}
                        placeholder="Registered organisation or individual"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Consignee email</span>
                      <Input
                        type="email"
                        value={consigneeEmail}
                        onChange={(e) => setConsigneeEmail(e.target.value)}
                        placeholder="consignee@example.com"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Consignee phone</span>
                      <Input
                        type="tel"
                        value={consigneePhone}
                        onChange={(e) => setConsigneePhone(e.target.value)}
                        placeholder="+234 ..."
                        className={inputClass}
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Licensed agent</span>
                      <Input
                        value={licensedAgent}
                        onChange={(e) => setLicensedAgent(e.target.value)}
                        placeholder="Enter licensed agent name or licence number"
                        className={inputClass}
                      />
                      <p className="mt-1.5 text-[11px] leading-5 text-ink-soft">
                        This is a UI placeholder. A searchable registered-agent
                        dropdown can be connected later.
                      </p>
                    </label>
                  </div>
                </section>
              </>
            )}

            {step === 2 && (
              <section className={`${cardClass} overflow-visible`}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                      <Container className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        Affected containers
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">
                        Add the container numbers that require direct intake.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addContainer}
                    className="gap-2 border-line"
                  >
                    <Plus className="size-4" />
                    Add container
                  </Button>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">
                      {containers.length} container(s)
                    </span>
                    <span className="rounded-lg bg-teal/10 px-3 py-2 text-xs text-teal-deep">
                      {completedContainers} completed
                    </span>
                  </div>

                  {containers.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-line bg-sand/60 p-4 sm:p-5"
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-lg bg-paper font-mono text-xs font-bold text-ink ring-1 ring-line">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-ink">
                              Container {index + 1}
                            </h4>
                            <p className="mt-0.5 text-[11px] text-ink-soft">
                              Cargo identification
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={containers.length === 1}
                          onClick={() => removeContainer(item.id)}
                          className="text-ink-soft hover:bg-coral/10 hover:text-coral"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className={labelClass}>
                            Container number <span className="text-coral">*</span>
                          </span>
                          <Input
                            required
                            value={item.containerNumber}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "containerNumber",
                                e.target.value.toUpperCase(),
                              )
                            }
                            placeholder="e.g. MSCU1234567"
                            className={cn(inputClass, "font-mono")}
                          />
                        </label>

                        <label className="block">
                          <span className={labelClass}>Container type</span>
                          <select
                            value={item.containerType}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "containerType",
                                e.target.value,
                              )
                            }
                            className={cn(
                              inputClass,
                              "w-full rounded-md border px-3",
                            )}
                          >
                            {containerTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className={labelClass}>Seal number</span>
                          <Input
                            value={item.sealNumber}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "sealNumber",
                                e.target.value.toUpperCase(),
                              )
                            }
                            placeholder="Enter seal number"
                            className={inputClass}
                          />
                        </label>

                        <label className="block">
                          <span className={labelClass}>Gross weight (kg)</span>
                          <Input
                            type="number"
                            min="0"
                            value={item.grossWeight}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "grossWeight",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 18500"
                            className={inputClass}
                          />
                        </label>

                        <label className="block">
                          <span className={labelClass}>Package count</span>
                          <Input
                            type="number"
                            min="0"
                            value={item.packages}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "packages",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 120"
                            className={inputClass}
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className={labelClass}>
                            Cargo description{" "}
                            <span className="text-coral">*</span>
                          </span>
                          <textarea
                            required
                            rows={3}
                            value={item.cargoDescription}
                            onChange={(e) =>
                              updateContainer(
                                item.id,
                                "cargoDescription",
                                e.target.value,
                              )
                            }
                            placeholder="Describe the goods in this container"
                            className={textareaClass}
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addContainer}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-4 text-xs font-semibold text-ink-soft transition hover:border-orange/50 hover:bg-orange/5 hover:text-orange-deep"
                  >
                    <Plus className="size-4" />
                    Add another container
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <>
                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        Supporting documents
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">
                        Add the documents Operations needs to verify the
                        missing manifest entry.
                      </p>
                    </div>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-sand/60 px-5 py-9 text-center transition hover:border-orange/50 hover:bg-orange/5">
                    <div className="grid size-12 place-items-center rounded-xl bg-paper text-orange-deep ring-1 ring-line">
                      <Upload className="size-5" />
                    </div>
                    <span className="mt-4 text-sm font-semibold text-ink">
                      Select supporting files
                    </span>
                    <span className="mt-1 text-xs leading-5 text-ink-soft">
                      Bill of lading, delivery order, carrier correspondence,
                      or other evidence
                    </span>
                    <span className="mt-3 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-medium text-ink">
                      Browse files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        addDocuments(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>

                  {documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documents.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}`}
                          className="flex items-center gap-3 rounded-xl border border-line p-3"
                        >
                          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand text-orange-deep">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink">
                              {file.name}
                            </p>
                            <p className="mt-1 text-[10px] text-ink-soft">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            aria-label={`Remove ${file.name}`}
                            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-coral/10 hover:text-coral"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex items-center gap-3">
                    <ClipboardList className="size-5 text-orange-deep" />
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        Review application
                      </h3>
                      <p className="mt-1 text-xs text-ink-soft">
                        Check your information before preparing the request.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Bill of lading", billOfLading],
                      ["Shipping line", shippingLine],
                      ["Vessel", vessel],
                      ["Voyage", voyage || "Not provided"],
                      ["Expected arrival", arrivalDate],
                      ["Origin port", originPort || "Not provided"],
                      ["Consignee", consignee],
                      ["Licensed agent", licensedAgent || "Not provided"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-line bg-sand/60 p-3"
                      >
                        <p className={labelClass}>{label}</p>
                        <p className="mt-1 break-words text-sm font-medium text-ink">
                          {value || "Not provided"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-ink-soft">
                        Affected containers
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink">
                        {containers.length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {containers.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-lg bg-sand p-3"
                        >
                          <Container className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-semibold text-ink">
                              {item.containerNumber}
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                              {item.containerType} ·{" "}
                              {item.cargoDescription}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] text-ink-soft">
                            #{index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange/25 bg-orange/5 p-4">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
                    <p className="text-xs leading-5 text-ink-soft">
                      Direct intake requires Operations approval. Preparing
                      this request does not authorize cargo release or
                      guarantee acceptance.
                    </p>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-1 size-4 shrink-0 accent-orange"
                    />
                    <span className="text-xs leading-5 text-ink-soft">
                      I confirm that the information provided is accurate to
                      the best of my knowledge and that the supporting
                      documents relate to this cargo.
                    </span>
                  </label>
                </section>
              </>
            )}

            <div className="sticky bottom-3 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                    Direct intake request
                  </p>
                  <p className="mt-1 text-xs text-sand/70">
                    {containers.length} container(s) · {documents.length}{" "}
                    document(s) · Step {step}/3
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/portal/shipments")}
                    className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
                  >
                    Cancel
                  </Button>

                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((current) => current - 1)}
                      className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
                    >
                      <ArrowLeft className="mr-1 size-4" />
                      Previous
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleContinue}
                      className="gap-2 bg-orange text-white hover:bg-orange-deep"
                    >
                      Continue
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={!declaration}
                      onClick={handlePrepare}
                      className="gap-2 bg-orange text-white hover:bg-orange-deep"
                    >
                      <ShieldCheck className="size-4" />
                      Prepare request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <section className="flex items-start gap-3 rounded-xl border border-line bg-sand/60 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
          <div>
            <p className="text-xs font-semibold text-ink">
              How direct intake works
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">
              Your organisation identifies the omitted cargo and supplies
              supporting evidence. Operations reviews the request and
              determines the appropriate next step before intake proceeds.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}