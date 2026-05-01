import { useQuery } from "@tanstack/react-query";
import {
  getEditSaleReturnDetail,
  getEditSaleReturnInvoices,
  getReturnHistory,
} from "./sales-return.api";
import {
  getEditSaleReturnDetailKey,
  getEditSaleReturnInvoicesKey,
  getReturnHistoryKey,
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
  returnId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditSaleReturnDetailKey(returnId),
    queryFn: () => getEditSaleReturnDetail(returnId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetReturnHistory = (
  salesOrderId: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: getReturnHistoryKey(salesOrderId),
    queryFn: () => getReturnHistory(salesOrderId),
    select: (data) =>
      data.data.map((item) => ({
        id: item.id,
        name: new Date(item.return_date).toLocaleDateString("id-ID"),
      })),
    enabled,
  });
};
