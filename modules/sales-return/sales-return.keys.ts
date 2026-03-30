export const getEditSaleReturnInvoicesKey = () =>
  ["edit-sale-return-invoices"] as const;

export const getEditSaleReturnDetailKey = (invoiceNumber: string) =>
  ["edit-sale-return-detail", invoiceNumber] as const;
