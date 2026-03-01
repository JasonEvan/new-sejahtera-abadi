import api from "@/lib/axios";
import { InsertSale } from "./sale.types";

export async function createSale(data: InsertSale) {
  const response = await api.post<{ message: string }>("/sales", data);
  return response.data;
}
