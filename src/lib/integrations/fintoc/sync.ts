import type {
  CredentialTokens,
  DiscoveredAccount,
  FinancialProvider,
  NormalizedMovement,
} from "../provider.interface";
import { finalizeLinkAndListAccounts, getMovements } from "./client";
import { mapMovementToNormalized } from "./mapper";

const INSTITUTION_BY_FINTOC_ID: Record<string, "BANCO_ESTADO" | "BANCO_DE_CHILE"> = {
  cl_banco_estado: "BANCO_ESTADO",
  cl_banco_de_chile: "BANCO_DE_CHILE",
};

export const fintocProvider: FinancialProvider = {
  provider: "FINTOC",

  async listAccounts(tokens: CredentialTokens): Promise<DiscoveredAccount[]> {
    if (!tokens.linkToken) throw new Error("Falta link token de Fintoc");
    const accounts = await finalizeLinkAndListAccounts(tokens.linkToken);

    return accounts.map((account) => ({
      externalId: account.id,
      alias: account.official_name ?? account.name,
      currency: account.currency,
      institution: INSTITUTION_BY_FINTOC_ID[account.institution.id] ?? "OTHER",
    }));
  },

  async syncMovements(
    tokens: CredentialTokens,
    externalAccountId: string,
    since: Date | null,
  ): Promise<NormalizedMovement[]> {
    if (!tokens.linkToken) throw new Error("Falta link token de Fintoc");
    const movements = await getMovements(tokens.linkToken, externalAccountId, since);
    return movements.map(mapMovementToNormalized);
  },

  // El link token de Fintoc no expira como un OAuth access token; no
  // requiere refresh explícito.
  async refreshTokensIfNeeded(tokens: CredentialTokens): Promise<CredentialTokens> {
    return tokens;
  },
};
