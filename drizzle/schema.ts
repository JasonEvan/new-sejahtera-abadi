import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --- Roles Table ---
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// --- Permissions Table ---
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  display_name: varchar("display_name", { length: 255 }).default("").notNull(),
  module: varchar("module", { length: 100 }).default("").notNull(),
});

// --- Role Permissions (Many-to-Many Join Table) ---
export const role_permissions = pgTable(
  "role_permissions",
  {
    role_id: integer("role_id")
      .notNull()
      .references(() => roles.id),
    permission_id: integer("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => [primaryKey({ columns: [table.role_id, table.permission_id] })],
);

// --- Users Table ---
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role_id: integer("role_id").references(() => roles.id),
  },
  (table) => [index("idx_users_role_id").on(table.role_id)],
);

// --- Trusted Devices Table ---
export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
    deviceToken: varchar("device_token", { length: 255 }).notNull().unique(),
    deviceLabel: varchar("device_label", { length: 255 }), // e.g. "Chrome · Windows"
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_trusted_devices_user_id").on(table.userId),
    index("idx_trusted_devices_fingerprint").on(table.deviceFingerprint),
    index("idx_trusted_devices_token").on(table.deviceToken),
  ],
);

// --- Login Requests Table ---
export const loginRequests = pgTable(
  "login_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceFingerprint: varchar("device_fingerprint", { length: 255 }).notNull(),
    deviceLabel: varchar("device_label", { length: 255 }),
    approvalToken: varchar("approval_token", { length: 255 })
      .notNull()
      .unique(),
    // status values: 'pending' | 'approved' | 'declined' | 'expired'
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(), // set to now() + 1 hour on insert
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_login_requests_user_id").on(table.userId),
    index("idx_login_requests_approval_token").on(table.approvalToken),
    index("idx_login_requests_status").on(table.status),
  ],
);

// --- Relations ---

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
  trustedDevices: many(trustedDevices),
  loginRequests: many(loginRequests),
}));

export const trustedDevicesRelations = relations(trustedDevices, ({ one }) => ({
  user: one(users, {
    fields: [trustedDevices.userId],
    references: [users.id],
  }),
}));

export const loginRequestsRelations = relations(loginRequests, ({ one }) => ({
  user: one(users, {
    fields: [loginRequests.userId],
    references: [users.id],
  }),
}));

// --- Clients Table ---
export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    city: varchar("city", { length: 50 }).notNull().default(""),
    phone: varchar("phone", { length: 20 }),
    mobile_phone: varchar("mobile_phone", { length: 20 }),
    address: varchar("address", { length: 100 }),
    initial_payable_balance: integer("initial_payable_balance")
      .default(0)
      .notNull(),
    initial_receivable_balance: integer("initial_receivable_balance")
      .default(0)
      .notNull(),
    ending_payable_balance: integer("ending_payable_balance")
      .default(0)
      .notNull(),
    ending_receivable_balance: integer("ending_receivable_balance")
      .default(0)
      .notNull(),
  },
  (table) => [unique("unique_name_city").on(table.name, table.city)],
);

// --- Stocks Table ---
export const stocks = pgTable(
  "stocks",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).unique().notNull(),
    initial_stock: integer("initial_stock").notNull(),
    ending_stock: integer("ending_stock").notNull(),
    product_price: integer("product_price").default(0).notNull(),
    qty_in: integer("qty_in").default(0).notNull(),
    qty_out: integer("qty_out").default(0).notNull(),
    selling_price: integer("selling_price"),
    unit: varchar("unit", { length: 10 }).notNull(),
    capital_cost: integer("capital_cost").notNull(),
  },
  (table) => [index("idx_stocks_ending_stock").on(table.ending_stock)],
);

// --- Salespersons table ---
export const salespersons = pgTable("salespersons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  front_number: integer("front_number").notNull(),
  invoice_number: integer("invoice_number").notNull(),
  phone_number: varchar("phone_number", { length: 20 }),
  sales_code: varchar("sales_code", { length: 20 }).notNull(),
});

// --- Company Settings Table ---
export const company_settings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().default("Sejahtera Abadi"),
  address: varchar("address", { length: 500 }).notNull().default(""),
});

// ==========================================
// SALES MODULE
// ==========================================

