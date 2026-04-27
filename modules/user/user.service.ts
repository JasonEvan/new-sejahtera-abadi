import bcrypt from "bcrypt";
import { userRepository } from "./user.repository";
import { InsertUser } from "./user.types";

export const userService = {
  getUsers() {
    return userRepository.getUsers();
  },

  async addUser(data: InsertUser) {
    if (!data.password || data.password.trim() === "") {
      throw new Error("Password is required for new user");
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return userRepository.addUser({
      ...data,
      password: hashedPassword,
    });
  },

  async updateUser(id: number, data: Partial<InsertUser>) {
    const updateData = { ...data };
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    } else {
      delete updateData.password;
    }
    return userRepository.updateUser(id, updateData);
  },

  deleteUser(id: number) {
    return userRepository.deleteUser(id);
  },
};
