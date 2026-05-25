/**
 * Fast-track all delivered/in-escrow orders so the cron releases funds immediately.
 * Usage: npx tsx src/scripts/fast-track-escrow.ts
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
  const snap = await db.collection('orders').where('status', '==', 'delivered').get();

  if (snap.empty) {
    console.log('No delivered orders found.');
    process.exit(0);
  }

  const now = new Date().toISOString();

  for (const doc of snap.docs) {
    const order = doc.data();
    console.log(`Fast-tracking order ${doc.id} — ${order.listingTitle}`);
    console.log(`  escrowReleaseAt was: ${order.escrowReleaseAt}`);
    await doc.ref.update({ escrowReleaseAt: now });
    console.log(`  escrowReleaseAt now: ${now}`);
  }

  console.log(`\nDone. ${snap.size} order(s) fast-tracked. Now trigger the cron to release funds.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
