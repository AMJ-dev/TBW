import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const CAPABILITIES = [
  'Secure bonded storage in Abuja|Fully enclosed, 24/7 monitored bonded terminal facility licensed under NCS regulations.',
  'Real-time cargo tracking|Minute-by-minute status logging from entry at Nigerian ports through inland transfer to Abuja gate-in.',
  'Online document management|Direct upload, assessment validation, and verification of Single Goods Declarations (SGD) and manifests.',
  'Transparent storage accrual and billing|Clear, upfront tariffs with zero unpredictable line-item extras or sudden demurrage penalties.',
  'Online payment initiation|Instant clearance fee settlement, bank guarantee verification, and digital receipt generation.',
  'Photographic evidence on receipt|Comprehensive high-res audit images capturing seal integrity, container examination, and bay loading.',
  'Dedicated customer portal|Unified interface for logistics directors, enterprise traders, and licensed customs agents.',
  'Notifications via email, SMS, & WhatsApp|Automated procedural pings informing your team when goods are inspected, cleared, or ready for dispatch.',
].map((s) => {
  const [title, desc] = s.split('|');
  return { title, desc };
});

const COMPARISON = [
  {
    factor: 'Transit & Clearance Time',
    sub: 'End-to-end arrival cycle',
    traditional: { title: '14 to 28 Days', desc: 'Frequent port corridor bottlenecks, terminal gridlock & queuing.' },
    trinu: { title: '3 to 5 Days in Terminal', desc: 'Direct inland bonded transfer skips coastal congestion entirely.' },
  },
  {
    factor: 'Demurrage Risks',
    sub: 'Shipping line & terminal fees',
    traditional: { title: 'High & Unpredictable', desc: 'Accumulates rapidly during documentation delays at maritime hubs.' },
    trinu: { title: 'Zero Demurrage Surprises', desc: 'Predictable bonded holding rates with live in-portal accrual tracking.' },
  },
  {
    factor: 'Inspection Proximity',
    sub: 'Physical verification location',
    traditional: { title: 'Requires Travel or Agents', desc: 'Importers must travel to coastal ports or rely blind on remote third parties.' },
    trinu: { title: 'Within Abuja Municipal Reach', desc: 'Inspect cargo personally in Abuja or view verified timestamped photo logs.' },
  },
  {
    factor: 'Freight Escort & Security',
    sub: 'Transit protocol & insurance',
    traditional: { title: 'Fragmented Trucking', desc: 'Ad-hoc interstate haulage, unregulated checkpoints, varied liability.' },
    trinu: { title: 'Secured Bond Undertaking', desc: 'Dedicated bonded corridor transit governed under licensed carrier bond.' },
  },
];

