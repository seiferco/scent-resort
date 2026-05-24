// Branded HTML email templates for ScentResort transactional emails

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E4E2DD;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #C8C5BF;">
    <div style="padding:24px 32px;border-bottom:1px solid #C8C5BF;">
      <span style="font-size:14px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1E1E1E;">SCENTRESORT</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1E1E1E;">${title}</h1>
      ${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #C8C5BF;text-align:center;">
      <span style="font-size:11px;color:#6E6E6E;letter-spacing:0.1em;text-transform:uppercase;">ScentResort &mdash; Authentic Luxury Fragrances</span>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1E1E1E;color:#E4E2DD;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">${text}</a>`;
}

function orderInfo(order: { listingTitle: string; amount: number; id: string }): string {
  return `<div style="margin:16px 0;padding:16px;border:1px solid #C8C5BF;">
    <p style="margin:0;font-size:14px;font-weight:600;color:#1E1E1E;">${order.listingTitle}</p>
    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1E1E1E;">${formatCents(order.amount)}</p>
  </div>`;
}

// ── Template exports ──

export function orderConfirmationEmail(order: { id: string; listingTitle: string; amount: number; sellerDisplayName: string }) {
  return {
    subject: `Order Confirmed — ${order.listingTitle}`,
    html: layout('Your order is confirmed!', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">Your payment has been received. The seller <strong>${order.sellerDisplayName}</strong> has been notified and will ship your fragrance soon.</p>
      ${orderInfo(order)}
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function orderShippedEmail(order: { id: string; listingTitle: string; trackingNumber: string; trackingCarrier: string }) {
  return {
    subject: `Shipped — ${order.listingTitle}`,
    html: layout('Your order has shipped!', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">Your fragrance is on the way.</p>
      <div style="margin:16px 0;padding:16px;border:1px solid #C8C5BF;">
        <p style="margin:0;font-size:12px;font-weight:600;color:#6E6E6E;text-transform:uppercase;letter-spacing:0.1em;">Tracking</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1E1E1E;font-weight:600;">${order.trackingCarrier}: ${order.trackingNumber}</p>
      </div>
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">Once you receive it, confirm delivery in your order page to start the 48-hour review window.</p>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function deliveryConfirmedEmail(order: { id: string; listingTitle: string; sellerPayout: number }) {
  return {
    subject: `Delivery Confirmed — ${order.listingTitle}`,
    html: layout('Delivery has been confirmed', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">The buyer has confirmed receipt of <strong>${order.listingTitle}</strong>. The 48-hour escrow window has begun.</p>
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">If no dispute is opened, your payout of <strong>${formatCents(order.sellerPayout)}</strong> will be released to your account automatically.</p>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function escrowReleasedEmail(order: { id: string; listingTitle: string; sellerPayout: number }) {
  return {
    subject: `Payment Released — ${order.listingTitle}`,
    html: layout('You\'ve been paid!', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">The escrow period has ended and <strong>${formatCents(order.sellerPayout)}</strong> has been transferred to your Stripe account for <strong>${order.listingTitle}</strong>.</p>
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">The funds should appear in your bank account within 2-3 business days.</p>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function disputeOpenedBuyerEmail(order: { id: string; listingTitle: string }) {
  return {
    subject: `Dispute Opened — ${order.listingTitle}`,
    html: layout('Your dispute has been submitted', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">Your dispute for <strong>${order.listingTitle}</strong> has been submitted. Funds are frozen while our team reviews the case.</p>
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">We will review the details and reach a resolution as soon as possible.</p>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function disputeOpenedSellerEmail(order: { id: string; listingTitle: string; disputeReason: string }) {
  return {
    subject: `Dispute Filed — ${order.listingTitle}`,
    html: layout('A dispute has been opened on your sale', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">The buyer has opened a dispute for <strong>${order.listingTitle}</strong>. Your payout is on hold while our team reviews the case.</p>
      <div style="margin:16px 0;padding:16px;border:1px solid #C8C5BF;">
        <p style="margin:0;font-size:12px;font-weight:600;color:#6E6E6E;text-transform:uppercase;letter-spacing:0.1em;">Reason</p>
        <p style="margin:4px 0 0;font-size:14px;color:#1E1E1E;">${order.disputeReason}</p>
      </div>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function refundIssuedEmail(order: { id: string; listingTitle: string; amount: number }) {
  return {
    subject: `Refund Issued — ${order.listingTitle}`,
    html: layout('Your refund has been processed', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">A refund of <strong>${formatCents(order.amount)}</strong> has been issued for <strong>${order.listingTitle}</strong>. It should appear in your account within 5-10 business days.</p>
      ${button('View Order', `${FRONTEND_URL}/orders/${order.id}`)}
    `),
  };
}

export function staleCancelledBuyerEmail(order: { id: string; listingTitle: string; amount: number }) {
  return {
    subject: `Order Auto-Cancelled — ${order.listingTitle}`,
    html: layout('Your order has been cancelled', `
      <p style="color:#4A4A4A;font-size:14px;line-height:1.6;">The seller did not ship <strong>${order.listingTitle}</strong> within the required timeframe. Your order has been automatically cancelled and a refund of <strong>${formatCents(order.amount)}</strong> has been issued.</p>
      ${button('Browse Fragrances', `${FRONTEND_URL}/listings`)}
    `),
  };
}
