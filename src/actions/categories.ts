"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const categoryInputSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
});

export async function createCategory(input: z.infer<typeof categoryInputSchema>) {
  const userId = await requireUserId();
  const data = categoryInputSchema.parse(input);

  await prisma.category.create({
    data: { ...data, userId, isDefault: false },
  });

  revalidatePath("/categories");
}

export async function updateCategory(
  categoryId: string,
  input: Partial<z.infer<typeof categoryInputSchema>>,
) {
  const userId = await requireUserId();

  await prisma.category.updateMany({
    where: { id: categoryId, userId, isDefault: false },
    data: input,
  });

  revalidatePath("/categories");
}

export async function deleteCategory(categoryId: string) {
  const userId = await requireUserId();
  await prisma.category.deleteMany({ where: { id: categoryId, userId, isDefault: false } });
  revalidatePath("/categories");
}
