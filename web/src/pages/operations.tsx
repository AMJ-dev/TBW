import { useState, type ReactNode } from "react";
import { Link } from "@/components/router-link";
import { toast } from "sonner";
import {
	AlertTriangle,
	ArrowRight,
	Boxes,
	Grid2X2,
	Warehouse,
	X,
} from "lucide-react";
import { AppShell, StatusBadge, Metric, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifications } from "@/data/mock";

type SlotState = "occupied" | "reserved" | "hold" | "available";

interface Slot {
	zone: string;
	code: string;
	state: SlotState;
}

const slots: Slot[] = [
	{ zone: "Yard A", code: "A01", state: "occupied" },
	{ zone: "Yard A", code: "A02", state: "occupied" },
	{ zone: "Yard A", code: "A03", state: "reserved" },
	{ zone: "Yard A", code: "A04", state: "occupied" },
	{ zone: "Yard B", code: "B01", state: "occupied" },
	{ zone: "Yard B", code: "B02", state: "occupied" },
	{ zone: "Yard B", code: "B03", state: "available" },
	{ zone: "Yard B", code: "B04", state: "reserved" },
	{ zone: "Bond WH", code: "Bay 1", state: "occupied" },
	{ zone: "Bond WH", code: "Bay 2", state: "occupied" },
	{ zone: "Bond WH", code: "Bay 3", state: "hold" },
	{ zone: "Yard C", code: "C01", state: "occupied" },
	{ zone: "Yard C", code: "C02", state: "occupied" },
	{ zone: "Yard C", code: "C03", state: "hold" },
	{ zone: "Yard C", code: "C04", state: "available" },
	{ zone: "Gate", code: "Lane 1", state: "occupied" },
	{ zone: "Gate", code: "Lane 2", state: "available" },
	{ zone: "Gate", code: "Lane 3", state: "reserved" },
];

const slotStyle: Record<SlotState, string> = {
	occupied: "bg-orange/80 ring-orange/30",
	reserved: "bg-amber/70 ring-amber/30",
	hold: "bg-coral/70 ring-coral/30",
	available: "bg-sand ring-line",
};

const slotLabel: Record<SlotState, string> = {
	occupied: "Occupied",
	reserved: "Reserved",
	hold: "Hold",
	available: "Available",
};

