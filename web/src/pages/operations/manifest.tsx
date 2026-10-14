import { useMemo, useState, type FormEvent } from "react";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	ChevronDown,
	ClipboardCheck,
	Container,
	Download,
	FileText,
	Info,
	Plus,
	Search,
	Ship,
	Upload,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ManifestStatus =
	| "Pre-advice"
	| "Validated"
	| "Received"
	| "Discrepancy"
	| "Duplicate";

type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

type ConsigneeType = "organisation" | "individual";

type View = "list" | "intake";

interface ManifestRecord {
	id: string;
	manifestRef: string;
	bl: string;
	vessel: string;
	shippingLine: string;
	originPort: string;
	eta: string;
	containers: number;
	packages: number;
	grossWeight: string;
	consignee: string;
	agent: string;
	source: IntakeSource;
	status: ManifestStatus;
	receivedAt: string;
	notes: string;
}

interface RegisteredOrganisation {
	id: string;
	name: string;
	rcNumber?: string;
	status: "verified" | "pending" | "under_review" | string;
}

interface RegisteredAgent {
	id: string;
	name: string;
	licenceNumber: string;
	contactEmail?: string;
	contactPhone?: string;
}

interface ConsigneeValue {
	type: ConsigneeType;
	organisationId: string | null;
	organisationName: string;
	contactPerson: string;
	fullName: string;
	email: string;
	phone: string;
	address: string;
	country: string;
	agentId: string | null;
	agentName: string;
}

const registeredOrganisations: RegisteredOrganisation[] = [
	{
		id: "org-1",
		name: "Atlantic Trade Nigeria Ltd",
		rcNumber: "RC-93749834",
		status: "verified",
	},
	{
		id: "org-2",
		name: "Kano Freight Forwarders",
		rcNumber: "RC-22014566",
		status: "verified",
	},
	{
		id: "org-3",
		name: "Coastal Freight Nigeria",
		rcNumber: "RC-44098231",
		status: "pending",
	},
	{
		id: "org-4",
		name: "Sahara Energy Logistics",
		rcNumber: "RC-77092314",
		status: "verified",
	},
	{
		id: "org-5",
		name: "Prime Haulage Ltd",
		rcNumber: "RC-55310902",
		status: "under_review",
	},
];

const registeredAgents: RegisteredAgent[] = [
	{
		id: "ag-1",
		name: "Meridian Customs Services",
		licenceNumber: "NCS/AG/2026/00123",
		contactEmail: "ops@meridiancustoms.ng",
		contactPhone: "+234 803 100 2000",
	},
	{
		id: "ag-2",
		name: "Kano Line Haulers",
		licenceNumber: "NCS/AG/2025/00882",
		contactEmail: "clearance@kanoline.ng",
		contactPhone: "+234 802 330 4400",
	},
	{
		id: "ag-3",
		name: "Atlantic Freight Brokers",
		licenceNumber: "NCS/AG/2026/00211",
		contactEmail: "docs@atlanticfreight.ng",
		contactPhone: "+234 814 770 1100",
	},
	{
		id: "ag-4",
		name: "Sahel Clearing Company",
		licenceNumber: "NCS/AG/2024/00910",
		contactEmail: "operations@sahelclearing.ng",
		contactPhone: "+234 805 660 2200",
	},
	{
		id: "ag-5",
		name: "Northgate Customs Partners",
		licenceNumber: "NCS/AG/2026/00344",
		contactEmail: "desk@northgate.ng",
		contactPhone: "+234 816 442 9900",
	},
];

