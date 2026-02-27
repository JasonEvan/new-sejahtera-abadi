import { useQuery } from "@tanstack/react-query";
import { getSalespersonNamesKey, getSalespersonsKey } from "./salesperson.keys";
import { getSalespersonNames, getSalespersons } from "./salesperson.api";

export const useGetSalespersons = () => {
  return useQuery({
    queryKey: getSalespersonsKey(),
    queryFn: getSalespersons,
    select: (data) => data.data,
  });
};

export const useGetSalespersonNames = () => {
  return useQuery({
    queryKey: getSalespersonNamesKey(),
    queryFn: getSalespersonNames,
    select: (data) => data.data,
  });
};
