import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './Layout';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';
import SessionPopup from '@/features/auth/components/SessionPopup';
import { PageFallback } from '@/shared/components/ui';

// Route-level code splitting — each page becomes its own chunk so the
// initial bundle only ships what's needed for the current screen.
const Dashboard          = lazy(() => import('@/features/dashboard/DashboardPage'));
const LeadsUploadPage    = lazy(() => import('@/features/leads/LeadsUploadPage'));
const EmailTemplatesPage = lazy(() => import('@/features/email-templates/EmailTemplatesPage'));
const CampaignLeadsPage  = lazy(() => import('@/features/campaign-leads/CampaignLeadsPage'));
const LoginPage          = lazy(() => import('@/features/auth/LoginPage'));
const UnauthorizedPage   = lazy(() => import('@/features/auth/UnauthorizedPage'));
const CallPage           = lazy(() => import('@/features/calls/CallPage'));
const AgentMailPage      = lazy(() => import('@/features/agent-mail/AgentMailPage'));
const ReportingPage      = lazy(() => import('@/features/reporting/ReportingPage'));
const LeadManagementPage = lazy(() => import('@/features/lead-management/LeadManagementPage'));
const SelectivePage      = lazy(() => import('@/pages/SelectivePage'));
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'));

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Layout>
          <SessionPopup />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              <Route element={<PrivateRoute allowedAdmin={true} />}>
                <Route path="/"                element={<Dashboard />} />
                <Route path="/selective"       element={<SelectivePage />} />
                <Route path="/leads-upload"    element={<LeadsUploadPage />} />
                <Route path="/email-templates" element={<EmailTemplatesPage />} />
                <Route path="/campaign-leads"  element={<CampaignLeadsPage />} />
                <Route path="/lead-management" element={<LeadManagementPage />} />
              </Route>

              <Route element={<PrivateRoute allowedAdmin={false} />}>
                <Route path="/call" element={<CallPage />} />
              </Route>

              {/* Accessible to both admins and agents (PrivateRoute without
                  `allowedAdmin` skips the role check). */}
              <Route element={<PrivateRoute />}>
                <Route path="/agent-mail" element={<AgentMailPage />} />
                <Route path="/reporting"  element={<ReportingPage />} />
              </Route>

              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
