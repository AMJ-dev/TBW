import { useRef, useState, type FormEvent } from "react";
import { Link } from "@/components/router-link";
import {
	ArrowRight,
	Check,
	FileCheck2,
	FileText,
	HelpCircle,
	Info,
	ShieldCheck,
	Upload,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DocumentType =
	| "commercial-invoice"
	| "packing-list"
	| "bill-of-lading"
	| "delivery-order"
	| "customs-support"
	| "other";

interface DocumentTypeOption {
	key: DocumentType;
	label: string;
	detail: string;
	required: boolean;
}

const documentTypeOptions: DocumentTypeOption[] = [
	{
		key: "commercial-invoice",
		label: "Commercial invoice",
		detail: "Seller-issued invoice listing goods, values, and terms of sale.",
		required: true,
	},
	{
		key: "packing-list",
		label: "Packing list",
		detail: "Itemised list of packages, quantities, weights, and marks.",
		required: true,
	},
	{
		key: "bill-of-lading",
		label: "Bill of lading",
		detail: "Carrier-issued document covering the shipment of the cargo.",
		required: true,
	},
	{
		key: "delivery-order",
		label: "Delivery order",
		detail: "Authorisation from the shipping line or agent for cargo release.",
		required: false,
	},
	{
		key: "customs-support",
		label: "Customs support document",
		detail: "Any supporting record needed for customs examination coordination.",
		required: false,
	},
	{
		key: "other",
		label: "Other supporting file",
		detail: "Anything else relevant — correspondence, certificates, or notes.",
		required: false,
	},
];

export default function DocumentUploadRoute() {
	const [documentType, setDocumentType] = useState<DocumentType>("commercial-invoice");
	const [reference, setReference] = useState("");
	const [version, setVersion] = useState("");
	const [notes, setNotes] = useState("");
	const [files, setFiles] = useState<{ id: string; name: string; size: string; type: string }[]>([]);
	const [fileError, setFileError] = useState("");
	const fileInput = useRef<HTMLInputElement>(null);

	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const selected = documentTypeOptions.find((o) => o.key === documentType)!;
	const addFiles = (selectedFiles: FileList | null) => {
		if (!selectedFiles) return;
		const accepted = Array.from(selectedFiles).filter((file) =>
			/\.(pdf|jpe?g|png|docx?|xlsx)$/i.test(file.name) && file.size <= 10 * 1024 * 1024
		);
		if (accepted.length !== selectedFiles.length) {
			setFileError("Choose PDF, JPG, PNG, DOC, DOCX, or XLSX files no larger than 10 MB each.");
		} else {
			setFileError("");
		}
		setFiles((current) => [
			...current,
			...accepted
				.filter((file) => !current.some((item) => item.name === file.name && item.size === formatSize(file.size)))
				.map((file) => ({
					id: `${file.name}-${file.lastModified}`,
					name: file.name,
					size: formatSize(file.size),
					type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
				})),
		]);
	};

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
		toast.success("File removed.");
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!reference.trim()) {
			toast.error("Enter the cargo reference this document belongs to.");
			return;
		}
		if (files.length === 0) {
			toast.error("Add at least one file before submitting.");
			return;
		}
		setSubmitting(true);
		setTimeout(() => {
			setSubmitting(false);
			setSubmitted(true);
			toast.success("Documents uploaded locally.");
		}, 700);
	};

	if (submitted) {
		return (
			<AppShell title="Documents uploaded" eyebrow="Document center">
				<div className="mx-auto max-w-2xl rounded-2xl bg-paper p-8 text-center ring-1 ring-line sm:p-10">
					<div className="mx-auto grid size-16 place-items-center rounded-full bg-orange text-white">
						<Check className="size-8" />
					</div>
					<p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-deep">
						Upload complete
					</p>
					<h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
						We have your documents.
					</h2>
					<p className="mx-auto mt-4 max-w-md leading-7 text-ink-soft">
										Your demo upload is complete. The selected filenames were displayed in this screen only;
										nothing was sent or stored.
					</p>

					<div className="mx-auto mt-7 max-w-md rounded-xl bg-sand p-5 ring-1 ring-line">
						<dl className="space-y-2 text-left text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Reference</dt>
								<dd className="font-mono text-ink">TRN-UP-2026-00911</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Document type</dt>
								<dd className="text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Files</dt>
								<dd className="text-ink">{files.length} uploaded</dd>
							</div>
						</dl>
					</div>

					<p className="mx-auto mt-6 max-w-md text-[12px] leading-5 text-ink-soft">
								This is a UI-only demonstration. No file is uploaded, scanned, or sent outside
								your browser.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<Link to="/portal/documents">
							<Button className="bg-orange text-white hover:bg-orange-deep">
								Back to document center <ArrowRight />
							</Button>
						</Link>
						<button
							type="button"
							onClick={() => {
								setSubmitted(false);
									setFiles([]);
							}}
							className="inline-flex"
						>
							<Button variant="outline" className="border-line bg-paper text-ink">
								Upload more
							</Button>
						</button>
					</div>
				</div>
			</AppShell>
		);
	}

	return (
		<AppShell title="Upload documents" eyebrow="Document center">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
						Document center · Upload
					</p>
					<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
						Upload documents
					</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
						Upload commercial invoices, packing lists, bills of lading, delivery orders,
						and any other supporting records to the cargo they belong to. Each upload is
						versioned and logged.
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
				<div className="space-y-5">
					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Document type" detail="Select one" inline />
						<div className="grid gap-3 sm:grid-cols-2">
							{documentTypeOptions.map((option) => {
								const active = documentType === option.key;
								return (
									<button
										key={option.key}
										type="button"
										onClick={() => setDocumentType(option.key)}
										className={cn(
											"flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
											active
												? "border-orange bg-orange/5 ring-1 ring-orange/30"
												: "border-line bg-sand hover:bg-sand-2"
										)}
									>
										<div
											className={cn(
												"grid size-9 shrink-0 place-items-center rounded-md",
												active
													? "bg-orange text-white"
													: "bg-orange/10 text-orange-deep"
											)}
										>
											<FileText className="size-4" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<p className="text-sm font-semibold text-ink">
													{option.label}
												</p>
												{option.required && (
													<span className="rounded-full bg-coral/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-coral">
														Required
													</span>
												)}
											</div>
											<p className="mt-1 text-[12px] leading-5 text-ink-soft">
												{option.detail}
											</p>
										</div>
										{active && (
											<span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
												<Check className="size-3" />
											</span>
										)}
									</button>
								);
							})}
						</div>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Cargo reference" detail="Where it belongs" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Container, package, or consignment reference
							</span>
							<Input
								required
								placeholder="e.g. TRIU1234564, ATNL-2026-014-001, or TRN-IMP-002481"
								value={reference}
								onChange={(e) => setReference(e.target.value)}
								className="mt-2 h-11 border-line bg-sand font-mono text-ink"
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								We match by container number, package mark number, or consignment
								reference. The uploaded documents are attached to the matching cargo
								record.
							</span>
						</label>

						<label className="mt-5 block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Version note (optional)
							</span>
							<Input
								placeholder="e.g. Final · supersedes v1"
								value={version}
								onChange={(e) => setVersion(e.target.value)}
								className="mt-2 h-11 border-line bg-sand text-ink"
							/>
							<span className="mt-2 block text-[11px] leading-5 text-ink-soft">
								If this upload replaces an existing version, note what it supersedes.
							</span>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Files" detail="Attach your documents" inline />
						<div
							className="rounded-xl border border-dashed border-line bg-sand p-6 text-center"
							onDragOver={(event) => event.preventDefault()}
							onDrop={(event) => {
								event.preventDefault();
								addFiles(event.dataTransfer.files);
							}}
						>
							<div className="mx-auto grid size-11 place-items-center rounded-full bg-orange/10 text-orange-deep">
								<Upload className="size-5" />
							</div>
							<p className="mt-4 font-display text-base font-bold text-ink">
								Drop files here or choose from your device
							</p>
							<p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-ink-soft">
								PDF, JPG, PNG, DOC, DOCX, XLSX. Maximum 10 MB per file. Files stay in this
								browser demo and are not uploaded.
							</p>
							<input
								ref={fileInput}
								type="file"
								multiple
								accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
								className="sr-only"
								onChange={(event) => addFiles(event.target.files)}
							/>
							<Button
								type="button"
								variant="outline"
								className="mt-4 border-line bg-paper text-ink"
								onClick={() => fileInput.current?.click()}
							>
								Choose files
							</Button>
							{fileError && <p role="alert" className="mt-3 text-xs text-coral">{fileError}</p>}
						</div>

						{files.length > 0 && (
							<div className="mt-5 rounded-xl bg-paper ring-1 ring-line">
								<div className="flex items-center justify-between border-b border-line px-4 py-3">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
										Ready to upload
									</p>
									<span className="font-mono text-[10px] text-ink-soft">
										{files.length} {files.length === 1 ? "file" : "files"}
									</span>
								</div>
								<ul className="divide-y divide-line">
									{files.map((f) => (
										<li key={f.id} className="flex items-center gap-3 px-4 py-3">
											<div className="grid size-9 shrink-0 place-items-center rounded-md bg-orange/10 font-mono text-[9px] font-semibold text-orange-deep">
												{f.type}
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate font-mono text-[12px] font-medium text-ink">
													{f.name}
												</p>
												<p className="mt-0.5 font-mono text-[10px] text-ink-soft">
													{f.size}
												</p>
											</div>
											<button
												type="button"
												onClick={() => removeFile(f.id)}
												aria-label={`Remove ${f.name}`}
												className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-sand hover:text-coral"
											>
												<X className="size-3.5" />
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<SectionHeader title="Notes" detail="Optional" inline />
						<label className="block">
							<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
								Anything the documentation desk should know
							</span>
							<textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="mt-2 min-h-24 w-full rounded-md border border-line bg-sand px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-orange/30"
								placeholder="e.g. This version supersedes the draft uploaded on 06 Sep."
							/>
						</label>
					</section>

					<section className="rounded-xl bg-paper p-5 ring-1 ring-line sm:p-6">
						<div className="flex items-start gap-3 rounded-xl bg-sand p-4 ring-1 ring-line">
							<ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
							<div>
								<p className="text-[13px] font-semibold text-ink">
										Demo privacy
								</p>
								<p className="mt-1 text-[12px] leading-5 text-ink-soft">
									Selected file names and sizes stay in this screen's local state. Nothing is
									uploaded, scanned, or retained after you leave this page.
								</p>
							</div>
						</div>
					</section>
				</div>

				<aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<SectionHeader title="Summary" detail="Before you submit" inline />
						<dl className="space-y-3 text-[12px]">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Document type</dt>
								<dd className="text-right text-ink">{selected.label}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Cargo reference</dt>
								<dd className="font-mono text-ink">{reference || "—"}</dd>
							</div>
							{version && (
								<div className="flex justify-between gap-3">
									<dt className="text-ink-soft">Version note</dt>
									<dd className="text-right text-ink">{version}</dd>
								</div>
							)}
							<div className="flex justify-between gap-3">
								<dt className="text-ink-soft">Files</dt>
								<dd className="text-ink">{files.length}</dd>
							</div>
						</dl>

						<Button
							type="submit"
							disabled={submitting || files.length === 0}
							className={cn(
								"mt-5 h-11 w-full bg-orange text-white hover:bg-orange-deep",
								(submitting || files.length === 0) && "opacity-60"
							)}
						>
							{submitting ? "Uploading…" : "Upload documents"}
							{!submitting && <ArrowRight />}
						</Button>

						<p className="mt-3 text-center text-[11px] text-ink-soft">
							Documents are versioned and logged to the cargo record.
						</p>
					</div>

					<div className="rounded-xl bg-paper p-5 ring-1 ring-line">
						<div className="flex items-center gap-2">
							<HelpCircle className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
								Required documents
							</p>
						</div>
						<ul className="mt-4 space-y-2 text-[12px] leading-5 text-ink-soft">
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-coral" />
								Commercial invoice
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-coral" />
								Packing list
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-coral" />
								Bill of lading
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-soft/40" />
								Delivery order (where applicable)
							</li>
							<li className="flex items-start gap-2">
								<span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-soft/40" />
								Customs support document (where applicable)
							</li>
						</ul>
						<p className="mt-4 text-[11px] leading-5 text-ink-soft">
							Cargo cannot progress past documentation review until all required records
							are uploaded.
						</p>
					</div>

					<div className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
						<div className="flex items-center gap-2">
							<FileCheck2 className="size-4 text-orange" />
							<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
								Once uploaded
							</p>
						</div>
						<p className="mt-3 text-[12px] leading-5 text-sand/75">
							Each document is reviewed by the documentation desk. Accepted files appear
							on the cargo record with a version, a timestamp, and a verification code.
						</p>
						<Link
							to="/portal/documents"
							className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-orange"
						>
							Open document center <ArrowRight className="size-3.5" />
						</Link>
					</div>
				</aside>
			</form>
		</AppShell>
	);
}

function SectionHeader({
	title,
	detail,
	inline = false,
	dark = false,
}: {
	title: string;
	detail: string;
	inline?: boolean;
	dark?: boolean;
}) {
	return (
		<div
			className={
				"mb-4 flex flex-wrap items-center justify-between gap-3 " +
				(inline ? "px-0 pt-0" : "px-5 pt-5")
			}
		>
			<h3
				className={
					"font-display text-sm font-bold tracking-tight " +
					(dark ? "text-sand" : "text-ink")
				}
			>
				{title}
			</h3>
			<span
				className={
					"font-mono text-[10px] uppercase tracking-[0.14em] " +
					(dark ? "text-sand/50" : "text-ink-soft")
				}
			>
				{detail}
			</span>
		</div>
	);
}

function formatSize(bytes: number) {
	return bytes >= 1024 * 1024
		? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;
}