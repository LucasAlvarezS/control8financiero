import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireUserId } from "@/lib/session";
import { exchangeCodeForToken } from "@/lib/integrations/mercadopago/client";
import { mercadoPagoProvider } from "@/lib/integrations/mercadopago/sync";

export async function GET(request: NextRequest) {
  const userId = await requireUserId();

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mp_oauth_state")?.value;
  cookieStore.delete("mp_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/accounts/new?error=mercadopago_state", request.nextUrl.origin),
    );
  }

  const tokenResponse = await exchangeCodeForToken(code);
  const tokens = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
    scopes: tokenResponse.scope,
  };

  const [account] = await mercadoPagoProvider.listAccounts(tokens);

  const financialAccount = await prisma.financialAccount.create({
    data: {
      userId,
      provider: "MERCADOPAGO",
      institution: "MERCADOPAGO",
      externalId: account.externalId,
      alias: account.alias,
      currency: account.currency,
      status: "ACTIVE",
    },
  });

  await prisma.integrationCredential.create({
    data: {
      financialAccountId: financialAccount.id,
      provider: "MERCADOPAGO",
      accessTokenEncrypted: encrypt(tokens.accessToken),
      refreshTokenEncrypted: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
    },
  });

  return NextResponse.redirect(new URL("/accounts", request.nextUrl.origin));
}
