import { useQuery } from "@tanstack/react-query";
import {
  getEditSaleReturnDetail,
  getEditSaleReturnInvoices,
} from "./sales-return.api";
import {
  getEditSaleReturnDetailKey,
  getEditSaleReturnInvoicesKey,
} from "./sales-return.keys";

export const useGetEditSaleReturnInvoices = () => {
  return useQuery({
    queryKey: getEditSaleReturnInvoicesKey(),
    queryFn: () => getEditSaleReturnInvoices(),
    select: (data) =>
      data.data.map((invoice) => ({
        id: invoice.id,
        name: invoice.invoice_number,
      })),
  });
};

export const useGetEditSaleReturnDetail = (
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditSaleReturnDetailKey(invoiceNumber),
    queryFn: () => getEditSaleReturnDetail(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};