const initialManifests: ManifestRecord[] = [
	{
		id: "m-1",
		manifestRef: "MAN-2026-008721",
		bl: "TRN-BL-2026-008721",
		vessel: "Maersk Voyager V.2604",
		shippingLine: "Maersk Line",
		originPort: "Apapa Port",
		eta: "06 Sep 2026 · 08:30",
		containers: 4,
		packages: 220,
		grossWeight: "72,860 kg",
		consignee: "Atlantic Trade Nigeria Ltd",
		agent: "Meridian Customs Services",
		source: "EDI",
		status: "Received",
		receivedAt: "05 Sep 2026 · 16:12",
		notes: "Received via BAPLIE EDI. No discrepancies detected on automated validation.",
	},
	{
		id: "m-2",
		manifestRef: "MAN-2026-008742",
		bl: "TRN-BL-2026-008742",
		vessel: "MSC Nigeria Express",
		shippingLine: "MSC Mediterranean",
		originPort: "Tin Can Island Port",
		eta: "07 Sep 2026 · 10:00",
		containers: 2,
		packages: 140,
		grossWeight: "24,650 kg",
		consignee: "Kano Freight Forwarders",
		agent: "Kano Line Haulers",
		source: "CSV",
		status: "Validated",
		receivedAt: "05 Sep 2026 · 09:40",
		notes: "CSV intake validated. Awaiting gate arrival.",
	},
	{
		id: "m-3",
		manifestRef: "MAN-2026-008755",
		bl: "TRN-BL-2026-008755",
		vessel: "CMA CGM Africa Feeder",
		shippingLine: "CMA CGM Group",
		originPort: "Onne Port Complex",
		eta: "09 Sep 2026 · 06:15",
		containers: 6,
		packages: 380,
		grossWeight: "118,400 kg",
		consignee: "Coastal Freight Nigeria",
		agent: "Meridian Customs Services",
		source: "XLSX",
		status: "Pre-advice",
		receivedAt: "06 Sep 2026 · 14:05",
		notes: "Pre-advice received. Awaiting documents for validation.",
	},
	{
		id: "m-4",
		manifestRef: "MAN-2026-008771",
		bl: "TRN-BL-2026-008771",
		vessel: "Hapag Express 12",
		shippingLine: "Hapag-Lloyd",
		originPort: "Lekki Deep Sea Port",
		eta: "10 Sep 2026 · 09:00",
		containers: 3,
		packages: 165,
		grossWeight: "54,200 kg",
		consignee: "Sahara Energy Logistics",
		agent: "Meridian Customs Services",
		source: "Manual",
		status: "Discrepancy",
		receivedAt: "06 Sep 2026 · 11:32",
		notes: "Container count differs from shipping line pre-advice. Under review.",
	},
	{
		id: "m-5",
		manifestRef: "MAN-2026-008781",
		bl: "TRN-BL-2026-008781",
		vessel: "Maersk Voyager V.2604",
		shippingLine: "Maersk Line",
		originPort: "Apapa Port",
		eta: "01 Sep 2026 · 07:00",
		containers: 4,
		packages: 210,
		grossWeight: "68,900 kg",
		consignee: "Prime Haulage Ltd",
		agent: "Meridian Customs Services",
		source: "EDI",
		status: "Duplicate",
		receivedAt: "01 Sep 2026 · 06:55",
		notes: "Duplicate of MAN-2026-008721 manifest reference. Flagged for review.",
	},
];

const statusFilters: (ManifestStatus | "all")[] = [
	"all",
	"Pre-advice",
	"Validated",
	"Received",
	"Discrepancy",
	"Duplicate",
];

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const inputClass =
	"mt-1.5 h-11 border-line bg-sand text-ink placeholder:text-ink-soft/60";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const emptyConsignee: ConsigneeValue = {
	type: "organisation",
	organisationId: null,
	organisationName: "",
	contactPerson: "",
	fullName: "",
	email: "",
	phone: "",
	address: "",
	country: "",
	agentId: null,
	agentName: "",
};

