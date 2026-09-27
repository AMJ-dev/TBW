import { createBrowserRouter, Route } from "react-router-dom";
import { AboutPage } from "@/pages/public/about-page";
import { ContactPage } from "@/pages/public/contact-page";
import { FaqPage } from "@/pages/public/faq-page";
import { HomePage } from "@/pages/public/home-page";
import { NewsPage } from "@/pages/public/news-page";
import { QuotePage } from "@/pages/public/quote-page";
import { ServicesPage } from "@/pages/public/services-page";
import { TrackingPage } from "@/pages/public/tracking-page";
import { VerifyPage } from "@/pages/public/verify-page";
import {TermsPage} from "@/pages/public/terms";
import {PrivacyPage} from "@/pages/public/privacy";
import {CareersPage} from "@/pages/public/careers";
import { CompliancePage } from "@/pages/public/compliance";
import { AudiencePage } from "@/pages/public/audience";

import { MfaPage } from "@/pages/auth/mfa";
import { LoginPage } from "@/pages/auth/login";
import { ForgotPasswordPage } from "@/pages/auth/forgot-password";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { RegisterPage } from "@/pages/auth/register";
import {LogoutPage} from "@/pages/auth/logout";
import {SessionManagementPage} from "@/pages/auth/sesssion-management";

import AdminRoute from "@/pages/admin";
import AdminAuditRoute from "@/pages/admin/audit";
import AdminConfigurationRoute from "@/pages/admin/configuration";
import AdminOrganizationsRoute from "@/pages/admin/organizations";
import AdminRolesRoute from "@/pages/admin/roles";
import AdminUsersRoute from "@/pages/admin/users";

import FinanceRoute from "@/pages/finance";
import FinanceDashboardRoute from "@/pages/finance/dashboard";
import FinanceInvoicesRoute from "@/pages/finance/invoices";
import FinancePaymentsRoute from "@/pages/finance/payments";
import FinanceTariffsRoute from "@/pages/finance/tariffs";
import FinanceCreditApplyRoute from "@/pages/finance/credit/apply";
import FinanceCreditLimitsRoute from "@/pages/finance/credit/limits";
import FinanceCollectionsRoute from "@/pages/finance/collections";
import FinanceStatementRoute from "@/pages/finance/statement";
import FinanceApprovalsRoute from "@/pages/finance/approvals";
import FinanceTaxRoute from "@/pages/finance/tax";
import FinanceReconciliationRoute from "@/pages/finance/reconciliation";

import GateRoute from "@/pages/gate";
import GateAppointmentsRoute from "@/pages/gate/appointments";
import GateDashboardRoute from "@/pages/gate/dashboard";
import GatePassesRoute from "@/pages/gate/passes";
import { GateInPage, GateOutPage } from "@/pages/gate/console";
import GateVehiclesRoute from "@/pages/gate/vehicles";

import OperationsDashboardRoute from "@/pages/operations/dashboard";
import OperationsExaminationRoute from "@/pages/operations/examination";
import OperationsHoldsRoute from "@/pages/operations/holds";
import OperationsReceivingRoute from "@/pages/operations/receiving";
import OperationsWarehouseRoute from "@/pages/operations/warehouse";
import OperationsYardRoute from "@/pages/operations/yard";
import OperationsManifestRoute from "@/pages/operations/manifest";
import OperationsSealsRoute from "@/pages/operations/seals";
import OperationsInventoryRoute from "@/pages/operations/inventory";
import OperationsStuffingRoute from "@/pages/operations/stuffing";
import OperationsCycleCountRoute from "@/pages/operations/cycle-count";
import OperationsValueAddedRoute from "@/pages/operations/value-added";
import OperationsOverridesRoute from "@/pages/operations/overrides";

import PortalDashboardRoute from "@/pages/portal/dashboard";
import PortalBookingsRoute from "@/pages/portal/bookings";
import CargoPageRoute from "@/pages/portal/cargo";
import CargoDetailRoute from "@/pages/portal/cargo/$id";
import PortalDocumentsRoute from "@/pages/portal/documents";
import PortalInvoicesRoute from "@/pages/portal/invoices";
import PortalPaymentsRoute from "@/pages/portal/payments";
import ContainerDetailRoute from "@/pages/portal/cargo/container";
import PackageDetailRoute from "@/pages/portal/cargo/package";
import ServiceRequestRoute from "@/pages/portal/cargo/service-request";
import DiscrepancyClaimRoute from "@/pages/portal/cargo/claim";
import InvoiceDisputeRoute from "@/pages/portal/payments/dispute";
import StatementPage from "@/pages/portal/statement";
import DocumentUploadRoute from "@/pages/portal/documents/upload";
import KycRoute from "@/pages/portal/kyc";
import DelegationPage from "@/pages/portal/delegation";
import UsersPage from "@/pages/portal/users";


import ReportsRoute from "@/pages/reports/index";
import ReportsComplianceRoute from "@/pages/reports/compliance";
import ReportsFinancialRoute from "@/pages/reports/financial";
import ReportsOperationsRoute from "@/pages/reports/operations";

import NotFound from "@/pages/errors/404";
import Forbidden from "@/pages/errors/403";
import RateLimited from "@/pages/errors/429";
import ServerError from "@/pages/errors/500";


