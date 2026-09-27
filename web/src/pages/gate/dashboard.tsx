import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, Grid2X2, Warehouse, X } from "lucide-react";
import { AppShell, StatusBadge, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";

type SlotState = "occupied" | "reserved" | "hold" | "available";

interface Slot {
	name: string;
	zone: string;
	code: string;
	state: SlotState;
}

const slots: Slot[] = [
	// Yard A
	{ name: "Yard A / A01", zone: "Yard A", code: "A01", state: "occupied" },
	{ name: "Yard A / A02", zone: "Yard A", code: "A02", state: "occupied" },
	{ name: "Yard A / A03", zone: "Yard A", code: "A03", state: "reserved" },
	{ name: "Yard A / A04", zone: "Yard A", code: "A04", state: "occupied" },
	// Yard B
	{ name: "Yard B / B01", zone: "Yard B", code: "B01", state: "occupied" },
	{ name: "Yard B / B02", zone: "Yard B", code: "B02", state: "occupied" },
	{ name: "Yard B / B03", zone: "Yard B", code: "B03", state: "available" },
	{ name: "Yard B / B04", zone: "Yard B", code: "B04", state: "reserved" },
	// Bond WH
	{ name: "Bond WH / Bay 1", zone: "Bond WH", code: "Bay 1", state: "occupied" },
	{ name: "Bond WH / Bay 2", zone: "Bond WH", code: "Bay 2", state: "occupied" },
	{ name: "Bond WH / Bay 3", zone: "Bond WH", code: "Bay 3", state: "hold" },
	{ name: "Bond WH / Bay 4", zone: "Bond WH", code: "Bay 4", state: "available" },
	// Yard C
	{ name: "Yard C / C01", zone: "Yard C", code: "C01", state: "occupied" },
	{ name: "Yard C / C02", zone: "Yard C", code: "C02", state: "occupied" },
	{ name: "Yard C / C03", zone: "Yard C", code: "C03", state: "hold" },
	{ name: "Yard C / C04", zone: "Yard C", code: "C04", state: "available" },
	// Gate
	{ name: "Gate / Lane 1", zone: "Gate", code: "Lane 1", state: "occupied" },
	{ name: "Gate / Lane 2", zone: "Gate", code: "Lane 2", state: "available" },
];

const slotStyle: Record<SlotState, string> = {
	occupied: "bg-orange/15 ring-orange/25",
	reserved: "bg-amber/20 ring-amber/30",
	hold: "bg-coral/15 ring-coral/25",
	available: "bg-sand ring-line",
};

const slotLabel: Record<SlotState, string> = {
	occupied: "Occupied",
	reserved: "Reserved",
	hold: "Hold",
	available: "Available",
};

export default function GateDashboardRoute() {
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

	return (
		<AppShell title="Ground Map" eyebrow="Yard · Warehouse · Gate">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Abuja Flagship Facility · Live overview
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						A secure control tower over a moving terminal.
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Bonded terminal overview · 09 Sep 2026 · Operational state is simulated
						locally.
					</p>
				</div>
				<Button
					className="bg-orange text-white hover:bg-orange-deep"
					onClick={() => toast.success("Operations report exported locally.")}
				>
					Export report
				</Button>
			</div>

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

			<section className="rounded-xl bg-paper p-4 ring-1 ring-line">
				<div className="mb-4 flex items-center justify-between gap-3">
					<h3 className="font-display text-sm font-bold tracking-tight text-ink">
						Yard & warehouse footprint
					</h3>
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
						Yard A · B · C · Bond WH · Gate
					</span>
				</div>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{slots.map((slot) => (
						<button
							key={slot.name}
							type="button"
							onClick={() => setSelectedSlot(slot)}
							className={`min-h-20 rounded-md p-3 text-left text-xs ring-1 transition-transform hover:-translate-y-0.5 ${slotStyle[slot.state]}`}
						>
							<span className="font-mono text-[10px] text-ink-soft">{slot.zone}</span>
							<span className="mt-2 block font-semibold text-ink">{slot.code}</span>
						</button>
					))}
				</div>

				<div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
					<Legend color="bg-orange/70" label="Occupied" />
					<Legend color="bg-amber/70" label="Reserved" />
					<Legend color="bg-coral/70" label="Hold" />
					<Legend color="bg-sand ring-line" label="Available" />
				</div>
			</section>

			{selectedSlot && (
				<SlotDialog slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
			)}
		</AppShell>
	);
}

function Legend({ color, label }: { color: string; label: string }) {
	return (
		<span className="flex items-center gap-1.5">
			<span className={`size-2 rounded-[2px] ring-1 ${color}`} />
			{label}
		</span>
	);
}

function SlotDialog({ slot, onClose }: { slot: Slot; onClose: () => void }) {
	const isOccupied = slot.state === "occupied";
	const isHold = slot.state === "hold";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 px-4"
			onMouseDown={(event) => event.currentTarget === event.target && onClose()}
		>
			<div className="w-full max-w-sm rounded-xl bg-paper p-5 shadow-2xl ring-1 ring-line">
				<div className="flex items-center justify-between">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">
							Position selected
						</p>
						<h2 className="mt-1 font-display text-xl font-bold text-ink">{slot.name}</h2>
					</div>
					<Button
						variant="ghost"
						size="icon"
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
							tone={
								isOccupied
									? "success"
									: isHold
									? "critical"
									: slot.state === "reserved"
									? "warning"
									: "neutral"
							}
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