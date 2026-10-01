import { useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Building2,
	Check,
	ChevronLeft,
	FileCheck2,
	Landmark,
	Lock,
	ShieldCheck,
	Upload,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalFilePicker } from "@/components/ui/local-file-picker";
import { cn } from "@/lib/utils";

type KycStep = "company" | "documents" | "signatories" | "review";

const steps: { key: KycStep; label: string; detail: string }[] = [
	{ key: "company", label: "Company details", detail: "Legal information" },
	{ key: "documents", label: "KYC documents", detail: "Licences and registrations" },
	{ key: "signatories", label: "Authorised signatories", detail: "Who can act for the account" },
	{ key: "review", label: "Review", detail: "Confirm and submit" },
];

interface CompanyDraft {
	legalName: string;
	tradingName: string;
	rcNumber: string;
	tin: string;
	incorporationDate: string;
	registeredAddress: string;
	operatingAddress: string;
	sector: string;
	website: string;
	contactName: string;
	contactEmail: string;
	contactPhone: string;
}

interface DocumentDraft {
	cacCertificate: boolean;
	tinCertificate: boolean;
	licenceReference: string;
	licenceFile: boolean;
	directorsList: boolean;
	utilityBill: boolean;
}

interface SignatoryDraft {
	id: string;
	name: string;
	role: string;
	email: string;
	phone: string;
	idType: string;
	idNumber: string;
	scope: "full" | "finance" | "operations";
}

const initialCompany: CompanyDraft = {
	legalName: "",
	tradingName: "",
	rcNumber: "",
	tin: "",
	incorporationDate: "",
	registeredAddress: "",
	operatingAddress: "",
	sector: "",
	website: "",
	contactName: "",
	contactEmail: "",
	contactPhone: "",
};

const initialDocuments: DocumentDraft = {
	cacCertificate: false,
	tinCertificate: false,
	licenceReference: "",
	licenceFile: false,
	directorsList: false,
	utilityBill: false,
};

const initialSignatories: SignatoryDraft[] = [
	{
		id: "sig-1",
		name: "",
		role: "Managing Director",
		email: "",
		phone: "",
		idType: "NIN",
		idNumber: "",
		scope: "full",
	},
];

