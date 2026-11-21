export function getSaleDraftStockAdjustments(
  rows: readonly { stock_id: number; quantity: number }[],
  savedQuantities?: Record<number, number>,
): ReadonlyMap<number, number> {
  const adjustments = new Map<number, number>();

  // Server stock already reflects the saved invoice; add it back before applying the draft.
  if (savedQuantities) {
    for (const stockId in savedQuantities) {
      adjustments.set(Number(stockId), savedQuantities[stockId]);
    }
  }

  for (const { stock_id, quantity } of rows) {
    adjustments.set(stock_id, (adjustments.get(stock_id) ?? 0) - quantity);
  }

  return adjustments;
}
