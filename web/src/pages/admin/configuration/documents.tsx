import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	FileBadge,
	FileCheck2,
	FileCog,
	FileText,
	Hash,
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

interface DocumentType {
	id: string;
	key: string;
	label: string;
	required: boolean;
	hasExpiry: boolean;
	verificationRequired: boolean;
}

interface DocumentConfig {
	numberingPrefix: string;
	numberingFormat: string;
	nextSequence: number;
	qrVerificationEnabled: boolean;
	digitalSignatureEnabled: boolean;
	revocationEnabled: boolean;
	retentionMonths: number;
	requireUploadMalwareScan: boolean;
	allowPublicVerification: boolean;
	documentTypes: DocumentType[];
}

const initialConfig: DocumentConfig = {
	numberingPrefix: "TRN",
	numberingFormat: "TRN-{TYPE}-{YYYY}-{SEQ:6}",
	nextSequence: 1,
	qrVerificationEnabled: true,
	digitalSignatureEnabled: true,
	revocationEnabled: true,
	retentionMonths: 84,
	requireUploadMalwareScan: true,
	allowPublicVerification: true,
	documentTypes: [
		{
			id: "dt-1",
			key: "receipt_note",
			label: "Receipt Note",
			required: true,
			hasExpiry: false,
			verificationRequired: true,
		},
		{
			id: "dt-2",
			key: "release_authorisation",
			label: "Release Authorisation",
			required: true,
			hasExpiry: false,
			verificationRequired: true,
		},
		{
			id: "dt-3",
			key: "gate_pass",
			label: "Gate Pass",
			required: true,
			hasExpiry: true,
			verificationRequired: true,
		},
		{
			id: "dt-4",
			key: "storage_statement",
			label: "Storage Statement",
			required: false,
			hasExpiry: false,
			verificationRequired: false,
		},
		{
			id: "dt-5",
			key: "examination_report",
			label: "Examination Attendance Report",
			required: false,
			hasExpiry: false,
			verificationRequired: true,
		},
		{
			id: "dt-6",
			key: "delivery_order",
			label: "Delivery Order",
			required: true,
			hasExpiry: true,
			verificationRequired: true,
		},
	],
};

