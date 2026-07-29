import { useMemo } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import { selectIsAdmin, selectIsWhatsappAdmin } from "@/features/auth/slices/authSlice";
import BrandMark from "@/shared/components/BrandMark";

import NavList from "./NavList";
import UserCard from "./UserCard";
import { getNavGroups } from "./navItems";

/**
 * Desktop-only left sidebar. Fixed and full-height; `Layout` mirrors its width
 * as left padding on the content column.
 */
export default function Sidebar({ collapsed, onToggleCollapse }) {
  const isAdmin = useSelector(selectIsAdmin);
  const isWhatsappAdmin = useSelector(selectIsWhatsappAdmin);

  const groups = useMemo(
    () => getNavGroups({ isAdmin, isWhatsappAdmin }),
    [isAdmin, isWhatsappAdmin]
  );

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col
                  border-r border-border bg-card/40 backdrop-blur-md
                  transition-[width] duration-200 ${collapsed ? "w-[4.5rem]" : "w-64"}`}
    >
      <div
        className={`flex h-16 shrink-0 items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "px-3"
        }`}
      >
        <NavLink
          to={isAdmin ? "/" : "/call"}
          className="rounded-lg outline-none transition-opacity hover:opacity-90 active:opacity-80"
          aria-label="Go to home"
        >
          <BrandMark
            showWordmark={!collapsed}
            role={collapsed ? null : isAdmin ? "Admin Console" : "Agent Workspace"}
          />
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-4">
        <NavList groups={groups} collapsed={collapsed} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border p-2">
        <UserCard collapsed={collapsed} />

        <button
          onClick={onToggleCollapse}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs
                      text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground
                      ${collapsed ? "justify-center px-0" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
