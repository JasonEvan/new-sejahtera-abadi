import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPurchasePayment,
  deleteEditPayablesByInvoice,
  updateEditPayablesByInvoice,
} from "./purchase-payment.api";
import { toast } from "sonner";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { invalidateOrdersMenuKey } from "../purchase/purchase.keys";
import { getAllPayablesKey } from "../report/report.keys";
import { getEditPayablesByInvoiceKey } from "./purchase-payment.keys";

export const usePurchasePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchasePayment,
    onSuccess: (data) => {
      toast.success(data.message || "Purchase payment created successfully", {
        position: "bottom-right",
      });
      usePurchasePaymentStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
    },
  });
};

export const useDeleteEditPayablesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEditPayablesByInvoice,
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payments deleted successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({
        queryKey: getEditPayablesByInvoiceKey(variables.invoice_number),
      });
    },
  });
};

export const useUpdateEditPayablesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEditPayablesByInvoice,
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payments updated successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({
        queryKey: getEditPayablesByInvoiceKey(variables.invoice_number),
      });
    },
  });
};
