import { useQuery } from "@tanstack/react-query";
import { getClientNamesKey, getClientsKey } from "./client.keys";
import { getClientNames, getClients } from "./client.api";

export const useGetClients = () => {
  return useQuery({
    queryKey: getClientsKey(),
    queryFn: getClients,
    select: (data) => data.data,
  });
};

export const useGetClientNames = () => {
  return useQuery({
    queryKey: getClientNamesKey(),
    queryFn: getClientNames,
    select: (data) =>
      data.data.map((client) => ({
        id: client.id,
        name: client.name,
      })),
  });
};
