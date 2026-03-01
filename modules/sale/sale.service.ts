import db from "@/lib/drizzle";
import { InsertSale } from "./sale.types";
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

      const insertSaleOrderLine = saleOrderLineRepository.insertSaleOrderLine(
        data,
        insertSaleOrders[0].id,
        tx,
      );

      const mappedData = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
      }));
      const decStockAndIncQtyOut =
        stockRepository.bulkDecrementStockAndIncrementQtyOut(mappedData, tx);

      const incInvoiceNumber = salespersonRepository.incInvoiceNumber(
        data.salesman_id,
        tx,
      );

      const incReceivableBalance = clientRepository.incReceivableBalance(
        data.client_id,
        data.total,
        tx,
      );

      await Promise.all([
        insertSaleOrderLine,
        decStockAndIncQtyOut,
        incInvoiceNumber,
        incReceivableBalance,
      ]);
    });
  },
};
