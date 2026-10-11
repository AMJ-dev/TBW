import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownToLine,
    ArrowRight,
    ArrowUpRight,
    Boxes,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    Filter,
    Package,
    Plus,
    Search,
    Ship,
    SlidersHorizontal,
    XCircle,
} from "lucide-react";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShipmentStatus =
    | "Draft"
    | "Submitted"
    | "Under Review"
    | "Action Required"
    | "Accepted"
    | "In Transit"
    | "Arrived"
    | "Completed"
    | "Rejected";

type Shipment = {
    id: string;
    reference: string;
    billOfLading: string;
    vessel: string;
    cargoDescription: string;
    containerCount: number;
    cargoType: "FCL" | "LCL" | "Bulk" | "General Cargo";
    origin: string;
    destination: string;
    submittedAt: string;
    expectedArrival: string;
    status: ShipmentStatus;
    documents: number;
};

const initialShipments: Shipment[] = [
    {
        id: "shp-001",
        reference: "TRN-SHP-2026-001",
        billOfLading: "MAEUABJ260014",
        vessel: "MSC Horizon",
        cargoDescription: "Telecommunications equipment",
        containerCount: 3,
        cargoType: "FCL",
        origin: "Shanghai, China",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-09",
        expectedArrival: "2026-10-18",
        status: "Under Review",
        documents: 4,
    },
    {
        id: "shp-002",
        reference: "TRN-SHP-2026-002",
        billOfLading: "CMDUABJ260028",
        vessel: "CMA CGM Atlas",
        cargoDescription: "Pharmaceutical packaging materials",
        containerCount: 2,
        cargoType: "FCL",
        origin: "Rotterdam, Netherlands",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-08",
        expectedArrival: "2026-10-20",
        status: "Accepted",
        documents: 6,
    },
    {
        id: "shp-003",
        reference: "TRN-SHP-2026-003",
        billOfLading: "HLCUABJ260039",
        vessel: "Hapag Express",
        cargoDescription: "Industrial generator components",
        containerCount: 1,
        cargoType: "FCL",
        origin: "Hamburg, Germany",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-07",
        expectedArrival: "2026-10-16",
        status: "Action Required",
        documents: 2,
    },
    {
        id: "shp-004",
        reference: "TRN-SHP-2026-004",
        billOfLading: "ONEYABJ260041",
        vessel: "Ocean Network",
        cargoDescription: "Textiles and consumer goods",
        containerCount: 0,
        cargoType: "LCL",
        origin: "Mumbai, India",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-06",
        expectedArrival: "2026-10-22",
        status: "Submitted",
        documents: 3,
    },
    {
        id: "shp-005",
        reference: "TRN-SHP-2026-005",
        billOfLading: "EGLVABJ260051",
        vessel: "Ever Green Star",
        cargoDescription: "Solar panels and inverter modules",
        containerCount: 5,
        cargoType: "FCL",
        origin: "Ningbo, China",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-04",
        expectedArrival: "2026-10-14",
        status: "In Transit",
        documents: 5,
    },
    {
        id: "shp-006",
        reference: "TRN-SHP-2026-006",
        billOfLading: "COSUABJ260062",
        vessel: "Cosco Pacific",
        cargoDescription: "Food processing machinery",
        containerCount: 2,
        cargoType: "FCL",
        origin: "Singapore",
        destination: "TRINU Terminal",
        submittedAt: "2026-10-02",
        expectedArrival: "2026-10-12",
        status: "Arrived",
        documents: 5,
    },
    {
        id: "shp-007",
        reference: "TRN-SHP-2026-007",
        billOfLading: "SUDUABJ260074",
        vessel: "Süd Cargo",
        cargoDescription: "Construction materials",
        containerCount: 4,
        cargoType: "FCL",
        origin: "Antwerp, Belgium",
        destination: "TRINU Terminal",
        submittedAt: "2026-09-28",
        expectedArrival: "2026-10-10",
        status: "Completed",
        documents: 7,
    },
    {
        id: "shp-008",
        reference: "TRN-SHP-2026-008",
        billOfLading: "OOLUABJ260086",
        vessel: "OOCL Meridian",
        cargoDescription: "Household appliances",
        containerCount: 2,
        cargoType: "FCL",
        origin: "Busan, South Korea",
        destination: "TRINU Terminal",
        submittedAt: "2026-09-25",
        expectedArrival: "2026-10-19",
        status: "Draft",
        documents: 1,
    },
];

