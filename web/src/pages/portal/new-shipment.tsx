import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CheckCircle2,
	ClipboardList,
	FileCheck2,
	FileText,
	Info,
	Package,
	Plus,
	Ship,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { http, type Resp } from "@/lib/httpClient";

type OptionRow = {
    id: string;
    label: string;
};

type ConfigOptions = {
    shipmentTypes: OptionRow[];
    cargoCategories: OptionRow[];
    packagingTypes: OptionRow[];
    supportingDocuments: OptionRow[];
};

const emptyOptions: ConfigOptions = {
    shipmentTypes: [],
    cargoCategories: [],
    packagingTypes: [],
    supportingDocuments: [],
};

const normaliseOptions = (raw: unknown): OptionRow[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((item: any) => {
            if (typeof item === "string") {
                return { id: item, label: item };
            }

            return {
                id: String(item?.id ?? item?.key ?? item?.label ?? ""),
                label: String(item?.label ?? item?.name ?? ""),
            };
        })
        .filter((item) => item.id && item.label.trim());
};

type ContainerItem = {
	containerNo: string;
	size: string;
	sealNo: string;
	packageCount: string;
	grossWeight: string;
};

type ShipmentDocument = {
	id: string;
	file: File;
	type: string;
};

const documentTypes = [
	"Bill of Lading",
	"Cargo Manifest",
	"Packing List",
	"Commercial Invoice",
	"Certificate of Origin",
	"Other Supporting Document",
];

const inputClass =
	"mt-1.5 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const textareaClass =
	"mt-1.5 w-full resize-y rounded-md border border-line bg-sand px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:ring-2 focus:ring-orange/30";

const labelClass =
	"block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft";

const emptyContainer = (): ContainerItem => ({
	containerNo: "",
	size: "20ft",
	sealNo: "",
	packageCount: "",
	grossWeight: "",
});

