import { useQuery } from "@tanstack/react-query";
import { getRoles } from "./role.api";
import { getRolesKey } from "./role.keys";

export const useGetRoles = () => {
  return useQuery({
    queryKey: getRolesKey(),
    queryFn: async () => {
      const response = await getRoles();
      return response.data;
    },
  });
};
