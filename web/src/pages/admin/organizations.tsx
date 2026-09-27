import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Plus,
  Search,
  Ship,
  Truck,
  Users,
  X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrgRecord {
  id: string;
  name: string;
  type: "Consignee" | "Shipping Line" | "Customs Broker" | "Transporter";
  tin: string;
  activeShipments: number;
  creditLimit: string;
  status: "Verified" | "Under Review" | "Suspended";
  joinedDate: string;
}

const initialOrgs: OrgRecord[] = [
  {
    id: "org-1",
    name: "Atlantic Trade Nigeria Ltd",
    type: "Consignee",
    tin: "TIN-28491029-001",
    activeShipments: 12,
    creditLimit: "₦50,000,000",
    status: "Verified",
    joinedDate: "14 Jan 2025",
  },
  {
    id: "org-2",
    name: "TRÏNŪ Ocean Service",
    type: "Shipping Line",
    tin: "TIN-11928301-002",
    activeShipments: 48,
    creditLimit: "₦200,000,000",
    status: "Verified",
    joinedDate: "02 Nov 2024",
  },
  {
    id: "org-3",
    name: "Meridian Customs Services",
    type: "Customs Broker",
    tin: "TIN-77382910-003",
    activeShipments: 19,
    creditLimit: "₦25,000,000",
    status: "Verified",
    joinedDate: "20 Mar 2025",
  },
  {
    id: "org-4",
    name: "Apex Haulage Logistics",
    type: "Transporter",
    tin: "TIN-44910293-004",
    activeShipments: 8,
    creditLimit: "₦15,000,000",
    status: "Verified",
    joinedDate: "05 Jun 2025",
  },
  {
    id: "org-5",
    name: "Sahara Energy Logistics",
    type: "Consignee",
    tin: "TIN-66281902-005",
    activeShipments: 5,
    creditLimit: "₦40,000,000",
    status: "Under Review",
    joinedDate: "01 Sep 2026",
  },
];

export default function AdminOrganizationsRoute() {
  const [orgs, setOrgs] = useState<OrgRecord[]>(initialOrgs);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrgRecord["type"]>("Consignee");
  const [orgTin, setOrgTin] = useState("");
  const [orgCredit, setOrgCredit] = useState("₦10,000,000");

  const filteredOrgs = useMemo(() => {
    return orgs.filter((o) => {
      const matchQuery =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.tin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === "ALL" ? true : o.type.toUpperCase() === typeFilter.toUpperCase();

      return matchQuery && matchType;
    });
  }, [orgs, searchQuery, typeFilter]);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgTin) {
      toast.error("Please provide organization name and TIN.");
      return;
    }

    const newRecord: OrgRecord = {
      id: `org-${orgs.length + 1}`,
      name: orgName,
      type: orgType,
      tin: orgTin,
      activeShipments: 0,
      creditLimit: orgCredit,
      status: "Verified",
      joinedDate: "Today",
    };

    setOrgs([newRecord, ...orgs]);
    setIsModalOpen(false);
    setOrgName("");
    setOrgTin("");
    toast.success(`Organization ${orgName} registered.`);
  };

  return (
    <AppShell title="Organizations" eyebrow="Administration · Stakeholder Directory">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Commercial Registry · Port Stakeholders
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Registered Partner Organizations
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
            Manage authorized corporate accounts, shipping agents, haulage contractors, and credit limits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-line bg-paper"
            onClick={() => toast.success("Organizations exported.")}
          >
            <Download className="size-4" /> Export Directory
          </Button>
          <Button
            className="bg-orange text-white hover:bg-orange-deep"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="size-4" /> Register Organization
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registered Stakeholders" value={String(orgs.length)} detail="Across 4 categories" tone="success" icon={Building2} />
        <Metric label="Active Shipping Lines" value="3" detail="Ocean & coastal carriers" tone="info" icon={Ship} />
        <Metric label="Approved Haulers" value="18" detail="Pre-cleared truck fleets" tone="success" icon={Truck} />
        <Metric label="Total Credit Line" value="₦330m" detail="Subject to bank guarantee" tone="info" icon={Users} />
      </div>

      <section className="rounded-xl bg-paper ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, TIN, or type..."
              className="h-10 border-line bg-sand pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <Filter className="size-3.5" /> Type:
            </span>
            {["ALL", "Consignee", "Shipping Line", "Customs Broker", "Transporter"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-ink text-sand"
                    : "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                <th className="px-4 py-3 font-medium">Organization / Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Tax ID / RC</th>
                <th className="px-4 py-3 font-medium">Active Shipments</th>
                <th className="px-4 py-3 font-medium">Credit Facility</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredOrgs.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-sand/60">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-ink">{o.name}</p>
                    <p className="font-mono text-xs text-ink-soft">Registered: {o.joinedDate}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-ink">{o.type}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{o.tin}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{o.activeShipments} units</td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-xs text-ink">{o.creditLimit}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge label={o.status} tone={statusTone(o.status)} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success(`Viewing profile for ${o.name}`)}
                      className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
                    >
                      View Account
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
          <span>
            Showing {filteredOrgs.length} of {orgs.length} verified organizations
          </span>
          <span>CAC / Federal Inland Revenue Service (FIRS) Verified</span>
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
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-teal-deep">
                  Corporate Onboarding
                </p>
                <h3 className="mt-1 font-display text-xl font-bold">Register Partner Organization</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X />
              </Button>
            </div>

            <form onSubmit={handleCreateOrg} className="mt-5 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Company Legal Name
                </label>
                <Input
                  required
                  placeholder="e.g. West African Cold Chain Ltd"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1.5 border-line bg-sand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    Organization Type
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrgRecord["type"])}
                    className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs outline-none"
                  >
                    <option>Consignee</option>
                    <option>Shipping Line</option>
                    <option>Customs Broker</option>
                    <option>Transporter</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                    TIN / CAC Number
                  </label>
                  <Input
                    required
                    placeholder="e.g. RC-9928172"
                    value={orgTin}
                    onChange={(e) => setOrgTin(e.target.value)}
                    className="mt-1.5 border-line bg-sand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  Approved Credit Limit (NGN)
                </label>
                <Input
                  value={orgCredit}
                  onChange={(e) => setOrgCredit(e.target.value)}
                  className="mt-1.5 border-line bg-sand font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
                  Register Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
