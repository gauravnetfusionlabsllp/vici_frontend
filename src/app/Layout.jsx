import TopNav from "@/shared/components/layout/TopNav";
import { Toaster } from "react-hot-toast";
import WhatsappNotifier from "@/features/whatsapp/WhatsappNotifier";

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
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
      <main className="mx-2 2xl:mx-auto max-w-[1440px] 2xl:max-w-[1600px] min-h-full py-4">
        {children}
      </main>
    </div>
  );
}
