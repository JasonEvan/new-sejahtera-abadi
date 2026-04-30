import {
  Database,
  Eye,
  LayoutDashboard,
  Package,
  Pencil,
  RotateCcw,
  Settings,
  ShoppingCart,
  Wallet,
  LucideIcon,
} from "lucide-react";

export type SidebarChildItem = {
  title: string;
  url: string;
  permission?: string | string[];
};

export type SidebarItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  permission?: string | string[];
  children?: SidebarChildItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    title: "Master",
    icon: Package,
    permission: ["client.view", "stock.view", "salesman.view"],
    children: [
      { title: "Client", url: "/clients", permission: "client.view" },
      { title: "Stock", url: "/stocks", permission: "stock.view" },
      { title: "Salesman", url: "/salesmen", permission: "salesman.view" },
    ],
  },
  {
    title: "Transaksi",
    icon: ShoppingCart,
    permission: ["sales.create", "purchase.create"],
    children: [
      { title: "Jual", url: "/sales", permission: "sales.create" },
      { title: "Beli", url: "/purchases", permission: "purchase.create" },
    ],
  },
  {
    title: "Pelunasan",
    icon: Wallet,
    permission: ["sales.payment.create", "purchase.payment.create"],
    children: [
      {
        title: "Utang",
        url: "/payables",
        permission: "purchase.payment.create",
      },
      {
        title: "Piutang",
        url: "/receivables",
        permission: "sales.payment.create",
      },
    ],
  },
  {
    title: "Edit",
    icon: Pencil,
    permission: [
      "sales.update",
      "purchase.update",
      "sales.payment.update",
      "purchase.payment.update",
      "purchase.return.update",
      "sales.return.update",
    ],
    children: [
      { title: "Edit Jual", url: "/edit/sales", permission: "sales.update" },
      {
        title: "Edit Beli",
        url: "/edit/purchases",
        permission: "purchase.update",
      },
      {
        title: "Edit Utang",
        url: "/edit/payables",
        permission: "purchase.payment.update",
      },
      {
        title: "Edit Piutang",
        url: "/edit/receivables",
        permission: "sales.payment.update",
      },
      {
        title: "Edit Retur Beli",
        url: "/edit/purchase-return",
        permission: "purchase.return.update",
      },
      {
        title: "Edit Retur Jual",
        url: "/edit/sales-return",
        permission: "sales.return.update",
      },
    ],
  },
  {
    title: "Lihat",
    icon: Eye,
    permission: [
      "inventory-ledger.view",
      "sales.payment.view",
      "purchase.payment.view",
      "sales.view",
      "purchase.view",
      "profit-loss.view",
    ],
    children: [
      {
        title: "Kartu Persediaan",
        url: "/view/inventory-ledger",
        permission: "inventory-ledger.view",
      },
      {
        title: "Semua Utang",
        url: "/view/all-payables",
        permission: "purchase.payment.view",
      },
      {
        title: "Utang per Client",
        url: "/view/payables-per-client",
        permission: "purchase.payment.view",
      },
      {
        title: "Semua Piutang",
        url: "/view/all-receivables",
        permission: "sales.payment.view",
      },
      {
        title: "Piutang per Client",
        url: "/view/receivables-per-client",
        permission: "sales.payment.view",
      },
      {
        title: "Nota Penjualan",
        url: "/view/sales-invoice",
        permission: "sales.view",
      },
      {
        title: "Nota Pembelian",
        url: "/view/purchase-invoice",
        permission: "purchase.view",
      },
      {
        title: "Laporan Laba",
        url: "/view/profit-report",
        permission: "profit-loss.view",
      },
    ],
  },
  {
    title: "Retur",
    icon: RotateCcw,
    permission: ["sales.return.view", "purchase.return.view"],
    children: [
      {
        title: "Retur Jual",
        url: "/returns/sales",
        permission: "sales.return.view",
      },
      {
        title: "Retur Beli",
        url: "/returns/purchase",
        permission: "purchase.return.view",
      },
    ],
  },
  {
    title: "System",
    icon: Database,
    permission: ["download.backup"],
    children: [
      { title: "Backup", url: "/backup", permission: "download.backup" },
      { title: "Export", url: "/export", permission: "download.backup" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    permission: ["user.view", "role.view"],
    children: [
      { title: "User", url: "/settings/users", permission: "user.view" },
      { title: "Role", url: "/settings/roles", permission: "role.view" },
    ],
  },
];

export const getRoutePermissions = () => {
  const permissions: Record<string, string | string[]> = {};

  sidebarItems.forEach((item) => {
    if (item.url && item.permission) {
      permissions[item.url] = item.permission;
    }
    if (item.children) {
      item.children.forEach((child) => {
        if (child.url && child.permission) {
          permissions[child.url] = child.permission;
        }
      });
    }
  });

  // Add special cases if any (though we aim for single source of truth)
  // For example, if /view/all-payables and /view/payables-per-client are not in the list but need permissions
  // In our case they ARE in the list.

  return permissions;
};
