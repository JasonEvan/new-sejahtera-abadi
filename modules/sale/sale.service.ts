import db from "@/lib/drizzle";
import dayjs from "dayjs";
import { InsertSale, SalesInvoiceDetailLine, SalesInvoiceHeader } from "./sale.types";
import { saleOrderRepository } from "./sale-order.repository";
import { saleOrderLineRepository } from "./sale-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { salespersonRepository } from "../salesperson/salesperson.repository";
import { clientRepository } from "../client/client.repository";
import { AppError } from "@/lib/errors";
import { Tx } from "@/lib/common-types";

export const saleService = {
  async validateStockAvailability(cart: InsertSale["cart"], tx: Tx) {
    if (cart.length === 0) {
      throw new AppError("Cart cannot be empty", 400);
    }

    const stockIds = cart.map((item) => item.stock_id);
    const dbStocks = await stockRepository.getStocksForUpdate(stockIds, tx);

    cart.forEach((item) => {
      const currStock = dbStocks.find((stock) => stock.id === item.stock_id);
      if (!currStock) {
        throw new AppError(`Stock ${item.name} not found`, 404);
      }

      if (currStock.ending_stock < item.quantity) {
        throw new AppError(
          `Not enough stock for ${item.name}. Available: ${currStock.ending_stock}, Requested: ${item.quantity}`,
          400,
        );
      }
    });
  },

  createSale(data: InsertSale) {
    return db.transaction(async (tx) => {
      await this.validateStockAvailability(data.cart, tx);

      const insertSaleOrders = await saleOrderRepository.insertSaleOrder(
        data,
        tx,
      );

      if (insertSaleOrders.length === 0) {
        throw new AppError("Failed to create sale order", 500);
      }

      await saleOrderLineRepository.insertSaleOrderLine(
        data,
        insertSaleOrders[0].id,
        tx,
      );

      const mappedData = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
      }));
      await stockRepository.bulkDecrementStockAndIncrementQtyOut(
        mappedData,
        tx,
      );

      await salespersonRepository.incInvoiceNumber(data.salesman_id, tx);

      await clientRepository.incReceivableBalance(
        data.client_id,
        data.total,
        tx,
      );
    });
  },

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return saleOrderRepository.getOrdersMenu(clientId, isPaidOff);
  },

  getSalesInvoices(invoicePrefix: string) {
    return saleOrderRepository.getSalesInvoices(invoicePrefix);
  },

  async getSalesInvoiceDetail(invoiceNumber: string) {
    const { header, lines } = await saleOrderRepository.getSalesInvoiceDetail(invoiceNumber);

    if (!header) throw new AppError("Invoice not found", 404);

    let totalPrice = 0;

    const formattedLines: SalesInvoiceDetailLine[] = [
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
      } as SalesInvoiceHeader,
      lines: formattedLines,
    };
  },

  getReturnEligibleOrders(clientId: number) {
    return saleOrderRepository.getReturnEligibleOrders(clientId);
  },

  async getSaleReturnLines(invoiceNumber: string) {
    const result =
      await saleOrderRepository.getSaleReturnLinesWithMeta(invoiceNumber);
    if (!result) throw new AppError("Invoice not found", 404);
    return result;
  },
};
