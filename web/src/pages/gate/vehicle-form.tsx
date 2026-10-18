import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VehicleKind = "Flatbed" | "Container" | "Reefer" | "Box" | "Tanker";

const vehicleKinds: VehicleKind[] = [
	"Flatbed",
	"Container",
	"Reefer",
	"Box",
	"Tanker",
];

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function GateVehicleFormPage() {
	const navigate = useNavigate();

	const [plate, setPlate] = useState("");
	const [vKind, setVKind] = useState<VehicleKind>("Container");
	const [make, setMake] = useState("");
	const [model, setModel] = useState("");
	const [year, setYear] = useState("");
	const [capacity, setCapacity] = useState("");
	const [owner, setOwner] = useState("");
	const [transporter, setTransporter] = useState("");
	const [insuranceExpiry, setInsuranceExpiry] = useState("");
	const [roadworthinessExpiry, setRoadworthinessExpiry] = useState("");
	const [notes, setNotes] = useState("");

	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			if (!plate.trim() || !owner.trim() || !transporter.trim()) {
				toast.error("Plate, owner, and transporter are required.");
				return;
			}
			toast.success("Vehicle registered locally.");
			navigate("/gate/vehicles");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AppShell title="Add vehicle" eyebrow="Gate control · Registry">
			<form onSubmit={handleSubmit} className="space-y-5 pb-24">
				<div>
					<Button
						type="button"
						variant="ghost"
						onClick={() => navigate("/gate/vehicles")}
						disabled={submitting}
						className="-ml-3 gap-2 text-ink-soft hover:text-ink"
					>
						<ArrowLeft className="size-4" />
						Back to registry
					</Button>
				</div>

				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Gate control · Approved haulage
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Register a vehicle
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						New records start in "Pending review" until verified by the gate
						supervisor. Expired documents block entry at the gate.
					</p>
				</div>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5 sm:p-6">
						<div className="flex items-center gap-2">
							<span className="grid size-8 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<Truck className="size-4" />
							</span>
							<h3 className="font-display text-sm font-bold text-ink">
								Vehicle details
							</h3>
						</div>
						<p className="mt-2 text-xs leading-5 text-ink-soft">
							Plate, type, ownership, and document expiry.
						</p>
					</div>
					<div className="space-y-5 p-5 sm:p-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Plate"
								placeholder="KJA-882-XD"
								value={plate}
								onChange={setPlate}
								mono
								required
							/>
							<label className="block">
								<span className={labelClass}>Kind</span>
								<select
									value={vKind}
									onChange={(e) => setVKind(e.target.value as VehicleKind)}
									disabled={submitting}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30"
								>
									{vehicleKinds.map((k) => (
										<option key={k} value={k}>
											{k}
										</option>
									))}
								</select>
							</label>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<Field
								label="Make"
								placeholder="Mercedes-Benz"
								value={make}
								onChange={setMake}
							/>
							<Field
								label="Model"
								placeholder="Actros 2645"
								value={model}
								onChange={setModel}
							/>
							<Field
								label="Year"
								placeholder="2021"
								value={year}
								onChange={setYear}
								mono
							/>
						</div>

						<Field
							label="Capacity"
							placeholder="40 tonnes"
							value={capacity}
							onChange={setCapacity}
							mono
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Owner"
								placeholder="Apex Haulage Fleet"
								value={owner}
								onChange={setOwner}
								required
							/>
							<Field
								label="Transporter"
								placeholder="Apex Haulage Fleet"
								value={transporter}
								onChange={setTransporter}
								required
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Insurance expiry"
								placeholder="12 Mar 2027"
								value={insuranceExpiry}
								onChange={setInsuranceExpiry}
								mono
							/>
							<Field
								label="Roadworthiness expiry"
								placeholder="30 Nov 2026"
								value={roadworthinessExpiry}
								onChange={setRoadworthinessExpiry}
								mono
							/>
						</div>
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="p-5 sm:p-6">
						<label className="block">
							<span className={labelClass}>Notes</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								disabled={submitting}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="Anything the gate supervisor should know."
							/>
						</label>
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="p-5 sm:p-6">
						<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
							<div className="flex items-start gap-3">
								<Calendar className="mt-0.5 size-4 shrink-0 text-orange" />
								<div>
									<p className="text-[13px] font-semibold text-ink">
										Document expiry reminders
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										TRINŪ can send a reminder before insurance or
										roadworthiness expiry. Expired documents block entry
										at the gate automatically.
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Vehicle intake
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{plate || "Plate pending"}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate("/gate/vehicles")}
								disabled={submitting}
								className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={submitting}
								className="gap-2 bg-orange text-white hover:bg-orange-deep"
							>
								{submitting ? "Saving…" : "Register vehicle"}
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</div>
				</div>
			</form>
		</AppShell>
	);
}

function Field({
	label,
	placeholder,
	value,
	onChange,
	type = "text",
	mono,
	required,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
}) {
	return (
		<label className="block">
			<span className={labelClass}>
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono"
				)}
			/>
		</label>
	);
}