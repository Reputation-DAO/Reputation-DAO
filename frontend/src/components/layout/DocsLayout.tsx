// frontend/src/components/layout/DocsLayout.tsx
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Outlet } from "react-router-dom";

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16 pb-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
