export const getEditPayablesByInvoiceKey = (invoiceNumber: string) =>
  ["edit-payables", invoiceNumber] as const;

export const getPurchasePaymentTransactionsKey = (clientId: number) =>
  ["purchase-payment-transactions", clientId] as const;

export const getPurchasePaymentTransactionSummaryKey = (
  transactionNumber: string,
) => ["purchase-payment-transaction-summary", transactionNumber] as const;
