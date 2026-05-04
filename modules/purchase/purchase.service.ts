import db from "@/lib/drizzle";
import dayjs from "dayjs";
import {
  EditPurchase,
  InsertPurchase,
  PurchaseInvoiceDetailLine,
  PurchaseInvoiceHeader,
} from "./purchase.types";
import { purchaseOrderRepository } from "./purchase-order.repository";
import { AppError } from "@/lib/errors";
import { purchaseOrderLineRepository } from "./purchase-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { clientRepository } from "../client/client.repository";
import { purchaseReturnRepository } from "../purchase-return/purchase-return.repository";

export const purchaseService = {
  async validateStockReductionAvailability(
    items: { stock_id: number | null; qty: number }[],
    tx: Parameters<typeof stockRepository.getStocksForUpdate>[1],
  ) {
    const validItems = items.filter((item) => item.stock_id !== null);
    const stockIds = validItems.map((item) => item.stock_id as number);
    const dbStocks = await stockRepository.getStocksForUpdate(stockIds, tx);

    validItems.forEach((item) => {
      const currStock = dbStocks.find((stock) => stock.id === item.stock_id);
      if (!currStock) return;

      if (currStock.ending_stock < item.qty) {
        throw new AppError(
          "Stok saat ini tidak cukup untuk membatalkan nota pembelian lama",
          400,
        );
      }
    });
  },

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

  updatePurchase(purchaseOrderId: number, data: EditPurchase) {
    return db.transaction(async (tx) => {
      const order = await purchaseOrderRepository.getById(purchaseOrderId, tx);
      if (!order) {
        throw new AppError("Purchase order not found", 404);
      }

      const hasReturn =
        await purchaseReturnRepository.hasReturnForPurchaseOrder(
          purchaseOrderId,
          tx,
        );
      if (hasReturn) {
        throw new AppError(
          "Nota tidak bisa diedit karena sudah memiliki retur pembelian",
          400,
        );
      }

      if (order.client_id !== data.client_id) {
        throw new AppError(
          "Client does not match selected purchase order",
          400,
        );
      }

      const oldTotal = order.invoice_value;

      const existingLines =
        await purchaseOrderLineRepository.getByPurchaseOrderId(
          purchaseOrderId,
          tx,
        );

      await this.validateStockReductionAvailability(existingLines, tx);

      const revertedStocks = existingLines
        .filter((line) => line.stock_id !== null)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.qty,
        }));

      await stockRepository.bulkDecrementStockAndDecrementQtyIn(
        revertedStocks,
        tx,
      );

      await purchaseOrderLineRepository.deleteByPurchaseOrderId(
        purchaseOrderId,
        tx,
      );

      await purchaseOrderLineRepository.insertPurchaseOrderLineForEdit(
        {
          client_id: data.client_id,
          cart: data.cart,
        },
        purchaseOrderId,
        tx,
      );

      const newStockIn = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
        product_price: item.product_price,
      }));

      await stockRepository.bulkIncrementStockAndIncrementQtyIn(newStockIn, tx);

      const balanceDue = data.total - order.paid_amount;
      if (balanceDue < 0) {
        throw new AppError(
          "New total cannot be lower than amount already paid",
          400,
        );
      }

      await purchaseOrderRepository.updateInvoiceMeta(
        purchaseOrderId,
        {
          invoiceValue: data.total,
          discount: data.discount,
          balanceDue,
        },
        tx,
      );

      const payableDelta = data.total - oldTotal;
      await clientRepository.incPayableBalance(
        data.client_id,
        payableDelta,
        tx,
      );
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

  getLatestPurchasedItemsByClient(clientId: number, namePrefix: string) {
    return purchaseOrderRepository.getLatestPurchasedItemsByClient(
      clientId,
      namePrefix,
    );
  },

  checkInvoiceExistence(invoiceNumber: string) {
    return purchaseOrderRepository.checkInvoiceExistence(invoiceNumber);
  },
};
