import * as admin from 'firebase-admin';
import fs from 'fs';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    // Support inline JSON, base64-encoded JSON, or a file path
    let credential;
    if (serviceAccount.startsWith('{')) {
      credential = JSON.parse(serviceAccount);
    } else if (serviceAccount.startsWith('ey')) {
      credential = JSON.parse(Buffer.from(serviceAccount, 'base64').toString());
    } else {
      credential = JSON.parse(fs.readFileSync(serviceAccount, 'utf-8'));
    }

    admin.initializeApp({
      credential: admin.credential.cert(credential),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'scent-resort.firebasestorage.app',
    });
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or default credentials
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { admin };
