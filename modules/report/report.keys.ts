export const getInventoryLedgersKey = (stockId: number) =>
  ["inventory-ledgers", stockId] as const;
