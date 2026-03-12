export const getOrdersMenuKey = (clientId: number, isPaidOff: boolean) =>
  ["purchase-orders-menu", { clientId, isPaidOff }] as const;
export const invalidateOrdersMenuKey = () => ["purchase-orders-menu"] as const;
export const getPurchaseInvoicesKey = (invoicePrefix: string) =>
  ["purchase-invoices", invoicePrefix] as const;
export const getPurchaseInvoiceDetailKey = (invoiceNumber: string) =>
  ["purchase-invoice-detail", invoiceNumber] as const;
