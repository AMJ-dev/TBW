import { Link, useLocation, useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const SERVICES = {
  'bonded-warehousing': {
    title: 'Bonded Warehousing',
    summary: 'Secure, customs-approved storage for goods moving through Abuja and Northern Nigeria.',
    detail: 'Keep consignments closer to the market they serve while duties remain subject to Customs procedures. TRÏNŪ provides controlled storage, inventory records, and operational coordination.',
    icon: 'warehouse',
    points: ['Bonded storage and inventory visibility', 'Recorded receiving and cargo movements', 'Flexible short- and long-term storage'],
  },
  'cargo-handling': {
    title: 'Cargo Handling',
    summary: 'Professional receiving, tally, positioning, and handling for varied cargo types.',
    detail: 'Terminal teams coordinate cargo reception, tally, condition recording, and placement using the appropriate handling equipment and documented processes.',
    icon: 'forklift',
    points: ['Receiving and tally records', 'Container and breakbulk handling', 'Condition and movement documentation'],
  },
  'customs-support': {
    title: 'Customs Support',
    summary: 'Facilities and coordination for Customs processes. Customs decisions remain with the competent authority.',
    detail: 'TRÏNŪ provides examination space and operational coordination for authorised inspections. The terminal does not assess duties, approve clearance, or exercise Customs authority.',
    icon: 'policy',
    points: ['Examination staging facilities', 'Coordination with authorised agencies', 'Documented hand-off and release steps'],
  },
  'container-handling': {
    title: 'Container Handling',
    summary: 'Container yard management, stuffing, and destuffing with recorded movements.',
    detail: 'Container handling is coordinated from gate arrival through positioning and collection, with movement history maintained for the terminal workflow.',
    icon: 'inventory_2',
    points: ['Gate-in and gate-out coordination', 'Yard positioning and movement records', 'Stuffing and destuffing services'],
  },
  'storage-logistics': {
    title: 'Storage & Logistics',
    summary: 'Inland storage and logistics coordination for cargo bound for Abuja and the north.',
    detail: 'Plan storage and inland handling with clearer operational milestones and charges. Pricing depends on the cargo, service requirements, and applicable tariff schedule.',
    icon: 'local_shipping',
    points: ['Storage options for different cargo needs', 'Inland coordination and collection planning', 'Transparent quote and tariff review'],
  },
} as const;

type ServiceSlug = keyof typeof SERVICES;

const ARTICLES = [
  {
    slug: 'bonded-warehouse-launch',
    date: '28 September 2026',
    title: 'TRÏNŪ Bonded Warehouse prepares for launch',
    summary: 'An update on the Abuja facility and its planned bonded terminal services.',
    body: 'TRÏNŪ is preparing an inland bonded terminal for businesses serving Abuja and Northern Nigeria. Facility operations are designed around secure cargo handling, clear records, and coordination with the competent authorities.',
  },
  {
    slug: 'understanding-bonded-storage',
    date: '02 November 2025',
    title: 'Understanding bonded storage',
    summary: 'A practical introduction to storing eligible cargo under a bonded arrangement.',
    body: 'Bonded storage allows eligible goods to remain under Customs control while importers complete the applicable procedures. Duties, release requirements, and permitted activities are determined by the competent authorities and the terms of the relevant bond.',
  },
  {
    slug: 'customs-examination-abuja',
    date: '18 November 2025',
    title: 'How terminal facilities support Customs examination',
    summary: 'How coordinated staging can help organise an authorised examination.',
    body: 'A bonded terminal can provide suitable staging areas, cargo access, and operational records for authorised examinations. Customs and other competent agencies determine the examination outcome and any resulting requirements.',
  },
] as const;

const audienceNames: Record<string, string> = {
  importers: 'Importers & Traders',
  agents: 'Forwarders & Agents',
  regulators: 'Regulators & Government',
};

export function PublicInfoPage() {
  const { pathname } = useLocation();
  const { serviceSlug, newsSlug } = useParams();

  if (pathname.startsWith('/services/')) {
    const service = SERVICES[serviceSlug as ServiceSlug];
    if (!service) return <PublicNotFoundPage />;
    return (
      <PageFrame kicker="Terminal service" title={service.title} summary={service.summary}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="bg-surface-container-lowest p-6 shadow-sm ring-1 ring-surface-variant md:p-8">
            <div className="mb-5 flex size-12 items-center justify-center bg-secondary-fixed text-secondary">
              <Icon name={service.icon} className="text-[26px]" />
            </div>
            <p className="max-w-3xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{service.detail}</p>
            <h2 className="mt-8 font-headline-sm text-headline-sm text-primary">Service scope</h2>
            <ul className="mt-4 space-y-3">
              {service.points.map((point) => (
                <li key={point} className="flex items-start gap-3 border-t border-surface-variant pt-3 font-body-md text-body-md text-on-surface-variant">
                  <Icon name="check_circle" className="mt-0.5 text-[19px] text-secondary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
          <aside className="h-fit bg-primary-container p-6 text-on-primary">
            <p className="font-label-sm text-label-sm font-semibold uppercase text-primary-fixed">Plan a movement</p>
            <p className="mt-3 font-body-md text-body-md leading-relaxed text-inverse-primary">Share cargo details and timing to preview a locally handled quote request.</p>
            <Link to="/request-a-quote" className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-secondary-container px-5 py-3 font-title-sm text-title-sm font-semibold text-on-secondary hover:bg-secondary">Request a quote <Icon name="arrow_forward" className="text-[18px]" /></Link>
            <Link to="/track-cargo" className="mt-3 inline-flex w-full items-center justify-center border border-on-primary/30 px-5 py-3 font-title-sm text-title-sm font-semibold text-on-primary hover:bg-on-primary/10">Track cargo</Link>
          </aside>
        </div>
      </PageFrame>
    );
  }

  if (pathname === '/news-notices') {
    return (
      <PageFrame kicker="News & notices" title="Terminal updates" summary="Updates and practical information about TRÏNŪ and inland bonded operations.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article) => (
            <article key={article.slug} className="flex flex-col bg-surface-container-lowest p-6 ring-1 ring-surface-variant">
              <p className="font-label-sm text-label-sm font-semibold uppercase text-secondary">{article.date}</p>
              <h2 className="mt-3 font-headline-sm text-headline-sm leading-snug text-primary">{article.title}</h2>
              <p className="mt-3 flex-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">{article.summary}</p>
              <Link to={`/news-notices/${article.slug}`} className="mt-6 inline-flex items-center gap-2 font-title-sm text-title-sm font-semibold text-primary hover:text-secondary">Read notice <Icon name="arrow_forward" className="text-[18px]" /></Link>
            </article>
          ))}
        </div>
      </PageFrame>
    );
  }

  if (pathname.startsWith('/news-notices/')) {
    const article = ARTICLES.find((item) => item.slug === newsSlug);
    if (!article) return <PublicNotFoundPage />;
    return (
      <PageFrame kicker={`Notice · ${article.date}`} title={article.title} summary={article.summary}>
        <article className="max-w-3xl bg-surface-container-lowest p-6 ring-1 ring-surface-variant md:p-9">
          <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{article.body}</p>
          <p className="mt-6 border-l-2 border-secondary-container pl-4 font-body-md text-body-md leading-relaxed text-on-surface-variant">All operational activity remains subject to applicable licence conditions and directions of the competent authorities.</p>
          <Link to="/news-notices" className="mt-8 inline-flex items-center gap-2 font-title-sm text-title-sm font-semibold text-primary hover:text-secondary"><Icon name="arrow_back" className="text-[18px]" /> All notices</Link>
        </article>
      </PageFrame>
    );
  }

  if (pathname === '/about') {
    return (
      <PageFrame kicker="About TRÏNŪ" title="An inland terminal built for Abuja" summary="TRÏNŪ is designed to bring bonded storage and cargo coordination closer to the businesses that serve the capital and Northern Nigeria.">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ['Closer to cargo owners', 'An Abuja-based location can reduce inland hand-offs for businesses whose destination market is far from coastal ports.'],
            ['Secure by process', 'Documented receiving, inventory visibility, and recorded movements help keep cargo handling accountable.'],
            ['Authority stays with Customs', 'TRÏNŪ provides terminal facilities and coordination; Customs and other competent authorities make statutory decisions.'],
          ].map(([title, detail], index) => (
            <article key={title} className="border-t-2 border-secondary-container bg-surface-container-lowest p-6 ring-1 ring-surface-variant">
              <span className="font-headline-md text-headline-md text-secondary">0{index + 1}</span>
              <h2 className="mt-4 font-headline-sm text-headline-sm text-primary">{title}</h2>
              <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">{detail}</p>
            </article>
          ))}
        </div>
        <PageLinks links={[["Explore services", "/services"], ["How it works", "/how-it-works"], ["Contact the team", "/contact"]]} />
      </PageFrame>
    );
  }

  if (pathname === '/careers') {
    return (
      <PageFrame kicker="Careers" title="Work close to the movement of trade" summary="TRÏNŪ brings together terminal operations, cargo documentation, customer service, safety, and technology roles.">
        <section className="max-w-3xl bg-surface-container-lowest p-6 ring-1 ring-surface-variant md:p-8">
          <h2 className="font-headline-sm text-headline-sm text-primary">Current opportunities</h2>
          <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">Open roles are not currently listed in this website demo. For general employment enquiries, contact the team through the local enquiry form.</p>
          <Link to="/contact" className="mt-6 inline-flex items-center gap-2 bg-primary px-5 py-3 font-title-sm text-title-sm font-semibold text-on-primary hover:bg-primary-container">Contact TRÏNŪ <Icon name="arrow_forward" className="text-[18px]" /></Link>
        </section>
      </PageFrame>
    );
  }

  if (pathname === '/customer-help-centre') {
    return (
      <PageFrame kicker="Customer help centre" title="Find your next step" summary="Quick links for the common public cargo and terminal enquiries.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['Track a shipment', 'Look up a sample cargo reference or container number.', '/track-cargo', 'search'],
            ['Verify a document', 'Check a TRÏNŪ document verification code in the local demo.', '/verify-document', 'verified_user'],
            ['Request a quote', 'Prepare a cargo and service request using the guided form.', '/request-a-quote', 'request_quote'],
            ['Contact the team', 'Open the local enquiry form and terminal contact directory.', '/contact', 'support_agent'],
          ].map(([title, detail, href, icon]) => (
            <Link key={href} to={href} className="flex items-start gap-4 bg-surface-container-lowest p-5 ring-1 ring-surface-variant transition-colors hover:bg-surface-container-low">
              <span className="flex size-10 shrink-0 items-center justify-center bg-surface-container text-secondary"><Icon name={icon} className="text-[23px]" /></span>
              <span><strong className="block font-title-md text-title-md text-primary">{title}</strong><span className="mt-1 block font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{detail}</span></span>
            </Link>
          ))}
        </div>
        <div className="mt-8 max-w-3xl divide-y divide-surface-variant border-y border-surface-variant bg-surface-container-lowest px-5">
          {[
            ['Does tracking show the full cargo record?', 'No. Public tracking is intended to show basic movement status. Commercial and personal details are not part of the public view.'],
            ['Who authorises Customs clearance?', 'The competent Customs authority determines examination outcomes and clearance. TRÏNŪ provides facilities and coordination only.'],
            ['Does this demo send my form details?', 'No. Forms and actions on this website are local interface previews. Nothing is sent to an API or backend.'],
          ].map(([question, answer]) => <details key={question} className="group py-4"><summary className="cursor-pointer list-none font-title-sm text-title-sm font-semibold text-primary">{question}<span className="float-right text-secondary">+</span></summary><p className="mt-3 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{answer}</p></details>)}
        </div>
      </PageFrame>
    );
  }

  if (pathname === '/regulatory-compliance') {
    return (
      <PageFrame kicker="Regulatory framework" title="Compliance is built into the process" summary="Terminal activity is designed to support applicable bonded facility procedures while respecting the authority of Customs and other competent agencies.">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ['Customs authority', 'Customs determines assessment, examination outcomes, and release authorisation. TRÏNŪ does not represent itself as a Customs authority.'],
            ['Bonded cargo controls', 'Cargo receipt, storage, and movement are organised around the applicable licence, bond undertakings, and official directions.'],
            ['Records and traceability', 'The interface demonstrates local sample records for manifests, movements, documents, and operational hand-offs.'],
            ['Privacy and data minimisation', 'This public website prototype stores no submitted information and makes no backend requests.'],
          ].map(([title, detail]) => <article key={title} className="bg-surface-container-lowest p-6 ring-1 ring-surface-variant"><h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2><p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">{detail}</p></article>)}
        </div>
        <PageLinks links={[["Privacy policy", "/privacy-policy"], ["Terms of use", "/terms-of-use"], ["Contact", "/contact"]]} />
      </PageFrame>
    );
  }

  if (pathname === '/privacy-policy') {
    return (
      <PageFrame kicker="Privacy policy" title="Your information stays in this browser demo" summary="The current `/web` experience is a UI prototype. It does not connect to a backend or transmit form entries.">
        <PolicySection title="Information entered in forms">Form values are used only to demonstrate on-screen interactions. No account is created, no enquiry is dispatched, and no file is uploaded by this prototype.</PolicySection>
        <PolicySection title="Local interface state">Some controls may display a confirmation or sample record while the page is open. Reloading the page may reset that state.</PolicySection>
        <PolicySection title="Production services">A deployed service would require an approved privacy notice describing its actual data purposes, retention, processors, and user rights before collection begins.</PolicySection>
        <PageLinks links={[["Terms of use", "/terms-of-use"], ["Contact", "/contact"]]} />
      </PageFrame>
    );
  }

  if (pathname === '/terms-of-use') {
    return (
      <PageFrame kicker="Terms of use" title="Using the TRÏNŪ website demo" summary="This interface is provided to preview public website journeys. It is not an operational cargo, Customs, payment, or account system.">
        <PolicySection title="Demo information">Cargo references, notices, tariff content, statuses, and facility examples shown here are sample interface data and must not be treated as live or authoritative records.</PolicySection>
        <PolicySection title="No transaction or service commitment">Submitting a form in this prototype does not create a quote, booking, contract, payment, clearance, or service request.</PolicySection>
        <PolicySection title="Competent authorities">Customs and other competent agencies retain their statutory decision-making authority. Terminal information is illustrative and subject to applicable licence conditions.</PolicySection>
        <PageLinks links={[["Privacy policy", "/privacy-policy"], ["Regulatory compliance", "/regulatory-compliance"]]} />
      </PageFrame>
    );
  }

  if (pathname === '/portal') {
    return (
      <PageFrame kicker="Stakeholder portal preview" title="A local preview of the cargo workspace" summary="This `/web` build has no sign-in service. Use these sample public tasks to explore the interface without creating an account.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Track cargo', 'See the sample movement timeline.', '/track-cargo', 'search'],
            ['Request a quote', 'Step through a local sample request.', '/request-a-quote', 'request_quote'],
            ['Verify a document', 'Check a sample verification reference.', '/verify-document', 'verified_user'],
          ].map(([title, detail, href, icon]) => <Link key={href} to={href} className="bg-surface-container-lowest p-6 ring-1 ring-surface-variant hover:bg-surface-container-low"><Icon name={icon} className="text-[25px] text-secondary" /><h2 className="mt-4 font-headline-sm text-headline-sm text-primary">{title}</h2><p className="mt-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{detail}</p></Link>)}
        </div>
        <p className="mt-6 max-w-3xl border-l-2 border-secondary-container pl-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">No credentials are requested or stored. For the full UI-only internal workspaces, use the separate `web2` prototype.</p>
      </PageFrame>
    );
  }

  const audience = pathname.match(/^\/(importers-traders|forwarders-agents|regulators)$/)?.[1];
  if (audience) {
    const title = audienceNames[audience];
    return (
      <PageFrame kicker="Who we serve" title={title} summary={`Information for ${title.toLowerCase()} using an inland bonded terminal in Abuja.`}>
        <section className="max-w-3xl bg-surface-container-lowest p-6 ring-1 ring-surface-variant md:p-8"><p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">TRÏNŪ provides storage, cargo handling, and coordination close to destination markets. Service availability depends on cargo type, licence conditions, equipment, and applicable Customs procedures.</p><PageLinks links={[["Explore services", "/services"], ["How it works", "/how-it-works"], ["Request a quote", "/request-a-quote"]]} /></section>
      </PageFrame>
    );
  }

  return <PublicNotFoundPage />;
}

