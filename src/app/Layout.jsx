import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";

import { selectUser } from "@/features/auth/slices/authSlice";
import WhatsappNotifier from "@/features/whatsapp/WhatsappNotifier";
import Sidebar from "@/shared/components/layout/Sidebar";
import TopBar from "@/shared/components/layout/TopBar";
import { useSidebarCollapsed } from "@/shared/components/layout/useSidebarCollapsed";

export function Layout({ children }) {
  const user = useSelector(selectUser);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  // Mirrors the fixed sidebar's width. Both classes are literals so Tailwind
  // emits them; the sidebar is absent (and the padding zero) when signed out.
  const contentOffset = !user ? "" : collapsed ? "md:pl-[4.5rem]" : "md:pl-64";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />}
      <WhatsappNotifier />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.625rem",
            fontSize: "13px",
            padding: "10px 14px",
            boxShadow: "0 12px 40px -8px rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          },
          success: {
            iconTheme: {
              primary: "hsl(158 100% 41%)",
              secondary: "hsl(var(--card))",
            },
          },
          error: {
            iconTheme: {
              primary: "hsl(0 100% 64%)",
              secondary: "hsl(var(--card))",
            },
          },
        }}
      />

      <div className={`transition-[padding] duration-200 ${contentOffset}`}>
        <TopBar />
        <main className="min-h-full px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
