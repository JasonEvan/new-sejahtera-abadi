export const getEditPayablesByInvoiceKey = (invoiceNumber: string) =>
  ["edit-payables", invoiceNumber] as const;