export function PublicNotFoundPage() {
  return (
    <PageFrame kicker="Page not found" title="We couldn't find that page" summary="The link may have changed or the page may no longer be available.">
      <PageLinks links={[["Return home", "/"], ["Browse services", "/services"], ["Customer help centre", "/customer-help-centre"]]} />
    </PageFrame>
  );
}

function PageFrame({ kicker, title, summary, children }: { kicker: string; title: string; summary: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col">
      <section className="border-b border-surface-variant bg-surface-container-low py-14 md:py-20">
        <div className="mx-auto max-w-[1280px] px-margin md:px-margin-md lg:px-margin-lg">
          <p className="font-label-sm text-label-sm font-semibold uppercase text-secondary">{kicker}</p>
          <h1 className="mt-3 max-w-4xl font-headline-xl text-headline-xl-mobile leading-tight text-primary md:text-headline-xl">{title}</h1>
          <p className="mt-5 max-w-3xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{summary}</p>
        </div>
      </section>
      <main className="mx-auto w-full max-w-[1280px] px-margin py-10 md:px-margin-md md:py-14 lg:px-margin-lg">{children}</main>
    </div>
  );
}

function PageLinks({ links }: { links: [string, string][] }) {
  return <nav aria-label="Related pages" className="mt-8 flex flex-wrap gap-3">{links.map(([label, href]) => <Link key={href} to={href} className="inline-flex items-center gap-2 border border-primary/20 px-4 py-2.5 font-title-sm text-title-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary">{label}<Icon name="arrow_forward" className="text-[17px]" /></Link>)}</nav>;
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="max-w-3xl border-t border-surface-variant py-5 first:border-t-0"><h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2><p className="mt-2 font-body-md text-body-md leading-relaxed text-on-surface-variant">{children}</p></section>;
}
