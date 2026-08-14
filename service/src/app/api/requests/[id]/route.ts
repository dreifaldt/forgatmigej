import { NextResponse } from "next/server";
import { advanceAll } from "@/core/service";
import { store } from "@/core/store";
import { toView } from "@/core/view";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = store.get(id);
  if (!found) return NextResponse.json({ error: "Okänd begäran." }, { status: 404 });

  await advanceAll(found);
  return NextResponse.json(toView(found));
}

/** Användaren avbryter. Allt raderas direkt, inte vid någon senare städning. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  store.delete(id);
  return NextResponse.json({ deleted: true });
}
