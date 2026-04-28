import api from "@/lib/axios";
import { Role } from "./role.types";

export async function getRoles() {
  const response = await api.get<{ data: Role[] }>("/roles");
  return response.data;
}
