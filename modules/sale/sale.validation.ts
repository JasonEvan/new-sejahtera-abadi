import dayjs from "dayjs";
import z from "zod";
import { SaleTableRow } from "./sale.types";

export const invoiceInformationValidation = z.object({
  client: z.int().min(1, "Pilih klien"),
  salesman: z.int().min(1, "Pilih sales"),
  invoice_number: z.string().nonempty("Nomor faktur tidak boleh kosong"),
  invoice_date: z
    .string()
    .nonempty("Tanggal faktur tidak boleh kosong")
    .refine((value) => dayjs(value).isValid(), {
      error: "Tanggal faktur tidak valid",
    }),
});

export const createItemValidation = (
  stocks: { id: number; ending_stock: number }[],
  cart: SaleTableRow[],
  editingRowId?: string,
) =>
  z
    .object({
      stock_id: z.int().min(1, "Pilih produk"),
      quantity: z.int().min(1, "Jumlah harus lebih dari 1"),
      capital_cost: z
        .number()
        .min(0, "Harga pokok harus lebih dari atau sama dengan 0"),
      selling_price: z
        .number()
        .min(0, "Harga jual harus lebih dari atau sama dengan 0"),
    })
    .refine(
      (data) => {
        const selectedStock = stocks.find(
          (stock) => stock.id === data.stock_id,
        );
        if (!selectedStock) return false;

        const existingQuantity = cart
          .filter((item) => item.stock_id === data.stock_id)
          .filter((item) => item.id !== editingRowId) // Exclude the item being edited
          .reduce((acc, curr) => acc + curr.quantity, 0);

        return data.quantity + existingQuantity <= selectedStock.ending_stock;
      },
      {
        error: "Jumlah melebihi stok yang tersedia",
        path: ["quantity"],
      },
    );

export const invoiceMetaValidation = z
  .object({
    invoice_value: z
      .int()
      .min(0, "Nilai faktur harus lebih dari atau sama dengan 0"),
    discount: z
      .int()
      .min(0, "Diskon harus lebih dari atau sama dengan 0")
      .max(100, "Diskon tidak boleh lebih dari 100%"),
    total: z.int().min(0, "Total harus lebih dari atau sama dengan 0"),
  })
  .refine(
    (data) =>
      data.total ===
      data.invoice_value - (data.discount * data.invoice_value) / 100,
    {
      error: "Total tidak sesuai dengan nilai faktur dan diskon",
      path: ["total"],
    },
  );

export const backendSaleValidation = z
  .object({
    client_id: z.int().min(1, "Pilih klien"),
    salesman_id: z.int().min(1, "Pilih sales"),
    invoice_number: z.string().nonempty("Nomor faktur tidak boleh kosong"),
    invoice_date: z
      .string()
      .nonempty("Tanggal faktur tidak boleh kosong")
      .refine((value) => dayjs(value).isValid(), {
        error: "Tanggal faktur tidak valid",
      }),
    cart: z
      .array(
        z.object({
          stock_id: z.int().min(1, "Pilih produk"),
          name: z.string().min(1, "Nama produk tidak boleh kosong"),
          quantity: z.int().min(1, "Jumlah harus lebih dari 1"),
          selling_price: z
            .int()
            .min(0, "Harga jual harus lebih dari atau sama dengan 0"),
          subtotal: z
            .int()
            .min(0, "Subtotal harus lebih dari atau sama dengan 0"),
        }),
      )
      .min(1, "Keranjang tidak boleh kosong"),
    invoice_value: z
      .int()
      .min(0, "Nilai faktur harus lebih dari atau sama dengan 0"),
    discount: z
      .int()
      .min(0, "Diskon harus lebih dari atau sama dengan 0")
      .max(100, "Diskon tidak boleh lebih dari 100%"),
    total: z.int().min(0, "Total harus lebih dari atau sama dengan 0"),
  })
  .superRefine((data, ctx) => {
    let calculatedInvoiceValue = 0;

    // Validasi total setiap barang
    data.cart.forEach((item, index) => {
      const expectedSubtotal = item.quantity * item.selling_price;
      if (item.subtotal !== expectedSubtotal) {
        ctx.addIssue({
          code: "custom",
          message: `Subtotal pada item ${item.name} tidak sesuai dengan quantity dan harga jual`,
          path: ["cart", index, "subtotal"],
        });
      }
      calculatedInvoiceValue += item.subtotal;
    });

    // Validasi nilai faktur
    if (data.invoice_value !== calculatedInvoiceValue) {
      ctx.addIssue({
        code: "custom",
        message: "Nilai faktur tidak sesuai dengan jumlah subtotal barang",
        path: ["invoice_value"],
      });
    }

    // Validasi total setelah diskon
    const expectedTotal =
      data.invoice_value - (data.discount * data.invoice_value) / 100;
    if (data.total !== expectedTotal) {
      ctx.addIssue({
        code: "custom",
        message: "Total tidak sesuai dengan nilai faktur dan diskon",
        path: ["total"],
      });
    }
  });
