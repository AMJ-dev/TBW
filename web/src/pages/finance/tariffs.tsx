import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	Coins,
	Download,
	Filter,
	Plus,
	Scale,
	Search,
	ShieldCheck,
	Snowflake,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TariffItem {
	id: string;
	code: string;
	description: string;
	unit: string;
	rate20ft: string;
	rate40ft: string;
	category: "Handling" | "Storage" | "Specialized" | "Other";
	effectiveDate: string;
}

const initialTariffs: TariffItem[] = [
	{
		id: "tar-1",
		code: "THC-01",
		description: "Terminal handling charge (inbound lift-off / grounding)",
		unit: "Per container",
		rate20ft: "₦85,000",
		rate40ft: "₦140,000",
		category: "Handling",
		effectiveDate: "01 Jan 2026",
	},
	{
		id: "tar-2",
		code: "STR-02",
		description: "Bonded yard storage (days 6–10)",
		unit: "Per day",
		rate20ft: "₦12,000",
		rate40ft: "₦22,000",
		category: "Storage",
		effectiveDate: "01 Jan 2026",
	},
	{
		id: "tar-3",
		code: "STR-03",
		description: "Extended storage escalation (day 11+)",
		unit: "Per day",
		rate20ft: "₦25,000",
		rate40ft: "₦45,000",
		category: "Storage",
		effectiveDate: "01 Jan 2026",
	},
	{
		id: "tar-4",
		code: "EXM-04",
		description: "Examination bay internal shifting & positioning",
		unit: "Per operation",
		rate20ft: "₦45,000",
		rate40ft: "₦70,000",
		category: "Specialized",
		effectiveDate: "01 Jan 2026",
	},
	{
		id: "tar-5",
		code: "REF-05",
		description: "Reefer cold chain monitoring & generator plug-in",
		unit: "Per 24 hours",
		rate20ft: "₦65,000",
		rate40ft: "₦95,000",
		category: "Specialized",
		effectiveDate: "01 Jan 2026",
	},
	{
		id: "tar-6",
		code: "WGH-06",
		description: "Weighbridge axle scale verification",
		unit: "Per truck",
		rate20ft: "₦15,000",
		rate40ft: "₦15,000",
		category: "Other",
		effectiveDate: "01 Jan 2026",
	},
];

