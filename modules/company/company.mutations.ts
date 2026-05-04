import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "./company.api";
import { companyKeys } from "./company.keys";
import { toast } from "sonner";

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.settings() });
      toast.success("Profil perusahaan berhasil diperbarui");
    },
  });
};
