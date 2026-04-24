import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { BarChart, ChevronRight, Loader2, LogOut, Menu, User, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearUser, selectCampaingName, selectIsAdmin, selectRoleLabel, selectUser, selectUserName } from "../slices/authSlice";
import { resetAutoDialTime, selectFormNameFilter, setCurrentLead } from "../slices/dialSlice";
import { dashboardApi, useDialNextMutation } from "../services/dashboardApi";
import { CALL_STATE, selectCallState, selectIsCallBusy, setCallState } from "../slices/callSlice";
import dayjs from "dayjs"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { selectDateRange, setDateRange } from "../slices/dateFilterSlice";
import { useVicidialPopup } from "../context/VicidialPopupContext";

const adminNavItems = [
  { name: "Dashboard", path: "/" },
  { name: "Selective", path: "/selective" },
  { name: "Leads Upload", path: "/leads-upload" },
  { name: "Email Templates",  path: "/email-templates" }, 
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
  // "YYYY-MM-DD" -> Date at local midnight
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
const agentNavItems = [{ name: "Call", path: "/call" }];
const HOT_METAL_CAMPAIGN = "HotMetaleads";
export default function TopNav() {
  const [now, setNow] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
const location = useLocation(); 

const hideDatePicker = ["/leads-upload", "/email-templates"].includes(location.pathname);
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const roleLabel = useSelector(selectRoleLabel);
  const campaignName = useSelector(selectCampaingName);
  const userName = useSelector(selectUserName);
  const { closePopup } = useVicidialPopup();
  const isCallBusy = useSelector(selectIsCallBusy);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const dateRange = useSelector(selectDateRange);
  const formNameFilter = useSelector(selectFormNameFilter);
  const isHotMetal = campaignName === HOT_METAL_CAMPAIGN;
  // local state for DatePicker (it needs Date objects)
  const [startDate, setStartDate] = useState(() => fromYMD(dateRange.from));
  const [endDate, setEndDate] = useState(() => fromYMD(dateRange.to));

  // keep local in sync if redux changes elsewhere
  useEffect(() => {
    setStartDate(fromYMD(dateRange.from));
    setEndDate(fromYMD(dateRange.to));
  }, [dateRange.from, dateRange.to]);

  const applyDateRange = useCallback((s, e) => {
    dispatch(setDateRange({ from: toYMD(s), to: toYMD(e) }));
    dispatch(dashboardApi.util.invalidateTags(["DATE_FILTERED"]));
  }, [dispatch]);
  const navItems = useMemo(
    () => (isAdmin ? adminNavItems : agentNavItems),
    [isAdmin]
  );
  const [dialNext, { isLoading: isDialing }] = useDialNextMutation();
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // optional: close mobile menu when role changes
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
      // if your API needs agent/user info, pass it here:
      // await dialNext({ userId: user.id }).unwrap();
      dispatch(setCallState(CALL_STATE.DIALING));

      const currentFormName = formNameFilterRef.current;
    const dialParams = isHotMetal && currentFormName
      ? { form_name: currentFormName }
      : {};

      const res = await dialNext(dialParams).unwrap();

      if (res?.vicidial_response?.toLowerCase?.().includes("error")) {
        alert(res.vicidial_response);
        dispatch(setCallState(CALL_STATE.IDLE));
        return;
      }
      dispatch(setCurrentLead(res?.details ?? null));
      dispatch(setCallState(CALL_STATE.INCALL));
      // ✅ go to /call page so agent sees Contact Details & Leads
      navigate("/call");
      dispatch(resetAutoDialTime());

    } catch (e) {
      dispatch(setCallState(CALL_STATE.IDLE));
      alert("Failed to dial next. Please try again.");
      dispatch(resetAutoDialTime());
    }
  }, [
    isCallBusy,
    isDialing,
    isHotMetal,
    dialNext,
    dispatch,
    navigate,

  ]);


  const { isPaused, autoDialTime } = useSelector((e) => e.dial);
  const [nextDialIn, setNextDialIn] = useState(30);

  const dialLockRef = useRef(false);
 const isAvailableLeads = useSelector(e => e.dial.isAvailableLeads)
  useEffect(() => {
    if (isAdmin || !user) return;
    if (isPaused || isCallBusy || isDialing || !isAvailableLeads) return;

    const target = dayjs(autoDialTime);
    if (!target.isValid()) return;

    const initial = target.diff(dayjs(), "seconds");

    // ✅ if already expired, just reset countdown (don’t dial)
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
    if (isAdmin) return
    if (!isCallBusy && !isPaused && !isDialing) {
      dispatch(resetAutoDialTime());
    }
  }, [isCallBusy, isPaused, dispatch, isAdmin]);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-md">
      <div className="relative mx-auto max-w-[1440px] h-full px-6 flex items-center">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center text-sm justify-center">
            cc
          </div>
          <BarChart className="w-5 h-5 text-green-500" />
          <h1 className="text-base font-semibold tracking-tight">
            Outbound Dialer – {isAdmin ? "Admin" : "Agent"}
          </h1>
        </div>

        {user &&  !hideDatePicker && <div className="hidden md:flex items-center gap-2 mx-2">
          <span className="text-sm text-slate-400">From:</span>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              // if endDate is before new start, clear endDate
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

        {/* CENTER NAV (DESKTOP) */}
        <div className="hidden md:flex items-center gap-6 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm transition ${isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* RIGHT */}
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
                className="ml-1 p-1.5 rounded-md hover:bg-slate-700 text-muted-foreground hover:text-red-400 transition"
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

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-slate-800/60"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {!!user && !isAdmin && (
          <button
            onClick={() => {
              dispatch(resetAutoDialTime()); // ✅ reset countdown target immediately
              handleDialNextCb();
            }}
            disabled={isDialing || isCallBusy || isPaused || !isAvailableLeads}
            // disabled={true}
            className="hidden md:flex items-center gap-3 px-5 py-2 rounded-xl border border-cyan-400/20
                         bg-gradient-to-r from-cyan-900/50 via-sky-900/40 to-indigo-900/40
                         hover:from-cyan-900/70 hover:via-sky-900/60 hover:to-indigo-900/60
                         shadow-[0_0_30px_rgba(34,211,238,0.15)] transition"
            title="Dial Next"
          >
            <div className="flex items-center gap-2">
              {isDialing ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
              ) : (
                <ChevronRight className="w-5 h-5 text-cyan-200" />
              )}
              <span className="tracking-widest text-xs font-semibold text-cyan-100">
              {!isAvailableLeads ? "No Leads" : `DIAL NEXT in ${nextDialIn}`}
              </span>
            </div>

            {/* tiny “bars” like your screenshot */}
            <div className="flex items-end gap-1 opacity-80">
              {[6, 10, 7, 14, 9, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-sm bg-cyan-300/60"
                  style={{ height: h }}
                />
              ))}
            </div>
          </button>
        )}
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 space-y-3">
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
          {navItems.map((item) => (
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
