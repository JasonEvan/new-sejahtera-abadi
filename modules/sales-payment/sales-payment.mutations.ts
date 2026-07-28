import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSalesPayment,
  deleteEditReceivablesByInvoice,
  deleteSalesPaymentTransaction,
  updateEditReceivablesByInvoice,
} from "./sales-payment.api";
import { toast } from "sonner";
import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import { invalidateOrdersMenuKey } from "../sale/sale.keys";
import { getAllReceivablesKey } from "../report/report.keys";
import {
  getEditReceivablesByInvoiceKey,
  getSalesPaymentTransactionsKey,
} from "./sales-payment.keys";
import { useDeleteSalesPaymentStore } from "@/stores/payments/useDeleteSalesPaymentStore";

export const useSalesPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSalesPayment,
    onSuccess: (data) => {
      toast.success(data.message || "Sales payment created successfully", {
        position: "bottom-right",
      });
      useSalesPaymentStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
    },
  });
};

export const useDeleteEditReceivablesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEditReceivablesByInvoice,
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payments deleted successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({
        queryKey: getEditReceivablesByInvoiceKey(variables.invoice_number),
      });
    },
  });
};

export const useUpdateEditReceivablesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEditReceivablesByInvoice,
    onSuccess: (data) => {
      toast.success(data.message || "Payments updated successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
    },
  });
};

export const useDeleteSalesPaymentTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSalesPaymentTransaction,
    onSuccess: (data) => {
      toast.success(
        data.message || "Payment transaction deleted successfully",
        {
          position: "bottom-right",
        },
      );
      const clientId =
        useDeleteSalesPaymentStore.getState().transaction_information.client;
      queryClient.invalidateQueries({
        queryKey: getSalesPaymentTransactionsKey(clientId),
      });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      useDeleteSalesPaymentStore.getState().clear();
    },
  });
};
