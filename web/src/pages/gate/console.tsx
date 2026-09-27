import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Camera,
	Check,
	ChevronLeft,
	ClipboardCheck,
	Clock3,
	Container,
	LogOut,
	MapPin,
	QrCode,
	ScanLine,
	ShieldAlert,
	ShieldCheck,
	Truck,
	User,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge, statusTone } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GateDirection = "in" | "out";
type GateDecision = "ADMIT" | "REFER" | "REJECT";

interface QueuedTruck {
	id: string;
	plate: string;
	driver: string;
	driverPhone: string;
	company: string;
	appointmentRef: string;
	slotTime: string;
	container: string;
	containerRef: string;
	consignment: string;
	purpose: "Collection" | "Delivery" | "Empty return" | "Transfer";
	readiness: "Ready" | "Needs verification" | "Not ready";
	notes: string;
}

const initialInQueue: QueuedTruck[] = [
	{
		id: "q-1",
		plate: "KJA-882-XD",
		driver: "Babatunde Alao",
		driverPhone: "+234 803 112 3456",
		company: "Apex Haulage Fleet",
		appointmentRef: "TRN-BKG-9021",
		slotTime: "10:00 – 11:00",
		container: "TRIU1234564",
		containerRef: "c-1",
		consignment: "TRN-IMP-002481",
		purpose: "Collection",
		readiness: "Ready",
		notes: "All obligations satisfied. Ready for gate-in.",
	},
	{
		id: "q-2",
		plate: "LSR-441-YY",
		driver: "Emeka Okoro",
		driverPhone: "+234 802 987 6543",
		company: "Direct Consignee Logistics",
		appointmentRef: "TRN-BKG-9022",
		slotTime: "10:30 – 11:30",
		container: "MSCU9876540",
		containerRef: "c-2",
		consignment: "TRN-IMP-002482",
		purpose: "Collection",
		readiness: "Needs verification",
		notes: "Driver licence expiry to be confirmed against booking.",
	},
	{
		id: "q-3",
		plate: "KAN-302-XY",
		driver: "M. Yusuf",
		driverPhone: "+234 803 445 2200",
		company: "Kano Line Haulers",
		appointmentRef: "TRN-BKG-9023",
		slotTime: "11:00 – 12:00",
		container: "TEMU3849204",
		containerRef: "c-4",
		consignment: "TRN-EXP-002532",
		purpose: "Delivery",
		readiness: "Not ready",
		notes: "Awaiting documentation review to complete.",
	},
];

const initialOutQueue: QueuedTruck[] = [
	{
		id: "oq-1",
		plate: "ABJ-220-ZZ",
		driver: "Suleiman Bello",
		driverPhone: "+234 814 332 1199",
		company: "Coastal Freight Nigeria",
		appointmentRef: "TRN-BKG-9018",
		slotTime: "09:30 – 10:30",
		container: "HLCU1122338",
		containerRef: "c-6",
		consignment: "TRN-IMP-002484",
		purpose: "Collection",
		readiness: "Ready",
		notes: "Loading complete. Ready for gate-out.",
	},
	{
		id: "oq-2",
		plate: "KTN-773-AA",
		driver: "Yakubu Garba",
		driverPhone: "+234 805 441 2288",
		company: "Prime Haulage Ltd",
		appointmentRef: "TRN-BKG-9017",
		slotTime: "09:00 – 10:00",
		container: "OOLU2948108",
		containerRef: "c-5",
		consignment: "TRN-IMP-002485",
		purpose: "Delivery",
		readiness: "Ready",
		notes: "Empty container returning after delivery.",
	},
];

type Mode = "queue" | "decision";

export function GateInPage() {
	return <GateConsole direction="in" />;
}

export function GateOutPage() {
	return <GateConsole direction="out" />;
}

