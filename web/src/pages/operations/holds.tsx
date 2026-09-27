import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  Unlock,
  X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HoldRecord {
  id: string;
  containerNo: string;
  cargoRef: string;
  consignee: string;
  holdType: "Customs Hold" | "Financial / Tariff Hold" | "Documentation Hold" | "Weight Discrepancy";
  placedBy: string;
  reason: string;
  datePlaced: string;
  status: "Active" | "Under Review" | "Resolved";
}

const initialHolds: HoldRecord[] = [
  {
    id: "hld-1",
    containerNo: "TRIU1234567",
    cargoRef: "TRN-IMP-002481",
    consignee: "Atlantic Trade Nigeria Ltd",
    holdType: "Documentation Hold",
    placedBy: "Docs Desk (TRÏNŪ)",
    reason: "Awaiting original Bill of Lading endorsement from shipping line.",
    datePlaced: "08 Sep 2026 · 14:10",
    status: "Active",
  },
  {
    id: "hld-2",
    containerNo: "MSCU9876543",
    cargoRef: "TRN-IMP-002482",
    consignee: "Kano Freight Forwarders",
    holdType: "Financial / Tariff Hold",
    placedBy: "Finance Billing Desk",
    reason: "Outstanding demurrage tariff of ₦2,640,000 unallocated.",
    datePlaced: "07 Sep 2026 · 11:30",
    status: "Active",
  },
  {
    id: "hld-3",
    containerNo: "HLCU1122334",
    cargoRef: "TRN-IMP-002484",
    consignee: "Sahara Energy Logistics",
    holdType: "Customs Hold",
    placedBy: "NCS Enforcement Command",
    reason: "Valuation discrepancy during physical examination. Re-assessment ordered.",
    datePlaced: "06 Sep 2026 · 16:45",
    status: "Under Review",
  },
  {
    id: "hld-4",
    containerNo: "EKY-904-BB",
    cargoRef: "TRN-IMP-002485",
    consignee: "Zenith Global Cargo Ltd",
    holdType: "Weight Discrepancy",
    placedBy: "Weighbridge Scale 01",
    reason: "Gross weight exceeds manifest declaration by +420kg.",
    datePlaced: "05 Sep 2026 · 10:20",
    status: "Resolved",
  },
];

