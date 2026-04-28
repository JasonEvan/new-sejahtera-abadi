import { z } from "zod";

export const userSchema = z.object({
  id: z.number().optional(),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  role_id: z.coerce.number().min(1, "Role harus dipilih"),
});

export type UserFormValues = z.infer<typeof userSchema>;
