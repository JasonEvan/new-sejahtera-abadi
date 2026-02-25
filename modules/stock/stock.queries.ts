import { useQuery } from "@tanstack/react-query";
import { getStocksKey } from "./stock.keys";
import { getAllStocks } from "./stock.api";

export const useGetStocks = () => {
  return useQuery({
    queryKey: getStocksKey(),
    queryFn: getAllStocks,
    select: (data) => data.data,
  });
};
