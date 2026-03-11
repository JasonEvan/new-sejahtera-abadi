import { useQuery } from "@tanstack/react-query";
import { getAllPayablesKey, getAllReceivablesKey, getInventoryLedgersKey } from "./report.keys";
import { getAllPayables, getAllReceivables, getInventoryLedgers } from "./report.api";

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

export const useGetAllReceivables = () => {
  return useQuery({
    queryKey: getAllReceivablesKey(),
    queryFn: getAllReceivables,
    select: (data) => data.data,
  });
};
