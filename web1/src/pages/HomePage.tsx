import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBR-x93gmp9ZpXu3XhLhg6DaxIfvcZRVwX3C9zqZNHKzm7UOD6K3HTL7oQbYw-yESVldVeETI696S8sumlCeyUpsprleDEMVFp4PqU4TRwaMNB44acKOvoCVeT01DZNkMk6ERPAqsKfg36ZfQgmwqP8Xy2Hoq0VfpKXdu_44w32IzbiJR6q4umyb4XTh3ehDpBtpZTmBU_-PAih5aBMtlI6IzZHa9VcoeVRh7MPCJWXCLvq5NEHTg';

const SERVICES = [
  { num: '01', icon: 'warehouse', title: 'Bonded Warehousing', desc: 'Secure, customs-approved storage for goods in bond. Real-time inventory visibility.', tag: 'In-Bond Storage' },
  { num: '02', icon: 'forklift', title: 'Cargo Handling', desc: 'Professional receiving, tally, positioning, and handling for all cargo types.', tag: 'Standard & Heavy Lift' },
  { num: '03', icon: 'gavel', title: 'Customs Support', desc: 'Facilities and coordination for customs examination. We support the process — Customs decides.', tag: 'Official Examination Bays' },
  { num: '04', icon: 'inventory_2', title: 'Container Handling', desc: 'Stuffing, destuffing, and container yard management with full audit trail.', tag: 'Yard & Box Management' },
  { num: '05', icon: 'local_shipping', title: 'Storage & Logistics', desc: 'Short and long-term storage with transparent billing and live storage accrual.', tag: 'Predictable Accrual Tiers' },
];

const STAGES = [
  { num: '01', title: 'Arrival', desc: 'Cargo arrives at our Abuja facility.', icon: 'local_shipping' },
  { num: '02', title: 'Documentation', desc: 'Documents registered and verified.', icon: 'description' },
  { num: '03', title: 'Receiving', desc: 'Goods tallied, condition recorded, positioned.', icon: 'fact_check' },
  { num: '04', title: 'Secure Storage', desc: 'Stored in bonded warehouse or yard.', icon: 'lock' },
  { num: '05', title: 'Customs Processing', desc: 'Facilities and coordination for examination.', icon: 'policy' },
  { num: '06', title: 'Release', desc: 'Released once Customs authorisation and terminal obligations are satisfied.', icon: 'task_alt' },
  { num: '07', title: 'Delivery', desc: 'Collected or delivered to final destination.', icon: 'outgoing_mail' },
];

const NOTICES = [
  { date: '14 OCTOBER 2025', title: 'TRÏNŪ Bonded Warehouse Prepares for Launch — 28 September 2026', excerpt: "Civil works and customs integration systems advance on schedule for the capital's flagship inland logistics terminal." },
  { date: '02 NOVEMBER 2025', title: 'Understanding Bonded Storage: What Importers Need to Know', excerpt: 'A strategic overview of duty deferral, staging benefits, and inventory security in bonded inland facilities.' },
  { date: '18 NOVEMBER 2025', title: 'How TRÏNŪ Supports Customs Examination in Abuja', excerpt: 'Dedicated physical inspection bays and digital coordination ensure seamless examination while Customs decides.' },
];

