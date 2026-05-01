import dayjs from "dayjs";
import z from "zod";

export const returnTransactionValidation = z.object({
  client: z.int().min(1, "Pilih klien"),
  sales_order_id: z.int().min(1, "Pilih nota"),
  return_date: z
    .string()
    .nonempty("Tanggal retur tidak boleh kosong")
    .refine((value) => dayjs(value).isValid(), {
      error: "Tanggal retur tidak valid",
    }),
});

export const backendSaleReturnValidation = z.object({
  client_id: z.int().min(1, "Pilih klien"),
  sales_order_id: z.int().min(1, "Pilih nota"),
  return_date: z
    .string()
    .nonempty("Tanggal retur tidak boleh kosong")
    .refine((value) => dayjs(value).isValid(), {
      error: "Tanggal retur tidak valid",
    }),
  lines: z
    .array(
      z.object({
        sales_order_line_id: z.int().min(1),
        return_qty: z.int().min(1, "Jumlah retur harus lebih dari 0"),
      }),
    )
    .min(1, "Pilih minimal 1 item untuk diretur"),
});

export const backendEditSaleReturnValidation = z.object({
  sales_return_id: z.number().min(1, "ID retur wajib ada"),
  return_date: z
    .string()
    .nonempty("Tanggal retur tidak boleh kosong")
    .refine((value) => dayjs(value).isValid(), {
      error: "Tanggal retur tidak valid",
    }),
  lines: z
    .array(
      z.object({
        sales_order_line_id: z.int().min(1),
        return_qty: z.int().min(0, "Jumlah retur tidak boleh negatif"),
      }),
    )
    .min(1, "Minimal ada 1 baris item"),
});
