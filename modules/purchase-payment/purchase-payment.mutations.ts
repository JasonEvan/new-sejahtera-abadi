import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchasePayment } from "./purchase-payment.api";
import { toast } from "sonner";
import { usePurchasePaymentStore } from "@/stores/payments/usePurchasePaymentStore";
import { invalidateOrdersMenuKey } from "../purchase/purchase.keys";
import { getAllPayablesKey } from "../report/report.keys";

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
