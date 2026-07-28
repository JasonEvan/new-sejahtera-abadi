import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import {
  clients,
  sales_order_lines,
  sales_orders,
  salespersons,
  stocks,
} from "@/drizzle/schema";
import db from "@/lib/drizzle";
import dayjs from "dayjs";
import { and, asc, desc, eq, ilike, inArray, like, ne, sql } from "drizzle-orm";
import { AppError } from "@/lib/errors";

type SalesOrderPaymentItem = {
  sales_order_id: number;
  paid_amount: number;
};

function aggregateSalesOrderPaymentItems(
  items: SalesOrderPaymentItem[],
): SalesOrderPaymentItem[] {
  const aggregated = new Map<number, number>();

  for (const item of items) {
    aggregated.set(
      item.sales_order_id,
      (aggregated.get(item.sales_order_id) ?? 0) + item.paid_amount,
    );
  }

  return Array.from(aggregated, ([sales_order_id, paid_amount]) => ({
    sales_order_id,
    paid_amount,
  }));
}

export const saleOrderRepository = {
  insertSaleOrder(data: InsertSale, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(sales_orders)
      .values({
        client_id: data.client_id,
        invoice_number: data.invoice_number,
        invoice_date: dayjs(data.invoice_date).toDate(),
        invoice_value: data.total,
        invoice_discount: data.discount,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: data.total,
      })
      .returning({
        id: sales_orders.id,
      });
  },

  async getById(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    const [order] = await database
      .select({
        id: sales_orders.id,
        client_id: sales_orders.client_id,
        invoice_value: sales_orders.invoice_value,
        paid_amount: sales_orders.paid_amount,
      })
      .from(sales_orders)
      .where(eq(sales_orders.id, salesOrderId));

    return order;
  },

  async getByInvoiceNumber(invoiceNumber: string, tx?: Tx) {
    const database = tx ?? db;

    const [order] = await database
      .select({
        id: sales_orders.id,
        client_id: sales_orders.client_id,
        invoice_value: sales_orders.invoice_value,
        paid_amount: sales_orders.paid_amount,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    return order;
  },

  async getByInvoiceNumbers(invoiceNumbers: string[], tx?: Tx) {
    if (invoiceNumbers.length === 0) return [];
    const database = tx ?? db;

    return database
      .select({
        id: sales_orders.id,
        client_id: sales_orders.client_id,
        invoice_number: sales_orders.invoice_number,
        invoice_value: sales_orders.invoice_value,
        paid_amount: sales_orders.paid_amount,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .where(inArray(sales_orders.invoice_number, invoiceNumbers));
  },

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return db
      .select({
        id: sales_orders.id,
        invoice_number: sales_orders.invoice_number,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.client_id, clientId),
          isPaidOff
            ? eq(sales_orders.balance_due, 0)
            : ne(sales_orders.balance_due, 0),
        ),
      );
  },

  bulkIncPaidAmountAndDecBalanceDue(
    items: { sales_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    const aggregatedItems = aggregateSalesOrderPaymentItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map(
        (item) => sql`(${item.sales_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${sales_orders} as so
      SET
        paid_amount = so.paid_amount + v.paid_amount,
        balance_due = so.balance_due - v.paid_amount
      FROM (VALUES ${values}) AS v(sales_order_id, paid_amount)
      WHERE so.id = v.sales_order_id
    `;

    return database.execute(query);
  },

  bulkDecPaidAmountAndIncBalanceDue(
    items: { sales_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    const aggregatedItems = aggregateSalesOrderPaymentItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map(
        (item) => sql`(${item.sales_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${sales_orders} as so
      SET
        paid_amount = so.paid_amount - v.paid_amount,
        balance_due = so.balance_due + v.paid_amount
      FROM (VALUES ${values}) AS v(sales_order_id, paid_amount)
      WHERE so.id = v.sales_order_id
    `;

    return database.execute(query);
  },

  getSalesInvoices(invoicePrefix: string) {
    return db
      .select({
        invoice_number: sales_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        invoice_value: sales_orders.invoice_value,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .innerJoin(clients, eq(sales_orders.client_id, clients.id))
      .where(like(sales_orders.invoice_number, `${invoicePrefix}%`))
      .orderBy(asc(sales_orders.invoice_number));
  },

  async getSalesInvoiceDetail(invoiceNumber: string) {
    const [header] = await db
      .select({
        invoice_number: sales_orders.invoice_number,
        invoice_date: sales_orders.invoice_date,
        invoice_value: sales_orders.invoice_value,
        client_name: clients.name,
        client_city: clients.city,
        client_address: clients.address,
        sales_code: salespersons.sales_code,
      })
      .from(sales_orders)
      .innerJoin(clients, eq(sales_orders.client_id, clients.id))
      .leftJoin(
        sales_order_lines,
        eq(sales_orders.id, sales_order_lines.sales_order_id),
      )
      .leftJoin(
        salespersons,
        eq(sales_order_lines.salesperson_id, salespersons.id),
      )
      .where(eq(sales_orders.invoice_number, invoiceNumber))
      .limit(1);

    if (!header)
      return {
        header: null,
        lines: [] as {
          name: string | null;
          qty: number;
          unit: string | null;
          price: number;
          total_price: number;
        }[],
      };

    const lines = await db
      .select({
        name: stocks.name,
        qty: sales_order_lines.qty,
        unit: stocks.unit,
        price: sales_order_lines.price,
        total_price: sales_order_lines.total_price,
      })
      .from(sales_order_lines)
      .innerJoin(
        sales_orders,
        eq(sales_order_lines.sales_order_id, sales_orders.id),
      )
      .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    return { header, lines };
  },

  getReturnEligibleOrders(clientId: number) {
    return db
      .select({
        id: sales_orders.id,
        invoice_number: sales_orders.invoice_number,
      })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.client_id, clientId),
          eq(sales_orders.paid_amount, 0),
        ),
      )
      .orderBy(asc(sales_orders.invoice_number));
  },

  async getSaleReturnLinesWithMeta(invoiceNumber: string) {
    const [order] = await db
      .select({
        invoice_value: sales_orders.invoice_value,
        invoice_discount: sales_orders.invoice_discount,
      })
      .from(sales_orders)
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    if (!order) return null;

    const lines = await db
      .select({
        id: sales_order_lines.id,
        stock_id: sales_order_lines.stock_id,
        name: stocks.name,
        price: sales_order_lines.price,
        qty: sales_order_lines.qty,
      })
      .from(sales_order_lines)
      .innerJoin(
        sales_orders,
        eq(sales_order_lines.sales_order_id, sales_orders.id),
      )
      .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    const invoice_value = lines.reduce((acc, l) => acc + l.price * l.qty, 0);

    return {
      meta: {
        invoice_value,
        discount: order.invoice_discount,
        total: order.invoice_value,
      },
      lines: lines.map((l) => ({
        id: l.id,
        stock_id: l.stock_id ?? 0,
        name: l.name ?? "",
        price: l.price,
        qty: l.qty,
      })),
    };
  },

  async getDiscountById(salesOrderId: number, tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const [order] = await database
      .select({ invoice_discount: sales_orders.invoice_discount })
      .from(sales_orders)
      .where(eq(sales_orders.id, salesOrderId));
    if (!order)
      throw new AppError(`Sales order ${salesOrderId} not found`, 404);
    return order.invoice_discount;
  },

  async getInvoiceValueById(salesOrderId: number, tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const [order] = await database
      .select({ invoice_value: sales_orders.invoice_value })
      .from(sales_orders)
      .where(eq(sales_orders.id, salesOrderId));
    if (!order)
      throw new AppError(`Sales order ${salesOrderId} not found`, 404);
    return order.invoice_value;
  },

  updateInvoiceValue(total: number, sales_order_id: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .update(sales_orders)
      .set({ invoice_value: total, balance_due: total })
      .where(eq(sales_orders.id, sales_order_id));
  },

  updatePaidAndBalanceDue(
    salesOrderId: number,
    data: { paid_amount: number; balance_due: number },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    return database
      .update(sales_orders)
      .set({
        paid_amount: data.paid_amount,
        balance_due: data.balance_due,
      })
      .where(eq(sales_orders.id, salesOrderId));
  },

  updateInvoiceMeta(
    salesOrderId: number,
    data: { invoiceValue: number; discount: number; balanceDue: number },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    return database
      .update(sales_orders)
      .set({
        invoice_value: data.invoiceValue,
        invoice_discount: data.discount,
        balance_due: data.balanceDue,
      })
      .where(eq(sales_orders.id, salesOrderId));
  },

  async getLatestSoldItemsByClient(clientId: number, namePrefix: string) {
    const normalizedPrefix = namePrefix.trim();
    if (!normalizedPrefix) return [];

    const rows = await db
      .select({
        name: stocks.name,
        price: sales_order_lines.price,
        sold_at: sales_orders.invoice_date,
      })
      .from(sales_order_lines)
      .innerJoin(
        sales_orders,
        eq(sales_order_lines.sales_order_id, sales_orders.id),
      )
      .innerJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
      .where(
        and(
          eq(sales_orders.client_id, clientId),
          ilike(stocks.name, `${normalizedPrefix}%`),
        ),
      )
      .orderBy(asc(stocks.name), desc(sales_orders.invoice_date));

    const latestByName = new Map<
      string,
      { name: string; price: number; sold_at: Date }
    >();

    for (const row of rows) {
      if (!latestByName.has(row.name)) {
        latestByName.set(row.name, row);
      }
    }

    return Array.from(latestByName.values()).map((item) => ({
      name: item.name,
      price: item.price,
      sold_at: item.sold_at.toISOString(),
    }));
  },

  async checkInvoiceExistence(invoiceNumber: string) {
    const [order] = await db
      .select({ id: sales_orders.id })
      .from(sales_orders)
      .where(eq(sales_orders.invoice_number, invoiceNumber))
      .limit(1);

    return !!order;
  },

  deleteBySalesOrderId(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database.delete(sales_orders).where(eq(sales_orders.id, salesOrderId));
  },
};
