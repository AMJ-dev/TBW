import { useEffect, useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Boxes,
	Building2,
	Layers,
	Package,
	Plus,
	Save,
	ShieldCheck,
	Tag,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

interface LabelRow {
	id: string;
	label: string;
}

interface TerminalConfig {
	terminalName: string;
	terminalCode: string;
	operatingHours: string;
	holdReasons: LabelRow[];
	cargoCategories: LabelRow[];
	packagingTypes: LabelRow[];
	shipmentTypes: LabelRow[];
}

const emptyConfig: TerminalConfig = {
	terminalName: "",
	terminalCode: "",
	operatingHours: "",
	holdReasons: [],
	cargoCategories: [],
	packagingTypes: [],
	shipmentTypes: [],
};

const normaliseLabelRow = (raw: any): LabelRow => ({
	id: String(raw?.id ?? crypto.randomUUID()),
	label: raw?.label ?? raw?.name ?? "",
});

export default function AdminTerminalConfigurationPage() {
	const [config, setConfig] = useState<TerminalConfig>(emptyConfig);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [dirty, setDirty] = useState(false);
	const [changeReason, setChangeReason] = useState("");

	const fetchAll = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await http.get("/admin/config/terminal/");
			const resp: Resp = res.data;
			if (resp.error) {
				setError(resp.data || "Could not load terminal configuration.");
				return;
			}
			const payload: any = resp.code ?? {};
			const rawShipmentTypes: any[] = Array.isArray(payload.shipment_types)
				? payload.shipment_types
				: [];
			const rawHolds: any[] = Array.isArray(payload.hold_reasons)
				? payload.hold_reasons
				: Array.isArray(payload.holdReasons)
					? payload.holdReasons
					: [];
			const rawCategories: any[] = Array.isArray(
				payload.cargo_categories
			)
				? payload.cargo_categories
				: Array.isArray(payload.cargoCategories)
					? payload.cargoCategories
					: [];
			const rawPackaging: any[] = Array.isArray(
				payload.packaging_types
			)
				? payload.packaging_types
				: Array.isArray(payload.packagingTypes)
					? payload.packagingTypes
					: [];

			setConfig({
				terminalName:
					payload.terminal_name ?? payload.terminalName ?? "",
				terminalCode:
					payload.terminal_code ?? payload.terminalCode ?? "",
				operatingHours:
					payload.operating_hours ?? payload.operatingHours ?? "",
				holdReasons: rawHolds.map(normaliseLabelRow),
				cargoCategories: rawCategories.map(normaliseLabelRow),
				packagingTypes: rawPackaging.map(normaliseLabelRow),
				shipmentTypes: rawShipmentTypes.map(normaliseLabelRow),
			});
			setChangeReason("");
			setDirty(false);
		} catch (err: any) {
			setError(
				err?.response?.data?.message ||
					"Could not load terminal configuration."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void fetchAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const update = <K extends keyof TerminalConfig>(
		key: K,
		value: TerminalConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	};

	type ListKey =
		| "holdReasons"
		| "cargoCategories"
		| "shipmentTypes"
		| "packagingTypes";

	const addListRow = (key: ListKey, prefix: string) => {
		setConfig((prev) => ({
			...prev,
			[key]: [
				...prev[key],
				{ id: `${prefix}-${Date.now()}`, label: "" },
			],
		}));
		setDirty(true);
	};

	const updateListRow = (key: ListKey, id: string, label: string) => {
		setConfig((prev) => ({
			...prev,
			[key]: prev[key].map((row) =>
				row.id === id ? { ...row, label } : row
			),
		}));
		setDirty(true);
	};

	const removeListRow = (key: ListKey, id: string) => {
		setConfig((prev) => ({
			...prev,
			[key]: prev[key].filter((row) => row.id !== id),
		}));
		setDirty(true);
	};

	const checkList = (
		rows: LabelRow[],
		emptyMessage: string,
		duplicatePrefix: string
	): string | null => {
		const empty = rows.find((row) => !row.label.trim());
		if (empty) return emptyMessage;

		const labels = rows.map((row) => row.label.trim().toLowerCase());
		const duplicate = labels.find(
			(label, index) => labels.indexOf(label) !== index
		);
		if (duplicate) return `${duplicatePrefix}: "${duplicate}".`;

		return null;
	};

	const validate = () => {
		if (!config.terminalName.trim()) {
			toast.error("Terminal name is required.");
			return false;
		}
		if (!config.terminalCode.trim()) {
			toast.error("Terminal code is required.");
			return false;
		}

		const listChecks: [LabelRow[], string, string][] = [
			[
				config.shipmentTypes,
				"Every shipment type needs a name, or remove the empty row.",
				"Duplicate shipment type",
			],
			[
				config.holdReasons,
				"Every hold reason needs a label, or remove the empty row.",
				"Duplicate hold reason",
			],
			[
				config.cargoCategories,
				"Every cargo category needs a label, or remove the empty row.",
				"Duplicate cargo category",
			],
			[
				config.packagingTypes,
				"Every packaging type needs a label, or remove the empty row.",
				"Duplicate packaging type",
			],
		];

		for (const [rows, emptyMessage, duplicatePrefix] of listChecks) {
			const issue = checkList(rows, emptyMessage, duplicatePrefix);
			if (issue) {
				toast.error(issue);
				return false;
			}
		}

		return true;
	};

	const handleSave = async () => {
		if (!dirty || saving) return;
		if (!validate()) return;

		setSaving(true);
		try {
			const payload = {
				terminal_name: config.terminalName.trim(),
				terminal_code: config.terminalCode.trim(),
				operating_hours: config.operatingHours.trim(),
				shipment_types: config.shipmentTypes.map((row) => ({
					id: row.id,
					label: row.label.trim(),
				})),
				hold_reasons: config.holdReasons.map((row) => ({
					id: row.id,
					label: row.label.trim(),
				})),
				cargo_categories: config.cargoCategories.map((row) => ({
					id: row.id,
					label: row.label.trim(),
					is_active: true,
				})),
				packaging_types: config.packagingTypes.map((row) => ({
					id: row.id,
					label: row.label.trim(),
					is_active: true,
				})),
				change_reason: changeReason.trim(),
			};

			const res = await http.post(
				"/admin/config/terminal/update/",
				payload
			);
			const resp: Resp = res.data;
			if (resp.error) {
				toast.error(
					resp.data || "Could not save the terminal configuration."
				);
				return;
			}
			toast.success("Terminal configuration saved. Change logged.");
			await fetchAll();
		} catch (err: any) {
			toast.error(
				err?.response?.data?.message ||
					"Could not save the terminal configuration."
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDiscard = async () => {
		setChangeReason("");
		await fetchAll();
		toast.message("Changes discarded.");
	};

	if (loading) {
		return (
			<AppShell
				title="Terminal Operations"
				eyebrow="Administration · Configuration"
			>
				<div className="flex items-center justify-center rounded-2xl bg-paper p-10 ring-1 ring-line">
					<span className="size-6 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>
			</AppShell>
		);
	}

	if (error) {
		return (
			<AppShell
				title="Terminal Operations"
				eyebrow="Administration · Configuration"
			>
				<div className="rounded-2xl bg-paper p-6 ring-1 ring-line sm:p-8">
					<div className="flex items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-md bg-carmine text-white">
							<AlertTriangle className="size-5" />
						</div>
						<div>
							<p className="font-display text-base font-bold text-ink">
								Could not load terminal configuration
							</p>
							<p className="mt-1 text-sm leading-6 text-ink-soft">
								{error}
							</p>
						</div>
					</div>
					<div className="mt-5">
						<Button
							onClick={() => void fetchAll()}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							Try again
						</Button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell
			title="Terminal Operations"
			eyebrow="Administration · Configuration"
		>
			<div className="space-y-6 pb-8">
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
							Terminal Operations
						</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
							Configure terminal identity, operating hours, cargo
							categories, packaging types, and hold reasons. Changes apply to new operational
							events; historical records retain their original
							configuration.
						</p>
					</div>
					{dirty && (
						<StatusBadge label="Unsaved changes" tone="warning" />
					)}
				</div>

				<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
							<ShieldCheck className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-ink">
								Operational rules
							</p>
							<p className="mt-1 text-xs leading-5 text-ink-soft">
								Bonded segregation, cargo categories,
								packaging types, and hold reasons
								are configurable. Operational movements and holds
								retain their own event history and audit trail.
							</p>
						</div>
					</div>
				</div>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5">
						<h3 className="font-display text-sm font-bold text-ink">
							Terminal identity
						</h3>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							The facility name, unique terminal code, and normal
							operating hours.
						</p>
					</div>
					<div className="grid gap-4 p-5 sm:grid-cols-2">
						<Field
							label="Terminal name"
							required
							icon={Building2}
							value={config.terminalName}
							onChange={(value) => update("terminalName", value)}
							placeholder="e.g. Abuja Flagship Facility"
						/>
						<Field
							label="Terminal code"
							required
							icon={Building2}
							value={config.terminalCode}
							onChange={(value) => update("terminalCode", value)}
							placeholder="e.g. TRN-ABJ-01"
							mono
						/>
						<Field
							label="Operating hours"
							icon={Building2}
							value={config.operatingHours}
							onChange={(value) => update("operatingHours", value)}
							placeholder="e.g. 08:00–18:00"
							mono
						/>
					</div>
				</section>

				<ListSection
					title="Shipment types"
					description="Shipment types available to users when creating a shipment. Only active types should appear in shipment forms."
					icon={Package}
					addLabel="Add shipment type"
					rows={config.shipmentTypes}
					placeholder="e.g. Import"
					onAdd={() => addListRow("shipmentTypes", "shipment-type")}
					onUpdate={(id, label) =>
						updateListRow("shipmentTypes", id, label)
					}
					onRemove={(id) => removeListRow("shipmentTypes", id)}
				/>

				<ListSection
					title="Cargo categories"
					description="Classification options offered when a customer declares a shipment. These populate the cargo category dropdown on the shipment intake form."
					icon={Tag}
					addLabel="Add category"
					rows={config.cargoCategories}
					placeholder="e.g. Electronics"
					onAdd={() => addListRow("cargoCategories", "category")}
					onUpdate={(id, label) =>
						updateListRow("cargoCategories", id, label)
					}
					onRemove={(id) => removeListRow("cargoCategories", id)}
				/>

				<ListSection
					title="Packaging types"
					description="How goods are packed when they arrive at the terminal. These populate the packaging type dropdown on the shipment intake form."
					icon={Boxes}
					addLabel="Add packaging type"
					rows={config.packagingTypes}
					placeholder="e.g. Cartons"
					onAdd={() => addListRow("packagingTypes", "packaging")}
					onUpdate={(id, label) =>
						updateListRow("packagingTypes", id, label)
					}
					onRemove={(id) => removeListRow("packagingTypes", id)}
				/>

				<ListSection
					title="Hold reasons"
					description="Reasons available to authorised staff when placing a hold. The actual hold workflow separately captures authority, reference, actor, timestamp, and lift details."
					icon={Layers}
					addLabel="Add reason"
					rows={config.holdReasons}
					placeholder="e.g. Seal mismatch"
					onAdd={() => addListRow("holdReasons", "hold")}
					onUpdate={(id, label) =>
						updateListRow("holdReasons", id, label)
					}
					onRemove={(id) => removeListRow("holdReasons", id)}
				/>

				{dirty && (
					<section className="rounded-2xl bg-paper p-5 ring-1 ring-line">
						<label className="block">
							<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								<AlertTriangle className="size-3.5 text-orange" />
								Reason for change
							</span>
							<textarea
								value={changeReason}
								onChange={(event) =>
									setChangeReason(event.target.value)
								}
								maxLength={500}
								rows={3}
								placeholder="Explain why this configuration is being changed."
								className="mt-2 w-full rounded-md border border-line bg-sand p-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
							/>
							<span className="mt-1 block text-right font-mono text-[10px] text-ink-soft">
								{changeReason.length}/500
							</span>
						</label>
					</section>
				)}

				<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
					<div className="flex flex-wrap items-start gap-3">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
						<div className="min-w-0">
							<p className="text-[13px] font-semibold text-ink">
								Configuration scope
							</p>
							<p className="mt-1 text-[12px] leading-5 text-ink-soft">
								Changes to terminal identity, categories, packaging, and areas apply to future operational events. Existing manifests, shipments, and terminal records keep their original configuration.
							</p>
						</div>
					</div>
				</div>

				<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								{dirty ? "Unsaved changes" : "All changes saved"}
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{dirty
									? "Save to apply terminal, category, packaging, and hold changes."
									: "No pending changes."}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleDiscard}
								disabled={!dirty || saving}
								className="border-sand/25 bg-transparent text-sand hover:bg-sand/10 disabled:opacity-40"
							>
								Discard
							</Button>
							<Button
								type="button"
								onClick={handleSave}
								disabled={!dirty || saving}
								className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
							>
								<Save className="size-4" />
								{saving ? "Saving…" : "Save changes"}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}

function ListSection({
	title,
	description,
	icon: Icon,
	addLabel,
	rows,
	placeholder,
	onAdd,
	onUpdate,
	onRemove,
}: {
	title: string;
	description: string;
	icon: typeof Package;
	addLabel: string;
	rows: LabelRow[];
	placeholder: string;
	onAdd: () => void;
	onUpdate: (id: string, label: string) => void;
	onRemove: (id: string) => void;
}) {
	return (
		<section className="rounded-2xl bg-paper ring-1 ring-line">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
				<div>
					<h3 className="font-display text-sm font-bold text-ink">
						{title}
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						{description}
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onAdd}
					className="border-line bg-paper text-ink hover:bg-sand"
				>
					<Plus className="size-3.5" />
					{addLabel}
				</Button>
			</div>

			{rows.length === 0 ? (
				<div className="p-6 text-center text-sm text-ink-soft">
					No {title.toLowerCase()} configured.
				</div>
			) : (
				<ul className="divide-y divide-line">
					{rows.map((row) => (
						<li
							key={row.id}
							className="flex flex-wrap items-center gap-3 p-5"
						>
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Icon className="size-4" />
							</div>
							<Input
								value={row.label}
								onChange={(event) =>
									onUpdate(row.id, event.target.value)
								}
								placeholder={placeholder}
								className="h-11 min-w-[220px] flex-1 border-line bg-sand text-ink"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onRemove(row.id)}
								aria-label={`Remove ${row.label || "row"}`}
								className="text-carmine hover:bg-carmine/10"
							>
								<Trash2 className="size-3.5" />
								Remove
							</Button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	icon: Icon,
	mono,
	required,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Building2;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
				{required && <span className="text-coral">*</span>}
			</span>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-1.5 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}