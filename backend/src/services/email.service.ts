import { Resend } from 'resend';
import { auth } from '../config/firebase';
import {
  orderConfirmationEmail,
  orderShippedEmail,
  deliveryConfirmedEmail,
  escrowReleasedEmail,
  disputeOpenedBuyerEmail,
  disputeOpenedSellerEmail,
  refundIssuedEmail,
  staleCancelledBuyerEmail,
  newOfferEmail,
  offerAcceptedEmail,
  offerDeclinedEmail,
} from '../templates/emails';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'ScentResort <onboarding@resend.dev>';

async function getUserEmail(uid: string): Promise<string | null> {
  try {
    const user = await auth.getUser(uid);
    return user.email || null;
  } catch {
    return null;
  }
}

async function send(to: string, email: { subject: string; html: string }) {
  if (!resend) {
    console.log(`[Email] Skipped (no API key): "${email.subject}" → ${to}`);
    return;
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: email.subject,
      html: email.html,
    });
  } catch (err) {
    console.error(`Failed to send email "${email.subject}" to ${to}:`, err);
  }
}

// ── Public send functions (fire-and-forget) ──

export function sendOrderConfirmation(order: { id: string; listingTitle: string; amount: number; buyerId: string; sellerDisplayName: string }) {
  getUserEmail(order.buyerId).then((email) => {
    if (email) send(email, orderConfirmationEmail(order));
  });
}

export function sendShippedNotification(order: { id: string; listingTitle: string; buyerId: string; trackingNumber: string; trackingCarrier: string }) {
  getUserEmail(order.buyerId).then((email) => {
    if (email) send(email, orderShippedEmail(order));
  });
}

export function sendDeliveryConfirmed(order: { id: string; listingTitle: string; sellerId: string; sellerPayout: number }) {
  getUserEmail(order.sellerId).then((email) => {
    if (email) send(email, deliveryConfirmedEmail(order));
  });
}

export function sendEscrowReleased(order: { id: string; listingTitle: string; sellerId: string; sellerPayout: number }) {
  getUserEmail(order.sellerId).then((email) => {
    if (email) send(email, escrowReleasedEmail(order));
  });
}

export function sendDisputeOpened(order: { id: string; listingTitle: string; buyerId: string; sellerId: string; disputeReason: string }) {
  getUserEmail(order.buyerId).then((email) => {
    if (email) send(email, disputeOpenedBuyerEmail(order));
  });
  getUserEmail(order.sellerId).then((email) => {
    if (email) send(email, disputeOpenedSellerEmail(order));
  });
}

export function sendRefundIssued(order: { id: string; listingTitle: string; buyerId: string; amount: number }) {
  getUserEmail(order.buyerId).then((email) => {
    if (email) send(email, refundIssuedEmail(order));
  });
}

export function sendStaleCancelledNotification(order: { id: string; listingTitle: string; buyerId: string; amount: number }) {
  getUserEmail(order.buyerId).then((email) => {
    if (email) send(email, staleCancelledBuyerEmail(order));
  });
}

// ── Offer emails ──

export function sendNewOfferNotification(offer: { listingTitle: string; buyerDisplayName: string; amount: number; sellerId: string }) {
  getUserEmail(offer.sellerId).then((email) => {
    if (email) send(email, newOfferEmail(offer));
  });
}

export function sendOfferAccepted(offer: { listingTitle: string; listingId: string; amount: number; buyerId: string }) {
  getUserEmail(offer.buyerId).then((email) => {
    if (email) send(email, offerAcceptedEmail(offer));
  });
}

export function sendOfferDeclined(offer: { listingTitle: string; buyerId: string }) {
  getUserEmail(offer.buyerId).then((email) => {
    if (email) send(email, offerDeclinedEmail(offer));
  });
}
