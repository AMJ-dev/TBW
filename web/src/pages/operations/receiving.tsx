import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	Download,
	Filter,
	PackageCheck,
	Plus,
	Scale,
	Search,
	Ship,
} from "lucide-react";
import {
	AppShell,
	StatusBadge,
	statusTone,
	Metric,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReceivingRecord {
	id: string;
	containerNo: string;
	sealNo: string;
	shippingLine: string;
	vesselFeed: string;
	originPort: string;
	grossWeight: string;
	receivedBay: string;
	status: "Received" | "Expected" | "Inspecting" | "Discrepancy";
	timestamp: string;
}

const initialReceiving: ReceivingRecord[] = [
	{
		id: "rcv-1",
		containerNo: "TRIU1234564",
		sealNo: "SL-992819",
		shippingLine: "Maersk Line",
		vesselFeed: "Maersk Voyager V.2604",
		originPort: "Apapa Port",
		grossWeight: "18,420 kg",
		receivedBay: "Receiving Bay 02",
		status: "Received",
		timestamp: "09 Sep · 08:30",
	},
	{
		id: "rcv-2",
		containerNo: "MSCU9876540",
		sealNo: "SL-441029",
		shippingLine: "MSC Mediterranean",
		vesselFeed: "MSC Nigeria Express",
		originPort: "Tin Can Island Port",
		grossWeight: "24,650 kg",
		receivedBay: "Receiving Bay 01",
		status: "Received",
		timestamp: "09 Sep · 09:15",
	},
	{
		id: "rcv-3",
		containerNo: "CMAU5544335",
		sealNo: "SL-773820",
		shippingLine: "CMA CGM Group",
		vesselFeed: "CMA CGM Africa Feeder",
		originPort: "Onne Port Complex",
		grossWeight: "21,100 kg",
		receivedBay: "Receiving Bay 03",
		status: "Inspecting",
		timestamp: "09 Sep · 10:45",
	},
	{
		id: "rcv-4",
		containerNo: "HLCU1122338",
		sealNo: "SL-661928",
		shippingLine: "Hapag-Lloyd",
		vesselFeed: "Hapag Express 12",
		originPort: "Apapa Port",
		grossWeight: "19,800 kg",
		receivedBay: "Receiving Bay 04",
		status: "Expected",
		timestamp: "Expected 14:00",
	},
];

const SHIPPING_LINES = [
	"Maersk Line",
	"MSC Mediterranean",
	"CMA CGM Group",
	"Hapag-Lloyd",
];

const ORIGIN_PORTS = [
	"Apapa Port",
	"Tin Can Island Port",
	"Onne Port Complex",
	"Lekki Deep Sea Port",
];

const RECEIVING_BAYS = [
	"Receiving Bay 01",
	"Receiving Bay 02",
	"Receiving Bay 03",
	"Receiving Bay 04",
];

const STATUS_FILTERS = [
	"ALL",
	"Received",
	"Expected",
	"Inspecting",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function OperationsReceivingRoute() {
	const [records, setRecords] = useState<ReceivingRecord[]>(initialReceiving);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [view, setView] = useState<"list" | "intake">("list");

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const q = searchQuery.trim().toLowerCase();
			const matchQuery =
				!q ||
				r.containerNo.toLowerCase().includes(q) ||
				r.sealNo.toLowerCase().includes(q) ||
				r.shippingLine.toLowerCase().includes(q) ||
				r.vesselFeed.toLowerCase().includes(q);

			const matchStatus =
				statusFilter === "ALL"
					? true
					: r.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [records, searchQuery, statusFilter]);

	const handleIntake = (item: ReceivingRecord) => {
		setRecords((prev) => [item, ...prev]);
		setView("list");
		toast.success(
			`Container ${item.containerNo} checked in locally at ${item.receivedBay}.`
		);
	};

	const handleExport = () => {
		toast.success(
			"Inbound receiving tally sheet exported locally."
		);
	};

	return (
		<AppShell
			title="Receiving & Intake"
			eyebrow="Operations · Inbound Terminal Tally"
		>
			<div className="overflow-hidden">
				{view === "list" ? (
					<ListView
						key="list"
						records={records}
						filteredRecords={filteredRecords}
						searchQuery={searchQuery}
						statusFilter={statusFilter}
						onSearchChange={setSearchQuery}
						onStatusChange={setStatusFilter}
						onNewIntake={() => setView("intake")}
						onExport={handleExport}
					/>
				) : (
					<IntakeView
						key="intake"
						onCancel={() => setView("list")}
						onSubmit={handleIntake}
						existingCount={records.length}
					/>
				)}
			</div>
		</AppShell>
	);
}

function ListView({
	records,
	filteredRecords,
	searchQuery,
	statusFilter,
	onSearchChange,
	onStatusChange,
	onNewIntake,
	onExport,
}: {
	records: ReceivingRecord[];
	filteredRecords: ReceivingRecord[];
	searchQuery: string;
	statusFilter: StatusFilter;
	onSearchChange: (v: string) => void;
	onStatusChange: (v: StatusFilter) => void;
	onNewIntake: () => void;
	onExport: () => void;
}) {
	return (
		<div
			className="space-y-5 pb-8"
			style={{
				animation:
					"slideInFromRight 260ms cubic-bezier(0.32, 0.72, 0, 1)",
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
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Inbound logistics · Feeder intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Inbound cargo receiving &amp; gate tally
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Confirm feeder manifests, seal integrity, weighbridge gross
						mass, and initial yard bay allocation.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink hover:bg-sand"
						onClick={onExport}
					>
						<Download className="size-4" /> Export tally sheet
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={onNewIntake}
					>
						<Plus className="size-4" /> Receive container
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Received today"
					value={String(
						records.filter((r) => r.status === "Received").length
					)}
					detail="Across 4 feeder runs"
					tone="success"
					icon={PackageCheck}
				/>
				<Metric
					label="Expected feeder"
					value="8 containers"
					detail="Arriving from Lagos ports"
					tone="info"
					icon={Ship}
				/>
				<Metric
					label="Seal integrity"
					value="Verified"
					detail="All seals matched at intake"
					tone="success"
					icon={CheckCircle2}
				/>
				<Metric
					label="Weighbridge VGM"
					value="Nominal"
					detail="Avg gross weight: 21.4t"
					tone="info"
					icon={Scale}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Search by container, seal number, shipping line, or vessel..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{STATUS_FILTERS.map((s) => (
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
								{s === "ALL" ? "All" : s}
							</button>
						))}
					</div>
				</div>

				{filteredRecords.length === 0 ? (
					<div className="p-12 text-center">
						<PackageCheck className="mx-auto size-7 text-ink-soft" />
						<p className="mt-3 font-medium text-ink">
							No inbound containers match your filters.
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Try a different container, seal, or status.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[850px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">
										Container No.
									</th>
									<th className="px-4 py-3 font-medium">
										Verified seal
									</th>
									<th className="px-4 py-3 font-medium">
										Carrier / feeder vessel
									</th>
									<th className="px-4 py-3 font-medium">
										Origin port
									</th>
									<th className="px-4 py-3 font-medium">
										Gross weight (VGM)
									</th>
									<th className="px-4 py-3 font-medium">
										Receiving bay
									</th>
									<th className="px-4 py-3 font-medium">
										Status
									</th>
									<th className="px-4 py-3 text-right font-medium">
										Intake time
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{filteredRecords.map((r) => (
									<tr
										key={r.id}
										className="transition-colors hover:bg-sand/60"
									>
										<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
											{r.containerNo}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-orange-deep">
											{r.sealNo}
										</td>
										<td className="px-4 py-3.5 text-xs text-ink">
											<p className="font-semibold">
												{r.shippingLine}
											</p>
											<p className="text-[10px] text-ink-soft">
												{r.vesselFeed}
											</p>
										</td>
										<td className="px-4 py-3.5 text-xs text-ink-soft">
											{r.originPort}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink">
											{r.grossWeight}
										</td>
										<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
											{r.receivedBay}
										</td>
										<td className="px-4 py-3.5">
											<StatusBadge
												label={r.status}
												tone={statusTone(r.status)}
											/>
										</td>
										<td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
											{r.timestamp}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredRecords.length} of {records.length} inbound
						containers
					</span>
					<span>Verified gross mass recorded at intake</span>
				</div>
			</section>
		</div>
	);
}

function IntakeView({
	onCancel,
	onSubmit,
	existingCount,
}: {
	onCancel: () => void;
	onSubmit: (item: ReceivingRecord) => void;
	existingCount: number;
}) {
	const [containerNo, setContainerNo] = useState("");
	const [sealNo, setSealNo] = useState("");
	const [shippingLine, setShippingLine] = useState(SHIPPING_LINES[0] ?? "");
	const [originPort, setOriginPort] = useState(ORIGIN_PORTS[0] ?? "");
	const [grossWeight, setGrossWeight] = useState("");
	const [receivedBay, setReceivedBay] = useState(RECEIVING_BAYS[0] ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo.trim() || !sealNo.trim() || !grossWeight.trim()) {
			toast.error(
				"Please fill in container number, seal, and verified weight."
			);
			return;
		}

		const trimmedWeight = grossWeight.trim();
		const item: ReceivingRecord = {
			id: `rcv-${existingCount + 1}`,
			containerNo: containerNo.trim().toUpperCase(),
			sealNo: sealNo.trim().toUpperCase(),
			shippingLine,
			vesselFeed: "Feeder transfer",
			originPort,
			grossWeight: trimmedWeight.includes("kg")
				? trimmedWeight
				: `${trimmedWeight} kg`,
			receivedBay,
			status: "Received",
			timestamp: "Just now · Logged",
		};

		onSubmit(item);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 pb-24"
			style={{
				animation:
					"slideInFromLeft 260ms cubic-bezier(0.32, 0.72, 0, 1)",
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
					Back to receiving log
				</Button>
			</div>

			<div className="min-w-0">
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					Inbound logistics · Feeder intake
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Receive container at gate
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
					Confirm feeder manifest, seal integrity, weighbridge gross
					mass, and assign the container to a receiving bay.
				</p>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Container
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Identify the container and its verified seal.
					</p>
				</div>
				<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
					<label className="block">
						<span className={labelClass}>
							Container number{" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. TRIU1234564"
							value={containerNo}
							onChange={(e) =>
								setContainerNo(e.target.value.toUpperCase())
							}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Bolt seal number{" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. SL-992819"
							value={sealNo}
							onChange={(e) =>
								setSealNo(e.target.value.toUpperCase())
							}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5 sm:p-6">
					<h3 className="font-display text-sm font-bold text-ink">
						Carrier & route
					</h3>
					<p className="mt-1 text-xs leading-5 text-ink-soft">
						Feeder carrier, origin port, and receiving bay.
					</p>
				</div>
				<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
					<label className="block">
						<span className={labelClass}>Carrier / line</span>
						<SelectField
							value={shippingLine}
							onChange={setShippingLine}
							options={SHIPPING_LINES}
						/>
					</label>

					<label className="block">
						<span className={labelClass}>Origin port</span>
						<SelectField
							value={originPort}
							onChange={setOriginPort}
							options={ORIGIN_PORTS}
						/>
					</label>

					<label className="block">
						<span className={labelClass}>
							Gross weight (kg){" "}
							<span className="text-coral">*</span>
						</span>
						<Input
							required
							placeholder="e.g. 21,500"
							value={grossWeight}
							onChange={(e) => setGrossWeight(e.target.value)}
							className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
						/>
					</label>

					<label className="block">
						<span className={labelClass}>Receiving bay</span>
						<SelectField
							value={receivedBay}
							onChange={setReceivedBay}
							options={RECEIVING_BAYS}
						/>
					</label>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="p-5 sm:p-6">
					<div className="rounded-lg bg-sand p-3 ring-1 ring-line">
						<p className={labelClass}>Recorded as</p>
						<p className="mt-1 font-mono text-[11px] text-ink">
							{containerNo || "CONTAINER"} ·{" "}
							{sealNo || "SEAL"} · {receivedBay} · Received
						</p>
					</div>
				</div>
			</section>

			<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
							Terminal gate intake
						</p>
						<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
							{containerNo || "Container pending"} ·{" "}
							{receivedBay}
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
							Confirm gate intake
							<ArrowRight className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
}

function SelectField({
	value,
	onChange,
	options,
}: {
	value: string;
	onChange: (value: string) => void;
	options: string[];
}) {
	return (
		<div className="relative mt-1.5">
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-11 w-full appearance-none rounded-md border border-line bg-sand px-3 pr-9 text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
			>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
		</div>
	);
}