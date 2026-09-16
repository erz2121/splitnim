import { getD1, readBill, routeError } from "@/lib/bills";

type CreatePayload = {
  title?: unknown;
  totalLuna?: unknown;
  recipientAddress?: unknown;
  participants?: unknown;
};

type PersonPayload = { name?: unknown; amountLuna?: unknown };

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function normalizeAddress(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, "");
  if (!/^NQ[0-9A-Z]{34}$/.test(compact)) return null;
  return compact.match(/.{1,4}/g)?.join(" ") || compact;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreatePayload;
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const totalLuna =
      typeof payload.totalLuna === "number" ? Math.round(payload.totalLuna) : NaN;
    const recipientAddress =
      typeof payload.recipientAddress === "string"
        ? normalizeAddress(payload.recipientAddress)
        : null;
    const participants = Array.isArray(payload.participants)
      ? (payload.participants as PersonPayload[])
      : [];

    if (!title || title.length > 60) {
      return Response.json({ error: "Enter a bill name up to 60 characters." }, { status: 400 });
    }
    if (!Number.isSafeInteger(totalLuna) || totalLuna <= 0) {
      return Response.json({ error: "Enter a valid NIM total." }, { status: 400 });
    }
    if (!recipientAddress) {
      return Response.json({ error: "Enter a valid Nimiq address beginning with NQ." }, { status: 400 });
    }
    if (participants.length < 2 || participants.length > 12) {
      return Response.json({ error: "A split needs between 2 and 12 people." }, { status: 400 });
    }

    const cleanParticipants = participants.map((person) => ({
      id: makeId("person"),
      name: typeof person.name === "string" ? person.name.trim() : "",
      amountLuna:
        typeof person.amountLuna === "number" ? Math.round(person.amountLuna) : NaN,
    }));

    if (
      cleanParticipants.some(
        (person) =>
          !person.name ||
          person.name.length > 30 ||
          !Number.isSafeInteger(person.amountLuna) ||
          person.amountLuna <= 0,
      )
    ) {
      return Response.json({ error: "Every person needs a valid name and share." }, { status: 400 });
    }
    if (cleanParticipants.reduce((sum, person) => sum + person.amountLuna, 0) !== totalLuna) {
      return Response.json({ error: "The shares do not match the bill total." }, { status: 400 });
    }

    const id = makeId("split");
    const db = getD1();
    const statements = [
      db
        .prepare(
          `INSERT INTO bills (id, title, total_luna, recipient_address)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, title, totalLuna, recipientAddress),
      ...cleanParticipants.map((person) =>
        db
          .prepare(
            `INSERT INTO participants (id, bill_id, name, amount_luna)
             VALUES (?, ?, ?, ?)`,
          )
          .bind(person.id, id, person.name, person.amountLuna),
      ),
    ];
    await db.batch(statements);

    const bill = await readBill(id);
    return Response.json({ bill }, { status: 201 });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
