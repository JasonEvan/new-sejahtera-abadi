import api from "@/lib/axios";
import { InventoryLedgerTableRow } from "./report.types";

export async function getInventoryLedgers(stockId: number) {
  const response = await api.get<{ data: InventoryLedgerTableRow[] }>(
    `/reports/inventory-ledgers?stock_id=${stockId}`,
  );
  return response.data;
}