export function ImportersPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero */}
      <section className="w-full bg-secondary text-on-secondary py-20 px-space-md md:px-margin-md lg:px-margin-lg relative overflow-hidden">
        <div className="absolute -right-20 -bottom-24 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
        <div className="max-w-[1280px] mx-auto flex flex-col items-start gap-space-lg relative z-10">
          <div className="inline-flex items-center gap-space-xs bg-primary/20 backdrop-blur-sm px-space-md py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-on-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-secondary/80 uppercase tracking-[0.1em]">
              TAILORED FOR IMPORTERS & MERCHANTS
            </span>
          </div>
          <div className="max-w-[920px] flex flex-col gap-space-md">
            <h1 className="font-headline-xl text-headline-xl text-on-secondary tracking-tight">
              Clear Your Goods Closer to Home
            </h1>
            <p className="font-body-lg text-body-lg text-on-secondary/90 max-w-[760px] leading-relaxed">
              Save time, save cost, and skip the trip to Lagos or Kano — with full customs
              compliance built in.
            </p>
          </div>
          <div className="pt-space-xs flex flex-wrap items-center gap-space-md">
            <Link
              to="/request-a-quote"
              className="inline-flex items-center justify-center bg-surface-container-lowest text-secondary font-title-sm text-title-sm font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-surface transition-all duration-200 hover:-translate-y-0.5"
            >
              Request a Quote
              <Icon name="arrow_forward" className="ml-2 text-[18px]" />
            </Link>
            <div className="flex items-center gap-space-sm text-on-secondary/80 font-body-sm text-body-sm pl-2">
              <Icon name="verified" className="text-[20px]" />
              <span>Abuja Terminal · Licenced Bond Undertaking</span>
            </div>
          </div>
          <div className="w-full mt-space-md pt-space-lg grid grid-cols-2 md:grid-cols-4 gap-gutter bg-primary/25 backdrop-blur-md rounded-xl p-space-md">
            {[
              { label: 'Transit Corridor', value: 'Direct Abuja Bonded' },
              { label: 'Inspection Proximity', value: 'Immediate Local Access' },
              { label: 'Customs Oversight', value: 'NCS Resident Command' },
              { label: 'Storage Billing', value: 'Accrued In App' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-label-sm text-label-sm text-on-secondary/70 uppercase">
                  {s.label}
                </div>
                <div className="font-title-lg text-title-lg text-on-secondary">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hidden Cost */}
      <section className="w-full bg-surface-container-low py-20 px-space-md md:px-margin-md lg:px-margin-lg">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-space-xl">
          <div className="max-w-[800px] flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">
              Inefficiencies Eliminated
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary-container">
              The Hidden Cost You're Paying
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Importers and clearing agents serving Abuja have always paid a hidden cost — in time,
              in money, in congestion — simply because their cargo had to be handled somewhere else
              first. TRÏNŪ removes that detour.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
            {[
              { icon: 'schedule', title: 'Save Time', desc: 'Less travel, less waiting, faster release.', metric: 'Up to 5 Days Saved' },
              { icon: 'payments', title: 'Save Cost', desc: 'Lower logistics overhead, transparent storage billing.', metric: 'Zero Demurrage Surprises' },
              { icon: 'policy', title: 'Stay Compliant', desc: 'Built to support existing customs processes.', metric: '100% NCS Procedure Aligned' },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-surface-container-lowest rounded-lg p-8 shadow-sm flex flex-col justify-between gap-space-lg transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                    <Icon name={c.icon} className="text-[26px]" />
                  </div>
                  <h3 className="font-title-lg text-title-lg text-primary">{c.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {c.desc}
                  </p>
                </div>
                <div className="pt-space-md bg-surface-container-low/70 rounded-lg p-space-md flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                    Key Metric
                  </span>
                  <span className="font-title-md text-title-md text-secondary">{c.metric}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter-lg items-center bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
            <div className="flex flex-col gap-space-md">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                Physical Infrastructure
              </span>
              <h4 className="font-headline-md text-headline-md text-primary">
                Abuja's Sovereign Freight Gate
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Consignments destined for the Federal Capital Territory and Northern trade zones no
                longer need to sit idle in congested coastal quaysides. Cargo transfers directly in
                bonded escort status, landing inside secure bonded perimeter bays ready for
                localized assessment.
              </p>
              <div className="flex items-center gap-space-lg pt-2 font-label-md text-label-md text-primary font-semibold">
                <div className="flex items-center gap-1.5">
                  <Icon name="lock" className="text-secondary text-[18px]" /> Customs Vaults
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="speed" className="text-secondary text-[18px]" /> Fast Dispatch
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="verified_user" className="text-secondary text-[18px]" /> Escorted
                  Movement
                </div>
              </div>
            </div>
            <div className="h-64 lg:h-72 rounded-lg overflow-hidden bg-surface-container">
              <img
                className="w-full h-full object-cover"
                alt="Bonded freight terminal"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbDOnqbJXxEBvVOeDVe9jFauzAsHsa4AuKaxsT55JKmBopgvU0LL_xArepzMqZJ2hHG4_InZfH6NXmJYpuMnKYP_15nS1wr0XqBeYk0IWf7oakFJtACAEJSs3c1WCL0uryHHcmo6LQciDglD-O9HlpAO7cyfq2auxcw4L5qolGa6EIA4Ppfurdo34iOyQf9_kQlCG8GHmjTwuqwHc0Ocrmjae_Vw1_Dr30Hxxc0M6E2hz7soeBww"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="w-full bg-surface-container-lowest py-20 px-space-md md:px-margin-md lg:px-margin-lg">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-space-xl">
          <div className="max-w-[800px] flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">
              Operational Capabilities
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary-container">
              What You Get with TRÏNŪ
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              End-to-end commercial transparency and physical cargo security in the Federal Capital.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="bg-surface-container-low p-6 rounded-lg flex flex-col gap-space-md shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
                  <Icon name="check" className="text-[20px]" />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <h3 className="font-title-md text-title-md text-primary">{c.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="w-full bg-surface-container-low py-20 px-space-md md:px-margin-md lg:px-margin-lg">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-space-xl">
          <div className="max-w-[800px] flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">
              Comparative Analysis
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary-container">
              Strategic Savings Comparison
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              See the tangible operational contrast between port-of-entry congestion and direct
              Abuja clearance.
            </p>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-12 bg-surface-container text-primary p-space-md md:p-space-lg font-title-sm text-title-sm uppercase tracking-wide">
              <div className="col-span-4 md:col-span-3">Operational Factor</div>
              <div className="col-span-4 md:col-span-4 text-on-surface-variant">
                Traditional Lagos/Kano Detour
              </div>
              <div className="col-span-4 md:col-span-5 text-secondary font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Direct Abuja Clearance at TRÏNŪ
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.factor}
                className={`grid grid-cols-12 p-space-md md:p-space-lg items-center ${
                  i % 2 === 0
                    ? 'bg-surface-container-lowest hover:bg-surface-container-low/50'
                    : 'bg-surface-container-low/30 hover:bg-surface-container-low/70'
                } transition-colors`}
              >
                <div className="col-span-4 md:col-span-3 flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary">{row.factor}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {row.sub}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-4 font-body-md text-body-md text-error flex items-start gap-2">
                  <Icon name="close" className="text-[18px] text-error mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary">{row.traditional.title}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">
                      {row.traditional.desc}
                    </p>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-5 font-body-md text-body-md text-primary flex items-start gap-2 bg-secondary-fixed/30 -my-space-md p-space-md rounded-lg">
                  <Icon name="check_circle" className="text-[18px] text-secondary mt-0.5" />
                  <div>
                    <p className="font-semibold text-secondary">{row.trinu.title}</p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant">
                      {row.trinu.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-surface-container p-space-lg rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                <Icon name="gavel" className="text-[24px]" />
              </div>
              <div>
                <h4 className="font-title-md text-title-md text-primary">
                  Operates Under Nigeria Customs Service Act 2023
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  All goods transferred on bond remain under institutional regulatory sanction until
                  final duty settlement.
                </p>
              </div>
            </div>
            <Link
              to="/verify-document"
              className="inline-flex items-center gap-1.5 font-title-sm text-title-sm text-secondary hover:underline whitespace-nowrap"
            >
              <span>Verify NCS Bond Authority</span>
              <Icon name="open_in_new" className="text-[16px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-primary-container text-on-primary py-16 px-space-md md:px-margin-md lg:px-margin-lg relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-space-xl relative z-10">
          <div className="max-w-[720px] flex flex-col gap-space-sm text-center md:text-left">
            <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold">
              Ready to move your cargo closer to home?
            </h2>
            <p className="font-body-lg text-body-lg text-inverse-primary leading-relaxed">
              Consult with our logistics desk or request an immediate bonded handling and tariff
              quotation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-md shrink-0">
            <Link
              to="/request-a-quote"
              className="inline-flex items-center justify-center bg-secondary hover:bg-secondary-container text-on-secondary font-title-sm text-title-sm font-semibold px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              Request a Quote
              <Icon name="send" className="ml-2 text-[18px]" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-transparent text-primary-fixed hover:text-on-primary font-title-sm text-title-sm px-6 py-4 transition-colors"
            >
              Speak with Clearance Desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}