const statuses: Array<ShipmentStatus | "All"> = [
    "All",
    "Draft",
    "Submitted",
    "Under Review",
    "Action Required",
    "Accepted",
    "In Transit",
    "Arrived",
    "Completed",
    "Rejected",
];

const statusStyles: Record<ShipmentStatus, string> = {
    Draft: "bg-muted text-muted-foreground border-border",
    Submitted: "bg-sky-500/10 text-sky-700 border-sky-500/20",
    "Under Review": "bg-amber-500/10 text-amber-700 border-amber-500/20",
    "Action Required": "bg-rose-500/10 text-rose-700 border-rose-500/20",
    Accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    "In Transit": "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
    Arrived: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
    Completed: "bg-green-600/10 text-green-700 border-green-600/20",
    Rejected: "bg-red-500/10 text-red-700 border-red-500/20",
};

const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

export default function PortalShipmentsPage() {
    const navigate = useNavigate();

    const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "All">("All");
    const [cargoFilter, setCargoFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("newest");

    const filteredShipments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return shipments
            .filter((shipment) => {
                const matchesSearch =
                    !query ||
                    shipment.reference.toLowerCase().includes(query) ||
                    shipment.billOfLading.toLowerCase().includes(query) ||
                    shipment.vessel.toLowerCase().includes(query) ||
                    shipment.cargoDescription.toLowerCase().includes(query) ||
                    shipment.origin.toLowerCase().includes(query);

                const matchesStatus = statusFilter === "All" || shipment.status === statusFilter;

                const matchesCargo = cargoFilter === "All" || shipment.cargoType === cargoFilter;

                return matchesSearch && matchesStatus && matchesCargo;
            })
            .sort((a, b) => sortOrder === "newest" ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt),);
    }, [shipments, searchQuery, statusFilter, cargoFilter, sortOrder]);

    const counts = useMemo(
        () => ({
            total: shipments.length,
            review: shipments.filter((shipment) => shipment.status === "Under Review").length,
            action: shipments.filter((shipment) => shipment.status === "Action Required").length,
            active: shipments.filter((shipment) => ["Accepted", "In Transit", "Arrived"].includes(shipment.status)).length,
            completed: shipments.filter((shipment) => shipment.status === "Completed").length,
        }),
        [shipments],
    );

    const handleExport = () => {
        const headers = [
            "Reference",
            "Bill of Lading",
            "Vessel",
            "Cargo Description",
            "Cargo Type",
            "Containers",
            "Origin",
            "Destination",
            "Submitted",
            "Expected Arrival",
            "Status",
        ];

        const rows = filteredShipments.map((shipment) => [
            shipment.reference,
            shipment.billOfLading,
            shipment.vessel,
            shipment.cargoDescription,
            shipment.cargoType,
            shipment.containerCount,
            shipment.origin,
            shipment.destination,
            shipment.submittedAt,
            shipment.expectedArrival,
            shipment.status,
        ]);

        const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");

        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "stakeholder-shipments.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <AppShell
            title="My Shipments"
            eyebrow="Stakeholder Portal · Shipment Management"
        >
            <div className="space-y-6 pb-10">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="relative overflow-hidden rounded-2xl border bg-card p-5 sm:p-7"
                >
                    <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
                    <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                <Ship className="size-3.5 text-primary" />
                                Shipment management
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                Your shipments,{" "}
                                <span className="text-primary">in one place.</span>
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                                Submit cargo information, monitor shipment
                                reviews, manage supporting documents and track
                                progress through the terminal.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                className="gap-2"
                            >
                                <ArrowDownToLine className="size-4" />
                                Export list
                            </Button>

                            <Button
                                onClick={() =>
                                    navigate("/portal/shipments/new")
                                }
                                className="gap-2"
                            >
                                <Plus className="size-4" />
                                Submit shipment
                            </Button>
                        </div>
                    </div>
                </motion.section>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        label="Total shipments"
                        value={String(counts.total)}
                        detail="All submitted and draft records"
                        tone="info"
                        icon={Boxes}
                    />
                    <Metric
                        label="Under review"
                        value={String(counts.review)}
                        detail="Awaiting terminal validation"
                        tone="warning"
                        icon={Clock3}
                    />
                    <Metric
                        label="Action required"
                        value={String(counts.action)}
                        detail="Review requested corrections"
                        tone="critical"
                        icon={XCircle}
                    />
                    <Metric
                        label="Completed"
                        value={String(counts.completed)}
                        detail={`${counts.active} currently progressing`}
                        tone="success"
                        icon={CheckCircle2}
                    />
                </section>

                {counts.action > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"
                    >
                        <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600">
                            <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                                Shipments need your attention
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {counts.action} shipment
                                {counts.action === 1 ? "" : "s"} require
                                corrections or additional information before
                                processing can continue.
                            </p>
                            <button
                                type="button"
                                onClick={() =>
                                    setStatusFilter("Action Required")
                                }
                                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-rose-700 hover:underline"
                            >
                                Review affected shipments
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                <section className="overflow-hidden rounded-2xl border bg-card">
                    <div className="flex flex-col gap-4 border-b p-4 sm:p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-semibold tracking-tight">
                                    Shipment register
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Search, filter and review your shipment
                                    submissions.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Package className="size-4" />
                                {filteredShipments.length} of {shipments.length}{" "}
                                shipments
                            </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_160px_150px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Search reference, vessel, bill of lading..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value as
                                                | ShipmentStatus
                                                | "All",
                                        )
                                    }
                                    className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    aria-label="Filter by status"
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status === "All"
                                                ? "All statuses"
                                                : status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <select
                                value={cargoFilter}
                                onChange={(event) =>
                                    setCargoFilter(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Filter by cargo type"
                            >
                                <option value="All">All cargo types</option>
                                <option value="FCL">FCL</option>
                                <option value="LCL">LCL</option>
                                <option value="Bulk">Bulk</option>
                                <option value="General Cargo">
                                    General cargo
                                </option>
                            </select>

                            <select
                                value={sortOrder}
                                onChange={(event) =>
                                    setSortOrder(event.target.value)
                                }
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Sort shipments"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {(
                                [
                                    "All",
                                    "Draft",
                                    "Submitted",
                                    "Under Review",
                                    "Action Required",
                                    "Accepted",
                                    "In Transit",
                                    "Arrived",
                                    "Completed",
                                ] as Array<ShipmentStatus | "All">
                            ).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                        statusFilter === status
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    {status}
                                    {status === "Action Required" &&
                                        counts.action > 0 && (
                                            <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">
                                                {counts.action}
                                            </span>
                                        )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredShipments.length === 0 ? (
                        <div className="flex flex-col items-center px-5 py-16 text-center">
                            <div className="rounded-2xl border bg-muted/50 p-4">
                                <SlidersHorizontal className="size-7 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 font-semibold">
                                No shipments found
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Try changing your search or filters to find the
                                shipment you are looking for.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("All");
                                    setCargoFilter("All");
                                }}
                            >
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[1050px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                                            <th className="px-5 py-3.5 font-medium">
                                                Shipment
                                            </th>
                                            <th className="px-4 py-3.5 font-medium">
                                                Cargo details
                                            </th>
                                            <th className="px-4 py-3.5 font-medium">
                                                Route / vessel
                                            </th>
                                            <th className="px-4 py-3.5 font-medium">
                                                Expected arrival
                                            </th>
                                            <th className="px-4 py-3.5 font-medium">
                                                Status
                                            </th>
                                            <th className="px-5 py-3.5 text-right font-medium">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y">
                                        {filteredShipments.map(
                                            (shipment, index) => (
                                                <motion.tr
                                                    key={shipment.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 5,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        delay: index * 0.025,
                                                    }}
                                                    className="group transition-colors hover:bg-muted/30"
                                                >
                                                    <td className="px-5 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/portal/shipments/${shipment.id}`,
                                                                )
                                                            }
                                                            className="text-left"
                                                        >
                                                            <span className="block font-mono text-xs font-semibold text-primary hover:underline">
                                                                {shipment.reference}
                                                            </span>
                                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                                B/L:{" "}
                                                                {shipment.billOfLading}
                                                            </span>
                                                        </button>
                                                    </td>

                                                    <td className="max-w-[260px] px-4 py-4">
                                                        <p
                                                            className="truncate font-medium"
                                                            title={
                                                                shipment.cargoDescription
                                                            }
                                                        >
                                                            {
                                                                shipment.cargoDescription
                                                            }
                                                        </p>
                                                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="rounded border px-1.5 py-0.5">
                                                                {
                                                                    shipment.cargoType
                                                                }
                                                            </span>
                                                            <span>
                                                                {shipment.containerCount >
                                                                0
                                                                    ? `${shipment.containerCount} container${shipment.containerCount === 1 ? "" : "s"}`
                                                                    : "LCL cargo"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <p className="font-medium">
                                                            {shipment.vessel}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {shipment.origin}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <CalendarDays className="size-4 text-muted-foreground" />
                                                            {formatDate(
                                                                shipment.expectedArrival,
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Submitted{" "}
                                                            {formatDate(
                                                                shipment.submittedAt,
                                                            )}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span
                                                            className={cn(
                                                                "inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
                                                                statusStyles[
                                                                    shipment
                                                                        .status
                                                                ],
                                                            )}
                                                        >
                                                            {shipment.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/portal/shipments/${shipment.id}`,
                                                                )
                                                            }
                                                            className="gap-1.5"
                                                        >
                                                            View
                                                            <ArrowUpRight className="size-3.5" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y md:hidden">
                                {filteredShipments.map((shipment) => (
                                    <button
                                        key={shipment.id}
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/portal/shipments/${shipment.id}`,
                                            )
                                        }
                                        className="w-full p-4 text-left transition-colors hover:bg-muted/30"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-mono text-xs font-semibold text-primary">
                                                    {shipment.reference}
                                                </p>
                                                <p className="mt-1.5 text-sm font-medium">
                                                    {shipment.cargoDescription}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {shipment.billOfLading}
                                                </p>
                                            </div>
                                            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span
                                                className={cn(
                                                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                                                    statusStyles[shipment.status],
                                                )}
                                            >
                                                {shipment.status}
                                            </span>
                                            <span className="rounded border px-2 py-1 text-xs text-muted-foreground">
                                                {shipment.cargoType}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ETA{" "}
                                                {formatDate(
                                                    shipment.expectedArrival,
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <span>
                            Showing {filteredShipments.length} shipment
                            {filteredShipments.length === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5" />
                            Shipment records are scoped to your organisation
                        </span>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border bg-card p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <FileText className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">
                                    Prepare your documents
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Keep your bill of lading, cargo manifest,
                                    packing list and other required documents
                                    ready for submission.
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-2 h-auto p-0"
                                    onClick={() =>
                                        navigate("/portal/documents/upload")
                                    }
                                >
                                    Upload documents
                                    <ArrowRight className="ml-1 size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700">
                                <Ship className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">
                                    Ready to declare a shipment?
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Start a shipment submission and provide the
                                    details the terminal team needs to review
                                    your cargo.
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-2 h-auto p-0"
                                    onClick={() =>
                                        navigate("/portal/shipments/new")
                                    }
                                >
                                    Start submission
                                    <ArrowRight className="ml-1 size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}