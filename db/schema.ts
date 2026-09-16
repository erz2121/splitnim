import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bills = sqliteTable(
  "bills",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    totalLuna: integer("total_luna").notNull(),
    recipientAddress: text("recipient_address").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_bills_created_at").on(table.createdAt)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    billId: text("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amountLuna: integer("amount_luna").notNull(),
    status: text("status", { enum: ["pending", "paid"] }).notNull().default("pending"),
    txHash: text("tx_hash"),
    paidAt: text("paid_at"),
  },
  (table) => [
    index("idx_participants_bill_id").on(table.billId),
    uniqueIndex("idx_participants_tx_hash").on(table.txHash),
  ],
);
