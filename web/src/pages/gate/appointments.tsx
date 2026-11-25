
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Truck,
  Building2,
  MapPin,
  CalendarCheck,
  ChevronDown,
  X,
  AlertCircle,
  RotateCcw,
  Eye,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone } from "@/components/auth-shell";
import { http, type Resp } from "@/lib/httpClient";

type GateAppointment = {
  id: string;
  appointment_reference?: string;
  reference?: string;
  organisation_name?: string;
  company_name?: string;
  contact_person?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  vehicle_number?: string;
  vehicle_registration?: string;
  driver_name?: string;
  driver_phone?: string;
  appointment_date?: string;
  appointment_time?: string;
  scheduled_at?: string;
  gate_name?: string;
  gate?: string;
  purpose?: string;
  status?: string;
  notes?: string;
  created_at?: string;
};

type DateFilter = "TODAY" | "UPCOMING" | "PAST" | "ALL";

const getAppointmentDate = (appointment: GateAppointment) => {
  const value =
    appointment.scheduled_at ||
    (appointment.appointment_date
      ? `${appointment.appointment_date} ${appointment.appointment_time || "00:00:00"}`
      : "");

  if (!value) return null;

  const date = new Date(value.replace(" ", "T"));

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date | null) => {
  if (!date) return "Date not available";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (appointment: GateAppointment) => {
  if (appointment.appointment_time) {
    const [hours, minutes] = appointment.appointment_time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const date = getAppointmentDate(appointment);

  return date
    ? date.toLocaleTimeString("en-NG", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time not set";
};

const getStatus = (status?: string) =>
  (status || "PENDING").toUpperCase().replaceAll(" ", "_");

const getOrganisation = (appointment: GateAppointment) =>
  appointment.organisation_name ||
  appointment.company_name ||
  "Organisation not specified";

const getVehicle = (appointment: GateAppointment) =>
  appointment.vehicle_number ||
  appointment.vehicle_registration ||
  "Vehicle not specified";

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

export default function GateAppointmentsPage() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<GateAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("TODAY");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await http.get("/appointments/gate/all/");
      const resp: Resp = res.data;

      if (resp.error) {
        throw new Error(
          typeof resp.data === "string"
            ? resp.data
            : "Could not load gate appointments."
        );
      }

      const records = Array.isArray(resp.data) ? resp.data : [];

      setAppointments(records);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load gate appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const today = useMemo(() => new Date(), []);

  const statistics = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let pendingCount = 0;
    let completedCount = 0;

    appointments.forEach((appointment) => {
      const status = getStatus(appointment.status);
      const date = getAppointmentDate(appointment);

      if (date && isSameDay(date, today)) {
        todayCount++;
      }

      if (date && date > today && !isSameDay(date, today)) {
        upcomingCount++;
      }

      if (
        ["PENDING", "PENDING_CONFIRMATION", "AWAITING_CONFIRMATION"].includes(
          status
        )
      ) {
        pendingCount++;
      }

      if (["COMPLETED", "CHECKED_OUT", "CLOSED"].includes(status)) {
        completedCount++;
      }
    });

    return {
      total: appointments.length,
      today: todayCount,
      upcoming: upcomingCount,
      pending: pendingCount,
      completed: completedCount,
    };
  }, [appointments, today]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        const date = getAppointmentDate(appointment);
        const status = getStatus(appointment.status);

        if (dateFilter === "TODAY") {
          if (!date || !isSameDay(date, today)) return false;
        }

        if (dateFilter === "UPCOMING") {
          if (!date || date <= today) return false;
        }

        if (dateFilter === "PAST") {
          if (!date || date >= today || isSameDay(date, today)) {
            return false;
          }
        }

        if (statusFilter !== "ALL" && status !== statusFilter) {
          return false;
        }

        if (query) {
          const searchable = [
            appointment.appointment_reference,
            appointment.reference,
            getOrganisation(appointment),
            appointment.contact_person,
            appointment.contact_name,
            appointment.contact_phone,
            appointment.contact_email,
            getVehicle(appointment),
            appointment.driver_name,
            appointment.driver_phone,
            appointment.gate_name,
            appointment.gate,
            appointment.purpose,
            appointment.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchable.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const first = getAppointmentDate(a)?.getTime() || 0;
        const second = getAppointmentDate(b)?.getTime() || 0;

        return first - second;
      });
  }, [appointments, dateFilter, statusFilter, search, today]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(appointments.map((item) => getStatus(item.status)))
      ).sort(),
    [appointments]
  );

  const dateTabs: { label: string; value: DateFilter }[] = [
    { label: "Today", value: "TODAY" },
    { label: "Upcoming", value: "UPCOMING" },
    { label: "Past", value: "PAST" },
    { label: "All appointments", value: "ALL" },
  ];

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFilter("ALL");
  };

  const viewAppointment = (id: string) => {
    navigate(`/gate/appointment/${id}`);
  };

  return (
    <AppShell title="Gate Appointments" eyebrow="Gate Operations">
      <div className="space-y-6 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Operations</span>
              <span>/</span>
              <span className="text-foreground">Gate appointments</span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Gate appointments
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor and manage gate appointments across all organisations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAppointments(true)}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && appointments.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-destructive"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Unable to refresh appointments
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadAppointments(true)}
              disabled={refreshing}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <RotateCcw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : error && appointments.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-border bg-card px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle size={26} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-foreground">
              Unable to load appointments
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadAppointments()}
              disabled={loading}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              <RotateCcw size={16} />
              Retry loading
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total appointments"
                value={statistics.total}
                description="All recorded appointments"
                icon={<CalendarDays size={20} />}
              />

              <StatCard
                label="Today's appointments"
                value={statistics.today}
                description="Scheduled for today"
                icon={<CalendarCheck size={20} />}
              />

              <StatCard
                label="Awaiting confirmation"
                value={statistics.pending}
                description="Pending appointment actions"
                icon={<Clock3 size={20} />}
              />

              <StatCard
                label="Completed visits"
                value={statistics.completed}
                description="Successfully completed visits"
                icon={<CheckCircle2 size={20} />}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Appointment register
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View appointments submitted by every organisation.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 sm:w-72">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search organisation, vehicle..."
                        className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />

                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className="h-10 w-full appearance-none rounded-xl border border-border bg-background pl-4 pr-10 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-52"
                      >
                        <option value="ALL">All statuses</option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>

                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {dateTabs.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setDateFilter(tab.value)}
                      className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        dateFilter === tab.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}

                      {tab.value === "TODAY" && (
                        <span className="ml-2 rounded-full bg-background/15 px-2 py-0.5 text-xs">
                          {statistics.today}
                        </span>
                      )}

                      {tab.value === "UPCOMING" && (
                        <span className="ml-2 rounded-full bg-background/15 px-2 py-0.5 text-xs">
                          {statistics.upcoming}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <CalendarDays size={25} />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-foreground">
                    No appointments found
                  </h3>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {search || statusFilter !== "ALL"
                      ? "Try adjusting your search or filters."
                      : "There are no appointments for the selected period."}
                  </p>

                  {(search ||
                    statusFilter !== "ALL" ||
                    dateFilter !== "TODAY") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-sm font-semibold text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1000px] text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Appointment
                          </th>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Organisation
                          </th>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Vehicle
                          </th>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Scheduled date
                          </th>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Gate
                          </th>
                          <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Status
                          </th>
                          <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {filteredAppointments.map((appointment) => {
                          const date = getAppointmentDate(appointment);

                          return (
                            <tr
                              key={appointment.id}
                              className="transition hover:bg-muted/40"
                            >
                              <td className="px-5 py-4">
                                <p className="text-sm font-bold text-foreground">
                                  {appointment.appointment_reference ||
                                    appointment.reference ||
                                    "Appointment"}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {appointment.purpose ||
                                    "General gate visit"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <Building2 size={17} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="max-w-[190px] truncate text-sm font-semibold text-foreground">
                                      {getOrganisation(appointment)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {appointment.contact_person ||
                                        appointment.contact_name ||
                                        "Contact not specified"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                  <Truck
                                    size={16}
                                    className="text-muted-foreground"
                                  />
                                  {getVehicle(appointment)}
                                </div>
                                {appointment.driver_name && (
                                  <p className="mt-1 pl-6 text-xs text-muted-foreground">
                                    {appointment.driver_name}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-foreground">
                                  {formatDate(date)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatTime(appointment)}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2 text-sm text-foreground">
                                  <MapPin
                                    size={15}
                                    className="text-muted-foreground"
                                  />
                                  {appointment.gate_name ||
                                    appointment.gate ||
                                    "Not assigned"}
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  label={getStatus(appointment.status)}
                                  tone={statusTone(
                                    getStatus(appointment.status)
                                  )}
                                />
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    viewAppointment(appointment.id)
                                  }
                                  title="View appointment"
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                                >
                                  <Eye size={15} />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 p-4 md:hidden">
                    {filteredAppointments.map((appointment) => {
                      const date = getAppointmentDate(appointment);

                      return (
                        <div
                          key={appointment.id}
                          className="rounded-xl border border-border p-4 transition hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-all text-sm font-bold text-foreground">
                                {appointment.appointment_reference ||
                                  appointment.reference ||
                                  "Appointment"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {appointment.purpose ||
                                  "General gate visit"}
                              </p>
                            </div>

                            <StatusBadge
                              label={getStatus(appointment.status)}
                              tone={statusTone(
                                getStatus(appointment.status)
                              )}
                            />
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                              <Building2 size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {getOrganisation(appointment)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {appointment.contact_person ||
                                  appointment.contact_name ||
                                  "Contact not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Vehicle
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                <Truck size={14} />
                                <span className="break-all">
                                  {getVehicle(appointment)}
                                </span>
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Date and time
                              </p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {formatDate(date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTime(appointment)}
                              </p>
                            </div>

                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">
                                Gate
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                <MapPin size={14} />
                                {appointment.gate_name ||
                                  appointment.gate ||
                                  "Not assigned"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-border pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                viewAppointment(appointment.id)
                              }
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              <Eye size={16} />
                              View appointment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {filteredAppointments.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing {filteredAppointments.length} of{" "}
                    {appointments.length} appointments
                  </span>
                  <span>All organisations</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {value.toLocaleString("en-NG")}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