export default function OperationsDashboardRoute() {
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

	return (
		<AppShell title="Ground Map" eyebrow="Yard · Warehouse · Gate">
			<PageIntro
				eyebrow="Abuja Flagship Facility"
				title="A secure control tower over a moving terminal."
				detail="Bonded terminal overview · 09 Sep 2026 · Operational state is simulated locally."
				actions={
					<Button
						className="bg-orange text-white hover:bg-orange-deep"
						onClick={() => toast.success("Operations report exported locally.")}
					>
						Export report
					</Button>
				}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<Metric
					label="Cargo in terminal"
					value="1,284"
					detail="+38 vs yesterday"
					tone="success"
					icon={Boxes}
				/>
				<Metric
					label="Containers in yard"
					value="942"
					detail="Yard A · B · C"
					icon={Grid2X2}
				/>
				<Metric
					label="Warehouse occupancy"
					value="78%"
					detail="22% available capacity"
					tone="warning"
					icon={Warehouse}
				/>
				<Metric
					label="Active holds"
					value="26"
					detail="4 need attention"
					tone="critical"
					icon={AlertTriangle}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-12">
				<section className="rounded-xl bg-paper p-4 ring-1 ring-line xl:col-span-7">
					<SectionHeader
						title="Yard & warehouse footprint"
						detail="Yard A · B · C · Bond WH · Gate"
					/>
					<div className="relative overflow-hidden rounded-lg bg-sand-2 p-4 ring-1 ring-line">
						<div
							className="absolute inset-0 opacity-40"
							style={{
								backgroundImage:
									"linear-gradient(to right, var(--color-ink) 1px, transparent 1px), linear-gradient(to bottom, var(--color-ink) 1px, transparent 1px)",
								backgroundSize: "28px 28px",
							}}
						/>
						<div className="relative grid grid-cols-3 gap-5 sm:grid-cols-5">
							{["Yard A", "Yard B", "Bond WH", "Yard C", "Gate"].map((zone) => {
								const zoneSlots = slots.filter((s) => s.zone === zone);
								return (
									<div key={zone}>
										<p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
											{zone}
										</p>
										<div className="grid grid-cols-3 gap-1.5">
											{zoneSlots.map((slot) => (
												<button
													aria-label={`${slot.zone} ${slot.code} — ${slotLabel[slot.state]}`}
													key={`${slot.zone}-${slot.code}`}
													onClick={() => setSelectedSlot(slot)}
													className={cn(
														"size-8 rounded-[3px] ring-1 transition-transform hover:scale-110",
														slotStyle[slot.state]
													)}
													title={`${slot.code} · ${slotLabel[slot.state]}`}
												/>
											))}
										</div>
									</div>
								);
							})}
						</div>
						<div className="relative mt-5 flex flex-wrap gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
							<Legend color="bg-orange/80" label="Occupied" />
							<Legend color="bg-amber/70" label="Reserved" />
							<Legend color="bg-coral/70" label="Hold" />
							<Legend color="bg-sand ring-line" label="Available" />
						</div>
					</div>
				</section>

				<section className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate xl:col-span-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand/50">
								Cargo unit
							</p>
							<p className="mt-1 font-display text-lg font-bold text-sand">
								TRN-IMP-002481
							</p>
						</div>
						<StatusBadge label="Stored" tone="success" />
					</div>
					<div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-sand/5 p-3 ring-1 ring-sand/10">
						{[
							["Container", "TRIU1234564"],
							["Bill of lading", "TRN-BL-2026-008721"],
							["Consignee", "Atlantic Trade Nigeria Ltd"],
							["Last updated", "09 Sep · 14:22"],
						].map(([label, value]) => (
							<div key={label}>
								<p className="font-mono text-[9px] uppercase tracking-[0.14em] text-sand/45">
									{label}
								</p>
								<p className="mt-1 truncate text-[12px] font-medium text-sand">
									{value}
								</p>
							</div>
						))}
					</div>
					<div className="mt-5 space-y-3">
						{[
							[
								"Positioned in bonded storage",
								"07 Sep · Receiving Bay 2",
								"success",
							],
							["Documentation review started", "08 Sep · Docs Desk", "warning"],
							[
								"Examination coordination",
								"Competent-authority outcome pending",
								"neutral",
							],
							["Release & gate-out", "Pending terminal obligations", "neutral"],
						].map(([label, detail, tone]) => (
							<div className="flex gap-3" key={label}>
								<span
									className={cn(
										"mt-1 size-3.5 shrink-0 rounded-full border-2",
										tone === "success"
											? "border-teal"
											: tone === "warning"
											? "border-orange"
											: "border-sand/30"
									)}
								/>
								<div>
									<p className="text-[13px] font-medium text-sand">{label}</p>
									<p className="font-mono text-[10px] text-sand/45">{detail}</p>
								</div>
							</div>
						))}
					</div>
					<Link to="/portal/cargo/$id" params={{ id: "2481" }}>
						<Button className="mt-5 w-full bg-orange text-white hover:bg-carmine">
							Open workspace <ArrowRight />
						</Button>
					</Link>
				</section>
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
				<section className="overflow-hidden rounded-xl bg-paper ring-1 ring-line">
					<SectionHeader title="Recent activity" detail="Latest events" />
					<div className="divide-y divide-line">
						{notifications.map((item) => (
							<div key={item.title} className="flex items-center gap-3 px-5 py-3">
								<span
									className={cn(
										"size-1.5 shrink-0 rounded-full",
										item.tone === "critical"
											? "bg-coral"
											: item.tone === "warning"
											? "bg-orange"
											: "bg-teal"
									)}
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-[13px] font-medium text-ink">
										{item.title} ·{" "}
										<span className="font-mono text-ink-soft">{item.detail}</span>
									</p>
									<p className="font-mono text-[10px] text-ink-soft">{item.time}</p>
								</div>
								<StatusBadge label={item.category} tone={item.tone} />
							</div>
						))}
					</div>
				</section>

				<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<SectionHeader title="Operational health" detail="Snapshot" />
					{[
						["Gate", "98%", "success"],
						["Yard", "92%", "success"],
						["Warehouse", "78%", "warning"],
						["Documentation", "84%", "success"],
						["Finance", "71%", "warning"],
					].map(([label, value, tone]) => (
						<div className="mt-4" key={label}>
							<div className="flex justify-between text-[12px]">
								<span className="text-ink">{label}</span>
								<span className="font-mono text-ink-soft">{value}</span>
							</div>
							<div className="mt-1.5 h-1.5 rounded-full bg-sand-2">
								<div
									className={cn(
										"h-full rounded-full",
										tone === "warning" ? "bg-orange" : "bg-teal",
										value === "98%"
											? "w-[98%]"
											: value === "92%"
											? "w-[92%]"
											: value === "78%"
											? "w-[78%]"
											: value === "84%"
											? "w-[84%]"
											: "w-[71%]"
									)}
								/>
							</div>
						</div>
					))}
				</section>
			</div>

			{selectedSlot && (
				<SlotDialog slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
			)}
		</AppShell>
	);
}

