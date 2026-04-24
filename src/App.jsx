import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";

import Dashboard from "@/pages/Dashboard";
import Selective from "./pages/Selective";
import LeadsUploadPage from "./pages/LeadsUploadPage";
import { Toaster } from "react-hot-toast";
import { Layout } from "./Layout";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import CallPage from "./pages/CallPage";
import SessionPopup from "./components/SessionPopup";
import Unauthorized from "./pages/Unauthorized";
import PublicRoute from "./components/PublicRoute";
import EmailTemplatesPage from "./pages/EmailTemplatesPage";
function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-white">404 - Page Not Found</h1>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Layout>
        <SessionPopup />
          <Routes>
          <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          </Route>
          
          <Route element={<PrivateRoute allowedAdmin={true} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/selective" element={<Selective />} />
              <Route path="/leads-upload" element={<LeadsUploadPage />} />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
            </Route>

            {/* 🔐 Authenticated but NOT admin */}
            <Route element={<PrivateRoute allowedAdmin={false} />}>
              <Route path="/call" element={<CallPage />} />
            </Route>
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
