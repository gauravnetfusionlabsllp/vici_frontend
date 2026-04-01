import { useRef, useState ,useEffect} from "react";
import { Briefcase, ChevronDown, Loader2, Lock, User, Shield, Headset } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetCampaignsQuery, useLoginMutation } from "../services/dashboardApi";
import { setUser } from "../slices/authSlice";
import { useDispatch } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { useVicidialPopup } from "../context/VicidialPopupContext";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("agent"); // ✅ user chooses: "admin" | "agent"
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const vicidialPopupRef = useRef(null);
  const from = location.state?.from?.pathname;
  const [login, { isLoading }] = useLoginMutation();
  const { openPopup } = useVicidialPopup();
  const [debouncedUsername, setDebouncedUsername] = useState("");
  // ✅ only fetch campaigns when agent
  const { data: campaingList, isLoading: campaingListLoading } = useGetCampaignsQuery(debouncedUsername, {
    skip: role !== "agent" || !debouncedUsername,
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const justOpenedRef = useRef(false);

  const [error, setError] = useState("");

  const handleMouseDown = () => {
    if (!isSelectOpen) {
      justOpenedRef.current = true;
      setIsSelectOpen(true);
    } else {
      justOpenedRef.current = false;
    }
  };

  const handleClick = () => {
    if (justOpenedRef.current) {
      justOpenedRef.current = false;
      return;
    }
    setIsSelectOpen(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedUsername(form.username);
  }, 500); // 500ms debounce

  return () => clearTimeout(timer);
}, [form.username]);

  // ✅ when role changes, clear campaign + close dropdown
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSelectedCampaign(null);
    setIsSelectOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ payload: always send role
      // ✅ only send campaign if role === "agent"
      const payload = {
        ...form,
        role, // <-- key you want to send to backend
        campaign_id: role === "agent" ? selectedCampaign?.campaign_id : "",
        campaign_name: role === "agent" ? selectedCampaign?.campaign_name : "",
      };

      const res = await login(payload).unwrap();

      // localStorage.setItem("access_token", res.access_token);
      if (role === "agent") {
        // const features = [
        //   "width=1100",
        //   "height=750",
        //   "left=100",
        //   "top=50",
        //   "resizable=yes",
        //   "scrollbars=yes",
        //   "toolbar=no",
        //   "menubar=no",
        //   "status=no",
        // ].join(",");
  
        // if (
        //   !vicidialPopupRef.current ||
        //   vicidialPopupRef.current.closed
        // ) {
        //   vicidialPopupRef.current = window.open(
        //     "http://192.168.15.165/agc/vicidial.php",
        //     "VICIDIAL_POPUP",
        //     features
        //   );
        // } else {
        //   vicidialPopupRef.current.focus();
        // }

        openPopup();
      }
      // ✅ store auth details (role always, campaign only for agent)
      sessionStorage.setItem(
        "vicidial_auth",
        JSON.stringify({
          username: form.username,
          password: form.password,
          role,
          ...(role === "agent" ? selectedCampaign : {}),
        })
      );

      localStorage.setItem("user", JSON.stringify(res));
      dispatch(setUser(res));

      // ✅ keep your logic (or use role)
      const defaultPath = res.isAdmin ? "/" : "/call";
      navigate(defaultPath, { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Invalid credentials");
    }
  };

  const campaignDisabled =
    role !== "agent" ||
    campaingListLoading ||
    !campaingList?.data?.length||!debouncedUsername;

  const loginDisabled =
    isLoading ||
    !form.username ||
    !form.password ||
    (role === "agent" && (!selectedCampaign?.campaign_id || !selectedCampaign?.campaign_name));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(231_58%_6%)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[hsl(229_56%_13%)] shadow-xl border border-white/10">
        <h1 className="text-2xl font-semibold text-white text-center mb-6">
          Vicidial Login
        </h1>

        {error && (
          <p className="bg-red-500/10 text-red-400 p-2 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ Role choice */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition
                ${role === "admin"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900/60 text-slate-200 border-white/10 hover:bg-slate-900"
                }`}
            >
              <Shield size={16} />
              Admin
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("agent")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition
                ${role === "agent"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900/60 text-slate-200 border-white/10 hover:bg-slate-900"
                }`}
            >
              <Headset size={16} />
              Agent
            </button>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              name="username"
              placeholder="Username"
              onChange={handleChange}
              value={form.username}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
            onBlur={() => setShowPassword(false)}
             type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={form.password}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />

<button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
    tabIndex={-1}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
          </div>

          {/* ✅ Campaign only for agent */}
          {role === "agent" && (
            <div className="relative campaign-select">
              <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
              <select
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                onBlur={() => setIsSelectOpen(false)}
                disabled={campaignDisabled}
                value={selectedCampaign?.campaign_id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = campaingList?.data?.find((x) => x.campaign_id === id);
                  setSelectedCampaign(
                    c ? { campaign_id: c.campaign_id, campaign_name: c.campaign_name } : null
                  );
                }}
                className="
                  w-full
                  pl-10 pr-3 py-2
                  rounded-lg
                  bg-slate-900
                  border border-white/10
                  text-white
                  outline-none
                  appearance-none
                  focus:ring-2 focus:ring-indigo-500
                  disabled:opacity-50
                "
              >
                <option value="" disabled>
                  {campaingListLoading ? "Loading campaigns..." : "Select Campaign"}
                </option>

                {campaingList?.data?.map((c) => (
                  <option key={c.campaign_id} value={c.campaign_id}>
                    {c.campaign_name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className={`absolute right-3 top-3 text-slate-400 pointer-events-none transition-transform duration-200 ${
                  isSelectOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          )}

          <button
            disabled={loginDisabled}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:hover:bg-indigo-600 text-white flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
