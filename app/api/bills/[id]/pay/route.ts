import { getD1, readBill, routeError } from "@/lib/bills";
import { TransactionPendingError, verifyNimiqTransaction } from "@/lib/nimiq-verification";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      participantId?: unknown;
      txHash?: unknown;
      network?: unknown;
    };
    const participantId =
      typeof payload.participantId === "string" ? payload.participantId : "";
    const txHash =
      typeof payload.txHash === "string" ? payload.txHash.toLowerCase() : "";

    if (!/^split_[a-f0-9]{12}$/.test(id) || !/^person_[a-f0-9]{12}$/.test(participantId)) {
      return Response.json({ error: "Invalid payment link." }, { status: 400 });
    }
    if (!/^[a-f0-9]{64}$/.test(txHash)) {
      return Response.json({ error: "The wallet returned an invalid transaction hash." }, { status: 400 });
    }

    const db = getD1();
    const person = await db
      .prepare(
        `SELECT p.status, p.tx_hash, p.amount_luna, b.recipient_address
         FROM participants p
         JOIN bills b ON b.id = p.bill_id
         WHERE p.id = ? AND p.bill_id = ?
         LIMIT 1`,
      )
      .bind(participantId, id)
      .first<{
        status: "pending" | "paid";
        tx_hash: string | null;
        amount_luna: number;
        recipient_address: string;
      }>();

    if (!person) return Response.json({ error: "Participant not found." }, { status: 404 });
    if (person.status === "paid") {
      if (person.tx_hash !== txHash) {
        return Response.json({ error: "This share was already settled." }, { status: 409 });
      }
      return Response.json({ bill: await readBill(id) });
    }

    await verifyNimiqTransaction({
      txHash,
      recipientAddress: person.recipient_address,
      amountLuna: person.amount_luna,
      memo: `SplitNIM:${id}:${participantId}`,
      networkHint: payload.network,
    });

    await db
      .prepare(
        `UPDATE participants
         SET status = 'paid', tx_hash = ?, paid_at = CURRENT_TIMESTAMP
         WHERE id = ? AND bill_id = ? AND status = 'pending'`,
      )
      .bind(txHash, participantId, id)
      .run();

    return Response.json({ bill: await readBill(id) });
  } catch (error) {
    if (error instanceof TransactionPendingError) {
      return Response.json({ error: error.message, pending: true }, { status: 202 });
    }
    const message = routeError(error);
    const duplicate = message.includes("UNIQUE constraint failed");
    return Response.json(
      { error: duplicate ? "This transaction is already attached to another share." : message },
      { status: duplicate ? 409 : 500 },
    );
  }
}
