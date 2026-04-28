import { z } from "zod";

export const roleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama role harus diisi").max(50, "Maksimal 50 karakter"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
