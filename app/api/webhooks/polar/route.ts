import { NextRequest, NextResponse } from 'next/server';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Map Polar product UUIDs → our plan_tier values
function getPlanTierFromProductId(productId: string): string | null {
  if (productId === process.env.POLAR_PRODUCT_CREATOR) return 'creator';
  if (productId === process.env.POLAR_PRODUCT_STUDIO) return 'studio';
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let event;
  try {
    event = validateEvent(
      body,
      {
        'webhook-id': request.headers.get('webhook-id') || '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
        'webhook-signature': request.headers.get('webhook-signature') || '',
      },
      process.env.POLAR_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[polar-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error('[polar-webhook] processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: any) {
  switch (event.type) {
    case 'subscription.created':
    case 'subscription.active':
    case 'subscription.updated': {
      const sub = event.data;
      const clerkUserId =
        sub?.metadata?.clerk_user_id ||
        sub?.customer?.metadata?.clerk_user_id;
      const productId = sub?.product?.id || sub?.productId || sub?.product_id;
      const planTier = productId ? getPlanTierFromProductId(productId) : null;

      if (!clerkUserId || !planTier) {
        console.warn('[polar-webhook] missing data', {
          eventType: event.type,
          clerkUserId,
          productId,
        });
        return;
      }

      await db
        .update(users)
        .set({ planTier, updatedAt: new Date() })
        .where(eq(users.clerkUserId, clerkUserId));

      console.log(
        `[polar-webhook] ${event.type}: upgraded clerk user ${clerkUserId} → ${planTier}`
      );
      break;
    }

    case 'subscription.revoked': {
      const sub = event.data;
      const clerkUserId =
        sub?.metadata?.clerk_user_id ||
        sub?.customer?.metadata?.clerk_user_id;

      if (!clerkUserId) {
        console.warn('[polar-webhook] revoked event missing clerk_user_id');
        return;
      }

      await db
        .update(users)
        .set({ planTier: 'free', updatedAt: new Date() })
        .where(eq(users.clerkUserId, clerkUserId));

      console.log(
        `[polar-webhook] subscription.revoked: downgraded clerk user ${clerkUserId} → free`
      );
      break;
    }

    case 'subscription.canceled':
      // User clicked cancel — subscription still active until period_end.
      // No DB change yet; we wait for subscription.revoked to drop them to free.
      console.log('[polar-webhook] subscription.canceled (still active until period_end)');
      break;

    default:
      console.log(`[polar-webhook] unhandled event type: ${event.type}`);
  }
}
