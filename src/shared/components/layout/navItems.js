import {
  BarChart3,
  Bot,
  CheckCheck,
  Gauge,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageCircle,
  PhoneCall,
  Route,
  Send,
  ShieldCheck,
  Smartphone,
  Upload,
  UserCog,
  Users,
} from "lucide-react";

/** Routes where the global date-range filter is meaningless and stays hidden. */
export const DATE_PICKER_HIDDEN_PATHS = [
  "/leads-upload",
  "/email-templates",
  "/campaign-leads",
  "/agent-mail",
  "/manager-view",
  "/whatsapp-automation",
  "/double-tick",
];

/**
 * Sidebar navigation, grouped by purpose. Single source of truth — the desktop
 * sidebar, the mobile drawer and the top-bar page title all read from here.
 *
 * Item shape: { name, path, icon, end?, children? }
 *  - `end: true` makes the NavLink match exactly (needed for "/", which would
 *    otherwise stay active on every route).
 *  - `children` renders a collapsible sub-section; the parent has no path.
 */
export function getNavGroups({ isAdmin, isWhatsappAdmin }) {
  const whatsappConsole = isWhatsappAdmin
    ? [{ name: "Admin Console", path: "/whatsapp-admin", icon: ShieldCheck }]
    : [];

  if (isAdmin) {
    return [
      {
        label: "Overview",
        items: [
          { name: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
          { name: "Agent Productivity", path: "/selective", icon: Gauge },
          { name: "Manager View", path: "/manager-view", icon: UserCog },
        ],
      },
      {
        label: "Leads",
        items: [
          { name: "Leads Upload", path: "/leads-upload", icon: Upload },
          { name: "Lead Router", path: "/campaign-leads", icon: Route },
          { name: "Lead Management", path: "/lead-management", icon: Users },
        ],
      },
      {
        label: "Outreach",
        items: [
          { name: "Email Templates", path: "/email-templates", icon: Mail },
          {
            name: "WhatsApp",
            icon: MessageCircle,
            children: [
              { name: "Sessions", path: "/whatsapp-sessions", icon: Smartphone },
              { name: "Automation", path: "/whatsapp-automation", icon: Bot },
              ...whatsappConsole,
            ],
          },
          { name: "DoubleTick", path: "/double-tick", icon: CheckCheck },
        ],
      },
      {
        label: "Reports",
        items: [{ name: "Reporting", path: "/reporting", icon: BarChart3 }],
      },
    ];
  }

  return [
    {
      label: "Workspace",
      items: [
        { name: "Call", path: "/call", icon: PhoneCall },
        { name: "Send Email", path: "/agent-mail", icon: Send },
        {
          name: "WhatsApp",
          icon: MessageCircle,
          children: [
            { name: "Inbox", path: "/whatsapp", icon: Inbox },
            ...whatsappConsole,
          ],
        },
      ],
    },
    {
      label: "Reports",
      items: [{ name: "Reporting", path: "/reporting", icon: BarChart3 }],
    },
  ];
}

/** Flattened leaf items — used for page-title lookup. */
export function flattenNavItems(groups) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => (item.children ? item.children : [item]))
  );
}

/** Longest-prefix match so nested routes still resolve to a title. */
export function findNavTitle(groups, pathname) {
  const leaves = flattenNavItems(groups);
  const exact = leaves.find((i) => i.path === pathname);
  if (exact) return exact.name;

  return leaves
    .filter((i) => i.path !== "/" && pathname.startsWith(`${i.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.name ?? null;
}
