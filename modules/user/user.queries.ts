import { useQuery } from "@tanstack/react-query";
import { getUsers, getCurrentUser } from "./user.api";
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

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await getCurrentUser();
      return response.user;
    },
  });
};
