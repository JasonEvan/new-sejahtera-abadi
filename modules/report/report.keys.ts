export const getInventoryLedgersKey = (stockId: number) =>
  ["inventory-ledgers", stockId] as const;
export const getAllPayablesKey = () => ["payables"] as const;
