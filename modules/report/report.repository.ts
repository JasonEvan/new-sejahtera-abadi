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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const reportRepository = {
  async getDashboardSnapshot(timezone: string = "Asia/Jakarta") {
    /**
     * PERFORMANCE REFACTOR:
     * 1. Pre-calculated all date boundaries in Node.js to enable SARGable queries (index-friendly).
     * 2. Eliminated non-sargable SQL functions (DATE, date_trunc) applied to columns.
     * 3. Pushed date filters down into CTE/UNION ALL branches to prevent full table scans.
     */
    const nowTz = dayjs().tz(timezone);
    const todayStart = nowTz.startOf("day").toISOString();
    const todayEnd = nowTz.endOf("day").toISOString();
    const yesterdayStart = nowTz
      .subtract(1, "day")
      .startOf("day")
      .toISOString();
    const yesterdayEnd = nowTz.subtract(1, "day").endOf("day").toISOString();
    const weekStart = nowTz.startOf("week").toISOString();
    const monthStart = nowTz.startOf("month").toISOString();
    const monthEnd = nowTz.endOf("month").toISOString();
    const prevMonthStart = nowTz
      .subtract(1, "month")
      .startOf("month")
      .toISOString();
    const prevMonthEnd = nowTz
      .subtract(1, "month")
      .endOf("month")
      .toISOString();
    const days7Ago = nowTz.subtract(7, "days").toISOString();
    const days30Ago = nowTz.subtract(30, "days").toISOString();
    const days60Ago = nowTz.subtract(60, "days").toISOString();

    const [
      salesMetricsResult,
      profitMetricsResult,
      clientActivityRaw,
      operationalMiscRaw,
      recentActivityRaw,
      salespersonPerformanceRaw,
    ] = await Promise.all([
      // 1. Consolidated Sales Metrics (SARGable range comparisons)
      db
        .select({
          thisMonthOmzet:
            sql<number>`COALESCE(SUM(${sales_orders.invoice_value}) FILTER (WHERE ${sales_orders.invoice_date} >= ${monthStart} AND ${sales_orders.invoice_date} <= ${monthEnd}), 0)`.mapWith(
              Number,
            ),
          prevMonthOmzet:
            sql<number>`COALESCE(SUM(${sales_orders.invoice_value}) FILTER (WHERE ${sales_orders.invoice_date} >= ${prevMonthStart} AND ${sales_orders.invoice_date} <= ${prevMonthEnd}), 0)`.mapWith(
              Number,
            ),
          openReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0 AND ${sales_orders.invoice_date} >= ${monthStart} AND ${sales_orders.invoice_date} <= ${monthEnd}), 0)`.mapWith(
              Number,
            ),
          todayOpenReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0 AND ${sales_orders.invoice_date} >= ${todayStart} AND ${sales_orders.invoice_date} <= ${todayEnd}), 0)`.mapWith(
              Number,
            ),
          yesterdayOpenReceivables:
            sql<number>`COALESCE(SUM(${sales_orders.balance_due}) FILTER (WHERE ${sales_orders.balance_due} > 0 AND ${sales_orders.invoice_date} >= ${yesterdayStart} AND ${sales_orders.invoice_date} <= ${yesterdayEnd}), 0)`.mapWith(
              Number,
            ),
          salesOrdersToday:
            sql<number>`COUNT(*) FILTER (WHERE ${sales_orders.invoice_date} >= ${todayStart} AND ${sales_orders.invoice_date} <= ${todayEnd})`.mapWith(
              Number,
            ),
          paidInvoicesThisWeek:
            sql<number>`COUNT(*) FILTER (WHERE ${sales_orders.balance_due} <= 0 AND ${sales_orders.invoice_date} >= ${weekStart})`.mapWith(
              Number,
            ),
          pendingReceivables:
            sql<number>`COUNT(*) FILTER (WHERE ${sales_orders.balance_due} > 0)`.mapWith(
              Number,
            ),
        })
        .from(sales_orders)
        .then((res) => res[0]),

      // 2. Consolidated Gross Profit Metrics (SARGable range comparisons)
      db
        .select({
          todayGrossProfit:
            sql<number>`COALESCE(SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}) FILTER (WHERE ${sales_orders.invoice_date} >= ${todayStart} AND ${sales_orders.invoice_date} <= ${todayEnd}), 0)`.mapWith(
              Number,
            ),
          yesterdayGrossProfit:
            sql<number>`COALESCE(SUM((${sales_order_lines.price} - COALESCE(${stocks.product_price}, 0)) * ${sales_order_lines.qty}) FILTER (WHERE ${sales_orders.invoice_date} >= ${yesterdayStart} AND ${sales_orders.invoice_date} <= ${yesterdayEnd}), 0)`.mapWith(
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

      // 3. Client Activity Metrics (Optimized with pushed-down filters)
      db.execute(sql`
        WITH activity AS (
          SELECT client_id, invoice_date FROM ${sales_orders} WHERE invoice_date >= ${days60Ago}
          UNION ALL
          SELECT client_id, invoice_date FROM ${purchase_orders} WHERE invoice_date >= ${days60Ago}
        )
        SELECT
          COUNT(DISTINCT client_id) FILTER (WHERE invoice_date >= ${days30Ago}) AS active_30,
          COUNT(DISTINCT client_id) FILTER (WHERE invoice_date >= ${days60Ago} AND invoice_date < ${days30Ago}) AS active_prev_30
        FROM activity
      `),

      // 4. Other Operational Metrics (Optimized range comparisons)
      db.execute(sql`
        SELECT
          (SELECT COUNT(*) FROM ${purchase_orders} WHERE invoice_date >= ${todayStart} AND invoice_date <= ${todayEnd})::int AS purchase_orders_today,
          (SELECT COUNT(*) FROM ${stocks} WHERE ending_stock <= 5)::int AS low_stock_alerts,
          (
            (SELECT COUNT(*) FROM ${sales_returns} WHERE return_date >= ${monthStart} AND return_date <= ${monthEnd}) +
            (SELECT COUNT(*) FROM ${purchase_returns} WHERE return_date >= ${monthStart} AND return_date <= ${monthEnd})
          )::int AS return_requests_this_month
      `),

      // 5. Recent Activity (SARGable range comparisons)
      db.execute(sql`
        SELECT activity.title, activity.subtitle, activity.occurred_at
        FROM (
          SELECT
            'Sale invoice created' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_orders.invoice_date} AS occurred_at
          FROM ${sales_orders}
          LEFT JOIN ${clients} ON ${sales_orders.client_id} = ${clients.id}
          WHERE ${sales_orders.invoice_date} >= ${days7Ago}

          UNION ALL

          SELECT
            'Purchase invoice created' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_orders.invoice_date} AS occurred_at
          FROM ${purchase_orders}
          LEFT JOIN ${clients} ON ${purchase_orders.client_id} = ${clients.id}
          WHERE ${purchase_orders.invoice_date} >= ${days7Ago}

          UNION ALL

          SELECT
            'Sales payment received' AS title,
            ${sales_orders.invoice_number} || ' - Rp ' || ${sales_payments.paid_amount}::text AS subtitle,
            ${sales_payments.payment_date} AS occurred_at
          FROM ${sales_payments}
          INNER JOIN ${sales_orders} ON ${sales_payments.sales_order_id} = ${sales_orders.id}
          WHERE ${sales_payments.payment_date} >= ${days7Ago}

          UNION ALL

          SELECT
            'Supplier payment made' AS title,
            ${purchase_orders.invoice_number} || ' - Rp ' || ${purchase_payments.paid_amount}::text AS subtitle,
            ${purchase_payments.payment_date} AS occurred_at
          FROM ${purchase_payments}
          INNER JOIN ${purchase_orders} ON ${purchase_payments.purchase_order_id} = ${purchase_orders.id}
          WHERE ${purchase_payments.payment_date} >= ${days7Ago}

          UNION ALL

          SELECT
            'Sales return recorded' AS title,
            ${sales_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Client') AS subtitle,
            ${sales_returns.return_date} AS occurred_at
          FROM ${sales_returns}
          INNER JOIN ${sales_orders} ON ${sales_returns.sales_order_id} = ${sales_orders.id}
          LEFT JOIN ${clients} ON ${sales_returns.client_id} = ${clients.id}
          WHERE ${sales_returns.return_date} >= ${days7Ago}

          UNION ALL

          SELECT
            'Purchase return recorded' AS title,
            ${purchase_orders.invoice_number} || ' - ' || COALESCE(${clients.name}, 'Unknown Supplier') AS subtitle,
            ${purchase_returns.return_date} AS occurred_at
          FROM ${purchase_returns}
          INNER JOIN ${purchase_orders} ON ${purchase_returns.purchase_order_id} = ${purchase_orders.id}
          LEFT JOIN ${clients} ON ${purchase_returns.client_id} = ${clients.id}
          WHERE ${purchase_returns.return_date} >= ${days7Ago}
        ) AS activity
        WHERE activity.occurred_at IS NOT NULL
        ORDER BY activity.occurred_at DESC
        LIMIT 6
      `),
      // 6. Salesperson Performance this month (Optimized range comparisons)
      db.execute(sql`
        SELECT 
          sp.name,
          SUM(sol.total_price)::int as total_revenue
        FROM ${sales_order_lines} sol
        JOIN ${sales_orders} so ON sol.sales_order_id = so.id
        JOIN ${salespersons} sp ON sol.salesperson_id = sp.id
        WHERE so.invoice_date >= ${monthStart} AND so.invoice_date <= ${monthEnd}
        GROUP BY sp.id, sp.name
        ORDER BY total_revenue DESC
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
        thisMonthOmzet: {
          value: salesMetrics.thisMonthOmzet,
          deltaPercentage: toDeltaPercentage(
            salesMetrics.thisMonthOmzet,
            salesMetrics.prevMonthOmzet,
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
        occurredAt: dayjs.tz(activity.occurred_at, timezone).toISOString(),
      })),
      salespersonPerformance: (salespersonPerformanceRaw as any[]).map(
        (sp) => ({
          name: String(sp.name || "Unknown"),
          totalRevenue: Number(sp.total_revenue || 0),
        }),
      ),
    };
  },

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
    // PRE-AGGREGATION: Calculate total balance due per client first to avoid Cartesian products
    const balanceSubquery = db
      .select({
        client_id: purchase_orders.client_id,
        total_balance: sql<number>`SUM(${purchase_orders.balance_due})`.as(
          "total_balance",
        ),
        total_invoice_value:
          sql<number>`SUM(${purchase_orders.invoice_value})`.as(
            "total_invoice_value",
          ),
      })
      .from(purchase_orders)
      .groupBy(purchase_orders.client_id)
      .as("bs");

    // PRE-AGGREGATION: Calculate total paid amount per client first
    const paymentsSubquery = db
      .select({
        client_id: purchase_orders.client_id,
        total_paid: sql<number>`SUM(${purchase_payments.paid_amount})`.as(
          "total_paid",
        ),
      })
      .from(purchase_payments)
      .innerJoin(
        purchase_orders,
        eq(purchase_payments.purchase_order_id, purchase_orders.id),
      )
      .groupBy(purchase_orders.client_id)
      .as("ps");

    // FINAL JOIN: Combining pre-aggregated data with clients metadata
    return db
      .select({
        name: clients.name,
        invoice_value:
          sql<number>`COALESCE(${balanceSubquery.total_invoice_value}, 0)`.mapWith(
            Number,
          ),
        paid_amount:
          sql<number>`COALESCE(${paymentsSubquery.total_paid}, 0)`.mapWith(
            Number,
          ),
        balance_due:
          sql<number>`COALESCE(${balanceSubquery.total_balance}, 0)`.mapWith(
            Number,
          ),
      })
      .from(clients)
      .innerJoin(balanceSubquery, eq(clients.id, balanceSubquery.client_id))
      .leftJoin(paymentsSubquery, eq(clients.id, paymentsSubquery.client_id))
      .orderBy(asc(clients.name));
  },

  getPayablesByClient(clientId: number) {
    return (
      db
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
        // OPTIMIZATION: Grouping by PK reduces load on the sorting engine and is sufficient in PostgreSQL
        .groupBy(purchase_orders.id)
        .orderBy(
          asc(purchase_orders.invoice_date),
          asc(purchase_orders.invoice_number),
        )
    );
  },

  getAllReceivables() {
    // PRE-AGGREGATION: Calculate total balance due per client
    const balanceSubquery = db
      .select({
        client_id: sales_orders.client_id,
        total_balance: sql<number>`SUM(${sales_orders.balance_due})`.as(
          "total_balance",
        ),
        total_invoice_value: sql<number>`SUM(${sales_orders.invoice_value})`.as(
          "total_invoice_value",
        ),
      })
      .from(sales_orders)
      .groupBy(sales_orders.client_id)
      .as("bs");

    // PRE-AGGREGATION: Calculate total paid amount per client
    const paymentsSubquery = db
      .select({
        client_id: sales_orders.client_id,
        total_paid: sql<number>`SUM(${sales_payments.paid_amount})`.as(
          "total_paid",
        ),
      })
      .from(sales_payments)
      .innerJoin(
        sales_orders,
        eq(sales_payments.sales_order_id, sales_orders.id),
      )
      .groupBy(sales_orders.client_id)
      .as("ps");

    // FINAL JOIN: Combining pre-aggregated data with clients metadata
    return db
      .select({
        name: clients.name,
        invoice_value:
          sql<number>`COALESCE(${balanceSubquery.total_invoice_value}, 0)`.mapWith(
            Number,
          ),
        paid_amount:
          sql<number>`COALESCE(${paymentsSubquery.total_paid}, 0)`.mapWith(
            Number,
          ),
        balance_due:
          sql<number>`COALESCE(${balanceSubquery.total_balance}, 0)`.mapWith(
            Number,
          ),
      })
      .from(clients)
      .innerJoin(balanceSubquery, eq(clients.id, balanceSubquery.client_id))
      .leftJoin(paymentsSubquery, eq(clients.id, paymentsSubquery.client_id))
      .orderBy(asc(clients.name));
  },

  getReceivablesByClient(clientId: number) {
    return (
      db
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
        // OPTIMIZATION: Grouping by PK is sufficient and more efficient
        .groupBy(sales_orders.id)
        .orderBy(
          asc(sales_orders.invoice_date),
          asc(sales_orders.invoice_number),
        )
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
      cogs.sales_name, so.invoice_number, so.invoice_date;
    `;

    return db.execute(query);
  },

  async getAssetValues() {
    const assetItems = await db
      .select({
        itemName: stocks.name,
        quantity: stocks.ending_stock,
        capitalCost: stocks.capital_cost,
        totalValue:
          sql<number>`${stocks.ending_stock} * ${stocks.capital_cost}`.mapWith(
            Number,
          ),
      })
      .from(stocks)
      .orderBy(asc(stocks.name));

    const grandTotalAssetValue = assetItems.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    );

    return {
      items: assetItems,
      grandTotalAssetValue,
    };
  },
};
