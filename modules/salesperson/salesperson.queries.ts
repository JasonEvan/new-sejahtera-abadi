import { useQuery } from "@tanstack/react-query";
import { getSalespersonsKey } from "./salesperson.keys";
import { getSalespersons } from "./salesperson.api";

export const useGetSalespersons = () => {
  return useQuery({
    queryKey: getSalespersonsKey(),
    queryFn: getSalespersons,
    select: (data) => data.data,
  });
};
