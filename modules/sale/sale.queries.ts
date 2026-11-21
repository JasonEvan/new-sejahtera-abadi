import { useQuery } from "@tanstack/react-query";
import {
  getEditEligibleOrdersKey,
  getSoldItemHistoryByClientKey,
  getOrdersMenuKey,
  getReturnEligibleOrdersKey,
  getSaleEditDetailKey,
  getSaleReturnLinesKey,
  getSalesInvoiceDetailKey,
  getSalesInvoicesKey,
} from "./sale.keys";
import {
  getEditEligibleOrders,
  getSoldItemHistoryByClient,
  getOrdersMenu,
  getReturnEligibleOrders,
  getSaleEditDetail,
  getSaleReturnLines,
  getSalesInvoiceDetail,
  getSalesInvoices,
} from "./sale.api";

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
        invoice_value: invoice.invoice_value,
        balance_due: invoice.balance_due,
      })),
  });
};

export const useGetSalesInvoices = (
  invoicePrefix: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSalesInvoicesKey(invoicePrefix),
    queryFn: () => getSalesInvoices(invoicePrefix),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetSalesInvoiceDetail = (invoiceNumber: string) => {
  return useQuery({
    queryKey: getSalesInvoiceDetailKey(invoiceNumber),
    queryFn: () => getSalesInvoiceDetail(invoiceNumber),
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

export const useGetSaleReturnLines = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSaleReturnLinesKey(invoiceNumber),
    queryFn: () => getSaleReturnLines(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetEditEligibleOrders = (clientId: number, enabled: boolean) => {
  return useQuery({
    queryKey: getEditEligibleOrdersKey(clientId),
    queryFn: () => getEditEligibleOrders(clientId),
    select: (data) =>
      data.data.map((order) => ({
        id: order.id,
        name: order.invoice_number,
      })),
    enabled,
  });
};

export const useGetSaleEditDetail = (
  clientId: number,
  salesOrderId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSaleEditDetailKey(clientId, salesOrderId),
    queryFn: () => getSaleEditDetail(clientId, salesOrderId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetSoldItemHistoryByClient = (
  clientId: number,
  namePrefix: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getSoldItemHistoryByClientKey(clientId, namePrefix),
    queryFn: () => getSoldItemHistoryByClient(clientId, namePrefix),
    select: (data) => data.data,
    enabled,
  });
};