export default function OperationsManifestRoute() {
	const [manifests, setManifests] = useState<ManifestRecord[]>(initialManifests);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ManifestStatus | "all">("all");
	const [selected, setSelected] = useState<ManifestRecord | null>(null);
	const [view, setView] = useState<View>("list");

	const filtered = useMemo(() => {
		return manifests.filter((m) => {
			const q = query.trim().toLowerCase();
			const matchQuery =
				!q ||
				m.manifestRef.toLowerCase().includes(q) ||
				m.bl.toLowerCase().includes(q) ||
				m.vessel.toLowerCase().includes(q) ||
				m.consignee.toLowerCase().includes(q) ||
				m.agent.toLowerCase().includes(q);
			const matchStatus = statusFilter === "all" || m.status === statusFilter;
			return matchQuery && matchStatus;
		});
	}, [manifests, query, statusFilter]);

	const stats = useMemo(() => {
		const total = manifests.length;
		const validated = manifests.filter((m) => m.status === "Validated").length;
		const received = manifests.filter((m) => m.status === "Received").length;
		const flagged = manifests.filter(
			(m) => m.status === "Discrepancy" || m.status === "Duplicate"
		).length;
		return { total, validated, received, flagged };
	}, [manifests]);

	const handleIntake = (next: ManifestRecord) => {
		setManifests((prev) => [next, ...prev]);
		setView("list");
		toast.success("Manifest added locally.");
	};

	const handleValidate = (id: string) => {
		setManifests((prev) =>
			prev.map((m) =>
				m.id === id ? { ...m, status: "Validated" as ManifestStatus } : m
			)
		);
		toast.success("Manifest marked as validated.");
	};

	const handleFlag = (id: string) => {
		setManifests((prev) =>
			prev.map((m) =>
				m.id === id
					? {
							...m,
							status: "Discrepancy" as ManifestStatus,
							notes: `${m.notes} Flagged for review by operations.`,
					  }
					: m
			)
		);
		toast.success("Manifest flagged for review.");
	};

	return (
		<AppShell title="Pre-advice & manifest intake" eyebrow="Operations · Inbound">
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						key="list"
						manifests={manifests}
						filtered={filtered}
						stats={stats}
						query={query}
						statusFilter={statusFilter}
						onQueryChange={setQuery}
						onStatusChange={setStatusFilter}
						onSelect={setSelected}
						onNewIntake={() => setView("intake")}
					/>
				) : (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleIntake}
						existingManifests={manifests}
					/>
				)}
			</div>

			{selected && (
				<ManifestDetailDialog
					manifest={selected}
					onClose={() => setSelected(null)}
					onValidate={() => {
						handleValidate(selected.id);
						setSelected(null);
					}}
					onFlag={() => {
						handleFlag(selected.id);
						setSelected(null);
					}}
				/>
			)}
		</AppShell>
	);
}

