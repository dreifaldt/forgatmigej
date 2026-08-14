import { NextResponse } from "next/server";
import { advanceAll, applyAnswers } from "@/core/service";
import { store } from "@/core/store";
import { toView } from "@/core/view";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = store.get(id);
  if (!found) return NextResponse.json({ error: "Okänd begäran." }, { status: 404 });

  const body = (await request.json()) as { answers?: Record<string, string> };
  const { rejected } = applyAnswers(found, body.answers ?? {});

  await advanceAll(found);

  return NextResponse.json({ view: toView(found), rejected });
}
