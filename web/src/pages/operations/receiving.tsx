import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Boxes,
	CheckCircle2,
	Clock,
	Download,
	Filter,
	PackageCheck,
	Plus,
	Scale,
	Search,
	Ship,
	Truck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function OperationsReceivingRoute() {
	const [records, setRecords] = useState<ReceivingRecord[]>(initialReceiving);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [containerNo, setContainerNo] = useState("");
	const [sealNo, setSealNo] = useState("");
	const [shippingLine, setShippingLine] = useState("Maersk Line");
	const [originPort, setOriginPort] = useState("Apapa Port");
	const [grossWeight, setGrossWeight] = useState("");
	const [receivedBay, setReceivedBay] = useState("Receiving Bay 01");

	const filteredRecords = useMemo(() => {
		return records.filter((r) => {
			const matchQuery =
				r.containerNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.sealNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.shippingLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.vesselFeed.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : r.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [records, searchQuery, statusFilter]);

	const handleIntake = (e: React.FormEvent) => {
		e.preventDefault();
		if (!containerNo || !sealNo || !grossWeight) {
			toast.error("Please fill in container number, seal, and verified weight.");
			return;
		}

		const newRecord: ReceivingRecord = {
			id: `rcv-${records.length + 1}`,
			containerNo: containerNo.toUpperCase(),
			sealNo: sealNo.toUpperCase(),
			shippingLine,
			vesselFeed: "Feeder transfer",
			originPort,
			grossWeight: grossWeight.includes("kg") ? grossWeight : `${grossWeight} kg`,
			receivedBay,
			status: "Received",
			timestamp: "Just now · Logged",
		};

		setRecords([newRecord, ...records]);
		setIsModalOpen(false);
		setContainerNo("");
		setSealNo("");
		setGrossWeight("");
		toast.success(`Container ${containerNo} checked in locally at ${receivedBay}.`);
	};

	return (
		<AppShell title="Receiving & Intake" eyebrow="Operations · Inbound Terminal Tally">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Inbound Logistics · Feeder Intake
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Inbound cargo receiving & gate tally
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Confirm feeder manifests, seal integrity, weighbridge gross mass, and initial
						yard bay allocation.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Inbound receiving tally sheet exported locally.")}
					>
						<Download className="size-4" /> Export Tally Sheet
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Receive Container
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Received Today"
					value={String(records.filter((r) => r.status === "Received").length)}
					detail="Across 4 feeder runs"
					tone="success"
					icon={PackageCheck}
				/>
				<Metric
					label="Expected Feeder"
					value="8 Containers"
					detail="Arriving from Lagos ports"
					tone="info"
					icon={Ship}
				/>
				<Metric
					label="Seal Integrity"
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
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by container, seal number, shipping line, or vessel..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Received", "Expected", "Inspecting"].map((s) => (
							<button
								key={s}
								onClick={() => setStatusFilter(s)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									statusFilter === s
										? "bg-ink text-sand"
										: "bg-sand text-ink-soft hover:bg-sand-2 hover:text-ink"
								}`}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Verified Seal</th>
								<th className="px-4 py-3 font-medium">Carrier / Feeder Vessel</th>
								<th className="px-4 py-3 font-medium">Origin Port</th>
								<th className="px-4 py-3 font-medium">Gross Weight (VGM)</th>
								<th className="px-4 py-3 font-medium">Receiving Bay</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Intake Time</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredRecords.map((r) => (
								<tr key={r.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{r.containerNo}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs text-orange-deep">
										{r.sealNo}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">
										<p className="font-semibold">{r.shippingLine}</p>
										<p className="text-[10px] text-ink-soft">{r.vesselFeed}</p>
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{r.originPort}</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink">{r.grossWeight}</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{r.receivedBay}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={r.status} tone={statusTone(r.status)} />
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
										{r.timestamp}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredRecords.length} of {records.length} inbound containers
					</span>
					<span>Verified gross mass recorded at intake</span>
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
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-deep">
									Terminal Gate Intake
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Receive Container at Gate
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleIntake} className="mt-5 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Container Number
									</label>
									<Input
										required
										placeholder="e.g. TRIU1234564"
										value={containerNo}
										onChange={(e) => setContainerNo(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Bolt Seal Number
									</label>
									<Input
										required
										placeholder="e.g. SL-992819"
										value={sealNo}
										onChange={(e) => setSealNo(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Carrier / Line
									</label>
									<select
										value={shippingLine}
										onChange={(e) => setShippingLine(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Maersk Line</option>
										<option>MSC Mediterranean</option>
										<option>CMA CGM Group</option>
										<option>Hapag-Lloyd</option>
									</select>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Origin Port
									</label>
									<select
										value={originPort}
										onChange={(e) => setOriginPort(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Apapa Port</option>
										<option>Tin Can Island Port</option>
										<option>Onne Port Complex</option>
										<option>Lekki Deep Sea Port</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Gross Weight (kg)
									</label>
									<Input
										required
										placeholder="e.g. 21,500"
										value={grossWeight}
										onChange={(e) => setGrossWeight(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Receiving Bay
									</label>
									<select
										value={receivedBay}
										onChange={(e) => setReceivedBay(e.target.value)}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Receiving Bay 01</option>
										<option>Receiving Bay 02</option>
										<option>Receiving Bay 03</option>
										<option>Receiving Bay 04</option>
									</select>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Confirm Gate Intake
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}