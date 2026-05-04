import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().min(1, "Alamat perusahaan wajib diisi"),
  timezone: z.string().min(1, "Zona waktu wajib diisi"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
