import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http, type Resp } from "@/lib/httpClient";

type Driver = {
  id: string;
  name: string;
  phone: string;
  status: string;
  licence_expiry?: string | null | undefined;
};

type Vehicle = {
  id: string;
  plate: string;
  kind?: string | undefined;
  make?: string | undefined;
  model?: string | undefined;
  status: string;
  insurance_expiry?: string | null | undefined;
  roadworthiness_expiry?: string | null | undefined;
  drivers?: Driver[];
  assigned_drivers?: Driver[];
};

type VehicleSearchResponse = {
  id?: string | undefined;
  plate?: string | undefined;
  kind?: string | undefined;
  make?: string | undefined;
  model?: string | undefined;
  status?: string | undefined;
  insurance_expiry?: string | null | undefined;
  roadworthiness_expiry?: string | null | undefined;
  drivers?: Driver[];
  assigned_drivers?: Driver[];
};

function extractList<T>(resp: Resp): T[] {
  const value = resp.code ?? resp.data;

  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;

    for (const key of ["vehicles", "results", "items", "data"]) {
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }

  return [];
}

function normalizeVehicle(item: VehicleSearchResponse): Vehicle {
  return {
    id: String(item.id ?? ""),
    plate: String(item.plate ?? ""),
    kind: item.kind,
    make: item.make,
    model: item.model,
    status: String(item.status ?? ""),
    insurance_expiry: item.insurance_expiry,
    roadworthiness_expiry: item.roadworthiness_expiry,
    drivers: item.drivers ?? [],
    assigned_drivers: item.assigned_drivers ?? [],
  };
}

