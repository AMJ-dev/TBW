import {
	NavLink,
	useParams,
	type NavLinkProps,
} from "react-router-dom";

type LinkProps = Omit<NavLinkProps, "to" | "className"> & {
	to: string;
	params?: Record<string, string> | undefined;
	className?: string | undefined;
	activeProps?: { className?: string } | undefined;
	activeOptions?: { exact?: boolean } | undefined;
};

export function Link({
	to,
	params,
	className,
	activeProps,
	activeOptions,
	...props
}: LinkProps) {
	const resolvedTo = Object.entries(params ?? {}).reduce(
		(path, [key, value]) =>
			path.replace(`:${key}`, value).replace(`$${key}`, value),
		to
	);

	return (
		<NavLink
			{...props}
			to={resolvedTo}
			{...(activeOptions?.exact === undefined
				? {}
				: { end: activeOptions.exact })}
			className={({ isActive }) =>
				[className, isActive ? activeProps?.className : undefined]
					.filter(Boolean)
					.join(" ")
			}
		/>
	);
}

export { useParams };