import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";

import { selectIsAdmin, selectIsWhatsappAdmin } from "@/features/auth/slices/authSlice";
import BrandMark from "@/shared/components/BrandMark";

import DateRangePicker from "./DateRangePicker";
import DialNextButton from "./DialNextButton";
import NavList from "./NavList";
import UserCard from "./UserCard";
import { getNavGroups } from "./navItems";

/** Off-canvas navigation for viewports below `md`, where the sidebar is hidden. */
export default function MobileDrawer({ open, onClose, showDatePicker, dial }) {
  const isAdmin = useSelector(selectIsAdmin);
  const isWhatsappAdmin = useSelector(selectIsWhatsappAdmin);

  const groups = useMemo(
    () => getNavGroups({ isAdmin, isWhatsappAdmin }),
    [isAdmin, isWhatsappAdmin]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[55]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 h-full w-[284px] max-w-[85vw] overflow-y-auto scrollbar-thin border-r border-border bg-card animate-slide-in-left">
        <div className="flex h-16 items-center justify-between border-b border-border px-3">
          <BrandMark role={isAdmin ? "Admin Console" : "Agent Workspace"} />
          <button
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-smooth active:scale-90"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-3">
          <UserCard onAction={onClose} />

          {showDatePicker && <DateRangePicker inputWidth="w-28" />}

          {!isAdmin && dial && (
            <DialNextButton
              variant="mobile"
              onDial={async () => {
                onClose();
                await dial.dialNow();
              }}
              nextDialIn={dial.nextDialIn}
              isDialing={dial.isDialing}
              isPaused={dial.isPaused}
              isAvailableLeads={dial.isAvailableLeads}
              disabled={dial.disabled}
            />
          )}

          <NavList groups={groups} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
