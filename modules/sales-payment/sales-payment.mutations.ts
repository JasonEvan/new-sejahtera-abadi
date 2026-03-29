import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSalesPayment,
  deleteEditReceivablesByInvoice,
  updateEditReceivablesByInvoice,
} from "./sales-payment.api";
import { toast } from "sonner";
import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import { invalidateOrdersMenuKey } from "../sale/sale.keys";
import { getAllReceivablesKey } from "../report/report.keys";
import { getEditReceivablesByInvoiceKey } from "./sales-payment.keys";

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
    onSuccess: (data, variables) => {
      toast.success(data.message || "Payments updated successfully", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({
        queryKey: getEditReceivablesByInvoiceKey(variables.invoice_number),
      });
    },
  });
};
