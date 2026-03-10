import api from "@/lib/axios";
import { InsertSalesPayment } from "./sales-payment.types";

export async function createSalesPayment(data: InsertSalesPayment) {
  const response = await api.post<{ message: string }>("/sales-payments", data);
  return response.data;
}
