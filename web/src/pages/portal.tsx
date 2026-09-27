import { type ReactNode } from "react";
import { Link } from "@/components/router-link";
import {
	AlertTriangle,
	ArrowRight,
	Bell,
	Boxes,
	Check,
	Clock3,
	FileCheck2,
	PackageCheck,
	Truck,
} from "lucide-react";
import { AppShell, Metric } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifications } from "@/data/mock";

export default function PortalDashboardRoute() {
	return (
		<AppShell title="Stakeholder overview" eyebrow="Atlantic Trade Nigeria Ltd">
			<PageIntro
				eyebrow="Customer portal"
				title="What needs your attention?"
				detail="A single operational view for cargo, documents, financial obligations, and truck movement."
				actions={
					<Link to="/portal/cargo">
						<Button className="bg-orange text-white hover:bg-orange-deep">
							View cargo <ArrowRight />
						</Button>
					</Link>
				}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
				<Metric label="In terminal" value="12" detail="4 stored today" icon={Boxes} />
				<Metric
					label="Arriving"
					value="4"
					detail="Next arrival 10:40"
					tone="info"
					icon={Truck}
				/>
				<Metric
					label="On hold"
					value="2"
					detail="Needs documentation"
					tone="critical"
					icon={AlertTriangle}
				/>
				<Metric
					label="Awaiting payment"
					value="3"
					detail="₦2.08m outstanding"
					tone="warning"
					icon={FileCheck2}
				/>
				<Metric
					label="Obligations satisfied"
					value="5"
					detail="Awaiting authorised outcome"
					tone="success"
					icon={PackageCheck}
				/>
				<Metric
					label="Overstaying"
					value="1"
					detail="Review storage deadline"
					tone="warning"
					icon={Clock3}
				/>
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
				<section className="rounded-xl bg-paper p-5 ring-1 ring-line">
					<SectionHeader
						title="Action required"
						detail={`${notifications.length} items`}
					/>
					{notifications.map((item) => (
						<div
							key={item.title}
							className="flex gap-3 border-t border-line py-4 first:border-t-0 first:pt-0"
						>
							<div
								className={cn(
									"mt-1 grid size-8 shrink-0 place-items-center rounded-md",
									item.tone === "critical"
										? "bg-coral/10 text-coral"
										: "bg-orange/10 text-orange-deep"
								)}
							>
								<Bell className="size-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-ink">{item.title}</p>
								<p className="mt-1 text-[12px] text-ink-soft">{item.detail}</p>
								<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
									{item.time}
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="self-center border-line bg-paper text-ink"
							>
								Review
							</Button>
						</div>
					))}
				</section>

				<section className="rounded-xl bg-slate p-5 text-sand ring-1 ring-slate">
					<SectionHeader title="Cargo lifecycle" detail="TRN-IMP-002481" />
					{[
						"Expected",
						"Arrived",
						"Received",
						"Stored",
						"Documentation",
						"Examination coordination",
						"Awaiting authorised outcome",
						"Gate out",
					].map((label, index) => (
						<div className="flex items-center gap-3" key={label}>
							<div
								className={cn(
									"grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
									index < 4
										? "bg-orange text-white"
										: index === 4
										? "bg-orange text-white"
										: "bg-sand/10 text-sand/50 ring-1 ring-sand/20"
								)}
							>
								{index < 4 ? <Check className="size-3.5" /> : index + 1}
							</div>
							<div
								className={cn(
									"border-l py-2 pl-3 text-[13px]",
									index === 7 ? "border-transparent" : "border-sand/15",
									index === 4
										? "font-semibold text-orange"
										: index > 4
										? "text-sand/50"
										: "text-sand"
								)}
							>
								{label}
								{index === 4 && (
									<span className="ml-2 font-mono text-[9px] uppercase tracking-[0.1em] text-orange/70">
										In progress
									</span>
								)}
							</div>
						</div>
					))}
				</section>
			</div>
		</AppShell>
	);
}

export { PortalDashboardRoute as PortalDashboard };

function PageIntro({
	eyebrow,
	title,
	detail,
	actions,
}: {
	eyebrow: string;
	title: string;
	detail: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
					{eyebrow}
				</p>
				<h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
					{title}
				</h2>
				<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{detail}</p>
			</div>
			{actions}
		</div>
	);
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
	return (
		<div className="mb-4 flex items-center justify-between gap-3">
			<h3 className="font-display text-sm font-bold tracking-tight text-ink">{title}</h3>
			<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
				{detail}
			</span>
		</div>
	);
}