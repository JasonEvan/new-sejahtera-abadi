import { useQuery } from "@tanstack/react-query";
import {
  getEditPurchaseReturnDetailKey,
  getEditPurchaseReturnInvoicesKey,
  getReturnHistoryKey,
} from "./purchase-return.keys";
import {
  getEditPurchaseReturnDetail,
  getEditPurchaseReturnInvoices,
  getReturnHistory,
} from "./purchase-return.api";

export const useGetEditPurchaseReturnInvoices = () => {
  return useQuery({
    queryKey: getEditPurchaseReturnInvoicesKey(),
    queryFn: () => getEditPurchaseReturnInvoices(),
    select: (data) =>
      data.data.map((invoice) => ({
        id: invoice.id,
        name: invoice.invoice_number,
      })),
  });
};

export const useGetEditPurchaseReturnDetail = (
  returnId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditPurchaseReturnDetailKey(returnId),
    queryFn: () => getEditPurchaseReturnDetail(returnId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetReturnHistory = (
  purchaseOrderId: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: getReturnHistoryKey(purchaseOrderId),
    queryFn: () => getReturnHistory(purchaseOrderId),
    select: (data) =>
      data.data.map((item) => ({
        id: item.id,
        name: new Date(item.return_date).toLocaleDateString("id-ID"),
      })),
    enabled,
  });
};
