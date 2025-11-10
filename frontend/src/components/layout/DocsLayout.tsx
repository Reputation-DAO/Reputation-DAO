import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import DocsSidebar from "@/components/docs/DocsSidebar";
import { Outlet } from "react-router-dom";

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex pt-16">
        <DocsSidebar />
        <main className="flex-1 px-4 py-8 max-w-5xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
