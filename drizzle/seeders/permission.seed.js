import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql as drizzleSql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Table Definitions ---
const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  display_name: varchar("display_name", { length: 255 }).default("").notNull(),
  module: varchar("module", { length: 100 }).default("").notNull(),
});

const role_permissions = pgTable(
  "role_permissions",
  {
    role_id: integer("role_id").notNull(),
    permission_id: integer("permission_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.role_id, table.permission_id] })],
);

const client = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding permissions...");

  try {
    // 1. Create Roles
    await db
      .insert(roles)
      .values([{ name: "admin" }, { name: "owner" }])
      .onConflictDoNothing();

    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"));
    const [ownerRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "owner"));

    // 2. Create Permissions
    const permissionList = [
      {
        name: "dashboard.view",
        display_name: "Lihat Dashboard",
        module: "dashboard",
      },
      { name: "client.view", display_name: "Lihat Klien", module: "clients" },
      {
        name: "client.create",
        display_name: "Tambah Klien",
        module: "clients",
      },
      {
        name: "client.update",
        display_name: "Edit Klien",
        module: "clients",
      },
      {
        name: "client.delete",
        display_name: "Hapus Klien",
        module: "clients",
      },
      { name: "stock.view", display_name: "Lihat Stok", module: "stocks" },
      { name: "stock.create", display_name: "Tambah Stok", module: "stocks" },
      { name: "stock.update", display_name: "Edit Stok", module: "stocks" },
      { name: "stock.delete", display_name: "Hapus Stok", module: "stocks" },
      {
        name: "salesman.view",
        display_name: "Lihat Sales",
        module: "salespersons",
      },
      {
        name: "salesman.create",
        display_name: "Tambah Sales",
        module: "salespersons",
      },
      {
        name: "salesman.update",
        display_name: "Edit Sales",
        module: "salespersons",
      },
      {
        name: "salesman.delete",
        display_name: "Hapus Sales",
        module: "salespersons",
      },
      { name: "sales.view", display_name: "Lihat Penjualan", module: "sales" },
      {
        name: "sales.create",
        display_name: "Tambah Penjualan",
        module: "sales",
      },
      { name: "sales.update", display_name: "Edit Penjualan", module: "sales" },
      {
        name: "sales.delete",
        display_name: "Hapus Penjualan",
        module: "sales",
      },
      {
        name: "purchase.view",
        display_name: "Lihat Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.create",
        display_name: "Tambah Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.update",
        display_name: "Edit Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.delete",
        display_name: "Hapus Pembelian",
        module: "purchase",
      },
      {
        name: "sales.payment.view",
        display_name: "Lihat Pembayaran Penjualan",
        module: "sales",
      },
      {
        name: "sales.payment.create",
        display_name: "Tambah Pembayaran Penjualan",
        module: "sales",
      },
      {
        name: "sales.payment.update",
        display_name: "Edit Pembayaran Penjualan",
        module: "sales",
      },
      {
        name: "sales.payment.delete",
        display_name: "Hapus Pembayaran Penjualan",
        module: "sales",
      },
      {
        name: "purchase.payment.view",
        display_name: "Lihat Pembayaran Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.payment.create",
        display_name: "Tambah Pembayaran Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.payment.update",
        display_name: "Edit Pembayaran Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.payment.delete",
        display_name: "Hapus Pembayaran Pembelian",
        module: "purchase",
      },
      {
        name: "sales.return.view",
        display_name: "Lihat Retur Penjualan",
        module: "sales",
      },
      {
        name: "sales.return.create",
        display_name: "Tambah Retur Penjualan",
        module: "sales",
      },
      {
        name: "sales.return.update",
        display_name: "Edit Retur Penjualan",
        module: "sales",
      },
      {
        name: "sales.return.delete",
        display_name: "Hapus Retur Penjualan",
        module: "sales",
      },
      {
        name: "purchase.return.view",
        display_name: "Lihat Retur Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.return.create",
        display_name: "Tambah Retur Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.return.update",
        display_name: "Edit Retur Pembelian",
        module: "purchase",
      },
      {
        name: "purchase.return.delete",
        display_name: "Hapus Retur Pembelian",
        module: "purchase",
      },
      {
        name: "inventory-ledger.view",
        display_name: "Lihat Buku Besar Persediaan",
        module: "reports",
      },
      {
        name: "profit-loss.view",
        display_name: "Lihat Laba Rugi",
        module: "reports",
      },
      {
        name: "download.backup",
        display_name: "Unduh Cadangan",
        module: "settings",
      },
      {
        name: "restore.backup",
        display_name: "Pulihkan Cadangan",
        module: "settings",
      },
      {
        name: "delete.backup",
        display_name: "Hapus Cadangan",
        module: "settings",
      },
      {
        name: "system.cutoff",
        display_name: "Tutup Buku",
        module: "settings",
      },
      { name: "user.view", display_name: "Lihat Pengguna", module: "settings" },
      {
        name: "user.create",
        display_name: "Tambah Pengguna",
        module: "settings",
      },
      {
        name: "user.update",
        display_name: "Edit Pengguna",
        module: "settings",
      },
      {
        name: "user.delete",
        display_name: "Hapus Pengguna",
        module: "settings",
      },
      { name: "role.view", display_name: "Lihat Peran", module: "settings" },
      { name: "role.create", display_name: "Tambah Peran", module: "settings" },
      { name: "role.update", display_name: "Edit Peran", module: "settings" },
      { name: "role.delete", display_name: "Hapus Peran", module: "settings" },
      {
        name: "permission.view",
        display_name: "Lihat Izin",
        module: "settings",
      },
      {
        name: "permission.update",
        display_name: "Edit Izin",
        module: "settings",
      },
      {
        name: "company.view",
        display_name: "Lihat Profil Perusahaan",
        module: "settings",
      },
      {
        name: "company.update",
        display_name: "Edit Profil Perusahaan",
        module: "settings",
      },
    ];

    await db
      .insert(permissions)
      .values(permissionList)
      .onConflictDoUpdate({
        target: permissions.name,
        set: {
          display_name: drizzleSql`EXCLUDED.display_name`,
          module: drizzleSql`EXCLUDED.module`,
        },
      });

    const allPerms = await db.select().from(permissions);

    // 3. Assign permissions to owner (ALL)
    if (ownerRole && allPerms.length > 0) {
      await db
        .insert(role_permissions)
        .values(
          allPerms.map((p) => ({
            role_id: ownerRole.id,
            permission_id: p.id,
          })),
        )
        .onConflictDoNothing();
    }

    // 4. Assign permissions to admin (EXCEPT user, role, permission)
    if (adminRole && allPerms.length > 0) {
      const adminPerms = allPerms.filter(
        (p) =>
          !p.name.startsWith("user.") &&
          !p.name.startsWith("role.") &&
          !p.name.startsWith("permission.") &&
          !p.name.startsWith("system."),
      );

      await db
        .insert(role_permissions)
        .values(
          adminPerms.map((p) => ({
            role_id: adminRole.id,
            permission_id: p.id,
          })),
        )
        .onConflictDoNothing();
    }

    console.log("✅ Seeding Permission completed!");
  } catch (error) {
    console.error("❌ Seeding Permission failed:", error);
  }
}

seed();
