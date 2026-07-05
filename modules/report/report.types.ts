export interface InventoryLedgerTableRow {
  row_number?: number;
  invoice_number: string | null;
  invoice_date: string | null;
  name: string | null;
  city: string | null;
  type: "B" | "J" | "BR" | "JR" | null;
  price: number | null;
  qty_in: number | null;
  qty_out: number | null;
  final_qty: number;
}

export interface AllPayablesTableRow {
  name: string;
  invoice_value: number;
  paid_amount: number;
  balance_due: number;
}

export interface ClientPayablesTableRow {
  invoice_number: string;
  invoice_date: string | null;
  invoice_value: number;
  paid_amount: number;
  payment_date: string | null;
  balance_due: number;
}

export interface AllReceivablesTableRow {
  name: string;
  invoice_value: number;
  paid_amount: number;
  balance_due: number;
}

export interface ClientReceivablesTableRow {
  invoice_number: string;
  invoice_date: string | null;
  invoice_value: number;
  paid_amount: number;
  payment_date: string | null;
  balance_due: number;
}

export interface ProfitQueryResult {
  sales_name: string;
  invoice_number: string;
  invoice_date: Date | null;
  client_name: string;
  client_city: string | null;
  invoice_value: number;
  invoice_profit: number;
}

export interface ProfitTableRow {
  row_number?: number;
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  client_city: string | null;
  invoice_value: number | null;
  invoice_profit: number | null;
}

export interface DashboardHeadlineStat {
  value: number;
  deltaPercentage: number | null;
}

export interface DashboardOperationalStats {
  salesOrdersToday: number;
  purchaseOrdersToday: number;
  lowStockAlerts: number;
  paidInvoicesThisWeek: number;
  pendingReceivables: number;
  returnRequestsThisMonth: number;
}

export interface DashboardActivityItem {
  title: string;
  subtitle: string;
  occurredAt: string;
}

export interface SalespersonPerformance {
  name: string;
  totalRevenue: number;
}

export interface DashboardSnapshot {
  headline: {
    thisMonthOmzet: DashboardHeadlineStat;
    grossProfit: DashboardHeadlineStat;
    openReceivables: DashboardHeadlineStat;
    activeClients: DashboardHeadlineStat;
  };
  operational: DashboardOperationalStats;
  recentActivity: DashboardActivityItem[];
  salespersonPerformance: SalespersonPerformance[];
}

export interface AssetValueTableRow {
  itemName: string;
  quantity: number;
  capitalCost: number;
  totalValue: number;
}

export interface AssetValueResponse {
  items: AssetValueTableRow[];
  grandTotalAssetValue: number;
}