export default function OperationsHoldsRoute() {
  const [holds, setHolds] = useState<HoldRecord[]>(initialHolds);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [containerNo, setContainerNo] = useState("");
  const [consignee, setConsignee] = useState("");
  const [holdType, setHoldType] = useState<HoldRecord["holdType"]>("Customs Hold");
  const [reason, setReason] = useState("");

  const filteredHolds = useMemo(() => {
    return holds.filter((h) => {
      const matchQuery =
        h.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.cargoRef.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === "ALL" ? true : h.holdType.toUpperCase().includes(typeFilter.toUpperCase());

      return matchQuery && matchType;
    });
  }, [holds, searchQuery, typeFilter]);

  const handlePlaceHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerNo || !reason) {
      toast.error("Please provide container number and reason.");
      return;
    }

    const newHold: HoldRecord = {
      id: `hld-${holds.length + 1}`,
      containerNo: containerNo.toUpperCase(),
      cargoRef: `TRN-IMP-00${2486 + holds.length}`,
      consignee: consignee || "Consignee under notice",
      holdType,
      placedBy: "Terminal Ops Console",
      reason,
      datePlaced: "Just now",
      status: "Active",
    };

    setHolds([newHold, ...holds]);
    setIsModalOpen(false);
    setContainerNo("");
    setConsignee("");
    setReason("");
    toast.error(`Operational Hold applied to container ${containerNo}. Gate-out locked.`);
  };

  const handleResolveHold = (id: string, container: string) => {
    setHolds(
      holds.map((h) => (h.id === id ? { ...h, status: "Resolved" as const } : h))
    );
    toast.success(`Hold cleared for container ${container}. Interlock released.`);
  };

  return (
    <AppShell title="Holds & Exceptions" eyebrow="Operations · Gate & Release Interlocks">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Exception Control · Release Prevention
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Active Holds & Regulatory Exceptions
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Manage electronic gate-out blocks triggered by Customs queries, unpaid demurrage, documentation gaps, or weight variances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-line bg-paper"
            onClick={() => toast.success("Exceptions log exported.")}
          >
            <Download className="size-4" /> Export Holds
          </Button>
          <Button
            className="bg-coral text-white hover:bg-carmine"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="size-4" /> Place Exception Hold
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active Holds" value={String(holds.filter(h => h.status === "Active").length)} detail="Gate-out locked" tone="critical" icon={Lock} />
        <Metric label="Under Review" value={String(holds.filter(h => h.status === "Under Review").length)} detail="Resolution in progress" tone="warning" icon={Clock} />
        <Metric label="Resolved Today" value="3" detail="Interlocks released" tone="success" icon={Unlock} />
        <Metric label="Compliance Clearance" value="98.2%" detail="Standard turnaround" tone="info" icon={CheckCircle2} />
      </div>

      <section className="rounded-xl bg-paper ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by container, consignee, or hold reason..."
              className="h-10 border-line bg-sand pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <Filter className="size-3.5" /> Type:
            </span>
            {["ALL", "Customs", "Financial", "Documentation", "Weight"].map((cat) => (
              <button
                key={cat}
                onClick={() => setTypeFilter(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  typeFilter === cat
                    ? "bg-ink text-sand"
                    : "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                <th className="px-4 py-3 font-medium">Container / Cargo</th>
                <th className="px-4 py-3 font-medium">Consignee</th>
                <th className="px-4 py-3 font-medium">Hold Category</th>
                <th className="px-4 py-3 font-medium">Triggered By</th>
                <th className="px-4 py-3 font-medium">Reason for Interlock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredHolds.map((h) => (
                <tr key={h.id} className="transition-colors hover:bg-sand/60">
                  <td className="px-4 py-3.5 font-mono text-xs">
                    <span className="font-bold text-ink">{h.containerNo}</span>
                    <span className="block text-[10px] text-ink-soft">{h.cargoRef}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink font-medium">{h.consignee}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={h.holdType}
                      tone={h.holdType.includes("Customs") ? "critical" : h.holdType.includes("Financial") ? "warning" : "info"}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink-soft">{h.placedBy}</td>
                  <td className="px-4 py-3.5 text-xs text-ink max-w-xs truncate" title={h.reason}>
                    {h.reason}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={h.status}
                      tone={h.status === "Active" ? "critical" : h.status === "Under Review" ? "warning" : "success"}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {h.status !== "Resolved" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveHold(h.id, h.containerNo)}
                        className="text-xs font-semibold text-teal-deep hover:bg-teal/10"
                      >
                        <Unlock className="mr-1 size-3.5" /> Release Hold
                      </Button>
                    ) : (
                      <span className="font-mono text-[10px] text-ink-soft">Cleared</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
          <span>
            Showing {filteredHolds.length} of {holds.length} operational exceptions
          </span>
          <span>Automatic ANPR / RFID Barrier Interlock Active</span>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded-xl bg-paper p-6 shadow-2xl ring-1 ring-line">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">
                  Interlock Security
                </p>
                <h3 className="mt-1 font-display text-xl font-bold">Apply Cargo Release Hold</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X />
              </Button>
            </div>

            <form onSubmit={handlePlaceHold} className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Container Number
                </label>
                <Input
                  required
                  placeholder="e.g. TRIU1234567"
                  value={containerNo}
                  onChange={(e) => setContainerNo(e.target.value)}
                  className="mt-1.5 border-line bg-sand font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Hold Category
                  </label>
                  <select
                    value={holdType}
                    onChange={(e) => setHoldType(e.target.value as HoldRecord["holdType"])}
                    className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs outline-none"
                  >
                    <option>Customs Hold</option>
                    <option>Financial / Tariff Hold</option>
                    <option>Documentation Hold</option>
                    <option>Weight Discrepancy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Consignee Name
                  </label>
                  <Input
                    placeholder="e.g. Atlantic Trade Ltd"
                    value={consignee}
                    onChange={(e) => setConsignee(e.target.value)}
                    className="mt-1.5 border-line bg-sand"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Justification & Statutory Authority
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the exact non-compliance or query requiring gate lock..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-sand p-3 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-coral text-white hover:bg-carmine">
                  Lock Container at Gate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
