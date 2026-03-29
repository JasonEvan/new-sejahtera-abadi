export const getEditReceivablesByInvoiceKey = (invoiceNumber: string) =>
  ["edit-receivables", invoiceNumber] as const;
