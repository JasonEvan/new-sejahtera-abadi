import { useQuery } from "@tanstack/react-query";
import {
  getOrdersMenuKey,
  getPurchaseInvoiceDetailKey,
  getPurchaseInvoicesKey,
  getPurchaseReturnLinesKey,
  getReturnEligibleOrdersKey,
} from "./purchase.keys";
import {
  getOrdersMenu,
  getPurchaseInvoiceDetail,
  getPurchaseInvoices,
  getPurchaseReturnLines,
  getReturnEligibleOrders,
} from "./purchase.api";

export const useGetOrdersMenu = ({
  clientId,
  isPaidOff,
}: {
  clientId: number;
  isPaidOff: boolean;
}) => {
  return useQuery({
    queryKey: getOrdersMenuKey(clientId, isPaidOff),
    queryFn: () => getOrdersMenu(clientId, isPaidOff),
    select: (data) =>
      data.data.map((invoice) => ({
        id: invoice.id,
        name: invoice.invoice_number,
        balance_due: invoice.balance_due,
      })),
  });
};

export const useGetPurchaseInvoices = (
  invoicePrefix: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getPurchaseInvoicesKey(invoicePrefix),
    queryFn: () => getPurchaseInvoices(invoicePrefix),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetPurchaseInvoiceDetail = (invoiceNumber: string) => {
  return useQuery({
    queryKey: getPurchaseInvoiceDetailKey(invoiceNumber),
    queryFn: () => getPurchaseInvoiceDetail(invoiceNumber),
    select: (data) => data.data,
  });
};

export const useGetReturnEligibleOrders = (
  clientId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getReturnEligibleOrdersKey(clientId),
    queryFn: () => getReturnEligibleOrders(clientId),
    select: (data) =>
      data.data.map((order) => ({
        id: order.id,
        name: order.invoice_number,
      })),
    enabled,
  });
};

export const useGetPurchaseReturnLines = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getPurchaseReturnLinesKey(invoiceNumber),
    queryFn: () => getPurchaseReturnLines(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};
