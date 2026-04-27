import AppSidebar from "@/components/shared/AppSidebar";
import Topbar from "@/components/shared/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="w-full min-h-screen">
        <Topbar />
        <section className="container mx-auto px-4 py-3">{children}</section>
      </main>
    </SidebarProvider>
  );
}
