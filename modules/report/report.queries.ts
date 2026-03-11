import { useQuery } from "@tanstack/react-query";
import { getInventoryLedgersKey } from "./report.keys";
import { getInventoryLedgers } from "./report.api";

export const useGetInventoryLedgers = (stockId: number, enabled: boolean) => {
  return useQuery({
    queryKey: getInventoryLedgersKey(stockId),
    queryFn: () => getInventoryLedgers(stockId),
    select: (data) => data.data,
    enabled,
  });
};
