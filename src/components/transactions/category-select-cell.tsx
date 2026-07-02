"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTransactionCategory } from "@/actions/transactions";

interface Option {
  id: string;
  label: string;
}

export function CategorySelectCell({
  transactionId,
  categoryId,
  categories,
}: {
  transactionId: string;
  categoryId: string | null;
  categories: Option[];
}) {
  const [isPending, startTransition] = useTransition();
  const labelById = new Map(categories.map((c) => [c.id, c.label]));

  return (
    <Select
      value={categoryId ?? undefined}
      disabled={isPending}
      onValueChange={(value) => {
        if (typeof value !== "string") return;
        startTransition(async () => {
          await updateTransactionCategory({ transactionId, categoryId: value });
        });
      }}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Sin categoría">
          {(value) => (typeof value === "string" ? labelById.get(value) : undefined)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
