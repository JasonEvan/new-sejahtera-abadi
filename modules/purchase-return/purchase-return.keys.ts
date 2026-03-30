export const getEditPurchaseReturnInvoicesKey = () =>
  ["edit-purchase-return-invoices"] as const;

export const getEditPurchaseReturnDetailKey = (invoiceNumber: string) =>
  ["edit-purchase-return-detail", invoiceNumber] as const;
