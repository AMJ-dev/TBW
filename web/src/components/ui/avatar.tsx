import { cn } from "@/lib/utils";
import { resolveSrc } from "@/lib/functions";

export function Avatar({
	pics,
	fullName,
	size = 32,
	className,
}: {
	pics?: string | null;
	fullName?: string;
	size?: number;
	className?: string;
}) {
	const trimmed = (pics ?? "").trim();
	const isPlaceholder =
		!trimmed ||
		trimmed.toLowerCase() === "avatar.png" ||
		trimmed.toLowerCase().endsWith("/avatar.png");

	const initials = (() => {
		const parts = fullName?.trim().split(/\s+/).filter(Boolean) || [];
		if (parts.length >= 2) {
			return ((parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "")).toUpperCase();
		}
		return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
	})();

	if (!isPlaceholder) {
		return (
			<img
				src={resolveSrc(trimmed)}
				alt={fullName ?? "Profile"}
				className={cn("shrink-0 rounded-full object-cover", className)}
				style={{ width: size, height: size }}
			/>
		);
	}

	return (
		<div
			className={cn(
				"grid shrink-0 place-items-center rounded-full bg-ink font-display font-semibold text-sand",
				className
			)}
			style={{ width: size, height: size, fontSize: size * 0.36 }}
		>
			{initials || "—"}
		</div>
	);
}