import { Link } from 'react-router-dom';

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WTOZlxqxZhSk9Lr_cBf8Wm2-kFD1pSKcHEOT9QVoe5lnKl69_STVpNNfNBtC0Gl0jvdwNGIQu9W7bXq7VwUEPJnMQ4NFEfWYjBpbfxwTOxtFoj_frP47XaYs8NYMO4quD_MvTdX3N8N39bgn6T843wSai-KBlQrTAMXSKELZ_whkEQOPbmPXegf2_istNregEkPefPVGmsbB51-Fy5XcRYP5iiWDCVUnljjawki-XUm0zSo0l9AzfTA3ki-Xmj_PrOlsoAs18';

const SERVICES = [
  { label: 'Bonded Warehousing', path: '/services/bonded-warehousing' },
  { label: 'Cargo Handling', path: '/services/cargo-handling' },
  { label: 'Customs Support', path: '/services/customs-support' },
  { label: 'Container Handling', path: '/services/container-handling' },
  { label: 'Storage & Logistics', path: '/services/storage-logistics' },
];

const COMPANY = [
  { label: 'About', path: '/about' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Importers & Traders', path: '/importers-traders' },
  { label: 'News & Notices', path: '/news-notices' },
  { label: 'Careers', path: '/careers' },
  { label: 'Contact', path: '/contact' },
];

const QUICK = [
  { label: 'Portal Demo', path: '/portal' },
  { label: 'Sign In Demo', path: '/login' },
  { label: 'Register Preview', path: '/register' },
  { label: 'Track Cargo', path: '/track-cargo' },
  { label: 'Request a Quote', path: '/request-a-quote' },
  { label: 'Book Truck Slot', path: '/portal/book-truck-slot' },
  { label: 'Contact Operations', path: '/contact' },
  { label: 'Document Verification', path: '/verify-document' },
  { label: 'Customer Help Centre', path: '/customer-help-centre' },
];

export function Footer() {
  return (
    <footer className="w-full bg-primary-container text-on-primary">
      <div className="max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg pt-space-xl pb-space-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg pb-space-xl border-b border-primary-container/80">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <img
                alt="TRÏNŪ Logo"
                className="h-8 w-auto object-contain brightness-0 invert"
                src={LOGO_URL}
              />
              <span className="font-title-lg text-title-lg text-on-primary font-bold">TRÏNŪ</span>
            </div>
            <p className="font-headline-sm text-headline-sm text-primary-fixed">
              Bringing the port closer.
            </p>
            <p className="font-body-sm text-body-sm text-inverse-primary leading-relaxed">
              TRÏNŪ Bonded Warehouse, Abuja Flagship Facility, Nigeria
            </p>
          </div>

          <FooterColumn title="Services" links={SERVICES} />
          <FooterColumn title="Company" links={COMPANY} />
          <FooterColumn title="Quick Actions" links={QUICK} />
        </div>

        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-inverse-primary">
            <div>
              <p>© 2026 TRÏNŪ Bonded Warehouse. All rights reserved.</p>
              <p className="mt-1 font-label-sm text-label-sm text-inverse-primary/70">UI preview · local sample data · no backend connection</p>
            </div>
          <div className="flex items-center gap-space-md">
            <Link to="/privacy-policy" className="hover:text-on-primary transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link to="/terms-of-use" className="hover:text-on-primary transition-colors">
              Terms of Use
            </Link>
            <span>·</span>
            <Link to="/regulatory-compliance" className="hover:text-on-primary transition-colors">
              Regulatory Compliance
            </Link>
          </div>
        </div>

        <div className="mt-space-md pt-space-md border-t border-primary-container/80">
          <p className="font-label-sm text-label-sm text-outline-variant leading-relaxed max-w-[1280px]">
            TRÏNŪ Bonded Warehouse operates within the Nigeria Customs Service Act 2023 and
            applicable NCS procedures for bonded facilities. The platform facilitates and
            coordinates; Customs decides. All regulatory and customs-facing claims are made under
            the authority of the facility's licence conditions and bond undertakings.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; path: string }[];
}) {
  return (
    <div className="flex flex-col gap-space-sm">
      <h4 className="font-title-sm text-title-sm text-primary-fixed uppercase tracking-wider mb-space-xs">
        {title}
      </h4>
      <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-inverse-primary">
        {links.map((l) => (
          <li key={l.path} className="hover:text-on-primary transition-colors">
            <Link to={l.path}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}