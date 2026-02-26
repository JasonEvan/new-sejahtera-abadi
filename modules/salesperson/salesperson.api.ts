import api from "@/lib/axios";
import { InsertSalesperson, Salesperson } from "./salesperson.types";

export async function getSalespersons() {
  const response = await api.get<{ data: Salesperson[] }>("/salespersons");
  return response.data;
}

export async function addSalesperson(data: InsertSalesperson) {
  const response = await api.post<{ message: string }>("/salespersons", data);
  return response.data;
}
