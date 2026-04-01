import api from "@/lib/axios";
import {
  AllPayablesTableRow,
  AllReceivablesTableRow,
  ClientPayablesTableRow,
  ClientReceivablesTableRow,
  DashboardSnapshot,
  InventoryLedgerTableRow,
  ProfitTableRow,
} from "./report.types";

export async function getInventoryLedgers(stockId: number) {
  const response = await api.get<{ data: InventoryLedgerTableRow[] }>(
    `/reports/inventory-ledgers?stock_id=${stockId}`,
  );
  return response.data;
}

export async function getAllPayables() {
  const response = await api.get<{ data: AllPayablesTableRow[] }>(
    "/purchase-payments",
  );
  return response.data;
}

export async function getAllReceivables() {
  const response = await api.get<{ data: AllReceivablesTableRow[] }>(
    "/sales-payments",
  );
  return response.data;
}

export async function getPayablesByClient(clientId: number) {
  const response = await api.get<{ data: ClientPayablesTableRow[] }>(
    `/reports/payables-per-client?client_id=${clientId}`,
  );
  return response.data;
}

export async function getReceivablesByClient(clientId: number) {
  const response = await api.get<{ data: ClientReceivablesTableRow[] }>(
    `/reports/receivables-per-client?client_id=${clientId}`,
  );
  return response.data;
}

export async function getProfitReport(month: number, year: number) {
  const response = await api.get<{ data: ProfitTableRow[] }>(
    `/reports/profits?month=${month}&year=${year}`,
  );
  return response.data;
}

export async function getDashboardSnapshot() {
  const response = await api.get<{ data: DashboardSnapshot }>(
    "/reports/dashboard",
  );
  return response.data;
}
