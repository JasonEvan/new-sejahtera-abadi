import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import { clients, sales_order_lines, sales_orders, stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import dayjs from "dayjs";
import { and, asc, eq, like, ne, sql } from "drizzle-orm";

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
    if (items.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      items.map(
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
      })
      .from(sales_orders)
      .innerJoin(clients, eq(sales_orders.client_id, clients.id))
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    if (!header) return { header: null, lines: [] as { name: string | null; qty: number; unit: string | null; price: number; total_price: number }[] };

    const lines = await db
      .select({
        name: stocks.name,
        qty: sales_order_lines.qty,
        unit: stocks.unit,
        price: sales_order_lines.price,
        total_price: sales_order_lines.total_price,
      })
      .from(sales_order_lines)
      .innerJoin(sales_orders, eq(sales_order_lines.sales_order_id, sales_orders.id))
      .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    return { header, lines };
  },
};
