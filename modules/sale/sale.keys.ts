export const getOrdersMenuKey = (clientId: number, isPaidOff: boolean) =>
  ["sale-orders-menu", { clientId, isPaidOff }] as const;
export const invalidateOrdersMenuKey = () => ["sale-orders-menu"] as const;
export const getSalesInvoicesKey = (invoicePrefix: string) =>
  ["sales-invoices", invoicePrefix] as const;
export const getSalesInvoiceDetailKey = (invoiceNumber: string) =>
  ["sales-invoice-detail", invoiceNumber] as const;
export const getReturnEligibleOrdersKey = (clientId: number) =>
  ["return-eligible-orders", clientId] as const;
export const getSaleReturnLinesKey = (invoiceNumber: string) =>
  ["sale-return-lines", invoiceNumber] as const;
export const getEditEligibleOrdersKey = (clientId: number) =>
  ["sale-edit-eligible-orders", clientId] as const;
export const getSaleEditDetailKey = (clientId: number, salesOrderId: number) =>
  ["sale-edit-detail", clientId, salesOrderId] as const;
export const getSoldItemHistoryByClientKey = (
  clientId: number,
  namePrefix: string,
) => ["sold-item-history", clientId, namePrefix] as const;
