import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronRight, Loader2, LogOut, Menu, User, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { clearUser, selectCampaingName, selectIsAdmin, selectRoleLabel, selectUser, selectUserName, selectIsWhatsappAdmin } from "@/features/auth/slices/authSlice";
import { resetAutoDialTime, selectFormNameFilter, setCurrentLead } from "@/features/calls/slices/dialSlice";
import { CALL_STATE, selectCallState, selectIsCallBusy, setCallState } from "@/features/calls/slices/callSlice";
import { selectDateRange, setDateRange } from "@/features/dashboard/slices/dateFilterSlice";
import { dashboardApi, useDialNextMutation } from "@/services";
import { useVicidialPopup } from "@/shared/context/VicidialPopupContext";
import { useToast } from "@/shared/hooks/useToast";
import BrandMark from "@/shared/components/BrandMark";

const adminNavItems = [
  { name: "Dashboard", path: "/" },
  { name: "Agent Productivity", path: "/selective" },
  { name: "Leads Upload", path: "/leads-upload" },
  { name: "Lead Router",    path: "/campaign-leads" },
  { name: "Email Templates",  path: "/email-templates" },
  { name: "Lead Management",   path: "/lead-management" },
  { name: "Manager View",     path: "/manager-view" },
  { name: "Reporting",        path: "/reporting" },
];
function toYMD(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
const agentNavItems = [
  { name: "Call", path: "/call" },
  { name: "Send Email", path: "/agent-mail" },
  { name: "Lead Management", path: "/lead-management" },
  { name: "Reporting", path: "/reporting" },
];
const HOT_METAL_CAMPAIGN = "HotMetaleads";
export default function TopNav() {
  const [now, setNow] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const hideDatePicker = ["/leads-upload", "/email-templates","/campaign-leads","/agent-mail","/manager-view","/whatsapp-admin"].includes(location.pathname);
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const isWhatsappAdmin = useSelector(selectIsWhatsappAdmin);
  const roleLabel = useSelector(selectRoleLabel);
  const campaignName = useSelector(selectCampaingName);
  const userName = useSelector(selectUserName);
  const { closePopup } = useVicidialPopup();
  const isCallBusy = useSelector(selectIsCallBusy);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const today = useMemo(() => new Date(), []);
  const dateRange = useSelector(selectDateRange);
  const formNameFilter = useSelector(selectFormNameFilter);
  const isHotMetal = campaignName === HOT_METAL_CAMPAIGN;
  const [startDate, setStartDate] = useState(() => fromYMD(dateRange.from));
  const [endDate, setEndDate] = useState(() => fromYMD(dateRange.to));

  useEffect(() => {
    setStartDate(fromYMD(dateRange.from));
    setEndDate(fromYMD(dateRange.to));
  }, [dateRange.from, dateRange.to]);

  const applyDateRange = useCallback((s, e) => {
    dispatch(setDateRange({ from: toYMD(s), to: toYMD(e) }));
    dispatch(dashboardApi.util.invalidateTags(["DATE_FILTERED"]));
  }, [dispatch]);
  const navItems = useMemo(() => {
    const base = isAdmin ? adminNavItems : agentNavItems;
    return isWhatsappAdmin
      ? [...base, { name: "WhatsApp", path: "/whatsapp-admin" }]
      : base;
  }, [isAdmin, isWhatsappAdmin]);
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [isAdmin]);

  const handleLogout = () => {
    closePopup();
    dispatch(clearUser());
    navigate("/login", { replace: true });
  };
  const formNameFilterRef = useRef(formNameFilter);
  useEffect(() => { formNameFilterRef.current = formNameFilter; }, [formNameFilter]);

  const handleDialNextCb = useCallback(async () => {
    if (isCallBusy || isDialing) return;
    dialLockRef.current = true;
    setNextDialIn(0);
    try {
      dispatch(setCallState(CALL_STATE.DIALING));

      const currentFormName = formNameFilterRef.current;
      const dialParams = isHotMetal && currentFormName
        ? { form_name: currentFormName }
        : {};

      const res = await dialNext(dialParams).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        toastError(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return;
      }
      dispatch(setCurrentLead(res?.details ?? null));
      dispatch(setCallState(CALL_STATE.INCALL));
      navigate("/call");
      dispatch(resetAutoDialTime());
    } catch (e) {
      dispatch(setCallState(CALL_STATE.IDLE));
      toastError("Failed to dial next. Please try again.");
      dispatch(resetAutoDialTime());
    }
  }, [
    isCallBusy,
    isDialing,
    isHotMetal,
    dialNext,
    dispatch,
    navigate,
    toastError,
  ]);

  const { isPaused, autoDialTime } = useSelector((e) => e.dial);
  const [nextDialIn, setNextDialIn] = useState(30);

  const dialLockRef = useRef(false);
  const isAvailableLeads = useSelector(e => e.dial.isAvailableLeads);
  useEffect(() => {
    if (isAdmin || !user) return;
    if (isPaused || isCallBusy || isDialing || !isAvailableLeads) return;

    const target = dayjs(autoDialTime);
    if (!target.isValid()) return;

    const initial = target.diff(dayjs(), "seconds");

    if (initial <= 0) {
      dispatch(resetAutoDialTime());
      return;
    }

    dialLockRef.current = false;
    setNextDialIn(initial);

    const timer = setInterval(() => {
      const remaining = target.diff(dayjs(), "seconds");
      setNextDialIn(Math.max(0, remaining));

      if (remaining <= 0 && !dialLockRef.current) {
        dialLockRef.current = true;
        handleDialNextCb();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    autoDialTime,
    isPaused,
    isCallBusy,
    isDialing,
    isAdmin,
    user,
    isAvailableLeads,
    handleDialNextCb,
    dispatch,
  ]);

  useEffect(() => {
    if (isAdmin) return;
    if (!isCallBusy && !isPaused && !isDialing) {
      dispatch(resetAutoDialTime());
    }
  }, [isCallBusy, isPaused, dispatch, isAdmin]);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md">
      <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px] h-full px-6 xl:px-2 flex items-center">
        <NavLink
          to={!user ? "/login" : isAdmin ? "/" : "/call"}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-opacity hover:opacity-90 active:opacity-80"
          aria-label="Go to home"
        >
          <BrandMark role={user ? (isAdmin ? "Admin Console" : "Agent Workspace") : null} />
        </NavLink>

        {user &&  !hideDatePicker && <div className="hidden md:flex items-center gap-2 mx-2">
          <span className="text-sm text-slate-400">From:</span>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              const fixedEnd = endDate && date && endDate < date ? null : endDate;
              if (fixedEnd !== endDate) setEndDate(fixedEnd);
              applyDateRange(date, fixedEnd);
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate || today}
            className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
            popperClassName="z-50 dark-datepicker"
          />

          <span className="text-sm text-slate-400">To:</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              setEndDate(date);
              applyDateRange(startDate, date);
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={today}
            popperPlacement="bottom-start"
            popperClassName="z-50 dark-datepicker"
            className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-24"
          />
        </div>}

        {user && (
          <div className="hidden md:flex items-center gap-6 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative text-sm transition-smooth ${isActive
                    ? "text-primary font-semibold after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary after:animate-fade-in"
                    : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700">
              <User className="w-4 h-4 text-muted-foreground" />
              <div className="leading-tight">
                <div className="text-xs font-medium">{userName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {roleLabel}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {campaignName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 p-1.5 rounded-md hover:bg-slate-700 text-muted-foreground hover:text-red-400 transition-smooth active:scale-90"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="hidden md:block text-right leading-tight mr-3">
            <div className="text-sm font-mono">{format(now, "hh:mm:ss a")}</div>
            <div className="text-[11px] text-muted-foreground">
              {format(now, "EEEE, MMM d")}
            </div>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-slate-800/60 transition-smooth active:scale-90"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {!!user && !isAdmin && (
          <button
            onClick={() => {
              dispatch(resetAutoDialTime());
              handleDialNextCb();
            }}
            disabled={isDialing || isCallBusy || isPaused || !isAvailableLeads}
            className="group hidden md:flex items-center gap-3 px-5 py-2 rounded-xl border border-cyan-400/20
                         bg-gradient-to-r from-cyan-900/50 via-sky-900/40 to-indigo-900/40
                         hover:from-cyan-900/70 hover:via-sky-900/60 hover:to-indigo-900/60
                         shadow-[0_0_30px_rgba(34,211,238,0.15)]
                         transition-all duration-200 active:scale-[0.98]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-900/50 disabled:hover:via-sky-900/40 disabled:hover:to-indigo-900/40"
            title="Dial Next"
            aria-label={!isAvailableLeads ? "No leads available" : `Dial next lead in ${nextDialIn} seconds`}
          >
            <div className="flex items-center gap-2">
              {isDialing ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
              ) : (
                <ChevronRight className="w-5 h-5 text-cyan-200 transition-transform group-hover:translate-x-0.5" />
              )}
              <span className="tracking-widest text-xs font-semibold text-cyan-100 font-mono-nums">
              {!isAvailableLeads ? "No Leads" : `DIAL NEXT in ${nextDialIn}`}
              </span>
            </div>

            <div className="flex items-end gap-1 h-4">
              {[6, 10, 7, 14, 9, 12].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-sm bg-cyan-300/70 origin-bottom ${
                    isDialing || (isAvailableLeads && !isPaused) ? "animate-wave" : ""
                  }`}
                  style={{ height: h, animationDelay: `${i * 110}ms` }}
                />
              ))}
            </div>
          </button>
        )}
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 space-y-3 animate-fade-in-down">
          {user && (
            <div className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700">
              <div>
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {roleLabel}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {campaignName}
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="p-2 rounded-md hover:bg-slate-700 text-muted-foreground hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          {user && !hideDatePicker &&(<div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">From:</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    const fixedEnd = endDate && date && endDate < date ? null : endDate;
                    if (fixedEnd !== endDate) setEndDate(fixedEnd);
                    applyDateRange(date, fixedEnd);
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={endDate || today}
                  className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-28"
                  popperClassName="z-50 dark-datepicker"
                />

                <span className="text-sm text-slate-400">To:</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    applyDateRange(startDate, date);
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={today}
                  popperClassName="z-50 dark-datepicker"
                  className="bg-input border border-border text-foreground text-sm rounded px-2 py-1 w-28"
                />
              </div>)}
          {!!user && !isAdmin && (
            <button
              onClick={async () => {
                setMobileOpen(false);
                await handleDialNextCb();
              }}
              disabled={isDialing}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-cyan-400/20
                         bg-gradient-to-r from-cyan-900/50 via-sky-900/40 to-indigo-900/40"
            >
              <span className="tracking-widest text-xs font-semibold text-cyan-100">
                {isDialing ? "DIALING..." : "DIAL NEXT"}
              </span>
              {isDialing ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
              ) : (
                <ChevronRight className="w-5 h-5 text-cyan-200" />
              )}
            </button>
          )}
          {user && navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block text-sm ${isActive ? "text-primary font-semibold" : "text-muted-foreground"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
