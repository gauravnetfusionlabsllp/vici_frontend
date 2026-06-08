import { useRef, useState ,useEffect} from "react";
import { AlertTriangle, Briefcase, CheckCircle, ChevronDown, Loader2, Lock, User, Shield, Headset } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetCampaignsQuery, useLoginMutation } from "@/services";
import { setUser } from "@/features/auth/slices/authSlice";
import { useDispatch } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import BrandMark from "@/shared/components/BrandMark";
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("agent"); // ✅ user chooses: "admin" | "agent"
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [viciStatus, setViciStatus] = useState(null); // null | "connected" | "warning"
  const from = location.state?.from?.pathname;
  const [login, { isLoading }] = useLoginMutation();
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
      const payload = {
        ...form,
        role,
        campaign_id: role === "agent" ? selectedCampaign?.campaign_id : "",
        campaign_name: role === "agent" ? selectedCampaign?.campaign_name : "",
      };

      const res = await login(payload).unwrap();

      localStorage.setItem("user", JSON.stringify(res));
      dispatch(setUser(res));

      if (role === "agent") {
        setViciStatus(res.vicidial_connected ? "connected" : "warning");
        await new Promise((r) => setTimeout(r, 1500));
      }

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
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 opacity-80
                      bg-[radial-gradient(800px_circle_at_15%_15%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(700px_circle_at_85%_85%,rgba(34,211,238,0.12),transparent_55%)]"
           aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--border)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.12)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
           aria-hidden="true" />

      <div className="relative w-full max-w-md p-8 rounded-2xl bg-card/80 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] border border-border animate-fade-in-up">
        <div className="flex flex-col items-center gap-3 mb-7">
          <BrandMark size="lg" showWordmark={false} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sign in to your Outbound Dialer workspace
            </p>
          </div>
        </div>

        {error && (
          <p className="bg-destructive/10 text-destructive border border-destructive/20 p-2.5 rounded-md mb-4 text-sm animate-fade-in">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary/40 border border-border">
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-all duration-200
                ${role === "admin"
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <Shield size={16} />
              Admin
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("agent")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm transition-all duration-200
                ${role === "agent"
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <Headset size={16} />
              Agent
            </button>
          </div>

          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              name="username"
              placeholder="Username"
              onChange={handleChange}
              value={form.username}
              autoComplete="username"
              className="w-full pl-10 pr-3 py-2.5 rounded-md bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              onBlur={() => setShowPassword(false)}
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              value={form.password}
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-md bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {role === "agent" && (
            <div className="relative campaign-select group animate-fade-in">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
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
                className="w-full pl-10 pr-9 py-2.5 rounded-md bg-background/60 border border-border text-foreground outline-none appearance-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {campaingListLoading ? "Loading campaigns…" : "Select Campaign"}
                </option>

                {campaingList?.data?.map((c) => (
                  <option key={c.campaign_id} value={c.campaign_id}>
                    {c.campaign_name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-200 ${
                  isSelectOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          )}

          {viciStatus === "connected" && (
            <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-sm text-primary animate-fade-in">
              <CheckCircle size={16} />
              ViciDial connected — logging you in…
            </div>
          )}
          {viciStatus === "warning" && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive animate-fade-in">
              <AlertTriangle size={16} />
              ViciDial not connected — use Reconnect in the top bar
            </div>
          )}

          <button
            disabled={loginDisabled}
            className="w-full py-2.5 mt-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium
                       shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.65)]
                       transition-all duration-200 active:scale-[0.99]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary
                       flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
