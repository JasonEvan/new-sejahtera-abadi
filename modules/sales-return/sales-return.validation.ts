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
  invoice_number: z.string().trim().min(1, "Nomor nota wajib diisi"),
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
    .min(1, "Minimal ada 1 baris item")
    .superRefine((lines, ctx) => {
      if (!lines.some((line) => line.return_qty > 0)) {
        ctx.addIssue({
          code: "custom",
          message: "Pilih minimal 1 item untuk diretur",
          path: ["lines"],
        });
      }
    }),
});
