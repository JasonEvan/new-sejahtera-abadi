export const getInventoryLedgersKey = (stockId: number) =>
  ["inventory-ledgers", stockId] as const;
export const invalidateInventoryLedgersKey = () =>
  ["inventory-ledgers"] as const;
export const getAllPayablesKey = () => ["payables"] as const;
export const getAllReceivablesKey = () => ["receivables"] as const;
export const getPayablesByClientKey = (clientId: number) =>
  ["payables", clientId] as const;
export const getReceivablesByClientKey = (clientId: number) =>
  ["receivables", clientId] as const;
export const getProfitReportKey = (month: number, year: number) =>
  ["profit-report", month, year] as const;
export const invalidateProfitReportKey = () => ["profit-report"] as const;
export const getDashboardSnapshotKey = () => ["dashboard-snapshot"] as const;
export const getAssetValueKey = () => ["asset-value"] as const;
