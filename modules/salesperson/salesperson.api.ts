import api from "@/lib/axios";
import { Salesperson } from "./salesperson.types";

export async function getSalespersons() {
  const response = await api.get<{ data: Salesperson[] }>("/salespersons");
  return response.data;
}
