import { NextResponse } from "next/server";
import { advanceAll, confirmUserAction } from "@/core/service";
import { store } from "@/core/store";
import { toView } from "@/core/view";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = store.get(id);
  if (!found) return NextResponse.json({ error: "Okänd begäran." }, { status: 404 });

  const body = (await request.json()) as { providerId?: string };
  if (body.providerId) confirmUserAction(found, body.providerId);

  await advanceAll(found);
  return NextResponse.json(toView(found));
}
