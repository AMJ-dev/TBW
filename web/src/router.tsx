import { lazy, Suspense } from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import Preloader from "@/components/preloader";
import RequireAuth from "@/components/require-auth";
import RootLayout from "@/root-layout";

const HomePage = lazy(() => import("@/pages/public/home-page"));
const AboutPage = lazy(() => import("@/pages/public/about-page"));
const ContactPage = lazy(() => import("@/pages/public/contact-page"));
const FaqPage = lazy(() => import("@/pages/public/faq-page"));
const NewsPage = lazy(() => import("@/pages/public/news-page"));
const QuotePage = lazy(() => import("@/pages/public/quote-page"));
const ServicesPage = lazy(() => import("@/pages/public/services-page"));
const TrackingPage = lazy(() => import("@/pages/public/tracking-page"));
const VerifyPage = lazy(() => import("@/pages/public/verify-page"));
const TermsPage = lazy(() => import("@/pages/public/terms"));
const PrivacyPage = lazy(() => import("@/pages/public/privacy"));
const CareersPage = lazy(() => import("@/pages/public/careers"));
const CompliancePage = lazy(() => import("@/pages/public/compliance"));
const AudiencePage = lazy(() => import("@/pages/public/audience"));
const HowItWorksPage = lazy(() => import("@/pages/public/how-it-work"));

