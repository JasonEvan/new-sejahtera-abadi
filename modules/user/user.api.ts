import api from "@/lib/axios";
import { User, InsertUser } from "./user.types";

export async function getUsers() {
  const response = await api.get<{ data: User[] }>("/users");
  return response.data;
}

export async function addUser(data: InsertUser) {
  const response = await api.post<{ message: string }>("/users", data);
  return response.data;
}

export async function editUser({ id, data }: { id: number; data: InsertUser }) {
  const response = await api.put<{ message: string }>(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number) {
  const response = await api.delete<{ message: string }>(`/users/${id}`);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<{ authenticated: boolean; user: User }>(
    "/auth/me",
  );
  return response.data;
}
