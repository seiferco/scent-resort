/**
 * Reset all test data: clear orders, offers, and relist the Versace Dylan Blue.
 * Usage: npx tsx src/scripts/reset-test-data.ts
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

async function deleteCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) { console.log(`  ${name}: already empty`); return; }
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  ${name}: deleted ${snap.size} docs`);
}

async function main() {
  console.log('Cleaning up test data...');
  await deleteCollection('orders');
  await deleteCollection('offers');

  // Relist all listings back to active
  const listings = await db.collection('listings').get();
  let relisted = 0;
  for (const doc of listings.docs) {
    const data = doc.data();
    if (data.status !== 'active') {
      await doc.ref.update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`  Relisted: ${data.title} (was ${data.status})`);
      relisted++;
    }
  }
  console.log(`  listings: relisted ${relisted}`);

  console.log('\nDone. Marketplace is reset.');
  process.exit(0);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
