import { useMutation } from "@tanstack/react-query";
import { getCutoffSummary, performCutoff } from "./system.api";
import { toast } from "sonner";

export const usePerformCutoffMutation = () => {
  return useMutation({
    mutationFn: performCutoff,
    onSuccess: (data) => {
      toast.success(data.message || "Proses Cut-Off berhasil diselesaikan!", {
        position: "bottom-right",
      });
    },
  });
};

export const useCutoffSummaryMutation = () => {
  return useMutation({
    mutationFn: getCutoffSummary,
  });
};
