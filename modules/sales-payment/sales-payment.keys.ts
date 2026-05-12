export const getEditReceivablesByInvoiceKey = (invoiceNumber: string) =>
  ["edit-receivables", invoiceNumber] as const;

export const getSalesPaymentTransactionsKey = (clientId: number) =>
  ["sales-payment-transactions", clientId] as const;

export const getSalesPaymentTransactionSummaryKey = (
  transactionNumber: string,
) => ["sales-payment-transaction-summary", transactionNumber] as const;
