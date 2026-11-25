
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
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
  CalendarDays,
  Hash,
  AlertCircle,
  FileText,
  CheckCircle2,
  Circle,
  ClipboardList,
  Navigation,
  Boxes,
} from "lucide-react";
import {
  AppShell,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";

type RecordData = Record<string, unknown>;

const objectValue = (value: unknown): RecordData =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordData)
    : {};

const arrayValue = (value: unknown): RecordData[] =>
  Array.isArray(value) ? value.map((item) => objectValue(item)) : [];

const getField = (
  record: RecordData | null | undefined,
  key: string
): unknown => {
  if (!record) return undefined;
  return record[key];
};

const firstValue = (...values: unknown[]): unknown =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

const displayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return "—";
  return String(value);
};

const dateValue = (value: unknown): string => {
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

const humanize = (value: unknown): string =>
  value !== null && value !== undefined && String(value).trim() !== ""
    ? String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—";

function Detail({
  label,
  value,
  icon: Icon,
  wide = false,
}: {
  label: string;
  value: unknown;
  icon?: React.ElementType;
  wide?: boolean;
}) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#987e64]">
        {label}
      </p>
      <div className="mt-1.5 flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a58a70]" />}
        <p className="break-words text-[13px] font-medium leading-5 text-[#20252b]">
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
    <section className="overflow-hidden rounded-xl border border-[#e8d4b9] bg-[#fffaf3] shadow-[0_1px_2px_rgba(80,50,20,0.08)]">
      <div className="flex items-center gap-2.5 border-b border-[#ead9c2] px-4 py-3.5 sm:px-5">
        <Icon className="h-4 w-4 text-[#f36b0a]" />
        <h2 className="text-[13px] font-semibold text-[#252a30]">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
        {items}
      </div>
    </section>
  );
}

function TimelineItem({
  title,
  date,
  complete,
  active = false,
  last = false,
}: {
  title: string;
  date?: unknown;
  complete: boolean;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className="relative flex w-4 shrink-0 justify-center">
        {complete ? (
          <CheckCircle2 className="relative z-10 h-4 w-4 text-[#ff7900]" />
        ) : (
          <Circle className={`relative z-10 h-4 w-4 ${active ? "text-[#ff7900]" : "text-[#777d83]"}`} />
        )}
        {!last && (
          <span className="absolute left-1/2 top-4 h-9 w-px -translate-x-1/2 bg-[#73777c]" />
        )}
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <p className={`text-xs font-semibold ${complete || active ? "text-white" : "text-[#b9bdc1]"}`}>
          {title}
        </p>
        <p className="mt-1 text-[10px] text-[#c0c3c6]">
          {date ? dateValue(date) : "—"}
        </p>
      </div>
    </div>
  );
}