function ListView({
	manifests,
	filtered,
	stats,
	query,
	statusFilter,
	onQueryChange,
	onStatusChange,
	onSelect,
	onNewIntake,
}: {
	manifests: ManifestRecord[];
	filtered: ManifestRecord[];
	stats: { total: number; validated: number; received: number; flagged: number };
	query: string;
	statusFilter: ManifestStatus | "all";
	onQueryChange: (v: string) => void;
	onStatusChange: (v: ManifestStatus | "all") => void;
	onSelect: (m: ManifestRecord) => void;
	onNewIntake: () => void;
}) {
	return (
		<div
			className="space-y-5"
			style={{
				animation: "slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<style>{`
				@keyframes slideInFromRight {
					from { opacity: 0; transform: translateX(24px); }
					to { opacity: 1; transform: translateX(0); }
				}
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Pre-advice and manifest intake
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Receive manifests via EDI, CSV/XLSX, or manual entry. Duplicates are
						detected and flagged automatically. Validated manifests feed the
						receiving workflow.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={() => toast.success("Manifest intake log exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewIntake}
					>
						<Plus className="mr-1.5 size-4" /> New intake
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Total manifests"
					value={String(stats.total)}
					detail="Last 30 days"
					tone="info"
					icon={FileText}
				/>
				<Metric
					label="Validated"
					value={String(stats.validated)}
					detail="Ready for receiving"
					tone="success"
					icon={Check}
				/>
				<Metric
					label="Received"
					value={String(stats.received)}
					detail="Cargo arrived at gate"
					tone="info"
					icon={Container}
				/>
				<Metric
					label="Flagged"
					value={String(stats.flagged)}
					detail="Discrepancy or duplicate"
					tone={stats.flagged > 0 ? "critical" : "success"}
					icon={AlertTriangle}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={query}
							onChange={(e) => onQueryChange(e.target.value)}
							placeholder="Search by manifest ref, BL, vessel, consignee, or agent..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => onStatusChange(s)}
								className={cn(
									"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								{s === "all" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{filtered.length === 0 ? (
					<div className="p-12 text-center">
						<Ship className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No manifests match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different reference, vessel, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[1000px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Manifest ref</th>
									<th className="px-4 py-3 font-medium">BL / vessel</th>
									<th className="px-4 py-3 font-medium">Consignee / agent</th>
									<th className="px-4 py-3 font-medium">Containers</th>
									<th className="px-4 py-3 font-medium">Weight</th>
									<th className="px-4 py-3 font-medium">ETA</th>
									<th className="px-4 py-3 font-medium">Source</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filtered.map((m) => (
									<tr key={m.id} className="transition-colors hover:bg-sand/60">
										<td className="px-4 py-3.5">
											<p className="font-mono text-xs font-semibold text-orange-deep">
												{m.manifestRef}
											</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												Received {m.receivedAt}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] text-ink">{m.bl}</p>
											<p className="mt-0.5 text-[11px] text-ink-soft">{m.vessel}</p>
											<p className="text-[10px] text-ink-soft">{m.shippingLine}</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="text-[12px] font-medium text-ink">{m.consignee}</p>
											<p className="mt-0.5 text-[11px] text-ink-soft">{m.agent}</p>
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[12px] text-ink">{m.containers}</p>
											<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
												{m.packages} pkgs
											</p>
										</td>
										<td className="px-4 py-3.5 font-mono text-[12px] text-ink">
											{m.grossWeight}
										</td>
										<td className="px-4 py-3.5">
											<p className="font-mono text-[11px] text-ink">{m.eta}</p>
											<p className="mt-0.5 text-[10px] text-ink-soft">
												From {m.originPort}
											</p>
										</td>
										<td className="px-4 py-3.5">
											<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
												{m.source}
											</span>
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={m.status}
												tone={statusTone(m.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => onSelect(m)}
												className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
											>
												View <ArrowRight className="ml-1 size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filtered.length} of {manifests.length} manifest records
					</span>
					<span>Duplicate detection active on all sources</span>
				</div>
			</section>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	existingManifests,
}: {
	onCancel: () => void;
	onSubmit: (m: ManifestRecord) => void;
	existingManifests: ManifestRecord[];
}) {
	const [source, setSource] = useState<IntakeSource>("Manual");
	const [manifestRef, setManifestRef] = useState("");
	const [bl, setBl] = useState("");
	const [vessel, setVessel] = useState("");
	const [shippingLine, setShippingLine] = useState("");
	const [originPort, setOriginPort] = useState("");
	const [eta, setEta] = useState("");
	const [containers, setContainers] = useState("");
	const [packages, setPackages] = useState("");
	const [grossWeight, setGrossWeight] = useState("");
	const [consignee, setConsignee] = useState<ConsigneeValue>(emptyConsignee);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!manifestRef.trim() || !bl.trim()) {
			toast.error("Manifest reference and bill of lading are required.");
			return;
		}

		const consigneeName =
			consignee.type === "organisation"
				? consignee.organisationName.trim()
				: consignee.fullName.trim();

		if (!consigneeName) {
			toast.error("Consignee name is required.");
			return;
		}

		const duplicate = existingManifests.find(
			(m) =>
				m.manifestRef.toLowerCase() === manifestRef.toLowerCase() ||
				m.bl.toLowerCase() === bl.toLowerCase()
		);
		const status: ManifestStatus = duplicate ? "Duplicate" : "Pre-advice";
		const notes = duplicate
			? `Duplicate of ${duplicate.manifestRef} detected automatically on intake.`
			: "Pre-advice received via manual intake. Awaiting validation.";

		onSubmit({
			id: `m-${Date.now()}`,
			manifestRef,
			bl,
			vessel,
			shippingLine,
			originPort,
			eta,
			containers: Number(containers) || 0,
			packages: Number(packages) || 0,
			grossWeight,
			consignee: consigneeName,
			agent: consignee.agentName,
			source,
			status,
			receivedAt: new Date().toLocaleString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
			notes,
		});

		if (duplicate) {
			toast.warning("Duplicate manifest detected. Record flagged for review.");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-5 pb-24"
			style={{
				animation: "slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
			}}
		>
			<style>{`
				@keyframes slideInFromLeft {
					from { opacity: 0; transform: translateX(-24px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					className="-ml-3 gap-2 text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="size-4" />
					Back to manifests
				</Button>
			</div>

			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Terminal operations · Intake
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Add a new manifest
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Enter the manifest reference and bill of lading — duplicates are
					detected automatically. Consignee details help operations contact
					the right party and resolve discrepancies.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Intake source
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Select how this manifest arrived.
					</p>
				</div>
				<div className="p-5 sm:p-6">
					<div className="grid gap-2 sm:grid-cols-4">
						{(["EDI", "CSV", "XLSX", "Manual"] as IntakeSource[]).map((s) => {
							const active = source === s;
							return (
								<button
									key={s}
									type="button"
									onClick={() => setSource(s)}
									className={cn(
										"rounded-xl border p-3 text-center transition-colors",
										active
											? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/30"
											: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
									)}
								>
									<p className="font-mono text-[11px] font-semibold">
										{s}
									</p>
								</button>
							);
						})}
					</div>
					{(source === "EDI" || source === "CSV" || source === "XLSX") && (
						<p className="mt-3 text-[11px] leading-5 text-ink-soft">
							In production, this source would ingest the file automatically.
							For this prototype, fill in the fields below to simulate the
							parsed result.
						</p>
					)}
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Manifest details
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Primary references from the carrier.
					</p>
				</div>
				<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
					<Field
						label="Manifest reference"
						placeholder="MAN-2026-008721"
						value={manifestRef}
						onChange={setManifestRef}
						mono
						required
					/>
					<Field
						label="Bill of lading"
						placeholder="TRN-BL-2026-008721"
						value={bl}
						onChange={setBl}
						mono
						required
					/>
					<Field
						label="Vessel"
						placeholder="Maersk Voyager V.2604"
						value={vessel}
						onChange={setVessel}
					/>
					<Field
						label="Shipping line"
						placeholder="Maersk Line"
						value={shippingLine}
						onChange={setShippingLine}
					/>
					<Field
						label="Origin port"
						placeholder="Apapa Port"
						value={originPort}
						onChange={setOriginPort}
					/>
					<Field
						label="ETA at terminal"
						placeholder="06 Sep 2026 · 08:30"
						value={eta}
						onChange={setEta}
					/>
					<Field
						label="Containers"
						placeholder="4"
						value={containers}
						onChange={setContainers}
						mono
					/>
					<Field
						label="Packages"
						placeholder="220"
						value={packages}
						onChange={setPackages}
						mono
					/>
					<div className="sm:col-span-2">
						<Field
							label="Gross weight"
							placeholder="72,860 kg"
							value={grossWeight}
							onChange={setGrossWeight}
							mono
						/>
					</div>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<ConsigneeDetails
						value={consignee}
						onChange={setConsignee}
						organisations={registeredOrganisations}
						agents={registeredAgents}
						source="manifest"
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<div className="flex items-start gap-3">
						<Upload className="mt-0.5 size-4 shrink-0 text-orange" />
						<div>
							<p className="text-[13px] font-semibold text-ink">
								Duplicate detection
							</p>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								If the manifest reference or bill of lading matches an existing
								record, the intake is flagged as a duplicate and marked for
								review rather than silently accepted.
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Manifest intake
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{manifestRef || "Reference pending"} · {source}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="gap-2 bg-orange text-white hover:bg-orange-deep"
						>
							Add manifest
							<ArrowRight className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

function ManifestDetailDialog({
	manifest,
	onClose,
	onValidate,
	onFlag,
}: {
	manifest: ManifestRecord;
	onClose: () => void;
	onValidate: () => void;
	onFlag: () => void;
}) {
	const canValidate = manifest.status === "Pre-advice";
	const canFlag =
		manifest.status !== "Discrepancy" && manifest.status !== "Duplicate";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
							Manifest record
						</p>
						<h3 className="mt-1 font-display text-xl font-bold text-ink">
							{manifest.manifestRef}
						</h3>
						<p className="mt-1 text-[12px] text-ink-soft">
							Received {manifest.receivedAt} via {manifest.source}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						aria-label="Close dialog"
					>
						<X />
					</Button>
				</div>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge
							label={manifest.status}
							tone={statusTone(manifest.status)}
						/>
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{manifest.source}
						</span>
						{manifest.status === "Duplicate" && (
							<span className="rounded bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-coral">
								Duplicate detected
							</span>
						)}
					</div>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<p className="text-[12px] leading-6 text-ink-soft">{manifest.notes}</p>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Bill of lading", manifest.bl, true],
							["Vessel", manifest.vessel],
							["Shipping line", manifest.shippingLine],
							["Origin port", manifest.originPort],
							["ETA at terminal", manifest.eta, true],
							["Containers", String(manifest.containers), true],
							["Packages", String(manifest.packages), true],
							["Gross weight", manifest.grossWeight, true],
							["Consignee", manifest.consignee],
							["Licensed agent", manifest.agent],
						].map(([label, value, mono]) => (
							<div key={label as string}>
								<dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-ink-soft">
									{label}
								</dt>
								<dd
									className={cn(
										"mt-1 text-sm font-medium text-ink",
										mono && "font-mono"
									)}
								>
									{value}
								</dd>
							</div>
						))}
					</dl>

					<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
						<div className="flex items-start gap-3">
							<ClipboardCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
									What validation does
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									Validation confirms the manifest fields are consistent, the
									shipping line reference is registered, and no duplicate
									exists. Validated manifests are available for the receiving
									workflow.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-5 sm:p-6">
					<Button variant="ghost" onClick={onClose} className="text-ink-soft">
						Close
					</Button>
					<div className="flex flex-wrap gap-2">
						{canFlag && (
							<Button
								variant="outline"
								onClick={onFlag}
								className="border-line bg-paper text-coral hover:bg-coral/10"
							>
								<AlertTriangle className="mr-1.5 size-4" /> Flag for review
							</Button>
						)}
						{canValidate && (
							<Button
								onClick={onValidate}
								className="bg-orange text-white hover:bg-orange-deep"
							>
								<Check className="mr-1.5 size-4" /> Mark as validated
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ConsigneeDetails({
	value,
	onChange,
	organisations,
	agents,
	source = "manual",
}: {
	value: ConsigneeValue;
	onChange: (next: ConsigneeValue) => void;
	organisations: RegisteredOrganisation[];
	agents: RegisteredAgent[];
	source?: "manifest" | "manual";
}) {
	const update = (patch: Partial<ConsigneeValue>) =>
		onChange({ ...value, ...patch });

	const [orgQuery, setOrgQuery] = useState("");
	const [orgOpen, setOrgOpen] = useState(false);

	const filteredOrgs = useMemo(() => {
		const q = orgQuery.trim().toLowerCase();
		if (!q) return organisations;
		return organisations.filter(
			(o) =>
				o.name.toLowerCase().includes(q) ||
				(o.rcNumber ?? "").toLowerCase().includes(q)
		);
	}, [organisations, orgQuery]);

	const chooseOrg = (org: RegisteredOrganisation) => {
		update({
			organisationId: org.id,
			organisationName: org.name,
		});
		setOrgOpen(false);
		setOrgQuery("");
	};

	const clearOrg = () => {
		update({ organisationId: null, organisationName: "" });
		setOrgQuery("");
	};

	const isOrganisation = value.type === "organisation";

	return (
		<div className="space-y-5">
			<div>
				<h3 className="font-display text-sm font-bold text-ink">
					Consignee details
				</h3>
				<p className="mt-1 text-xs leading-5 text-ink-soft">
					Information about the party receiving the cargo. Used by
					Operations to verify the recipient and resolve discrepancies.
				</p>
			</div>

			<div>
				<p className={labelClass}>Consignee type</p>
				<div className="mt-2 flex flex-wrap gap-2">
					{(
						[
							{ key: "organisation", label: "Organisation", icon: Building2 },
							{ key: "individual", label: "Individual", icon: User },
						] as const
					).map((option) => {
						const Icon = option.icon;
						const active = value.type === option.key;
						return (
							<label
								key={option.key}
								className={cn(
									"flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors",
									active
										? "border-orange bg-orange/5 text-orange-deep ring-1 ring-orange/25"
										: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								)}
							>
								<input
									type="radio"
									name="consignee-type"
									value={option.key}
									checked={active}
									onChange={() =>
										update({
											type: option.key,
											organisationId:
												option.key === "organisation"
													? value.organisationId
													: null,
											organisationName:
												option.key === "organisation"
													? value.organisationName
													: "",
										})
									}
									className="sr-only"
								/>
								<Icon className="size-3.5" />
								{option.label}
							</label>
						);
					})}
				</div>
			</div>

			{isOrganisation ? (
				<div className="relative">
					<p className={labelClass}>
						Organisation / company name
						<span className="text-coral"> *</span>
					</p>
					<button
						type="button"
						onClick={() => setOrgOpen((v) => !v)}
						className={cn(
							"mt-1.5 flex h-11 w-full items-center justify-between gap-2 rounded-md border border-line bg-sand px-3 text-left text-sm text-ink outline-none transition focus:ring-2 focus:ring-orange/30",
							orgOpen && "ring-2 ring-orange/30"
						)}
					>
						<span className="flex min-w-0 items-center gap-2">
							<Building2 className="size-3.5 shrink-0 text-ink-soft" />
							{value.organisationName ? (
								<span className="flex min-w-0 flex-col items-start">
									<span className="truncate font-medium text-ink">
										{value.organisationName}
									</span>
									{value.organisationId && (
										<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-orange-deep">
											Linked to TRÏNŪ record
										</span>
									)}
								</span>
							) : (
								<span className="truncate text-ink-soft">
									Select a registered organisation or type a name…
								</span>
							)}
						</span>
						<span className="flex shrink-0 items-center gap-1">
							{value.organisationName && (
								<span
									role="button"
									tabIndex={-1}
									onClick={(e) => {
										e.stopPropagation();
										clearOrg();
									}}
									className="grid size-5 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
									aria-label="Clear organisation"
								>
									<X className="size-3" />
								</span>
							)}
							<ChevronDown
								className={cn(
									"size-4 text-ink-soft transition-transform",
									orgOpen && "rotate-180"
								)}
							/>
						</span>
					</button>

					<input
						required
						value={value.organisationName}
						onChange={(e) =>
							update({
								organisationName: e.target.value,
								organisationId: null,
							})
						}
						className="sr-only"
						aria-hidden="true"
						tabIndex={-1}
					/>

					{orgOpen && (
						<>
							<button
								type="button"
								aria-label="Close organisation picker"
								className="fixed inset-0 z-40 cursor-default"
								onClick={() => setOrgOpen(false)}
							/>
							<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
								<div className="flex items-center gap-2 border-b border-line px-3 py-2">
									<Search className="size-3.5 shrink-0 text-ink-soft" />
									<input
										autoFocus
										value={orgQuery}
										onChange={(e) => setOrgQuery(e.target.value)}
										placeholder="Search by name or RC number…"
										className="h-8 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft/70"
									/>
								</div>

								<div className="max-h-64 overflow-y-auto p-1">
									{filteredOrgs.length === 0 ? (
										<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
											No registered organisation matches.
											<span className="mt-1 block text-[11px]">
												Type the full name above to record an
												unregistered consignee.
											</span>
										</div>
									) : (
										filteredOrgs.map((org) => {
											const active = org.id === value.organisationId;
											return (
												<button
													key={org.id}
													type="button"
													onClick={() => chooseOrg(org)}
													className={cn(
														"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
														active
															? "bg-orange/10 ring-1 ring-orange/25"
															: "hover:bg-sand"
													)}
												>
													<span
														className={cn(
															"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
															active
																? "bg-orange text-white"
																: "bg-sand text-ink-soft ring-1 ring-line"
														)}
													>
														{active ? (
															<Check className="size-4" />
														) : (
															<Building2 className="size-4" />
														)}
													</span>
													<span className="min-w-0 flex-1">
														<span className="block truncate text-[13px] font-semibold text-ink">
															{org.name}
														</span>
														{org.rcNumber && (
															<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
																{org.rcNumber}
															</span>
														)}
													</span>
													{org.status === "verified" && (
														<span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-teal-deep ring-1 ring-teal/25">
															Verified
														</span>
													)}
												</button>
											);
										})
									)}
								</div>
							</div>
						</>
					)}

					<p className="mt-2 text-[11px] leading-5 text-ink-soft">
						Select a registered organisation to link this consignee
						to an existing TRÏNŪ record. Otherwise enter the name
						exactly as it appears on the manifest.
					</p>
				</div>
			) : (
				<label className="block">
					<span className={labelClass}>
						Full name
						<span className="text-coral"> *</span>
					</span>
					<Input
						required
						value={value.fullName}
						onChange={(e) => update({ fullName: e.target.value })}
						placeholder="Enter full name"
						className={inputClass}
					/>
				</label>
			)}

			{isOrganisation && (
				<label className="block">
					<span className={labelClass}>Contact person</span>
					<Input
						value={value.contactPerson}
						onChange={(e) => update({ contactPerson: e.target.value })}
						placeholder="Name of contact person"
						className={inputClass}
					/>
				</label>
			)}

			<div className="grid gap-5 sm:grid-cols-2">
				<label className="block">
					<span className={labelClass}>Email address</span>
					<Input
						type="email"
						value={value.email}
						onChange={(e) => update({ email: e.target.value })}
						placeholder="contact@company.com"
						className={inputClass}
					/>
				</label>

				<label className="block">
					<span className={labelClass}>Phone number</span>
					<Input
						type="tel"
						value={value.phone}
						onChange={(e) => update({ phone: e.target.value })}
						placeholder="+234 …"
						className={inputClass}
					/>
				</label>
			</div>

			<label className="block">
				<span className={labelClass}>Address</span>
				<textarea
					rows={3}
					value={value.address}
					onChange={(e) => update({ address: e.target.value })}
					placeholder="Street address, city and state"
					className={textareaClass}
				/>
			</label>

			<label className="block">
				<span className={labelClass}>Country</span>
				<Input
					value={value.country}
					onChange={(e) => update({ country: e.target.value })}
					placeholder="e.g. Nigeria"
					className={inputClass}
				/>
			</label>

			<div className="relative">
				<p className={labelClass}>Licensed agent</p>
				<AgentPicker
					value={value.agentName}
					onChange={(name, id) =>
						update({ agentName: name, agentId: id })
					}
					options={agents}
				/>
				<p className="mt-2 text-[11px] leading-5 text-ink-soft">
					{value.agentId
						? "Linked to a verified TRÏNŪ agent record."
						: "Select the licensed clearing agent responsible for this consignment."}
				</p>
			</div>

			{source === "manifest" && (
				<div className="flex items-start gap-3 rounded-xl border border-orange/25 bg-orange/5 p-3.5">
					<Info className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[12px] font-semibold text-ink">
							Imported from the manifest
						</p>
						<p className="mt-1 text-[11px] leading-5 text-ink-soft">
							Consignee details from the carrier are treated as
							unverified until an operator confirms them. Existing
							verified contact details on a linked organisation
							will not be overwritten by this record.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

function AgentPicker({
	value,
	onChange,
	options,
}: {
	value: string;
	onChange: (name: string, id: string | null) => void;
	options: RegisteredAgent[];
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return options;
		return options.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.licenceNumber.toLowerCase().includes(q)
		);
	}, [options, search]);

	const choose = (agent: RegisteredAgent) => {
		onChange(agent.name, agent.id);
		setOpen(false);
		setSearch("");
	};

	const clear = () => {
		onChange("", null);
		setSearch("");
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"mt-1.5 flex h-11 w-full items-center justify-between gap-2 rounded-md border border-line bg-sand px-3 text-left text-sm text-ink outline-none transition focus:ring-2 focus:ring-orange/30",
					open && "ring-2 ring-orange/30"
				)}
			>
				<span className="flex min-w-0 items-center gap-2">
					<User className="size-3.5 shrink-0 text-ink-soft" />
					{value ? (
						<span className="truncate font-medium text-ink">{value}</span>
					) : (
						<span className="truncate text-ink-soft">
							Select a licensed agent…
						</span>
					)}
				</span>
				<span className="flex shrink-0 items-center gap-1">
					{value && (
						<span
							role="button"
							tabIndex={-1}
							onClick={(e) => {
								e.stopPropagation();
								clear();
							}}
							className="grid size-5 place-items-center rounded text-ink-soft hover:bg-sand-2 hover:text-ink"
							aria-label="Clear selected agent"
						>
							<X className="size-3" />
						</span>
					)}
					<ChevronDown
						className={cn(
							"size-4 text-ink-soft transition-transform",
							open && "rotate-180"
						)}
					/>
				</span>
			</button>

			{open && (
				<>
					<button
						type="button"
						aria-label="Close agent picker"
						className="fixed inset-0 z-40 cursor-default"
						onClick={() => setOpen(false)}
					/>
					<div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-paper shadow-2xl ring-1 ring-line">
						<div className="flex items-center gap-2 border-b border-line px-3 py-2">
							<Search className="size-3.5 shrink-0 text-ink-soft" />
							<input
								autoFocus
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search agent name or licence number…"
								className="h-8 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-soft/70"
							/>
						</div>

						<div className="max-h-64 overflow-y-auto p-1">
							{filtered.length === 0 ? (
								<div className="px-3 py-6 text-center text-[12px] text-ink-soft">
									No licensed agent matches that search.
								</div>
							) : (
								filtered.map((agent) => {
									const active = agent.name === value;
									return (
										<button
											key={agent.id}
											type="button"
											onClick={() => choose(agent)}
											className={cn(
												"flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
												active
													? "bg-orange/10 ring-1 ring-orange/25"
													: "hover:bg-sand"
											)}
										>
											<span
												className={cn(
													"mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
													active
														? "bg-orange text-white"
														: "bg-sand text-ink-soft ring-1 ring-line"
												)}
											>
												{active ? (
													<Check className="size-4" />
												) : (
													<User className="size-4" />
												)}
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-[13px] font-semibold text-ink">
													{agent.name}
												</span>
												<span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
													{agent.licenceNumber}
												</span>
												{(agent.contactEmail || agent.contactPhone) && (
													<span className="mt-1 block truncate text-[11px] text-ink-soft">
														{agent.contactEmail} · {agent.contactPhone}
													</span>
												)}
											</span>
										</button>
									);
								})
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className={labelClass}>
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}