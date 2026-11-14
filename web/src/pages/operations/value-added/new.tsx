
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ClipboardCheck,
	Package,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	createServiceReference,
	getOrders,
	kindMeta,
	saveOrder,
	serviceKinds,
	type ServiceKind,
	type ServiceOrder,
} from "./value-added.data";

function Field({
	label,
	value,
	onChange,
	placeholder,
	required,
	mono,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	required?: boolean;
	mono?: boolean;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				required={required}
				className={`mt-2 h-11 border-line bg-sand text-ink ${mono ? "font-mono" : ""}`}
			/>
		</label>
	);
}

export default function OperationsValueAddedNewPage() {
	const navigate = useNavigate();

	const [kind, setKind] = useState<ServiceKind>("Palletisation");
	const [container, setContainer] = useState("");
	const [containerRef, setContainerRef] = useState("");
	const [consignment, setConsignment] = useState("");
	const [cargoOwner, setCargoOwner] = useState("");
	const [location, setLocation] = useState("");
	const [scheduledFor, setScheduledFor] = useState("");
	const [assignedTo, setAssignedTo] = useState("");
	const [quantity, setQuantity] = useState("");
	const [beforeValue, setBeforeValue] = useState("");
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!container.trim() || !consignment.trim() || !assignedTo.trim()) {
			toast.error("Container, consignment and assigned officer are required.");
			return;
		}

		setSaving(true);

		try {
			const orders = getOrders();
			const reference = createServiceReference(orders);
			const sequence = reference.split("-").pop();

			const next: ServiceOrder = {
				id: crypto.randomUUID(),
				reference,
				kind,
				status: "Scheduled",
				container: container.trim(),
				containerRef: containerRef.trim(),
				consignment: consignment.trim(),
				cargoOwner: cargoOwner.trim() || "—",
				location: location.trim() || (kind === "Weighing" ? "Weighbridge A" : "Yard"),
				scheduledFor: scheduledFor.trim() || "Awaiting scheduling",
				startedAt: "—",
				completedAt: "—",
				assignedTo: assignedTo.trim(),
				quantity: quantity.trim() || "—",
				beforeValue: beforeValue.trim() || "—",
				afterValue: "—",
				chargeRef: `CHG-${kind.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${sequence}`,
				tariffLine: kindMeta[kind].tariffLine,
				notes: notes.trim(),
				createdAt: new Date().toLocaleString("en-GB"),
			};

			saveOrder(next);
			toast.success("Service order created.");
			navigate(`/operations/value-added/${next.id}`);
		} catch {
			toast.error("Could not create service order.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppShell title="New service order" eyebrow="Operations · Value-added">
			<div>
				<Link
					to="/operations/value-added"
					className="inline-flex items-center text-sm font-medium text-ink-soft hover:text-ink"
				>
					<ArrowLeft className="mr-2 size-4" />
					Back to service orders
				</Link>

				<h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					Create service order
				</h2>
				<p className="mt-1 text-sm text-ink-soft">
					Select the required cargo service and provide its handling details.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
			>
				<div className="space-y-5">
					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-deep">
								Step 01
							</p>
							<h3 className="mt-1 font-display text-lg font-bold text-ink">
								Choose a service
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Select the value-added operation to be performed.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							{serviceKinds.map((service) => {
								const meta = kindMeta[service];
								const Icon = meta.icon;
								const active = kind === service;

								return (
									<button
										key={service}
										type="button"
										onClick={() => setKind(service)}
										className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
											active
												? "border-orange bg-orange/5 ring-2 ring-orange/15"
												: "border-line bg-sand/50 hover:border-orange/40 hover:bg-sand"
										}`}
									>
										<span
											className={`grid size-10 shrink-0 place-items-center rounded-lg ${
												active
													? "bg-orange text-white"
													: "bg-orange/10 text-orange-deep"
											}`}
										>
											<Icon className="size-5" />
										</span>

										<span className="min-w-0">
											<span className="block text-sm font-semibold text-ink">
												{meta.label}
											</span>
											<span className="mt-1 block text-xs leading-5 text-ink-soft">
												{meta.detail}
											</span>
											<span className="mt-2 block font-mono text-[9px] uppercase tracking-wider text-ink-soft">
												{meta.tariffLine}
											</span>
										</span>

										{active && (
											<CheckCircle2 className="ml-auto size-4 shrink-0 text-orange-deep" />
										)}
									</button>
								);
							})}
						</div>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-deep">
								Step 02
							</p>
							<h3 className="mt-1 font-display text-lg font-bold text-ink">
								Cargo and consignment
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Identify the cargo that requires the service.
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Container number" value={container} onChange={setContainer} placeholder="TRIU1234564" mono required />
							<Field label="Container record ID" value={containerRef} onChange={setContainerRef} placeholder="Container record ID" mono />
							<Field label="Consignment reference" value={consignment} onChange={setConsignment} placeholder="TRN-IMP-002481" mono required />
							<Field label="Cargo owner" value={cargoOwner} onChange={setCargoOwner} placeholder="Organisation or cargo owner" />
						</div>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-deep">
								Step 03
							</p>
							<h3 className="mt-1 font-display text-lg font-bold text-ink">
								Work assignment
							</h3>
							<p className="mt-1 text-xs text-ink-soft">
								Set where and when the work will take place.
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Service location"
								value={location}
								onChange={setLocation}
								placeholder={kind === "Weighing" ? "Weighbridge A" : "Yard / Warehouse location"}
							/>
							<Field
								label="Scheduled date and time"
								value={scheduledFor}
								onChange={setScheduledFor}
								placeholder="24 Sep 2026 · 10:00"
							/>
							<Field
								label="Assigned officer / team"
								value={assignedTo}
								onChange={setAssignedTo}
								placeholder="Officer name or team"
								required
							/>
							<Field
								label="Quantity to handle"
								value={quantity}
								onChange={setQuantity}
								placeholder="48 cartons → 6 pallets"
							/>
						</div>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm sm:p-6">
						<div className="mb-5">
							<p className="font-mono text-[10px] uppercase tracking-[0.15em] text-orange-deep">
								Step 04
							</p>
							<h3 className="mt-1 font-display text-lg font-bold text-ink">
								Service instructions
							</h3>
						</div>

						<div className="space-y-4">
							<Field
								label="Before-service condition"
								value={beforeValue}
								onChange={setBeforeValue}
								placeholder="Describe the cargo condition before work begins"
							/>

							<label className="block">
								<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Operational notes
								</span>
								<textarea
									value={notes}
									onChange={(event) => setNotes(event.target.value)}
									rows={5}
									placeholder="Special handling instructions, sequence, requirements or other context..."
									className="mt-2 w-full resize-y rounded-lg border border-line bg-sand px-3 py-3 text-sm leading-6 text-ink outline-none placeholder:text-ink-soft/70 focus:border-orange focus:ring-2 focus:ring-orange/20"
								/>
							</label>
						</div>
					</section>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<Link to="/operations/value-added">
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</Link>

						<Button
							type="submit"
							disabled={saving}
							className="bg-orange text-white hover:bg-orange-deep"
						>
							{saving ? "Creating..." : "Create service order"}
							<ArrowRight className="ml-2 size-4" />
						</Button>
					</div>
				</div>

				<aside className="space-y-4 xl:sticky xl:top-6">
					<section className="rounded-2xl bg-[#4B4F55] p-5 text-white shadow-sm">
						<div className="flex items-center gap-3">
							<div className="grid size-10 place-items-center rounded-xl bg-white/10">
								<ClipboardCheck className="size-5 text-orange-300" />
							</div>
							<div>
								<p className="font-display font-bold">Order summary</p>
								<p className="text-xs text-white/55">Review before creating</p>
							</div>
						</div>

						<div className="mt-5 space-y-4 border-t border-white/10 pt-4">
							<div>
								<p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
									Selected service
								</p>
								<p className="mt-1 text-sm font-semibold">
									{kindMeta[kind].label}
								</p>
							</div>
							<div>
								<p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
									Container
								</p>
								<p className="mt-1 font-mono text-sm">
									{container || "Not selected"}
								</p>
							</div>
							<div>
								<p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
									Consignment
								</p>
								<p className="mt-1 font-mono text-sm">
									{consignment || "Not provided"}
								</p>
							</div>
							<div>
								<p className="font-mono text-[9px] uppercase tracking-wider text-white/45">
									Tariff line
								</p>
								<p className="mt-1 font-mono text-sm">
									{kindMeta[kind].tariffLine}
								</p>
							</div>
						</div>
					</section>

					<section className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
						<div className="flex items-center gap-2">
							<Package className="size-4 text-orange-deep" />
							<h3 className="font-display font-bold text-ink">After creation</h3>
						</div>
						<ul className="mt-4 space-y-3 text-xs leading-5 text-ink-soft">
							<li className="flex gap-2">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
								A service reference is generated.
							</li>
							<li className="flex gap-2">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
								The order starts with Scheduled status.
							</li>
							<li className="flex gap-2">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
								The selected tariff line is attached to the order.
							</li>
							<li className="flex gap-2">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
								The order can be opened to record progress and results.
							</li>
						</ul>
					</section>
				</aside>
			</form>
		</AppShell>
	);
}
