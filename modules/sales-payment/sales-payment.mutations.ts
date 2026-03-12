import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSalesPayment } from "./sales-payment.api";
import { toast } from "sonner";
import { useSalesPaymentStore } from "@/stores/payments/useSalesPaymentStore";
import { invalidateOrdersMenuKey } from "../sale/sale.keys";
import { getAllReceivablesKey } from "../report/report.keys";

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
