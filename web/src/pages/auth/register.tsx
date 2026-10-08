import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Award,
	Building2,
	Check,
	Eye,
	EyeOff,
	FileCheck2,
	FileText,
	Globe,
	Lock,
	Mail,
	MapPin,
	MessageSquare,
	Paperclip,
	Phone,
	Plus,
	ShieldCheck,
	Trash2,
	Upload,
	User,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";
import { http, type Resp } from "@/lib/httpClient";

type AccountType = "importer" | "agent";

const accountTypes: {
	key: AccountType;
	label: string;
	detail: string;
	icon: typeof User;
}[] = [
	{
		key: "importer",
		label: "Importer / consignee",
		detail: "Direct access for your organisation's cargo.",
		icon: Building2,
	},
	{
		key: "agent",
		label: "Licensed agent",
		detail: "Multi-client access with delegated authority.",
		icon: Users,
	},
];

type DocKey =
	| "cac"
	| "tin"
	| "signatory_id"
	| "directors_list"
	| "utility_bill";

type DocumentSlot = {
	key: DocKey;
	label: string;
	detail: string;
	accept: string;
	required: boolean;
};

const documentSlots: DocumentSlot[] = [
	{
		key: "cac",
		label: "CAC certificate",
		detail: "Certificate of incorporation or business name registration.",
		accept: "application/pdf,image/*",
		required: true,
	},
	{
		key: "tin",
		label: "TIN certificate",
		detail: "Tax Identification Number certificate issued by FIRS.",
		accept: "application/pdf,image/*",
		required: true,
	},
	{
		key: "signatory_id",
		label: "Authorised signatory ID",
		detail: "National ID, driver's licence, or international passport.",
		accept: "application/pdf,image/*",
		required: true,
	},
	{
		key: "directors_list",
		label: "Directors and shareholders list",
		detail: "A current list of the company's directors and shareholders.",
		accept: "application/pdf",
		required: true,
	},
	{
		key: "utility_bill",
		label: "Utility bill (proof of address)",
		detail: "A recent utility bill showing the organisation's registered address.",
		accept: "application/pdf,image/*",
		required: true,
	},
];

type LicenceType =
	| "ncs_customs_agent"
	| "nafdac"
	| "son"
	| "naqs"
	| "soncap"
	| "other";

const licenceTypes: { key: LicenceType; label: string }[] = [
	{ key: "ncs_customs_agent", label: "NCS Customs Agent Licence" },
	{ key: "nafdac", label: "NAFDAC Permit" },
	{ key: "son", label: "SON (Standards Organisation of Nigeria)" },
	{ key: "naqs", label: "NAQS (Quarantine Service)" },
	{ key: "soncap", label: "SONCAP Certificate" },
	{ key: "other", label: "Other operational licence" },
];

type LicenceEntry = {
	id: string;
	type: LicenceType | "";
	reference: string;
	file: File | null;
};

const sectorOptions = [
	"Agriculture & Agro-processing",
	"Automotive & Spare Parts",
	"Aviation & Aerospace",
	"Chemicals & Petrochemicals",
	"Construction & Building Materials",
	"Consumer Goods & FMCG",
	"E-commerce & Digital Services",
	"Education & Training",
	"Electronics & Technology",
	"Energy, Power & Utilities",
	"Engineering & Technical Services",
	"Environment, Waste Management & Recycling",
	"Fashion, Textiles & Apparel",
	"Financial Services, Banking & Fintech",
	"Food & Beverage",
	"Healthcare & Pharmaceuticals",
	"Hospitality, Tourism & Entertainment",
	"Industrial & Manufacturing",
	"Infrastructure & Real Estate",
	"Insurance & Risk Management",
	"Legal, Consulting & Professional Services",
	"Logistics, Freight Forwarding & Supply Chain",
	"Machinery & Heavy Equipment",
	"Maritime, Shipping & Port Operations",
	"Mining, Minerals & Metals",
	"Oil & Gas (Upstream, Midstream & Downstream)",
	"Packaging, Printing & Publishing",
	"Professional, Scientific & Technical Services",
	"Public Sector, Government & NGOs",
	"Retail & Wholesale Distribution",
	"Telecommunications & Media",
	"Transportation & Fleet Management",
	"Water Resources & Sanitation",
	"Other",
] as const;

type Sector = (typeof sectorOptions)[number];

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ALLOWED_PDF_ONLY = ["application/pdf"];

const steps = ["Your details", "Organisation", "Documents", "Verify"] as const;

