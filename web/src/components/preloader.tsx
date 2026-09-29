export default function Preloader() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-paper">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-40 -top-40 size-[620px] rounded-full bg-orange/20 blur-3xl"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -left-40 bottom-0 size-[480px] rounded-full bg-carmine/15 blur-3xl"
			/>

			<div className="relative flex flex-col items-center gap-6">
				<div className="relative grid size-16 place-items-center">
					<span className="absolute inset-0 animate-ping rounded-full bg-orange/20" />
					<span className="absolute inset-2 rounded-full border border-orange/30" />
					<span className="size-10 animate-spin rounded-full border-2 border-orange/25 border-t-orange" />
				</div>

				<div className="text-center">
					<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-orange">
						TRÏNŪ
					</p>
					<p className="mt-2 font-display text-sm font-semibold text-ink">
						Loading the terminal
					</p>
					<p className="mt-1 text-[11px] text-ink-soft">
						Preparing the operating record…
					</p>
				</div>

				<div className="flex items-center gap-1.5">
					<span className="size-1.5 animate-pulse rounded-full bg-orange [animation-delay:-0.3s]" />
					<span className="size-1.5 animate-pulse rounded-full bg-orange [animation-delay:-0.15s]" />
					<span className="size-1.5 animate-pulse rounded-full bg-orange" />
				</div>
			</div>
		</div>
	);
}