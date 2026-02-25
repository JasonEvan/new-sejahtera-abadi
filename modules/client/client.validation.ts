import z from "zod";

export const addClientValidation = z.object({
  name: z.string().nonempty("Nama client harus diisi"),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  mobile_phone: z.string().optional(),
});
