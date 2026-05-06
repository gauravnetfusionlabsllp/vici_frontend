import TopNav from "@/shared/components/layout/TopNav";
import { Toaster } from "react-hot-toast";

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
      />
      <main className="mx-2 2xl:mx-auto max-w-[1440px] 2xl:max-w-[1600px] min-h-full py-4">
        {children}
      </main>
    </div>
  );
}
