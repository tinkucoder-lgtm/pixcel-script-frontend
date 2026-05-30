'use server';

import { auth } from '@clerk/nextjs/server';
import { db, users, chats, generations } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Save a generation to the DB after the FastAPI backend has produced an image.
 * Called from /chat after a successful generate-design response.
 *
 * If chatId is omitted, creates a new chat with a title derived from the prompt.
 * Returns { generationId, chatId } so the client tracks which chat to append refinements to.
 */
export async function saveGeneration(input: {
  prompt: string;
  imageUrl: string;
  stylePreset?: string | null;
  referenceBrief?: Record<string, any> | null;
  referenceContent?: Record<string, any> | null;
  cacheHit?: boolean;
  chatId?: string;
}): Promise<{ generationId: string; chatId: string }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized — no Clerk session');
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId),
  });
  if (!dbUser) {
    throw new Error('User not synced to DB — open /chat first so syncUser() runs');
  }

  let chatId = input.chatId;
  if (!chatId) {
    const title = input.prompt.slice(0, 60) + (input.prompt.length > 60 ? '…' : '');
    const [newChat] = await db.insert(chats).values({
      userId: dbUser.id,
      title,
    }).returning();
    chatId = newChat.id;
  }

  const [newGen] = await db.insert(generations).values({
    chatId,
    userId: dbUser.id,
    prompt: input.prompt,
    stylePreset: input.stylePreset ?? null,
    imageUrl: input.imageUrl,
    referenceBrief: input.referenceBrief ?? null,
    referenceContent: input.referenceContent ?? null,
    cacheHit: input.cacheHit ?? false,
  }).returning();

  // Atomic counter bump — `generation_count = generation_count + 1` in a
  // single SQL statement so two concurrent generations from the same user
  // can't race the read-modify-write. Pairs with checkGenerationQuota,
  // which compares this counter to the per-tier monthly limit.
  await db.update(users)
    .set({ generationCount: sql`${users.generationCount} + 1` })
    .where(eq(users.id, dbUser.id));

  return { generationId: newGen.id, chatId };
}
