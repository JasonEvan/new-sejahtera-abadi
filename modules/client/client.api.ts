import api from "@/lib/axios";
import { Client, InsertClient } from "./client.types";

export async function getClients() {
  const response = await api.get<{ data: Client[] }>("/clients");
  return response.data;
}

export async function getClientNames() {
  const params = {
    nameOnly: "true",
  };

  const queryParams = new URLSearchParams(params);
  const response = await api.get<{ data: Client[] }>(
    `/clients?${queryParams.toString()}`,
  );
  return response.data;
}

export async function addClient(data: InsertClient) {
  const response = await api.post<{ message: string }>("/clients", data);
  return response.data;
}

export async function editClient({
  id,
  data,
}: {
  id: number;
  data: InsertClient;
}) {
  const response = await api.put<{ message: string }>(`/clients/${id}`, data);
  return response.data;
}

export async function deleteClient(id: number) {
  const response = await api.delete<{ message: string }>(`/clients/${id}`);
  return response.data;
}
