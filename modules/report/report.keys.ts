export const getInventoryLedgersKey = (stockId: number) =>
  ["inventory-ledgers", stockId] as const;
export const getAllPayablesKey = () => ["payables"] as const;
export const getAllReceivablesKey = () => ["receivables"] as const;
export const getPayablesByClientKey = (clientId: number) =>
  ["payables", clientId] as const;
export const getReceivablesByClientKey = (clientId: number) =>
  ["receivables", clientId] as const;
