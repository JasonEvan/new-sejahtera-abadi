import api from "@/lib/axios";
import { Client, InsertClient } from "./client.types";

export async function getClients() {
  const response = await api.get<{ data: Client[] }>("/clients");
  return response.data;
}

export async function addClient(data: InsertClient) {
  const response = await api.post<{ message: string }>("/clients", data);
  return response.data;
}
