export const getEditSaleReturnInvoicesKey = () =>
  ["edit-sale-return-invoices"] as const;

export const getEditSaleReturnDetailKey = (returnId: number) =>
  ["edit-sale-return-detail", returnId] as const;

export const getReturnHistoryKey = (salesOrderId: number) =>
  ["return-history", salesOrderId] as const;
