import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	ArrowRightLeft,
	ClipboardCheck,
	GitBranch,
	Layers,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StateRow {
	id: string;
	code: string;
	internalLabel: string;
	customerLabel: string;
	terminal: boolean;
}

interface TransitionRule {
	id: string;
	from: string;
	to: string;
	requiresHoldClear: boolean;
	requiresDocs: boolean;
	requiresFinancialClearance: boolean;
	notifies: boolean;
}

interface LifecycleBehaviour {
	autoNotifyOnTransition: boolean;
	allowBulkTransitions: boolean;
	splitMergePreservesLineage: boolean;
	pauseStorageOnHold: boolean;
	trackContainerLevel: boolean;
	trackPackageLevel: boolean;
}

interface CargoConfig {
	states: StateRow[];
	transitions: TransitionRule[];
	behaviour: LifecycleBehaviour;
}

const initialState: StateRow[] = [
	{ id: "s-1", code: "EXPECTED", internalLabel: "Expected", customerLabel: "Expected", terminal: false },
	{ id: "s-2", code: "IN_TRANSIT_TO_TERMINAL", internalLabel: "In transit to terminal", customerLabel: "In transit to terminal", terminal: false },
	{ id: "s-3", code: "ARRIVED_AT_GATE", internalLabel: "Arrived at gate", customerLabel: "Arrived at terminal", terminal: false },
	{ id: "s-4", code: "RECEIVED", internalLabel: "Received", customerLabel: "Received", terminal: false },
	{ id: "s-5", code: "STORED", internalLabel: "Stored", customerLabel: "In storage", terminal: false },
	{ id: "s-6", code: "DOCS_IN_PROGRESS", internalLabel: "Documentation in progress", customerLabel: "Documentation in progress", terminal: false },
	{ id: "s-7", code: "EXAMINATION_SCHEDULED", internalLabel: "Examination scheduled", customerLabel: "Examination scheduled", terminal: false },
	{ id: "s-8", code: "UNDER_EXAMINATION", internalLabel: "Under examination", customerLabel: "Under examination", terminal: false },
	{ id: "s-9", code: "EXAMINATION_COMPLETE", internalLabel: "Examination complete", customerLabel: "Examination complete", terminal: false },
	{ id: "s-10", code: "HELD", internalLabel: "Held", customerLabel: "On hold — contact operations", terminal: false },
	{ id: "s-11", code: "CHARGES_PENDING", internalLabel: "Charges pending", customerLabel: "Charges pending", terminal: false },
	{ id: "s-12", code: "CHARGES_SETTLED", internalLabel: "Charges settled", customerLabel: "Charges settled", terminal: false },
	{ id: "s-13", code: "RELEASE_AUTHORISED", internalLabel: "Release authorised", customerLabel: "Released for collection", terminal: false },
	{ id: "s-14", code: "SLOT_BOOKED", internalLabel: "Slot booked", customerLabel: "Collection booked", terminal: false },
	{ id: "s-15", code: "LOADING", internalLabel: "Loading", customerLabel: "Loading", terminal: false },
	{ id: "s-16", code: "GATE_OUT", internalLabel: "Gate out", customerLabel: "Collected", terminal: true },
	{ id: "s-17", code: "CLOSED", internalLabel: "Closed", customerLabel: "Closed", terminal: true },
	{ id: "s-18", code: "OVERSTAYED", internalLabel: "Overstayed", customerLabel: "Overstayed — action required", terminal: false },
	{ id: "s-19", code: "TRANSFERRED_OUT", internalLabel: "Transferred out", customerLabel: "Transferred", terminal: true },
	{ id: "s-20", code: "RETURNED_RE_EXPORTED", internalLabel: "Returned / Re-exported", customerLabel: "Returned / Re-exported", terminal: true },
];

