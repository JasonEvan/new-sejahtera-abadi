import api from "@/lib/axios";
import { InsertStock, Stock } from "./stock.types";

export async function getAllStocks() {
  const response = await api.get<{ data: Stock[] }>("/stocks");
  return response.data;
}

export async function addStock(data: InsertStock) {
  const response = await api.post<{ message: string }>("/stocks", data);
  return response.data;
}

export async function updateStock({
  id,
  data,
}: {
  id: number;
  data: InsertStock;
}) {
  const response = await api.put<{ message: string }>(`/stocks/${id}`, data);
  return response.data;
}

export async function deleteStock(id: number) {
  const response = await api.delete<{ message: string }>(`/stocks/${id}`);
  return response.data;
}
