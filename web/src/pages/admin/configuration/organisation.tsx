import { useState } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	FileText,
	Globe,
	Mail,
	MapPin,
	Phone,
	Save,
	ShieldCheck,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sectorOptions } from "@/lib/constants";

interface OrganisationConfig {
	legalName: string;
	tradingName: string;
	rcNumber: string;
	tin: string;
	dateOfIncorporation: string;
	sector: string;
	registeredAddress: string;
	operatingAddress: string;
	website: string;
	contactEmail: string;
	contactPhone: string;
	contactPerson: string;
	contactPersonTitle: string;
}

const initialConfig: OrganisationConfig = {
	legalName: "TRÏNŪ Bonded Warehouse Limited",
	tradingName: "TRÏNŪ",
	rcNumber: "",
	tin: "",
	dateOfIncorporation: "",
	sector: "",
	registeredAddress: "",
	operatingAddress: "Abuja Flagship Facility",
	website: "",
	contactEmail: "",
	contactPhone: "",
	contactPerson: "",
	contactPersonTitle: "",
};

export default function AdminOrganisationConfigurationPage() {
	const [config, setConfig] = useState<OrganisationConfig>(initialConfig);
	const [dirty, setDirty] = useState(false);

	const update = <K extends keyof OrganisationConfig>(
		key: K,
		value: OrganisationConfig[K]
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
		setDirty(true);
	};

	const handleSave = () => {
		if (!config.legalName.trim()) {
			toast.error("Legal name is required.");
			return;
		}
		toast.success("Organisation configuration saved. Change logged.");
		setDirty(false);
	};

	const handleDiscard = () => {
		setConfig(initialConfig);
		setDirty(false);
		toast.message("Changes discarded.");
	};

	return (
		<AppShell
			title="Organisation Settings"
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
						Organisation Settings
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Identity and operational details for the organisation. These values
						appear on terminal-issued documents, public pages, and correspondence
						once saved. All changes are written to the audit log.
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
							Identity &amp; Compliance
						</p>
						<p className="mt-1 text-xs leading-5 text-ink-soft">
							Legal name, RC number, and TIN feed into terminal-issued documents
							and verification. Changes to any regulatory-facing field should be
							approved by the CEO before going external.
						</p>
					</div>
				</div>
			</div>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Legal Identity
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Registered corporate details as they appear on incorporation records.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Legal name"
						required
						icon={Building2}
						value={config.legalName}
						onChange={(v) => update("legalName", v)}
						placeholder="e.g. TRÏNŪ Bonded Warehouse Limited"
						full
					/>
					<Field
						label="Trading name"
						icon={Building2}
						value={config.tradingName}
						onChange={(v) => update("tradingName", v)}
						placeholder="e.g. TRÏNŪ"
					/>
					<SelectField
						label="Sector"
						value={config.sector}
						onChange={(v) => update("sector", v)}
						placeholder="Select a sector…"
						options={sectorOptions}
					/>
					<Field
						label="RC number"
						icon={FileText}
						value={config.rcNumber}
						onChange={(v) => update("rcNumber", v)}
						placeholder="e.g. RC-1284921"
						mono
					/>
					<Field
						label="TIN"
						icon={FileText}
						value={config.tin}
						onChange={(v) => update("tin", v)}
						placeholder="e.g. 20483012-0001"
						mono
					/>
					<Field
						label="Date of incorporation"
						icon={FileText}
						value={config.dateOfIncorporation}
						onChange={(v) => update("dateOfIncorporation", v)}
						placeholder="YYYY-MM-DD"
						mono
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Addresses
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Registered address is used for legal correspondence. Operating
						address is the physical facility location.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Registered address"
						icon={MapPin}
						value={config.registeredAddress}
						onChange={(v) => update("registeredAddress", v)}
						placeholder="Registered corporate address"
						full
					/>
					<Field
						label="Operating address"
						icon={MapPin}
						value={config.operatingAddress}
						onChange={(v) => update("operatingAddress", v)}
						placeholder="Abuja Flagship Facility"
						full
					/>
				</div>
			</section>

			<section className="rounded-2xl bg-paper ring-1 ring-line">
				<div className="border-b border-line p-5">
					<h3 className="font-display text-sm font-bold text-ink">
						Contact Details
					</h3>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">
						Primary contact used on the public site, document headers, and
						customer correspondence.
					</p>
				</div>

				<div className="grid gap-4 p-5 sm:grid-cols-2">
					<Field
						label="Contact email"
						icon={Mail}
						value={config.contactEmail}
						onChange={(v) => update("contactEmail", v)}
						placeholder="operations@trinu.ng"
						mono
					/>
					<Field
						label="Contact phone"
						icon={Phone}
						value={config.contactPhone}
						onChange={(v) => update("contactPhone", v)}
						placeholder="+234 800 000 0000"
						mono
					/>
					<Field
						label="Contact person"
						icon={Users}
						value={config.contactPerson}
						onChange={(v) => update("contactPerson", v)}
						placeholder="e.g. Muktar Mahdi"
					/>
					<Field
						label="Contact person title"
						icon={Users}
						value={config.contactPersonTitle}
						onChange={(v) => update("contactPersonTitle", v)}
						placeholder="e.g. Brand Manager"
					/>
					<Field
						label="Website"
						icon={Globe}
						value={config.website}
						onChange={(v) => update("website", v)}
						placeholder="https://trinu.ng"
						mono
						full
					/>
				</div>
			</section>

			<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
				<div className="flex flex-wrap items-start gap-3">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-deep" />
					<div className="min-w-0">
						<p className="text-[13px] font-semibold text-ink">
							Regulatory-facing fields
						</p>
						<p className="mt-1 text-[12px] leading-5 text-ink-soft">
							Changes to legal name, RC number, TIN, or licence-related fields
							should be reviewed by the CEO before any public or
							regulator-facing material reflects them. The audit log records
							every change with actor, timestamp, and prior value.
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
	required,
	full,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	icon: typeof Building2;
	mono?: boolean;
	required?: boolean;
	full?: boolean;
}) {
	return (
		<label className={cn("block", full && "sm:col-span-2")}>
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Icon className="size-3.5 text-orange" />
				{label}
				{required && <span className="text-coral">*</span>}
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

function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: string[];
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				<Globe className="size-3.5 text-orange" />
				{label}
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/25"
			>
				<option value="">{placeholder ?? "Select…"}</option>
				{options.map((o) => (
					<option key={o} value={o}>
						{o}
					</option>
				))}
			</select>
		</label>
	);
}