const initialTransitions: TransitionRule[] = [
	{ id: "t-1", from: "EXPECTED", to: "IN_TRANSIT_TO_TERMINAL", requiresHoldClear: false, requiresDocs: false, requiresFinancialClearance: false, notifies: true },
	{ id: "t-2", from: "IN_TRANSIT_TO_TERMINAL", to: "ARRIVED_AT_GATE", requiresHoldClear: false, requiresDocs: false, requiresFinancialClearance: false, notifies: true },
	{ id: "t-3", from: "ARRIVED_AT_GATE", to: "RECEIVED", requiresHoldClear: false, requiresDocs: false, requiresFinancialClearance: false, notifies: true },
	{ id: "t-4", from: "RECEIVED", to: "STORED", requiresHoldClear: false, requiresDocs: false, requiresFinancialClearance: false, notifies: true },
	{ id: "t-5", from: "STORED", to: "DOCS_IN_PROGRESS", requiresHoldClear: false, requiresDocs: true, requiresFinancialClearance: false, notifies: true },
	{ id: "t-6", from: "DOCS_IN_PROGRESS", to: "EXAMINATION_SCHEDULED", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: false, notifies: true },
	{ id: "t-7", from: "EXAMINATION_SCHEDULED", to: "UNDER_EXAMINATION", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: false, notifies: true },
	{ id: "t-8", from: "UNDER_EXAMINATION", to: "EXAMINATION_COMPLETE", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: false, notifies: true },
	{ id: "t-9", from: "EXAMINATION_COMPLETE", to: "CHARGES_PENDING", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: false, notifies: true },
	{ id: "t-10", from: "CHARGES_PENDING", to: "CHARGES_SETTLED", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: true, notifies: true },
	{ id: "t-11", from: "CHARGES_SETTLED", to: "RELEASE_AUTHORISED", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: true, notifies: true },
	{ id: "t-12", from: "RELEASE_AUTHORISED", to: "SLOT_BOOKED", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: true, notifies: true },
	{ id: "t-13", from: "SLOT_BOOKED", to: "LOADING", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: true, notifies: false },
	{ id: "t-14", from: "LOADING", to: "GATE_OUT", requiresHoldClear: true, requiresDocs: true, requiresFinancialClearance: true, notifies: true },
	{ id: "t-15", from: "GATE_OUT", to: "CLOSED", requiresHoldClear: false, requiresDocs: false, requiresFinancialClearance: false, notifies: false },
];

const initialBehaviour: LifecycleBehaviour = {
	autoNotifyOnTransition: true,
	allowBulkTransitions: true,
	splitMergePreservesLineage: true,
	pauseStorageOnHold: false,
	trackContainerLevel: true,
	trackPackageLevel: true,
};

const initialConfig: CargoConfig = {
	states: initialState,
	transitions: initialTransitions,
	behaviour: initialBehaviour,
};

