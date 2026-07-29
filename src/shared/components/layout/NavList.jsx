import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const GAP = 8;
const ROW_HEIGHT = 32; // approximate flyout row height, used for edge clamping
const FLYOUT_CHROME = 32; // flyout header + padding

const ROW = "relative flex items-center gap-3 rounded-md text-sm transition-smooth";
const IDLE = "text-muted-foreground hover:bg-secondary hover:text-foreground";
const ACTIVE =
  `bg-primary/12 text-primary font-medium
   before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px]
   before:rounded-full before:bg-primary`;

function rowClass(isActive, collapsed) {
  const pad = collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2";
  return `${ROW} ${pad} ${isActive ? ACTIVE : IDLE}`;
}

function NavItem({ item, collapsed, onNavigate, nested = false }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.name : undefined}
      className={({ isActive }) =>
        `${rowClass(isActive, collapsed)} ${nested ? "py-1.5" : ""}`
      }
    >
      {Icon && <Icon className={`shrink-0 ${nested ? "w-4 h-4" : "w-[18px] h-[18px]"}`} />}
      {!collapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );
}

function NavParent({ item, collapsed, onNavigate }) {
  const { pathname } = useLocation();
  const Icon = item.icon;
  const childActive = item.children.some((c) => c.path === pathname);
  const [open, setOpen] = useState(childActive);

  // Force the section open when navigation lands on one of its children.
  // Adjusting state during render (rather than in an effect) avoids a frame
  // where the active child is hidden — see react.dev/learn/you-might-not-need-an-effect.
  const [wasChildActive, setWasChildActive] = useState(childActive);
  if (wasChildActive !== childActive) {
    setWasChildActive(childActive);
    if (childActive) setOpen(true);
  }

  // Collapsed rail: the children open as a portal popover. The sidebar's nav
  // column scrolls vertically, which forces overflow-x to clip too, so anything
  // positioned beside the rail would be cut off if rendered in place.
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const computePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // Keep the menu on screen when the icon sits near the bottom edge.
    const height = item.children.length * ROW_HEIGHT + FLYOUT_CHROME;
    const top = Math.max(GAP, Math.min(rect.top, window.innerHeight - height - GAP));
    setPos({ left: rect.right + GAP, top });
  }, [item.children.length]);

  useEffect(() => {
    if (!flyoutOpen) return;

    const onDocClick = (e) => {
      if (popoverRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setFlyoutOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setFlyoutOpen(false);
    };
    const onReflow = () => computePosition();

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [flyoutOpen, computePosition]);

  if (collapsed) {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (!flyoutOpen) computePosition();
            setFlyoutOpen((v) => !v);
          }}
          title={item.name}
          aria-haspopup="menu"
          aria-expanded={flyoutOpen}
          className={`w-full ${rowClass(childActive, true)}`}
        >
          {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
          {/* Signals that the icon hides a submenu. */}
          <ChevronRight className="absolute bottom-1 right-1.5 w-3 h-3 text-muted-foreground" />
        </button>

        {flyoutOpen &&
          pos &&
          createPortal(
            <div
              ref={popoverRef}
              style={{ position: "fixed", top: pos.top, left: pos.left }}
              className="z-[100] min-w-[190px] rounded-lg border border-border bg-popover p-1 shadow-xl animate-scale-in"
            >
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.name}
              </div>
              {item.children.map((child) => (
                <NavItem
                  key={child.path}
                  item={child}
                  collapsed={false}
                  onNavigate={() => {
                    setFlyoutOpen(false);
                    onNavigate?.();
                  }}
                />
              ))}
            </div>,
            document.body
          )}
      </>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full ${rowClass(false, false)} ${childActive ? "text-foreground" : ""}`}
      >
        {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
        <span className="truncate">{item.name}</span>
        <ChevronDown
          className={`ml-auto w-4 h-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l border-border pl-2 animate-fade-in">
          {item.children.map((child) => (
            <NavItem key={child.path} item={child} collapsed={false} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Grouped navigation list, shared by the desktop sidebar and the mobile drawer.
 * `collapsed` switches to the icon-rail rendering (labels via tooltip/flyout).
 */
export default function NavList({ groups, collapsed = false, onNavigate }) {
  return (
    // Keying on the mode drops any open flyout / submenu state when the sidebar
    // is collapsed or expanded, so nothing reopens at a stale position.
    <nav key={collapsed ? "rail" : "full"} className="space-y-4">
      {groups.map((group, i) => (
        <div key={group.label} className={collapsed && i > 0 ? "border-t border-border pt-4" : ""}>
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </div>
          )}
          <div className="space-y-1">
            {group.items.map((item) =>
              item.children ? (
                <NavParent
                  key={item.name}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              )
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}
