
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CalendarDays,
  Clock,
  Building2,
  UserRound,
  Truck,
  MapPin,
  ShieldCheck,
  Container,
  Phone,
  Mail,
  LogIn,
  LogOut,
  Package,
  Ship,
  UserCheck,
  Route,
} from "lucide-react";
import {
  AppShell,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";

type RecordData = Record<string, any>;

const objectValue = (value: any): RecordData =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const displayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const dateValue = (value: any): string => {
  if (!value) return "—";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const humanize = (value: any): string =>
  value
    ? String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—";

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: any;
  icon?: React.ElementType;
}) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <p className="break-words text-sm font-semibold text-foreground">
          {displayValue(value)}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children).filter(Boolean);

  if (!items.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        {items}
      </div>
    </section>
  );
}

export default function GateAppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAppointment = useCallback(async (refresh = false) => {
    if (!id) {
      setError("Appointment not found.");
      setLoading(false);
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    try {
      const res = await http.get(
        `/appointments/gate/details/${encodeURIComponent(id)}/`
      );

      const resp: Resp = res.data;

      if (resp.error) {
        throw new Error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load appointment details."
        );
      }

      const data = objectValue(resp.data);

      if (!data.id) {
        throw new Error("Appointment details were not returned.");
      }

      setAppointment(data);
    } catch (err: any) {
      setError(err?.message || "Could not load appointment details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const organisation = objectValue(appointment?.organisation);
  const vehicle = objectValue(appointment?.vehicle);
  const driver = objectValue(appointment?.driver);
  const gatePass = objectValue(appointment?.gate_pass);
  const checkIn = objectValue(appointment?.check_in);
  const checkOut = objectValue(appointment?.check_out);
  const lane = objectValue(appointment?.lane);
  const shipment = objectValue(appointment?.shipment);

  const containers: RecordData[] = Array.isArray(appointment?.containers)
    ? appointment.containers
    : [];

  const containerRecords = containers.map((item) => ({
    ...objectValue(item),
    ...objectValue(item.shipment_container),
  }));

  const passType = String(gatePass.type ?? "").toLowerCase();
  const isExit =
    passType.includes("exit") ||
    passType.includes("check-out") ||
    passType.includes("checkout");

  const movement = isExit ? checkOut : checkIn;
  const MovementIcon = isExit ? LogOut : LogIn;
  const movementDate = isExit
    ? movement.checked_out_at
    : movement.checked_in_at;

  const movementBy = isExit
    ? movement.checked_out_by_name
    : movement.checked_in_by_name;

  const movementRecorded = Boolean(movementDate);

  return (
    <AppShell title="Appointment Details" eyebrow="Gate Operations">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() => void loadAppointment(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-5">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="h-48 animate-pulse rounded-2xl bg-muted" />
              <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        ) : error && !appointment ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="font-semibold text-foreground">
              Unable to load appointment
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => void loadAppointment()}
              className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Try again
            </button>
          </div>
        ) : appointment ? (
          <>
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gate appointment
                    </p>
                    <StatusBadge
                      label={humanize(appointment.status)}
                      tone={statusTone(String(appointment.status ?? ""))}
                    />
                  </div>

                  <h1 className="mt-3 text-2xl font-bold text-foreground">
                    {displayValue(appointment.booking_ref)}
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {displayValue(organisation.organisation_name)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {displayValue(appointment.appointment_date)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Time slot</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {displayValue(appointment.slot_time)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-border bg-muted/40 p-5 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <MovementIcon className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Movement</p>
                    <p className="text-sm font-semibold text-foreground">
                      {humanize(gatePass.type)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-semibold text-foreground">
                      {displayValue(vehicle.plate ?? appointment.vehicle_number)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Route className="h-5 w-5 text-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lane</p>
                    <p className="text-sm font-semibold text-foreground">
                      {displayValue(lane.name ?? lane.code)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Section title="Organisation" icon={Building2}>
                <Detail
                  label="Organisation name"
                  value={organisation.organisation_name}
                  icon={Building2}
                />
                <Detail
                  label="Contact person"
                  value={organisation.contact_person}
                  icon={UserRound}
                />
                <Detail
                  label="Email"
                  value={organisation.contact_email}
                  icon={Mail}
                />
                <Detail
                  label="Phone"
                  value={organisation.contact_phone}
                  icon={Phone}
                />
              </Section>

              <Section title="Vehicle and driver" icon={Truck}>
                <Detail
                  label="Vehicle registration"
                  value={vehicle.plate ?? appointment.vehicle_number}
                  icon={Truck}
                />
                <Detail
                  label="Driver"
                  value={driver.name ?? appointment.driver_name}
                  icon={UserRound}
                />
                <Detail
                  label="Driver phone"
                  value={driver.phone ?? appointment.driver_phone}
                  icon={Phone}
                />
              </Section>

              <Section title="Gate pass" icon={ShieldCheck}>
                <Detail label="Pass code" value={gatePass.pass_code} />
                <Detail label="Pass type" value={humanize(gatePass.type)} />
                <Detail label="Pass status" value={humanize(gatePass.status)} />
                <Detail
                  label="Issued on"
                  value={dateValue(gatePass.issued_at)}
                  icon={Clock}
                />
                <Detail
                  label="Issued by"
                  value={gatePass.issued_by_name}
                  icon={UserCheck}
                />
              </Section>

              <Section
                title={isExit ? "Gate check-out" : "Gate check-in"}
                icon={MovementIcon}
              >
                <Detail
                  label="Movement status"
                  value={movementRecorded ? "Recorded" : "Not recorded"}
                />
                <Detail
                  label={isExit ? "Checked out at" : "Checked in at"}
                  value={dateValue(movementDate)}
                  icon={Clock}
                />
                <Detail
                  label={isExit ? "Checked out by" : "Checked in by"}
                  value={movementBy}
                  icon={UserCheck}
                />
                <Detail
                  label="Gate"
                  value={movement.gate_name}
                  icon={MapPin}
                />
                <Detail
                  label="Lane"
                  value={movement.lane_name}
                  icon={Route}
                />
                <Detail label="Remarks" value={movement.remarks} />
              </Section>

              <Section title="Shipment" icon={Ship}>
                <Detail
                  label="Shipment reference"
                  value={shipment.shipment_reference}
                />
                <Detail
                  label="Bill of lading"
                  value={shipment.bill_of_lading}
                />
                <Detail
                  label="Booking number"
                  value={shipment.booking_number}
                />
                <Detail label="Vessel" value={shipment.vessel_name} />
                <Detail label="Voyage" value={shipment.voyage_number} />
                <Detail
                  label="Cargo description"
                  value={shipment.cargo_description}
                />
                <Detail
                  label="Shipment status"
                  value={humanize(shipment.status)}
                />
              </Section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <Container className="h-5 w-5 text-foreground" />
                  <h2 className="font-semibold text-foreground">Containers</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {containerRecords.length} container(s)
                </span>
              </div>

              {containerRecords.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Container</th>
                        <th className="px-5 py-3 font-medium">Size</th>
                        <th className="px-5 py-3 font-medium">Seal number</th>
                        <th className="px-5 py-3 font-medium">Packages</th>
                        <th className="px-5 py-3 font-medium">Gross weight</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {containerRecords.map((container, index) => (
                        <tr
                          key={container.container_no ?? index}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-5 py-4 text-sm font-semibold text-foreground">
                            {displayValue(container.container_no)}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {displayValue(container.size)}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {displayValue(container.seal_no)}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {displayValue(container.package_count)}
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">
                            {container.gross_weight
                              ? `${container.gross_weight} kg`
                              : "—"}
                          </td>
                          <td className="px-5 py-4">
                            {container.container_status ? (
                              <StatusBadge
                                label={humanize(container.container_status)}
                                tone={statusTone(String(container.container_status))}
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No containers linked to this appointment.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
