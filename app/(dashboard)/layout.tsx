import AppSidebar from "@/components/shared/AppSidebar";
import Topbar from "@/components/shared/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full min-h-screen">
        <Topbar />
        <section className="container mx-auto px-4 py-3">{children}</section>
      </main>
    </SidebarProvider>
  );
}
