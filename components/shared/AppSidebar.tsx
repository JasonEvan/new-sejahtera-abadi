"use client";

import {
  ChevronDown,
  Database,
  Eye,
  LayoutDashboard,
  Package,
  Pencil,
  RotateCcw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

const sidebarItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  {
    title: "Master",
    icon: Package,
    children: [
      { title: "Client", url: "/clients" },
      { title: "Stock", url: "/stocks" },
      { title: "Salesman", url: "/salesmen" },
    ],
  },
  {
    title: "Transaksi",
    icon: ShoppingCart,
    children: [
      { title: "Jual", url: "/sales" },
      { title: "Beli", url: "/purchases" },
    ],
  },
  {
    title: "Pelunasan",
    icon: Wallet,
    children: [
      { title: "Utang", url: "/payables" },
      { title: "Piutang", url: "/receivables" },
    ],
  },
  {
    title: "Edit",
    icon: Pencil,
    children: [
      { title: "Edit Jual", url: "/edit/sales" },
      { title: "Edit Beli", url: "/edit/purchases" },
      { title: "Edit Utang", url: "/edit/payables" },
      { title: "Edit Piutang", url: "/edit/receivables" },
      { title: "Edit Retur Beli", url: "/edit/purchase-return" },
      { title: "Edit Retur Jual", url: "/edit/sales-return" },
    ],
  },
  {
    title: "Lihat",
    icon: Eye,
    children: [
      { title: "Kartu Persediaan", url: "/view/inventory-ledger" },
      { title: "Semua Utang", url: "/view/all-payables" },
      { title: "Utang per Client", url: "/view/payables-per-client" },
      { title: "Semua Piutang", url: "/view/all-receivables" },
      { title: "Piutang per Client", url: "/view/receivables-per-client" },
      { title: "Nota Penjualan", url: "/view/sales-invoice" },
      { title: "Nota Pembelian", url: "/view/purchase-invoice" },
      { title: "Laporan Laba", url: "/view/profit-report" },
    ],
  },
  {
    title: "Retur",
    icon: RotateCcw,
    children: [
      { title: "Retur Jual", url: "/returns/sales" },
      { title: "Retur Beli", url: "/returns/purchase" },
    ],
  },
  {
    title: "System",
    icon: Database,
    children: [
      { title: "Backup", url: "/backup" },
      { title: "Export", url: "/export" },
    ],
  },
];

function SidebarSingleItem({ item }: { item: (typeof sidebarItems)[0] }) {
  const router = useRouter();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => router.push(item.url as string)}
        className="pl-4 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <item.icon />
        <span className="text-[1rem]">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarCollapsibleItem({ item }: { item: (typeof sidebarItems)[1] }) {
  const router = useRouter();
  return (
    <Collapsible className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <item.icon />
            <span className="ml-2 text-[1rem]">{item.title}</span>
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <ul className="mt-1 space-y-0.5 border-l border-sidebar-border ml-5.5 pl-3">
              {item.children?.map((child) => (
                <SidebarMenuItem key={child.title}>
                  <SidebarMenuButton onClick={() => router.push(child.url)}>
                    <span>{child.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </ul>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            P
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              POS System
            </span>
            <span className="text-xs text-muted-foreground">Enterprise</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) =>
            item.children ? (
              <SidebarCollapsibleItem key={item.title} item={item} />
            ) : (
              <SidebarSingleItem key={item.title} item={item} />
            ),
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <span className="text-xs text-muted-foreground">© 2026 Jason Evan</span>
      </SidebarFooter>
    </Sidebar>
  );
}
