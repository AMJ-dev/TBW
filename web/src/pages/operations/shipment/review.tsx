
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    RefreshCw,
    Eye,
    Clock3,
    CheckCircle2,
    XCircle,
    FileCheck2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Building2,
    Package,
    CalendarDays,
    Filter,
} from "lucide-react";

import { http, type Resp } from "@/lib/httpClient";


type Shipment = {
    id: string;
    shipment_reference: string;
    organisation_id?: string;
    organisation_name?: string;
    organisation?: string;
    cargo_description?: string;
    shipment_type?: string;
    expected_arrival?: string;
    created_at?: string;
    status: string;
};

const statusStyles: Record<string, string> = {
    pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
    CHANGES_REQUESTED: "bg-orange-50 text-orange-700 ring-orange-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    EXPECTED: "bg-blue-50 text-blue-700 ring-blue-200",
};

const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const formatStatus = (status: string) =>
    status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function OperationsReviewPage() {
    const navigate = useNavigate();

    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const pageSize = 10;

    const loadShipments = useCallback(
      async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        try {
          const res = await http.get("/operator/shipments/review/");
          const resp: Resp = res.data;

          if (resp.error) throw new Error(resp.data || "Unable to load shipment declarations.");

          const list = Array.isArray(resp.code)
            ? resp.code
            : Array.isArray(resp.code?.results)
            ? resp.code.results
            : Array.isArray(resp.code?.shipments)
            ? resp.code.shipments
            : null;

          if (!list) throw new Error("The server returned an invalid shipment list.");

          setShipments(list);
        } catch (err: any) {
          setError(err?.response?.data?.data || err?.response?.data?.message || "Unable to load shipment declarations.");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

    useEffect(() => {
        void loadShipments();
    }, [loadShipments]);

    const pendingCount = shipments.filter((shipment) => shipment.status === "pending_review").length;
    const changesCount = shipments.filter((shipment) => shipment.status === "CHANGES_REQUESTED").length;

    const filteredShipments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return shipments.filter((shipment) => {
            const matchesSearch =
                !query ||
                [
                    shipment.shipment_reference,
                    shipment.organisation_name,
                    shipment.organisation,
                    shipment.organisation_id,
                    shipment.cargo_description,
                    shipment.shipment_type,
                ].some((value) => value?.toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "all" ||
                shipment.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [shipments, search, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredShipments.length / pageSize)
    );

    const currentPage = Math.min(page, totalPages);

    const paginatedShipments = filteredShipments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const openReview = (id: string) => {
        navigate(`/operations/shipments/review/${id}`);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#F8F8F7] p-4 text-[#252525] sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-[#737373]">
                            <span>Operations</span>
                            <span>/</span>
                            <span className="text-[#422B1C]">
                                Declaration Review
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Declaration Review
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">
                            Review submitted shipment declarations, verify
                            supporting documents and determine whether each
                            shipment can proceed.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadShipments(true)}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing ? "animate-spin" : ""
                            }
                        />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#737373]">
                                Total declarations
                            </span>
                            <div className="rounded-xl bg-[#FFF0E6] p-2.5 text-[#FF6600]">
                                <FileCheck2 size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-3xl font-bold">
                            {loading ? "—" : shipments.length}
                        </div>
                        <p className="mt-1 text-xs text-[#737373]">
                            Declarations available for review
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#737373]">
                                Pending review
                            </span>
                            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                                <Clock3 size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-3xl font-bold">
                            {loading ? "—" : pendingCount}
                        </div>
                        <p className="mt-1 text-xs text-[#737373]">
                            Awaiting an Operations decision
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#EAEAEA] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#737373]">
                                Changes requested
                            </span>
                            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                                <AlertCircle size={20} />
                            </div>
                        </div>
                        <div className="mt-4 text-3xl font-bold">
                            {loading ? "—" : changesCount}
                        </div>
                        <p className="mt-1 text-xs text-[#737373]">
                            Declarations returned for correction
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white">
                    <div className="flex flex-col gap-4 border-b border-[#EEEEEE] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                Submitted declarations
                            </h2>
                            <p className="mt-1 text-sm text-[#737373]">
                                Select a shipment to inspect its declaration.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative min-w-0 sm:w-72">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    placeholder="Search reference, organisation..."
                                    className="h-11 w-full rounded-xl border border-[#E5E5E5] bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-[#A0A0A0] focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                                />
                            </div>

                            <div className="relative sm:w-48">
                                <Filter
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        handleStatusFilter(event.target.value)
                                    }
                                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E5E5] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="pending_review">
                                        Pending review
                                    </option>
                                    <option value="CHANGES_REQUESTED">
                                        Changes requested
                                    </option>
                                    <option value="EXPECTED">
                                        Approved
                                    </option>
                                    <option value="REJECTED">
                                        Rejected
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">
                                    Could not load declarations
                                </p>
                                <p className="mt-1">{error}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void loadShipments()}
                                className="shrink-0 font-semibold underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">
                            <thead>
                                <tr className="border-b border-[#EEEEEE] bg-[#FAFAF9] text-xs uppercase tracking-wider text-[#777777]">
                                    <th className="px-5 py-4 font-semibold">
                                        Shipment
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Organisation
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Cargo
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Submitted
                                    </th>
                                    <th className="px-5 py-4 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#F0F0F0]">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            {Array.from({ length: 6 }).map(
                                                (_, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-5 py-5"
                                                    >
                                                        <div className="h-4 w-24 animate-pulse rounded bg-[#EEEEEE]" />
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    ))
                                ) : paginatedShipments.length > 0 ? (
                                    paginatedShipments.map((shipment) => (
                                        <tr
                                            key={shipment.id}
                                            onClick={() =>
                                                openReview(shipment.id)
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    openReview(shipment.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="link"
                                            aria-label={`Review ${shipment.shipment_reference}`}
                                            className="cursor-pointer transition hover:bg-[#FFF9F5] focus:bg-[#FFF9F5] focus:outline-none"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E6] text-[#FF6600]">
                                                        <Package size={19} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#292929]">
                                                            {shipment.shipment_reference}
                                                        </p>
                                                        <p className="mt-1 text-xs text-[#888888]">
                                                            {shipment.shipment_type ||
                                                                "Shipment"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2
                                                        size={16}
                                                        className="shrink-0 text-[#888888]"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {shipment.organisation_name ||
                                                                shipment.organisation ||
                                                                "Organisation"}
                                                        </p>
                                                        {shipment.organisation_id && (
                                                            <p className="mt-1 max-w-40 truncate text-xs text-[#888888]">
                                                                {shipment.organisation_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="max-w-56 px-5 py-4">
                                                <p className="truncate text-sm text-[#555555]">
                                                    {shipment.cargo_description ||
                                                        "Not specified"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#666666]">
                                                    <CalendarDays
                                                        size={15}
                                                        className="shrink-0 text-[#999999]"
                                                    />
                                                    {formatDate(
                                                        shipment.created_at
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                        statusStyles[
                                                            shipment.status
                                                        ] ||
                                                        "bg-gray-50 text-gray-600 ring-gray-200"
                                                    }`}
                                                >
                                                    {formatStatus(
                                                        shipment.status
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openReview(shipment.id);
                                                    }}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF6600] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#E85D00] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30"
                                                >
                                                    <Eye size={15} />
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F4] text-[#888888]">
                                                {search || statusFilter !== "all" ? (
                                                    <Search size={24} />
                                                ) : (
                                                    <CheckCircle2 size={24} />
                                                )}
                                            </div>
                                            <h3 className="mt-4 font-semibold">
                                                {search || statusFilter !== "all"
                                                    ? "No matching declarations"
                                                    : "No declarations found"}
                                            </h3>
                                            <p className="mt-2 text-sm text-[#888888]">
                                                {search || statusFilter !== "all"
                                                    ? "Try changing your search or status filter."
                                                    : "Submitted declarations will appear here when available."}
                                            </p>
                                            {(search || statusFilter !== "all") && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch("");
                                                        setStatusFilter("all");
                                                        setPage(1);
                                                    }}
                                                    className="mt-4 text-sm font-semibold text-[#FF6600] hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#EEEEEE] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-sm text-[#777777]">
                            {loading
                                ? "Loading declarations..."
                                : filteredShipments.length === 0
                                  ? "No declarations to display"
                                  : `Showing ${
                                        (currentPage - 1) * pageSize + 1
                                    }–${Math.min(
                                        currentPage * pageSize,
                                        filteredShipments.length
                                    )} of ${filteredShipments.length} declarations`}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() =>
                                    setPage((value) => Math.max(1, value - 1))
                                }
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E5E5] px-3 text-sm font-medium hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            <span className="px-2 text-sm text-[#666666]">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    currentPage >= totalPages || loading
                                }
                                onClick={() =>
                                    setPage((value) =>
                                        Math.min(totalPages, value + 1)
                                    )
                                }
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E5E5] px-3 text-sm font-medium hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#F0E4D8] bg-[#FFF9F4] p-4">
                    <XCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-[#B44D2F]"
                    />
                    <div className="text-sm leading-6 text-[#6D5142]">
                        <p className="font-semibold text-[#422B1C]">
                            Review before processing
                        </p>
                        <p className="mt-1">
                            Only approve declarations after checking the
                            shipment details and required documents. Physical
                            arrival and cargo receiving must be recorded by
                            their respective teams.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
