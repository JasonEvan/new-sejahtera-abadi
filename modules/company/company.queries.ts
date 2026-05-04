import { useQuery } from "@tanstack/react-query";
import { companyApi } from "./company.api";
import { companyKeys } from "./company.keys";

export const useCompanySettings = () => {
  return useQuery({
    queryKey: companyKeys.settings(),
    queryFn: companyApi.getSettings,
  });
};
