import api from "@/lib/axios";
import { InsertPurchase, PurchaseOrder } from "./purchase.types";

export async function createPurchase(data: InsertPurchase) {
  const response = await api.post<{ message: string }>("/purchases", data);
  return response.data;
}

export async function getOrdersMenu(clientId: number, isPaidOff: boolean) {
  const params = {
    client_id: clientId.toString(),
    is_paid_off: isPaidOff ? "true" : "false",
    for_menu: "true",
  };

  const queryParams = new URLSearchParams(params);

  const response = await api.get<{ data: PurchaseOrder[] }>(
    `/purchases?${queryParams.toString()}`,
  );
  return response.data;
}
