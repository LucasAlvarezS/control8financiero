import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFinancialAccount } from "@/lib/integrations/sync-orchestrator";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const accountId: string | undefined =
    payload?.data?.object?.account_id ?? payload?.data?.object?.id;

  if (accountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { provider: "FINTOC", externalId: accountId, status: "ACTIVE" },
    });
    if (account) {
      await syncFinancialAccount(account.id).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
