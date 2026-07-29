import { LogOut, User } from "lucide-react";
import { useSelector } from "react-redux";

import {
  selectCampaingName,
  selectRoleLabel,
  selectUserName,
} from "@/features/auth/slices/authSlice";
import { useLogout } from "@/features/auth/hooks/useLogout";

/** Signed-in identity + logout. Lives in the sidebar footer and mobile drawer. */
export default function UserCard({ collapsed = false, onAction }) {
  const userName = useSelector(selectUserName);
  const roleLabel = useSelector(selectRoleLabel);
  const campaignName = useSelector(selectCampaingName);
  const logout = useLogout();

  const handleLogout = () => {
    onAction?.();
    logout();
  };

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive transition-smooth active:scale-90"
      title="Logout"
      aria-label="Logout"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-muted-foreground"
          title={`${userName} · ${roleLabel}${campaignName ? ` · ${campaignName}` : ""}`}
        >
          <User className="w-4 h-4" />
        </div>
        {logoutButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2.5 py-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
        <User className="w-4 h-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-xs font-medium text-foreground">{userName}</div>
        <div className="truncate text-[11px] text-muted-foreground">{roleLabel}</div>
        {campaignName && (
          <div className="truncate text-[10px] text-muted-foreground/80">{campaignName}</div>
        )}
      </div>
      <div className="ml-auto">{logoutButton}</div>
    </div>
  );
}
