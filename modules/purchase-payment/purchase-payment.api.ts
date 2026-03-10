import api from "@/lib/axios";
import { InsertPurchasePayment } from "./purchase-payment.types";

export async function createPurchasePayment(data: InsertPurchasePayment) {
  const response = await api.post<{ message: string }>(
    "/purchase-payments",
    data,
  );
  return response.data;
}
