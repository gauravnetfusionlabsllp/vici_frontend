import { useDispatch, useSelector } from "react-redux";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { hideSessionPopup, setLoading } from "../slices/sessionSlice";
import { dashboardApi, setSessionExpired, useLoginMutation, useRefreshMutation } from "../services/dashboardApi";
import { useNavigate } from "react-router-dom";
import { clearUser } from "../slices/authSlice";
import { useVicidialPopup } from "../context/VicidialPopupContext";

export default function SessionPopup() {
  const dispatch = useDispatch();
  const { expired, loading } = useSelector((s) => s.session);
  const [refresh] = useRefreshMutation();
  const { closePopup } = useVicidialPopup();
  const navigate = useNavigate();
  if (!expired) return null;

  const handleContinue = async () => {
    console.log("Attempting to refresh session...");
   const refresh_token = JSON.parse(localStorage.getItem("user"))?.refresh_token;

    try {
      dispatch(setLoading(true));
      const res = await refresh({ refresh_token }).unwrap();

    // update token
    const user = JSON.parse(localStorage.getItem("user")) || {};
    console.log("Refresh successful, new token:", res.access_token,user);
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...user,
        access_token: res.access_token,
      })
    );

    // ✅ resume API calls
    setSessionExpired(false);
     dispatch(dashboardApi.util.resetApiState());
      dispatch(hideSessionPopup());
    } catch (err) {
      conosle.error("Refresh failed:", err);
      handleLogout();
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = () => {
    setSessionExpired(false);
    closePopup();
    dispatch(clearUser())
    dispatch(hideSessionPopup());
    navigate("/login", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center">
      <div className="bg-[hsl(229_56%_13%)] p-6 rounded-xl w-full max-w-sm border border-white/10 shadow-xl text-white">
        <h3 className="text-lg font-semibold mb-2">Session Expired</h3>
        <p className="text-sm text-slate-400 mb-4">
          Your session has expired. Continue or logout?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