export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/faq", element: <FaqPage /> },
  { path: "/news", element: <NewsPage /> },
  { path: "/quote", element: <QuotePage /> },
  { path: "/services", element: <ServicesPage /> },
  { path: "/tracking", element: <TrackingPage /> },
  { path: "/verify", element: <VerifyPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/careers", element: <CareersPage /> },
  { path: "/compliance", element: <CompliancePage /> },
  { path: "/for/:audience", element: <AudiencePage /> },

  { path: "/login", element: <LoginPage /> },
  { path: "/mfa", element: <MfaPage mode="challenge" /> },
  { path: "/mfa/setup", element: <MfaPage mode="setup" /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/logout", element: <LogoutPage /> },
  { path: "/session-management", element: <SessionManagementPage /> },

  // Admin routes
  { path: "/admin", element: <AdminRoute /> },
  { path: "/admin/audit", element: <AdminAuditRoute /> },
  { path: "/admin/configuration", element: <AdminConfigurationRoute /> },
  { path: "/admin/organizations", element: <AdminOrganizationsRoute /> },
  { path: "/admin/roles", element: <AdminRolesRoute /> },
  { path: "/admin/users", element: <AdminUsersRoute /> },

  // Finance routes
  { path: "/finance", element: <FinanceRoute /> },
  { path: "/finance/dashboard", element: <FinanceDashboardRoute /> },
  { path: "/finance/invoices", element: <FinanceInvoicesRoute /> },
  { path: "/finance/payments", element: <FinancePaymentsRoute /> },
  { path: "/finance/tariffs", element: <FinanceTariffsRoute /> },
  { path: "/finance/credit/apply", element: <FinanceCreditApplyRoute /> },
  { path: "/finance/credit/limits", element: <FinanceCreditLimitsRoute /> },
  { path: "/finance/collections", element: <FinanceCollectionsRoute /> },
  { path: "/finance/statement/:customer", element: <FinanceStatementRoute /> },
  { path: "/finance/approvals", element: <FinanceApprovalsRoute /> },
  { path: "/finance/tax", element: <FinanceTaxRoute /> },
  { path: "/finance/reconciliation", element: <FinanceReconciliationRoute /> },

  // Gate routes
  { path: "/gate", element: <GateRoute /> },
  { path: "/gate/appointments", element: <GateAppointmentsRoute /> },
  { path: "/gate/dashboard", element: <GateDashboardRoute /> },
  { path: "/gate/passes", element: <GatePassesRoute /> },
  { path: "/gate/in", element: <GateInPage />}, 
  { path: "/gate/out", element: <GateOutPage />}, 
  { path: "/gate/vehicles", element: <GateVehiclesRoute />},
  

  // Operations routes
  { path: "/operations", element: <OperationsDashboardRoute /> },
  { path: "/operations/dashboard", element: <OperationsDashboardRoute /> },
  { path: "/operations/examination", element: <OperationsExaminationRoute /> },
  { path: "/operations/holds", element: <OperationsHoldsRoute /> },
  { path: "/operations/receiving", element: <OperationsReceivingRoute /> },
  { path: "/operations/warehouse", element: <OperationsWarehouseRoute /> },
  { path: "/operations/yard", element: <OperationsYardRoute /> },
  { path: "/operations/manifest", element: <OperationsManifestRoute /> },
  { path: "/operations/seals", element: <OperationsSealsRoute /> },
  { path: "/operations/inventory", element: <OperationsInventoryRoute /> },
  { path: "/operations/stuffing", element: <OperationsStuffingRoute /> },
  { path: "/operations/cycle-count", element: <OperationsCycleCountRoute /> },
  { path: "/operations/value-added", element: <OperationsValueAddedRoute /> },
  { path: "/operations/overrides", element: <OperationsOverridesRoute />},

  // Portal routes
  { path: "/portal", element: <PortalDashboardRoute /> },
  { path: "/portal/bookings", element: <PortalBookingsRoute /> },
  { path: "/portal/cargo", element: <CargoPageRoute /> },
  { path: "/portal/cargo/:id", element: <CargoDetailRoute /> },
  { path: "/portal/dashboard", element: <PortalDashboardRoute /> },
  { path: "/portal/documents", element: <PortalDocumentsRoute /> },
  { path: "/portal/invoices", element: <PortalInvoicesRoute /> },
  { path: "/portal/payments", element: <PortalPaymentsRoute /> },
  { path: "/portal/containers/:id", element: <ContainerDetailRoute />},
  { path: "/portal/packages/:id", element: <PackageDetailRoute />}, 
  { path: "/portal/cargo/:id/service-request", element: <ServiceRequestRoute />},  
  { path: "/portal/cargo/:id/claim", element: <DiscrepancyClaimRoute />}, 
  { path: "/portal/payments/dispute", element: <InvoiceDisputeRoute />}, 
  { path: "/portal/statement", element: <StatementPage />}, 
  { path: "/portal/documents/upload", element: <DocumentUploadRoute />},  
  { path: "/portal/kyc", element: <KycRoute />},  
  { path: "/portal/delegation", element: <DelegationPage />},  
  { path: "/portal/users", element: <UsersPage />},  

  // Reports routes
  { path: "/reports", element: <ReportsRoute /> },
  { path: "/reports/compliance", element: <ReportsComplianceRoute /> },
  { path: "/reports/financial", element: <ReportsFinancialRoute /> },
  { path: "/reports/operations", element: <ReportsOperationsRoute /> },

  // Error routes
  { path: "/404", element: <NotFound /> },
  { path: "/403", element: <Forbidden /> },
  { path: "/429", element: <RateLimited /> },
  { path: "/500", element: <ServerError /> },
  
  { path: "*", element: <NotFound /> },
]);
