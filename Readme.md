Got it — you're asking about the **UI only**. Here's what's missing from the frontend against the Spec, page by page.

---

## Missing UI Screens

### Public site (Spec §11)
- **Document library / customer guide** — Spec §11 lists *"versioned customer guide and document library"*


### Terminal Operating Core (Spec §17–20)

- **Handheld/mobile operations** — no handheld-optimised screens at all
- **ANPR events** — no view for plate recognition events

### Finance (Spec §21)
- **Receipt view** — no dedicated receipt detail page (only a modal)

### Reports (Spec §29)
- **Scheduled report management** — no `/reports/schedules` (edit/delete schedules)
- **Drill-down views** — no `/reports/$id/$drilldown`
- **Report builder / configurator** — no way to choose date range, filters, columns
- **Report viewer** — each report catalog entry is a card, but clicking it doesn't open a viewer
- **Trend comparison** — no dedicated trend page

### Admin (Spec §31)
- **Feature flags** — no `/admin/flags`
- **Retention / purge** — no `/admin/retention`
- **Maintenance mode** — no `/admin/maintenance`
- **Scheduled notices** — no `/admin/notices`
- **Regulator read-only access** — no `/admin/regulator-access`
- **Public metrics suppression** — no `/admin/public-metrics`
- **Approval history** — no `/admin/approvals`
- **Permission matrix editor** — the Roles page shows permissions but doesn't let you edit them per-module
- **Configuration history / diff** — no way to see what changed

### Notifications (Spec §22)
- **Notification center** — no `/notifications` list view
- **Preferences** — no `/account/notifications` (per-user, per-channel, quiet hours, opt-out)
- **Delivery status** — no admin view for retry/status

### Integrations (Spec §23–27)
- **Integration health dashboard** — spec explicitly requires this
- **Per-integration config pages** — no `/admin/integrations` for enabling/disabling each adapter
- **Dead-letter queue view** — no admin view for failed payloads
- **Manual gateway screens** — no officer UI for recording Customs authority references when API unavailable

### Document Management (Spec §16)
- **Document verification revocation** — no admin UI for revoking documents
- **Document version history** — no `/portal/documents/$id/versions`
- **QR deep link landing** — no `/v/$code` page for scanning from a paper document

### Search (Spec §31)
- **Global search results page** — the ⌘K modal shows 3 suggested records and stops. No `/search?q=` route.
- **Search filters** — no ability to filter by type, date, status, actor

### Role-specific views
- **Importer/Consignee view** vs **Agent view** vs **Transporter view** — the AppShell has a role switcher but it doesn't change what's shown; the sidebar and content are identical for all roles
- **Driver view** — no mobile-friendly gate pass screen for drivers
- **Regulator view** — no time-boxed read-only view for Customs auditors

### Mobile / PWA (Spec §30)
- **Mobile homepage variant** — Spec §30 lists a dedicated mobile homepage with 4 buttons
- **PWA install prompt**
- **Offline banner** — no "you are offline" indicator
- **Sync conflict UI** — no screen for resolving conflicts after reconnection
- **Handheld UI variants** — no tablet/phone-optimised receiving, positioning, picking, inspection, or gate screens

### Public Terminal Map (Spec §28)
- **Public terminal map** — the ground map in Operations is internal-only. Spec §28 requires a public view with the journey Gate → Inspection → Container Yard → Bonded Warehouse → Loading → Administration → Exit.
- **Accessible non-visual equivalent** — spec requires this for the map

---

## Missing UI Features (existing screens)

### Everywhere
- **Loading states** — no skeletons, spinners, or "fetching" states. Everything appears instantly because it's local state.
- **Empty states** — some tables have them, most don't
- **Error states** — no "something went wrong" screen; every page assumes success
- **Retry / offline indicator**
- **Breadcrumbs** — no breadcrumb navigation anywhere
- **Pagination** — every table says "Page 1 of 1" and shows all rows
- **Row selection** — no checkboxes for bulk actions
- **Bulk actions** — no "select all → move/assign/export"
- **Sorting** — columns aren't sortable
- **Column customization** — no show/hide columns

### Forms
- **Validation feedback** — most forms only check on submit; no inline errors
- **Required field indicators** — the asterisk pattern isn't used
- **Field-level help text** — some fields have it, most don't
- **Character counters** on textareas
- **File upload progress** — the upload buttons are decorative
- **Drag-and-drop** for file upload
- **Auto-save / draft** for multi-step forms
- **Step validation** — the quote wizard only validates step 1

### Modals / dialogs
- **Escape key handling** — none of the modals close on Escape
- **Focus trap** — modals don't trap keyboard focus
- **Return focus to trigger** — modals don't return focus on close
- **Confirm dialogs** — destructive actions (revoke, delete, reject) have no confirmation step

