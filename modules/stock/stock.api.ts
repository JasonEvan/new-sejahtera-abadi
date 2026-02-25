import api from "@/lib/axios";
import { Stock } from "./stock.types";

export async function getAllStocks() {
  const response = await api.get<{ data: Stock[] }>("/stocks");
  return response.data;
}
