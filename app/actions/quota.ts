'use server';

import { auth } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export type QuotaInfo = {
  allowed: boolean;
  used: number;
  limit: number;
  planTier: string;
  resetsAt: Date;
};

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  creator: 50,
  studio: 200,
};

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/**
 * Returns the current user's quota state. Auto-resets the counter if
 * the previous reset window has expired.
 */
export async function checkGenerationQuota(): Promise<QuotaInfo> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthorized');

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId),
  });
  if (!user) throw new Error('User not synced — open /chat first');

  const now = new Date();
  const resetAt = new Date(user.generationCountResetAt);

  // If the reset window has passed, reset count to 0
  if (now >= resetAt) {
    const nextReset = getNextMonthStart();
    await db.update(users)
      .set({ generationCount: 0, generationCountResetAt: nextReset })
      .where(eq(users.id, user.id));
    const limit = PLAN_LIMITS[user.planTier] ?? PLAN_LIMITS.free;
    return { allowed: true, used: 0, limit, planTier: user.planTier, resetsAt: nextReset };
  }

  const limit = PLAN_LIMITS[user.planTier] ?? PLAN_LIMITS.free;
  return {
    allowed: user.generationCount < limit,
    used: user.generationCount,
    limit,
    planTier: user.planTier,
    resetsAt: resetAt,
  };
}
