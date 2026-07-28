import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPurchasePayment,
  deleteEditPayablesByInvoice,
  deletePurchasePaymentTransaction,
  updateEditPayablesByInvoice,
} from "./purchase-payment.api";
import { toast } from "sonner";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { invalidateOrdersMenuKey } from "../purchase/purchase.keys";
import { getAllPayablesKey } from "../report/report.keys";
import {
  getEditPayablesByInvoiceKey,
  getPurchasePaymentTransactionsKey,
} from "./purchase-payment.keys";
import { useDeletePurchasePaymentStore } from "@/stores/payments/useDeletePurchasePaymentStore";

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
    onSuccess: (data) => {
      toast.success(data.message || "Payments updated successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
    },
  });
};

export const useDeletePurchasePaymentTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePurchasePaymentTransaction,
    onSuccess: (data) => {
      toast.success(
        data.message || "Payment transaction deleted successfully",
        {
          position: "bottom-right",
        },
      );
      const clientId =
        useDeletePurchasePaymentStore.getState().transaction_information.client;
      queryClient.invalidateQueries({
        queryKey: getPurchasePaymentTransactionsKey(clientId),
      });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      useDeletePurchasePaymentStore.getState().clear();
    },
  });
};
