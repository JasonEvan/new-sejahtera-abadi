import z from "zod";

export const editPurchaseItemSchema = z.object({
  stock_id: z.number().int().min(1, "Pilih produk"),
  product_price: z
    .number()
    .min(0, "Harga harus lebih dari atau sama dengan 0"),
  quantity: z.number().int().min(0, "Jumlah tidak boleh negatif"),
});
