import { readBill, routeError } from "@/lib/bills";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^split_[a-f0-9]{12}$/.test(id)) {
      return Response.json({ error: "Invalid split link." }, { status: 400 });
    }
    const bill = await readBill(id);
    if (!bill) return Response.json({ error: "This split was not found." }, { status: 404 });
    return Response.json({ bill });
  } catch (error) {
    return Response.json({ error: routeError(error) }, { status: 500 });
  }
}
