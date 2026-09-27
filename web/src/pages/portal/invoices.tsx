import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerInvoice {
  id: string;
  number: string;
  blNumber: string;
  containerNo: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: "Paid" | "Overdue" | "Issued" | "Pending";
  category: "Demurrage" | "Handling & Receiving" | "Storage" | "Customs Bay Positioning";
  breakdown: { item: string; rate: number; qty: number; total: number }[];
}

const initialInvoices: CustomerInvoice[] = [
  {
    id: "cinv-1",
    number: "TRN-INV-2026-0814",
    blNumber: "MEDU8821941",
    containerNo: "MSCU7123984",
    amount: 1850000,
    dueDate: "26 Sep 2026",
    issueDate: "19 Sep 2026",
    status: "Issued",
    category: "Handling & Receiving",
    breakdown: [
      { item: "Terminal Receiving & Discharge (40ft)", rate: 950000, qty: 1, total: 950000 },
      { item: "Yard Handling & Stacking Surcharge", rate: 450000, qty: 1, total: 450000 },
      { item: "Gate Out Documentation & E-Pass", rate: 250000, qty: 1, total: 250000 },
      { item: "VAT (7.5%) & NPA Regulatory Levy", rate: 200000, qty: 1, total: 200000 },
    ],
  },
  {
    id: "cinv-2",
    number: "TRN-INV-2026-0809",
    blNumber: "CMAC7201948",
    containerNo: "CMAU9012445",
    amount: 2450000,
    dueDate: "22 Sep 2026",
    issueDate: "10 Sep 2026",
    status: "Overdue",
    category: "Demurrage",
    breakdown: [
      { item: "Demurrage Tier 2 (Day 8 to 14)", rate: 350000, qty: 4, total: 1400000 },
      { item: "Bonded Storage Demurrage Extension", rate: 850000, qty: 1, total: 850000 },
      { item: "Administrative Late Clearance Surcharge", rate: 200000, qty: 1, total: 200000 },
    ],
  },
  {
    id: "cinv-3",
    number: "TRN-INV-2026-0792",
    blNumber: "MAE4419203",
    containerNo: "MRKU5124018",
    amount: 980000,
    dueDate: "18 Sep 2026",
    issueDate: "04 Sep 2026",
    status: "Paid",
    category: "Customs Bay Positioning",
    breakdown: [
      { item: "Examination Bay Transfer & Stacker Shift", rate: 680000, qty: 1, total: 680000 },
      { item: "Customs Inspection Escort & Sealing", rate: 300000, qty: 1, total: 300000 },
    ],
  },
  {
    id: "cinv-4",
    number: "TRN-INV-2026-0775",
    blNumber: "HLCU3391024",
    containerNo: "HLCU4091283",
    amount: 1420000,
    dueDate: "28 Sep 2026",
    issueDate: "21 Sep 2026",
    status: "Pending",
    category: "Storage",
    breakdown: [
      { item: "Bonded Yard Storage (Days 1-7 Grace)", rate: 120000, qty: 7, total: 840000 },
      { item: "Reefer Power Plug-In & Monitoring (24h)", rate: 290000, qty: 2, total: 580000 },
    ],
  },
  {
    id: "cinv-5",
    number: "TRN-INV-2026-0761",
    blNumber: "COSU6629101",
    containerNo: "COSU1084729",
    amount: 3100000,
    dueDate: "14 Sep 2026",
    issueDate: "01 Sep 2026",
    status: "Paid",
    category: "Handling & Receiving",
    breakdown: [
      { item: "Terminal Receiving & Discharge (40ft High Cube)", rate: 1200000, qty: 2, total: 2400000 },
      { item: "Specialized Forklift Devanning Service", rate: 700000, qty: 1, total: 700000 },
    ],
  },
];

