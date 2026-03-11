import { useQuery } from "@tanstack/react-query";
import { getAllPayablesKey, getInventoryLedgersKey } from "./report.keys";
import { getAllPayables, getInventoryLedgers } from "./report.api";

export const useGetInventoryLedgers = (stockId: number, enabled: boolean) => {
  return useQuery({
    queryKey: getInventoryLedgersKey(stockId),
    queryFn: () => getInventoryLedgers(stockId),
    select: (data) => data.data,
    enabled,
  });
};

export const useGetAllPayables = () => {
  return useQuery({
    queryKey: getAllPayablesKey(),
    queryFn: getAllPayables,
    select: (data) => data.data,
  });
};
