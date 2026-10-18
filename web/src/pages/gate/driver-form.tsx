import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

export default function GateDriverFormPage() {
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [licenceNumber, setLicenceNumber] = useState("");
	const [licenceClass, setLicenceClass] = useState("Class G · Heavy goods");
	const [licenceExpiry, setLicenceExpiry] = useState("");
	const [assignedVehicle, setAssignedVehicle] = useState("");
	const [transporter, setTransporter] = useState("");
	const [notes, setNotes] = useState("");

	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			if (!name.trim() || !phone.trim() || !licenceNumber.trim()) {
				toast.error("Name, phone, and licence number are required.");
				return;
			}
			toast.success("Driver registered locally.");
			navigate("/gate/vehicles");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AppShell title="Add driver" eyebrow="Gate control · Registry">
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
						Register a driver
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						New records start in "Pending review" until verified by the gate
						supervisor. Expired licences block entry at the gate.
					</p>
				</div>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="border-b border-line p-5 sm:p-6">
						<div className="flex items-center gap-2">
							<span className="grid size-8 place-items-center rounded-lg bg-orange/10 text-orange-deep">
								<User className="size-4" />
							</span>
							<h3 className="font-display text-sm font-bold text-ink">
								Driver details
							</h3>
						</div>
						<p className="mt-2 text-xs leading-5 text-ink-soft">
							Identity, licence, and assigned vehicle.
						</p>
					</div>
					<div className="space-y-5 p-5 sm:p-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Full name"
								placeholder="Babatunde Alao"
								value={name}
								onChange={setName}
								required
							/>
							<Field
								label="Phone"
								placeholder="+234 803 112 3456"
								value={phone}
								onChange={setPhone}
								mono
								required
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Licence number"
								placeholder="NG-DL-4821-7712"
								value={licenceNumber}
								onChange={setLicenceNumber}
								mono
								required
							/>
							<Field
								label="Licence class"
								placeholder="Class G · Heavy goods"
								value={licenceClass}
								onChange={setLicenceClass}
							/>
						</div>

						<Field
							label="Licence expiry"
							placeholder="14 Aug 2028"
							value={licenceExpiry}
							onChange={setLicenceExpiry}
							mono
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Assigned vehicle"
								placeholder="KJA-882-XD"
								value={assignedVehicle}
								onChange={setAssignedVehicle}
								mono
							/>
							<Field
								label="Transporter"
								placeholder="Apex Haulage Fleet"
								value={transporter}
								onChange={setTransporter}
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
										Licence expiry reminders
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										TRINŪ can send a reminder before licence expiry.
										Expired licences block entry at the gate
										automatically.
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
								Driver intake
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{name || "Name pending"}
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
								{submitting ? "Saving…" : "Register driver"}
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