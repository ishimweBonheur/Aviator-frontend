import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { useApp } from "@/store/app.store";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { AppDialogs } from "@/app/AppDialogs";
export function MainLayout({ children }: { children: ReactNode }) {
  const { reduced } = useApp();
  return (
    <div className={`app min-h-screen ${reduced ? "reduce-motion" : ""}`}>
      <Header />
      <main>
        {children}
        <Footer />
      </main>
      <AppDialogs />
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </div>
  );
}
