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
import { and, asc, eq, gte, lte, max, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { Tx } from "@/lib/common-types";

export const reportRepository = {
  async getDashboardSnapshot() {
    /**
     * REFACTOR NOTE:
     * We have consolidated 16 queries into 5 optimized database calls to prevent connection pool exhaustion.
     * We use PostgreSQL's FILTER (WHERE ...) for conditional aggregations to avoid N+1 horizontal queries.
     * Date boundaries have been added to the UNION ALL activity query to prevent full table scans.
     */

    const [
      salesMetricsResult,
      profitMetricsResult,
      clientActivityRaw,
      operationalMiscRaw,
      recentActivityRaw,
    ] = await Promise.all([
      // 1. Consolidated Sales Metrics (Targeting sales_orders table once)
      db
        .select({
          todayRevenue:
            sql<number>`COALESCE(SUM(${sales_orders.invoice_value}) FILTER (WHERE DATE(${sales_orders.invoice_date}) = CURRENT_DATE), 0)`.mapWith(
              Number,
            ),
          yesterdayRevenue:
            sql<number>`COALESCE(SUM(${sales_orders.invoice_value}) FILTER (WHERE DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'), 0)`.mapWith(
              Number,
            ),
          openReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0), 0)`.mapWith(
              Number,
            ),
          todayOpenReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0 AND DATE(${sales_orders.invoice_date}) = CURRENT_DATE), 0)`.mapWith(
              Number,
            ),
          yesterdayOpenReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0 AND DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'), 0)`.mapWith(
              Number,
            ),
          salesOrdersToday:
            sql<number>`COUNT(*) FILTER (WHERE DATE(${sales_orders.invoice_date}) = CURRENT_DATE)`.mapWith(
              Number,
            ),
          paidInvoicesThisWeek:
            sql<number>`COUNT(*) FILTER (WHERE ${sales_orders.balance_due} <= 0 AND ${sales_orders.invoice_date} >= date_trunc('week', now()))`.mapWith(
              Number,
            ),
          pendingReceivables:
            sql<number>`COUNT(*) FILTER (WHERE ${sales_orders.balance_due} > 0)`.mapWith(
              Number,
            ),
        })
        .from(sales_orders)
        .then((res) => res[0]),

      // 2. Consolidated Gross Profit Metrics (Targeting sales_order_lines join once)
      db
        .select({
          todayGrossProfit:
            sql<number>`COALESCE(SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}) FILTER (WHERE DATE(${sales_orders.invoice_date}) = CURRENT_DATE), 0)`.mapWith(
              Number,
            ),
          yesterdayGrossProfit:
            sql<number>`COALESCE(SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}) FILTER (WHERE DATE(${sales_orders.invoice_date}) = CURRENT_DATE - INTERVAL '1 day'), 0)`.mapWith(
              Number,
            ),
        })
        .from(sales_order_lines)
        .innerJoin(
          sales_orders,
          eq(sales_order_lines.sales_order_id, sales_orders.id),
        )
        .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
        .then((res) => res[0]),

      // 3. Client Activity Metrics (Active last 30 vs previous 30)
      db.execute(sql`
        WITH activity AS (
          SELECT client_id, invoice_date FROM ${sales_orders} 
          UNION ALL
          SELECT client_id, invoice_date FROM ${purchase_orders}
        )
        SELECT
          COUNT(DISTINCT client_id) FILTER (WHERE invoice_date >= CURRENT_DATE - INTERVAL '30 days') AS active_30,
          COUNT(DISTINCT client_id) FILTER (WHERE invoice_date >= CURRENT_DATE - INTERVAL '60 days' AND invoice_date < CURRENT_DATE - INTERVAL '30 days') AS active_prev_30
        FROM activity
      `),

      // 4. Other Operational Metrics
      db.execute(sql`
        SELECT
          (SELECT COUNT(*) FROM ${purchase_orders} WHERE DATE(invoice_date) = CURRENT_DATE)::int AS purchase_orders_today,
          (SELECT COUNT(*) FROM ${stocks} WHERE ending_stock <= 5)::int AS low_stock_alerts,
          (
            (SELECT COUNT(*) FROM ${sales_returns} WHERE date_trunc('month', return_date) = date_trunc('month', now())) +
            (SELECT COUNT(*) FROM ${purchase_returns} WHERE date_trunc('month', return_date) = date_trunc('month', now()))
          )::int AS return_requests_this_month
      `),

      // 5. Recent Activity (Optimized with date boundary to prevent full table scans)
      db.execute(sql`
        SELECT activity.title, activity.subtitle, activity.occurred_at
        FROM (
          SELECT
            'Sale invoice created' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_orders.invoice_date} AS occurred_at
          FROM ${sales_orders}
          LEFT JOIN ${clients} ON ${sales_orders.client_id} = ${clients.id}
          WHERE ${sales_orders.invoice_date} >= CURRENT_DATE - INTERVAL '7 days'

          UNION ALL

          SELECT
            'Purchase invoice created' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_orders.invoice_date} AS occurred_at
          FROM ${purchase_orders}
          LEFT JOIN ${clients} ON ${purchase_orders.client_id} = ${clients.id}
          WHERE ${purchase_orders.invoice_date} >= CURRENT_DATE - INTERVAL '7 days'

          UNION ALL

          SELECT
            'Sales payment received' AS title,
            ${sales_orders.invoice_number} || ' - Rp ' || ${sales_payments.paid_amount}::text AS subtitle,
            ${sales_payments.payment_date} AS occurred_at
          FROM ${sales_payments}
          INNER JOIN ${sales_orders} ON ${sales_payments.sales_order_id} = ${sales_orders.id}
          WHERE ${sales_payments.payment_date} >= CURRENT_DATE - INTERVAL '7 days'

          UNION ALL

          SELECT
            'Supplier payment made' AS title,
            ${purchase_orders.invoice_number} || ' - Rp ' || ${purchase_payments.paid_amount}::text AS subtitle,
            ${purchase_payments.payment_date} AS occurred_at
          FROM ${purchase_payments}
          INNER JOIN ${purchase_orders} ON ${purchase_payments.purchase_order_id} = ${purchase_orders.id}
          WHERE ${purchase_payments.payment_date} >= CURRENT_DATE - INTERVAL '7 days'

          UNION ALL

          SELECT
            'Sales return recorded' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_returns.return_date} AS occurred_at
          FROM ${sales_returns}
          INNER JOIN ${sales_orders} ON ${sales_returns.sales_order_id} = ${sales_orders.id}
          LEFT JOIN ${clients} ON ${sales_returns.client_id} = ${clients.id}
          WHERE ${sales_returns.return_date} >= CURRENT_DATE - INTERVAL '7 days'

          UNION ALL

          SELECT
            'Purchase return recorded' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_returns.return_date} AS occurred_at
          FROM ${purchase_returns}
          INNER JOIN ${purchase_orders} ON ${purchase_returns.purchase_order_id} = ${purchase_orders.id}
          LEFT JOIN ${clients} ON ${purchase_returns.client_id} = ${clients.id}
          WHERE ${purchase_returns.return_date} >= CURRENT_DATE - INTERVAL '7 days'
        ) AS activity
        WHERE activity.occurred_at IS NOT NULL
        ORDER BY activity.occurred_at DESC
        LIMIT 6
      `),
    ]);

    // Data Extraction and Fallbacks
    const salesMetrics = salesMetricsResult!;
    const profitMetrics = profitMetricsResult!;

    const clientMetrics = (clientActivityRaw[0] ?? {}) as {
      active_30: number;
      active_prev_30: number;
    };
    const operationalMisc = (operationalMiscRaw[0] ?? {}) as {
      purchase_orders_today: number;
      low_stock_alerts: number;
      return_requests_this_month: number;
    };

    function toDeltaPercentage(current: number, previous: number) {
      if (previous === 0) return current === 0 ? 0 : null;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    }

    return {
      headline: {
        todayRevenue: {
          value: salesMetrics.todayRevenue,
          deltaPercentage: toDeltaPercentage(
            salesMetrics.todayRevenue,
            salesMetrics.yesterdayRevenue,
          ),
        },
        grossProfit: {
          value: profitMetrics.todayGrossProfit,
          deltaPercentage: toDeltaPercentage(
            profitMetrics.todayGrossProfit,
            profitMetrics.yesterdayGrossProfit,
          ),
        },
        openReceivables: {
          value: salesMetrics.openReceivables,
          deltaPercentage: toDeltaPercentage(
            salesMetrics.todayOpenReceivables,
            salesMetrics.yesterdayOpenReceivables,
          ),
        },
        activeClients: {
          value: Number(clientMetrics.active_30 || 0),
          deltaPercentage: toDeltaPercentage(
            Number(clientMetrics.active_30 || 0),
            Number(clientMetrics.active_prev_30 || 0),
          ),
        },
      },
      operational: {
        salesOrdersToday: salesMetrics.salesOrdersToday,
        purchaseOrdersToday: operationalMisc.purchase_orders_today || 0,
        lowStockAlerts: operationalMisc.low_stock_alerts || 0,
        paidInvoicesThisWeek: salesMetrics.paidInvoicesThisWeek,
        pendingReceivables: salesMetrics.pendingReceivables,
        returnRequestsThisMonth:
          operationalMisc.return_requests_this_month || 0,
      },
      recentActivity: (recentActivityRaw as any[]).map((activity) => ({
        title: String(activity.title || ""),
        subtitle: String(activity.subtitle || ""),
        occurredAt: new Date(
          String(activity.occurred_at || new Date()),
        ).toISOString(),
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

  getInventoryLedgers(
    stockId: number,
    startDate?: Date,
    endDate?: Date,
    tx?: Tx,
  ) {
    const database = tx ?? db;

    // 1. Ambil murni baris JUAL ("J")
    const qSales = database
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
      .where(
        and(
          eq(sales_order_lines.stock_id, stockId),
          startDate ? gte(sales_orders.invoice_date, startDate) : undefined,
          endDate ? lte(sales_orders.invoice_date, endDate) : undefined,
        ),
      );

    // 2. Ambil murni baris RETUR JUAL ("JR")
    const qSalesReturns = database
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
      .where(
        and(
          eq(sales_order_lines.stock_id, stockId),
          startDate ? gte(sales_returns.return_date, startDate) : undefined,
          endDate ? lte(sales_returns.return_date, endDate) : undefined,
        ),
      );

    // 3. Ambil murni baris BELI ("B")
    const qPurchases = database
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
      .where(
        and(
          eq(purchase_order_lines.stock_id, stockId),
          startDate ? gte(purchase_orders.invoice_date, startDate) : undefined,
          endDate ? lte(purchase_orders.invoice_date, endDate) : undefined,
        ),
      );

    // 4. Ambil murni baris RETUR BELI ("BR")
    const qPurchaseReturns = database
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
      .where(
        and(
          eq(purchase_order_lines.stock_id, stockId),
          startDate ? gte(purchase_returns.return_date, startDate) : undefined,
          endDate ? lte(purchase_returns.return_date, endDate) : undefined,
        ),
      );

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

  getProfits(month: number, year: number, timezone: string = "Asia/Jakarta") {
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
      EXTRACT(YEAR FROM so.invoice_date AT TIME ZONE ${timezone}) = ${year} 
      AND EXTRACT(MONTH FROM so.invoice_date AT TIME ZONE ${timezone}) = ${month}
      AND cogs.sales_name IS NOT NULL
    ORDER BY
      cogs.sales_name, so.invoice_date;
    `;

    return db.execute(query);
  },
};
