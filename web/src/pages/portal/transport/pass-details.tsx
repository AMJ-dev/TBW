import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  Printer,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Box,
  Scale,
  Clock,
  CalendarDays,
  Truck,
  UserRound,
  CalendarCheck,
  FileText,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  AppShell,
  StatusBadge,
  statusTone,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { http, type Resp } from "@/lib/httpClient";

type ContainerDetail = {
  id: string;
  container_no: string;
  number: string;
  size: string | null;
  seal_no: string | null;
  package_count: number | string | null;
  gross_weight: number | string | null;
  status: string | null;
  gate_in_at: string | null;
  received_at: string | null;
  stored_at: string | null;
  gate_out_at: string | null;
  updated_at: string | null;
};

type VehicleDetail = {
  id?: string;
  plate?: string | null;
  kind?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  capacity?: string | number | null;
  owner?: string | null;
  transporter?: string | null;
  insurance_expiry?: string | null;
  roadworthiness_expiry?: string | null;
  status?: string | null;
  notes?: string | null;
  organisation_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
};

type DriverDetail = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  licence_number?: string | null;
  licence_class?: string | null;
  licence_expiry?: string | null;
  assigned_vehicle?: string | null;
  transporter?: string | null;
  status?: string | null;
  notes?: string | null;
  organisation_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
};

type AppointmentDetail = {
  id?: string;
  booking_ref?: string | null;
  appointment_date?: string | null;
  slot_time?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GatePass = {
  id: string;
  pass_code: string;
  organisation_id?: string;
  appointment_id?: string | null;
  vehicle_id?: string | null;
  driver_id?: string | null;
  vehicle_plate?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle?: VehicleDetail | null;
  driver?: DriverDetail | null;
  appointment?: AppointmentDetail | null;
  type: string;
  issued_by?: string | null;
  issued_at: string | null;
  valid_until: string | null;
  status: string;
  updated_at?: string | null;
  container_nos: string[];
  containers?: ContainerDetail[];
};

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | undefined;
}) {
  const displayValue =
    value !== null && value !== undefined && String(value).trim() !== ""
      ? String(value)
      : "—";

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">
        {displayValue}
      </p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Truck;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-display font-bold text-ink">{title}</h3>
        <p className="text-xs text-ink-soft">{description}</p>
      </div>
    </div>
  );
}

