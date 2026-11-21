import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/router-link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Package,
  Plus,
  Ship,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";
import { PublicFrame, PublicKicker } from "@/components/public-shell";
import {format_currency} from "@/lib/functions"

type Currency = "NGN" | "USD";

type CargoItem = {
  id: string;
  hs_code: string;
  customs_tariff_id: string;
  tariff_description: string;
  description: string;
  quantity: string;
  unit: string;
  unit_value: string;
  currency: Currency;
};

type Container = {
  id: string;
  container_no: string;
  size: string;
  seal_no: string;
  package_count: string;
  gross_weight: string;
  items: CargoItem[];
};

type ConfigOption = { id: string; label: string };

const steps = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "shipment", label: "Shipment", icon: Ship },
  { key: "containers", label: "Containers & items", icon: Package },
  { key: "services", label: "Services", icon: ClipboardList },
  { key: "requirements", label: "Requirements", icon: UserRound },
  { key: "review", label: "Review", icon: Check },
] as const;

const services = [
  "Bonded warehousing",
  "Cargo receiving & handling",
  "Examination coordination",
  "Cargo documentation support",
];

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createItem = (): CargoItem => ({
  id: makeId(),
  hs_code: "",
  customs_tariff_id: "",
  tariff_description: "",
  description: "",
  quantity: "",
  unit: "PCS",
  unit_value: "",
  currency: "NGN",
});

const createContainer = (size = "40FT"): Container => ({
  id: makeId(),
  container_no: "",
  size,
  seal_no: "",
  package_count: "",
  gross_weight: "",
  items: [createItem()],
});

