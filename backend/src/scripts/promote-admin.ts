/**
 * Promote a user to admin by email.
 * Usage: npx ts-node src/scripts/promote-admin.ts <email>
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
const auth = admin.auth();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node src/scripts/promote-admin.ts <email>');
    process.exit(1);
  }

  // Find user by email in Firebase Auth
  const fbUser = await auth.getUserByEmail(email);
  console.log(`Found Firebase Auth user: ${fbUser.uid}`);

  // Update Firestore user doc
  const userRef = db.collection('users').doc(fbUser.uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    console.error('User doc not found in Firestore. Make sure the user has logged in at least once.');
    process.exit(1);
  }

  await userRef.update({ role: 'admin' });

  console.log(`\nUser ${email} promoted to admin.`);
  console.log('\nRefresh the browser and you should see the Admin link in the header.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
