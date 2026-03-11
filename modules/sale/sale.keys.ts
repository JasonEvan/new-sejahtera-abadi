export const getOrdersMenuKey = (clientId: number, isPaidOff: boolean) =>
  ["sale-orders-menu", { clientId, isPaidOff }] as const;
export const invalidateOrdersMenuKey = () => ["sale-orders-menu"] as const;
export const getSalesInvoicesKey = (invoicePrefix: string) =>
  ["sales-invoices", invoicePrefix] as const;
export const getSalesInvoiceDetailKey = (invoiceNumber: string) =>
  ["sales-invoice-detail", invoiceNumber] as const;