export const sales_orders = pgTable(
  "sales_orders",
  {
    id: serial("id").primaryKey(),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    invoice_number: varchar("invoice_number", { length: 10 })
      .unique()
      .notNull(),
    invoice_date: timestamp("invoice_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    invoice_value: integer("invoice_value").notNull(),
    invoice_discount: integer("invoice_discount").notNull(),
    paid_amount: integer("paid_amount").notNull(),
    payment_discount: integer("payment_discount").notNull(),
    balance_due: integer("balance_due").notNull(),
  },
  (table) => [
    index("idx_sales_orders_client_id").on(table.client_id),
    index("idx_sales_orders_invoice_date").on(table.invoice_date),
    index("idx_sales_orders_unpaid")
      .on(table.balance_due)
      .where(sql`${table.balance_due} > 0`),
    index("idx_sales_orders_client_balance").on(
      table.client_id,
      table.balance_due,
    ),
  ],
);

export const sales_order_lines = pgTable(
  "sales_order_lines",
  {
    id: serial("id").primaryKey(),
    sales_order_id: integer("sales_order_id")
      .notNull()
      .references(() => sales_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    stock_id: integer("stock_id").references(() => stocks.id),
    type: varchar("type", { length: 2 }).default("J").notNull(),
    price: integer("price").notNull(),
    qty: integer("qty").notNull(),
    total_price: integer("total_price").notNull(),
    salesperson_id: integer("salesperson_id").references(() => salespersons.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_sales_order_lines_sales_order_id").on(table.sales_order_id),
    index("idx_sales_order_lines_stock_id").on(table.stock_id),
  ],
);

export const sales_payments = pgTable(
  "sales_payments",
  {
    id: serial("id").primaryKey(),
    sales_order_id: integer("sales_order_id")
      .notNull()
      .references(() => sales_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    transaction_number: varchar("transaction_number", { length: 10 }).notNull(),
    payment_date: timestamp("payment_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    paid_amount: integer("paid_amount").notNull(),
  },
  (table) => [
    index("idx_sales_payments_order_date").on(
      table.sales_order_id,
      table.payment_date,
    ),
  ],
);

export const sales_returns = pgTable(
  "sales_returns",
  {
    id: serial("id").primaryKey(),
    sales_order_id: integer("sales_order_id")
      .notNull()
      .references(() => sales_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    return_date: timestamp("return_date", { mode: "date", withTimezone: true }),
  },
  (table) => [
    index("idx_sales_returns_order_date").on(
      table.sales_order_id,
      table.return_date,
    ),
  ],
);

export const sales_return_lines = pgTable(
  "sales_return_lines",
  {
    id: serial("id").primaryKey(),
    sales_return_id: integer("sales_return_id")
      .notNull()
      .references(() => sales_returns.id),
    sales_order_line_id: integer("sales_order_line_id")
      .notNull()
      .references(() => sales_order_lines.id),
    type: varchar("type", { length: 3 }).default("JR").notNull(),
    price: integer("price").notNull(),
    qty: integer("qty").notNull(),
    total_price: integer("total_price").notNull(),
  },
  (table) => [
    index("idx_sales_return_lines_sales_return_id").on(table.sales_return_id),
    index("idx_sales_return_lines_sales_order_line_id").on(
      table.sales_order_line_id,
    ),
  ],
);

// ==========================================
// PURCHASE MODULE
// ==========================================

export const purchase_orders = pgTable(
  "purchase_orders",
  {
    id: serial("id").primaryKey(),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    invoice_number: varchar("invoice_number", { length: 10 })
      .unique()
      .notNull(),
    invoice_date: timestamp("invoice_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    invoice_value: integer("invoice_value").notNull(),
    invoice_discount: integer("invoice_discount").notNull(),
    paid_amount: integer("paid_amount").notNull(),
    payment_discount: integer("payment_discount").notNull(),
    balance_due: integer("balance_due").notNull(),
  },
  (table) => [
    index("idx_purchase_orders_client_id").on(table.client_id),
    index("idx_purchase_orders_invoice_date").on(table.invoice_date),
    index("idx_purchase_orders_unpaid")
      .on(table.balance_due)
      .where(sql`${table.balance_due} > 0`),
    index("idx_purchase_orders_unpaid_amount")
      .on(table.paid_amount)
      .where(sql`${table.paid_amount} = 0`),
  ],
);

export const purchase_order_lines = pgTable(
  "purchase_order_lines",
  {
    id: serial("id").primaryKey(),
    purchase_order_id: integer("purchase_order_id")
      .notNull()
      .references(() => purchase_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    stock_id: integer("stock_id").references(() => stocks.id),
    type: varchar("type", { length: 2 }).default("B").notNull(),
    price: integer("price").notNull(),
    qty: integer("qty").notNull(),
    total_price: integer("total_price").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_purchase_order_lines_purchase_order_id").on(
      table.purchase_order_id,
    ),
    index("idx_purchase_order_lines_stock_id").on(table.stock_id),
  ],
);

export const purchase_payments = pgTable(
  "purchase_payments",
  {
    id: serial("id").primaryKey(),
    purchase_order_id: integer("purchase_order_id")
      .notNull()
      .references(() => purchase_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    transaction_number: varchar("transaction_number", { length: 10 }).notNull(),
    payment_date: timestamp("payment_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    paid_amount: integer("paid_amount").notNull(),
  },
  (table) => [
    index("idx_purchase_payments_order_date").on(
      table.purchase_order_id,
      table.payment_date,
    ),
  ],
);

export const purchase_returns = pgTable(
  "purchase_returns",
  {
    id: serial("id").primaryKey(),
    purchase_order_id: integer("purchase_order_id")
      .notNull()
      .references(() => purchase_orders.id),
    client_id: integer("client_id")
      .notNull()
      .references(() => clients.id),
    return_date: timestamp("return_date", { mode: "date", withTimezone: true }),
  },
  (table) => [
    index("idx_purchase_returns_order_date").on(
      table.purchase_order_id,
      table.return_date,
    ),
  ],
);

export const purchase_return_lines = pgTable(
  "purchase_return_lines",
  {
    id: serial("id").primaryKey(),
    purchase_return_id: integer("purchase_return_id")
      .notNull()
      .references(() => purchase_returns.id),
    purchase_order_line_id: integer("purchase_order_line_id")
      .notNull()
      .references(() => purchase_order_lines.id),
    type: varchar("type", { length: 3 }).default("BR").notNull(),
    price: integer("price").notNull(),
    qty: integer("qty").notNull(),
    total_price: integer("total_price").notNull(),
  },
  (table) => [
    index("idx_purchase_return_lines_purchase_return_id").on(
      table.purchase_return_id,
    ),
    index("idx_purchase_return_lines_purchase_order_line_id").on(
      table.purchase_order_line_id,
    ),
  ],
);
