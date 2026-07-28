import { useQuery } from "@tanstack/react-query";
import {
  getEditPayablesByInvoice,
  getPurchasePaymentTransactions,
  getPurchasePaymentTransactionSummary,
} from "./purchase-payment.api";
import {
  getEditPayablesByInvoiceKey,
  getPurchasePaymentTransactionsKey,
  getPurchasePaymentTransactionSummaryKey,
} from "./purchase-payment.keys";

export const useGetEditPayablesByInvoice = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditPayablesByInvoiceKey(invoiceNumber),
    queryFn: () => getEditPayablesByInvoice(invoiceNumber),
    select: (data) => data.data,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useGetPurchasePaymentTransactions = (
  clientId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getPurchasePaymentTransactionsKey(clientId),
    queryFn: () => getPurchasePaymentTransactions(clientId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetPurchasePaymentTransactionSummary = (
  transactionNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getPurchasePaymentTransactionSummaryKey(transactionNumber),
    queryFn: () => getPurchasePaymentTransactionSummary(transactionNumber),
    select: (data) => data.data,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
