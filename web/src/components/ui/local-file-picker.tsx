import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocalFilePickerProps {
	accept?: string;
	buttonLabel?: string;
	multiple?: boolean;
	onFilesSelected?: (files: File[]) => void;
}

export function LocalFilePicker({
	accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx",
	buttonLabel = "Choose files",
	multiple = true,
	onFilesSelected,
}: LocalFilePickerProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [error, setError] = useState("");

	const addFiles = (selection: FileList | null) => {
		if (!selection) return;
		const selected = Array.from(selection);
		const accepted = selected.filter((file) => file.size <= 10 * 1024 * 1024);
		setError(accepted.length === selected.length ? "" : "Each file must be 10 MB or smaller.");
		const next = multiple
			? [...files, ...accepted.filter((file) => !files.some((item) => item.name === file.name && item.lastModified === file.lastModified))]
			: accepted.slice(0, 1);
		setFiles(next);
		onFilesSelected?.(next);
		if (inputRef.current) inputRef.current.value = "";
	};

	const removeFile = (file: File) => {
		const next = files.filter((item) => item !== file);
		setFiles(next);
		onFilesSelected?.(next);
	};

	return (
		<div>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				className="sr-only"
				tabIndex={-1}
				onChange={(event) => addFiles(event.currentTarget.files)}
			/>
			<Button type="button" variant="outline" className="border-line bg-paper text-ink" onClick={() => inputRef.current?.click()}>
				<Upload className="size-4" /> {buttonLabel}
			</Button>
			<p className="mt-2 text-[11px] text-ink-soft">Selected files stay in this browser demo. Nothing is uploaded. Maximum 10 MB per file.</p>
			{error && <p role="alert" className="mt-2 text-xs text-coral">{error}</p>}
			{files.length > 0 && (
				<ul className="mt-3 space-y-2">
					{files.map((file) => (
						<li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 text-xs text-ink">
							<FileText className="size-4 shrink-0 text-orange" />
							<span className="min-w-0 flex-1 truncate">{file.name}</span>
							<span className="font-mono text-[10px] text-ink-soft">{formatSize(file.size)}</span>
							<button type="button" onClick={() => removeFile(file)} aria-label={`Remove ${file.name}`} className="grid size-7 place-items-center rounded-md text-ink-soft hover:bg-sand hover:text-coral">
								<X className="size-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function formatSize(bytes: number) {
	return bytes >= 1024 * 1024
		? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(bytes / 1024))} KB`;
}