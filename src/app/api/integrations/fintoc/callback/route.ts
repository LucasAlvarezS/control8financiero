import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireUserId } from "@/lib/session";
import { fintocProvider } from "@/lib/integrations/fintoc/sync";

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { linkToken, institution } = await request.json();

  if (typeof linkToken !== "string") {
    return NextResponse.json({ error: "Falta linkToken" }, { status: 400 });
  }

  const accounts = await fintocProvider.listAccounts({ linkToken });

  const created = [];
  for (const account of accounts) {
    if (institution && account.institution !== institution) continue;

    const financialAccount = await prisma.financialAccount.create({
      data: {
        userId,
        provider: "FINTOC",
        institution: account.institution,
        externalId: account.externalId,
        alias: account.alias,
        currency: account.currency,
        isSavings: account.institution === "BANCO_DE_CHILE",
        status: "ACTIVE",
      },
    });

    await prisma.integrationCredential.create({
      data: {
        financialAccountId: financialAccount.id,
        provider: "FINTOC",
        linkTokenEncrypted: encrypt(linkToken),
      },
    });

    created.push(financialAccount.id);
  }

  return NextResponse.json({ created });
}
