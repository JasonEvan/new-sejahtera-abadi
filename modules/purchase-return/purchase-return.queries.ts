import { useQuery } from "@tanstack/react-query";
import {
  getEditPurchaseReturnDetail,
  getEditPurchaseReturnInvoices,
} from "./purchase-return.api";
import {
  getEditPurchaseReturnDetailKey,
  getEditPurchaseReturnInvoicesKey,
} from "./purchase-return.keys";

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
  invoiceNumber: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: getEditPurchaseReturnDetailKey(invoiceNumber),
    queryFn: () => getEditPurchaseReturnDetail(invoiceNumber),
    select: (data) => data.data,
    enabled,
  });
};
