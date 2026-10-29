import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Container,
  FileSearch,
  Info,
  LoaderCircle,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Weight,
  X,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

type LookupType = "gate_pass" | "bill_of_lading" | "shipment_reference";

type ReceivingLocation = {
  id: string;
  code: string;
  name: string;
};

type ContainerRecord = {
  id: string;
  container_no: string;
  gate_status: string;
  receiving_status: string;
  expected_seal_no: string;
  actual_seal_no: string;
  condition: string;
  actual_weight: string;
  receiving_location: string;
  receiving_location_id: string;
  remarks: string;
  selected: boolean;
};

type Shipment = {
  id: string;
  shipment_reference: string;
  bill_of_lading: string;
  gate_pass_number: string | null;
  consignee: string;
  vessel_name: string;
  voyage_number: string;
  total_containers: number;
  containers: ContainerRecord[];
};

const lookupOptions: {
  value: LookupType;
  label: string;
  placeholder: string;
}[] = [
  {
    value: "gate_pass",
    label: "Gate Pass Number",
    placeholder: "Enter gate pass number",
  },
  {
    value: "bill_of_lading",
    label: "Bill of Lading",
    placeholder: "Enter bill of lading",
  },
  {
    value: "shipment_reference",
    label: "Shipment Reference",
    placeholder: "Enter shipment reference",
  },
];

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-ink/40 focus:ring-2 focus:ring-ink/5";

const labelClass = "mb-1.5 block text-xs font-semibold text-ink-soft";

function formatStatus(status: string) {
  return (status || "PENDING")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getProgress(containers: ContainerRecord[]) {
  const entered = containers.filter(
    (container) => container.gate_status === "ENTERED"
  );

  const received = containers.filter(
    (container) => container.receiving_status === "RECEIVED"
  );

  const discrepancies = containers.filter(
    (container) => container.receiving_status === "DISCREPANCY"
  );

  return {
    entered: entered.length,
    received: received.length,
    discrepancies: discrepancies.length,
    outstanding: containers.filter(
      (container) => container.gate_status !== "ENTERED"
    ).length,
    pending: entered.filter(
      (container) =>
        container.receiving_status !== "RECEIVED" &&
        container.receiving_status !== "DISCREPANCY"
    ).length,
  };
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-sand p-2.5 text-ink-soft">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-soft">{detail}</p>
    </div>
  );
}

function getLocationsFromResponse(data: unknown): ReceivingLocation[] {
  let rows: unknown[] = [];

  if (Array.isArray(data)) {
    rows = data;
  } else if (data && typeof data === "object") {
    const result = data as {
      locations?: unknown[];
      results?: unknown[];
      items?: unknown[];
      code?: { locations?: unknown[] } | null;
    };

    if (Array.isArray(result.locations)) rows = result.locations;
    else if (Array.isArray(result.results)) rows = result.results;
    else if (Array.isArray(result.items)) rows = result.items;
    else if (Array.isArray(result.code?.locations)) rows = result.code.locations;
  }

  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row: any) => ({
      id: String(row.id ?? ""),
      code: String(row.location_code ?? row.code ?? ""),
      name: String(row.location_name ?? row.name ?? ""),
    }))
    .filter((location) => location.id !== "" && location.name !== "");
}

function normalizeContainer(
  container: Partial<ContainerRecord> & {
    container_condition?: string | null;
    actual_weight?: string | number | null;
  }
): ContainerRecord {
  return {
    id: container.id || "",
    container_no: container.container_no || "",
    gate_status: container.gate_status || "NOT_ENTERED",
    receiving_status: container.receiving_status || "PENDING",
    expected_seal_no: container.expected_seal_no || "",
    actual_seal_no: container.actual_seal_no || "",
    condition: container.condition || container.container_condition || "",
    actual_weight:
      container.actual_weight === null || container.actual_weight === undefined
        ? ""
        : String(container.actual_weight),
    receiving_location: container.receiving_location || "",
    receiving_location_id: container.receiving_location_id || "",
    remarks: container.remarks || "",
    selected: false,
  };
}

