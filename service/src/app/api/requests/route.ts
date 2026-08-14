import { NextResponse } from "next/server";
import { getProvider } from "@/core/registry";
import { advanceAll } from "@/core/service";
import { store } from "@/core/store";
import { toView } from "@/core/view";

export async function POST(request: Request) {
  const body = (await request.json()) as { providerIds?: unknown };
  const ids = Array.isArray(body.providerIds) ? body.providerIds.filter((x) => typeof x === "string") : [];
  const known = ids.filter((id) => getProvider(id));

  if (known.length === 0) {
    return NextResponse.json({ error: "Välj minst en känd tjänst." }, { status: 400 });
  }

  const created = store.create(known);
  await advanceAll(created);

  return NextResponse.json(toView(created), { status: 201 });
}
