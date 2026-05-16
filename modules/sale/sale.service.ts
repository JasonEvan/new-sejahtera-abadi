import db from "@/lib/drizzle";
import dayjs from "dayjs";
import {
  EditSale,
  InsertSale,
  SalesInvoiceDetailLine,
  SalesInvoiceHeader,
} from "./sale.types";
import { saleOrderRepository } from "./sale-order.repository";
import { saleOrderLineRepository } from "./sale-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { salespersonRepository } from "../salesperson/salesperson.repository";
import { clientRepository } from "../client/client.repository";
import { AppError } from "@/lib/errors";
import { Tx } from "@/lib/common-types";
import { salesReturnRepository } from "../sales-return/sales-return.repository";

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

  updateSale(salesOrderId: number, data: EditSale) {
    return db.transaction(async (tx) => {
      const order = await saleOrderRepository.getById(salesOrderId, tx);
      if (!order) {
        throw new AppError("Sales order not found", 404);
      }

      const hasReturn = await salesReturnRepository.hasReturnForSalesOrder(
        salesOrderId,
        tx,
      );
      if (hasReturn) {
        throw new AppError(
          "Nota tidak bisa diedit karena sudah memiliki retur penjualan",
          400,
        );
      }

      if (order.client_id !== data.client_id) {
        throw new AppError("Client does not match selected sales order", 400);
      }

      const oldTotal = order.invoice_value;

      const existingLines = await saleOrderLineRepository.getBySalesOrderId(
        salesOrderId,
        tx,
      );

      const existingSalespersonId =
        existingLines.find((line) => line.salesperson_id !== null)
          ?.salesperson_id ?? null;

      // Revert previous inventory movement from this invoice.
      const revertedStocks = existingLines
        .filter((line) => line.stock_id !== null)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.qty,
        }));

      await stockRepository.bulkIncrementStockAndDecrementQtyOut(
        revertedStocks,
        tx,
      );

      await saleOrderLineRepository.deleteBySalesOrderId(salesOrderId, tx);

      await this.validateStockAvailability(data.cart, tx);

      await saleOrderLineRepository.insertSaleOrderLineForEdit(
        {
          client_id: data.client_id,
          salesperson_id: existingSalespersonId,
          cart: data.cart,
        },
        salesOrderId,
        tx,
      );

      const newStockOut = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
      }));

      await stockRepository.bulkDecrementStockAndIncrementQtyOut(
        newStockOut,
        tx,
      );

      const balanceDue = data.total - order.paid_amount;
      if (balanceDue < 0) {
        throw new AppError(
          "New total cannot be lower than amount already paid",
          400,
        );
      }

      await saleOrderRepository.updateInvoiceMeta(
        salesOrderId,
        {
          invoiceValue: data.total,
          discount: data.discount,
          balanceDue,
        },
        tx,
      );

      const receivableDelta = data.total - oldTotal;
      await clientRepository.incReceivableBalance(
        data.client_id,
        receivableDelta,
        tx,
      );
    });
  },

  deleteSale(salesOrderId: number) {
    return db.transaction(async (tx) => {
      // 1. Get order and check existence
      const order = await saleOrderRepository.getById(salesOrderId, tx);
      if (!order) {
        throw new AppError("Sales order not found", 404);
      }

      // 2. Validate paid_amount === 0
      if (order.paid_amount !== 0) {
        throw new AppError("Nota tidak bisa dihapus karena sudah dibayar", 400);
      }

      // 3. Validate no returns
      const hasReturn = await salesReturnRepository.hasReturnForSalesOrder(
        salesOrderId,
        tx,
      );
      if (hasReturn) {
        throw new AppError(
          "Nota tidak bisa dihapus karena sudah memiliki retur penjualan",
          400,
        );
      }

      // 4. Revert stocks
      const existingLines = await saleOrderLineRepository.getBySalesOrderId(
        salesOrderId,
        tx,
      );
      const revertedStocks = existingLines
        .filter((line) => line.stock_id !== null)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.qty,
        }));
      await stockRepository.bulkIncrementStockAndDecrementQtyOut(
        revertedStocks,
        tx,
      );

      // 5. Revert client receivables (Total was added to receivables when created)
      await clientRepository.decReceivableBalance(
        order.client_id,
        order.invoice_value,
        tx,
      );

      // 6. Delete lines and order
      await saleOrderLineRepository.deleteBySalesOrderId(salesOrderId, tx);
      await saleOrderRepository.deleteBySalesOrderId(salesOrderId, tx);
    });
  },

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return saleOrderRepository.getOrdersMenu(clientId, isPaidOff);
  },

  getSalesInvoices(invoicePrefix: string) {
    return saleOrderRepository.getSalesInvoices(invoicePrefix);
  },

  async getSalesInvoiceDetail(invoiceNumber: string) {
    const { header, lines } =
      await saleOrderRepository.getSalesInvoiceDetail(invoiceNumber);

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
        client_address: header.client_address,
        sales_code: header.sales_code ?? "",
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

  getLatestSoldItemsByClient(clientId: number, namePrefix: string) {
    return saleOrderRepository.getLatestSoldItemsByClient(clientId, namePrefix);
  },

  checkInvoiceExistence(invoiceNumber: string) {
    return saleOrderRepository.checkInvoiceExistence(invoiceNumber);
  },
};
