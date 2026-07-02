"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/actions/categories";

export function AddCategoryForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      action={(formData) => {
        startTransition(async () => {
          await createCategory({ name: String(formData.get("name")) });
        });
      }}
    >
      <Input name="name" placeholder="Nueva categoría" required className="w-56" />
      <Button type="submit" disabled={isPending} size="sm">
        Agregar
      </Button>
    </form>
  );
}