export default function AdminCargoConfigurationPage() {
	const [config, setConfig] = useState<CargoConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const updateState = (id: string, patch: Partial<StateRow>) => {
		setConfig((prev) => ({
			...prev,
			states: prev.states.map((s) => (s.id === id ? { ...s, ...patch } : s)),
		}));
		markDirty();
	};

	const addState = () => {
		setConfig((prev) => ({
			...prev,
			states: [
				...prev.states,
				{
					id: `s-${Date.now()}`,
					code: "",
					internalLabel: "",
					customerLabel: "",
					terminal: false,
				},
			],
		}));
		markDirty();
	};

	const removeState = (id: string) => {
		setConfig((prev) => ({
			...prev,
			states: prev.states.filter((s) => s.id !== id),
		}));
		markDirty();
	};

	const updateTransition = (id: string, patch: Partial<TransitionRule>) => {
		setConfig((prev) => ({
			...prev,
			transitions: prev.transitions.map((t) =>
				t.id === id ? { ...t, ...patch } : t
			),
		}));
		markDirty();
	};

	const addTransition = () => {
		setConfig((prev) => ({
			...prev,
			transitions: [
				...prev.transitions,
				{
					id: `t-${Date.now()}`,
					from: prev.states[0]?.code ?? "",
					to: prev.states[1]?.code ?? "",
					requiresHoldClear: false,
					requiresDocs: false,
					requiresFinancialClearance: false,
					notifies: true,
				},
			],
		}));
		markDirty();
	};

	const removeTransition = (id: string) => {
		setConfig((prev) => ({
			...prev,
			transitions: prev.transitions.filter((t) => t.id !== id),
		}));
		markDirty();
	};

	const updateBehaviour = <K extends keyof LifecycleBehaviour>(
		key: K,
		value: LifecycleBehaviour[K]
	) => {
		setConfig((prev) => ({
			...prev,
			behaviour: { ...prev.behaviour, [key]: value },
		}));
		markDirty();
	};

	const handleSave = () => {
		const invalid = config.states.find((s) => !s.code.trim() || !s.internalLabel.trim());
		if (invalid) {
			toast.error("Every state needs a code and internal label.");
			return;
		}
		const badTransition = config.transitions.find((t) => !t.from || !t.to);
		if (badTransition) {
			toast.error("Every transition needs a from and to state.");
			return;
		}
		toast.success("Cargo lifecycle configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Cargo & Lifecycle"
			eyebrow="Administration · Configuration"
		>
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="min-w-0">
					<Link
						to="/admin/configuration"
						className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-orange"
					>
						<ArrowLeft className="size-3.5" />
						Back to configuration
					</Link>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Cargo &amp; Lifecycle
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure cargo states, customer-facing labels, permitted
						transitions, and lifecycle behaviour. Illegal transitions are
						rejected server-side. Every state change is written as an immutable
						event.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{dirty && <StatusBadge label="Unsaved changes" tone="warning" />}
					<Button
						type="button"
						variant="outline"
						onClick={handleDiscard}
						disabled={!dirty}
						className="border-line bg-paper text-ink hover:bg-sand disabled:opacity-60"
					>
						Discard
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={!dirty}
						className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
					>
						<Save className="size-4" />
						Save changes
					</Button>
				</div>
			</div>

			<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
						<ShieldCheck className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-ink">
							Event-sourced lifecycle
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							States are configuration; transitions are rules; every change is
							an immutable event. The platform records but never makes a
							Customs decision. Deactivating a state preserves existing records
							that already reference it.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Cargo States
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Internal codes map to customer-facing labels. Terminal states mark
							the end of the lifecycle.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addState}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add state
					</Button>
				</div>

				{config.states.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No states configured.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[860px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Code</th>
									<th className="px-4 py-3 font-medium">Internal label</th>
									<th className="px-4 py-3 font-medium">Customer label</th>
									<th className="px-4 py-3 font-medium">Terminal</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{config.states.map((s) => (
									<tr key={s.id} className="hover:bg-sand/40">
										<td className="px-4 py-3">
											<Input
												value={s.code}
												onChange={(e) =>
													updateState(s.id, { code: e.target.value })
												}
												className="h-9 border-line bg-paper font-mono text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3">
											<Input
												value={s.internalLabel}
												onChange={(e) =>
													updateState(s.id, {
														internalLabel: e.target.value,
													})
												}
												className="h-9 border-line bg-paper text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3">
											<Input
												value={s.customerLabel}
												onChange={(e) =>
													updateState(s.id, {
														customerLabel: e.target.value,
													})
												}
												className="h-9 border-line bg-paper text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3">
											<label className="inline-flex items-center gap-2 text-[12px] text-ink">
												<input
													type="checkbox"
													checked={s.terminal}
													onChange={(e) =>
														updateState(s.id, {
															terminal: e.target.checked,
														})
													}
													className="size-4 accent-orange"
												/>
												Terminal
											</label>
										</td>
										<td className="px-4 py-3 text-right">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeState(s.id)}
												className="text-carmine hover:bg-carmine/10"
											>
												<Trash2 className="size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Permitted Transitions
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Only transitions defined here are allowed. Requirements block
							completion until satisfied; overrides require supervisor reason
							and are logged.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addTransition}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add transition
					</Button>
				</div>

				{config.transitions.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No transitions configured.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[920px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">From</th>
									<th className="px-4 py-3 font-medium">To</th>
									<th className="px-4 py-3 font-medium">Hold clear</th>
									<th className="px-4 py-3 font-medium">Docs required</th>
									<th className="px-4 py-3 font-medium">Financial clear</th>
									<th className="px-4 py-3 font-medium">Notifies</th>
									<th className="px-4 py-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{config.transitions.map((t) => (
									<tr key={t.id} className="hover:bg-sand/40">
										<td className="px-4 py-3">
											<select
												value={t.from}
												onChange={(e) =>
													updateTransition(t.id, { from: e.target.value })
												}
												className="h-9 w-full rounded-md border border-line bg-paper px-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												{config.states.map((s) => (
													<option key={s.id} value={s.code}>
														{s.code}
													</option>
												))}
											</select>
										</td>
										<td className="px-4 py-3">
											<select
												value={t.to}
												onChange={(e) =>
													updateTransition(t.id, { to: e.target.value })
												}
												className="h-9 w-full rounded-md border border-line bg-paper px-2 font-mono text-xs text-ink outline-none focus:ring-2 focus:ring-orange/25"
											>
												{config.states.map((s) => (
													<option key={s.id} value={s.code}>
														{s.code}
													</option>
												))}
											</select>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={t.requiresHoldClear}
												onChange={(e) =>
													updateTransition(t.id, {
														requiresHoldClear: e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={t.requiresDocs}
												onChange={(e) =>
													updateTransition(t.id, {
														requiresDocs: e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={t.requiresFinancialClearance}
												onChange={(e) =>
													updateTransition(t.id, {
														requiresFinancialClearance:
															e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={t.notifies}
												onChange={(e) =>
													updateTransition(t.id, {
														notifies: e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-right">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeTransition(t.id)}
												className="text-carmine hover:bg-carmine/10"
											>
												<Trash2 className="size-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Lifecycle Behaviour
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Controls that apply across the lifecycle regardless of individual
						transition rules.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<BehaviourRow
						icon={ArrowRightLeft}
						label="Auto-notify on every transition"
						desc="Dispatch notifications on each state change unless suppressed per transition."
						on={config.behaviour.autoNotifyOnTransition}
						onToggle={() =>
							updateBehaviour(
								"autoNotifyOnTransition",
								!config.behaviour.autoNotifyOnTransition
							)
						}
					/>
					<BehaviourRow
						icon={Layers}
						label="Allow bulk transitions"
						desc="Permit multi-unit transitions with per-unit exception reporting."
						on={config.behaviour.allowBulkTransitions}
						onToggle={() =>
							updateBehaviour(
								"allowBulkTransitions",
								!config.behaviour.allowBulkTransitions
							)
						}
					/>
					<BehaviourRow
						icon={GitBranch}
						label="Split/merge preserves lineage"
						desc="Retain parent-child relationship on consignment split or merge."
						on={config.behaviour.splitMergePreservesLineage}
						onToggle={() =>
							updateBehaviour(
								"splitMergePreservesLineage",
								!config.behaviour.splitMergePreservesLineage
							)
						}
					/>
					<BehaviourRow
						icon={ClipboardCheck}
						label="Pause storage clock on hold"
						desc="Suspend storage accrual while cargo is under an authorised hold."
						on={config.behaviour.pauseStorageOnHold}
						onToggle={() =>
							updateBehaviour(
								"pauseStorageOnHold",
								!config.behaviour.pauseStorageOnHold
							)
						}
					/>
					<BehaviourRow
						icon={Layers}
						label="Track at container level"
						desc="Track status and location per container unit."
						on={config.behaviour.trackContainerLevel}
						onToggle={() =>
							updateBehaviour(
								"trackContainerLevel",
								!config.behaviour.trackContainerLevel
							)
						}
					/>
					<BehaviourRow
						icon={Layers}
						label="Track at package level"
						desc="Track status and location per package within a consignment."
						on={config.behaviour.trackPackageLevel}
						onToggle={() =>
							updateBehaviour(
								"trackPackageLevel",
								!config.behaviour.trackPackageLevel
							)
						}
					/>
				</ul>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Terminal facilitates. Customs decides.
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							States like <span className="font-mono">UNDER_EXAMINATION</span> and{" "}
							<span className="font-mono">RELEASE_AUTHORISED</span> record what
							the terminal has done or received — never a Customs decision.
							Release authorisation is recorded only after the competent
							authority reference is captured, and is independently verifiable
							at gate.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function BehaviourRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof ArrowRight;
	label: string;
	desc: string;
	on: boolean;
	onToggle: () => void;
}) {
	return (
		<li className="flex flex-wrap items-start justify-between gap-4 p-5">
			<div className="flex min-w-[240px] flex-1 items-start gap-3">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0">
					<p className="text-[13px] font-semibold text-ink">{label}</p>
					<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{desc}</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={on}
				className={cn(
					"inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
					on ? "bg-orange" : "bg-sand-2"
				)}
			>
				<span
					className={cn(
						"size-5 rounded-full bg-white shadow-sm transition-transform",
						on ? "translate-x-5" : "translate-x-0.5"
					)}
				/>
			</button>
		</li>
	);
}