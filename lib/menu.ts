import {
  Database,
  Eye,
  LayoutDashboard,
  Package,
  Pencil,
  RotateCcw,
  Settings,
  ShoppingCart,
  Trash2,
  Wallet,
  LucideIcon,
} from "lucide-react";

export type SidebarChildItem = {
  title: string;
  url?: string;
  permission?: string | string[];
  children?: SidebarChildItem[];
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
    title: "Hapus",
    icon: Trash2,
    permission: [
      "sales.delete",
      "purchase.delete",
      "sales.payment.delete",
      "purchase.payment.delete",
      "sales.return.delete",
      "purchase.return.delete",
    ],
    children: [
      { title: "Hapus Jual", url: "/delete/sales", permission: "sales.delete" },
      {
        title: "Hapus Beli",
        url: "/delete/purchases",
        permission: "purchase.delete",
      },
      {
        title: "Hapus Piutang",
        url: "/delete/sales-payment",
        permission: "sales.payment.delete",
      },
      {
        title: "Hapus Utang",
        url: "/delete/purchase-payment",
        permission: "purchase.payment.delete",
      },
      {
        title: "Hapus Retur Jual",
        url: "/delete/sales-return",
        permission: "sales.return.delete",
      },
      {
        title: "Hapus Retur Beli",
        url: "/delete/purchase-return",
        permission: "purchase.return.delete",
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
        title: "Stock",
        permission: ["inventory-ledger.view", "asset-value.view"],
        children: [
          {
            title: "Kartu Persediaan",
            url: "/view/inventory-ledger",
            permission: "inventory-ledger.view",
          },
          {
            title: "Nilai Aset",
            url: "/view/asset-value",
            permission: "asset-value.view",
          },
        ],
      },
      {
        title: "Utang",
        permission: "purchase.payment.view",
        children: [
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
        ],
      },
      {
        title: "Piutang",
        permission: "sales.payment.view",
        children: [
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
        ],
      },
      {
        title: "Nota",
        permission: ["sales.view", "purchase.view"],
        children: [
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
        ],
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
    permission: [
      "download.backup",
      "restore.backup",
      "delete.backup",
      "system.cutoff",
    ],
    children: [
      { title: "Backup", url: "/backup", permission: "download.backup" },
      { title: "Export", url: "/export", permission: "download.backup" },
      { title: "Tutup Buku", url: "/cutoff", permission: "system.cutoff" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    permission: ["user.view", "role.view", "company.view"],
    children: [
      {
        title: "Company",
        url: "/settings/company",
        permission: "company.view",
      },
      { title: "User", url: "/settings/users", permission: "user.view" },
      { title: "Role", url: "/settings/roles", permission: "role.view" },
    ],
  },
];

export const getRoutePermissions = () => {
  const permissions: Record<string, string | string[]> = {};

  const processItem = (item: SidebarItem | SidebarChildItem) => {
    if (item.url && item.permission) {
      permissions[item.url] = item.permission;
    }
    if (item.children) {
      item.children.forEach(processItem);
    }
  };

  sidebarItems.forEach(processItem);

  return permissions;
};
