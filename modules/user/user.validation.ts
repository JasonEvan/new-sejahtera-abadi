import { z } from "zod";

export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "owner"], {
    message: "Role harus dipilih",
  }),
});

export type UserFormValues = z.infer<typeof userSchema>;