export default function OperationsReceivingNewPage() {
  const navigate = useNavigate();

  const [lookupType, setLookupType] = useState<LookupType>("gate_pass");
  const [lookupValue, setLookupValue] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [saved, setSaved] = useState(false);

  const [receivingLocations, setReceivingLocations] = useState<
    ReceivingLocation[]
  >([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");

  const [damageProofs, setDamageProofs] = useState<
    Record<string, File | null>
  >({});

  const selectedLookup = lookupOptions.find(
    (option) => option.value === lookupType
  )!;

  const progress = useMemo(
    () => getProgress(shipment?.containers ?? []),
    [shipment]
  );

  const eligibleContainers = useMemo(
    () =>
      shipment?.containers.filter(
        (container) =>
          container.gate_status === "ENTERED" &&
          container.receiving_status !== "RECEIVED"
      ) ?? [],
    [shipment]
  );

  const selectedContainers = useMemo(
    () => eligibleContainers.filter((container) => container.selected),
    [eligibleContainers]
  );

  useEffect(() => {
    let active = true;

    const loadReceivingLocations = async () => {
      setLocationsLoading(true);
      setLocationsError("");

      try {
        const response = await http.post("/admin/config/search-location/", {
          q: "RECEIVING",
        });

        const resp: Resp = response.data;

        if (resp.error) {
          throw new Error(
            String(resp.data || "Could not load receiving locations.")
          );
        }

        const locations = getLocationsFromResponse(resp.code ?? resp.data);

        if (active) {
          setReceivingLocations(locations);
        }
      } catch (error: unknown) {
        if (active) {
          setLocationsError(
            error instanceof Error
              ? error.message
              : "Could not load receiving locations."
          );
        }
      } finally {
        if (active) {
          setLocationsLoading(false);
        }
      }
    };

    loadReceivingLocations();

    return () => {
      active = false;
    };
  }, []);

  const updateContainer = (
    containerId: string,
    updates: Partial<ContainerRecord>
  ) => {
    setShipment((current) => {
      if (!current) return current;

      return {
        ...current,
        containers: current.containers.map((container) =>
          container.id === containerId
            ? { ...container, ...updates }
            : container
        ),
      };
    });
  };

  const findShipment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!lookupValue.trim()) {
      setLoadError("Enter a reference number to find the shipment.");
      return;
    }

    setLoading(true);
    setLoadError("");
    setSaveError("");
    setNotice("");
    setShipment(null);
    setSaved(false);
    setStep(1);
    setDamageProofs({});

    try {
      const response = await http.post("/operator/receiving/search/", {
        type: lookupType,
        q: lookupValue.trim(),
      });

      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(String(resp.data || "Could not find the shipment."));
      }

      const result = resp.data as Shipment | null;

      if (!result || !result.id || !Array.isArray(result.containers)) {
        throw new Error(
          "The receiving API did not return the expected shipment and container data."
        );
      }

      const normalizedShipment: Shipment = {
        ...result,
        containers: result.containers.map((container) =>
          normalizeContainer(container as Partial<ContainerRecord>)
        ),
      };

      setShipment(normalizedShipment);

      if (
        !normalizedShipment.containers.some(
          (container) => container.gate_status === "ENTERED"
        )
      ) {
        setNotice(
          "No containers have been recorded as entering the gate. Gate Management must record gate entry before receiving can proceed."
        );
      } else if (!normalizedShipment.gate_pass_number) {
        setNotice(
          "No gate pass number was returned for this shipment. Verify the gate-entry details before proceeding."
        );
      }
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not find the shipment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAllEligible = (selected: boolean) => {
    setShipment((current) => {
      if (!current) return current;

      return {
        ...current,
        containers: current.containers.map((container) => ({
          ...container,
          selected:
            selected &&
            container.gate_status === "ENTERED" &&
            container.receiving_status !== "RECEIVED",
        })),
      };
    });

    setSaveError("");
  };

  const continueToVerification = () => {
    if (!selectedContainers.length) {
      setSaveError("Select at least one eligible container.");
      return;
    }

    setSaveError("");
    setStep(2);
  };

  const saveReceiving = async () => {
    if (!shipment || !selectedContainers.length) return;

    setSaveError("");

    const invalidContainer = selectedContainers.find((container) => {
      if (!container.condition) return true;
      if (!container.receiving_location_id) return true;
      if (
        container.condition === "SEAL_MISMATCH" &&
        !container.actual_seal_no.trim()
      ) {
        return true;
      }
      return false;
    });

    if (invalidContainer) {
      setSaveError(
        `Complete the condition, receiving location, and required seal details for ${invalidContainer.container_no}.`
      );
      return;
    }

    const sealMismatchWithoutCondition = selectedContainers.find(
      (container) => {
        const expected = container.expected_seal_no.trim().toUpperCase();
        const actual = container.actual_seal_no.trim().toUpperCase();

        return (
          expected !== "" &&
          actual !== "" &&
          expected !== actual &&
          container.condition !== "SEAL_MISMATCH"
        );
      }
    );

    if (sealMismatchWithoutCondition) {
      setSaveError(
        `The actual seal for ${sealMismatchWithoutCondition.container_no} differs from the expected seal. Select Seal mismatch and verify the observed seal number.`
      );
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("shipment_id", shipment.id);

      formData.append(
        "containers",
        JSON.stringify(
          selectedContainers.map((container) => ({
            container_id: container.id,
            container_no: container.container_no,
            expected_seal_no: container.expected_seal_no,
            actual_seal_no: container.actual_seal_no.trim(),
            condition: container.condition,
            actual_weight: container.actual_weight,
            receiving_location_id: container.receiving_location_id,
            remarks: container.remarks,
          }))
        )
      );

      selectedContainers.forEach((container) => {
        const file = damageProofs[container.id];

        if (container.condition === "DAMAGED" && file) {
          formData.append(`damage_proof[${container.id}]`, file);
        }
      });

      const response = await http.post("/operator/receiving/save/", formData);

      const resp: Resp = response.data;

      if (resp.error) {
        throw new Error(String(resp.data || "Could not save receiving."));
      }

      setSaved(true);
      setNotice(
        "Receiving was saved successfully. The shipment has been refreshed with its latest receiving progress."
      );
      setStep(1);
      setDamageProofs({});

      const refreshResponse = await http.post("/operator/receiving/search/", {
        type: lookupType,
        q: lookupValue.trim(),
      });

      const refreshResp: Resp = refreshResponse.data;

      if (!refreshResp.error && refreshResp.data) {
        const refreshed = refreshResp.data as Shipment;

        if (refreshed.id && Array.isArray(refreshed.containers)) {
          setShipment({
            ...refreshed,
            containers: refreshed.containers.map((container) =>
              normalizeContainer(container as Partial<ContainerRecord>)
            ),
          });
        }
      }
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save receiving. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSearch = () => {
    setShipment(null);
    setLookupValue("");
    setLoadError("");
    setSaveError("");
    setNotice("");
    setSaved(false);
    setStep(1);
    setDamageProofs({});
  };

  return (
    <AppShell title="New Receiving" eyebrow="Terminal Operations">
      <main className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <button
              type="button"
              onClick={() => navigate("/operations/receiving")}
              className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft transition hover:text-ink"
            >
              <ArrowLeft size={16} />
              Back to Receiving
            </button>

            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              New Receiving
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
              Find an existing shipment, verify containers recorded at the gate, and confirm the cargo physically received at the terminal.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-line bg-paper px-3 py-2 text-xs font-medium text-ink-soft">
            <ShieldCheck size={16} className="text-teal" />
            Shipment-linked receiving
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { number: 1, title: "Find shipment", description: "Locate the declaration" },
            { number: 2, title: "Verify containers", description: "Inspect actual arrivals" },
            { number: 3, title: "Confirm receiving", description: "Record physical receipt" },
          ].map((item) => (
            <div
              key={item.number}
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                step === item.number
                  ? "border-teal/30 bg-teal/5"
                  : "border-line bg-paper"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  saved && item.number === 3
                    ? "bg-teal text-white"
                    : step === item.number
                      ? "bg-ink text-white"
                      : "bg-sand text-ink-soft"
                }`}
              >
                {saved && item.number === 3 ? <CheckCircle2 size={17} /> : item.number}
              </div>

              <div>
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <FileSearch size={18} className="text-ink-soft" />
              <h2 className="text-sm font-semibold text-ink">Find Shipment to Receive</h2>
            </div>

            <p className="mt-1 text-xs text-ink-soft">
              Search existing shipment records. Receiving does not create shipments or gate passes.
            </p>
          </div>

          <form onSubmit={findShipment} className="space-y-4 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
              <div>
                <label htmlFor="lookup-type" className={labelClass}>Search by</label>
                <select
                  id="lookup-type"
                  value={lookupType}
                  onChange={(event) => setLookupType(event.target.value as LookupType)}
                  className={inputClass}
                >
                  {lookupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="lookup-value" className={labelClass}>
                  {selectedLookup.label}
                </label>
                <input
                  id="lookup-value"
                  value={lookupValue}
                  onChange={(event) => setLookupValue(event.target.value)}
                  placeholder={selectedLookup.placeholder}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />}
                {loading ? "Searching..." : "Find Shipment"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal" />
                Gate Pass preferred
              </span>
              <span>B/L supported</span>
              <span>Shipment reference supported</span>
            </div>

            {loadError && (
              <div className="flex items-start gap-2 rounded-xl border border-coral/20 bg-coral/5 p-3 text-sm text-coral">
                <X size={17} className="mt-0.5 shrink-0" />
                <p>{loadError}</p>
              </div>
            )}
          </form>
        </section>

        {notice && (
          <div className="flex items-start gap-2 rounded-xl border border-orange/20 bg-orange/5 p-4 text-sm text-ink">
            <Info size={17} className="mt-0.5 shrink-0 text-orange" />
            <p>{notice}</p>
          </div>
        )}

        {shipment && (
          <>
            <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-start sm:px-6">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge label="completed" />
                    <span className="text-xs text-ink-soft">Shipment found</span>
                  </div>

                  <h2 className="text-lg font-semibold text-ink">
                    {shipment.shipment_reference}
                  </h2>

                  <p className="mt-1 text-sm text-ink-soft">
                    Bill of Lading: {shipment.bill_of_lading || "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSearch}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink transition hover:bg-sand"
                >
                  <Search size={14} />
                  Search another
                </button>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                <div>
                  <p className={labelClass}>Gate Pass Number</p>
                  <p className="break-words text-sm font-semibold text-ink">
                    {shipment.gate_pass_number || "Not available"}
                  </p>
                </div>

                <div>
                  <p className={labelClass}>Consignee</p>
                  <p className="text-sm font-semibold text-ink">
                    {shipment.consignee || "—"}
                  </p>
                </div>

                <div>
                  <p className={labelClass}>Vessel / Voyage</p>
                  <p className="text-sm font-semibold text-ink">
                    {shipment.vessel_name || "—"}
                    {shipment.voyage_number ? ` / ${shipment.voyage_number}` : ""}
                  </p>
                </div>

                <div>
                  <p className={labelClass}>Total Containers</p>
                  <p className="text-sm font-semibold text-ink">
                    {shipment.total_containers ?? shipment.containers.length}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Expected containers" value={shipment.containers.length} icon={Container} detail="Linked to this shipment" />
              <SummaryCard label="Gate entered" value={progress.entered} icon={Truck} detail="Recorded by Gate Management" />
              <SummaryCard label="Received" value={progress.received} icon={CheckCircle2} detail="Physical receipt confirmed" />
              <SummaryCard label="Outstanding" value={progress.outstanding} icon={Package} detail="Not yet recorded as gate-in" />
            </section>

            {step === 1 && (
              <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Verify Arrived Containers</h2>
                    <p className="mt-1 text-xs text-ink-soft">
                      Only containers recorded as entered by Gate Management can be selected.
                    </p>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-line bg-sand px-2.5 py-1 text-xs font-semibold text-ink-soft">
                    {eligibleContainers.length} eligible
                  </span>
                </div>

                {shipment.containers.length === 0 ? (
                  <div className="p-10 text-center">
                    <Container size={30} className="mx-auto text-ink-soft" />
                    <h3 className="mt-3 text-sm font-semibold text-ink">No containers found</h3>
                    <p className="mt-1 text-xs text-ink-soft">
                      This shipment has no linked containers to receive.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                      <thead className="bg-sand/60">
                        <tr className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                          <th className="px-5 py-3">Select</th>
                          <th className="px-5 py-3">Container</th>
                          <th className="px-5 py-3">Gate Status</th>
                          <th className="px-5 py-3">Receiving Status</th>
                          <th className="px-5 py-3">Expected Seal</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-line">
                        {shipment.containers.map((container) => {
                          const eligible =
                            container.gate_status === "ENTERED" &&
                            container.receiving_status !== "RECEIVED";

                          return (
                            <tr key={container.id}>
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={container.selected}
                                  disabled={!eligible}
                                  onChange={(event) => {
                                    updateContainer(container.id, {
                                      selected: event.target.checked,
                                    });
                                    setSaveError("");
                                  }}
                                  className="h-4 w-4 cursor-pointer accent-teal disabled:cursor-not-allowed"
                                  aria-label={`Select ${container.container_no}`}
                                />
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-ink">
                                  {container.container_no}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                {container.gate_status === "ENTERED" ? (
                                  <span className="inline-flex rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[11px] font-semibold text-teal">
                                    Entered
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full border border-orange/20 bg-orange/10 px-2.5 py-1 text-[11px] font-semibold text-orange">
                                    Awaiting gate entry
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-full border border-line bg-sand px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                                  {formatStatus(container.receiving_status)}
                                </span>
                              </td>

                              <td className="px-5 py-4 font-mono text-sm text-ink-soft">
                                {container.expected_seal_no || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {eligibleContainers.length > 0 && (
                  <div className="border-t border-line bg-sand/30 p-5 sm:px-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <p className="text-sm text-ink-soft">
                        <span className="font-semibold text-ink">{selectedContainers.length}</span> of {eligibleContainers.length} eligible containers selected
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleAllEligible(true)}
                        className="cursor-pointer self-start text-xs font-semibold text-ink underline-offset-4 hover:underline sm:self-auto"
                      >
                        Select all eligible
                      </button>
                    </div>

                    {saveError && <p className="mt-3 text-sm text-coral">{saveError}</p>}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={continueToVerification}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                      >
                        Enter Container Conditions
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
                <div className="border-b border-line p-5 sm:px-6 bg-sand/20">
                  <h2 className="text-sm font-semibold text-ink">Physical Receiving Verification</h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Verify the physical condition and seal numbers for the selected containers.
                  </p>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {selectedContainers.map((container) => {
                    const expectedSeal = container.expected_seal_no.trim().toUpperCase();
                    const actualSeal = container.actual_seal_no.trim().toUpperCase();
                    const sealDiffers = expectedSeal !== "" && actualSeal !== "" && expectedSeal !== actualSeal;

                    return (
                      <div key={container.id} className="overflow-hidden rounded-2xl border border-line shadow-sm">
                        
                        {/* Container Header */}
                        <div className="flex items-center gap-3 border-b border-line bg-sand/50 p-4">
                          <div className="grid size-10 place-items-center rounded-xl bg-ink text-white">
                            <Container size={20} />
                          </div>
                          <div>
                            <h3 className="font-mono text-base font-bold text-ink">{container.container_no}</h3>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 space-y-6">
                          {/* SEAL COMPARISON SECTION */}
                          <div>
                            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
                              <ShieldCheck size={14} /> Seal Verification
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>Expected Seal Number (System)</label>
                                <input
                                  value={container.expected_seal_no}
                                  readOnly
                                  className={`${inputClass} bg-sand/50 font-mono font-bold text-ink-soft`}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Actual Seal Number Found</label>
                                <input
                                  value={container.actual_seal_no}
                                  onChange={(event) =>
                                    updateContainer(container.id, { actual_seal_no: event.target.value })
                                  }
                                  placeholder="Enter physical seal number"
                                  className={cn(
                                    inputClass,
                                    "font-mono",
                                    sealDiffers && "border-coral/50 focus:border-coral focus:ring-coral/20"
                                  )}
                                />
                              </div>
                            </div>

                            {sealDiffers && (
                              <div className="mt-3 flex items-start gap-2 rounded-lg border border-coral/20 bg-coral/5 p-3 text-sm text-coral">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <p>
                                  <strong>Warning:</strong> The actual seal differs from the expected seal. Make sure you select "Seal mismatch" in the condition dropdown below.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* CONDITION SECTION */}
                          <div className="border-t border-line pt-5">
                            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
                              <ImageIcon size={14} /> Condition & Evidence
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelClass}>Container Condition *</label>
                                <select
                                  value={container.condition}
                                  onChange={(event) => {
                                    updateContainer(container.id, { condition: event.target.value });
                                    setSaveError("");
                                  }}
                                  className={inputClass}
                                >
                                  <option value="">Select condition</option>
                                  <option value="GOOD">Good / Intact</option>
                                  <option value="SEAL_MISMATCH">Seal Mismatch</option>
                                  <option value="DAMAGED">Damaged</option>
                                  <option value="OTHER_DISCREPANCY">Other Discrepancy</option>
                                </select>
                              </div>

                              {container.condition === "DAMAGED" && (
                                <div>
                                  <label className={labelClass}>Upload Damage Proof (Optional)</label>
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,application/pdf"
                                      onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        if (file && file.size > 10 * 1024 * 1024) {
                                          setSaveError("File size must not exceed 10 MB.");
                                          event.target.value = "";
                                          return;
                                        }
                                        setDamageProofs((current) => ({
                                          ...current,
                                          [container.id]: file,
                                        }));
                                        setSaveError("");
                                      }}
                                      className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                    <div className="flex h-[46px] w-full items-center justify-between rounded-xl border border-dashed border-line bg-sand px-3 text-sm text-ink-soft">
                                      {damageProofs[container.id] ? (
                                        <span className="truncate text-ink font-medium">{damageProofs[container.id]?.name}</span>
                                      ) : (
                                        <span className="flex items-center gap-2"><Upload size={16} /> Attach photo or PDF</span>
                                      )}
                                    </div>
                                  </div>
                                  {damageProofs[container.id] && (
                                    <button
                                      type="button"
                                      onClick={() => setDamageProofs((c) => ({ ...c, [container.id]: null }))}
                                      className="mt-1.5 text-xs text-coral hover:underline"
                                    >
                                      Remove file
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* LOCATION & WEIGHT SECTION */}
                          <div className="border-t border-line pt-5">
                            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-2">
                              <MapPin size={14} /> Storage & Details
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <label className={labelClass}>Receiving Location *</label>
                                <select
                                  value={container.receiving_location_id}
                                  onChange={(event) => {
                                    const location = receivingLocations.find((item) => item.id === event.target.value);
                                    updateContainer(container.id, {
                                      receiving_location_id: location?.id || "",
                                      receiving_location: location?.name || "",
                                    });
                                    setSaveError("");
                                  }}
                                  disabled={locationsLoading || receivingLocations.length === 0}
                                  className={inputClass}
                                >
                                  <option value="">
                                    {locationsLoading ? "Loading locations..." : receivingLocations.length === 0 ? "No locations available" : "Select receiving location"}
                                  </option>
                                  {receivingLocations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                      {location.name} {location.code ? `(${location.code})` : ""}
                                    </option>
                                  ))}
                                </select>
                                {locationsError && <p className="mt-1.5 text-xs text-coral">{locationsError}</p>}
                              </div>

                              <div>
                                <label className={labelClass}>Actual Weight (kg)</label>
                                <div className="relative">
                                  <Weight size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={container.actual_weight}
                                    onChange={(event) =>
                                      updateContainer(container.id, { actual_weight: event.target.value })
                                    }
                                    placeholder="Enter weight"
                                    className={`${inputClass} pl-10`}
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-2 lg:col-span-1">
                                <label className={labelClass}>Remarks</label>
                                <input
                                  value={container.remarks}
                                  onChange={(event) =>
                                    updateContainer(container.id, { remarks: event.target.value })
                                  }
                                  placeholder="Optional notes..."
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {saveError && (
                    <div className="rounded-xl border border-coral/20 bg-coral/5 p-4 text-sm text-coral">
                      {saveError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse justify-between gap-3 border-t border-line pt-5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setSaveError("");
                      }}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sand"
                    >
                      <ArrowLeft size={16} />
                      Back to Containers
                    </button>

                    <button
                      type="button"
                      onClick={saveReceiving}
                      disabled={saving || selectedContainers.length === 0 || locationsLoading}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                      {saving ? "Saving..." : "Confirm Receiving"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {!shipment && !loading && !loadError && (
          <div className="rounded-2xl border border-dashed border-line bg-paper px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-ink-soft">
              <Package size={25} />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-ink">Ready to receive cargo?</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
              Search using a gate pass number, bill of lading, or shipment reference to load an existing shipment and check its arrived containers.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}