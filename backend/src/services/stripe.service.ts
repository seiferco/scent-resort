import Stripe from 'stripe';
import { db } from '../config/firebase';
import { admin } from '../config/firebase';
import { PLATFORM_FEE_PERCENT } from '@scentresort/shared';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export { stripe };

// ── Connect Account Management ──

export async function createConnectAccount(uid: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { firebaseUid: uid },
  });

  await db.collection('users').doc(uid).update({
    stripeAccountId: account.id,
    stripeAccountStatus: 'pending',
    stripeOnboardingComplete: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return account;
}

export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  return stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  });
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: account.requirements,
  };
}

export async function syncAccountStatus(uid: string, accountId: string) {
  const status = await getAccountStatus(accountId);

  let stripeAccountStatus: string;
  if (status.chargesEnabled && status.payoutsEnabled) {
    stripeAccountStatus = 'active';
  } else if (status.requirements?.currently_due?.length) {
    stripeAccountStatus = 'restricted';
  } else {
    stripeAccountStatus = 'pending';
  }

  const onboardingComplete = status.detailsSubmitted ?? false;

  await db.collection('users').doc(uid).update({
    stripeAccountStatus,
    stripeOnboardingComplete: onboardingComplete,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { stripeAccountStatus, stripeOnboardingComplete: onboardingComplete };
}

export async function createDashboardLink(accountId: string) {
  return stripe.accounts.createLoginLink(accountId);
}

// ── Payment ──

export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>
) {
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });

  return { paymentIntent, platformFee };
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  chargeId: string,
  metadata: Record<string, string>
) {
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: destinationAccountId,
    source_transaction: chargeId,
    metadata,
  });
}

export async function createRefund(paymentIntentId: string) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
}

export function constructWebhookEvent(
  body: Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
