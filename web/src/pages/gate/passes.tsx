import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	CheckCircle2,
	Download,
	Filter,
	Plus,
	QrCode,
	Search,
	ShieldAlert,
	ShieldCheck,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, statusTone, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GatePass {
	id: string;
	passCode: string;
	truckNo: string;
	driver: string;
	type: "Terminal Entry" | "Gate-Out Clearance" | "Collection";
	issuedAt: string;
	validUntil: string;
	status: "Active" | "Redeemed" | "Revoked" | "Expired";
	container: string;
}

const initialPasses: GatePass[] = [
	{
		id: "pas-1",
		passCode: "GP-2026-09281",
		truckNo: "KJA-882-XD",
		driver: "Babatunde Alao",
		type: "Terminal Entry",
		issuedAt: "09 Sep · 09:15",
		validUntil: "09 Sep · 17:00",
		status: "Active",
		container: "TRIU1234564",
	},
	{
		id: "pas-2",
		passCode: "GP-2026-09282",
		truckNo: "LSR-441-YY",
		driver: "Emeka Okoro",
		type: "Gate-Out Clearance",
		issuedAt: "09 Sep · 10:00",
		validUntil: "09 Sep · 18:00",
		status: "Active",
		container: "MSCU9876540",
	},
	{
		id: "pas-3",
		passCode: "GP-2026-09283",
		truckNo: "KTN-773-AA",
		driver: "Yakubu Garba",
		type: "Gate-Out Clearance",
		issuedAt: "08 Sep · 14:20",
		validUntil: "08 Sep · 20:00",
		status: "Redeemed",
		container: "HLCU1122338",
	},
	{
		id: "pas-4",
		passCode: "GP-2026-09284",
		truckNo: "EKY-904-BB",
		driver: "Femi Daniel",
		type: "Terminal Entry",
		issuedAt: "07 Sep · 08:30",
		validUntil: "07 Sep · 16:00",
		status: "Expired",
		container: "ONEU9988774",
	},
];

