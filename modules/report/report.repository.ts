import {
  clients,
  purchase_order_lines,
  purchase_orders,
  purchase_payments,
  purchase_return_lines,
  purchase_returns,
  sales_order_lines,
  sales_orders,
  sales_payments,
  sales_return_lines,
  sales_returns,
  salespersons,
  stocks,
} from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, max, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

export const reportRepository = {
  async getDashboardSnapshot() {
    const [
      todayRevenue,
      yesterdayRevenue,
      todayGrossProfit,
      yesterdayGrossProfit,
      openReceivables,
      todayOpenReceivables,
      yesterdayOpenReceivables,
      activeClientsLast30Days,
      activeClientsPrevious30Days,
      salesOrdersToday,
      purchaseOrdersToday,
      lowStockAlerts,
      paidInvoicesThisWeek,
      pendingReceivables,
      returnRequestsThisMonth,
      recentActivity,
    ] = await Promise.all([
      db
        .select({
          value: sql<number>`COALESCE(SUM(${sales_orders.invoice_value}), 0)`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_orders)
        .where(sql`DATE(${sales_orders.invoice_date}) = CURRENT_DATE`),

      db
        .select({
          value: sql<number>`COALESCE(SUM(${sales_orders.invoice_value}), 0)`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_orders)
        .where(
          sql`DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'`,
        ),

      db
        .select({
          value: sql<number>`COALESCE(
            SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}),
            0
          )`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_order_lines)
        .innerJoin(
          sales_orders,
          eq(sales_order_lines.sales_order_id, sales_orders.id),
        )
        .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
        .where(sql`DATE(${sales_orders.invoice_date}) = CURRENT_DATE`),

      db
        .select({
          value: sql<number>`COALESCE(
            SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}),
            0
          )`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_order_lines)
        .innerJoin(
          sales_orders,
          eq(sales_order_lines.sales_order_id, sales_orders.id),
        )
        .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
        .where(
          sql`DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'`,
        ),

      db
        .select({
          value: sql<number>`COALESCE(SUM(${sales_orders.balance_due}), 0)`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_orders)
        .where(sql`${sales_orders.balance_due} > 0`),

      db
        .select({
          value: sql<number>`COALESCE(SUM(${sales_orders.balance_due}), 0)`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_orders)
        .where(
          sql`${sales_orders.balance_due} > 0 AND DATE(${sales_orders.invoice_date}) = CURRENT_DATE`,
        ),

      db
        .select({
          value: sql<number>`COALESCE(SUM(${sales_orders.balance_due}), 0)`
            .mapWith(Number)
            .as("value"),
        })
        .from(sales_orders)
        .where(
          sql`${sales_orders.balance_due} > 0 AND DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'`,
        ),

      db.execute(sql`
        SELECT COUNT(DISTINCT activity.client_id)::int AS value
        FROM (
          SELECT ${sales_orders.client_id} AS client_id
          FROM ${sales_orders}
          WHERE ${sales_orders.invoice_date} >= CURRENT_DATE - INTERVAL '30 day'
          UNION ALL
          SELECT ${purchase_orders.client_id} AS client_id
          FROM ${purchase_orders}
          WHERE ${purchase_orders.invoice_date} >= CURRENT_DATE - INTERVAL '30 day'
        ) AS activity
      `),

      db.execute(sql`
        SELECT COUNT(DISTINCT activity.client_id)::int AS value
        FROM (
          SELECT ${sales_orders.client_id} AS client_id
          FROM ${sales_orders}
          WHERE ${sales_orders.invoice_date} >= CURRENT_DATE - INTERVAL '60 day'
            AND ${sales_orders.invoice_date} < CURRENT_DATE - INTERVAL '30 day'
          UNION ALL
          SELECT ${purchase_orders.client_id} AS client_id
          FROM ${purchase_orders}
          WHERE ${purchase_orders.invoice_date} >= CURRENT_DATE - INTERVAL '60 day'
            AND ${purchase_orders.invoice_date} < CURRENT_DATE - INTERVAL '30 day'
        ) AS activity
      `),

      db
        .select({
          value: sql<number>`COUNT(*)::int`.mapWith(Number).as("value"),
        })
        .from(sales_orders)
        .where(sql`DATE(${sales_orders.invoice_date}) = CURRENT_DATE`),

      db
        .select({
          value: sql<number>`COUNT(*)::int`.mapWith(Number).as("value"),
        })
        .from(purchase_orders)
        .where(sql`DATE(${purchase_orders.invoice_date}) = CURRENT_DATE`),

      db
        .select({
          value: sql<number>`COUNT(*)::int`.mapWith(Number).as("value"),
        })
        .from(stocks)
        .where(sql`${stocks.ending_stock} <= 5`),

      db
        .select({
          value: sql<number>`COUNT(*)::int`.mapWith(Number).as("value"),
        })
        .from(sales_orders)
        .where(
          sql`${sales_orders.balance_due} <= 0 AND ${sales_orders.invoice_date} >= date_trunc('week', now())`,
        ),

      db
        .select({
          value: sql<number>`COUNT(*)::int`.mapWith(Number).as("value"),
        })
        .from(sales_orders)
        .where(sql`${sales_orders.balance_due} > 0`),

      db.execute(sql`
        SELECT (
          (SELECT COUNT(*)::int
            FROM ${sales_returns}
            WHERE date_trunc('month', ${sales_returns.return_date}) = date_trunc('month', now())
          ) +
          (SELECT COUNT(*)::int
            FROM ${purchase_returns}
            WHERE date_trunc('month', ${purchase_returns.return_date}) = date_trunc('month', now())
          )
        )::int AS value
      `),

      db.execute(sql`
        SELECT activity.title, activity.subtitle, activity.occurred_at
        FROM (
          SELECT
            'Sale invoice created' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_orders.invoice_date} AS occurred_at
          FROM ${sales_orders}
          LEFT JOIN ${clients} ON ${sales_orders.client_id} = ${clients.id}

          UNION ALL

          SELECT
            'Purchase invoice created' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_orders.invoice_date} AS occurred_at
          FROM ${purchase_orders}
          LEFT JOIN ${clients} ON ${purchase_orders.client_id} = ${clients.id}

          UNION ALL

          SELECT
            'Sales payment received' AS title,
            ${sales_orders.invoice_number} || ' - Rp ' || ${sales_payments.paid_amount}::text AS subtitle,
            ${sales_payments.payment_date} AS occurred_at
          FROM ${sales_payments}
          INNER JOIN ${sales_orders} ON ${sales_payments.sales_order_id} = ${sales_orders.id}

          UNION ALL

          SELECT
            'Supplier payment made' AS title,
            ${purchase_orders.invoice_number} || ' - Rp ' || ${purchase_payments.paid_amount}::text AS subtitle,
            ${purchase_payments.payment_date} AS occurred_at
          FROM ${purchase_payments}
          INNER JOIN ${purchase_orders} ON ${purchase_payments.purchase_order_id} = ${purchase_orders.id}

          UNION ALL

          SELECT
            'Sales return recorded' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_returns.return_date} AS occurred_at
          FROM ${sales_returns}
          INNER JOIN ${sales_orders} ON ${sales_returns.sales_order_id} = ${sales_orders.id}
          LEFT JOIN ${clients} ON ${sales_returns.client_id} = ${clients.id}

          UNION ALL

          SELECT
            'Purchase return recorded' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_returns.return_date} AS occurred_at
          FROM ${purchase_returns}
          INNER JOIN ${purchase_orders} ON ${purchase_returns.purchase_order_id} = ${purchase_orders.id}
          LEFT JOIN ${clients} ON ${purchase_returns.client_id} = ${clients.id}
        ) AS activity
        WHERE activity.occurred_at IS NOT NULL
        ORDER BY activity.occurred_at DESC
        LIMIT 6
      `),
    ]);

    const todayRevenueValue = todayRevenue[0]?.value ?? 0;
    const yesterdayRevenueValue = yesterdayRevenue[0]?.value ?? 0;
    const todayGrossProfitValue = todayGrossProfit[0]?.value ?? 0;
    const yesterdayGrossProfitValue = yesterdayGrossProfit[0]?.value ?? 0;
    const openReceivablesValue = openReceivables[0]?.value ?? 0;
    const todayOpenReceivablesValue = todayOpenReceivables[0]?.value ?? 0;
    const yesterdayOpenReceivablesValue =
      yesterdayOpenReceivables[0]?.value ?? 0;

    const activeLast30Days = Number(activeClientsLast30Days[0]?.value ?? 0);
    const activePrevious30Days = Number(
      activeClientsPrevious30Days[0]?.value ?? 0,
    );
    const thisMonthReturns = Number(returnRequestsThisMonth[0]?.value ?? 0);

    function toDeltaPercentage(current: number, previous: number) {
      if (previous === 0) {
        return current === 0 ? 0 : null;
      }

      return Number((((current - previous) / previous) * 100).toFixed(1));
    }

    return {
      headline: {
        todayRevenue: {
          value: todayRevenueValue,
          deltaPercentage: toDeltaPercentage(
            todayRevenueValue,
            yesterdayRevenueValue,
          ),
        },
        grossProfit: {
          value: todayGrossProfitValue,
          deltaPercentage: toDeltaPercentage(
            todayGrossProfitValue,
            yesterdayGrossProfitValue,
          ),
        },
        openReceivables: {
          value: openReceivablesValue,
          deltaPercentage: toDeltaPercentage(
            todayOpenReceivablesValue,
            yesterdayOpenReceivablesValue,
          ),
        },
        activeClients: {
          value: activeLast30Days,
          deltaPercentage: toDeltaPercentage(
            activeLast30Days,
            activePrevious30Days,
          ),
        },
      },
      operational: {
        salesOrdersToday: salesOrdersToday[0]?.value ?? 0,
        purchaseOrdersToday: purchaseOrdersToday[0]?.value ?? 0,
        lowStockAlerts: lowStockAlerts[0]?.value ?? 0,
        paidInvoicesThisWeek: paidInvoicesThisWeek[0]?.value ?? 0,
        pendingReceivables: pendingReceivables[0]?.value ?? 0,
        returnRequestsThisMonth: thisMonthReturns,
      },
      recentActivity: recentActivity.map((activity) => ({
        title: String(activity.title),
        subtitle: String(activity.subtitle),
        occurredAt: new Date(String(activity.occurred_at)).toISOString(),
      })),
    };
  },

  // getInventoryLedgers(stockId: number) {
  //   const subquerySales = db
  //     .select({
  //       invoice_number: sales_orders.invoice_number,
  //       invoice_date: sales_orders.invoice_date,
  //       name: clients.name,
  //       city: clients.city,
  //       type: sales_order_lines.type,
  //       price: sales_order_lines.price,
  //       qty: sales_order_lines.qty,
  //       return_qty: sales_return_lines.qty,
  //       return_date: sales_returns.return_date,
  //     })
  //     .from(sales_order_lines)
  //     .innerJoin(
  //       sales_orders,
  //       eq(sales_order_lines.sales_order_id, sales_orders.id),
  //     )
  //     .leftJoin(clients, eq(sales_order_lines.client_id, clients.id))
  //     .leftJoin(
  //       sales_return_lines,
  //       eq(sales_order_lines.id, sales_return_lines.sales_order_line_id),
  //     )
  //     .leftJoin(
  //       sales_returns,
  //       eq(sales_return_lines.sales_return_id, sales_returns.id),
  //     )
  //     .where(eq(sales_order_lines.stock_id, stockId));

  //   const subqueryPurchases = db
  //     .select({
  //       invoice_number: purchase_orders.invoice_number,
  //       invoice_date: purchase_orders.invoice_date,
  //       name: clients.name,
  //       city: clients.city,
  //       type: purchase_order_lines.type,
  //       price: purchase_order_lines.price,
  //       qty: purchase_order_lines.qty,
  //       return_qty: purchase_return_lines.qty,
  //       return_date: purchase_returns.return_date,
  //     })
  //     .from(purchase_order_lines)
  //     .innerJoin(
  //       purchase_orders,
  //       eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
  //     )
  //     .leftJoin(clients, eq(purchase_order_lines.client_id, clients.id))
  //     .leftJoin(
  //       purchase_return_lines,
  //       eq(
  //         purchase_order_lines.id,
  //         purchase_return_lines.purchase_order_line_id,
  //       ),
  //     )
  //     .leftJoin(
  //       purchase_returns,
  //       eq(purchase_return_lines.purchase_return_id, purchase_returns.id),
  //     )
  //     .where(eq(purchase_order_lines.stock_id, stockId));

  //   return unionAll(subquerySales, subqueryPurchases).orderBy(
  //     asc(sql`invoice_date`),
  //     asc(sql`invoice_number`),
  //   );
  // },

  getInventoryLedgers(stockId: number) {
    // 1. Ambil murni baris JUAL ("J")
    const qSales = db
      .select({
        invoice_date: sales_orders.invoice_date,
        invoice_number: sales_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        type: sales_order_lines.type,
        price: sales_order_lines.price,
        qty: sql<number>`${sales_order_lines.qty} + COALESCE(
          (SELECT SUM(qty) 
          FROM ${sales_return_lines} 
          WHERE ${sales_return_lines.sales_order_line_id} = ${sales_order_lines.id}
          ), 0
        )`
          .mapWith(Number)
          .as("qty"),
      })
      .from(sales_order_lines)
      .innerJoin(
        sales_orders,
        eq(sales_order_lines.sales_order_id, sales_orders.id),
      )
      .leftJoin(clients, eq(sales_order_lines.client_id, clients.id))
      .where(eq(sales_order_lines.stock_id, stockId));

    // 2. Ambil murni baris RETUR JUAL ("JR")
    const qSalesReturns = db
      .select({
        // PERBAIKAN: Gunakan sales_orders.invoice_date sebagai fallback
        invoice_date:
          sql<Date>`COALESCE(${sales_returns.return_date}, ${sales_orders.invoice_date})`.as(
            "invoice_date",
          ),
        invoice_number: sales_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        type: sales_return_lines.type,
        price: sales_return_lines.price,
        qty: sales_return_lines.qty,
      })
      .from(sales_return_lines)
      .innerJoin(
        sales_returns,
        eq(sales_return_lines.sales_return_id, sales_returns.id),
      )
      .innerJoin(
        sales_order_lines,
        eq(sales_return_lines.sales_order_line_id, sales_order_lines.id),
      )
      .innerJoin(
        sales_orders,
        eq(sales_returns.sales_order_id, sales_orders.id),
      )
      .leftJoin(clients, eq(sales_returns.client_id, clients.id))
      .where(eq(sales_order_lines.stock_id, stockId));

    // 3. Ambil murni baris BELI ("B")
    const qPurchases = db
      .select({
        invoice_date: purchase_orders.invoice_date,
        invoice_number: purchase_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        type: purchase_order_lines.type,
        price: purchase_order_lines.price,
        qty: sql<number>`${purchase_order_lines.qty} + COALESCE(
          (SELECT SUM(qty) 
          FROM ${purchase_return_lines} 
          WHERE ${purchase_return_lines.purchase_order_line_id} = ${purchase_order_lines.id}
          ), 0
        )`
          .mapWith(Number)
          .as("qty"),
      })
      .from(purchase_order_lines)
      .innerJoin(
        purchase_orders,
        eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
      )
      .leftJoin(clients, eq(purchase_order_lines.client_id, clients.id))
      .where(eq(purchase_order_lines.stock_id, stockId));

    // 4. Ambil murni baris RETUR BELI ("BR")
    const qPurchaseReturns = db
      .select({
        // PERBAIKAN: Gunakan purchase_orders.invoice_date sebagai fallback
        invoice_date:
          sql<Date>`COALESCE(${purchase_returns.return_date}, ${purchase_orders.invoice_date})`.as(
            "invoice_date",
          ),
        invoice_number: purchase_orders.invoice_number,
        name: clients.name,
        city: clients.city,
        type: purchase_return_lines.type,
        price: purchase_return_lines.price,
        qty: purchase_return_lines.qty,
      })
      .from(purchase_return_lines)
      .innerJoin(
        purchase_returns,
        eq(purchase_return_lines.purchase_return_id, purchase_returns.id),
      )
      .innerJoin(
        purchase_order_lines,
        eq(
          purchase_return_lines.purchase_order_line_id,
          purchase_order_lines.id,
        ),
      )
      .innerJoin(
        purchase_orders,
        eq(purchase_returns.purchase_order_id, purchase_orders.id),
      )
      .leftJoin(clients, eq(purchase_returns.client_id, clients.id))
      .where(eq(purchase_order_lines.stock_id, stockId));

    // Gabungkan ke-4 nya, urutkan berdasarkan tanggal transaksi
    return unionAll(
      qSales,
      qSalesReturns,
      qPurchases,
      qPurchaseReturns,
    ).orderBy(asc(sql`invoice_date`), asc(sql`invoice_number`));
  },

  getAllPayables() {
    return db
      .select({
        name: clients.name,
        city: clients.city,
        invoice_number: purchase_orders.invoice_number,
        invoice_date: purchase_orders.invoice_date,
        invoice_value: purchase_orders.invoice_value,
        paid_amount:
          sql<number>`COALESCE(SUM(${purchase_payments.paid_amount}), 0)`.mapWith(
            Number,
          ),
        payment_date: max(purchase_payments.payment_date),
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .innerJoin(clients, eq(purchase_orders.client_id, clients.id))
      .leftJoin(
        purchase_payments,
        eq(purchase_orders.id, purchase_payments.purchase_order_id),
      )
      .groupBy(
        clients.name,
        clients.city,
        purchase_orders.invoice_number,
        purchase_orders.invoice_date,
        purchase_orders.invoice_value,
        purchase_orders.balance_due,
      )
      .orderBy(
        asc(purchase_orders.invoice_date),
        asc(purchase_orders.invoice_number),
      );
  },

  getPayablesByClient(clientId: number) {
    return db
      .select({
        invoice_number: purchase_orders.invoice_number,
        invoice_date: purchase_orders.invoice_date,
        invoice_value: purchase_orders.invoice_value,
        paid_amount:
          sql<number>`COALESCE(SUM(${purchase_payments.paid_amount}), 0)`.mapWith(
            Number,
          ),
        payment_date: max(purchase_payments.payment_date),
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .leftJoin(
        purchase_payments,
        eq(purchase_orders.id, purchase_payments.purchase_order_id),
      )
      .where(eq(purchase_orders.client_id, clientId))
      .groupBy(
        purchase_orders.invoice_number,
        purchase_orders.invoice_date,
        purchase_orders.invoice_value,
        purchase_orders.balance_due,
      )
      .orderBy(
        asc(purchase_orders.invoice_date),
        asc(purchase_orders.invoice_number),
      );
  },

  getAllReceivables() {
    return db
      .select({
        name: clients.name,
        city: clients.city,
        invoice_number: sales_orders.invoice_number,
        invoice_date: sales_orders.invoice_date,
        invoice_value: sales_orders.invoice_value,
        paid_amount:
          sql<number>`COALESCE(SUM(${sales_payments.paid_amount}), 0)`.mapWith(
            Number,
          ),
        payment_date: max(sales_payments.payment_date),
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .innerJoin(clients, eq(sales_orders.client_id, clients.id))
      .leftJoin(
        sales_payments,
        eq(sales_orders.id, sales_payments.sales_order_id),
      )
      .groupBy(
        clients.name,
        clients.city,
        sales_orders.invoice_number,
        sales_orders.invoice_date,
        sales_orders.invoice_value,
        sales_orders.balance_due,
      )
      .orderBy(
        asc(sales_orders.invoice_date),
        asc(sales_orders.invoice_number),
      );
  },

  getReceivablesByClient(clientId: number) {
    return db
      .select({
        invoice_number: sales_orders.invoice_number,
        invoice_date: sales_orders.invoice_date,
        invoice_value: sales_orders.invoice_value,
        paid_amount:
          sql<number>`COALESCE(SUM(${sales_payments.paid_amount}), 0)`.mapWith(
            Number,
          ),
        payment_date: max(sales_payments.payment_date),
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .leftJoin(
        sales_payments,
        eq(sales_orders.id, sales_payments.sales_order_id),
      )
      .where(eq(sales_orders.client_id, clientId))
      .groupBy(
        sales_orders.invoice_number,
        sales_orders.invoice_date,
        sales_orders.invoice_value,
        sales_orders.balance_due,
      )
      .orderBy(
        asc(sales_orders.invoice_date),
        asc(sales_orders.invoice_number),
      );
  },

  getProfits(month: number, year: number) {
    const query = sql`
      WITH CostOfGoodsSold AS (
      -- Menghitung total modal (COGS) dan mengambil nama sales per invoice
      SELECT
        sol.sales_order_id,
        SUM(st.product_price * sol.qty) AS total_invoice_modal,
        MAX(sp.name) AS sales_name 
      FROM
        ${sales_order_lines} sol
      LEFT JOIN
        ${stocks} st ON sol.stock_id = st.id
      LEFT JOIN
        ${salespersons} sp ON sol.salesperson_id = sp.id
      GROUP BY
        sol.sales_order_id
    )
    SELECT
      cogs.sales_name,
      so.invoice_number AS invoice_number,
      so.invoice_date AS invoice_date,
      c.name AS client_name,
      c.city AS client_city,
      so.invoice_value AS invoice_value,
      (so.invoice_value - COALESCE(cogs.total_invoice_modal, 0)) AS invoice_profit
    FROM
      ${sales_orders} so
    LEFT JOIN
      CostOfGoodsSold cogs ON so.id = cogs.sales_order_id
    LEFT JOIN
      ${clients} c ON so.client_id = c.id
    WHERE
      EXTRACT(YEAR FROM so.invoice_date) = ${year} 
      AND EXTRACT(MONTH FROM so.invoice_date) = ${month}
      AND cogs.sales_name IS NOT NULL
    ORDER BY
      cogs.sales_name, so.invoice_date;
    `;

    return db.execute(query);
  },
};
