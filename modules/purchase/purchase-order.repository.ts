import { Tx } from "@/lib/common-types";
import { InsertPurchase } from "./purchase.types";
import {
  clients,
  purchase_order_lines,
  purchase_orders,
  stocks,
} from "@/drizzle/schema";
import db from "@/lib/drizzle";
import dayjs from "dayjs";
import { and, asc, desc, eq, ilike, like, ne, sql } from "drizzle-orm";
import { AppError } from "@/lib/errors";

type PurchaseOrderPaymentItem = {
  purchase_order_id: number;
  paid_amount: number;
};

function aggregatePurchaseOrderPaymentItems(
  items: PurchaseOrderPaymentItem[],
): PurchaseOrderPaymentItem[] {
  const aggregated = new Map<number, number>();

  for (const item of items) {
    aggregated.set(
      item.purchase_order_id,
      (aggregated.get(item.purchase_order_id) ?? 0) + item.paid_amount,
    );
  }

  return Array.from(aggregated, ([purchase_order_id, paid_amount]) => ({
    purchase_order_id,
    paid_amount,
  }));
}

export const purchaseOrderRepository = {
  insertPurchaseOrder(data: InsertPurchase, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(purchase_orders)
      .values({
        invoice_number: data.invoice_number,
        invoice_date: dayjs(data.invoice_date).toDate(),
        invoice_value: data.total,
        invoice_discount: data.discount,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: data.total,
        client_id: data.client_id,
      })
      .returning({
        id: purchase_orders.id,
      });
  },

  async getById(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    const [order] = await database
      .select({
        id: purchase_orders.id,
        client_id: purchase_orders.client_id,
        invoice_value: purchase_orders.invoice_value,
        paid_amount: purchase_orders.paid_amount,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId));

    return order;
  },

  async getByInvoiceNumber(invoiceNumber: string, tx?: Tx) {
    const database = tx ?? db;

    const [order] = await database
      .select({
        id: purchase_orders.id,
        client_id: purchase_orders.client_id,
        invoice_value: purchase_orders.invoice_value,
        paid_amount: purchase_orders.paid_amount,
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

    return order;
  },

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return db
      .select({
        id: purchase_orders.id,
        invoice_number: purchase_orders.invoice_number,
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .where(
        and(
          eq(purchase_orders.client_id, clientId),
          isPaidOff
            ? eq(purchase_orders.balance_due, 0)
            : ne(purchase_orders.balance_due, 0),
        ),
      );
  },

  bulkIncPaidAmountAndDecBalanceDue(
    items: { purchase_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    const aggregatedItems = aggregatePurchaseOrderPaymentItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map(
        (item) =>
          sql`(${item.purchase_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${purchase_orders} as po
      SET
        paid_amount = po.paid_amount + v.paid_amount,
        balance_due = po.balance_due - v.paid_amount
      FROM (VALUES ${values}) AS v(purchase_order_id, paid_amount)
      WHERE po.id = v.purchase_order_id
    `;

    return database.execute(query);
  },

  bulkDecPaidAmountAndIncBalanceDue(
    items: { purchase_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    const aggregatedItems = aggregatePurchaseOrderPaymentItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map(
        (item) =>
          sql`(${item.purchase_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${purchase_orders} as po
      SET
        paid_amount = po.paid_amount - v.paid_amount,
        balance_due = po.balance_due + v.paid_amount
      FROM (VALUES ${values}) AS v(purchase_order_id, paid_amount)
      WHERE po.id = v.purchase_order_id
    `;

    return database.execute(query);
  },

  getPurchaseInvoices(invoicePrefix: string) {
    return db
      .select({
        invoice_number: purchase_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        invoice_value: purchase_orders.invoice_value,
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .innerJoin(clients, eq(purchase_orders.client_id, clients.id))
      .where(like(purchase_orders.invoice_number, `${invoicePrefix}%`))
      .orderBy(asc(purchase_orders.invoice_number));
  },

  async getPurchaseInvoiceDetail(invoiceNumber: string) {
    const [header] = await db
      .select({
        invoice_number: purchase_orders.invoice_number,
        invoice_date: purchase_orders.invoice_date,
        invoice_value: purchase_orders.invoice_value,
        client_name: clients.name,
        client_city: clients.city,
      })
      .from(purchase_orders)
      .innerJoin(clients, eq(purchase_orders.client_id, clients.id))
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

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
        qty: purchase_order_lines.qty,
        unit: stocks.unit,
        price: purchase_order_lines.price,
        total_price: purchase_order_lines.total_price,
      })
      .from(purchase_order_lines)
      .innerJoin(
        purchase_orders,
        eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
      )
      .leftJoin(stocks, eq(purchase_order_lines.stock_id, stocks.id))
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

    return { header, lines };
  },

  getReturnEligibleOrders(clientId: number) {
    return db
      .select({
        id: purchase_orders.id,
        invoice_number: purchase_orders.invoice_number,
      })
      .from(purchase_orders)
      .where(
        and(
          eq(purchase_orders.client_id, clientId),
          eq(purchase_orders.paid_amount, 0),
        ),
      )
      .orderBy(asc(purchase_orders.invoice_number));
  },

  async getPurchaseReturnLinesWithMeta(invoiceNumber: string) {
    const [order] = await db
      .select({
        invoice_value: purchase_orders.invoice_value,
        invoice_discount: purchase_orders.invoice_discount,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

    if (!order) return null;

    const lines = await db
      .select({
        id: purchase_order_lines.id,
        stock_id: purchase_order_lines.stock_id,
        name: stocks.name,
        price: purchase_order_lines.price,
        qty: purchase_order_lines.qty,
        capital_cost: stocks.capital_cost,
      })
      .from(purchase_order_lines)
      .innerJoin(
        purchase_orders,
        eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
      )
      .leftJoin(stocks, eq(purchase_order_lines.stock_id, stocks.id))
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

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
        capital_cost: l.capital_cost ?? 0,
      })),
    };
  },

  async getDiscountById(purchaseOrderId: number, tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const [order] = await database
      .select({ invoice_discount: purchase_orders.invoice_discount })
      .from(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId));
    if (!order) {
      throw new AppError(`Purchase order ${purchaseOrderId} not found`, 404);
    }
    return order.invoice_discount;
  },

  async getInvoiceValueById(purchaseOrderId: number, tx?: Tx): Promise<number> {
    const database = tx ?? db;
    const [order] = await database
      .select({ invoice_value: purchase_orders.invoice_value })
      .from(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId));
    if (!order) {
      throw new AppError(`Purchase order ${purchaseOrderId} not found`, 404);
    }
    return order.invoice_value;
  },

  updateInvoiceValue(total: number, purchase_order_id: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .update(purchase_orders)
      .set({ invoice_value: total, balance_due: total })
      .where(eq(purchase_orders.id, purchase_order_id));
  },

  updatePaidAndBalanceDue(
    purchaseOrderId: number,
    data: { paid_amount: number; balance_due: number },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    return database
      .update(purchase_orders)
      .set({
        paid_amount: data.paid_amount,
        balance_due: data.balance_due,
      })
      .where(eq(purchase_orders.id, purchaseOrderId));
  },

  updateInvoiceMeta(
    purchaseOrderId: number,
    data: { invoiceValue: number; discount: number; balanceDue: number },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    return database
      .update(purchase_orders)
      .set({
        invoice_value: data.invoiceValue,
        invoice_discount: data.discount,
        balance_due: data.balanceDue,
      })
      .where(eq(purchase_orders.id, purchaseOrderId));
  },

  async getLatestPurchasedItemsByClient(clientId: number, namePrefix: string) {
    const normalizedPrefix = namePrefix.trim();
    if (!normalizedPrefix) return [];

    const rows = await db
      .select({
        name: stocks.name,
        price: purchase_order_lines.price,
        bought_at: purchase_orders.invoice_date,
      })
      .from(purchase_order_lines)
      .innerJoin(
        purchase_orders,
        eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
      )
      .innerJoin(stocks, eq(purchase_order_lines.stock_id, stocks.id))
      .where(
        and(
          eq(purchase_orders.client_id, clientId),
          ilike(stocks.name, `${normalizedPrefix}%`),
        ),
      )
      .orderBy(asc(stocks.name), desc(purchase_orders.invoice_date));

    const latestByName = new Map<
      string,
      { name: string; price: number; bought_at: Date }
    >();

    for (const row of rows) {
      if (!latestByName.has(row.name)) {
        latestByName.set(row.name, row);
      }
    }

    return Array.from(latestByName.values()).map((item) => ({
      name: item.name,
      price: item.price,
      bought_at: item.bought_at.toISOString(),
    }));
  },

  async checkInvoiceExistence(invoiceNumber: string) {
    const [order] = await db
      .select({ id: purchase_orders.id })
      .from(purchase_orders)
      .where(eq(purchase_orders.invoice_number, invoiceNumber))
      .limit(1);

    return !!order;
  },

  deleteByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .delete(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId));
  },
};
