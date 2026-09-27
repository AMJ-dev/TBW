import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Check,
	ChevronLeft,
	ClipboardCheck,
	Container,
	Download,
	FileText,
	Plus,
	Search,
	Ship,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Metric, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ManifestStatus = "Pre-advice" | "Validated" | "Received" | "Discrepancy" | "Duplicate";
type IntakeSource = "EDI" | "CSV" | "XLSX" | "Manual";

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

export default function OperationsManifestRoute() {
	const [manifests, setManifests] = useState<ManifestRecord[]>(initialManifests);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ManifestStatus | "all">("all");
	const [selected, setSelected] = useState<ManifestRecord | null>(null);
	const [isIntakeOpen, setIsIntakeOpen] = useState(false);

	const filtered = useMemo(() => {
		return manifests.filter((m) => {
			const matchQuery =
				m.manifestRef.toLowerCase().includes(query.toLowerCase()) ||
				m.bl.toLowerCase().includes(query.toLowerCase()) ||
				m.vessel.toLowerCase().includes(query.toLowerCase()) ||
				m.consignee.toLowerCase().includes(query.toLowerCase()) ||
				m.agent.toLowerCase().includes(query.toLowerCase());
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
		setIsIntakeOpen(false);
		toast.success("Manifest added locally.");
	};

	const handleValidate = (id: string) => {
		setManifests((prev) =>
			prev.map((m) => (m.id === id ? { ...m, status: "Validated" as ManifestStatus } : m))
		);
		toast.success("Manifest marked as validated.");
	};

	const handleFlag = (id: string) => {
		setManifests((prev) =>
			prev.map((m) =>
				m.id === id
					? { ...m, status: "Discrepancy" as ManifestStatus, notes: `${m.notes} Flagged for review by operations.` }
					: m
			)
		);
		toast.success("Manifest flagged for review.");
	};

	return (
		<AppShell title="Pre-advice & manifest intake" eyebrow="Operations · Inbound">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Terminal operations · Intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Pre-advice and manifest intake
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Receive manifests via EDI, CSV/XLSX, or manual entry. Duplicates are detected
						and flagged automatically. Validated manifests feed the receiving workflow.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Manifest intake log exported locally.")}
					>
						<Download className="mr-1.5 size-4" /> Export log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsIntakeOpen(true)}
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
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by manifest ref, BL, vessel, consignee, or agent..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{statusFilters.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatusFilter(s)}
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
						<p className="mt-3 font-medium text-ink">No manifests match your filters.</p>
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
										<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
											{m.manifestRef}
											<p className="mt-0.5 font-sans text-[10px] font-normal text-ink-soft">
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
											<StatusBadge label={m.status} tone={statusTone(m.status)} />
										</td>
										<td className="px-4 py-3.5 text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSelected(m)}
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

			{isIntakeOpen && (
				<ManifestIntakeModal
					onClose={() => setIsIntakeOpen(false)}
					onSubmit={handleIntake}
					existingManifests={manifests}
				/>
			)}
		</AppShell>
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
					<div>
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
						<StatusBadge label={manifest.status} tone={statusTone(manifest.status)} />
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
									Validation confirms the manifest fields are consistent, the shipping
									line reference is registered, and no duplicate exists. Validated
									manifests are available for the receiving workflow.
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

function ManifestIntakeModal({
	onClose,
	onSubmit,
	existingManifests,
}: {
	onClose: () => void;
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
	const [consignee, setConsignee] = useState("");
	const [agent, setAgent] = useState("");

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!manifestRef.trim() || !bl.trim()) {
			toast.error("Manifest reference and bill of lading are required.");
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
			consignee,
			agent,
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
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-10 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-line">
				<form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
					<div className="flex items-start justify-between border-b border-line p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
								Manifest intake
							</p>
							<h3 className="mt-1 font-display text-xl font-bold text-ink">
								Add a new manifest
							</h3>
							<p className="mt-1 text-[12px] text-ink-soft">
								Enter the manifest reference and bill of lading — duplicates are
								detected automatically.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onClose}
							aria-label="Close dialog"
						>
							<X />
						</Button>
					</div>

					<div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Intake source
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-4">
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
													? "border-orange bg-orange/5 ring-1 ring-orange/30 text-orange-deep"
													: "border-line bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
											)}
										>
											<p className="font-mono text-[11px] font-semibold">{s}</p>
										</button>
									);
								})}
							</div>
							{source === "EDI" || source === "CSV" || source === "XLSX" ? (
								<p className="mt-3 text-[11px] leading-5 text-ink-soft">
									In production, this source would ingest the file automatically. For
									this prototype, fill in the fields below to simulate the parsed
									result.
								</p>
							) : null}
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
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
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
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
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
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
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
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
							<Field
								label="Gross weight"
								placeholder="72,860 kg"
								value={grossWeight}
								onChange={setGrossWeight}
								mono
							/>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<Field
								label="Consignee"
								placeholder="Atlantic Trade Nigeria Ltd"
								value={consignee}
								onChange={setConsignee}
							/>
							<Field
								label="Licensed agent"
								placeholder="Meridian Customs Services"
								value={agent}
								onChange={setAgent}
							/>
						</div>

						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
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
					</div>

					<div className="flex items-center justify-between gap-3 border-t border-line p-5 sm:p-6">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							className="text-ink-soft"
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
							Add manifest <ArrowRight />
						</Button>
					</div>
				</form>
			</div>
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
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
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