# ScentResort Beta Setup Guide

This document summarizes all beta-readiness features that were implemented and what you need to do to fully activate each one.

---

## 1. Reviews UI on Order Detail Page

**What it does:** After an order is marked as `completed` (escrow released), buyers see a "Leave a Review" form directly on the order detail page. Reviews are star ratings (1-5) with a written comment. They appear on the seller's public profile page.

**What you need to do:** Nothing — this is fully functional. Reviews are stored in Firestore and displayed on seller profiles at `/users/[id]`.

---

## 2. Legal Pages

**What it does:** Three legal pages were created:
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy
- `/refund-policy` — Refund Policy

All are linked in the site footer under the Community section.

**What you need to do:**
- **Review the content** — The legal text covers your platform's rules, fees (10%), escrow terms, dispute process, data handling, and refund windows. Read through each page and update any details that don't match your intentions.
- **Consider a lawyer** — For a real marketplace handling money, have a lawyer review these before going public. The current content is professional boilerplate but not legal advice.

---

## 3. Rate Limiting

**What it does:** Prevents abuse by limiting API requests per IP address:
- **Global:** 300 requests per 15 minutes
- **Auth endpoints** (login, register): 10 requests per 15 minutes
- **Write endpoints** (listings, reviews, messages, uploads): 30 requests per 15 minutes
- Stripe webhooks and cron are excluded (they have their own authentication)

**What you need to do:** Nothing — this is fully functional. If you find legitimate users being rate limited, you can adjust the `max` values in `backend/src/app.ts`.

---

## 4. Transactional Emails (Resend)

**What it does:** Sends branded HTML emails at every order lifecycle event:
- **Order confirmed** — Sent to buyer when payment succeeds
- **Order shipped** — Sent to buyer with tracking info
- **Delivery confirmed** — Sent to seller when buyer confirms receipt
- **Escrow released** — Sent to seller when payout is transferred
- **Dispute opened** — Sent to both buyer and seller
- **Refund issued** — Sent to buyer on cancellation
- **Stale order cancelled** — Sent to buyer if seller doesn't ship within 5 days

If `RESEND_API_KEY` is not set, emails are silently skipped (logged to console instead).

**What you need to do:**

1. **Create a Resend account** at https://resend.com (free tier: 100 emails/day, 3,000/month)

2. **Add and verify your domain** in Resend dashboard:
   - Go to Resend Dashboard → Domains → Add Domain
   - Enter `scentresort.com` (or your domain)
   - Add the DNS records Resend provides:
     - **SPF record** (TXT) — Authorizes Resend to send email on your behalf
     - **DKIM record** (CNAME) — Cryptographic signature proving emails are authentic
     - **DMARC record** (TXT) — Tells email providers what to do with unauthenticated emails
   - Wait for verification (usually 5-30 minutes)

