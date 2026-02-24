import AppSidebar from "@/components/shared/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full min-h-screen">
        <SidebarTrigger className="mb-1" />
        {children}
      </main>
    </SidebarProvider>
  );
}
