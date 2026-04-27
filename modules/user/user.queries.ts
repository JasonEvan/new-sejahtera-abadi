import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./user.api";
import { getUsersKey } from "./user.keys";

export const useGetUsers = () => {
  return useQuery({
    queryKey: getUsersKey(),
    queryFn: async () => {
      const response = await getUsers();
      return response.data;
    },
  });
};