export default function QuotePage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billOfLading, setBillOfLading] = useState("");
  const [vessel, setVessel] = useState("");
  const [voyage, setVoyage] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("TRÏNŪ Bonded Warehouse");
  const [expectedArrival, setExpectedArrival] = useState("");
  const [cargoCategory, setCargoCategory] = useState("Containerised");
  const [valuationBasis, setValuationBasis] = useState("CIF");
  const [freightCost, setFreightCost] = useState("");
  const [insuranceCost, setInsuranceCost] = useState("");
  const [valuationCurrency, setValuationCurrency] = useState<Currency>("USD");
  const [containerSizes, setContainerSizes] = useState<ConfigOption[]>([]);
  const [containers, setContainers] = useState<Container[]>([createContainer()]);
  const [selectedServices, setSelectedServices] = useState<string[]>(services.slice(0, 3));
  const [requirements, setRequirements] = useState("");
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quoteReference, setQuoteReference] = useState("");

  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const response = await http.get("/portal/shipment/config/");
        const resp = response.data as Resp;
        if (resp.error) {
          throw new Error(String(resp.data || "Could not load shipment configuration."));
        }

        const config = resp.code && typeof resp.code === "object"
          ? resp.code as Record<string, unknown>
          : {};
        const configuredSizes = Array.isArray(config["container_sizes"])
          ? config["container_sizes"].filter((item: any) => item && item.id && item.label).map((item: any) => ({
              id: String(item.id),
              label: String(item.label),
            }))
          : [];

        if (active) {
          setContainerSizes(configuredSizes);
          if (configuredSizes.length) {
            const validSizes = configuredSizes.map((item) => item.label.toUpperCase());
            setContainers((current) => current.map((container) => ({
              ...container,
              size: validSizes.includes(container.size.toUpperCase()) ? container.size : (validSizes[0] ?? container.size),
            })));
          }
          setConfigLoading(false);
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Could not load shipment configuration.");
        }
      } finally {
        if (active) setConfigLoading(false);
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    return containers.reduce(
      (result, container) => {
        container.items.forEach((item) => {
          const total = Number(item.quantity || 0) * Number(item.unit_value || 0);
          if (item.currency === "USD") result.usd += total;
          else result.ngn += total;
        });
        return result;
      },
      { ngn: 0, usd: 0 },
    );
  }, [containers]);

  const updateContainer = (containerId: string, field: keyof Omit<Container, "id" | "items">, value: string) => {
    setContainers((current) =>
      current.map((container) =>
        container.id === containerId ? { ...container, [field]: value } : container,
      ),
    );
  };

  const updateItem = (
    containerId: string,
    itemId: string,
    field: keyof Omit<CargoItem, "id">,
    value: string,
  ) => {
    setContainers((current) =>
      current.map((container) =>
        container.id === containerId
          ? {
              ...container,
              items: container.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item,
              ),
            }
          : container,
      ),
    );
  };

  const addContainer = () => setContainers((current) => [
    ...current,
    createContainer(containerSizes[0]?.label.toUpperCase() || "40FT"),
  ]);

  const removeContainer = (containerId: string) => {
    setContainers((current) => current.filter((container) => container.id !== containerId));
  };

  const addItem = (containerId: string) => {
    setContainers((current) =>
      current.map((container) =>
        container.id === containerId
          ? { ...container, items: [...container.items, createItem()] }
          : container,
      ),
    );
  };

  const removeItem = (containerId: string, itemId: string) => {
    setContainers((current) =>
      current.map((container) =>
        container.id === containerId
          ? { ...container, items: container.items.filter((item) => item.id !== itemId) }
          : container,
      ),
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service],
    );
  };

  const validateStep = () => {
    if (step === 0) {
      if (company.trim().length < 3) {
        toast.error("Enter your company name.");
        return false;
      }
      if (!contact.trim() || !email.trim() || !phone.trim()) {
        toast.error("Complete the contact person, email and phone fields.");
        return false;
      }
    }

    if (step === 1 && !billOfLading.trim()) {
      toast.error("Enter the bill of lading number.");
      return false;
    }

    if (step === 2) {
      if (containers.length === 0) {
        toast.error("Add at least one container.");
        return false;
      }

      for (let index = 0; index < containers.length; index += 1) {
        const container = containers[index];
        if (!container?.container_no.trim()) {
          toast.error(`Enter the container number for container ${index + 1}.`);
          return false;
        }
        if (container.items.length === 0) {
          toast.error(`Add at least one cargo item to container ${index + 1}.`);
          return false;
        }
        for (let itemIndex = 0; itemIndex < container.items.length; itemIndex += 1) {
          const item = container.items[itemIndex];
          if (!item?.customs_tariff_id || !item.description.trim() || !item.hs_code.trim() || !item.quantity || !item.unit) {
            toast.error(`Select a valid customs tariff and complete the description, quantity and unit for item ${itemIndex + 1} in container ${index + 1}.`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const saveQuote = async () => {
    if (!validateStep() || saving) return;

    const formData = new FormData();
    formData.append("company_name", company);
    formData.append("contact_person", contact);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("bill_of_lading", billOfLading);
    formData.append("vessel_name", vessel);
    formData.append("voyage_number", voyage);
    formData.append("origin", origin);
    formData.append("destination", destination);
    formData.append("expected_arrival", expectedArrival);
    formData.append("cargo_category", cargoCategory);
    formData.append("valuation_basis", valuationBasis);
    formData.append("freight_cost", freightCost || "0");
    formData.append("insurance_cost", insuranceCost || "0");
    formData.append("valuation_currency", valuationCurrency);
    formData.append("requirements", requirements);
    formData.append("containers_count", String(containers.length));

    selectedServices.forEach((service, index) => {
      formData.append(`services[${index}]`, service);
    });

    containers.forEach((container, containerIndex) => {
      formData.append(`containers[${containerIndex}][container_no]`, container.container_no);
      formData.append(`containers[${containerIndex}][size]`, container.size);
      formData.append(`containers[${containerIndex}][seal_no]`, container.seal_no);
      formData.append(`containers[${containerIndex}][package_count]`, container.package_count);
      formData.append(`containers[${containerIndex}][gross_weight]`, container.gross_weight);
      formData.append(`containers[${containerIndex}][items_count]`, String(container.items.length));

      container.items.forEach((item, itemIndex) => {
        formData.append(`containers[${containerIndex}][items][${itemIndex}][customs_tariff_id]`, item.customs_tariff_id);
        formData.append(`containers[${containerIndex}][items][${itemIndex}][hs_code]`, item.hs_code);
        formData.append(`containers[${containerIndex}][items][${itemIndex}][item_description]`, item.description);
        formData.append(`containers[${containerIndex}][items][${itemIndex}][quantity]`, item.quantity);
        formData.append(`containers[${containerIndex}][items][${itemIndex}][unit_of_measure]`, item.unit);
        formData.append(`containers[${containerIndex}][items][${itemIndex}][unit_value]`, item.unit_value || "0");
        formData.append(`containers[${containerIndex}][items][${itemIndex}][currency]`, item.currency);
        formData.append(
          `containers[${containerIndex}][items][${itemIndex}][total_value]`,
          String(Number(item.quantity || 0) * Number(item.unit_value || 0)),
        );
      });
    });

    setSaving(true);
    try {
      const response = await http.post("/save-quote/", formData);
      const resp = response.data as Resp;

      if (resp.error) {
        throw new Error(String(resp.data || "Could not save quote request."));
      }

      const result = resp.code && typeof resp.code === "object"
        ? resp.code as Record<string, unknown>
        : {};
      const reference = result["quote_reference"] ?? result["reference"] ?? result["id"];
      setQuoteReference(reference ? String(reference) : "");
      setSubmitted(true);
      toast.success("Quote request submitted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save quote request.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step === steps.length - 1) {
      void saveQuote();
      return;
    }
    setStep((current) => current + 1);
  };

  if (submitted) {
    return (
      <PublicFrame>
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
            <Check className="size-8" />
          </div>
          <PublicKicker>Quote brief prepared</PublicKicker>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Your shipment details are ready.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-ink-soft">
            Your quote request has been received. Keep the reference below for future enquiries.
          </p>
          <div className="mt-8 rounded-2xl bg-sand p-6 text-left ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-orange">Company</p>
                <p className="mt-1 font-semibold text-ink">{company}</p>
                {quoteReference && <p className="mt-1 font-mono text-xs text-ink-soft">Reference: {quoteReference}</p>}
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-orange">Containers</p>
                <p className="mt-1 font-semibold text-ink">{containers.length}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {containers.map((container, index) => (
                <div key={container.id} className="rounded-xl bg-paper p-4 ring-1 ring-line">
                  <p className="font-mono text-sm font-bold text-ink">
                    {index + 1}. {container.container_no} · {container.size}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">{container.items.length} cargo item(s)</p>
                  <div className="mt-3 space-y-2">
                    {container.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap justify-between gap-2 text-sm">
                        <span className="text-ink">{item.description} <span className="text-ink-soft">({item.hs_code})</span></span>
                        <span className="text-ink-soft">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setSubmitted(false); setStep(5); }}>
              <ArrowLeft className="mr-2 size-4" /> Back to review
            </Button>
            <Link to="/" className="inline-flex items-center rounded-md bg-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-deep">
              Return home
            </Link>
          </div>
        </main>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <main>
        <section className="relative overflow-hidden border-b border-line bg-paper">
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
            <div>
              <PublicKicker>Request a quote</PublicKicker>
              <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
                Plan the <span className="text-orange">next move.</span>
              </h1>
              <p className="mt-5 max-w-xl leading-7 text-ink-soft">
                Provide your shipment information, add each container and declare the cargo items packed inside it.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[[String(steps.length).padStart(2, "0"), "Form steps"], ["NGN / USD", "Item values"], ["No upload", "Documents not needed"]].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
                  <p className="font-display text-lg font-bold text-ink">{value}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-orange">Progress</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <p className="font-display text-3xl font-bold text-ink">{String(step + 1).padStart(2, "0")}</p>
                    <p className="font-mono text-[11px] text-ink-soft">/ {String(steps.length).padStart(2, "0")}</p>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-orange transition-[width] duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                  </div>
                  <ol className="mt-6 space-y-1">
                    {steps.map(({ key, label, icon: Icon }, index) => {
                      const active = index === step;
                      const done = index < step;
                      return (
                        <li key={key} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-orange font-semibold text-white" : done ? "text-orange" : "text-ink-soft"}`}>
                          <span className={`grid size-7 place-items-center rounded-md border text-[11px] ${done ? "border-orange bg-orange text-white" : active ? "border-white/40 text-white" : "border-line"}`}>
                            {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                          </span>
                          {label}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <div className="mt-4 rounded-2xl bg-paper p-5 ring-1 ring-line">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-orange">Cargo declaration</p>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">
                    Add every container separately. Each container can contain multiple cargo item lines with its own HS code and quantity.
                  </p>
                </div>
              </aside>

              <div className="overflow-hidden rounded-2xl bg-paper shadow-lg ring-1 ring-line">
                <div className="border-b border-line p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.15em] text-orange">
                        Step {String(step + 1).padStart(2, "0")} of {String(steps.length).padStart(2, "0")}
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-bold text-ink">{steps[step]?.label}</h2>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line">
                      Quote details
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <div className="space-y-5">
                    {step === 0 && (
                      <div className="space-y-4">
                        <Field label="Company name" placeholder="Atlantic Trade Nigeria Ltd" value={company} onChange={setCompany} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Contact person" placeholder="Mary Adeyemi" value={contact} onChange={setContact} />
                          <Field label="Email address" placeholder="ops@company.ng" type="email" value={email} onChange={setEmail} />
                          <Field label="Phone number" placeholder="+234 803 000 0000" value={phone} onChange={setPhone} />
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Bill of lading number" placeholder="E.g. MAEU123456789" value={billOfLading} onChange={setBillOfLading} />
                        <Field label="Vessel name" placeholder="Vessel name" value={vessel} onChange={setVessel} />
                        <Field label="Voyage number" placeholder="Voyage number" value={voyage} onChange={setVoyage} />
                        <Field label="Port / country of origin" placeholder="Shanghai, China" value={origin} onChange={setOrigin} />
                        <Field label="Destination" placeholder="Destination" value={destination} onChange={setDestination} />
                        <Field label="Expected arrival" type="date" value={expectedArrival} onChange={setExpectedArrival} />
                        <label className="block sm:col-span-2">
                          <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Cargo category</span>
                          <select value={cargoCategory} onChange={(event) => setCargoCategory(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30">
                            {["Containerised", "General", "Agricultural", "Industrial", "Automotive", "Project cargo"].map((category) => <option key={category}>{category}</option>)}
                          </select>
                        </label>
                        <div className="sm:col-span-2 rounded-xl border border-line bg-sand/60 p-4">
                          <h3 className="font-display font-bold text-ink">Cargo valuation</h3>
                          <p className="mt-1 mb-4 text-xs leading-5 text-ink-soft">Enter freight and insurance for the whole shipment, not separately for each container or cargo item. If the goods value is already CIF, these costs are included in the declared item values and must not be added again.</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Valuation basis</span>
                              <select value={valuationBasis} onChange={(event) => setValuationBasis(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink">
                                <option value="CIF">CIF</option>
                                <option value="FOB">FOB</option>
                                <option value="EXW">EXW</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Freight / insurance currency</span>
                              <select value={valuationCurrency} onChange={(event) => setValuationCurrency(event.target.value as Currency)} className="mt-2 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink">
                                <option value="USD">USD</option>
                                <option value="NGN">NGN</option>
                              </select>
                            </label>
                            <Field label="Freight cost" type="number" placeholder="Enter total freight cost" value={freightCost} onChange={setFreightCost} />
                            <Field label="Insurance cost" type="number" placeholder="Enter total insurance cost" value={insuranceCost} onChange={setInsuranceCost} />
                          </div>
                          <p className="mt-3 text-[11px] leading-5 text-ink-soft">Freight and insurance are optional at submission. Operations can complete missing values later. For CIF declarations, leave separate costs at zero when they are already included in the declared goods value.</p>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        {configLoading && (
                          <p className="rounded-lg bg-sand px-3 py-2 text-xs text-ink-soft">Loading shipment configuration...</p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display font-bold text-ink">Container declaration</h3>
                            <p className="mt-1 text-sm text-ink-soft">Enter container details, then add the cargo items inside it.</p>
                          </div>
                          <Button type="button" onClick={addContainer} className="bg-orange text-white hover:bg-orange-deep">
                            <Plus className="mr-2 size-4" /> Add container
                          </Button>
                        </div>

                        {containers.map((container, containerIndex) => (
                          <section key={container.id} className="overflow-hidden rounded-xl border border-line">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand/70 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="grid size-8 place-items-center rounded-lg bg-ink text-white"><Package className="size-4" /></span>
                                <div>
                                  <p className="font-semibold text-ink">Container {containerIndex + 1}</p>
                                  <p className="text-xs text-ink-soft">{container.items.length} cargo item(s)</p>
                                </div>
                              </div>
                              {containers.length > 1 && (
                                <Button type="button" variant="ghost" onClick={() => removeContainer(container.id)} className="text-carmine hover:bg-carmine/10 hover:text-carmine">
                                  <Trash2 className="mr-2 size-4" /> Remove
                                </Button>
                              )}
                            </div>

                            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                              <Field label="Container number" placeholder="ABCD1234567" value={container.container_no} onChange={(value) => updateContainer(container.id, "container_no", value)} />
                              <label className="block">
                                <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Container size</span>
                                <select value={container.size} onChange={(event) => updateContainer(container.id, "size", event.target.value)} disabled={configLoading || containerSizes.length === 0} className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink disabled:opacity-60">
                                  {containerSizes.map((size) => <option key={size.id} value={size.label.toUpperCase()}>{size.label}</option>)}
                                </select>
                              </label>
                              <Field label="Seal number" placeholder="Seal number" value={container.seal_no} onChange={(value) => updateContainer(container.id, "seal_no", value)} />
                              <Field label="Package count" type="number" placeholder="e.g. 450" value={container.package_count} onChange={(value) => updateContainer(container.id, "package_count", value)} />
                              <Field label="Gross weight (kg)" type="number" placeholder="e.g. 18420" value={container.gross_weight} onChange={(value) => updateContainer(container.id, "gross_weight", value)} />
                            </div>

                            <div className="border-t border-line bg-paper p-4">
                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-ink">Cargo items</p>
                                  <p className="text-xs text-ink-soft">HS code, description, quantity and declared value for each item.</p>
                                </div>
                                <Button type="button" variant="outline" onClick={() => addItem(container.id)} className="border-orange/40 text-orange-deep hover:bg-orange/5">
                                  <Plus className="mr-2 size-4" /> Add item
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {container.items.map((item, itemIndex) => (
                                  <div key={item.id} className="rounded-lg border border-line bg-sand/40 p-3">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-deep">Item {itemIndex + 1}</p>
                                      {container.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(container.id, item.id)} className="inline-flex items-center gap-1 text-xs font-medium text-carmine hover:underline">
                                          <Trash2 className="size-3.5" /> Remove item
                                        </button>
                                      )}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <TariffSearchField
                                        value={item.hs_code}
                                        description={item.tariff_description}
                                        onSelect={(tariff) => {
                                          updateItem(container.id, item.id, "hs_code", tariff.hs_code);
                                          updateItem(container.id, item.id, "customs_tariff_id", tariff.id);
                                          updateItem(container.id, item.id, "tariff_description", tariff.description || "");
                                          if (!item.description.trim()) {
                                            updateItem(container.id, item.id, "description", tariff.description || "");
                                          }
                                        }}
                                      />
                                      <Field label="Item description" placeholder="Describe the goods" value={item.description} onChange={(value) => updateItem(container.id, item.id, "description", value)} />
                                      <Field label="Quantity" type="number" placeholder="Quantity" value={item.quantity} onChange={(value) => updateItem(container.id, item.id, "quantity", value)} />
                                      <Field label="Unit of measure" placeholder="PCS, CTN, KG..." value={item.unit} onChange={(value) => updateItem(container.id, item.id, "unit", value.toUpperCase())} />
                                      <Field label="Unit value" type="number" placeholder="0.00" value={item.unit_value} onChange={(value) => updateItem(container.id, item.id, "unit_value", value)} />
                                      <label className="block">
                                        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Currency</span>
                                        <select value={item.currency} onChange={(event) => updateItem(container.id, item.id, "currency", event.target.value)} className="mt-2 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink">
                                          <option value="NGN">NGN</option>
                                          <option value="USD">USD</option>
                                        </select>
                                      </label>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between rounded-md bg-paper px-3 py-2">
                                      <span className="text-xs text-ink-soft">Item total</span>
                                      <span className="font-mono text-sm font-bold text-ink">
                                        {format_currency(Number(item.quantity || 0) * Number(item.unit_value || 0), item.currency)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        ))}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-sand p-4 ring-1 ring-line">
                            <p className="text-xs uppercase tracking-wider text-ink-soft">Declared value · NGN</p>
                            <p className="mt-1 font-display text-xl font-bold text-ink">{format_currency(totals.ngn, "NGN")}</p>
                          </div>
                          <div className="rounded-lg bg-sand p-4 ring-1 ring-line">
                            <p className="text-xs uppercase tracking-wider text-ink-soft">Declared value · USD</p>
                            <p className="mt-1 font-display text-xl font-bold text-ink">{format_currency(totals.usd, "USD")}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-3">
                        <p className="text-sm text-ink-soft">Select the services you may require.</p>
                        {services.map((service) => (
                          <label key={service} className="flex cursor-pointer items-center gap-3 rounded-xl bg-sand px-4 py-3 ring-1 ring-line transition-colors hover:bg-sand/70">
                            <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} className="size-4 accent-orange" />
                            <span className="text-sm text-ink">{service}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {step === 4 && (
                      <label className="block">
                        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Special requirements</span>
                        <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className="mt-2 min-h-36 w-full rounded-md border border-line bg-sand px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30" placeholder="Handling instructions, storage duration, access requirements or other notes" />
                      </label>
                    )}

                    {step === 5 && (
                      <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Summary label="Company" value={company} />
                          <Summary label="Contact person" value={contact} />
                          <Summary label="Email" value={email} />
                          <Summary label="Phone" value={phone} />
                          <Summary label="Bill of lading" value={billOfLading} />
                          <Summary label="Vessel / Voyage" value={[vessel, voyage].filter(Boolean).join(" / ")} />
                          <Summary label="Origin" value={origin} />
                          <Summary label="Expected arrival" value={expectedArrival} />
                          <Summary label="Cargo category" value={cargoCategory} />
                          <Summary label="Valuation basis" value={valuationBasis} />
                          <Summary label="Freight cost" value={`${format_currency(Number(freightCost || 0), valuationCurrency)} (${valuationCurrency})`} />
                          <Summary label="Insurance cost" value={`${format_currency(Number(insuranceCost || 0), valuationCurrency)} (${valuationCurrency})`} />
                          <Summary label="Selected services" value={selectedServices.join(", ") || "None selected"} />
                        </div>
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-display font-bold text-ink">Containers and cargo items</h3>
                            <span className="text-xs text-ink-soft">{containers.length} container(s)</span>
                          </div>
                          <div className="space-y-3">
                            {containers.map((container, index) => (
                              <div key={container.id} className="rounded-xl bg-sand p-4 ring-1 ring-line">
                                <div className="flex flex-wrap justify-between gap-2">
                                  <p className="font-mono text-sm font-bold text-ink">{container.container_no} · {container.size}</p>
                                  <p className="text-xs text-ink-soft">{container.package_count || "—"} packages · {container.gross_weight || "—"} kg</p>
                                </div>
                                <p className="mt-1 text-xs text-ink-soft">Seal: {container.seal_no || "—"}</p>
                                <div className="mt-3 space-y-2">
                                  {container.items.map((item, itemIndex) => (
                                    <div key={item.id} className="flex flex-wrap items-start justify-between gap-2 border-t border-line pt-2 text-sm">
                                      <div>
                                        <p className="font-medium text-ink">{item.description}</p>
                                        <p className="font-mono text-xs text-ink-soft">HS {item.hs_code} · {item.quantity} {item.unit}</p>
                                      </div>
                                      <p className="font-mono text-xs font-semibold text-ink">{format_currency(Number(item.quantity || 0) * Number(item.unit_value || 0), item.currency)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <label className="block rounded-xl bg-sand p-4 ring-1 ring-line">
                          <span className="font-mono text-xs uppercase tracking-wider text-orange">Additional requirements</span>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{requirements || "None provided"}</p>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
                    <Button variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="text-ink-soft">
                      <ArrowLeft className="mr-2 size-4" /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft sm:inline">
                        {step === steps.length - 1 ? "Review complete" : `${steps.length - step - 1} steps remaining`}
                      </span>
                      <Button onClick={next} disabled={saving} className="bg-orange text-white hover:bg-orange-deep">
                        {saving ? "Submitting..." : step === steps.length - 1 ? "Submit quote request" : "Continue"}
                        <ArrowRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicFrame>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="mt-2 h-11 border-line bg-sand text-ink"
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-sand px-4 py-3 ring-1 ring-line">
      <p className="font-mono text-[10px] uppercase tracking-wider text-orange">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value || "—"}</p>
    </div>
  );
}


type TariffOption = {
  id: string;
  hs_code: string;
  description: string;
};

function TariffSearchField({
  value,
  description,
  onSelect,
}: {
  value: string;
  description: string;
  onSelect: (tariff: TariffOption) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<TariffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchTariffs = useCallback(async (search: string) => {
    if (search.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setSearchError("");

    try { 
      const response = await http.post("/admin/config/customs-tariffs/search/", {
        q: search.trim(),
        as_of: new Date().toISOString().slice(0, 10),
        limit: 20,
        page: 1,
      });
      const resp = response.data as Resp;

      if (resp.error) {
        throw new Error(String(resp.data || "Could not search customs tariffs."));
      }

      const result = resp.code && typeof resp.code === "object"
        ? resp.code as Record<string, unknown>
        : {};
      const tariffs = Array.isArray(result["tariffs"]) ? result["tariffs"] : [];

      setResults(
        tariffs
          .filter((tariff: any) => tariff && tariff.id && tariff.hs_code)
          .map((tariff: any) => ({
            id: String(tariff.id),
            hs_code: String(tariff.hs_code),
            description: String(tariff.description || ""),
          })),
      );
      setOpen(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Could not search customs tariffs.");
      setResults([]);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query.trim().length >= 2 && query !== value) {
        void searchTariffs(query);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query, value, searchTariffs]);

  return (
    <div className="relative min-w-0">
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Search customs tariff / HS code</span>
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          placeholder="Search by HS code or description"
          className="mt-2 h-11 border-line bg-paper text-ink"
        />
      </label>
      {value && !open && (
        <p className="mt-1 text-[11px] text-ink-soft">
          Selected: {value}{description ? ` · ${description}` : ""}
        </p>
      )}
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-paper shadow-xl">
          {loading ? (
            <p className="p-3 text-xs text-ink-soft">Searching customs tariffs...</p>
          ) : searchError ? (
            <p className="p-3 text-xs text-carmine">{searchError}</p>
          ) : results.length ? (
            results.map((tariff) => (
              <button
                key={tariff.id}
                type="button"
                onClick={() => {
                  onSelect(tariff);
                  setQuery(tariff.hs_code);
                  setOpen(false);
                }}
                className="block w-full border-b border-line px-3 py-2 text-left last:border-0 hover:bg-sand"
              >
                <span className="block font-mono text-xs font-bold text-orange-deep">{tariff.hs_code}</span>
                <span className="mt-0.5 block text-xs text-ink">{tariff.description || "No tariff description"}</span>
              </button>
            ))
          ) : (
            <p className="p-3 text-xs text-ink-soft">No matching active tariff found.</p>
          )}
        </div>
      )}
    </div>
  );
}