### Tables
- **Keyboard navigation** — arrow keys don't work on tables
- **Row expansion** — no expandable rows for additional detail
- **Frozen columns** on wide tables
- **Responsive behavior** — the tables show a horizontal scroll on mobile; the spec implies card-based mobile layouts

### Notifications & toasts
- **Toast duration** — not configurable
- **Toast actions** — no "Undo" or "View" links in toasts
- **Persistent notification bell** — the bell has a red dot but clicking it does nothing

---

## Missing UI Elements

### Metadata & trust
- **Page-level breadcrumbs** (`Home > Portal > Cargo > TRN-IMP-002481`)
- **Last updated timestamps** on list views
- **Audit trail per record** — no per-row "view history" link
- **Version indicator** for documents and records
- **Digital signature / seal display** on documents
- **QR code rendering** — the Verify page shows a static QrCode icon, not a real QR encoding the reference
- **Print-friendly layouts** — CSS for printing gate passes, invoices, receipts

### Content
- **Real legal copy** — no Terms of Use, no Privacy Policy, no Cookie Notice
- **Cookie consent banner** — required by NDPA (Spec §34)
- **Accessibility statement** — required for WCAG 2.2 AA (Spec §36)
- **Contact form phone/time formatting hints**
- **Language switcher** — English-only in the spec, but the UI has no i18n scaffolding
- **Currency switcher** — Spec §21 allows optional foreign currency; no UI

### Utilities
- **Keyboard shortcuts help** — no `?` key to show shortcuts
- **Command palette** — the ⌘K modal exists but is incomplete
- **Copy-to-clipboard** on reference numbers
- **Share button** for records
- **Bookmark / pin** for frequently used records

---

## Missing Accessibility (WCAG 2.2 AA — Spec §36)

- **Skip to content** link — not present
- **Focus indicators** — most interactive elements lack visible focus rings
- **aria-live regions** — toasts don't announce; error messages don't announce
- **Proper form labels** — many labels are visual `<span>` not `<label htmlFor>`
- **Alt text** on logos and status icons
- **Color contrast** — some `text-ink-soft` on `bg-sand` combinations likely fail AA
- **Keyboard trap** in modals
- **Reduced motion** — no `prefers-reduced-motion` handling; the `trinu-rise` animation always plays
- **Landmark regions** — `<main>`, `<nav>`, `<header>`, `<footer>` inconsistently applied
- **Heading hierarchy** — pages often jump from `<h1>` to `<h3>`
- **Touch targets ≥48px** — some small buttons (icon-only 32–36px) fail Spec §36 NFR-030

---

## Missing States & Edge Cases

- **Maintenance mode** — no interstitial
- **Session expired** — no re-auth prompt
- **Concurrent edit conflict** — no UI for "another user has modified this record"
- **Duplicate submission prevention** — forms can be resubmitted
- **Network timeout UI**

---

## Missing Data Management UI

- **Bulk import** — no CSV/Excel import UI (Spec §17 mentions CSV/XLSX intake for manifests)
- **Bulk export** — the "Export" buttons exist but generate fake data
- **Saved views** — Spec §15.2 says *"Filter/sort/export cargo with saved views"* — no UI for creating/loading saved views
- **Advanced filters** — only single-dropdown filters, no multi-filter panels

---

## Missing Role-Specific UI

- **Approval queues** — no dedicated view for a supervisor to approve discounts, waivers, credit notes, overrides
- **Assignment workflow** — no "assign to me" / "assign to desk" UI
- **SLA timers** — no countdown or overdue indicator on tasks
- **Comment threads** — no way to add notes/discussion on records
- **@mentions** — no internal mentioning

---

## Summary — highest-impact gaps

If I had to pick the **top 10 most important UI additions** to close the largest gaps against the spec:

1. **Login / register / MFA / password reset** — entire auth flow is missing
2. **Consignment detail page** — the deep-dive view that most portal flows lead to
3. **Real QR codes** on gate passes, invoices, and verification pages
4. **Notification center + preferences** — Spec §22
5. **Loading / empty / error states** on every screen
6. **Role-specific view differences** — the switcher should change the UI
7. **Mobile / handheld UI variants** — Spec §30 makes this a core requirement
8. **Public terminal map** — Spec §28
9. **Consent / privacy notice / cookie banner** — NDPA compliance
10. **Accessibility fixes** — skip link, focus rings, aria-live, keyboard navigation

Want me to build any of these? I'd suggest starting with **auth + consignment detail** since those unlock the most downstream flows.




add service-request to 
Consignment detail page — add a "Request a service" action button next to "Add note"

Container detail page — same, in the header actions

Package detail page — same

Portal dashboard — add to a "Quick actions" panel if you build one