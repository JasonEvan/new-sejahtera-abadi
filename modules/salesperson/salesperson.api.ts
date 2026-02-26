import api from "@/lib/axios";
import {
  EditSalesperson,
  InsertSalesperson,
  Salesperson,
} from "./salesperson.types";

export async function getSalespersons() {
  const response = await api.get<{ data: Salesperson[] }>("/salespersons");
  return response.data;
}

export async function addSalesperson(data: InsertSalesperson) {
  const response = await api.post<{ message: string }>("/salespersons", data);
  return response.data;
}

export async function editSalesperson({
  id,
  data,
}: {
  id: number;
  data: EditSalesperson;
}) {
  const response = await api.put<{ message: string }>(
    `/salespersons/${id}`,
    data,
  );
  return response.data;
}

export async function deleteSalesperson(id: number) {
  const response = await api.delete<{ message: string }>(`/salespersons/${id}`);
  return response.data;
}