export default function FinanceTariffsRoute() {
	const [tariffs, setTariffs] = useState<TariffItem[]>(initialTariffs);
	const [searchQuery, setSearchQuery] = useState("");
	const [catFilter, setCatFilter] = useState("ALL");
	const [isModalOpen, setIsModalOpen] = useState(false);

	const [code, setCode] = useState("");
	const [description, setDescription] = useState("");
	const [unit, setUnit] = useState("Per container");
	const [rate20, setRate20] = useState("");
	const [rate40, setRate40] = useState("");
	const [category, setCategory] = useState<TariffItem["category"]>("Handling");

	const filteredTariffs = useMemo(() => {
		return tariffs.filter((t) => {
			const matchQuery =
				t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.category.toLowerCase().includes(searchQuery.toLowerCase());

			const matchCat =
				catFilter === "ALL" ? true : t.category.toUpperCase() === catFilter.toUpperCase();

			return matchQuery && matchCat;
		});
	}, [tariffs, searchQuery, catFilter]);

	const handleAddTariff = (e: React.FormEvent) => {
		e.preventDefault();
		if (!code || !description || !rate20) {
			toast.error("Please fill in required code, description, and rates.");
			return;
		}

		const newItem: TariffItem = {
			id: `tar-${tariffs.length + 1}`,
			code,
			description,
			unit,
			rate20ft: rate20.startsWith("₦") ? rate20 : `₦${rate20}`,
			rate40ft: rate40.startsWith("₦") ? rate40 : `₦${rate40}`,
			category,
			effectiveDate: "Today",
		};

		setTariffs([newItem, ...tariffs]);
		setIsModalOpen(false);
		setCode("");
		setDescription("");
		setRate20("");
		setRate40("");
		toast.success(`Tariff line ${code} added to the schedule locally.`);
	};

	return (
		<AppShell title="Tariff Schedule" eyebrow="Finance Workspace · Terminal Charges">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Effective-dated tariff engine
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Terminal tariff schedule
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Published rates for lift-off, examination positioning, bonded storage, and
						reefer connections.
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="border-line bg-paper text-ink"
						onClick={() => toast.success("Tariff schedule exported locally.")}
					>
						<Download className="size-4" /> Download Schedule
					</Button>
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="size-4" /> Add Tariff Line
					</Button>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Active Tariff Items"
					value={String(tariffs.length)}
					detail="Across 4 categories"
					tone="info"
					icon={Coins}
				/>
				<Metric
					label="Free Storage Days"
					value="5 Days"
					detail="Standard grace period"
					tone="success"
					icon={Scale}
				/>
				<Metric
					label="Reefer Stations"
					value="24 Points"
					detail="Continuous genset power"
					tone="info"
					icon={Snowflake}
				/>
				<Metric
					label="Tariff Type"
					value="Effective-dated"
					detail="Historical versions retained"
					tone="info"
					icon={ShieldCheck}
				/>
			</div>

			<section className="rounded-xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
					<div className="relative min-w-[260px] flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by code, description, or service category..."
							className="h-10 border-line bg-sand pl-9 text-sm text-ink"
						/>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 text-xs text-ink-soft">
							<Filter className="size-3.5" /> Category:
						</span>
						{["ALL", "Handling", "Storage", "Specialized", "Other"].map((cat) => (
							<button
								key={cat}
								onClick={() => setCatFilter(cat)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
									catFilter === cat
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
								<th className="px-4 py-3 font-medium">Tariff Code</th>
								<th className="px-4 py-3 font-medium">Service Description</th>
								<th className="px-4 py-3 font-medium">Billing Unit</th>
								<th className="px-4 py-3 font-medium">20ft Rate</th>
								<th className="px-4 py-3 font-medium">40ft Rate</th>
								<th className="px-4 py-3 font-medium">Category</th>
								<th className="px-4 py-3 font-medium text-right">Effective</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{filteredTariffs.map((item) => (
								<tr key={item.id} className="transition-colors hover:bg-sand/60">
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-orange-deep">
										{item.code}
									</td>
									<td className="px-4 py-3.5">
										<p className="font-semibold text-ink">{item.description}</p>
									</td>
									<td className="px-4 py-3.5 text-xs text-ink-soft">{item.unit}</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-ink">
										{item.rate20ft}
									</td>
									<td className="px-4 py-3.5 font-mono text-xs font-semibold text-ink">
										{item.rate40ft}
									</td>
									<td className="px-4 py-3.5">
										<StatusBadge label={item.category} tone="info" />
									</td>
									<td className="px-4 py-3.5 text-right font-mono text-xs text-ink-soft">
										{item.effectiveDate}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between border-t border-line px-4 py-3 font-mono text-[10px] text-ink-soft">
					<span>
						Showing {filteredTariffs.length} of {tariffs.length} tariff line items
					</span>
					<span>Historical tariff versions retained for audit</span>
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
									Tariff configuration
								</p>
								<h3 className="mt-1 font-display text-xl font-bold text-ink">
									Add Tariff Schedule Line
								</h3>
							</div>
							<Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
								<X />
							</Button>
						</div>

						<form onSubmit={handleAddTariff} className="mt-5 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Tariff Code
									</label>
									<Input
										required
										placeholder="e.g. HND-07"
										value={code}
										onChange={(e) => setCode(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Category
									</label>
									<select
										value={category}
										onChange={(e) => setCategory(e.target.value as TariffItem["category"])}
										className="mt-1.5 h-10 w-full rounded-md border border-line bg-sand px-3 text-xs text-ink outline-none"
									>
										<option>Handling</option>
										<option>Storage</option>
										<option>Specialized</option>
										<option>Other</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Service Description
								</label>
								<Input
									required
									placeholder="e.g. Dangerous goods segregation charge"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="mt-1.5 border-line bg-sand text-ink"
								/>
							</div>

							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Billing Unit
									</label>
									<Input
										value={unit}
										onChange={(e) => setUnit(e.target.value)}
										className="mt-1.5 border-line bg-sand text-xs text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										20ft Rate (NGN)
									</label>
									<Input
										required
										placeholder="95,000"
										value={rate20}
										onChange={(e) => setRate20(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-xs text-ink"
									/>
								</div>
								<div>
									<label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										40ft Rate (NGN)
									</label>
									<Input
										placeholder="150,000"
										value={rate40}
										onChange={(e) => setRate40(e.target.value)}
										className="mt-1.5 border-line bg-sand font-mono text-xs text-ink"
									/>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-line pt-4">
								<Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" className="bg-orange text-white hover:bg-orange-deep">
									Save Tariff Line
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppShell>
	);
}