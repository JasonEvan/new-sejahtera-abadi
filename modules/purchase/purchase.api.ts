import api from "@/lib/axios";
import { InsertPurchase } from "./purchase.types";

export async function createPurchase(data: InsertPurchase) {
  const response = await api.post<{ message: string }>("/purchases", data);
  return response.data;
}
