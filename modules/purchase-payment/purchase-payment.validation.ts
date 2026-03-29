import z from "zod";
import { PurchasePaymentTableRow } from "./purchase-payment.types";
import dayjs from "dayjs";

export const createPurchasePaymentValidation = (
  cart: PurchasePaymentTableRow[],
) =>
  z
    .object({
      purchase_order_id: z.int().min(1, "Purchase order is required"),
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
        (item) => item.purchase_order_id === data.purchase_order_id,
      );

      if (existingPayment) {
        ctx.addIssue({
          code: "custom",
          message: "Nomor nota sudah ada di keranjang",
          path: ["purchase_order_id"],
        });
      }
    });

export const editPurchasePaymentValidation = (balance_due: number) =>
  z.object({
    paid_amount: z
      .int()
      .min(1, "Paid amount must be at least 1")
      .max(balance_due, "Pelunasan tidak boleh melebihi saldo"),
  });

export const backendPurchasePaymentValidation = z
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
          purchase_order_id: z.int().min(1, "Purchase order is required"),
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

export const deleteEditPayablesByInvoiceValidation = z.object({
  invoice_number: z.string().trim().min(1, "Nomor nota harus diisi"),
});

export const updateEditPayablesByInvoiceValidation = z
  .object({
    invoice_number: z.string().trim().min(1, "Nomor nota harus diisi"),
    payments: z
      .array(
        z.object({
          transaction_number: z
            .string()
            .trim()
            .min(1, "Nomor transaksi harus diisi"),
          payment_date: z
            .string()
            .trim()
            .min(1, "Tanggal lunas harus diisi")
            .refine((val) => dayjs(val).isValid(), {
              error: "Tanggal lunas tidak valid",
            }),
          paid_amount: z.int().min(0, "Lunas nota tidak boleh negatif"),
        }),
      )
      .min(1, "Minimal ada 1 pembayaran"),
  })
  .superRefine((data, ctx) => {
    const hasPositivePayment = data.payments.some(
      (item) => item.paid_amount > 0,
    );

    if (!hasPositivePayment) {
      ctx.addIssue({
        code: "custom",
        message: "Minimal ada 1 pembayaran dengan nilai lebih dari 0",
        path: ["payments"],
      });
    }
  });