export default function GatePassFormPage() {
  const navigate = useNavigate();
  const requestRef = useRef(0);

  const [plateQuery, setPlateQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverOptions, setDriverOptions] = useState<Driver[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [type, setType] = useState("Terminal Entry");
  const [validUntil, setValidUntil] = useState("");
  const [containerNos, setContainerNos] = useState([""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const query = plateQuery.trim();
    const requestId = ++requestRef.current;

    if (selectedVehicle || query.length < 2) {
      setVehicles([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const response = await http.post("vehicles/search/", {
          q: query,
          include_assigned: 1,
        });

        const resp: Resp = response.data;

        if (requestId !== requestRef.current) return;

        if (resp.error) {
          setVehicles([]);
        } else {
          const results = extractList<VehicleSearchResponse>(resp)
            .map(normalizeVehicle)
            .filter((vehicle) =>
              vehicle.plate.toLowerCase().includes(query.toLowerCase()),
            );

          setVehicles(results);
        }

        setShowResults(true);
      } catch {
        if (requestId === requestRef.current) {
          setVehicles([]);
          setShowResults(true);
        }
      } finally {
        if (requestId === requestRef.current) setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [plateQuery, selectedVehicle]);

  const selectVehicle = (vehicle: Vehicle) => {
    const drivers = [
      ...(vehicle.drivers ?? []),
      ...(vehicle.assigned_drivers ?? []),
    ];

    const uniqueDrivers = Array.from(
      new Map(drivers.map((driver) => [driver.id, driver])).values(),
    ).filter((driver) => driver.status.toLowerCase() === "approved");

    setSelectedVehicle(vehicle);
    setPlateQuery(vehicle.plate);
    setVehicles([]);
    setShowResults(false);
    setDriverOptions(uniqueDrivers);

    if (uniqueDrivers.length === 1) {
      setSelectedDriver(uniqueDrivers[0] ?? null);
    } else {
      setSelectedDriver(null);
      if (uniqueDrivers.length === 0) {
        toast.error("No approved assigned driver was returned for this vehicle.");
      }
    }
  };

  const clearVehicle = () => {
    requestRef.current++;
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setDriverOptions([]);
    setPlateQuery("");
    setVehicles([]);
    setShowResults(false);
  };

  const updateContainer = (index: number, value: string) => {
    setContainerNos((current) =>
      current.map((container, i) => (i === index ? value.toUpperCase() : container)),
    );
  };

  const addContainer = () => setContainerNos((current) => [...current, ""]);

  const removeContainer = (index: number) => {
    setContainerNos((current) =>
      current.length === 1
        ? [""]
        : current.filter((_, i) => i !== index),
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedVehicle) {
      toast.error("Search for and select a vehicle.");
      return;
    }

    if (!selectedDriver) {
      toast.error("Select the assigned driver.");
      return;
    }

    const containers = containerNos
      .map((container) => container.trim().toUpperCase())
      .filter(Boolean);

    if (containers.length === 0) {
      toast.error("Enter at least one container number.");
      return;
    }

    if (new Set(containers).size !== containers.length) {
      toast.error("Duplicate container numbers are not allowed.");
      return;
    }

    if (!validUntil) {
      toast.error("Select when the pass expires.");
      return;
    }

    if (new Date(validUntil).getTime() <= Date.now()) {
      toast.error("The expiry date and time must be in the future.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await http.post("gate-passes/add/", {
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        type,
        container_nos: containers,
        valid_until: validUntil.replace("T", " ") + ":00",
      });

      const resp: Resp = response.data;

      if (resp.error) {
        toast.error(String(resp.data || "Could not issue gate pass."));
        return;
      }

      const responseData = resp.code as { id: string; pass_code: string } | null;
      const passId = responseData?.id;

      toast.success(String(resp.data || "Gate pass issued successfully."));
      
      if (passId) {
        navigate(`/gate/passes/${passId}`, { replace: true });
      } else {
        navigate("/gate/passes", { replace: true });
      }
    } catch {
      toast.error("Could not issue gate pass. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Issue Gate Pass" eyebrow="Gate Control · New Pass">
      <motion.div
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -48 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <button
          type="button"
          onClick={() => navigate("/gate/passes")}
          className="cursor-pointer inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back to gate passes
        </button>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
            New security credential
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Issue gate pass
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Search for a registered vehicle, confirm its assigned driver, and
            add every container covered by this pass.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-sand">
                <Truck className="size-5 text-ink" />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Vehicle and driver</h3>
                <p className="text-xs text-ink-soft">
                  Driver details are retrieved from the selected vehicle.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">
                Truck plate number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                <Input
                  value={plateQuery}
                  onChange={(event) => {
                    setSelectedVehicle(null);
                    setSelectedDriver(null);
                    setDriverOptions([]);
                    setPlateQuery(event.target.value.toUpperCase());
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Type a registered plate number..."
                  autoComplete="off"
                  className="h-11 border-line bg-sand pl-9 pr-10 font-mono text-sm text-ink"
                />
                {searching && (
                  <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-soft" />
                )}

                {showResults && !selectedVehicle && plateQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-paper shadow-xl">
                    {vehicles.length ? (
                      vehicles.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() => selectVehicle(vehicle)}
                          className="flex w-full items-center justify-between gap-3 border-b border-line p-3 text-left last:border-0 hover:bg-sand"
                        >
                          <span>
                            <span className="block font-mono text-sm font-bold text-ink">
                              {vehicle.plate}
                            </span>
                            <span className="mt-1 block text-xs text-ink-soft">
                              {[vehicle.make, vehicle.model, vehicle.kind]
                                .filter(Boolean)
                                .join(" · ") || "Registered vehicle"}
                            </span>
                          </span>
                          <ChevronDown className="size-4 -rotate-90 text-ink-soft" />
                        </button>
                      ))
                    ) : !searching ? (
                      <p className="p-4 text-sm text-ink-soft">
                        No matching plate returned. Check the plate number and try again.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {selectedVehicle && (
                <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-line bg-sand/60 p-3">
                  <div className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 text-green-700" />
                    <div>
                      <p className="font-mono text-sm font-bold text-ink">
                        {selectedVehicle.plate}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {[selectedVehicle.make, selectedVehicle.model, selectedVehicle.kind]
                          .filter(Boolean)
                          .join(" · ") || "Vehicle selected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearVehicle}
                    className="border-line"
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {selectedVehicle && (
              <div className="mt-5 space-y-2">
                <label className="text-xs font-semibold text-ink">
                  Assigned driver
                </label>
                {driverOptions.length > 1 ? (
                  <select
                    value={selectedDriver?.id ?? ""}
                    onChange={(event) =>
                      setSelectedDriver(
                        driverOptions.find((driver) => driver.id === event.target.value) ?? null,
                      )
                    }
                    required
                    className="h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
                  >
                    <option value="">Select an assigned driver</option>
                    {driverOptions.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} — {driver.phone}
                      </option>
                    ))}
                  </select>
                ) : driverOptions.length === 1 ? (
                  <div className="rounded-lg border border-line bg-sand/60 p-3">
                    <p className="font-medium text-ink">{driverOptions[0]?.name}</p>
                    <p className="mt-1 text-xs text-ink-soft">{driverOptions[0]?.phone}</p>
                  </div>
                ) : (
                  <p className="rounded-lg border border-orange/30 bg-orange/5 p-3 text-sm text-ink">
                    No approved assigned driver is available. Update the vehicle
                    assignment before issuing a pass.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
            <h3 className="font-semibold text-ink">Pass details</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Select the purpose and expiry of the pass.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink">Pass type</label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
                >
                  <option value="Terminal Entry">Terminal Entry</option>
                  <option value="Gate-Out Clearance">Gate-Out Clearance</option>
                  <option value="Collection">Collection</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink">
                  Valid until
                </label>
                <Input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  required
                  className="h-11 border-line bg-sand text-sm text-ink"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">Containers</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Add every container covered by this pass.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addContainer}
                className="border-line"
              >
                <Plus className="size-4" />
                Add container
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {containerNos.map((container, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-7 shrink-0 text-center font-mono text-xs text-ink-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Input
                    value={container}
                    onChange={(event) => updateContainer(index, event.target.value)}
                    placeholder="Enter container number"
                    className="h-11 border-line bg-sand font-mono text-sm uppercase text-ink"
                    required={index === 0}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeContainer(index)}
                    aria-label={`Remove container ${index + 1}`}
                    className="shrink-0 text-ink-soft hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
            <Button
              type="button"
              variant="outline"
              className="border-line"
              onClick={() => navigate("/gate/passes")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange text-white hover:bg-orange-deep"
              disabled={
                submitting ||
                !selectedVehicle ||
                !selectedDriver ||
                driverOptions.length === 0
              }
            >
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {submitting ? "Issuing pass..." : "Issue Gate Pass"}
            </Button>
          </div>
        </form>
      </motion.div>
    </AppShell>
  );
}