export default function KycRoute() {
	const [step, setStep] = useState<KycStep>("company");
	const [company, setCompany] = useState<CompanyDraft>(initialCompany);
	const [documents, setDocuments] = useState<DocumentDraft>(initialDocuments);
	const [signatories, setSignatories] = useState<SignatoryDraft[]>(initialSignatories);
	const [acknowledged, setAcknowledged] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const currentIndex = steps.findIndex((s) => s.key === step);

	const goNext = () => {
		if (step === "company") {
			if (!company.legalName.trim() || !company.rcNumber.trim() || !company.tin.trim()) {
				toast.error("Legal name, RC number, and TIN are required.");
				return;
			}
			setStep("documents");
			return;
		}
		if (step === "documents") {
			if (!documents.cacCertificate || !documents.tinCertificate) {
				toast.error("CAC certificate and TIN certificate are required.");
				return;
			}
			setStep("signatories");
			return;
		}
		if (step === "signatories") {
			const filled = signatories.filter(
				(s) => s.name.trim() && s.email.trim() && s.idNumber.trim()
			);
			if (filled.length === 0) {
				toast.error("At least one authorised signatory is required.");
				return;
			}
			setStep("review");
			return;
		}
	};

	const goBack = () => {
		if (step === "documents") setStep("company");
		else if (step === "signatories") setStep("documents");
		else if (step === "review") setStep("signatories");
	};

	const addSignatory = () => {
		setSignatories((prev) => [
			...prev,
			{
				id: `sig-${Date.now()}`,
				name: "",
				role: "Director",
				email: "",
				phone: "",
				idType: "NIN",
				idNumber: "",
				scope: "operations",
			},
		]);
	};

	const removeSignatory = (id: string) => {
		setSignatories((prev) => prev.filter((s) => s.id !== id));
	};

	const updateSignatory = (id: string, patch: Partial<SignatoryDraft>) => {
		setSignatories((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!acknowledged) {
			toast.error("Confirm the accuracy statement to submit.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("KYC submitted locally.");
		}, 700);
	};

	if (submitted) {
		return (
			<AppShell title="KYC submitted" eyebrow="Account onboarding">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						KYC submitted
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your details.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
						Your KYC pack has been submitted for review. A TRINŪ compliance officer will
						verify the information and follow up using the contact details provided.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">KYC reference</dt>
								<dd className="font-mono text-ink">TRN-KYC-2026-00914</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Legal name</dt>
								<dd className="text-right text-ink">{company.legalName || "—"}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">RC number</dt>
								<dd className="font-mono text-ink">{company.rcNumber || "—"}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Signatories</dt>
								<dd className="text-ink">
									{signatories.filter((s) => s.name.trim()).length}
								</dd>
							</div>
						</dl>
					</div>

					<p className="mx-auto mt-6 max-w-md text-[12px] leading-5 text-ink-soft">
						Verification is typically coordinated within a few business days, depending
						on the documents and licence references provided. You'll be notified when
						review is complete.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to portal <ArrowRight />
							</Button>
						</Link>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="KYC & onboarding" eyebrow="Account compliance">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Account onboarding · Compliance
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Complete your organisation details
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Complete the four sections below to submit your KYC pack. Verification is
						coordinated by the compliance desk before full access is granted.
					</p>
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[260px_1fr]">
				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
							Progress
						</p>
						<div className="mt-3 flex items-baseline gap-2">
							<p className="font-display text-3xl font-bold text-ink">
								{String(currentIndex + 1).padStart(2, "0")}
							</p>
							<p className="font-mono text-[11px] text-ink-soft">
								/ {String(steps.length).padStart(2, "0")}
							</p>
						</div>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand-2">
							<div
								className="h-full rounded-full bg-orange transition-[width] duration-300"
								style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
							/>
						</div>
						<ol className="mt-6 space-y-1">
							{steps.map((s, i) => {
								const active = s.key === step;
								const done = i < currentIndex;
								return (
									<li key={s.key}>
										<button
											type="button"
											onClick={() => {
												if (done) setStep(s.key);
											}}
											disabled={!done && !active}
											className={cn(
												"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
												active
													? "bg-ink font-semibold text-sand"
													: done
													? "text-orange-deep hover:bg-sand"
													: "text-ink-soft"
											)}
										>
											<span
												className={cn(
													"grid size-7 shrink-0 place-items-center rounded-md border text-[11px]",
													done
														? "border-orange bg-orange text-white"
														: active
														? "border-orange text-orange"
														: "border-line"
												)}
											>
												{done ? <Check className="size-3.5" /> : i + 1}
											</span>
											<div className="min-w-0">
												<p>{s.label}</p>
												<p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
													{s.detail}
												</p>
											</div>
										</button>
									</li>
								);
							})}
						</ol>
					</div>

					<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
							Why KYC is required
						</p>
						<p className="mt-3 text-[12px] leading-5 text-ink-soft">
							Bonded terminal access requires verified organisation details and authorised
							signatories. Verification protects the operating record for everyone on the
							platform.
						</p>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<ShieldCheck className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Data protection
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-5 text-sand/75">
							KYC documents and personal data are handled under the Nigeria Data
							Protection Act 2023. See our privacy notice for details.
						</p>
						<Link
							to="/privacy"
							className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange"
						>
							Read privacy notice <ArrowRight className="size-3.5" />
						</Link>
					</div>
				</aside>

				<form onSubmit={handleSubmit} className="space-y-5">
					{step === "company" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="Company details"
								detail="Legal information"
								inline
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<Field
									label="Legal name"
									placeholder="Atlantic Trade Nigeria Ltd"
									value={company.legalName}
									onChange={(v) => setCompany({ ...company, legalName: v })}
									required
								/>
								<Field
									label="Trading name"
									placeholder="Atlantic Trade"
									value={company.tradingName}
									onChange={(v) => setCompany({ ...company, tradingName: v })}
								/>
								<Field
									label="RC number"
									placeholder="RC-1284921"
									value={company.rcNumber}
									onChange={(v) => setCompany({ ...company, rcNumber: v })}
									mono
									required
								/>
								<Field
									label="TIN"
									placeholder="20483012-0001"
									value={company.tin}
									onChange={(v) => setCompany({ ...company, tin: v })}
									mono
									required
								/>
								<Field
									label="Date of incorporation"
									placeholder="12 Mar 2018"
									value={company.incorporationDate}
									onChange={(v) => setCompany({ ...company, incorporationDate: v })}
								/>
								<Field
									label="Sector"
									placeholder="Electronics · General trade"
									value={company.sector}
									onChange={(v) => setCompany({ ...company, sector: v })}
								/>
							</div>

							<div className="mt-5 grid gap-4 sm:grid-cols-2">
								<TextArea
									label="Registered address"
									placeholder="Full registered office address"
									value={company.registeredAddress}
									onChange={(v) => setCompany({ ...company, registeredAddress: v })}
								/>
								<TextArea
									label="Operating address"
									placeholder="Where your team operates from"
									value={company.operatingAddress}
									onChange={(v) => setCompany({ ...company, operatingAddress: v })}
								/>
							</div>

							<div className="mt-5">
								<Field
									label="Website"
									placeholder="https://example.ng"
									value={company.website}
									onChange={(v) => setCompany({ ...company, website: v })}
								/>
							</div>

							<div className="mt-6 border-t border-line pt-6">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Primary contact
								</p>
								<div className="mt-4 grid gap-4 sm:grid-cols-3">
									<Field
										label="Name"
										placeholder="Full name"
										value={company.contactName}
										onChange={(v) => setCompany({ ...company, contactName: v })}
									/>
									<Field
										label="Email"
										placeholder="name@company.ng"
										value={company.contactEmail}
										onChange={(v) => setCompany({ ...company, contactEmail: v })}
										type="email"
									/>
									<Field
										label="Phone"
										placeholder="+234 ..."
										value={company.contactPhone}
										onChange={(v) => setCompany({ ...company, contactPhone: v })}
									/>
								</div>
							</div>
						</section>
					)}

					{step === "documents" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader
								title="KYC documents"
								detail="Upload or reference"
								inline
							/>
							<p className="text-[13px] leading-6 text-ink-soft">
								Select files below. File names stay in this browser and are not uploaded
								or scanned by a service.
							</p>

							<div className="mt-5 grid gap-3">
								<DocumentRow
									label="CAC certificate of incorporation"
									detail="Required · PDF or image"
									checked={documents.cacCertificate}
									required
									onToggle={() =>
										setDocuments({ ...documents, cacCertificate: !documents.cacCertificate })
									}
									onUpload={(files) => setDocuments({ ...documents, cacCertificate: files.length > 0 })}
								/>
								<DocumentRow
									label="TIN certificate"
									detail="Required · PDF or image"
									checked={documents.tinCertificate}
									required
									onToggle={() =>
										setDocuments({ ...documents, tinCertificate: !documents.tinCertificate })
									}
									onUpload={(files) => setDocuments({ ...documents, tinCertificate: files.length > 0 })}
								/>
								<DocumentRow
									label="Directors and shareholders list"
									detail="Optional · PDF"
									checked={documents.directorsList}
									onToggle={() =>
										setDocuments({ ...documents, directorsList: !documents.directorsList })
									}
									onUpload={(files) => setDocuments({ ...documents, directorsList: files.length > 0 })}
								/>
								<DocumentRow
									label="Utility bill (proof of address)"
									detail="Optional · PDF or image"
									checked={documents.utilityBill}
									onToggle={() =>
										setDocuments({ ...documents, utilityBill: !documents.utilityBill })
									}
									onUpload={(files) => setDocuments({ ...documents, utilityBill: files.length > 0 })}
								/>
							</div>

							<div className="mt-6 rounded-xl bg-sand p-5 ring-1 ring-line">
								<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
									Operating licence (where applicable)
								</p>
								<p className="mt-2 text-[12px] leading-5 text-ink-soft">
									If your organisation holds a licence relevant to the cargo it handles
									(for example, a clearing licence or a regulated product licence),
									provide the reference and upload the certificate.
								</p>
								<div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
									<Field
										label="Licence reference"
										placeholder="e.g. NCS/CLR/2024/04182"
										value={documents.licenceReference}
										onChange={(v) => setDocuments({ ...documents, licenceReference: v })}
										mono
									/>
									<LocalFilePicker
										accept=".pdf,.jpg,.jpeg,.png"
										multiple={false}
										buttonLabel={documents.licenceFile ? "Replace certificate" : "Attach certificate"}
										onFilesSelected={(files) => setDocuments({ ...documents, licenceFile: files.length > 0 })}
									/>
								</div>
							</div>
						</section>
					)}

					{step === "signatories" && (
						<section className="space-y-4">
							<div className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
								<SectionHeader
									title="Authorised signatories"
									detail="Who can act for the account"
									inline
								/>
								<p className="text-[13px] leading-6 text-ink-soft">
									List the people authorised to act on behalf of your organisation on
										the platform. Each signatory's identity is verified during KYC review.
								</p>
							</div>

							{signatories.map((sig, index) => (
								<div
									key={sig.id}
									className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7"
								>
									<div className="mb-4 flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="grid size-8 place-items-center rounded-md bg-orange/10 font-mono text-[10px] font-semibold text-orange-deep">
											</div>
											<p className="font-display text-sm font-bold text-ink">
												Signatory {index + 1}
											</p>
										</div>
										{signatories.length > 1 && (
											<button
												type="button"
												onClick={() => removeSignatory(sig.id)}
												aria-label={`Remove signatory ${index + 1}`}
												className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand hover:text-coral"
											>
												<X className="size-3.5" />
											</button>
										)}
									</div>

									<div className="grid gap-4 sm:grid-cols-2">
										<Field
											label="Full name"
											placeholder="e.g. Adewale Ogundipe"
											value={sig.name}
											onChange={(v) => updateSignatory(sig.id, { name: v })}
											required
										/>
										<Field
											label="Role"
											placeholder="e.g. Managing Director"
											value={sig.role}
											onChange={(v) => updateSignatory(sig.id, { role: v })}
										/>
										<Field
											label="Email"
											placeholder="name@company.ng"
											value={sig.email}
											onChange={(v) => updateSignatory(sig.id, { email: v })}
											type="email"
											required
										/>
										<Field
											label="Phone"
											placeholder="+234 ..."
											value={sig.phone}
											onChange={(v) => updateSignatory(sig.id, { phone: v })}
										/>
									</div>

									<div className="mt-4 grid gap-4 sm:grid-cols-3">
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												ID type
											</span>
											<select
												value={sig.idType}
												onChange={(e) => updateSignatory(sig.id, { idType: e.target.value })}
												className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
											>
												<option value="NIN">NIN</option>
												<option value="International passport">International passport</option>
												<option value="Driver's licence">Driver's licence</option>
												<option value="Voter's card">Voter's card</option>
											</select>
										</label>
										<Field
											label="ID number"
											placeholder="e.g. 1234 5678 9012"
											value={sig.idNumber}
											onChange={(v) => updateSignatory(sig.id, { idNumber: v })}
											mono
											required
										/>
										<label className="block">
											<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
												Permission scope
											</span>
											<select
												value={sig.scope}
												onChange={(e) =>
													updateSignatory(sig.id, {
														scope: e.target.value as SignatoryDraft["scope"],
													})
												}
												className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink outline-none"
											>
												<option value="full">Full account access</option>
												<option value="finance">Finance & billing only</option>
												<option value="operations">Operations only</option>
											</select>
										</label>
									</div>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								className="border-line bg-paper text-ink"
								onClick={addSignatory}
							>
								<Users className="mr-1.5 size-4" /> Add another signatory
							</Button>

							<div className="rounded-xl bg-sand p-5 ring-1 ring-line">
								<div className="flex items-start gap-3">
									<UserCheck className="mt-0.5 size-4 shrink-0 text-orange" />
									<div>
										<p className="text-[13px] font-semibold text-ink">
											At least one signatory is required
										</p>
										<p className="mt-1 text-[12px] leading-5 text-ink-soft">
											The first signatory should have full account access. Additional
											signatories can be scoped to finance or operations.
										</p>
									</div>
								</div>
							</div>
						</section>
					)}

					{step === "review" && (
						<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-7">
							<SectionHeader title="Review" detail="Confirm before submitting" inline />

							<div className="space-y-5">
								<ReviewBlock title="Company details" icon={Building2}>
									<Row label="Legal name" value={company.legalName || "—"} />
									<Row label="Trading name" value={company.tradingName || "—"} />
									<Row label="RC number" value={company.rcNumber || "—"} mono />
									<Row label="TIN" value={company.tin || "—"} mono />
									<Row label="Registered address" value={company.registeredAddress || "—"} />
									<Row label="Operating address" value={company.operatingAddress || "—"} />
									<Row label="Primary contact" value={company.contactName || "—"} />
									<Row label="Contact email" value={company.contactEmail || "—"} mono />
								</ReviewBlock>

								<ReviewBlock title="KYC documents" icon={FileCheck2}>
									<Row
										label="CAC certificate"
										value={documents.cacCertificate ? "Attached" : "Not provided"}
									/>
									<Row
										label="TIN certificate"
										value={documents.tinCertificate ? "Attached" : "Not provided"}
									/>
									<Row
										label="Directors list"
										value={documents.directorsList ? "Attached" : "Not provided"}
									/>
									<Row
										label="Utility bill"
										value={documents.utilityBill ? "Attached" : "Not provided"}
									/>
									<Row
										label="Operating licence reference"
										value={documents.licenceReference || "—"}
										mono
									/>
									<Row
										label="Operating licence file"
										value={documents.licenceFile ? "Attached" : "Not provided"}
									/>
								</ReviewBlock>

								<ReviewBlock title="Authorised signatories" icon={Landmark}>
									{signatories
										.filter((s) => s.name.trim())
										.map((s) => (
											<Row
												key={s.id}
												label={s.name}
												value={`${s.role} · ${s.scope} · ${s.idType} ${s.idNumber}`}
												mono
											/>
										))}
								</ReviewBlock>
							</div>

							<label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
								<input
									type="checkbox"
									checked={acknowledged}
									onChange={(e) => setAcknowledged(e.target.checked)}
									className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
								/>
								<span className="text-[12px] leading-6 text-ink">
									I confirm the details provided are accurate to the best of my
									knowledge, and I understand that TRINŪ may request additional
									information or documentation as part of the compliance review.
								</span>
							</label>

							<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
								<Button
									type="button"
									variant="ghost"
									onClick={goBack}
									className="text-ink-soft"
								>
									<ChevronLeft className="mr-1 size-4" /> Back
								</Button>
								<Button
									type="submit"
									disabled={submitting || !acknowledged}
									className={cn(
										"bg-orange text-white hover:bg-orange-deep",
										(submitting || !acknowledged) && "opacity-60"
									)}
								>
									{submitting ? "Submitting KYC…" : "Submit KYC pack"}
									{!submitting && <ArrowRight />}
								</Button>
							</div>
						</section>
					)}

					{step !== "review" && (
						<div className="flex items-center justify-between gap-3 border-t border-line pt-5">
							<Button
								type="button"
								variant="ghost"
								onClick={goBack}
								disabled={step === "company"}
								className="text-ink-soft"
							>
								<ChevronLeft className="mr-1 size-4" /> Back
							</Button>
							<Button
								type="button"
								className="bg-orange text-white hover:bg-orange-deep"
								onClick={goNext}
							>
								Continue <ArrowRight />
							</Button>
						</div>
					)}
				</form>
			</div>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
	inline = false,
}: {
	title: string;
	detail: string;
	inline?: boolean;
}) {
	return (
		<div
			className={
				"mb-4 flex flex-wrap items-center justify-between gap-3 " +
				(inline ? "px-0 pt-0" : "px-5 pt-5")
			}
		>
			<h3 className="font-display text-sm font-bold tracking-tight text-ink">{title}</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
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
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
				{required && <span className="text-coral"> *</span>}
			</span>
			<Input
				required={required}
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

function TextArea({
	label,
	placeholder,
	value,
	onChange,
}: {
	label: string;
	placeholder: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="block">
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{label}
			</span>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
			/>
		</label>
	);
}

function DocumentRow({
	label,
	detail,
	checked,
	required,
	onToggle,
	onUpload,
}: {
	label: string;
	detail: string;
	checked: boolean;
	required?: boolean;
	onToggle: () => void;
		onUpload: (files: File[]) => void;
}) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors",
				checked
					? "border-orange/30 bg-orange/5"
					: "border-line bg-sand"
			)}
		>
			<div className="flex items-start gap-3">
				<button
					type="button"
					onClick={onToggle}
					aria-pressed={checked}
					className={cn(
						"mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors",
						checked
							? "border-orange bg-orange text-white"
							: "border-line bg-paper"
					)}
				>
					{checked && <Check className="size-3" />}
				</button>
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm font-semibold text-ink">{label}</p>
						{required && (
							<span className="rounded-full bg-coral/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
								Required
							</span>
						)}
					</div>
					<p className="mt-1 text-[12px] leading-5 text-ink-soft">{detail}</p>
				</div>
			</div>
			<LocalFilePicker
				accept=".pdf,.jpg,.jpeg,.png"
				multiple={false}
				buttonLabel={checked ? "Replace file" : "Attach file"}
				onFilesSelected={onUpload}
			/>
		</div>
	);
}

function ReviewBlock({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon: typeof Building2;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
			<div className="flex items-center gap-2">
				<Icon className="size-4 text-orange" />
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
					{title}
				</p>
			</div>
			<div className="mt-4 space-y-2.5">{children}</div>
		</div>
	);
}

function Row({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex flex-wrap items-baseline justify-between gap-3 text-[12px]">
			<p className="text-ink-soft">{label}</p>
			<p className={cn("text-right text-ink", mono && "font-mono")}>{value}</p>
		</div>
	);
}