import z from "zod";

export const addSalespersonValidation = z.object({
  name: z.string().nonempty("Nama tidak boleh kosong"),
  front_number: z.int().min(0, "Front number harus bernilai positif"),
  invoice_number: z.string().regex(/^\d+$/, "Must contain only numbers").optional(),
  phone_number: z.string().optional(),
  sales_code: z.string().nonempty("Sales code tidak boleh kosong"),
});

export const editSalespersonValidation = z.object({
  name: z.string().nonempty("Nama tidak boleh kosong"),
  front_number: z.int().min(0, "Front number harus bernilai positif"),
  invoice_number: z.string().regex(/^\d+$/, "Must contain only numbers"),
  phone_number: z.string().optional(),
  sales_code: z.string().nonempty("Sales code tidak boleh kosong"),
});
