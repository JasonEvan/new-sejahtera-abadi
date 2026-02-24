import { useQuery } from "@tanstack/react-query";
import { getClientsKey } from "./client.keys";
import { getClients } from "./client.api";

export const useGetClients = () => {
  return useQuery({
    queryKey: getClientsKey(),
    queryFn: getClients,
    select: (data) => data.data,
  });
};
