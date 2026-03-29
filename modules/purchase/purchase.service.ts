import db from "@/lib/drizzle";
import dayjs from "dayjs";
import {
  InsertPurchase,
  PurchaseInvoiceDetailLine,
  PurchaseInvoiceHeader,
} from "./purchase.types";
import { purchaseOrderRepository } from "./purchase-order.repository";
import { AppError } from "@/lib/errors";
import { purchaseOrderLineRepository } from "./purchase-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { clientRepository } from "../client/client.repository";

export const purchaseService = {
  createPurchase(data: InsertPurchase) {
    return db.transaction(async (tx) => {
      const newPurchaseOrder =
        await purchaseOrderRepository.insertPurchaseOrder(data, tx);

      if (newPurchaseOrder.length === 0) {
        throw new AppError("Failed to create purchase order", 500);
      }

      await purchaseOrderLineRepository.insertPurchaseOrderLine(
        data,
        newPurchaseOrder[0].id,
        tx,
      );

      const mappedData = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
        product_price: item.product_price,
      }));

      await stockRepository.bulkIncrementStockAndIncrementQtyIn(mappedData, tx);
      await clientRepository.incPayableBalance(data.client_id, data.total, tx);
    });
  },

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return purchaseOrderRepository.getOrdersMenu(clientId, isPaidOff);
  },

  getPurchaseInvoices(invoicePrefix: string) {
    return purchaseOrderRepository.getPurchaseInvoices(invoicePrefix);
  },

  getReturnEligibleOrders(clientId: number) {
    return purchaseOrderRepository.getReturnEligibleOrders(clientId);
  },

  async getPurchaseReturnLines(invoiceNumber: string) {
    const result =
      await purchaseOrderRepository.getPurchaseReturnLinesWithMeta(
        invoiceNumber,
      );
    if (!result) throw new AppError("Invoice not found", 404);
    return result;
  },

  async getPurchaseInvoiceDetail(invoiceNumber: string) {
    const { header, lines } =
      await purchaseOrderRepository.getPurchaseInvoiceDetail(invoiceNumber);

    if (!header) throw new AppError("Invoice not found", 404);

    let totalPrice = 0;

    const formattedLines: PurchaseInvoiceDetailLine[] = [
      ...lines.map((line) => {
        totalPrice += line.total_price;
        return {
          name: line.name,
          qty: line.qty,
          unit: line.unit,
          price: line.price,
          total_price: line.total_price,
        };
      }),
      {
        name: "TOTAL",
        qty: null,
        unit: null,
        price: null,
        total_price: totalPrice,
      },
    ];

    return {
      header: {
        invoice_number: header.invoice_number,
        invoice_date: dayjs(header.invoice_date).format("DD/MM/YYYY"),
        invoice_value: header.invoice_value,
        client_name: header.client_name,
        client_city: header.client_city,
      } as PurchaseInvoiceHeader,
      lines: formattedLines,
    };
  },
};