export { OperationsDashboardRoute as OperationsDashboard };

function SlotDialog({ slot, onClose }: { slot: Slot; onClose: () => void }) {
	const isOccupied = slot.state === "occupied";
	const isHold = slot.state === "hold";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 px-4"
			onMouseDown={(event) => {
				if (event.currentTarget === event.target) onClose();
			}}
		>
			<div className="w-full max-w-sm rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
							Position selected
						</p>
						<h2 className="mt-1 font-display text-xl font-bold text-ink">
							{slot.zone} · {slot.code}
						</h2>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="min-h-10 min-w-10"
						onClick={onClose}
						aria-label="Close slot details"
					>
						<X />
					</Button>
				</div>
				<div className="mt-5 space-y-3 rounded-lg bg-sand p-4 text-sm ring-1 ring-line">
					<p className="flex justify-between">
						<span className="text-ink-soft">Status</span>
						<StatusBadge
							label={slotLabel[slot.state]}
							tone={statusTone(slotLabel[slot.state])}
						/>
					</p>
					{isOccupied && (
						<>
							<p className="flex justify-between">
								<span className="text-ink-soft">Container</span>
								<span className="font-mono text-ink">TRIU1234564</span>
							</p>
							<p className="flex justify-between">
								<span className="text-ink-soft">Dwell</span>
								<span className="text-ink">3 days</span>
							</p>
							<p className="flex justify-between">
								<span className="text-ink-soft">Weight</span>
								<span className="text-ink">18,420 kg</span>
							</p>
						</>
					)}
					{isHold && (
						<p className="text-[12px] leading-5 text-ink-soft">
							Position is under hold. Contact operations to review the exception.
						</p>
					)}
					{slot.state === "reserved" && (
						<p className="text-[12px] leading-5 text-ink-soft">
							Reserved for scheduled movement. No action required at this time.
						</p>
					)}
					{slot.state === "available" && (
						<p className="text-[12px] leading-5 text-ink-soft">
							Position is available for allocation.
						</p>
					)}
				</div>
				<Button
					className="mt-5 w-full bg-orange text-white hover:bg-orange-deep"
					onClick={() => {
						toast.success(
							isOccupied
								? "Cargo workspace opened."
								: "Position action recorded locally."
						);
						onClose();
					}}
				>
					{isOccupied ? "Open cargo workspace" : "Record position action"}
				</Button>
			</div>
		</div>
	);
}

function PageIntro({
	eyebrow,
	title,
	detail,
	actions,
}: {
	eyebrow: string;
	title: string;
	detail: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					{eyebrow}
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					{title}
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{detail}</p>
			</div>
			{actions}
		</div>
	);
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
	return (
		<div className="mb-4 flex items-center justify-between gap-3">
			<h3 className="font-display text-sm font-bold tracking-tight text-ink">{title}</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
	);
}

function Legend({ color, label }: { color: string; label: string }) {
	return (
		<span className="flex items-center gap-1.5">
			<span className={cn("size-2 rounded-[2px] ring-1 ring-line", color)} />
			{label}
		</span>
	);
}