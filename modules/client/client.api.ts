import api from "@/lib/axios";
import { Client } from "./client.types";

export async function getClients() {
  const response = await api.get<{ data: Client[] }>("/clients");
  return response.data;
}
