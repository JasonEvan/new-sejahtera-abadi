import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
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
});

const role_permissions = pgTable(
  "role_permissions",
  {
    role_id: integer("role_id").notNull(),
    permission_id: integer("permission_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.role_id, table.permission_id] })],
);

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(sql);

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
      { name: "dashboard.view" },
      { name: "client.view" },
      { name: "client.create" },
      { name: "client.update" },
      { name: "client.delete" },
      { name: "stock.view" },
      { name: "stock.create" },
      { name: "stock.update" },
      { name: "stock.delete" },
      { name: "salesman.view" },
      { name: "salesman.create" },
      { name: "salesman.update" },
      { name: "salesman.delete" },
      { name: "sales.view" },
      { name: "sales.create" },
      { name: "sales.update" },
      { name: "sales.delete" },
      { name: "purchase.view" },
      { name: "purchase.create" },
      { name: "purchase.update" },
      { name: "purchase.delete" },
      { name: "sales.payment.view" },
      { name: "sales.payment.create" },
      { name: "sales.payment.update" },
      { name: "sales.payment.delete" },
      { name: "purchase.payment.view" },
      { name: "purchase.payment.create" },
      { name: "purchase.payment.update" },
      { name: "purchase.payment.delete" },
      { name: "sales.return.view" },
      { name: "sales.return.create" },
      { name: "sales.return.update" },
      { name: "sales.return.delete" },
      { name: "purchase.return.view" },
      { name: "purchase.return.create" },
      { name: "purchase.return.update" },
      { name: "purchase.return.delete" },
      { name: "inventory-ledger.view" },
      { name: "profit-loss.view" },
      { name: "download.backup" },
      { name: "restore.backup" },
      { name: "delete.backup" },
      { name: "user.view" },
      { name: "user.create" },
      { name: "user.update" },
      { name: "user.delete" },
      { name: "role.view" },
      { name: "role.create" },
      { name: "role.update" },
      { name: "role.delete" },
      { name: "permission.view" },
      { name: "permission.update" },
    ];

    await db.insert(permissions).values(permissionList).onConflictDoNothing();

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
          !p.name.startsWith("permission."),
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
