import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';

/**
 * Ensures the authenticated Clerk user has a corresponding row in our users table.
 * Returns the DB user row, or null if no authenticated user.
 *
 * Call this from a server component (e.g. app/chat/layout.tsx) on every protected
 * route render to lazily create users on first access. Idempotent — only creates on first call.
 */
export async function syncUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error(`Clerk user ${userId} has no email address`);
  }

  const [newUser] = await db.insert(users).values({
    clerkUserId: userId,
    email,
  }).returning();

  return newUser;
}