function GateConsole({ direction }: { direction: GateDirection }) {
	const [queue, setQueue] = useState<QueuedTruck[]>(
		direction === "in" ? initialInQueue : initialOutQueue
	);
	const [mode, setMode] = useState<Mode>("queue");
	const [active, setActive] = useState<QueuedTruck | null>(null);
	const [plateInput, setPlateInput] = useState("");
	const [rejectReason, setRejectReason] = useState("");
	const [referReason, setReferReason] = useState("");
	const [overrideReason, setOverrideReason] = useState("");

	const isGateIn = direction === "in";

	const total = queue.length;
	const readyCount = queue.filter((q) => q.readiness === "Ready").length;
	const needsVerification = queue.filter((q) => q.readiness === "Needs verification").length;
	const notReady = queue.filter((q) => q.readiness === "Not ready").length;

	const handlePlateSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const match = queue.find((q) => q.plate.toLowerCase() === plateInput.trim().toLowerCase());
		if (!match) {
			toast.error("No queued truck found with that plate.");
			return;
		}
		setActive(match);
		setMode("decision");
	};

	const handleDecision = (decision: GateDecision, reason?: string) => {
		if (!active) return;
		setQueue((prev) => prev.filter((q) => q.id !== active.id));
		toast.success(
			decision === "ADMIT"
				? `${active.plate} admitted at ${isGateIn ? "gate-in" : "gate-out"}.`
				: decision === "REFER"
				? `${active.plate} referred. Reason: ${reason || "not specified"}.`
				: `${active.plate} rejected. Reason: ${reason || "not specified"}.`
		);
		setActive(null);
		setMode("queue");
		setPlateInput("");
		setRejectReason("");
		setReferReason("");
		setOverrideReason("");
	};

	const handleCancel = () => {
		setActive(null);
		setMode("queue");
		setRejectReason("");
		setReferReason("");
		setOverrideReason("");
	};

	return (
		<AppShell
			title={isGateIn ? "Gate in console" : "Gate out console"}
			eyebrow={isGateIn ? "Gate control · Inbound" : "Gate control · Outbound"}
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						{isGateIn
							? "Gate control · Inbound queue"
							: "Gate control · Outbound queue"}
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						{isGateIn ? "Admit, refer, or reject trucks" : "Clear trucks for departure"}
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						{isGateIn
							? "Verify the booking, container, and readiness of each truck before admitting it into the terminal. Every decision is recorded with a timestamp and reason."
							: "Verify release status, loaded quantity, and seal before clearing a truck for departure. Every decision is recorded with a timestamp and reason."}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						to={isGateIn ? "/gate/out" : "/gate/in"}
						className="inline-flex"
					>
						<Button variant="outline" className="border-line bg-paper text-ink">
							<ChevronLeft className="mr-1.5 size-4" />
							Switch to {isGateIn ? "gate-out" : "gate-in"}
						</Button>
					</Link>
				</div>
			</div>

			{mode === "queue" && (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<GateStat
							label="In queue"
							value={String(total)}
							tone="info"
							detail={isGateIn ? "Awaiting admission" : "Awaiting departure"}
							icon={Truck}
						/>
						<GateStat
							label="Ready"
							value={String(readyCount)}
							tone="success"
							detail="Cleared to proceed"
							icon={Check}
						/>
						<GateStat
							label="Needs verification"
							value={String(needsVerification)}
							tone="warning"
							detail="Check before admit"
							icon={AlertTriangle}
						/>
						<GateStat
							label="Not ready"
							value={String(notReady)}
							tone="critical"
							detail="Do not admit"
							icon={ShieldAlert}
						/>
					</div>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex items-center gap-2">
							<div className="grid size-8 place-items-center rounded-md bg-orange/10 text-orange-deep">
								<ScanLine className="size-4" />
							</div>
							<div>
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
									Fast entry
								</p>
								<p className="mt-0.5 text-[13px] font-semibold text-ink">
									Enter plate number to pull up the booking
								</p>
							</div>
						</div>
						<form
							onSubmit={handlePlateSubmit}
							className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
						>
							<Input
								autoFocus
								value={plateInput}
								onChange={(e) => setPlateInput(e.target.value)}
								placeholder="e.g. KJA-882-XD"
								className="h-12 border-line bg-sand font-mono text-base uppercase text-ink"
							/>
							<Button
								type="submit"
								className="h-12 bg-orange px-5 text-white hover:bg-orange-deep"
							>
								<ScanLine className="mr-1.5 size-4" />
								Find truck
							</Button>
						</form>
						<p className="mt-3 text-[11px] leading-5 text-ink-soft">
							{isGateIn
								? "The gate-in console matches the plate against queued bookings. Manual lookup below is always available."
								: "The gate-out console matches the plate against trucks currently inside the terminal."}
						</p>
					</section>

					<section className="rounded-xl bg-paper ring-1 ring-line">
						<div className="flex items-center justify-between border-b border-line p-4">
							<div>
								<h3 className="font-display text-sm font-bold text-ink">
									{isGateIn ? "Inbound queue" : "Outbound queue"}
								</h3>
								<p className="text-[11px] text-ink-soft">
									{total} {total === 1 ? "truck" : "trucks"}
								</p>
							</div>
						</div>

						{queue.length === 0 ? (
							<div className="p-12 text-center">
								<Truck className="mx-auto size-7 text-ink-soft" />
								<p className="mt-3 font-medium text-ink">
									No trucks in the {isGateIn ? "inbound" : "outbound"} queue.
								</p>
								<p className="mt-1 text-[12px] text-ink-soft">
									New arrivals will appear here as they check in at the gate.
								</p>
							</div>
						) : (
							<ul className="divide-y divide-line">
								{queue.map((q) => (
									<li
										key={q.id}
										className="flex flex-wrap items-center gap-4 px-5 py-4"
									>
										<div className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange-deep">
											<Truck className="size-5" />
										</div>
										<div className="min-w-[220px] flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-mono text-[13px] font-semibold text-ink">
													{q.plate}
												</p>
												<StatusBadge
													label={q.readiness}
													tone={statusTone(q.readiness)}
												/>
											</div>
											<p className="mt-1 text-[12px] text-ink-soft">
												{q.driver} · {q.company}
											</p>
											<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												{q.appointmentRef} · {q.slotTime}
											</p>
										</div>

										<div className="min-w-[180px]">
											<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
												Container / consignment
											</p>
											<p className="mt-1 font-mono text-[12px] text-ink">
												{q.container}
											</p>
											<p className="mt-0.5 font-mono text-[11px] text-ink-soft">
												{q.consignment} · {q.purpose}
											</p>
										</div>

										<div className="ml-auto flex items-center gap-2">
											<Button
												variant="outline"
												className="border-line bg-paper text-ink"
												onClick={() => {
													setActive(q);
													setMode("decision");
												}}
											>
												Review
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</section>
				</>
			)}

			{mode === "decision" && active && (
				<DecisionPanel
					active={active}
					direction={direction}
					onBack={handleCancel}
					onDecision={handleDecision}
					rejectReason={rejectReason}
					setRejectReason={setRejectReason}
					referReason={referReason}
					setReferReason={setReferReason}
					overrideReason={overrideReason}
					setOverrideReason={setOverrideReason}
				/>
			)}
		</AppShell>
	);
}

function DecisionPanel({
	active,
	direction,
	onBack,
	onDecision,
	rejectReason,
	setRejectReason,
	referReason,
	setReferReason,
	overrideReason,
	setOverrideReason,
}: {
	active: QueuedTruck;
	direction: GateDirection;
	onBack: () => void;
	onDecision: (decision: GateDecision, reason?: string) => void;
	rejectReason: string;
	setRejectReason: (v: string) => void;
	referReason: string;
	setReferReason: (v: string) => void;
	overrideReason: string;
	setOverrideReason: (v: string) => void;
}) {
	const isGateIn = direction === "in";
	const isReady = active.readiness === "Ready";
	const needsVerification = active.readiness === "Needs verification";
	const notReady = active.readiness === "Not ready";

	const [intent, setIntent] = useState<GateDecision | null>(null);

	// Reset the intent when the active record changes
	useEffect(() => {
		setIntent(null);
	}, [active.id]);

	const requiresOverride =
		(intent === "ADMIT" && (needsVerification || notReady)) ||
		(intent === "REFER" && isReady);

	const canSubmit = useMemo(() => {
		if (!intent) return false;
		if (intent === "REJECT" && rejectReason.trim().length < 5) return false;
		if (intent === "REFER" && referReason.trim().length < 5) return false;
		if (requiresOverride && overrideReason.trim().length < 5) return false;
		return true;
	}, [intent, rejectReason, referReason, requiresOverride, overrideReason]);

	const submitDecision = () => {
		if (!intent || !canSubmit) return;
		const reason =
			intent === "REJECT"
				? rejectReason
				: intent === "REFER"
				? referReason
				: requiresOverride
				? overrideReason
				: undefined;
		onDecision(intent, reason);
	};

	return (
		<section className="rounded-xl bg-paper ring-1 ring-line">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-deep"
				>
					<ChevronLeft className="size-4" /> Back to queue
				</button>
				<div className="text-right">
					<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
						Decision
					</p>
					<p className="font-display text-sm font-bold text-ink">
						{isGateIn ? "Gate in" : "Gate out"} · {active.plate}
					</p>
				</div>
			</div>

			<div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_.8fr]">
				<div className="space-y-5">
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge label={active.readiness} tone={statusTone(active.readiness)} />
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{active.purpose}
						</span>
						<span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
							{active.appointmentRef}
						</span>
					</div>

					<dl className="grid gap-4 sm:grid-cols-2">
						{[
							["Plate", active.plate, true],
							["Driver", active.driver],
							["Phone", active.driverPhone, true],
							["Company", active.company],
							["Appointment", active.appointmentRef, true],
							["Slot window", active.slotTime, true],
							["Container", active.container, true],
							["Consignment", active.consignment, true],
							["Purpose", active.purpose],
							["Readiness", active.readiness],
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
								<p className="text-[13px] font-semibold text-ink">Notes</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">{active.notes}</p>
							</div>
						</div>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<VerificationCard
							icon={Container}
							label="Container"
							value={active.container}
							detail="Matches booking"
						/>
						<VerificationCard
							icon={MapPin}
							label="Consignment"
							value={active.consignment}
							detail={isGateIn ? "Ready for inbound" : "Cleared for departure"}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Choose decision
						</p>
						<div className="mt-3 grid gap-2">
							<DecisionButton
								label="ADMIT"
								detail={
									isGateIn
										? "Truck enters the terminal. Gate-in timestamp recorded."
										: "Truck departs. Gate-out timestamp recorded."
								}
								icon={Check}
								tone="success"
								active={intent === "ADMIT"}
								onClick={() => setIntent("ADMIT")}
							/>
							<DecisionButton
								label="REFER"
								detail="Truck parked; a supervisor or documentation desk is notified."
								icon={AlertTriangle}
								tone="warning"
								active={intent === "REFER"}
								onClick={() => setIntent("REFER")}
							/>
							<DecisionButton
								label="REJECT"
								detail="Truck turned away; driver is notified and the booking is flagged."
								icon={X}
								tone="critical"
								active={intent === "REJECT"}
								onClick={() => setIntent("REJECT")}
							/>
						</div>
					</div>

					{intent === "REJECT" && (
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Reason for rejection
							</span>
							<textarea
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="e.g. Booking reference does not match any queued appointment."
							/>
						</label>
					)}

					{intent === "REFER" && (
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Reason for referral
							</span>
							<textarea
								value={referReason}
								onChange={(e) => setReferReason(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="e.g. Driver licence expiry to be confirmed at the documentation desk."
							/>
						</label>
					)}

					{requiresOverride && (
						<div className="rounded-xl bg-orange/5 p-4 ring-1 ring-orange/20">
							<div className="flex items-start gap-3">
								<ShieldAlert className="mt-0.5 size-4 shrink-0 text-orange-deep" />
								<div className="w-full">
									<p className="text-[13px] font-semibold text-ink">
										Supervisor override required
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										This truck is marked {active.readiness.toLowerCase()}.
										{intent === "ADMIT"
											? " Admitting it requires a supervisor override with a reason."
											: " Referring a ready truck requires a reason."}
									</p>
									<textarea
										value={overrideReason}
										onChange={(e) => setOverrideReason(e.target.value)}
										className="mt-3 min-h-20 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
										placeholder="Reason for the override (recorded to the audit trail)."
									/>
								</div>
							</div>
						</div>
					)}

					<Button
						onClick={submitDecision}
						disabled={!canSubmit}
						className={cn(
							"h-11 w-full text-white",
							intent === "REJECT"
								? "bg-coral hover:bg-coral/90"
								: intent === "REFER"
								? "bg-orange hover:bg-orange-deep"
								: "bg-teal-deep hover:bg-teal-deep/90",
							!canSubmit && "opacity-50"
						)}
					>
						{intent === "REJECT"
							? "Reject truck"
							: intent === "REFER"
							? "Refer truck"
							: intent === "ADMIT"
							? isGateIn
								? "Admit truck"
								: "Clear truck"
							: "Select a decision"}
						<ArrowRight />
					</Button>

					<Button
						variant="outline"
						className="w-full border-line bg-paper text-ink"
						onClick={onBack}
					>
						Cancel
					</Button>
				</div>
			</div>
		</section>
	);
}

function DecisionButton({
	label,
	detail,
	icon: Icon,
	tone,
	active,
	onClick,
}: {
	label: string;
	detail: string;
	icon: typeof Check;
	tone: "success" | "warning" | "critical";
	active: boolean;
	onClick: () => void;
}) {
	const toneClasses: Record<typeof tone, string> = {
		success: active
			? "border-teal bg-teal/10 ring-1 ring-teal/30"
			: "border-line bg-sand hover:bg-sand-2",
		warning: active
			? "border-orange bg-orange/10 ring-1 ring-orange/30"
			: "border-line bg-sand hover:bg-sand-2",
		critical: active
			? "border-coral bg-coral/10 ring-1 ring-coral/30"
			: "border-line bg-sand hover:bg-sand-2",
	};
	const iconColor: Record<typeof tone, string> = {
		success: "text-teal-deep",
		warning: "text-orange-deep",
		critical: "text-coral",
	};
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
				toneClasses[tone]
			)}
		>
			<span
				className={cn(
					"grid size-9 shrink-0 place-items-center rounded-md bg-paper ring-1 ring-line",
					iconColor[tone]
				)}
			>
				<Icon className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="block font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-ink">
					{label}
				</span>
				<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">{detail}</span>
			</span>
		</button>
	);
}

function VerificationCard({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: typeof Container;
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-xl bg-sand p-3 ring-1 ring-line">
			<span className="grid size-9 shrink-0 place-items-center rounded-md bg-paper text-orange-deep ring-1 ring-line">
				<Icon className="size-4" />
			</span>
			<div className="min-w-0">
				<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
					{label}
				</p>
				<p className="mt-1 font-mono text-[12px] text-ink">{value}</p>
				<p className="mt-0.5 text-[11px] text-ink-soft">{detail}</p>
			</div>
		</div>
	);
}

function GateStat({
	label,
	value,
	tone,
	detail,
	icon: Icon,
}: {
	label: string;
	value: string;
	tone: string;
	detail: string;
	icon: typeof Truck;
}) {
	return (
		<div className="rounded-xl bg-paper p-4 ring-1 ring-line">
			<div className="flex items-center justify-between gap-2">
				<span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
					{label}
				</span>
				<Icon
					className={cn(
						"size-4",
						tone === "critical"
							? "text-coral"
							: tone === "warning"
							? "text-orange"
							: tone === "success"
							? "text-teal"
							: "text-ink-soft"
					)}
				/>
			</div>
			<div className="mt-2 font-display text-2xl font-bold text-ink">{value}</div>
			<div className="mt-1 text-[11px] text-ink-soft">{detail}</div>
		</div>
	);
}