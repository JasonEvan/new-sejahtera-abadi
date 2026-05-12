import { useQuery } from "@tanstack/react-query";
import {
  getEditReceivablesByInvoice,
  getSalesPaymentTransactions,
  getSalesPaymentTransactionSummary,
} from "./sales-payment.api";
import {
  getEditReceivablesByInvoiceKey,
  getSalesPaymentTransactionsKey,
  getSalesPaymentTransactionSummaryKey,
} from "./sales-payment.keys";

export const useGetEditReceivablesByInvoice = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditReceivablesByInvoiceKey(invoiceNumber),
    queryFn: () => getEditReceivablesByInvoice(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetSalesPaymentTransactions = (
  clientId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSalesPaymentTransactionsKey(clientId),
    queryFn: () => getSalesPaymentTransactions(clientId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetSalesPaymentTransactionSummary = (
  transactionNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSalesPaymentTransactionSummaryKey(transactionNumber),
    queryFn: () => getSalesPaymentTransactionSummary(transactionNumber),
    select: (data) => data.data,
    enabled,
  });
};
