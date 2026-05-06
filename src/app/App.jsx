import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './Layout';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';

import Dashboard from '@/features/dashboard/DashboardPage';
import LeadsUploadPage from '@/features/leads/LeadsUploadPage';
import EmailTemplatesPage from '@/features/email-templates/EmailTemplatesPage';
import CampaignLeadsPage from '@/features/campaign-leads/CampaignLeadsPage';
import LoginPage from '@/features/auth/LoginPage';
import UnauthorizedPage from '@/features/auth/UnauthorizedPage';
import SessionPopup from '@/features/auth/components/SessionPopup';
import CallPage from '@/features/calls/CallPage';
import SelectivePage from '@/pages/SelectivePage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Layout>
          <SessionPopup />
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
            </Route>

            <Route element={<PrivateRoute allowedAdmin={false} />}>
              <Route path="/call" element={<CallPage />} />
            </Route>

            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
