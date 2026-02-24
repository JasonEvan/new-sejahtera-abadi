import z from "zod";

export const addClientValidation = z.object({
  name: z.string().nonempty("Nama client harus diisi"),
  city: z.string(),
  address: z.string(),
  phone: z.string(),
  mobile_phone: z.string(),
});
