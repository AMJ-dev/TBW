import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

const NAV_ITEMS = [
  { path: '/portal', label: 'Portal Demo' },
  { path: '/portal/book-truck-slot', label: 'Book Truck Slot' },
  { path: '/services', label: 'Services' },
  { path: '/how-it-works', label: 'How It Works' },
  { path: '/track-cargo', label: 'Track Cargo' },
  { path: '/importers-traders', label: 'Importers & Traders' },
  { path: '/forwarders-agents', label: 'Forwarders & Agents' },
  { path: '/regulators', label: 'Regulators' },
  { path: '/verify-document', label: 'Verify Document' },
  { path: '/about', label: 'About' },
  { path: '/news-notices', label: 'News' },
  { path: '/customer-help-centre', label: 'Help' },
  { path: '/login', label: 'Sign In' },
  { path: '/register', label: 'Register' },
  { path: '/contact', label: 'Contact' },
];

const DESKTOP_NAV_ITEMS = NAV_ITEMS.filter(({ path }) =>
  ['/services', '/how-it-works', '/track-cargo', '/news-notices'].includes(path),
);

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WTOZlxqxZhSk9Lr_cBf8Wm2-kFD1pSKcHEOT9QVoe5lnKl69_STVpNNfNBtC0Gl0jvdwNGIQu9W7bXq7VwUEPJnMQ4NFEfWYjBpbfxwTOxtFoj_frP47XaYs8NYMO4quD_MvTdX3N8N39bgn6T843wSai-KBlQrTAMXSKELZ_whkEQOPbmPXegf2_istNregEkPefPVGmsbB51-Fy5XcRYP5iiWDCVUnljjawki-XUm0zSo0l9AzfTA3ki-Xmj_PrOlsoAs18';

export function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-sm">
      <div className="h-20 max-w-[1440px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md">
        <Link to="/" className="flex items-center gap-space-sm">
          <img alt="TRÏNŪ Logo" className="h-8 w-auto object-contain" src={LOGO_URL} />
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-primary tracking-tight font-bold">
              TRÏNŪ
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Bonded Terminal
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-space-md">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`font-title-sm text-title-sm transition-colors py-2 whitespace-nowrap ${
                  active
                    ? 'text-secondary border-b-2 border-secondary'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-space-md">
          <Link
            to="/request-a-quote"
            className="hidden sm:inline-flex items-center justify-center bg-secondary-container hover:bg-secondary text-on-secondary px-space-lg py-space-sm rounded-xl font-title-sm text-title-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
          >
            Request a Quote
          </Link>
          <Link
            to="/login"
            aria-label="Open demo sign-in"
            title="Demo sign-in"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-secondary"
          >
            <Icon name="person" className="text-[20px]" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-primary"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <Icon name={open ? 'close' : 'menu'} className="text-[24px]" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="bg-surface-container-lowest border-t border-surface-variant px-margin py-space-md flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className="font-title-sm text-title-sm text-on-surface-variant hover:text-secondary py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}