export default function GatePassesRoute() {
	const [passes, setPasses] = useState<GatePass[]>(initialPasses);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);

	const [truckNo, setTruckNo] = useState("");
	const [driver, setDriver] = useState("");
	const [container, setContainer] = useState("");
	const [type, setType] = useState<GatePass["type"]>("Terminal Entry");

	const filteredPasses = useMemo(() => {
		return passes.filter((p) => {
			const matchQuery =
				p.passCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.truckNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.container.toLowerCase().includes(searchQuery.toLowerCase());

			const matchStatus =
				statusFilter === "ALL" ? true : p.status.toUpperCase() === statusFilter.toUpperCase();

			return matchQuery && matchStatus;
		});
	}, [passes, searchQuery, statusFilter]);

	const handleIssuePass = (e: React.FormEvent) => {
		e.preventDefault();
		if (!truckNo || !driver || !container) {
			toast.error("Please fill in truck, driver, and container.");
			return;
		}

		const nextCode = `GP-2026-09${285 + passes.length}`;
		const newPass: GatePass = {
			id: `pas-${passes.length + 1}`,
			passCode: nextCode,
			truckNo: truckNo.toUpperCase(),
			driver,
			type,
			issuedAt: "Just now",
			validUntil: "Today · 20:00",
			status: "Active",
			container: container.toUpperCase(),
		};

		setPasses([newPass, ...passes]);
		setIsModalOpen(false);
		setTruckNo("");
		setDriver("");
		setContainer("");
		toast.success(`Gate pass ${nextCode} issued locally.`);
	};

	return (
		<AppShell title="Gate Passes" eyebrow="Gate Control · Security Credentials">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Security control · Gate pass records
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Gate passes & clearances
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Issue and track gate passes linked to truck plates, driver details, and cargo
						reference.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Pass log exported locally.")}
					>
						<Download className="size-4" /> Export Log
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Issue Gate Pass
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active Passes"
					value={String(passes.filter((p) => p.status === "Active").length)}
					detail="Currently valid in terminal"
					tone="success"
					icon={ShieldCheck}
				/>
				<Metric
					label="Redeemed Today"
					value="38"
					detail="Gate-out exits recorded"
					tone="info"
					icon={CheckCircle2}
				/>
				<Metric
					label="Expired / Overdue"
					value="1"
					detail="Pass window elapsed"
					tone="warning"
					icon={ShieldAlert}
				/>
				<Metric
					label="Admittance Checks"
					value="98.4%"
					detail="Pass and plate recorded at gate"
					tone="success"
					icon={CheckCircle2}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by pass code, plate, driver, or container..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Status:
						</span>
						{["ALL", "Active", "Redeemed", "Expired"].map((s) => (
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
								<th className="px-4 py-3 font-medium">Pass Code</th>
								<th className="px-4 py-3 font-medium">Truck Plate</th>
								<th className="px-4 py-3 font-medium">Driver</th>
								<th className="px-4 py-3 font-medium">Container No.</th>
								<th className="px-4 py-3 font-medium">Type</th>
								<th className="px-4 py-3 font-medium">Validity</th>
								<th className="px-4 py-3 font-medium">Status</th>
								<th className="px-4 py-3 font-medium text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredPasses.map((p) => (
								<tr key={p.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{p.passCode}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs font-bold text-ink">
										{p.truckNo}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">{p.driver}</td>
									<td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
										{p.container}
									</td>
									<td className="px-4 py-3.5 text-xs text-ink">{p.type}</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{p.validUntil}</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={p.status} tone={statusTone(p.status)} />
									</td>
									<td className="px-4 py-3.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedPass(p)}
											className="text-xs font-semibold text-orange-deep hover:bg-orange/10"
										>
											<QrCode className="mr-1 size-3.5" /> View QR
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredPasses.length} of {passes.length} digital passes
					</span>
					<span>QR scanner compatible</span>
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
									Gate pass
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Issue Gate Pass
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleIssuePass} className="mt-5 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Truck Plate Number
									</label>
									<Input
										required
										placeholder="e.g. KJA-882-XD"
										value={truckNo}
										onChange={(e) => setTruckNo(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Pass Type
									</label>
									<select
										value={type}
										onChange={(e) => setType(e.target.value as GatePass["type"])}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Terminal Entry</option>
										<option>Gate-Out Clearance</option>
										<option>Collection</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Driver Full Name
									</label>
									<Input
										required
										placeholder="e.g. Babatunde Alao"
										value={driver}
										onChange={(e) => setDriver(e.target.value)}
										className="mt-1.5 border-line bg-sand text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Container Number
									</label>
									<Input
										required
										placeholder="e.g. TRIU1234564"
										value={container}
										onChange={(e) => setContainer(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Issue Pass
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{selectedPass && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-sm"
					onMouseDown={(e) => e.target === e.currentTarget && setSelectedPass(null)}
				>
					<div className="w-full max-w-sm rounded-xl bg-paper p-6 text-center shadow-2xl ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line pb-3 text-left">
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-deep">
									Gate pass
								</p>
								<h3 className="font-display text-lg font-bold text-ink">
									{selectedPass.passCode}
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setSelectedPass(null)}>
								<X />
							</Button>
						</div>

						<div className="my-5 grid place-items-center rounded-xl bg-sand p-6 ring-1 ring-line">
							<QrCode className="size-36 text-ink" />
							<p className="mt-3 font-mono text-xs font-bold text-ink">
								{selectedPass.truckNo}
							</p>
							<p className="text-xs text-ink-soft">{selectedPass.driver}</p>
						</div>

						<div className="space-y-1 text-xs text-ink-soft">
							<p>
								Type:{" "}
								<span className="font-semibold text-ink">{selectedPass.type}</span>
							</p>
							<p>
								Container:{" "}
								<span className="font-mono text-ink">{selectedPass.container}</span>
							</p>
							<p>
								Valid until: <span className="text-ink">{selectedPass.validUntil}</span>
							</p>
						</div>

						<Button
							className="mt-5 w-full bg-orange text-white hover:bg-orange-deep"
							onClick={() => {
								toast.success(`Gate slip for ${selectedPass.passCode} prepared for print.`);
								setSelectedPass(null);
							}}
						>
							Prepare Physical Gate Slip
						</Button>
					</div>
				</div>
			)}
		</AppShell>
	);
}