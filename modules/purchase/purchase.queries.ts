import { useQuery } from "@tanstack/react-query";
import {
  getOrdersMenuKey,
  getPurchaseInvoiceDetailKey,
  getPurchaseInvoicesKey,
} from "./purchase.keys";
import {
  getOrdersMenu,
  getPurchaseInvoiceDetail,
  getPurchaseInvoices,
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