export function HomePage() {
  const navigate = useNavigate();
  const handleTrack = () => {
    const input = document.getElementById('hero-tracking-input') as HTMLInputElement | null;
    const val = input?.value.trim();
    if (!val) {
      alert('Please enter a container number, Bill of Lading, or terminal reference.');
      return;
    }
    navigate(`/track-cargo?ref=${encodeURIComponent(val)}`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* HERO */}
      <section className="relative min-h-[620px] w-full overflow-hidden bg-primary-container text-on-primary lg:min-h-[660px]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-55 lg:left-[36%] lg:bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary-container via-primary-container/95 to-primary-container/65 lg:to-primary-container/35" />
        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-[1440px] flex-col items-start justify-center px-margin py-16 md:px-margin-md lg:min-h-[660px] lg:px-margin-lg lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-space-xs border border-on-primary/20 bg-primary-container/40 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm font-semibold uppercase tracking-widest text-on-primary">
                BONDED WAREHOUSE · ABUJA, NIGERIA
              </span>
            </div>
            <h1 className="mb-6 max-w-3xl font-headline-xl text-headline-xl-mobile font-bold leading-[1.08] text-on-primary md:text-headline-xl">
              Your cargo, closer to the market it serves.
            </h1>
            <p className="mb-9 max-w-xl font-body-lg text-body-lg leading-relaxed text-inverse-primary">
              Bonded warehousing and cargo handling in Abuja, built to support Customs processes and make inland trade easier to manage.
            </p>
          </div>
          <div className="mb-10 flex flex-wrap items-center gap-space-sm">
            <Link
              to="/track-cargo"
              className="inline-flex items-center justify-center bg-secondary-container px-5 py-3 font-title-sm text-title-sm font-semibold uppercase text-on-secondary shadow-md transition-colors duration-200 hover:bg-secondary"
            >
              Track Cargo
            </Link>
            <Link
              to="/request-a-quote"
              className="inline-flex items-center justify-center border border-on-primary/40 px-5 py-3 font-title-sm text-title-sm font-semibold uppercase text-on-primary transition-colors duration-200 hover:bg-surface-container-lowest/10"
            >
              Request a Quote
            </Link>
            <Link
              to="/portal/book-truck-slot"
              className="inline-flex items-center justify-center border border-on-primary/40 px-5 py-3 font-title-sm text-title-sm font-semibold uppercase text-on-primary transition-colors duration-200 hover:bg-surface-container-lowest/10"
            >
              Book Truck Slot
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center border border-on-primary/40 px-5 py-3 font-title-sm text-title-sm font-semibold uppercase text-on-primary transition-colors duration-200 hover:bg-surface-container-lowest/10"
            >
              Contact Operations
            </Link>
          </div>
          <div className="w-full max-w-2xl border border-primary/10 bg-surface-container-lowest p-2 shadow-xl sm:flex sm:items-center">
            <div className="relative flex min-h-12 flex-1 items-center px-3">
              <Icon name="search" className="mr-2 text-[22px] text-outline" />
              <input
                id="hero-tracking-input"
                type="text"
                aria-label="Cargo tracking reference"
                placeholder="Enter a cargo reference"
                className="w-full bg-transparent py-2 font-body-md text-body-md text-primary placeholder-on-surface-variant/70 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleTrack}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center bg-primary px-6 py-3 font-title-sm text-title-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-secondary sm:w-auto"
            >
              Track
            </button>
          </div>
          <p className="mt-3 pl-1 font-label-sm text-label-sm text-inverse-primary">
            Public tracking. No account required.
          </p>
        </div>
        <div className="absolute bottom-8 right-10 z-10 hidden border-l border-on-primary/40 pl-4 text-on-primary lg:block">
          <p className="font-label-sm text-label-sm font-semibold uppercase tracking-widest">Abuja Inland Terminal</p>
          <p className="mt-1 font-body-sm text-body-sm text-inverse-primary">Storage · Handling · Coordination</p>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="w-full bg-surface-container-lowest shadow-sm">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center divide-y md:divide-y-0 md:divide-x divide-surface-variant">
            {[
              { icon: 'verified_user', text: 'Customs-Approved Facility' },
              { icon: 'warehouse', text: 'Secure Bonded Storage' },
              { icon: 'anchor', text: "Abuja's First Inland Bonded Terminal" },
            ].map((item) => (
              <div key={item.text} className="flex items-center justify-start md:justify-center gap-4 py-2">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <Icon name={item.icon} className="text-[24px]" />
                </div>
                <span className="font-title-md text-title-md text-primary">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="w-full bg-surface-container-low py-20">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="max-w-3xl mb-16">
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary-container block mb-3">
              WHY TRÏNŪ EXISTS
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-semibold tracking-tight leading-tight mb-6">
              Cargo Bound for Abuja Shouldn't Have to Sit Hundreds of Kilometres Away
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Importers and clearing agents serving Abuja have always paid a hidden cost — in time,
              in money, in congestion — simply because their cargo had to be handled somewhere else
              first. TRÏNŪ removes that detour.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
            {[
              { icon: 'pin_drop', title: 'Closer to Home', desc: 'Skip the trip to Lagos or Kano. Your cargo is handled in Abuja, where your business is.', tag: 'Direct Destination Clearance' },
              { icon: 'schedule', title: 'Faster Turnaround', desc: "Less travel time, less congestion, less waiting. Trade moves at Abuja's pace.", tag: 'Accelerated Supply Velocity' },
              { icon: 'verified', title: 'Fully Compliant', desc: 'Built to support existing customs processes. Secure, transparent, and orderly.', tag: 'NCS Act 2023 Aligned' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center mb-6">
                    <Icon name={item.icon} className="text-secondary-container text-[28px]" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-3">{item.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-8 pt-4">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                    {item.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="w-full bg-surface-container-lowest py-20">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="max-w-2xl mb-16">
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary-container block mb-3">
              WHAT WE DO
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-semibold tracking-tight">
              Capabilities Built for Modern Trade
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg mb-gutter-lg">
            {SERVICES.slice(0, 3).map((s) => (
              <ServiceCard key={s.num} {...s} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">
            {SERVICES.slice(3).map((s) => (
              <ServiceCard key={s.num} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full bg-primary-container text-on-primary py-20 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="max-w-2xl mb-16">
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary-container block mb-3">
              THE JOURNEY
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-primary">
              How It Works — Seven Stages
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {STAGES.map((stage) => (
              <div
                key={stage.num}
                className="bg-surface-container-lowest/5 rounded-xl p-5 flex flex-col justify-between hover:bg-surface-container-lowest/10 transition-colors"
              >
                <div>
                  <span className="font-headline-md text-headline-md text-secondary-container font-semibold block mb-2">
                    {stage.num}
                  </span>
                  <h4 className="font-title-sm text-title-sm text-on-primary font-bold mb-2">
                    {stage.title}
                  </h4>
                  <p className="font-body-sm text-body-sm text-inverse-primary leading-normal">
                    {stage.desc}
                  </p>
                </div>
                <div className="mt-6 flex items-center text-outline-variant">
                  <Icon name={stage.icon} className="text-[20px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="w-full bg-surface-container-lowest py-20">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="max-w-2xl mb-16">
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary-container block mb-3">
              WHO WE SERVE
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-semibold tracking-tight">
              One Facility. Three Audiences.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter-lg">
            {[
              { accent: 'bg-secondary-container', labelColor: 'text-secondary-container', label: 'CONFIDENT · PRACTICAL · BENEFIT-FIRST', title: 'Importers & Traders', desc: 'Clear your goods closer to home. Save time, save cost, skip the Lagos/Kano trip.', link: '/importers-traders' },
              { accent: 'bg-secondary', labelColor: 'text-secondary', label: 'RESPECTFUL · COLLABORATIVE · REASSURING', title: 'Forwarders & Agents', desc: "We're a facility you plug into, not a competitor — your clients, your relationships, just faster infrastructure.", link: '/forwarders-agents' },
              { accent: 'bg-outline', labelColor: 'text-on-surface-variant', label: 'FORMAL · DEFERENTIAL · PRECISE', title: 'Regulators & Government', desc: 'Fully compliant, fully transparent, built to support existing customs processes.', link: '/regulators' },
            ].map((a) => (
              <div
                key={a.title}
                className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div className={`h-1.5 w-full ${a.accent}`} />
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <span className={`font-label-sm text-label-sm ${a.labelColor} uppercase tracking-wider font-semibold block mb-3`}>
                      {a.label}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-primary font-semibold mb-4">
                      {a.title}
                    </h3>
                    <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6">
                      {a.desc}
                    </p>
                  </div>
                  <div className="pt-6">
                    <Link
                      to={a.link}
                      className="inline-flex items-center gap-2 font-title-sm text-title-sm text-primary group-hover:text-secondary font-semibold transition-colors"
                    >
                      Learn More <Icon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICES */}
      <section className="w-full bg-surface-container-low py-20">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold text-secondary-container block mb-3">
                NEWS & NOTICES
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-semibold tracking-tight">
                Latest Updates
              </h2>
            </div>
            <Link
              to="/news-notices"
              className="inline-flex items-center gap-2 font-title-sm text-title-sm text-primary hover:text-secondary transition-colors font-semibold"
            >
              View All Bulletins <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
            {NOTICES.map((n) => (
              <article
                key={n.title}
                className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider block mb-4">
                    {n.date}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-4 leading-snug">
                    {n.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {n.excerpt}
                  </p>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    to="/news-notices"
                    className="inline-flex items-center gap-2 font-title-sm text-title-sm text-primary hover:text-secondary font-semibold transition-colors"
                  >
                    Read More <Icon name="arrow_forward" className="text-[18px]" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP QUOTE */}
      <section className="w-full bg-primary-container text-on-primary py-24 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10 flex flex-col md:flex-row items-start md:items-center gap-12">
          <div className="w-full md:w-5/12 shrink-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-[400px] object-cover"
                alt="Executive leader overlooking bonded logistics terminal"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSFQv4JD3y2gPab2w85G4caVu3kIMzIc2m1fDlHiPM8VX5b7QIJKcsmWhzIGI4Z2rJMvGKWqnpKxjQJk0EAxXJ1IXJsepjgXR5IihPBxNMSU6GkTjXzmQECKoub8a2_wwzYLUIbkRtOuE5QJWTT3r0sjz2_kqPGGllNdwh0kpW8Z4zdEC8Am0XYmiOwAFN-g-OMNymqaXlsYVJ5SjiuJDz6L_ITS_I0fV_4abcrS0qHTdlUCyNAw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="font-label-sm text-label-sm text-secondary-container uppercase tracking-wider font-semibold">
                  Leadership Provenance
                </span>
                <p className="font-title-sm text-title-sm text-on-primary font-bold">
                  Inland Terminal Governance
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-7/12 flex flex-col">
            <span className="font-headline-xl text-secondary-container leading-none select-none -mb-4">
              "
            </span>
            <blockquote className="font-headline-md text-headline-sm md:text-headline-md font-medium text-on-primary leading-snug mb-8">
              TRÏNŪ isn't just another warehouse, it's the missing link between Nigeria's ports and
              the businesses that keep Abuja and the north moving. For too long, cargo bound for
              this market has had to sit hundreds of kilometers away from where it's actually
              needed. We built TRÏNŪ to bring that process home.
            </blockquote>
            <div>
              <h4 className="font-title-lg text-title-lg text-secondary-container font-semibold">
                Bilal Aijjola
              </h4>
              <p className="font-body-md text-body-md text-inverse-primary">
                Chief Executive Officer / Managing Director, TRÏNŪ Bonded Warehouse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="w-full bg-secondary-container text-on-secondary py-20 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg text-center flex flex-col items-center">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold tracking-tight text-on-secondary max-w-3xl mb-4">
            Ready to Move Your Cargo Closer to Home?
          </h2>
          <p className="font-body-lg text-body-lg text-on-secondary/90 max-w-xl mb-10 leading-relaxed">
            Request a quote or track your cargo today. No login required for public tracking.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-space-md">
            <Link
              to="/request-a-quote"
              className="inline-flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container-low text-secondary-container px-8 py-4 rounded-xl font-title-sm text-title-sm uppercase tracking-wider font-semibold shadow-md transition-all duration-200"
            >
              Request a Quote
            </Link>
            <Link
              to="/track-cargo"
              className="inline-flex items-center justify-center bg-transparent hover:bg-on-secondary/10 text-on-secondary px-8 py-4 rounded-xl font-title-sm text-title-sm uppercase tracking-wider font-semibold shadow-sm transition-all duration-200"
            >
              Track Cargo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ num, icon, title, desc, tag }: { num: string; icon: string; title: string; desc: string; tag: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container group-hover:text-on-secondary transition-colors mb-6">
          <Icon name={icon} className="text-[24px]" />
        </div>
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block mb-2">
          Service {num}
        </span>
        <h3 className="font-headline-sm text-headline-sm text-primary mb-3">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
      <div className="mt-8 pt-4 flex items-center justify-between">
        <span className="font-label-sm text-label-sm font-semibold text-primary">{tag}</span>
        <Icon name="arrow_forward" className="text-secondary-container text-[18px]" />
      </div>
    </div>
  );
}