export default function NewPortalShipmentPage() {
	const navigate = useNavigate();

	const [step, setStep] = useState(1);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [loadingOptions, setLoadingOptions] = useState(true);
	const [optionsError, setOptionsError] = useState("");
	const [options, setOptions] = useState<ConfigOptions>(emptyOptions);
	const [form, setForm] = useState({
		shipmentType: "FCL",
		billOfLading: "",
		bookingNumber: "",
		vesselName: "",
		voyageNumber: "",
		shippingLine: "",
		originCountry: "",
		originPort: "",
		destinationPort: "",
		expectedArrival: "",
		consignee: "",
		consigneeEmail: "",
		consigneePhone: "",
		cargoDescription: "",
		cargoCategory: "General Cargo",
		packageType: "Cartons",
		packageCount: "",
		grossWeight: "",
		volume: "",
		hsCode: "",
		dangerousGoods: "no",
		temperatureControlled: "no",
		temperature: "",
		specialInstructions: "",
		customsReference: "",
	});

	const fetchOptions = async () => {
		setLoadingOptions(true);
		setOptionsError("");

		try {
			const res = await http.get("/portal/shipment/config/");
			const resp: Resp = res.data;

			if (resp.error) {
				setOptionsError(
					typeof resp.data === "string"
						? resp.data
						: "Could not load shipment configuration."
				);
				return;
			}

			const payload: any = resp.code ?? {};

			const loaded: ConfigOptions = {
				shipmentTypes: normaliseOptions(
					payload.shipment_types ?? payload.shipmentTypes
				),
				cargoCategories: normaliseOptions(
					payload.cargo_categories ?? payload.cargoCategories
				),
				packagingTypes: normaliseOptions(
					payload.packaging_types ?? payload.packagingTypes
				),
				supportingDocuments: normaliseOptions(
					payload.supporting_documents ??
						payload.supportingDocuments ??
						payload.document_types ??
						payload.documentTypes
				),
			};

			setOptions(loaded);

			setForm((current) => ({
				...current,
				shipmentType:
					loaded.shipmentTypes.find(
						(item) => item.label === current.shipmentType
					)?.label ?? loaded.shipmentTypes[0]?.label ?? "",
				cargoCategory:
					loaded.cargoCategories.find(
						(item) => item.label === current.cargoCategory
					)?.label ?? loaded.cargoCategories[0]?.label ?? "",
				packageType:
					loaded.packagingTypes.find(
						(item) => item.label === current.packageType
					)?.label ?? loaded.packagingTypes[0]?.label ?? "",
			}));

			setDocumentType((current) =>
				loaded.supportingDocuments.find(
					(item) => item.label === current
				)?.label ?? loaded.supportingDocuments[0]?.label ?? ""
			);
		} catch (err: any) {
			setOptionsError(
				err?.response?.data?.message ||
					"Could not load shipment configuration."
			);
		} finally {
			setLoadingOptions(false);
		}
	};

	useEffect(() => {
		void fetchOptions();
	}, []);
	
	const [containers, setContainers] = useState<ContainerItem[]>([
		emptyContainer(),
	]);

	const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
	const [documentType, setDocumentType] = useState<string>(
		documentTypes[0] ?? "Bill of Lading"
	);
	const [declarationAccepted, setDeclarationAccepted] = useState(false);

	const updateField = (name: string, value: string) => {
		setForm((current) => ({ ...current, [name]: value }));
	};

	const updateContainer = (
		index: number,
		field: keyof ContainerItem,
		value: string
	) => {
		setContainers((current) =>
			current.map((container, i) =>
				i === index ? { ...container, [field]: value } : container
			)
		);
	};

	const addContainer = () => {
		setContainers((current) => [...current, emptyContainer()]);
	};

	const removeContainer = (index: number) => {
		setContainers((current) =>
			current.length === 1
				? current
				: current.filter((_, i) => i !== index)
		);
	};

	const handleFiles = (files: FileList | null) => {
		if (!files?.length) return;

		const selected = Array.from(files);
		const maxSize = 10 * 1024 * 1024;
		const allowedExtensions = /\.(pdf|png|jpe?g|xlsx?|docx?)$/i;

		const invalid = selected.filter(
			(file) =>
				file.size > maxSize || !allowedExtensions.test(file.name)
		);

		if (invalid.length) {
			toast.error(
				"Files must be PDF, images, Excel or Word documents up to 10 MB each."
			);
		}

		const valid = selected.filter(
			(file) =>
				file.size <= maxSize && allowedExtensions.test(file.name)
		);

		setDocuments((current) => [
			...current,
			...valid.map((file) => ({
				id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
				file,
				type: documentType,
			})),
		]);
	};

	const removeDocument = (id: string) => {
		setDocuments((current) =>
			current.filter((document) => document.id !== id)
		);
	};

	const validateStep = () => {
        if (step === 1) {
            if (
                !form.shipmentType ||
                !form.billOfLading.trim() ||
                !form.originCountry.trim() ||
                !form.originPort.trim() ||
                !form.destinationPort.trim()
            ) {
                toast.error("Complete all required shipping details.");
                return false;
            }
        }

		if (step === 2) {
            if (!form.cargoDescription.trim()) {
                toast.error("Enter a cargo description.");
                return false;
            }

            if (!form.consignee.trim() || !form.packageCount.trim()) {
                toast.error("Enter the consignee and total package count.");
                return false;
            }

			if (
				!/^\d+(\.\d+)?$/.test(form.packageCount) ||
				Number(form.packageCount) <= 0
			) {
				toast.error("Enter a valid package count.");
				return false;
			}

			if (
				form.grossWeight &&
				(!/^\d+(\.\d+)?$/.test(form.grossWeight) ||
					Number(form.grossWeight) <= 0)
			) {
				toast.error("Enter a valid gross weight.");
				return false;
			}

			if (
				form.volume &&
				(!/^\d+(\.\d+)?$/.test(form.volume) ||
					Number(form.volume) <= 0)
			) {
				toast.error("Enter a valid cargo volume.");
				return false;
			}

			if (form.dangerousGoods === "yes" && !form.hsCode.trim()) {
				toast.error(
					"Provide the HS code for the declared dangerous goods."
				);
				return false;
			}

			if (
				form.temperatureControlled === "yes" &&
				!form.temperature.trim()
			) {
				toast.error("Enter the required temperature for this cargo.");
				return false;
			}

			if (form.shipmentType === "FCL") {
				const validContainers = containers.filter((container) =>
					container.containerNo.trim()
				);

				if (!validContainers.length) {
					toast.error(
						"Add at least one container number for FCL cargo."
					);
					return false;
				}

				const containerNumbers = validContainers.map((container) =>
					container.containerNo.trim().toUpperCase()
				);

				if (
					new Set(containerNumbers).size !== containerNumbers.length
				) {
					toast.error("Container numbers must be unique.");
					return false;
				}
			}
		}

		return true;
	};

	const saveDraft = async () => {
		setSaving(true);
		try {
			const formData = new FormData();

			formData.append("shipment_type", form.shipmentType);
			formData.append("bill_of_lading", form.billOfLading.trim());
			formData.append("cargo_description", form.cargoDescription.trim());
			formData.append("cargo_category", form.cargoCategory);
			formData.append("package_type", form.packageType);
			formData.append("package_count", form.packageCount);
			formData.append("gross_weight", form.grossWeight);
			formData.append("volume", form.volume);

			formData.append(
				"containers",
				JSON.stringify(
					form.shipmentType === "FCL"
						? containers.filter((item) => item.containerNo.trim())
						: []
				)
			);

			formData.append(
				"documents",
				JSON.stringify(
					documents.map((item, index) => ({
						name: item.file.name,
						type: item.type,
						size: item.file.size,
						index,
					}))
				)
			);

			documents.forEach((item, index) => {
				formData.append(`document_file_${index}`, item.file);
			});

			const res = await http.post("/portal/shipments/", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			const resp: Resp = res.data;

			if (resp.error) {
				toast.error(
					typeof resp.data === "string"
						? resp.data
						: "Could not submit the shipment."
				);
				return;
			}

			toast.success(
				typeof resp.data === "string"
					? resp.data
					: "Shipment submitted successfully."
			);

			navigate("/portal/shipments");
		} catch {
			toast.error("Unable to save the shipment draft.");
		} finally {
			setSaving(false);
		}
	};

	const submitShipment = async () => {
		if (!validateStep()) return;

		if (!declarationAccepted) {
			toast.error("Confirm the shipment declaration before submitting.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				...form,
				containers:
					form.shipmentType === "FCL"
						? containers.filter((container) =>
								container.containerNo.trim()
							)
						: [],
				documents: documents.map((document) => ({
					name: document.file.name,
					type: document.type,
				})),
			};

			const existing = JSON.parse(
				localStorage.getItem("portal-shipment-drafts") || "[]"
			);

			localStorage.setItem(
				"portal-shipment-pending-submissions",
				JSON.stringify([
					{
						id: `draft-${Date.now()}`,
						...payload,
						status: "Draft - Not Submitted to Terminal",
						createdAt: new Date().toISOString(),
					},
					...existing,
				])
			);

			toast.success(
				"Saved locally. Connect the shipment API to submit it to the terminal."
			);
		} catch {
			toast.error("Unable to prepare the shipment submission.");
		} finally {
			setSubmitting(false);
		}
	};

	const steps = [
		{ number: 1, label: "Shipment details", icon: Ship },
		{ number: 2, label: "Cargo & containers", icon: Package },
		{ number: 3, label: "Documents & review", icon: FileCheck2 },
	];

	return (
		<AppShell
			title="Submit Shipment"
			eyebrow="Stakeholder Portal · New Shipment"
		>
			<div className="mx-auto max-w-5xl space-y-6 pb-24">
				{/* Top bar */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						variant="ghost"
						onClick={() => navigate("/portal/shipments")}
						className="-ml-3 gap-2 text-ink-soft hover:text-ink"
					>
						<ArrowLeft className="size-4" />
						Back to shipments
					</Button>

					<Button
						variant="outline"
						disabled={saving}
						onClick={saveDraft}
						className="gap-2 border-line bg-paper text-ink hover:bg-sand"
					>
						<ClipboardList className="size-4" />
						{saving ? "Saving…" : "Save draft"}
					</Button>
				</div>

				{/* Hero */}
				<motion.section
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					className="relative overflow-hidden rounded-2xl bg-slate p-6 text-sand ring-1 ring-slate sm:p-8"
				>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-orange/25 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-24 bottom-0 size-56 rounded-full bg-carmine/20 blur-3xl"
					/>

					<div className="relative">
						<div className="flex items-center gap-2">
							<Ship className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange">
								New shipment declaration
							</p>
						</div>

						<h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
							Submit shipment details for terminal validation.
						</h1>

						<p className="mt-4 max-w-2xl text-sm leading-6 text-sand/75 sm:text-base">
							Provide accurate shipping and cargo information before
							physical receiving and allocation. Submitting a
							declaration does not confirm terminal acceptance,
							customs clearance or cargo release.
						</p>

						<div className="mt-6 flex flex-wrap gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-full border border-sand/15 bg-sand/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-sand/70">
								<Info className="size-3.5" />
								Required fields marked *
							</span>
							<span className="inline-flex items-center gap-1.5 rounded-full border border-sand/15 bg-sand/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-sand/70">
								Organisation submission
							</span>
						</div>
					</div>
				</motion.section>

				{/* Stepper */}
				<section className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
					{steps.map((item) => {
						const Icon = item.icon;
						const active = step === item.number;
						const completed = step > item.number;

						return (
							<button
								type="button"
								key={item.number}
								onClick={() => {
									if (item.number < step) setStep(item.number);
								}}
								className={cn(
									"flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition sm:p-4",
									active
										? "border-orange bg-orange/5 ring-1 ring-orange/25"
										: completed
											? "border-orange/25 bg-paper"
											: "border-line bg-paper",
									item.number < step
										? "cursor-pointer hover:border-orange/40"
										: "cursor-default"
								)}
							>
								<span
									className={cn(
										"grid size-9 shrink-0 place-items-center rounded-lg border transition",
										active
											? "border-orange bg-orange text-white"
											: completed
												? "border-orange bg-orange text-white"
												: "border-line bg-sand text-ink-soft"
									)}
								>
									{completed ? (
										<Check className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</span>

								<span className="min-w-0">
									<span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Step {item.number}
									</span>
									<span className="mt-0.5 block truncate text-[13px] font-semibold text-ink">
										{item.label}
									</span>
								</span>
							</button>
						);
					})}
				</section>

				{/* Form */}
				<form
					onSubmit={(event) => {
						event.preventDefault();

						if (step < 3) {
							if (validateStep()) setStep(step + 1);
						} else {
							void submitShipment();
						}
					}}
					className="space-y-5"
				>
					<AnimatePresence mode="wait">
						{step === 1 && (
							<motion.section
								key="step-1"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="rounded-2xl bg-paper ring-1 ring-line"
							>
								<SectionHeader
									title="Shipping information"
									description="Enter the shipping references and voyage details."
								/>

								<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
									<label className={labelClass}>
										Shipment type
										<span className="text-coral"> *</span>
										<select
											className={inputClass}
											value={form.shipmentType}
											onChange={(event) =>
												updateField("shipmentType", event.target.value)
											}
											required
										>
											<option value="">Select shipment type</option>
											{options.shipmentTypes.map((item) => (
												<option key={item.id} value={item.label}>
													{item.label}
												</option>
											))}
										</select>
									</label>

									<label className={labelClass}>
										Bill of lading
										<span className="text-coral"> *</span>
										<Input
											required
											value={form.billOfLading}
											onChange={(event) =>
												updateField(
													"billOfLading",
													event.target.value.toUpperCase()
												)
											}
											placeholder="Enter B/L reference"
											className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>

									<label className={labelClass}>
										Booking number
										<Input
											value={form.bookingNumber}
											onChange={(event) =>
												updateField(
													"bookingNumber",
													event.target.value
												)
											}
											placeholder="Shipping booking reference"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Shipping line
										<Input
											value={form.shippingLine}
											onChange={(event) =>
												updateField(
													"shippingLine",
													event.target.value
												)
											}
											placeholder="Shipping company"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Vessel name
										<Input
											value={form.vesselName}
											onChange={(event) =>
												updateField(
													"vesselName",
													event.target.value
												)
											}
											placeholder="Vessel carrying the cargo"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Voyage number
										<Input
											value={form.voyageNumber}
											onChange={(event) =>
												updateField(
													"voyageNumber",
													event.target.value
												)
											}
											placeholder="Voyage reference"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Origin country
										<span className="text-coral"> *</span>
										<Input
											required
											value={form.originCountry}
											onChange={(event) =>
												updateField(
													"originCountry",
													event.target.value
												)
											}
											placeholder="e.g. China"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Port of loading
										<span className="text-coral"> *</span>
										<Input
											required
											value={form.originPort}
											onChange={(event) =>
												updateField(
													"originPort",
													event.target.value
												)
											}
											placeholder="Origin port"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Destination port
										<span className="text-coral"> *</span>
										<Input
											required
											value={form.destinationPort}
											onChange={(event) =>
												updateField(
													"destinationPort",
													event.target.value
												)
											}
											placeholder="Destination port"
											className="mt-1.5 h-11 border-line bg-sand text-ink"
										/>
									</label>

									<label className={labelClass}>
										Expected arrival
										<Input
											type="date"
											value={form.expectedArrival}
											onChange={(event) =>
												updateField(
													"expectedArrival",
													event.target.value
												)
											}
											className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
										/>
									</label>
								</div>
							</motion.section>
						)}

						{step === 2 && (
							<motion.section
								key="step-2"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="space-y-5"
							>
								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Cargo declaration"
										description="Describe the goods and declare their quantities and handling requirements."
									/>

									<div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
										<label className={cn(labelClass, "sm:col-span-2")}>
											Cargo description
											<span className="text-coral"> *</span>
											<textarea
												required
												rows={3}
												value={form.cargoDescription}
												onChange={(event) =>
													updateField(
														"cargoDescription",
														event.target.value
													)
												}
												placeholder="Describe the goods, materials and intended handling…"
												className={textareaClass}
											/>
										</label>

										<label className={labelClass}>
											Cargo category
											<select
												className={inputClass}
												value={form.cargoCategory}
												onChange={(event) =>
													updateField("cargoCategory", event.target.value)
												}
												required
											>
												<option value="">Select cargo category</option>
												{options.cargoCategories.map((item) => (
													<option key={item.id} value={item.label}>
														{item.label}
													</option>
												))}
											</select>
										</label>

										<label className={labelClass}>
											HS code
											<Input
												value={form.hsCode}
												onChange={(event) =>
													updateField("hsCode", event.target.value)
												}
												placeholder="Customs tariff code"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Packaging type
											<select
												className={inputClass}
												value={form.packageType}
												onChange={(event) =>
													updateField("packageType", event.target.value)
												}
												required
											>
												<option value="">Select packaging type</option>
												{options.packagingTypes.map((item) => (
													<option key={item.id} value={item.label}>
														{item.label}
													</option>
												))}
											</select>
										</label>

										<label className={labelClass}>
											Total packages
											<span className="text-coral"> *</span>
											<Input
												required
												type="number"
												min="1"
												step="1"
												value={form.packageCount}
												onChange={(event) =>
													updateField(
														"packageCount",
														event.target.value
													)
												}
												placeholder="e.g. 250"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Gross weight (kg)
											<Input
												type="number"
												min="0"
												step="any"
												value={form.grossWeight}
												onChange={(event) =>
													updateField(
														"grossWeight",
														event.target.value
													)
												}
												placeholder="Total gross weight"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Volume (m³)
											<Input
												type="number"
												min="0"
												step="any"
												value={form.volume}
												onChange={(event) =>
													updateField("volume", event.target.value)
												}
												placeholder="Total cargo volume"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Consignee name
											<span className="text-coral"> *</span>
											<Input
												required
												value={form.consignee}
												onChange={(event) =>
													updateField(
														"consignee",
														event.target.value
													)
												}
												placeholder="Company or recipient name"
												className="mt-1.5 h-11 border-line bg-sand text-ink"
											/>
										</label>

										<label className={labelClass}>
											Consignee email
											<Input
												type="email"
												value={form.consigneeEmail}
												onChange={(event) =>
													updateField(
														"consigneeEmail",
														event.target.value
													)
												}
												placeholder="recipient@example.com"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Consignee phone
											<Input
												type="tel"
												value={form.consigneePhone}
												onChange={(event) =>
													updateField(
														"consigneePhone",
														event.target.value
													)
												}
												placeholder="Contact number"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>

										<label className={labelClass}>
											Customs reference
											<Input
												value={form.customsReference}
												onChange={(event) =>
													updateField(
														"customsReference",
														event.target.value
													)
												}
												placeholder="If already available"
												className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
											/>
										</label>
									</div>

									<div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 sm:p-6">
										<CheckboxCard
											checked={form.dangerousGoods === "yes"}
											onChange={(checked) =>
												updateField(
													"dangerousGoods",
													checked ? "yes" : "no"
												)
											}
											title="Dangerous goods"
											description="Cargo requires special declarations or handling."
										/>
										<CheckboxCard
											checked={
												form.temperatureControlled === "yes"
											}
											onChange={(checked) =>
												updateField(
													"temperatureControlled",
													checked ? "yes" : "no"
												)
											}
											title="Temperature controlled"
											description="Cargo needs a specified storage temperature."
										/>
									</div>

									{form.dangerousGoods === "yes" && (
										<div className="mx-5 mb-5 rounded-xl border-l-4 border-orange bg-orange/5 p-4 ring-1 ring-orange/20 sm:mx-6 sm:mb-6">
											<p className="text-[13px] font-semibold text-ink">
												Dangerous goods declaration required
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												Upload the relevant dangerous goods
												declaration and safety documents in the
												Documents step.
											</p>
										</div>
									)}

									{form.temperatureControlled === "yes" && (
										<div className="border-t border-line p-5 sm:p-6">
											<label className={labelClass}>
												Required temperature
												<Input
													value={form.temperature}
													onChange={(event) =>
														updateField(
															"temperature",
															event.target.value
														)
													}
													placeholder="e.g. 2–8 °C"
													className="mt-1.5 h-11 border-line bg-sand font-mono text-ink"
												/>
											</label>
										</div>
									)}

									<div className="border-t border-line p-5 sm:p-6">
										<label className={labelClass}>
											Special handling instructions
											<textarea
												rows={3}
												value={form.specialInstructions}
												onChange={(event) =>
													updateField(
														"specialInstructions",
														event.target.value
													)
												}
												placeholder="Fragile cargo, special handling, stacking restrictions…"
												className={textareaClass}
											/>
										</label>
									</div>
								</div>

								{form.shipmentType === "FCL" && (
									<div className="rounded-2xl bg-paper ring-1 ring-line">
										<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
											<div>
												<h2 className="font-display text-sm font-bold text-ink">
													Container details
												</h2>
												<p className="mt-1 text-xs leading-5 text-ink-soft">
													Enter each container included in this
													shipment.
												</p>
											</div>

											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={addContainer}
												className="gap-2 border-line bg-paper text-ink hover:bg-sand"
											>
												<Plus className="size-4" />
												Add container
											</Button>
										</div>

										<div className="space-y-4 p-5 sm:p-6">
											{containers.map((container, index) => (
												<div
													key={index}
													className="rounded-xl bg-sand p-4 ring-1 ring-line"
												>
													<div className="mb-4 flex items-center justify-between">
														<div className="flex items-center gap-3">
															<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
																<Package className="size-4" />
															</div>
															<p className="text-[13px] font-semibold text-ink">
																Container {index + 1}
															</p>
														</div>

														{containers.length > 1 && (
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() =>
																	removeContainer(index)
																}
																aria-label="Remove container"
																className="text-carmine hover:bg-carmine/10"
															>
																<Trash2 className="size-3.5" />
																Remove
															</Button>
														)}
													</div>

													<div className="grid gap-4 sm:grid-cols-2">
														<label className={labelClass}>
															Container number
															<span className="text-coral"> *</span>
															<Input
																value={container.containerNo}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"containerNo",
																		event.target.value.toUpperCase()
																	)
																}
																placeholder="e.g. ABCD1234567"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>

														<label className={labelClass}>
															Container size
															<select
																className={inputClass}
																value={container.size}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"size",
																		event.target.value
																	)
																}
															>
																<option value="20ft">20 ft</option>
																<option value="40ft">40 ft</option>
																<option value="40ft HC">
																	40 ft High Cube
																</option>
																<option value="45ft">45 ft</option>
																<option value="Reefer">Reefer</option>
																<option value="Other">Other</option>
															</select>
														</label>

														<label className={labelClass}>
															Seal number
															<Input
																value={container.sealNo}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"sealNo",
																		event.target.value
																	)
																}
																placeholder="Seal reference"
																className="mt-1.5 h-11 border-line bg-paper text-ink"
															/>
														</label>

														<label className={labelClass}>
															Packages in container
															<Input
																type="number"
																min="0"
																value={container.packageCount}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"packageCount",
																		event.target.value
																	)
																}
																placeholder="Optional"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>

														<label
															className={cn(
																labelClass,
																"sm:col-span-2"
															)}
														>
															Gross weight (kg)
															<Input
																type="number"
																min="0"
																step="any"
																value={container.grossWeight}
																onChange={(event) =>
																	updateContainer(
																		index,
																		"grossWeight",
																		event.target.value
																	)
																}
																placeholder="Optional container gross weight"
																className="mt-1.5 h-11 border-line bg-paper font-mono text-ink"
															/>
														</label>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</motion.section>
						)}

						{step === 3 && (
							<motion.section
								key="step-3"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -12 }}
								className="space-y-5"
							>
								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Supporting documents"
										description="Attach available shipping and cargo documents for terminal review."
									/>

									<div className="p-5 sm:p-6">
										<div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
											<label className={labelClass}>
												Document type
												<select
													value={documentType}
													onChange={(event) => setDocumentType(event.target.value)}
													className={inputClass}
												>
													<option value="">Select document type</option>
													{options.supportingDocuments.map((item) => (
														<option key={item.id} value={item.label}>
															{item.label}
														</option>
													))}
												</select>
											</label>

											<label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line bg-sand text-[13px] font-semibold text-ink-soft transition hover:border-orange/40 hover:bg-orange/5 hover:text-orange-deep">
												<Upload className="size-4" />
												Choose files
												<input
													type="file"
													multiple
													accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx"
													className="sr-only"
													onChange={(event) => {
														handleFiles(event.target.files);
														event.target.value = "";
													}}
												/>
											</label>

											<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Max 10 MB per file
											</p>
										</div>

										<div className="mt-5 space-y-3">
											{documents.length === 0 ? (
												<div className="rounded-xl border border-dashed border-line bg-sand/50 p-8 text-center">
													<div className="mx-auto grid size-12 place-items-center rounded-full bg-orange/10 text-orange-deep">
														<Upload className="size-5" />
													</div>
													<p className="mt-3 text-sm font-semibold text-ink">
														No documents attached
													</p>
													<p className="mt-1 text-xs text-ink-soft">
														Upload your bill of lading, manifest and
														supporting documents.
													</p>
												</div>
											) : (
												documents.map((document) => (
													<div
														key={document.id}
														className="flex items-center gap-3 rounded-xl bg-sand p-3 ring-1 ring-line"
													>
														<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-orange/10 text-orange-deep">
															<FileText className="size-4" />
														</div>
														<div className="min-w-0 flex-1">
															<p className="truncate text-[13px] font-semibold text-ink">
																{document.file.name}
															</p>
															<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
																{document.type} ·{" "}
																{(document.file.size / 1024).toFixed(
																	1
																)}{" "}
																KB
															</p>
														</div>
														<button
															type="button"
															onClick={() => removeDocument(document.id)}
															aria-label="Remove document"
															className="grid size-8 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
														>
															<X className="size-3.5" />
														</button>
													</div>
												))
											)}
										</div>

										<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
											<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
												Before submitting
											</p>
											<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Ensure the bill of lading and cargo details
													are accurate.
												</li>
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Verify container numbers, quantities and
													seal references.
												</li>
												<li className="flex items-start gap-2">
													<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange-deep" />
													Attach all documents required for your
													shipment.
												</li>
											</ul>
										</div>
									</div>
								</div>

								<div className="rounded-2xl bg-paper ring-1 ring-line">
									<SectionHeader
										title="Shipment summary"
										description="Review the declaration before submitting."
									/>

									<div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
										{[
											{
												label: "Bill of lading",
												value: form.billOfLading || "Not provided",
											},
											{
												label: "Shipment type",
												value: form.shipmentType,
											},
											{
												label: "Cargo",
												value:
													form.cargoDescription ||
													"Not provided",
											},
											{
												label: "Consignee",
												value: form.consignee || "Not provided",
											},
											{
												label: "Route",
												value: `${form.originPort || "Origin"} → ${
													form.destinationPort || "Destination"
												}`,
											},
											{
												label: "Total packages",
												value:
													form.packageCount || "Not provided",
											},
											{
												label: "Containers entered",
												value:
													form.shipmentType === "FCL"
														? String(
																containers.filter((container) =>
																	container.containerNo.trim()
																).length
															)
														: "Not applicable",
											},
											{
												label: "Documents attached",
												value: String(documents.length),
											},
										].map((item) => (
											<div
												key={item.label}
												className="min-w-0 rounded-lg bg-sand p-3 ring-1 ring-line"
											>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													{item.label}
												</p>
												<p className="mt-1.5 break-words text-[13px] font-semibold text-ink">
													{item.value}
												</p>
											</div>
										))}
									</div>

									<div className="border-t border-line p-5 sm:p-6">
										<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
											<input
												type="checkbox"
												checked={declarationAccepted}
												onChange={(event) =>
													setDeclarationAccepted(event.target.checked)
												}
												className="mt-0.5 size-4 shrink-0 accent-orange"
											/>
											<span className="text-[12px] leading-5 text-ink">
												I confirm that the shipment information
												provided is accurate to the best of my
												knowledge and that the supporting documents
												relate to this declaration.
											</span>
										</label>

										<p className="mt-3 text-[11px] leading-5 text-ink-soft">
											Submitting a declaration does not confirm
											terminal acceptance, customs clearance or
											cargo release. Those decisions are handled by
											the appropriate authorised parties.
										</p>
									</div>
								</div>
							</motion.section>
						)}
					</AnimatePresence>

					{/* Sticky bottom action bar */}
					<div className="sticky bottom-4 z-10 rounded-2xl bg-slate p-4 text-sand ring-1 ring-slate shadow-xl">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-0">
								<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
									Step {step} of 3
								</p>
								<p className="mt-0.5 text-[12px] leading-5 text-sand/75">
									{steps[step - 1]?.label ?? ""}
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								{step > 1 && (
									<Button
										type="button"
										variant="outline"
										onClick={() => setStep(step - 1)}
										className="border-sand/25 bg-transparent text-sand hover:bg-sand/10"
									>
										<ArrowLeft className="mr-2 size-4" />
										Previous
									</Button>
								)}

								{step < 3 ? (
									<Button
										type="submit"
										className="gap-2 bg-orange text-white hover:bg-orange-deep"
									>
										Continue
										<ArrowRight className="size-4" />
									</Button>
								) : (
									<Button
										type="submit"
										disabled={submitting || !declarationAccepted}
										className="gap-2 bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
									>
										{submitting
											? "Preparing…"
											: "Submit declaration"}
										<CheckCircle2 className="size-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		</AppShell>
	);
}

/* --------------------------------------------------------------------- */
/* Helper components                                                      */
/* --------------------------------------------------------------------- */

function SectionHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="border-b border-line p-5 sm:p-6">
			<h2 className="font-display text-sm font-bold text-ink">{title}</h2>
			<p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
		</div>
	);
}

function CheckboxCard({
	checked,
	onChange,
	title,
	description,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	title: string;
	description: string;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
				checked
					? "border-orange bg-orange/5 ring-1 ring-orange/25"
					: "border-line bg-sand hover:bg-sand-2"
			)}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="mt-1 size-4 shrink-0 accent-orange"
			/>
			<span className="min-w-0">
				<span className="block text-[13px] font-semibold text-ink">
					{title}
				</span>
				<span className="mt-0.5 block text-[11px] leading-5 text-ink-soft">
					{description}
				</span>
			</span>
		</label>
	);
}