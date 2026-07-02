import type { FintocMovement } from "./client";
import type { NormalizedMovement } from "../provider.interface";

export function mapMovementToNormalized(movement: FintocMovement): NormalizedMovement {
  return {
    externalId: movement.id,
    amount: movement.amount,
    currency: movement.currency,
    description: movement.description,
    merchantRaw: movement.description,
    date: new Date(movement.transaction_date ?? movement.post_date),
    raw: movement,
  };
}
