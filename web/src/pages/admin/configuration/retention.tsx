import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Archive,
	Clock,
	Database,
	FileText,
	Save,
	ShieldCheck,
	Trash2,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RetentionRule {
	id: string;
	key: string;
	label: string;
	desc: string;
	retentionMonths: number;
	legalHoldApplies: boolean;
	autoPurge: boolean;
}

interface RetentionConfig {
	legalHoldEnabled: boolean;
	dryRunRequired: boolean;
	notifyBeforePurgeDays: number;
	lastDryRunAt: string;
	lastPurgeAt: string;
	rules: RetentionRule[];
}

const initialConfig: RetentionConfig = {
	legalHoldEnabled: true,
	dryRunRequired: true,
	notifyBeforePurgeDays: 30,
	lastDryRunAt: "",
	lastPurgeAt: "",
	rules: [
		{
			id: "r-1",
			key: "operational_events",
			label: "Operational events",
			desc: "Cargo lifecycle events, movements, holds, and gate records.",
			retentionMonths: 84,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-2",
			key: "issued_documents",
			label: "Issued documents",
			desc: "Terminal-issued documents, receipts, releases, and gate passes.",
			retentionMonths: 84,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-3",
			key: "uploaded_documents",
			label: "Uploaded documents",
			desc: "Customer and agent uploads retained for verification and dispute resolution.",
			retentionMonths: 60,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-4",
			key: "audit_log",
			label: "Audit log",
			desc: "Tamper-evident audit entries. Retention set to exceed operational records.",
			retentionMonths: 120,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-5",
			key: "financial_records",
			label: "Financial records",
			desc: "Invoices, payments, receipts, credit notes, and reconciliation records.",
			retentionMonths: 84,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-6",
			key: "personal_data",
			label: "Personal data",
			desc: "Driver, contact, and account-holder data retained after last activity before anonymisation review.",
			retentionMonths: 36,
			legalHoldApplies: true,
			autoPurge: false,
		},
		{
			id: "r-7",
			key: "notifications_log",
			label: "Notification log",
			desc: "Delivery and read records for dispatched notifications.",
			retentionMonths: 24,
			legalHoldApplies: false,
			autoPurge: true,
		},
		{
			id: "r-8",
			key: "integration_logs",
			label: "Integration logs",
			desc: "Correlated request and response logs across adapters and dead-letter queue.",
			retentionMonths: 12,
			legalHoldApplies: false,
			autoPurge: true,
		},
	],
};

export default function AdminRetentionConfigurationPage() {
	const [config, setConfig] = useState<RetentionConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof RetentionConfig>(
		key: K,
		value: RetentionConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const updateRule = (id: string, patch: Partial<RetentionRule>) => {
		setConfig((prev) => ({
			...prev,
			rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
		}));
		markDirty();
	};

	const handleSave = () => {
		const badRule = config.rules.find((r) => r.retentionMonths < 1);
		if (badRule) {
			toast.error("Every rule must have a retention period of at least 1 month.");
			return;
		}
		if (config.notifyBeforePurgeDays < 0) {
			toast.error("Notify-before-purge days cannot be negative.");
			return;
		}
		toast.success("Retention configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	const handleDryRun = () => {
		toast.success(
			"Dry-run preview generated. Nothing has been deleted. Review the preview before scheduling a purge."
		);
	};

	return (
		<AppShell
			title="Retention & Purge"
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
						Retention &amp; Purge
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure technical retention, purge scheduling, and dry-run
						preview. Legal holds override purge. Every purge is logged and
						reviewed before execution.
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
							Legal hold overrides purge
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Records under legal, regulatory, or dispute hold are excluded from
							purge regardless of retention period. Purges run only after a dry
							run is reviewed. Personal data is anonymised where possible rather
							than deleted outright.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Purge Controls
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Cross-cutting behaviour applied to every retention rule.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Legal hold enabled"
						desc="Prevent purge of records under legal or regulatory hold."
						on={config.legalHoldEnabled}
						onToggle={() =>
							update("legalHoldEnabled", !config.legalHoldEnabled)
						}
					/>
					<RuleRow
						icon={Database}
						label="Require dry-run before purge"
						desc="Every purge must be preceded by a reviewed dry-run preview."
						on={config.dryRunRequired}
						onToggle={() =>
							update("dryRunRequired", !config.dryRunRequired)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Clock className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Notify before purge
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Days before purge when the admin team is notified for review.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.notifyBeforePurgeDays)}
								onChange={(e) =>
									update(
										"notifyBeforePurgeDays",
										Number(e.target.value) || 0
									)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">days</span>
						</div>
					</div>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Retention Rules
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Per-record-type retention. Auto-purge is off by default; enable only
						for non-operational logs.
					</p>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[900px] text-left text-sm">
						<thead>
							<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<th className="px-4 py-3 font-medium">Record type</th>
								<th className="px-4 py-3 font-medium">Retention</th>
								<th className="px-4 py-3 font-medium text-center">
									Legal hold
								</th>
								<th className="px-4 py-3 font-medium text-center">
									Auto-purge
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{config.rules.map((r) => (
								<tr key={r.id} className="hover:bg-sand/40">
									<td className="px-4 py-4 align-top">
										<p className="text-[13px] font-semibold text-ink">
											{r.label}
										</p>
										<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
											{r.desc}
										</p>
										<p className="mt-1 font-mono text-[10px] text-ink-soft">
											{r.key}
										</p>
									</td>
									<td className="px-4 py-4 align-top">
										<div className="flex items-center gap-2">
											<Input
												value={String(r.retentionMonths)}
												onChange={(e) =>
													updateRule(r.id, {
														retentionMonths:
															Number(e.target.value) || 0,
													})
												}
												className="h-9 w-24 border-line bg-paper font-mono text-xs text-ink"
											/>
											<span className="font-mono text-[11px] text-ink-soft">
												months
											</span>
										</div>
									</td>
									<td className="px-4 py-4 text-center align-top">
										<input
											type="checkbox"
											checked={r.legalHoldApplies}
											onChange={(e) =>
												updateRule(r.id, {
													legalHoldApplies: e.target.checked,
												})
											}
											className="size-4 accent-orange"
										/>
									</td>
									<td className="px-4 py-4 text-center align-top">
										<input
											type="checkbox"
											checked={r.autoPurge}
											onChange={(e) =>
												updateRule(r.id, {
													autoPurge: e.target.checked,
												})
											}
											className="size-4 accent-orange"
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Dry-Run Preview
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Preview what a purge would remove. Nothing is deleted during a
						dry-run.
					</p>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-4 p-5">
					<div className="min-w-[240px] flex-1">
						<p className="text-[12px] text-ink-soft">
							Last dry-run:{" "}
							<span className="font-mono text-ink">
								{config.lastDryRunAt || "Never"}
							</span>
						</p>
						<p className="mt-1 text-[12px] text-ink-soft">
							Last purge:{" "}
							<span className="font-mono text-ink">
								{config.lastPurgeAt || "Never"}
							</span>
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={handleDryRun}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Archive className="size-4" />
						Run dry-run preview
					</Button>
				</div>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Retention changes apply prospectively
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Adjusting a retention period does not retroactively delete or
							extend records already past their previous retention horizon.
							Legal holds override every rule. Every retention change and purge
							run is logged with actor, scope, and outcome, and can be exported
							for audit.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function RuleRow({
	icon: Icon,
	label,
	desc,
	on,
	onToggle,
}: {
	icon: typeof ShieldCheck;
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