export default function RegisterPage() {
	const [step, setStep] = useState(0);
	const [accountType, setAccountType] = useState<AccountType>("importer");

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [honeypot, setHoneypot] = useState("");

	const [organisation, setOrganisation] = useState("");
	const [rcNumber, setRcNumber] = useState("");
	const [tin, setTin] = useState("");
	const [dateOfIncorporation, setDateOfIncorporation] = useState("");
	const [sector, setSector] = useState<Sector | "">("");
	const [registeredAddress, setRegisteredAddress] = useState("");
	const [website, setWebsite] = useState("");
	const [role, setRole] = useState("");
	const [agreed, setAgreed] = useState(false);

	const [documents, setDocuments] = useState<Record<DocKey, File | null>>({
		cac: null,
		tin: null,
		signatory_id: null,
		directors_list: null,
		utility_bill: null,
	});

	const [licences, setLicences] = useState<LicenceEntry[]>([
		{
			id: crypto.randomUUID(),
			type: "ncs_customs_agent",
			reference: "",
			file: null,
		},
	]);

	const [emailOtp, setEmailOtp] = useState("");
	const [emailOtpSent, setEmailOtpSent] = useState(false);
	const [emailOtpSending, setEmailOtpSending] = useState(false);
	const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
	const [emailVerified, setEmailVerified] = useState(false);

	const [phoneOtp, setPhoneOtp] = useState("");
	const [phoneOtpSent, setPhoneOtpSent] = useState(false);
	const [phoneOtpSending, setPhoneOtpSending] = useState(false);
	const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
	const [phoneVerified, setPhoneVerified] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [registrationRef, setRegistrationRef] = useState("");

	// Reset verification state whenever email or phone changes.
	useEffect(() => {
		setEmailVerified(false);
		setEmailOtpSent(false);
		setEmailOtp("");
		setRegistrationRef("");
	}, [email]);

	useEffect(() => {
		setPhoneVerified(false);
		setPhoneOtpSent(false);
		setPhoneOtp("");
	}, [phone]);

	const pickDocument = (key: DocKey, file: File | null) => {
		if (!file) {
			setDocuments((prev) => ({ ...prev, [key]: null }));
			return;
		}
		const slot = documentSlots.find((s) => s.key === key);
		const allowed =
			slot?.accept.includes("pdf") && !slot?.accept.includes("image")
				? ALLOWED_PDF_ONLY
				: ALLOWED_MIME;

		if (file.size > MAX_DOC_BYTES) {
			toast.error("Each document must be 5MB or smaller.");
			return;
		}
		if (!allowed.includes(file.type)) {
			toast.error(
				allowed === ALLOWED_PDF_ONLY
					? "Only PDF files are accepted for this document."
					: "Only PDF, JPG, PNG, or WebP files are accepted."
			);
			return;
		}
		setDocuments((prev) => ({ ...prev, [key]: file }));
	};

	const addLicence = () => {
		setLicences((prev) => [
			...prev,
			{ id: crypto.randomUUID(), type: "", reference: "", file: null },
		]);
	};

	const updateLicence = (id: string, patch: Partial<LicenceEntry>) => {
		setLicences((prev) =>
			prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
		);
	};

	const removeLicence = (id: string) => {
		setLicences((prev) => prev.filter((l) => l.id !== id));
	};

	const pickLicenceFile = (id: string, file: File | null) => {
		if (!file) {
			updateLicence(id, { file: null });
			return;
		}
		if (file.size > MAX_DOC_BYTES) {
			toast.error("Each licence document must be 5MB or smaller.");
			return;
		}
		if (!ALLOWED_MIME.includes(file.type)) {
			toast.error("Only PDF, JPG, PNG, or WebP files are accepted.");
			return;
		}
		updateLicence(id, { file });
	};

	const hasRequiredLicence = () => {
		if (accountType !== "agent") return true;
		return licences.some(
			(l) => l.type === "ncs_customs_agent" && l.reference.trim() && l.file
		);
	};

	const next = () => {
		if (step === 0) {
			if (honeypot.trim()) {
				setSubmitted(true);
				return;
			}
			if (!fullName.trim() || !email.trim() || !phone.trim()) {
				toast.error("Enter your name, email, and phone to continue.");
				return;
			}
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				toast.error("Enter a valid email address.");
				return;
			}
			if (password.length < 8) {
				toast.error("Password must be at least 8 characters.");
				return;
			}
			if (password !== confirmPassword) {
				toast.error("Passwords do not match.");
				return;
			}
		}
		if (step === 1) {
			if (honeypot.trim()) {
				setSubmitted(true);
				return;
			}
			if (!organisation.trim()) {
				toast.error("Enter your organisation name to continue.");
				return;
			}
			if (!rcNumber.trim()) {
				toast.error("Enter your RC number to continue.");
				return;
			}
			if (!dateOfIncorporation) {
				toast.error("Select your organisation's date of incorporation.");
				return;
			}
			if (!sector) {
				toast.error("Select your organisation's sector.");
				return;
			}
			if (!registeredAddress.trim()) {
				toast.error("Enter the registered address of your organisation.");
				return;
			}
			if (website.trim() && !/^https?:\/\/.+\..+/i.test(website.trim())) {
				toast.error(
					"Enter a valid website URL (starting with http:// or https://)."
				);
				return;
			}
			if (!agreed) {
				toast.error("Accept the privacy notice and terms to continue.");
				return;
			}
		}
		if (step === 2) {
			if (honeypot.trim()) {
				setSubmitted(true);
				return;
			}
			const missing = documentSlots
				.filter((s) => s.required)
				.map((s) => s.key)
				.filter((key) => !documents[key]);
			if (missing.length > 0) {
				toast.error(
					`Upload all required documents: ${missing
						.map(
							(k) => documentSlots.find((s) => s.key === k)?.label ?? k
						)
						.join(", ")}.`
				);
				return;
			}
			if (!hasRequiredLicence()) {
				toast.error(
					"Licensed agents must upload a valid NCS Customs Agent Licence with its reference number."
				);
				return;
			}
		}
		setStep((s) => s + 1);
	};

	const buildFormData = () => {
		const form = new FormData();
		form.append("full_name", fullName);
		form.append("email", email);
		form.append("phone", phone);
		form.append("password", password);
		form.append("confirm_password", confirmPassword);
		form.append("account_type", accountType);
		form.append("organisation", organisation);
		form.append("rc_number", rcNumber);
		form.append("tin", tin);
		form.append("date_of_incorporation", dateOfIncorporation);
		form.append("sector", sector);
		form.append("registered_address", registeredAddress);
		form.append("website", website.trim());
		form.append("role", role);
		form.append("agreed", agreed ? "1" : "0");

		documentSlots.forEach((slot) => {
			const file = documents[slot.key];
			if (file) form.append(slot.key, file);
		});

		const licenceMeta = licences
			.filter((l) => l.type && l.reference.trim())
			.map((l) => ({ id: l.id, type: l.type, reference: l.reference.trim() }));
		form.append("licences", JSON.stringify(licenceMeta));

		licences.forEach((l, index) => {
			if (l.file) {
				form.append(`licence_file_${index}`, l.file);
				form.append(`licence_id_${index}`, l.id);
			}
		});
		return form;
	};

	const handleSendEmailOtp = async () => {
		if (honeypot.trim()) {
			setSubmitted(true);
			return;
		}
		if (!email.trim()) {
			toast.error("Enter your email before requesting a code.");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			toast.error("Enter a valid email address.");
			return;
		}
		setEmailOtpSending(true);
		try {
			const res = await http.post("register-send-otp/", { email, phone });
			const resp: Resp = res.data;
			if (resp?.error) {
				toast.error(resp.data || "Could not send the verification code.");
			} else {
				const ref =
					res.data?.code?.registration_ref ||
					res.data?.code?.ref ||
					"";
				setRegistrationRef(ref);
				toast.success("Verification code sent to your email.");
				setEmailOtpSent(true);
			}
		} catch {
			toast.error("Could not send the verification code.");
		} finally {
			setEmailOtpSending(false);
		}
	};

	const handleVerifyEmailOtp = async () => {
		if (honeypot.trim()) {
			setSubmitted(true);
			return;
		}
		if (!emailOtp.trim()) {
			toast.error("Enter the email verification code we sent you.");
			return;
		}
		setEmailOtpVerifying(true);
		try {
			const res = await http.post("register-verify-otp/", {
				email,
				verification_code: emailOtp,
				registration_ref: registrationRef,
			});
			const resp: Resp = res.data;
			if (resp?.error) {
				toast.error(
					resp.data || "Email verification failed. Check the code and try again."
				);
			} else {
				toast.success("Email verified.");
				setEmailVerified(true);
			}
		} catch {
			toast.error(
				"Email verification failed. Check the code and try again."
			);
		} finally {
			setEmailOtpVerifying(false);
		}
	};

	const handleSendPhoneOtp = async () => {
		if (!emailVerified) {
			toast.error("Verify your email first before requesting a phone code.");
			return;
		}
		if (honeypot.trim()) {
			setSubmitted(true);
			return;
		}
		if (!phone.trim()) {
			toast.error("Enter your phone number before requesting a code.");
			return;
		}
		setPhoneOtpSending(true);
		try {
			const res = await http.post("register/sms-send-otp/", { registration_ref: registrationRef, phone });
			const resp: Resp = res.data;
			if (resp?.error) {
				toast.error(resp.data || "Could not send the SMS code.");
			} else {
				toast.success("Verification code sent to your phone.");
				setPhoneOtpSent(true);
			}
		} catch {
			toast.error("Could not send the SMS code.");
		} finally {
			setPhoneOtpSending(false);
		}
	};

	const handleVerifyPhoneOtp = async () => {
		if (!emailVerified) {
			toast.error("Verify your email first before verifying your phone.");
			return;
		}
		if (honeypot.trim()) {
			setSubmitted(true);
			return;
		}
		if (!phoneOtp.trim()) {
			toast.error("Enter the SMS verification code we sent you.");
			return;
		}
		setPhoneOtpVerifying(true);
		try {
			const res = await http.post("register/sms-verify-otp/", {
				phone,
				verification_code: phoneOtp,
				registration_ref: registrationRef,
			});
			const resp: Resp = res.data;
			if (resp?.error) {
				toast.error(
					resp.data || "Phone verification failed. Check the code and try again."
				);
			} else {
				toast.success("Phone number verified.");
				setPhoneVerified(true);
			}
		} catch {
			toast.error(
				"Phone verification failed. Check the code and try again."
			);
		} finally {
			setPhoneOtpVerifying(false);
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (honeypot.trim()) {
			setSubmitted(true);
			return;
		}
		if (!emailVerified) {
			toast.error("Verify your email before completing registration.");
			return;
		}
		if (!phoneVerified) {
			toast.error(
				"Verify your phone number before completing registration."
			);
			return;
		}
		setSubmitting(true);
		try {
			const form = buildFormData();
			form.append("email_verification_code", emailOtp);
			form.append("phone_verification_code", phoneOtp);
			form.append("registration_ref", registrationRef);

			const res = await http.post("sign-up/", form, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const resp: Resp = res.data;
			if (resp?.error) {
				toast.error(resp.data || "Registration failed. Please try again.");
			} else {
				toast.success(resp?.data || "Registration submitted.");
				setSubmitted(true);
			}
		} catch {
			toast.error("Registration failed. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		return (
			<PublicFrame>
				<main className="bg-paper">
					<section className="relative overflow-hidden border-b border-line">
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl"
						/>
						<div
							aria-hidden="true"
							className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl"
						/>
						<div className="relative mx-auto grid max-w-3xl place-items-center px-5 py-24 text-center lg:px-8">
							<div>
								<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
									<Check className="size-8" />
								</div>
								<PublicKicker>Request submitted</PublicKicker>
								<h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
									We'll be in touch.
								</h1>
								<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
									Your registration has been received for review. A TRÏNŪ
									coordinator will verify your organisation details and contact
									you using the information provided.
								</p>

								<div className="mx-auto mt-7 max-w-sm rounded-xl bg-sand p-5 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Reference
									</p>
									<p className="mt-2 font-mono text-lg font-bold text-ink">
										{registrationRef || "TRN-REG-2026-00417"}
									</p>
								</div>

								<div className="mt-8 flex flex-wrap justify-center gap-3">
									<Link to="/">
										<Button
											variant="outline"
											className="border-line bg-paper text-ink hover:bg-sand"
										>
											Return home
										</Button>
									</Link>
									<Link to="/login">
										<Button className="bg-orange text-white hover:bg-orange-deep">
											Go to sign-in <ArrowRight />
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</section>
				</main>
			</PublicFrame>
		);
	}

	return (
		<PublicFrame>
			<main className="bg-paper">
				<section className="relative overflow-hidden border-b border-line">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl"
					/>

					<div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:px-8 lg:py-20">
						<div>
							<PublicKicker>Create an account</PublicKicker>
							<h1 className="mt-3 max-w-lg font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
								Access the{" "}
								<span className="text-orange">stakeholder portal.</span>
							</h1>
							<p className="mt-5 max-w-lg leading-7 text-ink-soft">
								Register as an importer or a licensed agent to track
								consignments, manage documents, coordinate collection, and view
								financial obligations — all from one operating record.
							</p>

							<div className="mt-10 grid gap-3">
								{[
									{
										icon: ShieldCheck,
										label: "KYC before approval",
										detail:
											"CAC, TIN, licences, and authorised signatory verified before access.",
									},
									{
										icon: FileCheck2,
										label: "Documented coordination",
										detail:
											"Every handoff is timestamped, attributed, and searchable.",
									},
									{
										icon: MapPin,
										label: "Abuja flagship facility",
										detail:
											"The first step in a broader inland bonded network.",
									},
								].map((item) => {
									const Icon = item.icon;
									return (
										<div
											key={item.label}
											className="flex items-start gap-4 rounded-xl bg-sand p-4 ring-1 ring-line"
										>
											<div className="grid size-10 shrink-0 place-items-center rounded-md bg-orange text-white">
												<Icon className="size-5" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-semibold text-ink">
													{item.label}
												</p>
												<p className="mt-0.5 text-[12px] leading-5 text-ink-soft">
													{item.detail}
												</p>
											</div>
										</div>
									);
								})}
							</div>

							<ol className="mt-10 space-y-5 border-t border-line pt-8">
								{[
									[
										"Submit your details",
										"Tell us who you are and what your organisation does.",
									],
									[
										"Upload KYC documents",
										"CAC certificate, TIN, operational licences, and authorised signatory ID.",
									],
									[
										"Organisation review",
										"We verify RC, TIN, and licence references where applicable.",
									],
									[
										"Access granted",
										"Once approved, you receive credentials and delegation options.",
									],
								].map(([title, detail], i) => (
									<li key={title} className="flex gap-4">
										<span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange font-mono text-[10px] font-semibold text-white">
											0{i + 1}
										</span>
										<div>
											<p className="text-sm font-semibold text-ink">
												{title}
											</p>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												{detail}
											</p>
										</div>
									</li>
								))}
							</ol>

							<div className="mt-10 rounded-2xl bg-slate p-6 text-sand ring-1 ring-slate">
								<div className="flex items-center gap-2">
									<ShieldCheck className="size-4 text-orange" />
									<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
										Important boundary
									</p>
								</div>
								<p className="mt-3 text-[12px] leading-6 text-sand/75">
									TRÏNŪ provides facilities and coordination. Customs
									decisions and other statutory outcomes remain with the
									competent authority.
								</p>
								<Link
									to="/compliance"
									className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange hover:text-orange-deep"
								>
									Read the compliance position{" "}
									<ArrowRight className="size-3.5" />
								</Link>
							</div>
						</div>

						<div className="overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-line">
							<div className="border-b border-line bg-sand p-5 sm:p-7">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="grid size-8 place-items-center rounded-md bg-orange text-white">
											<ShieldCheck className="size-4" />
										</div>
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
											Account registration
										</p>
									</div>
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Step {step + 1} / {steps.length}
									</p>
								</div>
								<h2 className="mt-4 font-display text-2xl font-bold text-ink">
									{steps[step]}
								</h2>
								<div className="mt-4 flex gap-1.5">
									{steps.map((_, i) => (
										<div
											key={i}
											className={
												"h-1 flex-1 rounded-full transition-colors " +
												(i <= step ? "bg-orange" : "bg-line")
											}
										/>
									))}
								</div>
							</div>

							{step < 3 && (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										next();
									}}
									className="p-5 sm:p-7"
								>
									<input
										type="text"
										name="website"
										value={honeypot}
										onChange={(e) => setHoneypot(e.target.value)}
										tabIndex={-1}
										autoComplete="off"
										aria-hidden="true"
										className="hidden"
									/>

									{step === 0 && (
										<div className="space-y-5">
											<div>
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													Account type
												</p>
												<div className="mt-2 grid gap-2">
													{accountTypes.map((t) => {
														const Icon = t.icon;
														const active = accountType === t.key;
														return (
															<label
																key={t.key}
																className={
																	"flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors " +
																	(active
																		? "border-orange bg-orange/10"
																		: "border-line bg-sand hover:bg-sand-2")
																}
															>
																<input
																	type="radio"
																	name="account-type"
																	value={t.key}
																	checked={active}
																	onChange={() => setAccountType(t.key)}
																	className="mt-1 size-3.5 accent-orange"
																/>
																<Icon className="mt-0.5 size-4 shrink-0 text-orange" />
																<div className="min-w-0 flex-1">
																	<p className="text-sm font-semibold text-ink">
																		{t.label}
																	</p>
																	<p className="mt-0.5 text-[11px] text-ink-soft">
																		{t.detail}
																	</p>
																</div>
															</label>
														);
													})}
												</div>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Full name
												</span>
												<div className="relative mt-2">
													<User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														placeholder="Your full name"
														value={fullName}
														onChange={(e) => setFullName(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Work email
													</span>
													<div className="relative mt-2">
														<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
														<Input
															required
															type="email"
															autoComplete="email"
															placeholder="name@company.ng"
															value={email}
															onChange={(e) => setEmail(e.target.value)}
															className="h-11 border-line bg-sand pl-9 text-ink"
														/>
													</div>
												</label>

												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Phone
													</span>
													<div className="relative mt-2">
														<Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
														<Input
															required
															placeholder="+234 803 000 0000"
															value={phone}
															onChange={(e) => setPhone(e.target.value)}
															className="h-11 border-line bg-sand pl-9 text-ink"
														/>
													</div>
												</label>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Password
												</span>
												<div className="relative mt-2">
													<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														type={showPassword ? "text" : "password"}
														autoComplete="new-password"
														placeholder="At least 8 characters"
														value={password}
														onChange={(e) => setPassword(e.target.value)}
														className="h-11 border-line bg-sand pl-9 pr-10 text-ink"
													/>
													<button
														type="button"
														onClick={() => setShowPassword((v) => !v)}
														aria-label={
															showPassword
																? "Hide password"
																: "Show password"
														}
														className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand-2 hover:text-orange"
													>
														{showPassword ? (
															<EyeOff className="size-4" />
														) : (
															<Eye className="size-4" />
														)}
													</button>
												</div>
											</label>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Confirm password
												</span>
												<div className="relative mt-2">
													<Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														type={showPassword ? "text" : "password"}
														autoComplete="new-password"
														placeholder="Re-enter your password"
														value={confirmPassword}
														onChange={(e) =>
															setConfirmPassword(e.target.value)
														}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>
										</div>
									)}

									{step === 1 && (
										<div className="space-y-5">
											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Organisation name
												</span>
												<div className="relative mt-2">
													<Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														required
														placeholder="e.g. Atlantic Trade Nigeria Ltd"
														value={organisation}
														onChange={(e) => setOrganisation(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														RC number
														<span className="ml-1 text-orange">*</span>
													</span>
													<Input
														required
														placeholder="e.g. RC-1284921"
														value={rcNumber}
														onChange={(e) => setRcNumber(e.target.value)}
														className="mt-2 h-11 border-line bg-sand font-mono text-ink"
													/>
												</label>

												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														TIN
													</span>
													<Input
														placeholder="e.g. 20483012-0001"
														value={tin}
														onChange={(e) => setTin(e.target.value)}
														className="mt-2 h-11 border-line bg-sand font-mono text-ink"
													/>
												</label>
											</div>

											<div className="grid gap-4 sm:grid-cols-2">
												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Date of incorporation
														<span className="ml-1 text-orange">*</span>
													</span>
													<Input
														required
														type="date"
														value={dateOfIncorporation}
														onChange={(e) =>
															setDateOfIncorporation(e.target.value)
														}
														className="mt-2 h-11 border-line bg-sand font-mono text-ink"
													/>
												</label>

												<label className="block">
													<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
														Sector
														<span className="ml-1 text-orange">*</span>
													</span>
													<select
														required
														value={sector}
														onChange={(e) =>
															setSector(e.target.value as Sector)
														}
														className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
													>
														<option value="">Select a sector…</option>
														{sectorOptions.map((s) => (
															<option key={s} value={s}>
																{s}
															</option>
														))}
													</select>
												</label>
											</div>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Registered address
													<span className="ml-1 text-orange">*</span>
												</span>
												<div className="relative mt-2">
													<MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-ink-soft" />
													<textarea
														required
														rows={3}
														placeholder="Street, city, state, postal code"
														value={registeredAddress}
														onChange={(e) =>
															setRegisteredAddress(e.target.value)
														}
														className="w-full rounded-md border border-line bg-sand pl-9 pr-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/25"
													/>
												</div>
											</label>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Website
													<span className="ml-1 font-mono text-[10px] text-ink-soft/70">
														(optional)
													</span>
												</span>
												<div className="relative mt-2">
													<Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
													<Input
														type="url"
														inputMode="url"
														placeholder="https://your-company.ng"
														value={website}
														onChange={(e) => setWebsite(e.target.value)}
														className="h-11 border-line bg-sand pl-9 text-ink"
													/>
												</div>
											</label>

											<label className="block">
												<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
													Your role in the organisation
												</span>
												<Input
													placeholder="e.g. Operations Manager"
													value={role}
													onChange={(e) => setRole(e.target.value)}
													className="mt-2 h-11 border-line bg-sand text-ink"
												/>
											</label>

											<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													What happens next
												</p>
												<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														You'll upload KYC documents on the next step.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														We verify your organisation details and licence
														references.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														Once approved, you receive credentials and
														delegation options.
													</li>
												</ul>
											</div>

											<label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
												<input
													type="checkbox"
													checked={agreed}
													onChange={(e) => setAgreed(e.target.checked)}
													className="mt-0.5 size-4 shrink-0 rounded border-line accent-orange"
												/>
												<span className="text-[12px] leading-5 text-ink">
													I accept the{" "}
													<Link
														to="/terms"
														className="font-semibold text-orange"
													>
														terms of use
													</Link>{" "}
													and{" "}
													<Link
														to="/privacy"
														className="font-semibold text-orange"
													>
														privacy notice
													</Link>
													.
												</span>
											</label>
										</div>
									)}

									{step === 2 && (
										<div className="space-y-5">
											<p className="text-[13px] leading-6 text-ink-soft">
												Upload the documents we use to verify your
												organisation. Files are reviewed before access is
												granted and stored securely.
											</p>

											<div className="space-y-3">
												{documentSlots.map((slot) => {
													const file = documents[slot.key];
													return (
														<div
															key={slot.key}
															className="rounded-xl bg-sand p-4 ring-1 ring-line"
														>
															<div className="flex items-start gap-3">
																<div
																	className={
																		"grid size-9 shrink-0 place-items-center rounded-md text-white " +
																		(slot.required
																			? "bg-orange"
																			: "bg-ink")
																	}
																>
																	<FileText className="size-4" />
																</div>
																<div className="min-w-0">
																	<p className="text-sm font-semibold text-ink">
																		{slot.label}
																		{slot.required ? (
																			<span className="ml-1 text-orange">
																				*
																			</span>
																		) : (
																			<span className="ml-1 font-mono text-[10px] text-ink-soft/70">
																				optional
																			</span>
																		)}
																	</p>
																	<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
																		{slot.detail}
																	</p>
																</div>
															</div>

															{file ? (
																<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 ring-1 ring-line">
																	<div className="flex min-w-0 items-center gap-2">
																		<Paperclip className="size-3.5 shrink-0 text-orange" />
																		<span className="truncate font-mono text-[11px] text-ink">
																			{file.name}
																		</span>
																		<span className="shrink-0 font-mono text-[10px] text-ink-soft">
																			{(file.size / 1024).toFixed(0)} KB
																		</span>
																	</div>
																	<button
																		type="button"
																		onClick={() =>
																			pickDocument(slot.key, null)
																		}
																		aria-label={`Remove ${slot.label}`}
																		className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
																	>
																		<Trash2 className="size-3.5" />
																	</button>
																</div>
															) : (
																<label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-paper px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
																	<span className="inline-flex items-center gap-2">
																		<Upload className="size-3.5" />
																		Choose file
																	</span>
																	<span className="font-mono text-[10px] text-ink-soft">
																		{slot.accept.includes("pdf") &&
																		!slot.accept.includes("image")
																			? "PDF · max 5MB"
																			: "PDF, JPG, PNG · max 5MB"}
																	</span>
																	<input
																		type="file"
																		accept={slot.accept}
																		onChange={(e) => {
																			const picked =
																				e.target.files?.[0] ?? null;
																			e.target.value = "";
																			pickDocument(slot.key, picked);
																		}}
																		className="hidden"
																	/>
																</label>
															)}
														</div>
													);
												})}
											</div>

											<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
												<div className="flex items-start justify-between gap-3">
													<div className="flex items-start gap-3">
														<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange text-white">
															<Award className="size-4" />
														</div>
														<div className="min-w-0">
															<p className="text-sm font-semibold text-ink">
																Operational licences
																{accountType === "agent" && (
																	<span className="ml-1 text-orange">
																		*
																	</span>
																)}
															</p>
															<p className="mt-0.5 text-[11px] leading-5 text-ink-soft">
																{accountType === "agent"
																	? "Add each licence your organisation holds. NCS Customs Agent Licence is required for agents."
																	: "Add any operational licences your organisation holds (NAFDAC, SON, NAQS, SONCAP, or others). Optional for importers at registration."}
															</p>
														</div>
													</div>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={addLicence}
														className="border-line bg-paper text-ink hover:bg-sand-2"
													>
														<Plus className="size-3.5" />
														Add licence
													</Button>
												</div>

												<div className="mt-4 space-y-3">
													{licences.length === 0 && (
														<div className="rounded-md border border-dashed border-line bg-paper px-3 py-4 text-center text-[12px] text-ink-soft">
															No licences added yet.
														</div>
													)}

													{licences.map((licence, index) => (
														<div
															key={licence.id}
															className="rounded-lg bg-paper p-3 ring-1 ring-line"
														>
															<div className="flex items-center justify-between gap-3">
																<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
																	Licence {index + 1}
																</p>
																<button
																	type="button"
																	onClick={() => removeLicence(licence.id)}
																	aria-label="Remove licence"
																	className="grid size-7 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
																>
																	<Trash2 className="size-3.5" />
																</button>
															</div>

															<div className="mt-3 grid gap-3 sm:grid-cols-2">
																<label className="block">
																	<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
																		Licence type
																	</span>
																	<select
																		value={licence.type}
																		onChange={(e) =>
																			updateLicence(licence.id, {
																				type: e.target
																					.value as LicenceType,
																			})
																		}
																		className="mt-2 h-11 w-full rounded-md border border-line bg-sand px-3 text-sm text-ink"
																	>
																		<option value="">
																			Select a licence type…
																		</option>
																		{licenceTypes.map((t) => (
																			<option key={t.key} value={t.key}>
																				{t.label}
																			</option>
																		))}
																	</select>
																</label>

																<label className="block">
																	<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
																		Licence reference number
																	</span>
																	<Input
																		placeholder="e.g. NCS/AG/2026/00123"
																		value={licence.reference}
																		onChange={(e) =>
																			updateLicence(licence.id, {
																				reference: e.target.value,
																			})
																		}
																		className="mt-2 h-11 border-line bg-sand font-mono text-ink"
																	/>
																</label>
															</div>

															{licence.file ? (
																<div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-sand px-3 py-2 ring-1 ring-line">
																	<div className="flex min-w-0 items-center gap-2">
																		<Paperclip className="size-3.5 shrink-0 text-orange" />
																		<span className="truncate font-mono text-[11px] text-ink">
																			{licence.file.name}
																		</span>
																		<span className="shrink-0 font-mono text-[10px] text-ink-soft">
																			{(
																				licence.file.size / 1024
																			).toFixed(0)}{" "}
																			KB
																		</span>
																	</div>
																	<button
																		type="button"
																		onClick={() =>
																			pickLicenceFile(licence.id, null)
																		}
																		aria-label="Remove licence file"
																		className="grid size-7 shrink-0 place-items-center rounded-md text-carmine transition-colors hover:bg-carmine/10"
																	>
																		<Trash2 className="size-3.5" />
																	</button>
																</div>
															) : (
																<label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed border-line bg-sand px-3 py-3 text-[12px] text-ink-soft transition-colors hover:border-orange/40 hover:bg-orange/5 hover:text-orange">
																	<span className="inline-flex items-center gap-2">
																		<Upload className="size-3.5" />
																		Upload licence document
																	</span>
																	<span className="font-mono text-[10px] text-ink-soft">
																		PDF, JPG, PNG · max 5MB
																	</span>
																	<input
																		type="file"
																		accept="application/pdf,image/*"
																		onChange={(e) => {
																			const picked =
																				e.target.files?.[0] ?? null;
																			e.target.value = "";
																			pickLicenceFile(
																				licence.id,
																				picked
																			);
																		}}
																		className="hidden"
																	/>
																</label>
															)}
														</div>
													))}
												</div>
											</div>

											<div className="rounded-xl bg-sand p-4 ring-1 ring-line">
												<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
													File requirements
												</p>
												<ul className="mt-3 space-y-2 text-[12px] leading-5 text-ink-soft">
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														PDF, JPG, PNG, or WebP · max 5MB per file.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														Directors and shareholders list must be a PDF.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														Documents must be current and legible.
													</li>
													<li className="flex items-start gap-2">
														<span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
														Additional licences can be added during onboarding
														if not available now.
													</li>
												</ul>
											</div>
										</div>
									)}

									<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep((s) => Math.max(0, s - 1))}
											disabled={step === 0}
											className="text-ink-soft"
										>
											Back
										</Button>
										<Button
											type="submit"
											className="bg-orange text-white hover:bg-orange-deep"
										>
											Continue <ArrowRight />
										</Button>
									</div>
								</form>
							)}

							{step === 3 && (
								<form onSubmit={handleSubmit} className="p-5 sm:p-7">
									<input
										type="text"
										name="website"
										value={honeypot}
										onChange={(e) => setHoneypot(e.target.value)}
										tabIndex={-1}
										autoComplete="off"
										aria-hidden="true"
										className="hidden"
									/>

									{/* EMAIL VERIFICATION */}
									<div
										className={
											"rounded-xl p-4 ring-1 transition-colors " +
											(emailVerified
												? "bg-orange/5 ring-orange/25"
												: "bg-sand ring-line")
										}
									>
										<div className="flex items-start gap-3">
											<div
												className={
													"grid size-9 shrink-0 place-items-center rounded-md text-white " +
													(emailVerified ? "bg-orange" : "bg-ink")
												}
											>
												<Mail className="size-4" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														Email verification
													</p>
													{emailVerified && (
														<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
															<Check className="size-3" />
															Verified
														</span>
													)}
												</div>
												<p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
													{email || "your email"}
												</p>
											</div>
										</div>

										{!emailVerified && (
											<div className="mt-4 space-y-3">
												<Button
													type="button"
													onClick={handleSendEmailOtp}
													disabled={emailOtpSending}
													variant={emailOtpSent ? "outline" : "default"}
													className={
														emailOtpSent
															? "border-line bg-paper text-ink hover:bg-sand"
															: "bg-orange text-white hover:bg-orange-deep"
													}
												>
													{emailOtpSending
														? "Sending code…"
														: emailOtpSent
														? "Resend email code"
														: "Send email code"}
												</Button>

												<div className="flex flex-col gap-2 sm:flex-row">
													<Input
														required
														inputMode="numeric"
														autoComplete="one-time-code"
														placeholder="000000"
														maxLength={6}
														value={emailOtp}
														onChange={(e) => setEmailOtp(e.target.value)}
														className="h-12 border-line bg-paper text-center font-mono text-lg tracking-[0.4em] text-ink"
													/>
													<Button
														type="button"
														onClick={handleVerifyEmailOtp}
														disabled={emailOtpVerifying || !emailOtp.trim()}
														className="h-12 bg-orange text-white hover:bg-orange-deep"
													>
														{emailOtpVerifying
															? "Verifying…"
															: "Verify email"}
													</Button>
												</div>
											</div>
										)}
									</div>

									{/* PHONE VERIFICATION — locked until email is verified */}
									<div
										className={
											"mt-4 rounded-xl p-4 ring-1 transition-colors " +
											(phoneVerified
												? "bg-orange/5 ring-orange/25"
												: emailVerified
												? "bg-sand ring-line"
												: "bg-sand-2 ring-line opacity-70")
										}
										aria-disabled={!emailVerified}
									>
										<div className="flex items-start gap-3">
											<div
												className={
													"grid size-9 shrink-0 place-items-center rounded-md text-white " +
													(phoneVerified
														? "bg-orange"
														: emailVerified
														? "bg-ink"
														: "bg-ink/40")
												}
											>
												{emailVerified ? (
													<MessageSquare className="size-4" />
												) : (
													<Lock className="size-4" />
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-semibold text-ink">
														Phone verification
													</p>
													{phoneVerified && (
														<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
															<Check className="size-3" />
															Verified
														</span>
													)}
													{!emailVerified && !phoneVerified && (
														<span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft ring-1 ring-line">
															<Lock className="size-3" />
															Locked
														</span>
													)}
												</div>
												<p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">
													{phone || "your phone"}
												</p>
												{!emailVerified && (
													<p className="mt-1 text-[11px] leading-5 text-ink-soft">
														Verify your email first. This step unlocks
														automatically once your email is confirmed.
													</p>
												)}
											</div>
										</div>

										{!phoneVerified && emailVerified && (
											<div className="mt-4 space-y-3">
												<Button
													type="button"
													onClick={handleSendPhoneOtp}
													disabled={phoneOtpSending}
													variant={phoneOtpSent ? "outline" : "default"}
													className={
														phoneOtpSent
															? "border-line bg-paper text-ink hover:bg-sand"
															: "bg-orange text-white hover:bg-orange-deep"
													}
												>
													{phoneOtpSending
														? "Sending SMS…"
														: phoneOtpSent
														? "Resend SMS code"
														: "Send SMS code"}
												</Button>

												<div className="flex flex-col gap-2 sm:flex-row">
													<Input
														required
														inputMode="numeric"
														autoComplete="one-time-code"
														placeholder="000000"
														maxLength={6}
														value={phoneOtp}
														onChange={(e) => setPhoneOtp(e.target.value)}
														className="h-12 border-line bg-paper text-center font-mono text-lg tracking-[0.4em] text-ink"
													/>
													<Button
														type="button"
														onClick={handleVerifyPhoneOtp}
														disabled={phoneOtpVerifying || !phoneOtp.trim()}
														className="h-12 bg-orange text-white hover:bg-orange-deep"
													>
														{phoneOtpVerifying
															? "Verifying…"
															: "Verify phone"}
													</Button>
												</div>
											</div>
										)}

										{!phoneVerified && !emailVerified && (
											<div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
												<Input
													disabled
													placeholder="••••••"
													className="h-12 cursor-not-allowed border-line bg-paper text-center font-mono text-lg tracking-[0.4em] text-ink-soft opacity-60"
												/>
												<Button
													type="button"
													disabled
													className="h-12 cursor-not-allowed bg-orange text-white opacity-40"
												>
													Locked
												</Button>
											</div>
										)}
									</div>

									<div className="mt-5 rounded-xl bg-sand p-4 ring-1 ring-line">
										<p className="text-[12px] leading-5 text-ink-soft">
											Verify your email first. Phone verification unlocks
											automatically once your email is confirmed. Both must be
											verified before registration can be completed.
										</p>
									</div>

									<div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
										<Button
											type="button"
											variant="ghost"
											onClick={() => setStep(2)}
											className="text-ink-soft"
										>
											Back
										</Button>
										<Button
											type="submit"
											disabled={submitting || !emailVerified || !phoneVerified}
											className="bg-orange text-white hover:bg-orange-deep disabled:opacity-60"
										>
											{submitting ? "Submitting…" : "Complete registration"}{" "}
											<ArrowRight />
										</Button>
									</div>
								</form>
							)}
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}