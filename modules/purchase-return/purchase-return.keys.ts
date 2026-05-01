export const getEditPurchaseReturnInvoicesKey = () =>
  ["edit-purchase-return-invoices"] as const;

export const getEditPurchaseReturnDetailKey = (returnId: number) =>
  ["edit-purchase-return-detail", returnId] as const;

export const getReturnHistoryKey = (purchaseOrderId: number) =>
  ["purchase-return-history", purchaseOrderId] as const;
