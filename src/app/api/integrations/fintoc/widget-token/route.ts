import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { createWidgetToken } from "@/lib/integrations/fintoc/client";

export async function POST(request: NextRequest) {
  await requireUserId();
  const body = await request.json();

  const { widgetToken } = await createWidgetToken({
    country: "cl",
    product: "movements",
  });

  return NextResponse.json({ widgetToken, institution: body.institution });
}
