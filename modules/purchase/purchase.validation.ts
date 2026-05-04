import dayjs from "dayjs";
import z from "zod";

export const invoiceInformationValidation = z.object({
  client: z.int().min(1, "Pilih klien"),
  invoice_number: z.string().nonempty("Nomor faktur tidak boleh kosong"),
  invoice_date: z
    .string()
    .nonempty("Tanggal faktur tidak boleh kosong")
    .refine((value) => dayjs(value).isValid(), {
      error: "Tanggal faktur tidak valid",
    }),
});

export const createItemValidation = z.object({
  stock_id: z.int().min(1, "Pilih produk"),
  quantity: z.int().min(1, "Jumlah harus lebih dari 1"),
  selling_price: z
    .int()
    .min(0, "Harga jual harus lebih dari atau sama dengan 0"),
  product_price: z
    .int()
    .min(0, "Harga beli harus lebih dari atau sama dengan 0"),
});

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
      Math.round(
        data.invoice_value - (data.discount * data.invoice_value) / 100,
      ),
    {
      error: "Total tidak sesuai dengan nilai faktur dan diskon",
      path: ["total"],
    },
  );

export const backendPurchaseValidation = z
  .object({
    client_id: z.int().min(1, "Pilih klien"),
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
          product_price: z
            .int()
            .min(0, "Harga beli harus lebih dari atau sama dengan 0"),
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
      const expectedSubtotal = item.quantity * item.product_price;
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
    const expectedTotal = Math.round(
      data.invoice_value - (data.discount * data.invoice_value) / 100,
    );
    if (data.total !== expectedTotal) {
      ctx.addIssue({
        code: "custom",
        message: "Total tidak sesuai dengan nilai faktur dan diskon",
        path: ["total"],
      });
    }
  });

export const backendEditPurchaseValidation = z
  .object({
    client_id: z.int().min(1, "Pilih klien"),
    cart: z
      .array(
        z.object({
          stock_id: z.int().min(1, "Pilih produk"),
          name: z.string().min(1, "Nama produk tidak boleh kosong"),
          quantity: z.int().min(1, "Jumlah harus lebih dari 1"),
          product_price: z
            .int()
            .min(0, "Harga beli harus lebih dari atau sama dengan 0"),
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

    data.cart.forEach((item, index) => {
      const expectedSubtotal = item.quantity * item.product_price;
      if (item.subtotal !== expectedSubtotal) {
        ctx.addIssue({
          code: "custom",
          message: `Subtotal pada item ${item.name} tidak sesuai dengan quantity dan harga beli`,
          path: ["cart", index, "subtotal"],
        });
      }
      calculatedInvoiceValue += item.subtotal;
    });

    if (data.invoice_value !== calculatedInvoiceValue) {
      ctx.addIssue({
        code: "custom",
        message: "Nilai faktur tidak sesuai dengan jumlah subtotal barang",
        path: ["invoice_value"],
      });
    }

    const expectedTotal = Math.round(
      data.invoice_value - (data.discount * data.invoice_value) / 100,
    );
    if (data.total !== expectedTotal) {
      ctx.addIssue({
        code: "custom",
        message: "Total tidak sesuai dengan nilai faktur dan diskon",
        path: ["total"],
      });
    }
  });
