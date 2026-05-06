import { ShieldAlert } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();

  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = !!user?.isAdmin;

  const userRole = isAdmin ? "Admin" : "Agent";

  // read which role this page required (we pass this from PrivateRoute)
  const requiredRole = location.state?.requiredRole || "Authorized users";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(231_58%_6%)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[hsl(229_56%_13%)] shadow-xl border border-white/10 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="text-red-400" size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-white mb-2">
          Unauthorized
        </h1>

        <p className="text-slate-300 mb-2">
          This page is only accessible to:
        </p>

        <p className="text-lg font-semibold text-indigo-400 mb-4">
          {requiredRole}
        </p>

        <p className="text-slate-400 mb-6">
          You are logged in as:{" "}
          <span className="font-semibold text-white">{userRole}</span>
        </p>

        
      </div>
    </div>
  );
}
