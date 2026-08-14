import { notFound } from "next/navigation";
import { FlowClient } from "@/components/FlowClient";
import { advanceAll } from "@/core/service";
import { store } from "@/core/store";
import { toView } from "@/core/view";

export const dynamic = "force-dynamic";

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = store.get(id);
  if (!request) notFound();

  await advanceAll(request);
  return <FlowClient initial={toView(request)} />;
}
