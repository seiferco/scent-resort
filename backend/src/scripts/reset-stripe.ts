/**
 * Reset Stripe account fields for all users so they can re-onboard.
 * Usage: npx tsx src/scripts/reset-stripe.ts
 */
import * as admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!saPath) { console.error('FIREBASE_SERVICE_ACCOUNT_KEY not set'); process.exit(1); }
const cred = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(cred) });
const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('users').where('stripeAccountId', '!=', null).get();

  if (snapshot.empty) {
    console.log('No users with Stripe accounts found.');
    process.exit(0);
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Resetting Stripe for ${data.email} (${doc.id}) — was ${data.stripeAccountId}`);
    await doc.ref.update({
      stripeAccountId: null,
      stripeAccountStatus: 'pending',
      stripeOnboardingComplete: false,
    });
  }

  console.log(`\nReset ${snapshot.size} user(s). They can now re-onboard with Stripe.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
