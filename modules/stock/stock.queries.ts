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

export const useGetStockNames = () => {
  return useQuery({
    queryKey: getStocksKey(),
    queryFn: getAllStocks,
    select: (data) =>
      data.data.map((stock) => ({
        id: stock.id,
        name: `${stock.name} || ${stock.ending_stock}`,
        ending_stock: stock.ending_stock,
        capital_cost: stock.capital_cost,
        selling_price: stock.selling_price,
      })),
  });
};
