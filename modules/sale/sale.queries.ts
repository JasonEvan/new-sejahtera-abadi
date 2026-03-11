import { useQuery } from "@tanstack/react-query";
import {
  getOrdersMenuKey,
  getSalesInvoiceDetailKey,
  getSalesInvoicesKey,
} from "./sale.keys";
import {
  getOrdersMenu,
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
