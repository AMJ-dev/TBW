import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const defaultSeo = {
	title: "TRÏNŪ Bonded Warehouse",
	description:
		"TRÏNŪ brings the port closer — bonded terminal operations for cargo, warehousing, documentation, and gate coordination in Abuja, Nigeria.",
};

const seoByPath: Record<string, { title: string; description: string }> = {
	"/": {
		title: "TRÏNŪ Bonded Warehouse | Bringing the port closer to Abuja",
		description:
			"TRÏNŪ brings the port closer — so trade in Abuja moves at Abuja's pace. Bonded warehousing, cargo handling, documentation support, and gate coordination.",
	},
	"/services": {
		title: "Terminal Services | TRÏNŪ",
		description:
			"Bonded warehousing, cargo handling, documentation support, and gate coordination. One operating record from arrival to gate-out.",
	},
	"/tracking": {
		title: "Track Cargo | TRÏNŪ",
		description:
			"Track a container, bill of lading, or TRÏNŪ terminal reference. Public tracking shows movement status without exposing sensitive commercial details.",
	},
	"/portal": {
		title: "Stakeholder Portal | TRÏNŪ",
		description:
			"Cargo, documents, financial obligations, and appointment visibility for TRÏNŪ stakeholders.",
	},
	"/about": {
		title: "About TRÏNŪ Bonded Warehouse",
		description:
			"TRÏNŪ brings the port closer — the missing link between Nigeria's ports and the businesses that keep Abuja and the north moving.",
	},
	"/contact": {
		title: "Contact TRÏNŪ Bonded Warehouse",
		description:
			"Contact TRÏNŪ about bonded terminal operations, cargo handling, and stakeholder support.",
	},
	"/verify": {
		title: "Verify a Document | TRÏNŪ",
		description:
			"Verify the integrity of a document reference without exposing sensitive cargo information.",
	},
	"/news": {
		title: "News & Notices | TRÏNŪ",
		description:
			"Planned examination windows, gate coordination, and documentation updates — published before they affect your next move.",
	},
	"/faq": {
		title: "Frequently Asked Questions | TRÏNŪ",
		description:
			"Quick guidance for tracking, storage, documents, gate appointments, and release coordination across the TRÏNŪ bonded terminal.",
	},
	"/quote": {
		title: "Request a Quote | TRÏNŪ",
		description:
			"Tell us what needs to move through TRÏNŪ. Six guided steps, saved locally in this prototype.",
	},
	"/compliance": {
		title: "Customs & Compliance | TRÏNŪ",
		description:
			"TRÏNŪ provides facilities, records, and coordination support. Customs examinations, assessments, releases, and other statutory decisions remain solely with the competent authority.",
	},
	"/careers": {
		title: "Careers | TRÏNŪ",
		description:
			"Build the terminal that Abuja deserves. Open roles across operations, gate, warehouse, documentation, finance, and customer service.",
	},
	"/terms": {
		title: "Terms of Use | TRÏNŪ",
		description:
			"The rules that govern your access to and use of the TRÏNŪ public website, public tracking, and stakeholder portal.",
	},
	"/privacy": {
		title: "Privacy Notice | TRÏNŪ",
		description:
			"How TRÏNŪ Bonded Warehouse collects, uses, and protects personal data across the public website, public tracking, and stakeholder portal.",
	},
	"/login": {
		title: "Sign In | TRÏNŪ",
		description:
			"Sign in to your TRÏNŪ workspace to access cargo, documents, financial obligations, and truck coordination.",
	},
	"/register": {
		title: "Request Access | TRÏNŪ",
		description:
			"Create your TRÏNŪ account. Registration is reviewed before access is granted.",
	},
	"/forgot-password": {
		title: "Reset Your Password | TRÏNŪ",
		description:
			"Reset your TRÏNŪ password. Enter the email address registered with your account.",
	},
	"/reset-password": {
		title: "Set a New Password | TRÏNŪ",
		description: "Choose a strong password that you don't use anywhere else.",
	},
	"/logout": {
		title: "Signed Out | TRÏNŪ",
		description: "Your TRÏNŪ session has ended. Sign in again to continue.",
	},
	"/mfa": {
		title: "Two-Factor Verification | TRÏNŪ",
		description:
			"Verify your identity with a six-digit code from your authenticator app.",
	},
	"/mfa/setup": {
		title: "Set Up Two-Factor | TRÏNŪ",
		description:
			"Add a second factor to your TRÏNŪ account. Setup takes about two minutes.",
	},
	"/account": {
		title: "Account Security | TRÏNŪ",
		description: "Session and device management for your TRÏNŪ account.",
	},
	"/for/importers": {
		title: "For Importers & Traders | TRÏNŪ",
		description:
			"Clear your goods closer to home. Save time, save cost, and skip the long haul — with customs coordination built in.",
	},
	"/for/agents": {
		title: "For Forwarders & Licensed Agents | TRÏNŪ",
		description:
			"A facility you plug into, not a competitor — your clients, your relationships, just faster infrastructure.",
	},
	"/for/shipping-lines": {
		title: "For Shipping Lines & Agents | TRÏNŪ",
		description:
			"Coordinate arrival, container status, and equipment interchange with an inland bonded facility that shares your operational language.",
	},
	"/for/transporters": {
		title: "For Transporters & Haulage | TRÏNŪ",
		description:
			"Plan appointments and gate movements around confirmed cargo readiness — not around a phone call and a hope.",
	},
	"/how-it-works": {
		title: "How It Works | TRÏNŪ",
		description:
			"Seven stages from port to release. A transparent, compliant inland cargo transit protocol for the Federal Capital Territory.",
	},
};

export function Seo() {
	const { pathname } = useLocation();
	const seo = seoByPath[pathname] ?? defaultSeo;

	useEffect(() => {
		document.title = seo.title;
		setMeta("description", seo.description);
		setMeta("og:title", seo.title, "property");
		setMeta("og:description", seo.description, "property");
		setMeta("og:url", window.location.href, "property");
		setMeta("og:type", "website", "property");
		setMeta("og:locale", "en_NG", "property");
		setMeta("twitter:card", "summary_large_image");
		setMeta("twitter:title", seo.title);
		setMeta("twitter:description", seo.description);

		let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
		if (!canonical) {
			canonical = document.createElement("link");
			canonical.rel = "canonical";
			document.head.appendChild(canonical);
		}
		canonical.href = window.location.href;
	}, [pathname, seo]);

	return null;
}

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
	let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
	if (!element) {
		element = document.createElement("meta");
		element.setAttribute(attribute, name);
		document.head.appendChild(element);
	}
	element.content = content;
}