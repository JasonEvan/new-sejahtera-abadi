import api from "@/lib/axios";

export async function performCutoff(data: { endDate: string }) {
  const response = await api.post<{ message: string }>("/cutoff", data);
  return response.data;
}