export default function GateAppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAppointment = useCallback(
    async (refresh = false) => {
      if (!id) {
        setError("Appointment not found.");
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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

        const payload = objectValue(resp.data);
        const data = objectValue(
          firstValue(
            getField(payload, "appointment"),
            getField(payload, "details"),
            getField(payload, "record"),
            payload
          )
        );

        if (!getField(data, "id")) {
          throw new Error("Appointment details were not returned.");
        }

        setAppointment(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load appointment details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const organisation = objectValue(getField(appointment, "organisation"));
  const vehicle = objectValue(getField(appointment, "vehicle"));
  const driver = objectValue(getField(appointment, "driver"));
  const gatePass = objectValue(
    firstValue(getField(appointment, "gate_pass"), getField(appointment, "pass"))
  );
  const checkIn = objectValue(
    firstValue(
      getField(appointment, "check_in"),
      getField(appointment, "checkin")
    )
  );
  const checkOut = objectValue(
    firstValue(
      getField(appointment, "check_out"),
      getField(appointment, "checkout")
    )
  );
  const lane = objectValue(
    firstValue(getField(appointment, "lane"), getField(appointment, "gate_lane"))
  );
  const shipment = objectValue(getField(appointment, "shipment"));

  const containers = arrayValue(
    firstValue(
      getField(appointment, "containers"),
      getField(appointment, "appointment_containers"),
      getField(shipment, "containers")
    )
  );

  const containerRecords = containers.map((item) => ({
    ...item,
    ...objectValue(getField(item, "shipment_container")),
  }));

  const passType = String(getField(gatePass, "type") ?? "").toLowerCase();
  const isExit =
    passType.includes("exit") ||
    passType.includes("gate-out") ||
    passType.includes("check-out") ||
    passType.includes("checkout");

  const movement = isExit ? checkOut : checkIn;
  const MovementIcon = isExit ? LogOut : LogIn;
  const movementDate = isExit
    ? getField(movement, "checked_out_at")
    : getField(movement, "checked_in_at");

  const movementBy = isExit
    ? getField(movement, "checked_out_by_name")
    : getField(movement, "checked_in_by_name");

  const movementRecorded = Boolean(movementDate);

  const appointmentStatus = String(
    firstValue(
      getField(appointment, "status"),
      getField(appointment, "appointment_status"),
      getField(appointment, "gate_status"),
      ""
    )
  );

  const vehicleReg = firstValue(
    getField(vehicle, "plate"),
    getField(vehicle, "plate_number"),
    getField(vehicle, "registration_number"),
    getField(appointment, "vehicle_number")
  );

  const bookingRef = firstValue(
    getField(appointment, "booking_ref"),
    getField(appointment, "appointment_reference"),
    getField(appointment, "reference"),
    getField(appointment, "id")
  );

  const organisationName = firstValue(
    getField(organisation, "organisation_name"),
    getField(organisation, "name"),
    getField(appointment, "organisation_name")
  );

  const appointmentDate = firstValue(
    getField(appointment, "appointment_date"),
    getField(appointment, "scheduled_date"),
    getField(appointment, "date")
  );

  const appointmentTime = firstValue(
    getField(appointment, "slot_time"),
    getField(appointment, "appointment_time"),
    getField(appointment, "time")
  );

  const appointmentCreated = getField(appointment, "created_at");
  const arrivedAt = getField(appointment, "arrived_at");
  const notes = getField(appointment, "notes");

  const isArrived = ["arrived", "in terminal", "completed"].includes(
    appointmentStatus.toLowerCase()
  );
  const isCompleted = appointmentStatus.toLowerCase() === "completed";
  const isCancelled = appointmentStatus.toLowerCase() === "cancelled";
  const isConfirmed = appointmentStatus.toLowerCase() === "confirmed";

  return (
    <AppShell title="Appointment Details" eyebrow="Gate Operations">
      <div className="min-h-screen bg-[#fbf1e4] -mx-4 -mt-4 px-4 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium text-[#514638] transition hover:text-[#f36b0a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to appointments
            </button>

            <button
              type="button"
              onClick={() => void loadAppointment(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e7d4bc] bg-[#fffaf3] px-3 py-2 text-xs font-semibold text-[#514638] transition hover:bg-[#f7e9d7] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-44 animate-pulse rounded-xl bg-[#ead9c2]" />
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="h-64 animate-pulse rounded-xl bg-[#ead9c2]" />
                <div className="h-64 animate-pulse rounded-xl bg-[#ead9c2]" />
                <div className="h-64 animate-pulse rounded-xl bg-[#ead9c2]" />
              </div>
            </div>
          ) : error && !appointment ? (
            <div className="rounded-xl border border-[#e8d4b9] bg-[#fffaf3] px-6 py-14 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-[#f36b0a]" />
              <h2 className="mt-4 text-sm font-semibold text-[#252a30]">
                Unable to load appointment
              </h2>
              <p className="mt-2 text-xs text-[#8c7862]">{error}</p>
              <button
                type="button"
                onClick={() => void loadAppointment()}
                className="mt-5 rounded-lg bg-[#f36b0a] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#df5e05]"
              >
                Try again
              </button>
            </div>
          ) : appointment ? (
            <>
              {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                  <button
                    type="button"
                    onClick={() => void loadAppointment(true)}
                    className="font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              <section className="overflow-hidden rounded-xl border border-[#e8d4b9] bg-[#fffaf3] shadow-[0_1px_2px_rgba(80,50,20,0.08)]">
                <div className="flex flex-col justify-between gap-5 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffead9]">
                      <ShieldCheck className="h-5 w-5 text-[#f36b0a]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f36b0a]">
                        Gate appointment
                      </p>
                      <h1 className="mt-1 break-all text-lg font-bold tracking-tight text-[#20252b] sm:text-xl">
                        {displayValue(bookingRef)}
                      </h1>
                      <p className="mt-1 text-[11px] text-[#806d58]">
                        {displayValue(organisationName)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={humanize(appointmentStatus)}
                      tone={statusTone(appointmentStatus)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-[#ead9c2] p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#f9efe2] p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-[#987e64]">
                      Appointment date
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#20252b]">
                      {displayValue(appointmentDate)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f9efe2] p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-[#987e64]">
                      Time slot
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#20252b]">
                      {displayValue(appointmentTime)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f9efe2] p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-[#987e64]">
                      Vehicle registration
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#20252b]">
                      {displayValue(vehicleReg)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f9efe2] p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-[#987e64]">
                      Gate movement
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-[#20252b]">
                      {movementRecorded ? "Recorded" : "Not recorded"}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-3">
                  <Section title="Organisation details" icon={Building2}>
                    <Detail
                      label="Organisation name"
                      value={organisationName}
                      icon={Building2}
                      wide
                    />
                    <Detail
                      label="Trading name"
                      value={getField(organisation, "trading_name")}
                    />
                    <Detail
                      label="Organisation type"
                      value={humanize(getField(organisation, "organisation_type"))}
                    />
                    <Detail
                      label="Registration number"
                      value={getField(organisation, "rc_number")}
                      icon={Hash}
                    />
                    <Detail
                      label="Tax identification number"
                      value={getField(organisation, "tin")}
                      icon={FileText}
                    />
                    <Detail
                      label="Sector"
                      value={getField(organisation, "sector")}
                    />
                    <Detail
                      label="Contact person"
                      value={getField(organisation, "contact_person")}
                      icon={UserRound}
                    />
                    <Detail
                      label="Contact person's title"
                      value={getField(organisation, "contact_person_title")}
                    />
                    <Detail
                      label="Email"
                      value={getField(organisation, "contact_email")}
                      icon={Mail}
                    />
                    <Detail
                      label="Phone"
                      value={getField(organisation, "contact_phone")}
                      icon={Phone}
                    />
                    <Detail
                      label="Registered address"
                      value={getField(organisation, "registered_address")}
                      icon={MapPin}
                      wide
                    />
                    <Detail
                      label="Operating address"
                      value={getField(organisation, "operating_address")}
                      icon={MapPin}
                      wide
                    />
                    <Detail
                      label="Verification status"
                      value={humanize(getField(organisation, "verification_status"))}
                      icon={ShieldCheck}
                    />
                    <Detail
                      label="Verified on"
                      value={dateValue(getField(organisation, "verified_at"))}
                      icon={CalendarDays}
                    />
                  </Section>

                  <Section title="Vehicle and driver" icon={Truck}>
                    <Detail
                      label="Vehicle registration"
                      value={vehicleReg}
                      icon={Truck}
                    />
                    <Detail
                      label="Vehicle type"
                      value={humanize(getField(vehicle, "kind"))}
                    />
                    <Detail
                      label="Make and model"
                      value={[getField(vehicle, "make"), getField(vehicle, "model")]
                        .filter((value): value is string => typeof value === "string" && value.trim() !== "")
                        .join(" ")}
                    />
                    <Detail
                      label="Vehicle owner"
                      value={getField(vehicle, "owner")}
                      icon={Building2}
                    />
                    <Detail
                      label="Transporter"
                      value={firstValue(
                        getField(vehicle, "transporter"),
                        getField(driver, "transporter")
                      )}
                    />
                    <Detail
                      label="Driver name"
                      value={firstValue(
                        getField(driver, "name"),
                        getField(driver, "full_name"),
                        getField(appointment, "driver_name")
                      )}
                      icon={UserRound}
                    />
                    <Detail
                      label="Driver phone"
                      value={firstValue(
                        getField(driver, "phone"),
                        getField(appointment, "driver_phone")
                      )}
                      icon={Phone}
                    />
                    <Detail
                      label="Licence number"
                      value={getField(driver, "licence_number")}
                      icon={ShieldCheck}
                    />
                    <Detail
                      label="Licence expiry"
                      value={getField(driver, "licence_expiry")}
                      icon={CalendarDays}
                    />
                  </Section>

                  <Section title="Gate pass" icon={ShieldCheck}>
                    <Detail
                      label="Pass code"
                      value={getField(gatePass, "pass_code")}
                      icon={Hash}
                    />
                    <Detail
                      label="Pass type"
                      value={humanize(getField(gatePass, "type"))}
                    />
                    <Detail
                      label="Pass status"
                      value={humanize(getField(gatePass, "status"))}
                    />
                    <Detail
                      label="Issued on"
                      value={dateValue(getField(gatePass, "issued_at"))}
                      icon={Clock}
                    />
                    <Detail
                      label="Issued by"
                      value={getField(gatePass, "issued_by_name")}
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
                      icon={ShieldCheck}
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
                      value={firstValue(
                        getField(movement, "gate_name"),
                        getField(appointment, "gate_name")
                      )}
                      icon={MapPin}
                    />
                    <Detail
                      label="Lane"
                      value={firstValue(
                        getField(movement, "lane_name"),
                        getField(lane, "name"),
                        getField(lane, "code")
                      )}
                      icon={Route}
                    />
                    <Detail
                      label="Decision"
                      value={humanize(getField(movement, "decision"))}
                      icon={ShieldCheck}
                    />
                    <Detail
                      label="Remarks"
                      value={firstValue(
                        getField(movement, "remarks"),
                        getField(movement, "reason")
                      )}
                      icon={FileText}
                      wide
                    />
                  </Section>

                  <Section title="Shipment details" icon={Ship}>
                    <Detail
                      label="Shipment reference"
                      value={firstValue(
                        getField(shipment, "shipment_reference"),
                        getField(appointment, "shipment_reference")
                      )}
                      icon={Hash}
                    />
                    <Detail
                      label="Bill of lading"
                      value={firstValue(
                        getField(shipment, "bill_of_lading"),
                        getField(appointment, "bill_of_lading")
                      )}
                    />
                    <Detail
                      label="Booking number"
                      value={firstValue(
                        getField(shipment, "booking_number"),
                        getField(appointment, "booking_number")
                      )}
                    />
                    <Detail
                      label="Vessel"
                      value={firstValue(
                        getField(shipment, "vessel_name"),
                        getField(appointment, "vessel_name")
                      )}
                      icon={Ship}
                    />
                    <Detail
                      label="Voyage"
                      value={firstValue(
                        getField(shipment, "voyage_number"),
                        getField(appointment, "voyage_number")
                      )}
                    />
                    <Detail
                      label="Shipment status"
                      value={humanize(getField(shipment, "status"))}
                    />
                    <Detail
                      label="Cargo description"
                      value={firstValue(
                        getField(shipment, "cargo_description"),
                        getField(appointment, "cargo_description")
                      )}
                      icon={Package}
                      wide
                    />
                  </Section>

                  <section className="overflow-hidden rounded-xl border border-[#e8d4b9] bg-[#fffaf3] shadow-[0_1px_2px_rgba(80,50,20,0.08)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[#ead9c2] px-4 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <Container className="h-4 w-4 text-[#f36b0a]" />
                        <h2 className="text-[13px] font-semibold text-[#252a30]">
                          Containers
                        </h2>
                      </div>
                      <span className="text-[10px] font-medium text-[#987e64]">
                        {containerRecords.length} total
                      </span>
                    </div>

                    {containerRecords.length ? (
                      <>
                        <div className="hidden overflow-x-auto md:block">
                          <table className="w-full min-w-[700px] text-left">
                            <thead>
                              <tr className="border-b border-[#ead9c2] bg-[#f9efe2] text-[10px] uppercase tracking-wider text-[#987e64]">
                                <th className="px-5 py-3 font-semibold">Container number</th>
                                <th className="px-5 py-3 font-semibold">Size</th>
                                <th className="px-5 py-3 font-semibold">Seal number</th>
                                <th className="px-5 py-3 font-semibold">Packages</th>
                                <th className="px-5 py-3 font-semibold">Gross weight</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {containerRecords.map((container, index) => {
                                const containerNo = getField(container, "container_no");
                                const containerStatus = firstValue(
                                  getField(container, "container_status"),
                                  getField(container, "status")
                                );

                                return (
                                  <tr
                                    key={`${displayValue(containerNo)}-${index}`}
                                    className="border-b border-[#f0e2d0] last:border-0 hover:bg-[#fdf5eb]"
                                  >
                                    <td className="px-5 py-3.5 text-xs font-semibold text-[#20252b]">
                                      {displayValue(containerNo)}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#514638]">
                                      {displayValue(getField(container, "size"))}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#514638]">
                                      {displayValue(getField(container, "seal_no"))}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#514638]">
                                      {displayValue(getField(container, "package_count"))}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#514638]">
                                      {getField(container, "gross_weight")
                                        ? `${displayValue(getField(container, "gross_weight"))} kg`
                                        : "—"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {containerStatus ? (
                                        <StatusBadge
                                          label={humanize(containerStatus)}
                                          tone={statusTone(String(containerStatus))}
                                        />
                                      ) : (
                                        <span className="text-xs text-[#8c7862]">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="divide-y divide-[#ead9c2] md:hidden">
                          {containerRecords.map((container, index) => (
                            <div
                              key={`${displayValue(getField(container, "container_no"))}-${index}`}
                              className="space-y-3 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffead9]">
                                    <Container className="h-4 w-4 text-[#f36b0a]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="break-all text-xs font-semibold text-[#20252b]">
                                      {displayValue(getField(container, "container_no"))}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[#987e64]">
                                      {displayValue(getField(container, "size"))}
                                    </p>
                                  </div>
                                </div>
                                {getField(container, "container_status") ? (
                                  <StatusBadge
                                    label={humanize(getField(container, "container_status"))}
                                    tone={statusTone(String(getField(container, "container_status")))}
                                  />
                                ) : null}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <Detail
                                  label="Seal number"
                                  value={getField(container, "seal_no")}
                                />
                                <Detail
                                  label="Packages"
                                  value={getField(container, "package_count")}
                                />
                                <Detail
                                  label="Gross weight"
                                  value={
                                    getField(container, "gross_weight")
                                      ? `${displayValue(getField(container, "gross_weight"))} kg`
                                      : undefined
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <Boxes className="mx-auto h-8 w-8 text-[#c4a98c]" />
                        <p className="mt-3 text-xs font-semibold text-[#514638]">
                          No containers linked
                        </p>
                        <p className="mt-1 text-[11px] text-[#987e64]">
                          No container records are associated with this appointment.
                        </p>
                      </div>
                    )}
                  </section>

                  {Boolean(notes) && (
                    <section className="overflow-hidden rounded-xl border border-[#e8d4b9] bg-[#fffaf3] shadow-[0_1px_2px_rgba(80,50,20,0.08)]">
                      <div className="flex items-center gap-2.5 border-b border-[#ead9c2] px-4 py-3.5 sm:px-5">
                        <FileText className="h-4 w-4 text-[#f36b0a]" />
                        <h2 className="text-[13px] font-semibold text-[#252a30]">
                          Appointment notes
                        </h2>
                      </div>
                      <div className="whitespace-pre-wrap p-4 text-xs leading-6 text-[#514638] sm:p-5">
                        {displayValue(notes)}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="space-y-3 xl:sticky xl:top-5">
                  <section className="overflow-hidden rounded-xl border border-[#555b62] bg-[#4b5057] p-4 text-white shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <h2 className="text-xs font-semibold">Appointment progress</h2>
                      <span className="text-[8px] uppercase tracking-widest text-[#c5c8cb]">
                        Activity
                      </span>
                    </div>

                    <TimelineItem
                      title="Appointment created"
                      date={appointmentCreated}
                      complete={Boolean(appointmentCreated)}
                    />
                    <TimelineItem
                      title="Appointment confirmed"
                      date={isConfirmed || isArrived || isCompleted ? appointmentDate : undefined}
                      complete={isConfirmed || isArrived || isCompleted}
                    />
                    <TimelineItem
                      title="Vehicle arrived"
                      date={arrivedAt}
                      complete={isArrived || movementRecorded}
                    />
                    <TimelineItem
                      title={isExit ? "Gate check-out" : "Gate check-in"}
                      date={movementDate}
                      complete={movementRecorded}
                    />
                    <TimelineItem
                      title="Appointment completed"
                      date={isCompleted ? getField(appointment, "updated_at") : undefined}
                      complete={isCompleted}
                      last
                    />

                    {isCancelled && (
                      <div className="mt-2 rounded-lg border border-[#73777c] bg-[#41464c] p-3">
                        <p className="text-[11px] font-semibold text-white">
                          Appointment cancelled
                        </p>
                        <p className="mt-1 text-[10px] text-[#c5c8cb]">
                          This appointment is no longer active.
                        </p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-[#e8d4b9] bg-[#fffaf3] p-4 shadow-[0_1px_2px_rgba(80,50,20,0.08)]">
                    <div className="mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#f36b0a]" />
                      <h2 className="text-xs font-semibold text-[#252a30]">
                        Assignment
                      </h2>
                    </div>

                    <p className="text-xs font-semibold text-[#20252b]">
                      {displayValue(
                        firstValue(
                          getField(driver, "name"),
                          getField(driver, "full_name"),
                          getField(appointment, "driver_name")
                        )
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-[#987e64]">
                      Driver
                    </p>

                    <div className="mt-4 space-y-3 border-t border-[#ead9c2] pt-3">
                      <div className="flex items-start gap-2 text-[10px] text-[#806d58]">
                        <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{displayValue(vehicleReg)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-[#806d58]">
                        <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {displayValue(
                            firstValue(
                              getField(lane, "name"),
                              getField(lane, "code"),
                              getField(appointment, "lane_name")
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-[#806d58]">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {displayValue(
                            firstValue(
                              getField(movement, "gate_name"),
                              getField(appointment, "gate_name")
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-[#806d58]">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {displayValue(appointmentDate)} · {displayValue(appointmentTime)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg border border-[#e8d4b9] bg-[#fffaf3] px-4 py-2.5 text-xs font-semibold text-[#514638] shadow-sm transition hover:bg-[#f7e9d7]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    All appointments
                  </button>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
