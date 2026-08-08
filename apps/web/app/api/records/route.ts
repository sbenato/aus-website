import { getSnapshot } from "@/lib/records/service";

// Los saldos cambian cuando un delegado edita: nunca cachear.
export const dynamic = "force-dynamic";

/** Público: valores de los premios, política vigente y ledger. */
export async function GET() {
  const snapshot = await getSnapshot();
  return Response.json(snapshot);
}