export default function PortalInvoicesRoute() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<CustomerInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"remita" | "nibss" | "credit">("remita");
  const [remitaRRR, setRemitaRRR] = useState("");

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.blNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.containerNo.toLowerCase().includes(search.toLowerCase()) ||
        inv.category.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || inv.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const stats = useMemo(() => {
    const outstanding = invoices
      .filter((i) => i.status === "Issued" || i.status === "Overdue" || i.status === "Pending")
      .reduce((sum, i) => sum + i.amount, 0);
    const overdue = invoices
      .filter((i) => i.status === "Overdue")
      .reduce((sum, i) => sum + i.amount, 0);
    const paid = invoices
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      outstanding: formatNaira(outstanding),
      overdue: formatNaira(overdue),
      paid: formatNaira(paid),
      totalCount: invoices.length,
    };
  }, [invoices]);

  const handlePayInvoice = () => {
    if (!payingInvoice) return;
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === payingInvoice.id ? { ...inv, status: "Paid" } : inv))
    );
    toast.success(`Payment verified! Invoice ${payingInvoice.number} has been marked as Paid.`);
    setPayingInvoice(null);
  };

  const handleExportCSV = () => {
    const header = "Invoice Number,BL Number,Container,Amount,Due Date,Status,Category\n";
    const rows = invoices
      .map(
        (i) =>
          `"${i.number}","${i.blNumber}","${i.containerNo}",${i.amount},"${i.dueDate}","${i.status}","${i.category}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices statement exported successfully.");
  };

  return (
    <AppShell title="Invoices" eyebrow="Stakeholder Billing Center">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Consignee & Clearing Agent Financial Ledger
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Customer Invoices & Billing
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Track terminal charges, demurrage assessments, and settle invoices online.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-line font-mono text-xs"
          >
            <Download className="mr-1.5 size-3.5" />
            Export Statement
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Outstanding Payable"
          value={stats.outstanding}
          tone="warning"
          subtext="Requires settlement prior to gate release"
        />
        <Metric
          label="Overdue Penalties"
          value={stats.overdue}
          tone="critical"
          subtext="Subject to standard demurrage scaling"
        />
        <Metric
          label="Settled MTD"
          value={stats.paid}
          tone="success"
          subtext="Processed via verified payment channels"
        />
        <Metric
          label="Total Dossiers"
          value={`${stats.totalCount} Invoices`}
          tone="teal"
          subtext="Associated with active consignments"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-sand/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, B/L, or container..."
            className="border-line bg-paper pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-ink-soft" />
          <span className="text-xs font-medium text-ink-soft">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by invoice status"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Issued (Pending Payment)</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PENDING">Under Verification</option>
            <option value="PAID">Settled (Paid)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-line bg-sand/50 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">B/L & Container</th>
                <th className="px-4 py-3">Service Category</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-soft">
                    <FileText className="mx-auto size-8 opacity-40" />
                    <p className="mt-2 text-sm">No matching invoices found.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-sand/30">
                    <td className="px-4 py-4 font-mono font-semibold text-teal-deep">
                      {inv.number}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs font-medium text-ink">{inv.blNumber}</div>
                      <div className="font-mono text-[11px] text-ink-soft">{inv.containerNo}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-ink">{inv.category}</span>
                      <div className="text-[10px] text-ink-soft">Issued {inv.issueDate}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock3 className="size-3 text-ink-soft" />
                        <span className={inv.status === "Overdue" ? "font-semibold text-critical" : ""}>
                          {inv.dueDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm font-semibold">
                      {formatNaira(inv.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={inv.status} tone={statusTone(inv.status)} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="h-8 px-2 text-xs"
                        >
                          <Eye className="mr-1 size-3.5" />
                          View
                        </Button>
                        {inv.status !== "Paid" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPayingInvoice(inv);
                              setRemitaRRR(`RRR-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
                            }}
                            className="h-8 bg-teal-deep text-xs text-sand hover:bg-teal"
                          >
                            <CreditCard className="mr-1 size-3.5" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedInvoice(null)}
        >
          <div className="w-full max-w-lg rounded-xl border border-line bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-deep">
                  Official Terminal Invoice
                </span>
                <h3 className="mt-1 font-display text-xl font-bold">{selectedInvoice.number}</h3>
                <p className="text-xs text-ink-soft">
                  Bill of Lading: {selectedInvoice.blNumber} · Container: {selectedInvoice.containerNo}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-sand/50 p-3 text-xs">
                <div>
                  <span className="text-ink-soft">Status: </span>
                  <StatusBadge
                    label={selectedInvoice.status}
                    tone={statusTone(selectedInvoice.status)}
                  />
                </div>
                <div className="text-right">
                  <span className="text-ink-soft">Due Date: </span>
                  <span className="font-semibold text-ink">{selectedInvoice.dueDate}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Itemized Charges
                </h4>
                <div className="mt-2 divide-y divide-line rounded border border-line">
                  {selectedInvoice.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2.5 text-xs">
                      <div>
                        <div className="font-medium text-ink">{item.item}</div>
                        <div className="text-[10px] text-ink-soft">
                          Qty: {item.qty} × {formatNaira(item.rate)}
                        </div>
                      </div>
                      <div className="font-mono font-semibold">{formatNaira(item.total)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between bg-sand/40 p-2.5 text-sm font-bold">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-teal-deep">
                      {formatNaira(selectedInvoice.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success(`Invoice ${selectedInvoice.number} downloaded as PDF.`);
                  setSelectedInvoice(null);
                }}
              >
                <Download className="mr-1.5 size-3.5" />
                Download PDF
              </Button>
              {selectedInvoice.status !== "Paid" && (
                <Button
                  size="sm"
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    setPayingInvoice(inv);
                    setRemitaRRR(`RRR-${Math.floor(100000000000 + Math.random() * 900000000000)}`);
                  }}
                  className="bg-ink text-sand hover:bg-ink-soft"
                >
                  Proceed to Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {payingInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setPayingInvoice(null)}
        >
          <div className="w-full max-w-md rounded-xl border border-line bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-deep">
                  Checkout & Settlement
                </span>
                <h3 className="mt-1 font-display text-lg font-bold">Pay {payingInvoice.number}</h3>
                <p className="text-xs text-ink-soft">
                  Payable Total:{" "}
                  <strong className="text-ink">{formatNaira(payingInvoice.amount)}</strong>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPayingInvoice(null)}
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-soft">Select Payment Gateway</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("remita")}
                    className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                      paymentMethod === "remita"
                        ? "border-teal-deep bg-teal/10 text-teal-deep"
                        : "border-line bg-paper text-ink-soft hover:border-ink-soft"
                    }`}
                  >
                    Remita RRR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("nibss")}
                    className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                      paymentMethod === "nibss"
                        ? "border-teal-deep bg-teal/10 text-teal-deep"
                        : "border-line bg-paper text-ink-soft hover:border-ink-soft"
                    }`}
                  >
                    NIBSS Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit")}
                    className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-all ${
                      paymentMethod === "credit"
                        ? "border-teal-deep bg-teal/10 text-teal-deep"
                        : "border-line bg-paper text-ink-soft hover:border-ink-soft"
                    }`}
                  >
                    Credit Facility
                  </button>
                </div>
              </div>

              {paymentMethod === "remita" && (
                <div className="rounded-lg border border-line bg-sand/40 p-3 text-xs">
                  <div className="text-ink-soft">Generated Remita Retrieval Reference (RRR):</div>
                  <div className="mt-1 font-mono text-base font-bold text-ink">{remitaRRR}</div>
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Pay through any Nigerian commercial bank branch, internet banking, or Remita portal.
                  </p>
                </div>
              )}

              {paymentMethod === "nibss" && (
                <div className="rounded-lg border border-line bg-sand/40 p-3 text-xs">
                  <div className="text-ink-soft">Direct Deposit Bank Account:</div>
                  <div className="mt-1 font-mono font-bold text-ink">Stanbic IBTC Bank</div>
                  <div className="font-mono text-sm font-bold text-teal-deep">0039281745</div>
                  <div className="text-[11px] text-ink-soft">Account: TRÏNŪ Bonded Terminals Ltd</div>
                </div>
              )}

              {paymentMethod === "credit" && (
                <div className="rounded-lg border border-line bg-sand/40 p-3 text-xs">
                  <div className="text-ink-soft">Corporate Credit Facility:</div>
                  <div className="mt-1 font-medium text-ink">Available Balance: ₦18,500,000</div>
                  <p className="mt-1 text-[11px] text-ink-soft">
                    Amount will be debited against your approved terminal line of credit.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="outline" size="sm" onClick={() => setPayingInvoice(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePayInvoice}
                className="bg-teal-deep text-sand hover:bg-teal"
              >
                <CheckCircle2 className="mr-1.5 size-3.5" />
                Confirm Payment & Reconcile
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
