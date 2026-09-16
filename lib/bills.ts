import { env } from "cloudflare:workers";

export type StoredParticipant = {
  id: string;
  name: string;
  amountLuna: number;
  status: "pending" | "paid";
  txHash: string | null;
  paidAt: string | null;
};

export type StoredBill = {
  id: string;
  title: string;
  totalLuna: number;
  recipientAddress: string;
  createdAt: string;
  participants: StoredParticipant[];
};

type BillRow = {
  id: string;
  title: string;
  total_luna: number;
  recipient_address: string;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  name: string;
  amount_luna: number;
  status: "pending" | "paid";
  tx_hash: string | null;
  paid_at: string | null;
};

export function getD1() {
  if (!env.DB) throw new Error("SplitNIM storage is temporarily unavailable.");
  return env.DB;
}

export async function readBill(id: string): Promise<StoredBill | null> {
  const db = getD1();
  const bill = await db
    .prepare(
      `SELECT id, title, total_luna, recipient_address, created_at
       FROM bills
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<BillRow>();

  if (!bill) return null;

  const result = await db
    .prepare(
      `SELECT id, name, amount_luna, status, tx_hash, paid_at
       FROM participants
       WHERE bill_id = ?
       ORDER BY rowid ASC`,
    )
    .bind(id)
    .all<ParticipantRow>();

  return {
    id: bill.id,
    title: bill.title,
    totalLuna: bill.total_luna,
    recipientAddress: bill.recipient_address,
    createdAt: bill.created_at,
    participants: result.results.map((person) => ({
      id: person.id,
      name: person.name,
      amountLuna: person.amount_luna,
      status: person.status,
      txHash: person.tx_hash,
      paidAt: person.paid_at,
    })),
  };
}

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message.includes("no such table")) return "SplitNIM is being prepared. Please try again shortly.";
  return message;
}
