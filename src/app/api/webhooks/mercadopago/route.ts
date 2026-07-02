import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFinancialAccount } from "@/lib/integrations/sync-orchestrator";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const mpUserId = payload.user_id ? String(payload.user_id) : null;

  if (mpUserId) {
    const account = await prisma.financialAccount.findFirst({
      where: { provider: "MERCADOPAGO", externalId: mpUserId, status: "ACTIVE" },
    });
    if (account) {
      await syncFinancialAccount(account.id).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