const LoginPage = lazy(() => import("@/pages/auth/login"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const LogoutPage = lazy(() => import("@/pages/auth/logout"));
const SessionManagementPage = lazy(() => import("@/pages/profile/sesssion-management"));
const ChangePasswordPage = lazy(() => import("@/pages/profile/change-password"));
const MfaSetupPage = lazy(() => import("@/pages/auth/mfa-setup"));
const MfaChallengePage = lazy(() => import("@/pages/auth/mfa-challenge"));
const OtpPage = lazy(() => import("@/pages/auth/otp"));
const OrganisationResubmitPage = lazy(() => import("@/pages/organisation-resubmit"));

const MyProfilePage = lazy(() => import("@/pages/profile/my"));
const EditProfilePage = lazy(() => import("@/pages/profile/edit"));

const AdminPage = lazy(() => import("@/pages/admin"));
const AdminAuditPage = lazy(() => import("@/pages/admin/audit"));
const AdminConfigurationPage = lazy(() => import("@/pages/admin/configuration"));
const AdminOrganizationsPage = lazy(() => import("@/pages/admin/organizations"));
const AdminOrganizationDetailsPage = lazy(() => import("@/pages/admin/organization-details"));
const AdminRolesPage = lazy(() => import("@/pages/admin/roles"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminAddUsersPage = lazy(() => import("@/pages/admin/add-user"));
const AdminUserDetailsPage = lazy(() => import("@/pages/admin/user-details"));

const FinancePage = lazy(() => import("@/pages/finance"));
const FinanceDashboardPage = lazy(() => import("@/pages/finance/dashboard"));
const FinanceInvoicesPage = lazy(() => import("@/pages/finance/invoices"));
const FinancePaymentsPage = lazy(() => import("@/pages/finance/payments"));
const FinanceTariffsPage = lazy(() => import("@/pages/finance/tariffs"));
const FinanceCreditApplyPage = lazy(() => import("@/pages/finance/credit/apply"));
const FinanceCreditLimitsPage = lazy(() => import("@/pages/finance/credit/limits"));
const FinanceCollectionsPage = lazy(() => import("@/pages/finance/collections"));
const FinanceStatementPage = lazy(() => import("@/pages/finance/statement"));
const FinanceApprovalsPage = lazy(() => import("@/pages/finance/approvals"));
const FinanceTaxPage = lazy(() => import("@/pages/finance/tax"));
const FinanceReconciliationPage = lazy(() => import("@/pages/finance/reconciliation"));

const GatePage = lazy(() => import("@/pages/gate"));
const GateDashboardPage = lazy(() => import("@/pages/gate/dashboard"));
const GateAppointmentsPage = lazy(() => import("@/pages/gate/appointments"));
const GatePassesPage = lazy(() => import("@/pages/gate/passes"));
const GateVehiclesPage = lazy(() => import("@/pages/gate/vehicles"));
const GateConsolePage = lazy(() => import("@/pages/gate/console"));

const OperationsDashboardPage = lazy(() => import("@/pages/operations/dashboard"));
const OperationsExaminationPage = lazy(() => import("@/pages/operations/examination"));
const OperationsHoldsPage = lazy(() => import("@/pages/operations/holds"));
const OperationsReceivingPage = lazy(() => import("@/pages/operations/receiving"));
const OperationsWarehousePage = lazy(() => import("@/pages/operations/warehouse"));
const OperationsYardPage = lazy(() => import("@/pages/operations/yard"));
const OperationsManifestPage = lazy(() => import("@/pages/operations/manifest"));
const OperationsSealsPage = lazy(() => import("@/pages/operations/seals"));
const OperationsInventoryPage = lazy(() => import("@/pages/operations/inventory"));
const OperationsStuffingPage = lazy(() => import("@/pages/operations/stuffing"));
const OperationsCycleCountPage = lazy(() => import("@/pages/operations/cycle-count"));
const OperationsValueAddedPage = lazy(() => import("@/pages/operations/value-added"));
const OperationsOverridesPage = lazy(() => import("@/pages/operations/overrides"));

const PortalDashboardPage = lazy(() => import("@/pages/portal/dashboard"));
const PortalBookingsPage = lazy(() => import("@/pages/portal/bookings"));
const CargoPage = lazy(() => import("@/pages/portal/cargo"));
const CargoDetailPage = lazy(() => import("@/pages/portal/cargo/$id"));
const ContainerDetailPage = lazy(() => import("@/pages/portal/cargo/container"));
const PackageDetailPage = lazy(() => import("@/pages/portal/cargo/package"));
const ServiceRequestPage = lazy(() => import("@/pages/portal/cargo/service-request"));
const DiscrepancyClaimPage = lazy(() => import("@/pages/portal/cargo/claim"));
const PortalDocumentsPage = lazy(() => import("@/pages/portal/documents"));
const DocumentUploadPage = lazy(() => import("@/pages/portal/documents/upload"));
const PortalInvoicesPage = lazy(() => import("@/pages/portal/invoices"));
const PortalPaymentsPage = lazy(() => import("@/pages/portal/payments"));
const InvoiceDisputePage = lazy(() => import("@/pages/portal/payments/dispute"));
const StatementPage = lazy(() => import("@/pages/portal/statement"));
const KycPage = lazy(() => import("@/pages/portal/kyc"));
const DelegationPage = lazy(() => import("@/pages/portal/delegation"));
const PortalUsersPage = lazy(() => import("@/pages/portal/users"));

const ReportsPage = lazy(() => import("@/pages/reports/index"));
const ReportsOperationsPage = lazy(() => import("@/pages/reports/operations"));
const ReportsFinancialPage = lazy(() => import("@/pages/reports/financial"));
const ReportsCompliancePage = lazy(() => import("@/pages/reports/compliance"));

const Unauthorized = lazy(() => import("@/pages/errors/401"));
const NotFoundPage = lazy(() => import("@/pages/errors/404"));
const ForbiddenPage = lazy(() => import("@/pages/errors/403"));
const RateLimitedPage = lazy(() => import("@/pages/errors/429"));
const ServerErrorPage = lazy(() => import("@/pages/errors/500"));
const AccountSuspended = lazy(() => import("@/pages/errors/suspended"));

export default function Routers() {
	return (
		<Suspense fallback={<Preloader />}>
			<Routes>
				<Route element={<RootLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/index" element={<Navigate to="/" replace />} />
					<Route path="/about" element={<AboutPage />} />
					<Route path="/contact" element={<ContactPage />} />
					<Route path="/faq" element={<FaqPage />} />
					<Route path="/news" element={<NewsPage />} />
					<Route path="/quote" element={<QuotePage />} />
					<Route path="/services" element={<ServicesPage />} />
					<Route path="/tracking" element={<TrackingPage />} />
					<Route path="/verify" element={<VerifyPage />} />
					<Route path="/terms" element={<TermsPage />} />
					<Route path="/privacy" element={<PrivacyPage />} />
					<Route path="/careers" element={<CareersPage />} />
					<Route path="/compliance" element={<CompliancePage />} />
					<Route path="/for/:audience" element={<AudiencePage />} />
					<Route path="/how-it-works" element={<HowItWorksPage />} />

					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
					<Route path="/logout" element={<LogoutPage />} />
					<Route path="/session-management" element={<SessionManagementPage />} />
					<Route path="/change-password" element={<ChangePasswordPage />} />

					<Route path="/otp" element={<OtpPage />} />
					<Route path="/mfa" element={<MfaChallengePage />} />

					<Route element={<RequireAuth />}>
						<Route path="/mfa/setup" element={<MfaSetupPage />} />
						<Route path="/my-profile" element={<MyProfilePage />} />
						<Route path="/profile/edit" element={<EditProfilePage />} />

						<Route path="/admin" element={<AdminPage />} />
						<Route path="/admin/audit" element={<AdminAuditPage />} />
						<Route path="/admin/configuration" element={<AdminConfigurationPage />} />
						<Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
						<Route path="/admin/organizations/:id" element={<AdminOrganizationDetailsPage />} />
						<Route path="/admin/roles" element={<AdminRolesPage />} />
						<Route path="/admin/users" element={<AdminUsersPage />} />
						<Route path="/admin/user/add" element={<AdminAddUsersPage />} />
						<Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />

						<Route path="/finance" element={<FinancePage />} />
						<Route path="/finance/dashboard" element={<FinanceDashboardPage />} />
						<Route path="/finance/invoices" element={<FinanceInvoicesPage />} />
						<Route path="/finance/payments" element={<FinancePaymentsPage />} />
						<Route path="/finance/tariffs" element={<FinanceTariffsPage />} />
						<Route path="/finance/credit/apply" element={<FinanceCreditApplyPage />} />
						<Route path="/finance/credit/limits" element={<FinanceCreditLimitsPage />} />
						<Route path="/finance/collections" element={<FinanceCollectionsPage />} />
						<Route path="/finance/statement/:customer" element={<FinanceStatementPage />} />
						<Route path="/finance/approvals" element={<FinanceApprovalsPage />} />
						<Route path="/finance/tax" element={<FinanceTaxPage />} />
						<Route path="/finance/reconciliation" element={<FinanceReconciliationPage />} />

						<Route path="/gate" element={<GatePage />} />
						<Route path="/gate/dashboard" element={<GateDashboardPage />} />
						<Route path="/gate/appointments" element={<GateAppointmentsPage />} />
						<Route path="/gate/passes" element={<GatePassesPage />} />
						<Route path="/gate/in" element={<GateConsolePage />} />
						<Route path="/gate/out" element={<GateConsolePage />} />
						<Route path="/gate/vehicles" element={<GateVehiclesPage />} />

						<Route path="/operations" element={<OperationsDashboardPage />} />
						<Route path="/operations/dashboard" element={<OperationsDashboardPage />} />
						<Route path="/operations/examination" element={<OperationsExaminationPage />} />
						<Route path="/operations/holds" element={<OperationsHoldsPage />} />
						<Route path="/operations/receiving" element={<OperationsReceivingPage />} />
						<Route path="/operations/warehouse" element={<OperationsWarehousePage />} />
						<Route path="/operations/yard" element={<OperationsYardPage />} />
						<Route path="/operations/manifest" element={<OperationsManifestPage />} />
						<Route path="/operations/seals" element={<OperationsSealsPage />} />
						<Route path="/operations/inventory" element={<OperationsInventoryPage />} />
						<Route path="/operations/stuffing" element={<OperationsStuffingPage />} />
						<Route path="/operations/cycle-count" element={<OperationsCycleCountPage />} />
						<Route path="/operations/value-added" element={<OperationsValueAddedPage />} />
						<Route path="/operations/overrides" element={<OperationsOverridesPage />} />

						<Route path="/portal" element={<PortalDashboardPage />} />
						<Route path="/portal/dashboard" element={<PortalDashboardPage />} />
						<Route path="/portal/bookings" element={<PortalBookingsPage />} />
						<Route path="/portal/cargo" element={<CargoPage />} />
						<Route path="/portal/cargo/:id" element={<CargoDetailPage />} />
						<Route path="/portal/containers/:id" element={<ContainerDetailPage />} />
						<Route path="/portal/packages/:id" element={<PackageDetailPage />} />
						<Route path="/portal/cargo/:id/service-request" element={<ServiceRequestPage />} />
						<Route path="/portal/cargo/:id/claim" element={<DiscrepancyClaimPage />} />
						<Route path="/portal/documents" element={<PortalDocumentsPage />} />
						<Route path="/portal/documents/upload" element={<DocumentUploadPage />} />
						<Route path="/portal/invoices" element={<PortalInvoicesPage />} />
						<Route path="/portal/payments" element={<PortalPaymentsPage />} />
						<Route path="/portal/payments/dispute" element={<InvoiceDisputePage />} />
						<Route path="/portal/statement" element={<StatementPage />} />
						<Route path="/portal/kyc" element={<KycPage />} />
						<Route path="/portal/delegation" element={<DelegationPage />} />
						<Route path="/portal/users" element={<PortalUsersPage />} />

						<Route path="/reports" element={<ReportsPage />} />
						<Route path="/reports/operations" element={<ReportsOperationsPage />} />
						<Route path="/reports/financial" element={<ReportsFinancialPage />} />
						<Route path="/reports/compliance" element={<ReportsCompliancePage />} />
						
						<Route path="/organisation-resubmit" element={<OrganisationResubmitPage />} />
					</Route>

					<Route path="/401" element={<Unauthorized />} />
					<Route path="/404" element={<NotFoundPage />} />
					<Route path="/403" element={<ForbiddenPage />} />
					<Route path="/429" element={<RateLimitedPage />} />
					<Route path="/500" element={<ServerErrorPage />} />
					<Route path="/unauthorized" element={<Unauthorized />} />
					<Route path="/account-suspended" element={<AccountSuspended />} />
					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
		</Suspense>
	);
}