3. **Set environment variables** on your backend deployment:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=ScentResort <orders@scentresort.com>
   ```

4. **This also fixes your spam problem** — Once you verify your domain with Resend and set up SPF/DKIM/DMARC records, you can also configure Firebase Auth to use your custom domain for password reset and verification emails:
   - Go to Firebase Console → Authentication → Templates → SMTP Settings
   - Use Resend's SMTP credentials: `smtp.resend.com`, port 465 (SSL)
   - Username: `resend`
   - Password: your Resend API key
   - Set "Sender email" to `noreply@scentresort.com`
   - This ensures password reset emails come from your verified domain instead of `firebaseapp.com`, so they won't land in spam/junk

---

## 5. Email Verification Enforcement

**What it does:**
- Sends a verification email automatically when a user signs up with email/password (Google OAuth users are auto-verified)
- Shows a dismissible banner at the top of every page for unverified users with a "Resend email" button
- Blocks unverified users from: creating listings, purchasing fragrances, and leaving reviews
- Returns a clear error: "Please verify your email address before performing this action"

**What you need to do:** Nothing — this is fully functional. The verification emails are sent through Firebase Auth using their default `firebaseapp.com` domain. To avoid spam filters, set up Firebase SMTP with your custom domain (see Task 4 above).

---

## 6. Cron Jobs (Escrow Processing)

**What it does:** A Next.js API route at `/api/cron/process-escrow` proxies to the backend's escrow cron endpoint. Vercel Cron calls it every 15 minutes. The cron handles:
- **Escrow releases** — Transfers funds to sellers 48 hours after delivery confirmation
- **Auto-delivery** — Marks orders as delivered if buyer doesn't confirm within 7 days of shipment
- **Stale order cancellation** — Refunds buyers if seller doesn't ship within 5 days

**What you need to do:**

1. **Set environment variables** on your Vercel frontend project:
   ```
   CRON_SECRET=2d244eb25628a144f6d2cf7d1390dc2c17ad752a9e8999be8328a1b2a89defb1
   BACKEND_URL=https://scent-resort-backend.vercel.app
   ```
   (Use the same `CRON_SECRET` value as your backend)

2. **Deploy the frontend** — Vercel will automatically detect the `crons` config in `frontend/vercel.json` and set up the scheduled job.

3. **Verify it works** — After deploying, go to Vercel Dashboard → Your Project → Cron Jobs to see the schedule and execution logs.

---

## 7. Stripe Webhook Configuration

**What it does:** The backend handles Stripe webhook events at `POST /api/v1/webhooks/stripe`:
- `payment_intent.succeeded` — Confirms payment, marks order as paid, sends confirmation email
- `payment_intent.payment_failed` — Cancels order, restores listing
- `account.updated` — Syncs seller Stripe Connect account status

The webhook secret is read from the `STRIPE_WEBHOOK_SECRET` environment variable.

**What you need to do:**

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. Set the endpoint URL to: `https://scent-resort-backend.vercel.app/api/v1/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. After creating, copy the **Signing secret** (starts with `whsec_`)
6. Set it as `STRIPE_WEBHOOK_SECRET` in your backend environment variables
7. **Test it** — Use Stripe CLI: `stripe listen --forward-to localhost:3004/api/v1/webhooks/stripe` for local testing

**Note:** You currently have a webhook secret configured for development. You'll need a separate one for production.

---

## 8. Error Monitoring (Sentry)

**What it does:** Captures and reports errors from both frontend and backend to a Sentry dashboard. This gives you real-time alerts, stack traces, and context when something breaks in production.

**What you need to do:**

1. **Create a Sentry account** at https://sentry.io (free tier: 5,000 errors/month)
2. **Create two projects:** one for "Next.js" (frontend) and one for "Node/Express" (backend)
3. **Set environment variables:**
   - Frontend (Vercel): `NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/67890`
   - Backend: `SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/11111`
4. **Deploy** — Sentry will start capturing errors automatically
5. If no DSN is set, Sentry is silently disabled (no impact on the app)

---

## Environment Variables Summary

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | For emails | Resend API key |
| `FROM_EMAIL` | Optional | Sender address (default: `onboarding@resend.dev`) |
| `SENTRY_DSN` | For monitoring | Sentry DSN for backend project |
| `STRIPE_WEBHOOK_SECRET` | For production | Stripe webhook signing secret |
| `CRON_SECRET` | For cron | Shared secret between frontend cron proxy and backend |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `CRON_SECRET` | For cron | Must match backend's CRON_SECRET |
| `BACKEND_URL` | For cron | Backend API base URL |
| `NEXT_PUBLIC_SENTRY_DSN` | For monitoring | Sentry DSN for frontend project |

---

## Custom Email Domain Setup (Fixes Spam/Junk Issue)

Your password reset emails currently go to spam because they're sent from `noreply@scent-resort.firebaseapp.com` — a shared Firebase domain with no email authentication.

**To fix this (one-time setup):**

1. **Buy/have a domain** (e.g., `scentresort.com`)
2. **Verify it with Resend** (see Task 4 above) — this adds SPF, DKIM, and DMARC DNS records
3. **Configure Firebase SMTP:**
   - Firebase Console → Authentication → Templates → SMTP Settings
   - Enable "Use custom SMTP server"
   - Host: `smtp.resend.com`
   - Port: `465` (SSL)
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: `noreply@scentresort.com`
4. **Update the email templates** in Firebase Console → Authentication → Templates to customize the subject lines and body text for password reset, email verification, etc.

After this, ALL emails from ScentResort (transactional + Firebase Auth) will come from your verified domain and will not be flagged as spam.
