import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { TrackCargoPage } from '@/pages/TrackCargoPage';
import { VerifyDocumentPage } from '@/pages/VerifyDocumentPage';
import { ForwardersPage } from '@/pages/ForwardersPage';
import { ImportersPage } from '@/pages/ImportersPage';
import { RegulatoryPage } from '@/pages/RegulatoryPage';
import { ContactPage } from '@/pages/ContactPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { RequestQuotePage } from '@/pages/RequestQuotePage';
import { ServicesPage } from '@/pages/ServicesPage';
import { PublicInfoPage, PublicNotFoundPage } from '@/pages/PublicInfoPages';
import {
  PortalBookingsPage,
  PortalCargoDetailPage,
  PortalCargoPage,
  PortalCargoWorkflowPage,
  PortalContainerPage,
  PortalDashboardPage,
  PortalDisputePage,
  PortalDocumentsPage,
  PortalInvoicesPage,
  PortalKycPage,
  PortalPackagePage,
  PortalPaymentsPage,
  PortalAccessPage,
  PortalStatementPage,
} from '@/pages/PortalUiPages';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background font-body-md text-on-surface antialiased">
        <Header />
        <main className="w-full pt-20 bg-background">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:serviceSlug" element={<PublicInfoPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/track-cargo" element={<TrackCargoPage />} />
            <Route path="/importers-traders" element={<ImportersPage />} />
            <Route path="/forwarders-agents" element={<ForwardersPage />} />
            <Route path="/regulators" element={<RegulatoryPage />} />
            <Route path="/verify-document" element={<VerifyDocumentPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/request-a-quote" element={<RequestQuotePage />} />
            <Route path="/about" element={<PublicInfoPage />} />
            <Route path="/news-notices" element={<PublicInfoPage />} />
            <Route path="/news-notices/:newsSlug" element={<PublicInfoPage />} />
            <Route path="/careers" element={<PublicInfoPage />} />
            <Route path="/customer-help-centre" element={<PublicInfoPage />} />
            <Route path="/privacy-policy" element={<PublicInfoPage />} />
            <Route path="/terms-of-use" element={<PublicInfoPage />} />
            <Route path="/regulatory-compliance" element={<PublicInfoPage />} />
            <Route path="/portal" element={<PortalDashboardPage />} />
            <Route path="/portal/cargo" element={<PortalCargoPage />} />
            <Route path="/portal/cargo/:id" element={<PortalCargoDetailPage />} />
            <Route path="/portal/cargo/:id/service-request" element={<PortalCargoWorkflowPage />} />
            <Route path="/portal/cargo/:id/claim" element={<PortalCargoWorkflowPage />} />
            <Route path="/portal/containers/:id" element={<PortalContainerPage />} />
            <Route path="/portal/packages/:id" element={<PortalPackagePage />} />
            <Route path="/portal/bookings" element={<PortalBookingsPage />} />
            <Route path="/portal/book-truck-slot" element={<PortalBookingsPage />} />
            <Route path="/gate-booking" element={<PortalBookingsPage />} />
            <Route path="/portal/documents" element={<PortalDocumentsPage />} />
            <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
            <Route path="/portal/payments" element={<PortalPaymentsPage />} />
            <Route path="/portal/payments/dispute" element={<PortalDisputePage />} />
            <Route path="/portal/statement" element={<PortalStatementPage />} />
            <Route path="/portal/kyc" element={<PortalKycPage />} />
            <Route path="/login" element={<PortalAccessPage />} />
            <Route path="/register" element={<PortalAccessPage />} />
            <Route path="/forgot-password" element={<PortalAccessPage />} />
            <Route path="/reset-password" element={<PortalAccessPage />} />
            <Route path="/mfa" element={<PortalAccessPage />} />
            <Route path="/mfa/setup" element={<PortalAccessPage />} />
            <Route path="/session-management" element={<PortalAccessPage />} />
            <Route path="/logout" element={<PortalAccessPage />} />
            <Route path="*" element={<PublicNotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;