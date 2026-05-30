'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { Polar } from '@polar-sh/sdk';
import { redirect } from 'next/navigation';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
});

const PLAN_TO_PRODUCT: Record<string, string | undefined> = {
  creator: process.env.POLAR_PRODUCT_CREATOR,
  studio: process.env.POLAR_PRODUCT_STUDIO,
};

/**
 * Create a Polar checkout session for the given plan and redirect to the hosted payment page.
 * Called from a form on the /pricing page.
 */
export async function createCheckoutSession(formData: FormData) {
  const plan = (formData.get('plan') as string) || '';
  const productId = PLAN_TO_PRODUCT[plan];
  if (!productId) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized — must sign in before subscribing');
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error('No email on Clerk user');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const checkout = await polar.checkouts.create({
    products: [productId],
    customerEmail: email,
    successUrl: `${appUrl}/checkout/success?checkout_id={CHECKOUT_ID}`,
    metadata: {
      clerk_user_id: userId,
      plan_tier: plan,
    },
  });

  redirect(checkout.url);
}
