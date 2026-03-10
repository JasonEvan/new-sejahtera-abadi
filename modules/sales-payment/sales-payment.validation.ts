import dayjs from "dayjs";
import z from "zod";
import { SalesPaymentTableRow } from "./sales-payment.types";

export const transactionInformationValidation = z.object({
  client: z.int().min(1, "Client is required"),
  transaction_number: z.string().nonempty("Transaction number is required"),
  transaction_date: z
    .string()
    .nonempty("Transaction date is required")
    .refine((date) => dayjs(date).isValid(), {
      error: "Tanggal transaksi tidak valid",
    }),
});

export const createSalesPaymentValidation = (cart: SalesPaymentTableRow[]) =>
  z
    .object({
      sales_order_id: z.int().min(1, "Sales order is required"),
      balance_due: z.int().min(0, "Balance due must be a positive number"),
      paid_amount: z.int().min(1, "Paid amount must be at least 1"),
    })
    .superRefine((data, ctx) => {
      if (data.paid_amount > data.balance_due) {
        ctx.addIssue({
          code: "custom",
          message: "Pelunasan tidak boleh melebihi saldo",
          path: ["paid_amount"],
        });
      }

      const existingPayment = cart.find(
        (item) => item.sales_order_id === data.sales_order_id,
      );

      if (existingPayment) {
        ctx.addIssue({
          code: "custom",
          message: "Nomor nota sudah ada di keranjang",
          path: ["sales_order_id"],
        });
      }
    });

export const editSalesPaymentValidation = (balance_due: number) =>
  z.object({
    paid_amount: z
      .int()
      .min(1, "Paid amount must be at least 1")
      .max(balance_due, "Pelunasan tidak boleh melebihi saldo"),
  });

export const backendSalesPaymentValidation = z
  .object({
    client_id: z.int().min(1, "Pilih klien"),
    transaction_number: z.string().nonempty("Nomor transaksi harus diisi"),
    transaction_date: z
      .string()
      .nonempty("Tanggal transaksi harus diisi")
      .refine((val) => dayjs(val).isValid(), {
        error: "Tanggal transaksi tidak valid",
      }),
    cart: z
      .array(
        z.object({
          sales_order_id: z.int().min(1, "Sales order is required"),
          balance_due: z.int().min(0, "Balance due must be a positive number"),
          paid_amount: z.int().min(1, "Paid amount must be at least 1"),
        }),
      )
      .min(1, "Cart at least 1"),
  })
  .superRefine((data, ctx) => {
    data.cart.forEach((item, index) => {
      if (item.paid_amount > item.balance_due) {
        ctx.addIssue({
          code: "custom",
          message: `Pelunasan tidak boleh melebihi saldo pada item ke-${index + 1}`,
          path: ["cart", index, "paid_amount"],
        });
      }
    });
  });