export default function AdminDocumentsConfigurationPage() {
	const [config, setConfig] = useState<DocumentConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const markDirty = () => setDirty(true);

	const update = <K extends keyof DocumentConfig>(
		key: K,
		value: DocumentConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		markDirty();
	};

	const updateType = (id: string, patch: Partial<DocumentType>) => {
		setConfig((prev) => ({
			...prev,
			documentTypes: prev.documentTypes.map((d) =>
				d.id === id ? { ...d, ...patch } : d
			),
		}));
		markDirty();
	};

	const addType = () => {
		setConfig((prev) => ({
			...prev,
			documentTypes: [
				...prev.documentTypes,
				{
					id: `dt-${Date.now()}`,
					key: "",
					label: "",
					required: false,
					hasExpiry: false,
					verificationRequired: false,
				},
			],
		}));
		markDirty();
	};

	const removeType = (id: string) => {
		setConfig((prev) => ({
			...prev,
			documentTypes: prev.documentTypes.filter((d) => d.id !== id),
		}));
		markDirty();
	};

	const handleSave = () => {
		if (!config.numberingPrefix.trim()) {
			toast.error("Numbering prefix is required.");
			return;
		}
		if (!config.numberingFormat.trim()) {
			toast.error("Numbering format is required.");
			return;
		}
		const invalid = config.documentTypes.find(
			(d) => !d.key.trim() || !d.label.trim()
		);
		if (invalid) {
			toast.error("Every document type needs a key and a label.");
			return;
		}
		toast.success("Document configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Documents"
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
						Documents
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Configure document types, numbering, verification settings, and
						retention. Every terminal-issued document is system-generated from
						controlled live data with a unique reference and verification code.
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
							Verification &amp; integrity
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Every issued document carries a unique reference, QR code, and
							short verification code. Public verification returns safe
							authenticity data only. Altered documents fail verification.
							Revocation immediately affects verification and gate checks.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Numbering
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Sequential reference format for all system-issued documents.
						Sequence values are never reused.
					</p>
				</div>
				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Numbering prefix"
						icon={Hash}
						value={config.numberingPrefix}
						onChange={(v) => update("numberingPrefix", v)}
						placeholder="e.g. TRN"
						mono
					/>
					<Field
						label="Next sequence"
						icon={Hash}
						value={String(config.nextSequence)}
						onChange={(v) => update("nextSequence", Number(v) || 0)}
						placeholder="e.g. 1"
						mono
					/>
					<Field
						label="Format template"
						icon={FileText}
						value={config.numberingFormat}
						onChange={(v) => update("numberingFormat", v)}
						placeholder="e.g. TRN-{TYPE}-{YYYY}-{SEQ:6}"
						mono
						full
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Verification &amp; Integrity
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Controls for how issued documents are authenticated and how
						revocation propagates to verification and gate.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={FileBadge}
						label="QR verification code on every issued document"
						desc="Embeds a public verification link resolvable without authentication."
						on={config.qrVerificationEnabled}
						onToggle={() =>
							update("qrVerificationEnabled", !config.qrVerificationEnabled)
						}
					/>
					<RuleRow
						icon={ShieldCheck}
						label="Digital signature and integrity hash"
						desc="Signs every issued document; altered documents fail verification."
						on={config.digitalSignatureEnabled}
						onToggle={() =>
							update(
								"digitalSignatureEnabled",
								!config.digitalSignatureEnabled
							)
						}
					/>
					<RuleRow
						icon={AlertTriangle}
						label="Revocation support"
						desc="Revoked documents fail verification and gate checks immediately."
						on={config.revocationEnabled}
						onToggle={() =>
							update("revocationEnabled", !config.revocationEnabled)
						}
					/>
					<RuleRow
						icon={FileCheck2}
						label="Allow public verification"
						desc="Permit unauthenticated authenticity lookups on issued documents."
						on={config.allowPublicVerification}
						onToggle={() =>
							update(
								"allowPublicVerification",
								!config.allowPublicVerification
							)
						}
					/>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Uploads &amp; Retention
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						How uploaded documents are handled and how long issued documents are
						retained.
					</p>
				</div>
				<ul className="divide-y divide-line">
					<RuleRow
						icon={ShieldCheck}
						label="Scan uploads for malware"
						desc="Quarantine suspicious uploads before they reach the document repository."
						on={config.requireUploadMalwareScan}
						onToggle={() =>
							update(
								"requireUploadMalwareScan",
								!config.requireUploadMalwareScan
							)
						}
					/>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5">
						<div className="flex min-w-[240px] flex-1 items-start gap-3">
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<FileText className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="text-[13px] font-semibold text-ink">
									Document retention
								</p>
								<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
									Months to retain issued documents before legal-hold review.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Input
								value={String(config.retentionMonths)}
								onChange={(e) =>
									update("retentionMonths", Number(e.target.value) || 0)
								}
								className="h-9 w-24 border-line bg-sand font-mono text-sm text-ink"
							/>
							<span className="font-mono text-[11px] text-ink-soft">
								months
							</span>
						</div>
					</div>
				</ul>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
					<div>
						<h3 className="font-display text-sm font-bold text-ink">
							Document Types
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Types issued or accepted by the terminal. Required types must be
							present before certain lifecycle transitions.
						</p>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addType}
						className="border-line bg-paper text-ink hover:bg-sand"
					>
						<Plus className="size-3.5" />
						Add type
					</Button>
				</div>

				{config.documentTypes.length === 0 ? (
					<div className="p-6 text-center text-sm text-ink-soft">
						No document types configured.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[900px] text-left text-sm">
							<thead>
								<tr className="border-b border-line bg-sand/40 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									<th className="px-4 py-3 font-medium">Key</th>
									<th className="px-4 py-3 font-medium">Label</th>
									<th className="px-4 py-3 font-medium text-center">
										Required
									</th>
									<th className="px-4 py-3 font-medium text-center">
										Expiry
									</th>
									<th className="px-4 py-3 font-medium text-center">
										Verification
									</th>
									<th className="px-4 py-3 font-medium text-right">
										Action
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-line">
								{config.documentTypes.map((d) => (
									<tr key={d.id} className="hover:bg-sand/40">
										<td className="px-4 py-3">
											<Input
												value={d.key}
												onChange={(e) =>
													updateType(d.id, { key: e.target.value })
												}
												className="h-9 border-line bg-paper font-mono text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3">
											<Input
												value={d.label}
												onChange={(e) =>
													updateType(d.id, { label: e.target.value })
												}
												className="h-9 border-line bg-paper text-xs text-ink"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={d.required}
												onChange={(e) =>
													updateType(d.id, {
														required: e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={d.hasExpiry}
												onChange={(e) =>
													updateType(d.id, {
														hasExpiry: e.target.checked,
													})
												}
												className="size-4 accent-orange"
											/>
										</td>
										<td className="px-4 py-3 text-center">
											<input
												type="checkbox"
												checked={d.verificationRequired}
												onChange={(e) =>
													updateType(d.id, {
														verificationRequired:
															e.target.checked,
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
												onClick={() => removeType(d.id)}
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

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Documents are generated from live data
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Terminal-issued documents are produced from controlled live
							records — never manually authored or edited. Each carries a unique
							reference, issue timestamp, issuing officer, and QR/short
							verification code. Verification returns safe authenticity data
							only; revocation takes effect on verification and at gate
							immediately.
						</p>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	icon: Icon,
	mono,
	full,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Hash;
	mono?: boolean;
	full?: boolean;
}) {
	return (
		<label className={cn("block", full && "sm:col-span-2")}>
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
			</span>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1.5 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
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