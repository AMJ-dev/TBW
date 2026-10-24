import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  ClipboardList,
  Container,
  Building2,
  User,
  Loader2,
  ChevronDown,
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
import { http, type Resp } from "@/lib/httpClient";

type ContainerItem = {
  id: number;
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  cargoDescription: string;
  grossWeight: string;
  packages: string;
};

type SearchOption = {
  id: string;
  name: string;
  reference?: string;
  status?: string;
  email?: string;
  phone?: string;
};

const initialContainer = (): ContainerItem => ({
  id: Date.now() + Math.random(),
  containerNumber: "",
  containerType: "40ft",
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

function extractList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.code)) return payload.code;
  return [];
}

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

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
  const [consigneeOrganisationId, setConsigneeOrganisationId] = useState("");
  const [consigneeEmail, setConsigneeEmail] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [consigneeType, setConsigneeType] = useState<"organisation" | "individual">("organisation");
  const [consigneeContactPerson, setConsigneeContactPerson] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneeCountry, setConsigneeCountry] = useState("Nigeria");

  const [licensedAgent, setLicensedAgent] = useState("");
  const [licensedAgentId, setLicensedAgentId] = useState("");

  const [explanation, setExplanation] = useState("");
  const [containers, setContainers] = useState<ContainerItem[]>([
    initialContainer(),
  ]);
  const [containerTypes, setContainerTypes] = useState<string[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  const [documents, setDocuments] = useState<File[]>([]);
  const [declaration, setDeclaration] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestReference, setRequestReference] = useState("");
  const [validationError, setValidationError] = useState("");
  const [blSearchStatus, setBlSearchStatus] = useState("");
  const [blSearching, setBlSearching] = useState(false);

  const lastSearchedBl = useRef("");

  useEffect(() => {
    let active = true;

    const loadShipmentConfig = async () => {
      setConfigLoading(true);
      setConfigError("");

      try {
        const response = await http.get("/portal/shipment/config/");
        const resp: Resp = response.data;

        if (resp.error) {
          throw new Error(
            typeof resp.data === "string"
              ? resp.data
              : "Could not load container types.",
          );
        }

        const payload: any = resp.code ?? {};
        const rawTypes =
          payload.container_sizes ??
          payload.containerSizes ??
          payload.container_size ??
          payload.container_types ??
          payload.containerTypes;

        const types = Array.isArray(rawTypes)
          ? rawTypes
              .map((item: any) =>
                typeof item === "string"
                  ? item.trim()
                  : String(
                      item?.label ??
                        item?.name ??
                        item?.value ??
                        item?.id ??
                        "",
                    ).trim(),
              )
              .filter(Boolean)
          : [];

        if (!types.length) {
          throw new Error(
            "No container types were returned by shipment configuration.",
          );
        }

        if (active) {
          setContainerTypes(types);
          setContainers((current) =>
            current.map((item) => ({
              ...item,
              containerType: types.includes(item.containerType)
                ? item.containerType
                : (types[0] ?? item.containerType),
            })),
          );
        }
      } catch (error) {
        if (active) {
          setConfigError(
            error instanceof Error
              ? error.message
              : "Could not load container types.",
          );
        }
      } finally {
        if (active) setConfigLoading(false);
      }
    };

    void loadShipmentConfig();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = billOfLading.trim();

    if (
      query.length < 3 ||
      query.toUpperCase() === lastSearchedBl.current
    ) {
      return;
    }

    const timer = window.setTimeout(async () => {
      lastSearchedBl.current = query.toUpperCase();
      setBlSearching(true);
      setBlSearchStatus("");

      try {
        const response = await http.post("/portal/manifest/shipment-search/", { q: query });

        const payload = response.data;
        const records = Array.isArray(payload?.code) ? payload.code : Array.isArray(payload?.data) ? payload.data : [];

        const match = records.find((record: any) => String(record?.bill_of_lading ?? "").trim().toUpperCase() === query.toUpperCase()) ?? records[0];

        if (payload?.error || !match) {
          setBlSearchStatus(records.length ? "No exact bill of lading match found." : "No existing shipment found. Enter the details manually.");
          return;
        }

        setBillOfLading(String(match.bill_of_lading ?? query));
        setShippingLine(String(match.shipping_line ?? ""));
        setVessel(String(match.vessel_name ?? match.vessel ?? ""));
        setVoyage(String(match.voyage_number ?? match.voyage ?? ""));
        setArrivalDate(String(match.expected_arrival ?? match.eta ?? "").slice(0, 10));
        setOriginPort(String(match.origin_port ?? ""));

        const consigneeRecord = match.consignee && typeof match.consignee === "object" ? match.consignee : null;

        setConsignee(String(consigneeRecord?.organisation_name ?? consigneeRecord?.name ?? match.consignee_name ?? match.consignee ?? ""));
        setConsigneeOrganisationId(String(match.consignee_organisation_id ?? ""));
        setConsigneeType(match.consignee_type === "individual" ? "individual" : "organisation");
        setConsigneeEmail(String(consigneeRecord?.email ?? match.consignee_email ?? ""));
        setConsigneePhone(String(consigneeRecord?.phone ?? match.consignee_phone ?? ""));
        setConsigneeContactPerson(String(match.consignee_contact_person ?? ""));
        setConsigneeAddress(String(match.consignee_address ?? ""));
        setConsigneeCountry(String(match.consignee_country ?? ""));

        const agentRecord = match.agent && typeof match.agent === "object" ? match.agent : null;

        setLicensedAgentId(String(match.licensed_agent_id ?? ""));
        setLicensedAgent(String(agentRecord?.name ?? match.agent_name ?? match.licensed_agent_name ?? ""));

        if (Array.isArray(match.containers) && match.containers.length) {
          setContainers(
            match.containers.map((container: any, index: number) => ({
              id: Date.now() + index + Math.random(),
              containerNumber: String(container.container_no ?? container.container_number ?? ""),
              containerType: String(container.size ?? container.container_type ?? containerTypes[0] ?? "40ft", ),
              sealNumber: String(container.seal_no ?? container.seal_number ?? ""),
              cargoDescription: String(container.cargo_description ?? match.cargo_description ?? ""),
              grossWeight: String(container.gross_weight ?? match.gross_weight ?? ""),
              packages: String(container.package_count ?? container.packages ?? match.package_count ?? ""),
            })),
          );
        }

        setBlSearchStatus(`Shipment details loaded${match.shipment_reference ? ` (${match.shipment_reference})` : ""}. Review the information before continuing.`);
      } catch {
        setBlSearchStatus("Could not search for this bill of lading. Enter the details manually.");
      } finally {
        setBlSearching(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [billOfLading]);

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

  const addContainer = () => setContainers((current) => [...current, {...initialContainer(), containerType: containerTypes[0] ?? ""}]);

  const removeContainer = (id: number) => setContainers((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
  
  const addDocuments = (files: FileList | null) => {
    if (!files) return;

    setDocuments((current) => [
      ...current,
      ...Array.from(files).filter((file) => !current.some((existing) => existing.name === file.name && existing.size === file.size)),
    ]);
  };

  const removeDocument = (index: number) => {
    setDocuments((current) => current.filter((_, i) => i !== index));
  };

  const completedContainers = containers.filter((item) => item.containerNumber.trim() && item.cargoDescription.trim()).length;

  const handleContinue = () => {
    setValidationError("");

    if (step === 1) {
      const missingFields: string[] = [];

      if (!billOfLading.trim()) missingFields.push("bill of lading");
      if (!shippingLine.trim()) missingFields.push("shipping line");
      if (!vessel.trim()) missingFields.push("vessel name");
      if (!arrivalDate) missingFields.push("expected arrival date");
      if (!consignee.trim()) missingFields.push("consignee name");
      if (!explanation.trim()) missingFields.push("explanation");

      if (missingFields.length) {
        setValidationError(`Complete the required fields: ${missingFields.join(", ")}.`);
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      const incompleteContainer = containers.some(
        (item) =>
          !item.containerNumber.trim() ||
          !item.cargoDescription.trim(),
      );

      if (incompleteContainer) {
        setValidationError("Enter a container number and cargo description for every container.");
        return;
      }

      const normalizedNumbers = containers.map((item) => item.containerNumber.trim().toUpperCase());

      if (new Set(normalizedNumbers).size !== normalizedNumbers.length) {
        setValidationError("Each container number must be unique. Correct duplicate numbers.");
        return;
      }

      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setValidationError("");

    if (!declaration) {
      setValidationError("Confirm the declaration before submitting this direct intake request.");
      return;
    }

    if (!containers.length) {
      setValidationError("Add at least one affected container.");
      setStep(2);
      return;
    }

    const incompleteContainer = containers.some(item => !item.containerNumber.trim() || !item.cargoDescription.trim());

    if (incompleteContainer) {
      setValidationError("Enter a container number and cargo description for every container.");
      setStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("reason", reason);
      formData.append("bill_of_lading", billOfLading.trim());
      formData.append("shipping_line", shippingLine.trim());
      formData.append("vessel_name", vessel.trim());
      formData.append("voyage_number", voyage.trim());
      formData.append("expected_arrival", arrivalDate);
      formData.append("origin_port", originPort.trim());

      formData.append("consignee", consignee.trim());
      formData.append("consignee_organisation_id", consigneeOrganisationId);
      formData.append("consignee_type", consigneeType);
      formData.append("consignee_email", consigneeEmail.trim());
      formData.append("consignee_phone", consigneePhone.trim());
      formData.append("consignee_contact_person", consigneeContactPerson.trim());
      formData.append("consignee_address", consigneeAddress.trim());
      formData.append("consignee_country", consigneeCountry.trim());

      formData.append("licensed_agent_id", licensedAgentId);
      formData.append("licensed_agent_name", licensedAgent.trim());
      formData.append("explanation", explanation.trim());

      formData.append(
        "containers",
        JSON.stringify(
          containers.map((item) => ({
            container_no: item.containerNumber.trim().toUpperCase(),
            size: item.containerType,
            seal_no: item.sealNumber.trim(),
            cargo_description: item.cargoDescription.trim(),
            gross_weight: item.grossWeight === "" ? null : Number(item.grossWeight),
            package_count: item.packages === "" ? null : Number(item.packages),
          })),
        ),
      );

      documents.forEach((file) => formData.append("documents[]", file))
      const response = await http.post("/portal/direct-intake/", formData)
      const payload = response.data;

      if (payload?.error) throw new Error(typeof payload.data === "string" ? payload.data : "Could not submit the direct intake request.");

      const result = payload?.code;
      const reference = result?.request_reference ?? result?.reference ?? result?.direct_intake_reference ?? result?.id ?? "";

      setRequestReference(String(reference));
      setPrepared(true);
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Could not submit the direct intake request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Shipment information" },
    { number: 2, title: "Container details" },
    { number: 3, title: "Documents & review" },
  ];

  return (
    <AppShell title="Direct intake" eyebrow="Portal · Cargo requests">
      <div className="space-y-6 pb-8" style={{ animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)" }}>
        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral/5 p-4 text-sm text-coral">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="leading-5">{validationError}</p>
          </div>
        )}

        <div>
          <Button type="button" variant="ghost" onClick={() => navigate("/portal/shipments")} className="-ml-3 mb-4 gap-2 text-ink-soft hover:text-ink">
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
                Request operational approval for cargo missing from the carrier
                manifest. Supply the original shipping information, affected
                containers, and supporting evidence.
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
                  {requestReference || "Assigned after submission"}
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
              Direct intake request submitted
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-soft">
              The server accepted your request. Operations must review it before
              intake proceeds.
            </p>
            {requestReference && (
              <div className="mx-auto mt-5 max-w-md rounded-xl border border-line bg-sand p-4 text-left">
                <p className={labelClass}>Request reference</p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-ink">
                  {requestReference}
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/portal/shipments")}
                className="border-line"
              >
                Back to shipments
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
                    Complete each section before submitting your request.
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
                          Search for an existing shipment using its bill of
                          lading or enter the information manually.
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
                        onChange={(e) => {
                          setBillOfLading(e.target.value);
                          lastSearchedBl.current = "";
                        }}
                        placeholder="Enter carrier B/L number"
                        className={cn(inputClass, "font-mono")}
                      />
                      <p
                        className="mt-1.5 text-[11px] leading-5 text-ink-soft"
                        aria-live="polite"
                      >
                        {blSearching
                          ? "Searching existing shipments…"
                          : blSearchStatus ||
                            "Enter at least 3 characters to search."}
                      </p>
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
                        placeholder="Explain why the cargo is missing from the manifest and provide relevant references..."
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </section>

                <section className={`${cardClass} overflow-visible p-5 sm:p-6`}>
                  <div className="mb-5">
                    <h3 className="font-display text-sm font-bold text-ink">
                      Consignee details
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-ink-soft">
                      Details of the person or organisation receiving the
                      cargo.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <span className={labelClass}>Consignee type</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setConsigneeType("organisation")}
                          className={cn(
                            "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition",
                            consigneeType === "organisation"
                              ? "border-orange bg-orange/10 text-orange-deep"
                              : "border-line bg-sand text-ink-soft hover:border-orange/40",
                          )}
                        >
                          <Building2 className="size-3.5" />
                          Organisation
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConsigneeType("individual");
                            setConsigneeOrganisationId("");
                          }}
                          className={cn(
                            "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition",
                            consigneeType === "individual"
                              ? "border-orange bg-orange/10 text-orange-deep"
                              : "border-line bg-sand text-ink-soft hover:border-orange/40",
                          )}
                        >
                          <User className="size-3.5" />
                          Individual
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className={labelClass}>
                        {consigneeType === "organisation"
                          ? "Organisation / company name"
                          : "Consignee full name"}{" "}
                        <span className="text-coral">*</span>
                      </span>
                      {consigneeType === "organisation" ? (
                        <OrganisationSearchPicker
                          value={{
                            id: consigneeOrganisationId || null,
                            name: consignee,
                          }}
                          onChange={(next) => {
                            setConsigneeOrganisationId(next.id ?? "");
                            setConsignee(next.name);
                          }}
                        />
                      ) : (
                        <Input
                          required
                          value={consignee}
                          onChange={(e) => setConsignee(e.target.value)}
                          placeholder="Enter full name"
                          className={inputClass}
                        />
                      )}
                      <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                        Search for a registered organisation or enter the
                        consignee details manually.
                      </p>
                    </div>

                    <label className="block">
                      <span className={labelClass}>Contact person</span>
                      <Input
                        value={consigneeContactPerson}
                        onChange={(e) =>
                          setConsigneeContactPerson(e.target.value)
                        }
                        placeholder="Name of contact person"
                        className={inputClass}
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>Email address</span>
                        <Input
                          type="email"
                          value={consigneeEmail}
                          onChange={(e) => setConsigneeEmail(e.target.value)}
                          placeholder="contact@company.com"
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Phone number</span>
                        <Input
                          type="tel"
                          value={consigneePhone}
                          onChange={(e) => setConsigneePhone(e.target.value)}
                          placeholder="+234 ..."
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className={labelClass}>Address</span>
                      <textarea
                        rows={3}
                        value={consigneeAddress}
                        onChange={(e) => setConsigneeAddress(e.target.value)}
                        placeholder="Street address, city and state"
                        className={textareaClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Country</span>
                      <Input
                        value={consigneeCountry}
                        onChange={(e) => setConsigneeCountry(e.target.value)}
                        placeholder="e.g. Nigeria"
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <span className={labelClass}>Licensed agent</span>
                      <AgentSearchPicker
                        value={{
                          id: licensedAgentId || null,
                          name: licensedAgent,
                        }}
                        onChange={(next) => {
                          setLicensedAgentId(next.id ?? "");
                          setLicensedAgent(next.name);
                        }}
                      />
                      <p className="mt-2 text-[11px] leading-5 text-ink-soft">
                        Search for a registered licensed clearing agent.
                      </p>
                    </div>
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
                            {configLoading && (
                              <option value="">Loading container types...</option>
                            )}
                            {!configLoading && !containerTypes.length && (
                              <option value="">No container types available</option>
                            )}
                            {containerTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                            {!containerTypes.includes(item.containerType) &&
                              item.containerType && (
                                <option value={item.containerType}>
                                  {item.containerType}
                                </option>
                              )}
                          </select>
                          {configError && (
                            <span className="mt-1 block text-xs text-coral">
                              {configError}
                            </span>
                          )}
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
                            Cargo description <span className="text-coral">*</span>
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
                <section className={`${cardClass} overflow-visible p-5 sm:p-6`}>
                  <div className="mb-5">
                    <h3 className="font-display text-sm font-bold text-ink">
                      Supporting documents
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-ink-soft">
                      Attach documents that help Operations verify the direct
                      intake request.
                    </p>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-sand/50 p-8 text-center transition hover:border-orange/50 hover:bg-orange/5">
                    <Upload className="size-7 text-orange-deep" />
                    <span className="mt-3 text-sm font-semibold text-ink">
                      Select supporting documents
                    </span>
                    <span className="mt-1 text-xs text-ink-soft">
                      Choose files from your device
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addDocuments(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {documents.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center gap-3 rounded-lg border border-line bg-sand/60 p-3"
                        >
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper ring-1 ring-line">
                            <ClipboardList className="size-4 text-orange-deep" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-ink-soft">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="rounded-md p-2 text-ink-soft hover:bg-coral/10 hover:text-coral"
                            aria-label={`Remove ${file.name}`}
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
                        Check your information before submitting.
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
                      ["Contact person", consigneeContactPerson || "Not provided"],
                      ["Consignee email", consigneeEmail || "Not provided"],
                      ["Consignee phone", consigneePhone || "Not provided"],
                      ["Consignee address", consigneeAddress || "Not provided"],
                      ["Consignee country", consigneeCountry || "Not provided"],
                      ["Licensed agent", licensedAgent || "Not provided"],
                      ["Reason", reason.replace(/_/g, " ")],
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
                            <p className="break-all font-mono text-xs font-semibold text-ink">
                              {item.containerNumber}
                            </p>
                            <p className="mt-1 text-xs text-ink-soft">
                              {item.containerType} · {item.cargoDescription}
                            </p>
                            <p className="mt-1 text-[10px] text-ink-soft">
                              Seal: {item.sealNumber || "Not provided"} ·
                              Packages: {item.packages || "Not provided"} ·
                              Weight: {item.grossWeight || "Not provided"} kg
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
                      Direct intake requires Operations approval. Submitting
                      this request does not authorise cargo release or guarantee
                      acceptance.
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
                      onClick={() => {
                        setValidationError("");
                        setStep((current) => current - 1);
                      }}
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
                      disabled={!declaration || submitting}
                      onClick={handleSubmit}
                      className="gap-2 bg-orange text-white hover:bg-orange-deep"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      {submitting ? "Submitting..." : "Submit request"}
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

function OrganisationSearchPicker({
  value,
  onChange,
}: {
  value: { id: string | null; name: string };
  onChange: (next: { id: string | null; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setSearching(true);

      try {
        const response = await http.post(
          "/operations/manifests/organisations/",
          { q },
        );
        const resp: Resp = response.data;

        if (cancelled) return;

        if (resp.error) {
          setResults([]);
          return;
        }

        setResults(
          extractList(resp.code).map((item: any) => ({
            id: String(item.id ?? ""),
            name: String(
              item.name ?? item.organisation_name ?? "",
            ),
            reference: String(item.rc_number ?? item.rcNumber ?? ""),
            status: String(item.status ?? ""),
          })).filter((item: SearchOption) => item.id && item.name),
        );
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;

    const handle = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={containerRef} className="relative mt-1.5">
      <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink focus-within:ring-2 focus-within:ring-orange/30">
        <Building2 className="size-3.5 shrink-0 text-ink-soft" />
        <input
          value={open ? query : value.name}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange({ id: null, name: event.target.value });
          }}
          placeholder="Search registered organisations..."
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-soft/70"
        />
        {value.id && (
          <span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase text-orange-deep">
            Linked
          </span>
        )}
        {searching ? (
          <Loader2 className="size-3.5 animate-spin text-ink-soft" />
        ) : (
          <ChevronDown
            className={cn(
              "size-4 text-ink-soft transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
          <div className="max-h-64 overflow-y-auto p-1">
            {query.trim().length < 2 ? (
              <div className="px-3 py-6 text-center text-[12px] text-ink-soft">
                Type at least 2 characters to search.
              </div>
            ) : searching ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
                <Loader2 className="size-3.5 animate-spin" />
                Searching...
              </div>
            ) : results.length ? (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange({ id: item.id, name: item.name });
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left hover:bg-orange/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-ink">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-[10px] text-ink-soft">
                      {item.reference ? `RC ${item.reference} · ` : ""}
                      {item.status || "Registered organisation"}
                    </span>
                  </span>
                  <Check className="size-4 shrink-0 text-orange-deep" />
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-[12px] text-ink-soft">
                No registered organisation found. You can keep the name entered.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentSearchPicker({
  value,
  onChange,
}: {
  value: { id: string | null; name: string };
  onChange: (next: { id: string | null; name: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchOption[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setSearching(true);

      try {
        const response = await http.post(
          "/operations/manifests/agents/",
          { q },
        );
        const resp: Resp = response.data;

        if (cancelled) return;

        if (resp.error) {
          setResults([]);
          return;
        }

        setResults(
          extractList(resp.code).map((item: any) => ({
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            reference: String(
              item.licence_number ?? item.licenceNumber ?? "",
            ),
            email: String(item.contact_email ?? item.contactEmail ?? ""),
            phone: String(item.contact_phone ?? item.contactPhone ?? ""),
          })).filter((item: SearchOption) => item.id && item.name),
        );
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;

    const handle = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={containerRef} className="relative mt-1.5">
      <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-sand px-3 text-sm text-ink focus-within:ring-2 focus-within:ring-orange/30">
        <User className="size-3.5 shrink-0 text-ink-soft" />
        <input
          value={open ? query : value.name}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange({ id: null, name: event.target.value });
          }}
          placeholder="Search licensed agents..."
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-soft/70"
        />
        {value.id && (
          <span className="rounded-full bg-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase text-orange-deep">
            Linked
          </span>
        )}
        {searching ? (
          <Loader2 className="size-3.5 animate-spin text-ink-soft" />
        ) : (
          <ChevronDown
            className={cn(
              "size-4 text-ink-soft transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
          <div className="max-h-64 overflow-y-auto p-1">
            {query.trim().length < 2 ? (
              <div className="px-3 py-6 text-center text-[12px] text-ink-soft">
                Type at least 2 characters to search licensed agents.
              </div>
            ) : searching ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-ink-soft">
                <Loader2 className="size-3.5 animate-spin" />
                Searching...
              </div>
            ) : results.length ? (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange({ id: item.id, name: item.name });
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full rounded-lg p-3 text-left transition hover:bg-orange/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[12px] font-semibold text-ink">
                      {item.name}
                    </span>
                    <Check className="size-4 shrink-0 text-orange-deep" />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-ink-soft">
                    Licence: {item.reference || "Not provided"}
                  </p>
                  {(item.email || item.phone) && (
                    <p className="mt-1 truncate text-[10px] text-ink-soft">
                      {[item.email, item.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-[12px] text-ink-soft">
                No registered licensed agent found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}