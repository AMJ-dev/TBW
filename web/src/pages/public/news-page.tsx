import { useState, useMemo } from "react";
import { Link } from "@/components/router-link";
import { ArrowRight, Bell, Calendar, Check, Clock3, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PublicFrame, PublicKicker } from "@/components/public/public-shell";

const notices = [
	{
		date: "09 Sep 2026",
		category: "Examination",
		title: "Afternoon examination window confirmed",
		body: "Examination Area 1 is reserved from 14:00 to 16:30. Present only cargo with complete supporting records.",
	},
	{
		date: "08 Sep 2026",
		category: "Gate",
		title: "Managed morning queue at Gate 3",
		body: "Appointment holders should arrive within their confirmed slot while morning receiving activity is coordinated.",
	},
	{
		date: "05 Sep 2026",
		category: "Documents",
		title: "Supporting record checklist updated",
		body: "New cargo files should include the commercial invoice, packing list, bill of lading, and applicable support records.",
	},
];

const categories = ["All", "Examination", "Gate", "Documents"] as const;
type Category = (typeof categories)[number];

export function NewsPage() {
	const [activeCategory, setActiveCategory] = useState<Category>("All");

	const filteredNotices = useMemo(() => {
		if (activeCategory === "All") return notices;
		return notices.filter((n) => n.category === activeCategory);
	}, [activeCategory]);

	return (
		<PublicFrame>
			<main>
				{/* HERO */}
				<section className="relative overflow-hidden border-b border-line bg-paper">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-orange/20 blur-3xl"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-carmine/15 blur-3xl"
					/>
					<div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:px-8 lg:py-20">
						<div>
							<PublicKicker>News & notices</PublicKicker>
							<h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
								Operational information worth{" "}
								<span className="text-orange">planning around.</span>
							</h1>
							<p className="mt-5 max-w-xl leading-7 text-ink-soft">
								Planned examination windows, gate coordination, and documentation updates
								— published before they affect your next move.
							</p>
						</div>
						<div className="grid grid-cols-3 gap-3">
							{[
								["03", "Active notices"],
								["03", "Categories"],
								["24/7", "Visibility"],
							].map(([value, label]) => (
								<div key={label} className="rounded-xl bg-sand p-3 ring-1 ring-line">
									<p className="font-display text-xl font-bold text-ink">{value}</p>
									<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
										{label}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* NOTICES */}
				<section className="bg-sand">
					<div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
						<div className="grid gap-10 lg:grid-cols-[1fr_300px]">
							<div>
								<div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
									<div className="flex items-center gap-2">
										<Bell className="size-4 text-orange" />
										<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
											Latest notices
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
											<Filter className="size-3" /> Filter:
										</span>
										{categories.map((cat) => (
											<button
												key={cat}
												type="button"
												onClick={() => setActiveCategory(cat)}
												className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
													activeCategory === cat
														? "bg-orange text-white"
														: "bg-paper text-ink-soft ring-1 ring-line hover:bg-sand-2 hover:text-ink"
												}`}
											>
												{cat}
											</button>
										))}
									</div>
								</div>
								<div className="space-y-4">
									{filteredNotices.length === 0 ? (
										<div className="rounded-2xl bg-paper p-8 text-center ring-1 ring-line">
											<p className="text-sm text-ink-soft">
												No notices in this category yet.
											</p>
										</div>
									) : (
										filteredNotices.map((notice) => {
											const originalIndex = notices.indexOf(notice);
											return (
												<article
													key={notice.title}
													className="group relative overflow-hidden rounded-2xl bg-paper p-6 ring-1 ring-line transition-all duration-300 hover:-translate-y-0.5 hover:ring-orange/30 hover:shadow-lg sm:p-7"
												>
													<div
														aria-hidden="true"
														className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-orange/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
													/>
													<div className="relative flex flex-wrap items-start justify-between gap-3">
														<div className="flex items-center gap-3">
															<span className="grid size-9 place-items-center rounded-md bg-orange text-white">
																<Calendar className="size-4" />
															</span>
															<div>
																<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
																	{notice.date}
																</p>
																<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-orange">
																	{notice.category}
																</p>
															</div>
														</div>
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
															0{notices.length - originalIndex}
														</span>
													</div>
													<h2 className="relative mt-5 font-display text-xl font-bold text-ink sm:text-2xl">
														{notice.title}
													</h2>
													<p className="relative mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
														{notice.body}
													</p>
													<div className="relative mt-5 flex items-center justify-between border-t border-line pt-4">
														<Button
															variant="ghost"
															className="px-0 text-orange hover:bg-transparent hover:text-orange-deep"
															onClick={() =>
																toast.success(
																	`Notice ${originalIndex + 1} saved for reference.`
																)
															}
														>
															<Check className="size-4" /> Save notice
														</Button>
														<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
															Ref · TRN-NTC-{String(originalIndex + 1).padStart(3, "0")}
														</span>
													</div>
												</article>
											);
										})
									)}
								</div>
							</div>

							<aside className="h-fit space-y-4 lg:sticky lg:top-24">
								{/* Slate formal side panel */}
								<div className="relative overflow-hidden rounded-2xl bg-slate p-6 text-sand ring-1 ring-slate">
									<div
										aria-hidden="true"
										className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-orange/25 blur-3xl"
									/>
									<div className="relative">
										<div className="flex items-center gap-2">
											<Clock3 className="size-4 text-orange" />
											<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange">
												Plan before arrival
											</p>
										</div>
										<h2 className="mt-3 font-display text-xl font-bold text-sand">
											Check cargo readiness before dispatching a truck.
										</h2>
										<p className="mt-3 text-sm leading-6 text-sand/75">
											Confirm the latest gate notice, examination window, and terminal
											reference before arrival.
										</p>
										<Link to="/tracking">
											<Button className="mt-5 w-full bg-orange text-white hover:bg-orange-deep">
												Check cargo status <ArrowRight />
											</Button>
										</Link>
									</div>
								</div>

								<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Notice categories
									</p>
									<ul className="mt-4 space-y-2.5">
										{(["Examination", "Gate", "Documents"] as const).map((category) => {
											const count = notices.filter((n) => n.category === category).length;
											const isActive = activeCategory === category;
											return (
												<li key={category}>
													<button
														type="button"
														onClick={() =>
															setActiveCategory(isActive ? "All" : category)
														}
														className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
															isActive
																? "bg-orange text-white"
																: "bg-sand text-ink hover:bg-sand-2"
														}`}
													>
														<span>{category}</span>
														<span
															className={`font-mono text-[10px] ${
																isActive ? "text-white/80" : "text-ink-soft"
															}`}
														>
															{count}
														</span>
													</button>
												</li>
											);
										})}
									</ul>
									{activeCategory !== "All" && (
										<button
											type="button"
											onClick={() => setActiveCategory("All")}
											className="mt-3 text-[11px] font-semibold text-orange hover:text-orange-deep"
										>
											Clear filter
										</button>
									)}
								</div>

								<div className="rounded-2xl bg-paper p-5 ring-1 ring-line">
									<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange">
										Need an update?
									</p>
									<p className="mt-3 text-sm leading-6 text-ink-soft">
										Send an enquiry if a notice affects an active consignment.
									</p>
									<Link
										to="/contact"
										className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange"
									>
										Contact the terminal team <ArrowRight className="size-4" />
									</Link>
								</div>
							</aside>
						</div>
					</div>
				</section>
			</main>
		</PublicFrame>
	);
}