import { getD1, readBill, routeError } from "@/lib/bills";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      participantId?: unknown;
      txHash?: unknown;
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
        `SELECT status, tx_hash
         FROM participants
         WHERE id = ? AND bill_id = ?
         LIMIT 1`,
      )
      .bind(participantId, id)
      .first<{ status: "pending" | "paid"; tx_hash: string | null }>();

    if (!person) return Response.json({ error: "Participant not found." }, { status: 404 });
    if (person.status === "paid") {
      if (person.tx_hash !== txHash) {
        return Response.json({ error: "This share was already settled." }, { status: 409 });
      }
      return Response.json({ bill: await readBill(id) });
    }

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
    const message = routeError(error);
    const duplicate = message.includes("UNIQUE constraint failed");
    return Response.json(
      { error: duplicate ? "This transaction is already attached to another share." : message },
      { status: duplicate ? 409 : 500 },
    );
  }
}
