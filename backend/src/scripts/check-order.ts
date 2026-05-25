/**
 * Check order status in Firestore.
 * Usage: npx tsx src/scripts/check-order.ts <orderId>
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
  const orderId = process.argv[2];
  if (orderId) {
    const doc = await db.collection('orders').doc(orderId).get();
    console.log(JSON.stringify(doc.data(), null, 2));
  } else {
    // Show all delivered orders
    const snap = await db.collection('orders').where('status', '==', 'delivered').get();
    console.log(`Found ${snap.size} delivered orders:`);
    for (const doc of snap.docs) {
      const d = doc.data();
      console.log(`\n${doc.id}:`);
      console.log(`  status: ${d.status}`);
      console.log(`  escrowReleaseAt: ${d.escrowReleaseAt}`);
      console.log(`  now: ${new Date().toISOString()}`);
      console.log(`  ready: ${d.escrowReleaseAt <= new Date().toISOString()}`);
    }
  }
  process.exit(0);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
