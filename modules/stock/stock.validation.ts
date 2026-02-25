import z from "zod";

export const addStockValidation = z.object({
  name: z.string().nonempty("Nama stock harus diisi"),
  unit: z.string().nonempty("Satuan stock harus diisi"),
  initial_stock: z.number().min(0, "Stock awal tidak boleh negatif"),
  capital_cost: z.number().min(0, "Harga modal tidak boleh negatif"),
  product_price: z.number().min(0, "Harga beli tidak boleh negatif"),
  selling_price: z.number().min(0, "Harga jual tidak boleh negatif").optional(),
});
