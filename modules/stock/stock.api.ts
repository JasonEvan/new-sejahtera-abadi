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