export default function GatePassDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pass, setPass] = useState<GatePass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  const fetchPassWithRetry = useCallback(
    async (attempt = 1): Promise<void> => {
      if (!id) {
        setLoading(false);
        setError("No pass ID provided.");
        return;
      }

      try {
        const response = await http.get(`/appointments/pass/${id}/`);
        const resp: Resp = response.data;

        if (resp.error) {
          throw new Error(String(resp.data || "Could not load gate pass."));
        }

        const data = resp.code as GatePass | null;

        if (!data) {
          throw new Error("The server returned no gate pass details.");
        }

        setPass({
          ...data,
          vehicle: data.vehicle ?? {
            plate: data.vehicle_plate ?? null,
          },
          driver: data.driver ?? {
            name: data.driver_name ?? null,
            phone: data.driver_phone ?? null,
          },
          appointment: data.appointment ?? null,
          containers: Array.isArray(data.containers) ? data.containers : [],
          container_nos: Array.isArray(data.container_nos)
            ? data.container_nos
            : Array.isArray(data.containers)
              ? data.containers.map((container) => container.container_no)
              : [],
        });

        setError(null);
      } catch (err: unknown) {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt),
          );
          return fetchPassWithRetry(attempt + 1);
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Could not load gate pass after multiple attempts.";

        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
    [id],
  );

  const loadPass = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetchPassWithRetry(1);
    } finally {
      setLoading(false);
    }
  }, [fetchPassWithRetry]);

  useEffect(() => {
    void loadPass();
  }, [loadPass]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value.replace(" ", "T"));

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const handlePrint = () => {
    window.print();
  };

  const vehicle = pass?.vehicle;
  const driver = pass?.driver;
  const appointment = pass?.appointment;

  return (
    <AppShell title="Gate Pass Details" eyebrow="Gate Control · Pass Record">
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-5xl space-y-6"
      >
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Button
            variant="outline"
            className="border-line bg-paper text-ink hover:bg-sand"
            onClick={() => navigate("/portal/passes")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Passes
          </Button>

          {pass && (
            <Button
              onClick={handlePrint}
              className="bg-orange text-white hover:bg-orange-deep"
            >
              <Printer className="mr-2 size-4" />
              Print Gate Slip
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-paper p-16 ring-1 ring-line">
            <LoaderCircle className="mb-4 size-8 animate-spin text-orange" />
            <p className="text-sm font-medium text-ink-soft">
              Retrieving pass details...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-carmine/25 bg-carmine/5 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 size-8 text-carmine" />
            <p className="font-display text-lg font-bold text-ink">
              Failed to load pass
            </p>
            <p className="mt-1 text-sm text-ink-soft">{error}</p>
            <Button
              onClick={() => void loadPass()}
              className="mt-6 bg-carmine text-white hover:bg-carmine/90"
            >
              <RefreshCw className="mr-2 size-4" />
              Retry Connection
            </Button>
          </div>
        ) : !pass ? (
          <div className="rounded-xl bg-paper p-12 text-center ring-1 ring-line">
            <Ticket className="mx-auto mb-3 size-7 text-ink-soft" />
            <p className="font-semibold text-ink">Gate pass not found</p>
            <p className="mt-1 text-sm text-ink-soft">
              This pass may have been revoked or deleted.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line print:shadow-none print:ring-0">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-slate px-6 py-5 text-sand">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-orange text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
                    TRÏNŪ Bonded Warehouse
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-bold text-sand">
                    Terminal Gate Clearance
                  </h2>
                </div>
              </div>

              <StatusBadge
                label={pass.status || "Unknown"}
                tone={statusTone(pass.status || "unknown")}
              />
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
              <div className="space-y-6 p-6 sm:p-8">
                <div className="border-b border-dashed border-line pb-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Pass Code / Reference
                  </p>
                  <h3 className="mt-1 break-all font-mono text-3xl font-bold tracking-tight text-orange-deep">
                    {pass.pass_code || "—"}
                  </h3>
                  <p className="mt-2 text-sm text-ink">
                    <span className="font-semibold text-ink-soft">Type:</span>{" "}
                    {pass.type || "—"}
                  </p>
                </div>

                <section className="rounded-xl border border-line p-5">
                  <SectionHeading
                    icon={Truck}
                    title="Vehicle Details"
                    description="Registered vehicle information"
                  />

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label="Registration Plate"
                      value={vehicle?.plate ?? pass.vehicle_plate}
                    />
                    <DetailField label="Vehicle Type" value={vehicle?.kind} />
                    <DetailField label="Make" value={vehicle?.make} />
                    <DetailField label="Model" value={vehicle?.model} />
                    <DetailField label="Year" value={vehicle?.year} />
                    <DetailField label="Capacity" value={vehicle?.capacity} />
                    <DetailField label="Owner" value={vehicle?.owner} />
                    <DetailField
                      label="Transporter"
                      value={vehicle?.transporter}
                    />
                    <DetailField label="Status" value={vehicle?.status} />
                    <DetailField
                      label="Insurance Expiry"
                      value={vehicle?.insurance_expiry}
                    />
                    <DetailField
                      label="Roadworthiness Expiry"
                      value={vehicle?.roadworthiness_expiry}
                    />
                    <DetailField label="Notes" value={vehicle?.notes} />
                  </div>
                </section>

                <section className="rounded-xl border border-line p-5">
                  <SectionHeading
                    icon={UserRound}
                    title="Driver Details"
                    description="Driver identity and licence information"
                  />

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label="Full Name"
                      value={driver?.name ?? pass.driver_name}
                    />
                    <DetailField
                      label="Phone Number"
                      value={driver?.phone ?? pass.driver_phone}
                    />
                    <DetailField
                      label="Licence Number"
                      value={driver?.licence_number}
                    />
                    <DetailField
                      label="Licence Class"
                      value={driver?.licence_class}
                    />
                    <DetailField
                      label="Licence Expiry"
                      value={driver?.licence_expiry}
                    />
                    <DetailField
                      label="Assigned Vehicle"
                      value={driver?.assigned_vehicle}
                    />
                    <DetailField
                      label="Transporter"
                      value={driver?.transporter}
                    />
                    <DetailField label="Status" value={driver?.status} />
                    <DetailField label="Notes" value={driver?.notes} />
                  </div>
                </section>

                <section className="rounded-xl border border-line p-5">
                  <SectionHeading
                    icon={CalendarCheck}
                    title="Appointment Details"
                    description="Appointment associated with this gate pass"
                  />

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label="Booking Reference"
                      value={appointment?.booking_ref}
                    />
                    <DetailField
                      label="Appointment Date"
                      value={appointment?.appointment_date}
                    />
                    <DetailField
                      label="Time Slot"
                      value={appointment?.slot_time}
                    />
                    <DetailField
                      label="Appointment Status"
                      value={appointment?.status}
                    />
                    <DetailField
                      label="Appointment ID"
                      value={appointment?.id ?? pass.appointment_id}
                    />
                  </div>
                </section>

                <section className="grid gap-5 rounded-xl border border-line p-5 sm:grid-cols-2">
                  <DetailField
                    label="Issued At"
                    value={formatDate(pass.issued_at)}
                  />
                  <DetailField
                    label="Valid Until"
                    value={formatDate(pass.valid_until)}
                  />
                  <DetailField label="Pass ID" value={pass.id} />
                  <DetailField label="Issued By" value={pass.issued_by} />
                </section>
              </div>

              <aside className="flex flex-col items-center border-t border-line bg-sand/30 p-8 lg:border-l lg:border-t-0">
                <div className="rounded-xl border-4 border-ink bg-white p-4">
                  <QRCodeSVG
                    value={pass.pass_code || pass.id}
                    size={128}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  Scan at Gate Lane
                  <br />
                  ANPR & QR Compatible
                </p>

                <div className="mt-6 w-full rounded-lg bg-orange/10 p-3 text-center ring-1 ring-orange/20">
                  <p className="text-[11px] font-semibold text-orange-deep">
                    Must present physical slip at checkpoint.
                  </p>
                </div>
              </aside>
            </div>

            <div className="border-t border-line bg-sand/10 p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink">
                    Authorised Containers
                  </h4>
                  <p className="mt-1 text-xs text-ink-soft">
                    {pass.containers?.length || pass.container_nos.length}{" "}
                    container(s) assigned to this pass
                  </p>
                </div>

                <div className="grid size-10 place-items-center rounded-lg bg-orange/10 text-orange-deep">
                  <Box className="size-5" />
                </div>
              </div>

              {pass.containers && pass.containers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {pass.containers.map((container, index) => (
                    <div
                      key={`${container.id || container.container_no}-${index}`}
                      className="rounded-xl border border-line bg-paper p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-ink text-sand">
                            <Box className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="break-all font-mono text-base font-bold text-ink">
                              {container.container_no || container.number}
                            </p>
                            {container.size && (
                              <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                                Size: {container.size}
                              </p>
                            )}
                          </div>
                        </div>

                        {container.status && (
                          <StatusBadge
                            label={container.status.replace(/_/g, " ")}
                            tone={statusTone(container.status)}
                          />
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                              Seal Number
                            </p>
                            <p className="break-all font-mono text-xs font-semibold text-ink">
                              {container.seal_no || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Scale className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                              Gross Weight
                            </p>
                            <p className="font-mono text-xs font-semibold text-ink">
                              {container.gross_weight !== null &&
                              container.gross_weight !== undefined &&
                              container.gross_weight !== ""
                                ? `${Number(container.gross_weight).toLocaleString()} kg`
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Box className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                              Packages
                            </p>
                            <p className="font-mono text-xs font-semibold text-ink">
                              {container.package_count !== null &&
                              container.package_count !== undefined &&
                              container.package_count !== ""
                                ? Number(container.package_count).toLocaleString()
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                              Gate In
                            </p>
                            <p className="font-mono text-[10px] font-semibold text-ink">
                              {formatDate(container.gate_in_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(container.received_at ||
                        container.stored_at ||
                        container.gate_out_at ||
                        container.updated_at) && (
                        <div className="mt-4 space-y-2 border-t border-line pt-3">
                          {container.received_at && (
                            <div className="flex items-start gap-2 text-xs text-ink-soft">
                              <BadgeCheck className="mt-0.5 size-3.5 shrink-0" />
                              <span>
                                Received: {formatDate(container.received_at)}
                              </span>
                            </div>
                          )}

                          {container.stored_at && (
                            <div className="flex items-start gap-2 text-xs text-ink-soft">
                              <Clock className="mt-0.5 size-3.5 shrink-0" />
                              <span>
                                Stored: {formatDate(container.stored_at)}
                              </span>
                            </div>
                          )}

                          {container.gate_out_at && (
                            <div className="flex items-start gap-2 text-xs text-ink-soft">
                              <Truck className="mt-0.5 size-3.5 shrink-0" />
                              <span>
                                Gate Out: {formatDate(container.gate_out_at)}
                              </span>
                            </div>
                          )}

                          {container.updated_at && (
                            <div className="flex items-start gap-2 text-xs text-ink-soft">
                              <Clock className="mt-0.5 size-3.5 shrink-0" />
                              <span>
                                Last Updated: {formatDate(container.updated_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : pass.container_nos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pass.container_nos.map((containerNo, index) => (
                    <div
                      key={`${containerNo}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-line bg-paper p-4"
                    >
                      <div className="grid size-9 place-items-center rounded-lg bg-ink text-sand">
                        <Box className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                          Container Number
                        </p>
                        <p className="break-all font-mono text-sm font-bold text-ink">
                          {containerNo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line p-8 text-center">
                  <Box className="mx-auto mb-3 size-8 text-ink-soft" />
                  <p className="text-sm font-medium text-ink">
                    No containers authorised on this pass.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </motion.div>
    </AppShell>
  );
}