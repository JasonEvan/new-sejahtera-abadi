import z from "zod";

export const addSalespersonValidation = z.object({
  name: z.string().nonempty("Nama tidak boleh kosong"),
  front_number: z.int().min(0, "Front number harus bernilai positif"),
  phone_number: z.string().optional(),
  sales_code: z.string().nonempty("Sales code tidak boleh kosong"),
});
