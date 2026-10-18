import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	LoaderCircle,
	Truck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { http, type Resp } from "@/lib/httpClient";

type VehicleKind = "Flatbed" | "Container" | "Reefer" | "Box" | "Tanker";

type Vehicle = {
	id: string;
	plate: string;
	kind: VehicleKind;
	make: string | null;
	model: string | null;
	year: number | string | null;
	capacity: string | number | null;
	owner: string;
	transporter: string;
	insurance_expiry: string | null;
	roadworthiness_expiry: string | null;
	notes: string | null;
};

type VehicleForm = {
	plate: string;
	kind: VehicleKind;
	make: string;
	model: string;
	year: string;
	capacity: string;
	owner: string;
	transporter: string;
	insurance_expiry: string;
	roadworthiness_expiry: string;
	notes: string;
};

const vehicleKinds: VehicleKind[] = [
	"Flatbed",
	"Container",
	"Reefer",
	"Box",
	"Tanker",
];
const vehicleKindDescriptions: Record<VehicleKind, string> = {
	Flatbed: "An open truck or trailer for steel, machinery, timber, and oversized cargo.",
	Container: "A truck or trailer designed to carry shipping containers, such as 20-foot or 40-foot containers.",
	Reefer: "A refrigerated vehicle for frozen food, fresh produce, and other temperature-sensitive cargo.",
	Box: "A truck with an enclosed cargo compartment for cartons, electronics, furniture, and packaged goods.",
	Tanker: "A vehicle with a tank for transporting liquids or other permitted bulk materials. Special cargo requirements may apply.",
};
const emptyForm: VehicleForm = {
	plate: "",
	kind: "Container",
	make: "",
	model: "",
	year: "",
	capacity: "",
	owner: "",
	transporter: "",
	insurance_expiry: "",
	roadworthiness_expiry: "",
	notes: "",
};

const labelClass =
	"font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const toDateInput = (value?: string | null): string => {
	if (!value) return "";

	const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
	if (match?.[1]) return match[1];

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
};

const getErrorMessage = (error: any, fallback: string) =>
	error?.response?.data?.data ||
	error?.response?.data?.message ||
	error?.message ||
	fallback;

const extractVehicle = (resp: Resp): Vehicle | null => {
	if (resp.error) return null;

	const payload = resp.code as any;

	if (payload?.vehicle) return payload.vehicle;
	if (payload?.data?.vehicle) return payload.data.vehicle;
	if (payload?.id) return payload as Vehicle;

	return null;
};

