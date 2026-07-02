// Cliente de la API de Fintoc (https://docs.fintoc.com). Los nombres de
// endpoints/campos siguen la documentación pública del producto Movements,
// pero antes de conectar credenciales reales conviene verificarlos contra
// la referencia vigente de Fintoc, ya que es una API de terceros que puede
// cambiar entre versiones.

const FINTOC_API_BASE = "https://api.fintoc.com/v1";

function secretKey(): string {
  const key = process.env.FINTOC_SECRET_KEY;
  if (!key) throw new Error("Falta FINTOC_SECRET_KEY");
  return key;
}

export async function createWidgetToken(params: {
  holderType?: string;
  country?: string;
  product?: "movements";
}): Promise<{ widgetToken: string }> {
  const response = await fetch(`${FINTOC_API_BASE}/widget_token`, {
    method: "POST",
    headers: {
      Authorization: secretKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: params.country ?? "cl",
      product: params.product ?? "movements",
      holder_type: params.holderType ?? "individual",
      public_key: process.env.FINTOC_PUBLIC_KEY,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error creando widget token de Fintoc: ${response.status}`);
  }

  const data = await response.json();
  return { widgetToken: data.widget_token ?? data.token };
}

export interface FintocAccount {
  id: string;
  name: string;
  official_name?: string;
  currency: string;
  institution: { id: string; name: string };
}

export async function finalizeLinkAndListAccounts(linkToken: string): Promise<FintocAccount[]> {
  const response = await fetch(`${FINTOC_API_BASE}/accounts`, {
    headers: {
      Authorization: secretKey(),
      "link-token": linkToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo cuentas de Fintoc: ${response.status}`);
  }

  return response.json();
}

export interface FintocMovement {
  id: string;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  post_date: string;
}

export async function getMovements(
  linkToken: string,
  accountId: string,
  since: Date | null,
): Promise<FintocMovement[]> {
  const url = new URL(`${FINTOC_API_BASE}/accounts/${accountId}/movements`);
  url.searchParams.set("per_page", "300");
  if (since) {
    url.searchParams.set("since", since.toISOString().slice(0, 10));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: secretKey(),
      "link-token": linkToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo movimientos de Fintoc: ${response.status}`);
  }

  return response.json();
}