export default function GateVehicleFormPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEditing = Boolean(id);

	const [form, setForm] = useState<VehicleForm>(emptyForm);
	const [loading, setLoading] = useState(isEditing);
	const [submitting, setSubmitting] = useState(false);
	const [loadError, setLoadError] = useState("");

	const updateField = <K extends keyof VehicleForm>(
		field: K,
		value: VehicleForm[K],
	) => {
		setForm((current) => ({ ...current, [field]: value }));
	};

	const loadVehicle = useCallback(async () => {
		if (!id) return;

		setLoading(true);
		setLoadError("");


		try {
			const response = await http.get(`/vehicles/${id}/`);
			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: "Unable to load vehicle details.",
				);
			}

			const vehicle = extractVehicle(resp);

			if (!vehicle) {
				throw new Error("The vehicle record was not returned by the server.");
			}

			setForm({
				plate: vehicle.plate ?? "",
				kind: vehicle.kind ?? "Container",
				make: vehicle.make ?? "",
				model: vehicle.model ?? "",
				year: vehicle.year == null ? "" : String(vehicle.year),
				capacity:
					vehicle.capacity == null ? "" : String(vehicle.capacity),
				owner: vehicle.owner ?? "",
				transporter: vehicle.transporter ?? "",
				insurance_expiry: toDateInput(vehicle.insurance_expiry),
				roadworthiness_expiry: toDateInput(
					vehicle.roadworthiness_expiry,
				),
				notes: vehicle.notes ?? "",
			});
		} catch (error: any) {
			const message = getErrorMessage(
				error,
				"Unable to load vehicle details.",
			);
			setLoadError(message);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		if (isEditing) {
			void loadVehicle();
		} else {
			setForm(emptyForm);
			setLoading(false);
			setLoadError("");
		}
	}, [isEditing, loadVehicle]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (submitting || loading) return;

		const payload = {
			plate: form.plate.trim().toUpperCase(),
			kind: form.kind,
			make: form.make.trim(),
			model: form.model.trim(),
			year: form.year.trim() ? Number(form.year) : null,
			capacity: form.capacity.trim(),
			owner: form.owner.trim(),
			transporter: form.transporter.trim(),
			insurance_expiry: form.insurance_expiry || null,
			roadworthiness_expiry: form.roadworthiness_expiry || null,
			notes: form.notes.trim(),
		};

		if (!payload.plate || !payload.owner || !payload.transporter) {
			toast.error("Plate, owner, and transporter are required.");
			return;
		}

		if (
			payload.year !== null &&
			(!Number.isInteger(payload.year) ||
				payload.year < 1900 ||
				payload.year > new Date().getFullYear() + 1)
		) {
			toast.error("Enter a valid vehicle year.");
			return;
		}

		setSubmitting(true);

		try {
			const url = isEditing ? `/vehicles/update/${id}/` : "/vehicles/add/";
			const response = await http.post(url, payload);

			const resp: Resp = response.data;

			if (resp.error) {
				throw new Error(
					typeof resp.data === "string"
						? resp.data
						: isEditing
							? "Unable to update vehicle."
							: "Unable to register vehicle.",
				);
			}

			toast.success(
				isEditing
					? "Vehicle updated successfully."
					: "Vehicle registered successfully.",
			);

			navigate("/gate/vehicles");
		} catch (error: any) {
			toast.error(
				getErrorMessage(
					error,
					isEditing
						? "Unable to update vehicle."
						: "Unable to register vehicle.",
				),
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<AppShell
				title={isEditing ? "Edit vehicle" : "Add vehicle"}
				eyebrow="Gate control · Registry"
			>
				<div className="flex min-h-64 items-center justify-center gap-3 text-sm text-ink-soft">
					<LoaderCircle className="size-5 animate-spin" />
					Loading vehicle details…
				</div>
			</AppShell>
		);
	}

	if (loadError && isEditing) {
		return (
			<AppShell title="Edit vehicle" eyebrow="Gate control · Registry">
				<section className="rounded-2xl bg-paper p-6 ring-1 ring-line">
					<p className="text-sm font-semibold text-coral">
						Unable to load vehicle
					</p>
					<p className="mt-2 text-sm text-ink-soft">{loadError}</p>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							type="button"
							onClick={() => void loadVehicle()}
							disabled={loading}
						>
							Retry
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate("/gate/vehicles")}
						>
							Back to registry
						</Button>
					</div>
				</section>
			</AppShell>
		);
	}

	return (
		<AppShell
			title={isEditing ? "Edit vehicle" : "Add vehicle"}
			eyebrow="Gate control · Registry"
		>
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
						Gate control · Vehicle registry
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						{isEditing ? "Update vehicle details" : "Register a vehicle"}
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						{isEditing
							? "Update the registered vehicle information and document expiry dates."
							: "Register a vehicle for verification by the gate supervisor. Required documents must remain valid for gate entry."}
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
							Registration, vehicle type, ownership, and document expiry.
						</p>
					</div>

					<div className="space-y-5 p-5 sm:p-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Registration plate"
								placeholder="KJA-882-XD"
								value={form.plate}
								onChange={(value) => updateField("plate", value)}
								mono
								required
								disabled={submitting}
							/>

							<label className="block">
								<span className={labelClass}>Vehicle type</span>

								<select
									value={form.kind}
									onChange={(event) =>
										updateField("kind", event.target.value as VehicleKind)
									}
									disabled={submitting}
									className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-orange/30 disabled:opacity-60"
								>
									{vehicleKinds.map((kind) => (
										<option key={kind} value={kind}>
											{kind}
										</option>
									))}
								</select>

								<p className="mt-2 text-xs leading-5 text-ink-soft">
									{vehicleKindDescriptions[form.kind]}
								</p>
							</label>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<Field
								label="Make"
								placeholder="Mercedes-Benz"
								value={form.make}
								onChange={(value) => updateField("make", value)}
								disabled={submitting}
							/>
							<Field
								label="Model"
								placeholder="Actros 2645"
								value={form.model}
								onChange={(value) => updateField("model", value)}
								disabled={submitting}
							/>
							<Field
								label="Year"
								placeholder="2021"
								value={form.year}
								onChange={(value) => updateField("year", value)}
								mono
								type="number"
								disabled={submitting}
							/>
						</div>

						<Field
							label="Capacity"
							placeholder="40 tonnes"
							value={form.capacity}
							onChange={(value) => updateField("capacity", value)}
							mono
							disabled={submitting}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Owner"
								placeholder="Vehicle owner"
								value={form.owner}
								onChange={(value) => updateField("owner", value)}
								required
								disabled={submitting}
							/>
							<Field
								label="Transporter"
								placeholder="Transport company"
								value={form.transporter}
								onChange={(value) =>
									updateField("transporter", value)
								}
								required
								disabled={submitting}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								label="Insurance expiry"
								value={form.insurance_expiry}
								onChange={(value) =>
									updateField("insurance_expiry", value)
								}
								type="date"
								disabled={submitting}
							/>
							<Field
								label="Roadworthiness expiry"
								value={form.roadworthiness_expiry}
								onChange={(value) =>
									updateField("roadworthiness_expiry", value)
								}
								type="date"
								disabled={submitting}
							/>
						</div>
					</div>
				</section>

				<section className="rounded-2xl bg-paper ring-1 ring-line">
					<div className="p-5 sm:p-6">
						<label className="block">
							<span className={labelClass}>Notes</span>
							<textarea
								value={form.notes}
								onChange={(event) =>
									updateField("notes", event.target.value)
								}
								disabled={submitting}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30 disabled:opacity-60"
								placeholder="Additional information for the gate supervisor."
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
										Document expiry
									</p>
									<p className="mt-1 text-[12px] leading-5 text-ink-soft">
										Keep insurance and roadworthiness documents current.
										Actual entry blocking and expiry reminders must be
										enforced by the backend gate-validation workflow.
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
								{isEditing ? "Vehicle update" : "Vehicle intake"}
							</p>
							<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
								{form.plate.trim() || "Plate pending"}
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
								{submitting ? (
									<>
										<LoaderCircle className="size-4 animate-spin" />
										Saving…
									</>
								) : (
									<>
										{isEditing ? "Save changes" : "Register vehicle"}
										<ArrowRight className="size-4" />
									</>
								)}
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
	disabled,
}: {
	label: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	mono?: boolean;
	required?: boolean;
	disabled?: boolean;
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
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				className={cn(
					"mt-2 h-11 border-line bg-sand text-ink",
					mono && "font-mono",
				)}
			/>
		</label>
	);
}