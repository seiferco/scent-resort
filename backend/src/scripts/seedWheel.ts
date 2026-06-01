/**
 * Run this once to create the default wheel config in Firestore:
 *   npx ts-node backend/src/scripts/seedWheel.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { db, admin } from '../config/firebase';

const DEFAULT_WHEEL = {
  name: 'Fragrance Roulette',
  price: 2500, // $25
  active: true,
  prizes: [
    {
      id: 'lv-imagination',
      name: 'LV Imagination',
      description: 'Louis Vuitton Imagination 100ml — The grail.',
      image: '/lv_imagination_wheel.webp',
      value: 40000, // $400
      probability: 0.005, // 0.5%
      type: 'fragrance',
    },
    {
      id: 'dior-sauvage',
      name: 'Dior Sauvage',
      description: 'Dior Sauvage EDP 60ml',
      image: '/dior_suavage_wheel.webp',
      value: 12000, // $120
      probability: 0.02, // 2%
      type: 'fragrance',
    },
    {
      id: 'premium-decant',
      name: '10ml Decant',
      description: 'Premium 10ml decant of a designer fragrance',
      image: '/decant_wheel.webp',
      value: 2500, // $25
      probability: 0.08, // 8%
      type: 'sample',
    },
    {
      id: 'sample-set',
      name: 'Sample Set',
      description: '5-piece discovery sample set',
      image: '',
      value: 1200, // $12
      probability: 0.15, // 15%
      type: 'sample',
    },
    {
      id: 'site-credit-5',
      name: '$5 Site Credit',
      description: '$5 credit to use on any ScentResort purchase',
      image: '',
      value: 500,
      probability: 0.25, // 25%
      type: 'credit',
      creditAmount: 500,
    },
    {
      id: 'free-shipping',
      name: 'Free Shipping',
      description: 'Free shipping on your next order',
      image: '',
      value: 300,
      probability: 0.20, // 20%
      type: 'voucher',
    },
    {
      id: 'sticker-pack',
      name: 'Sticker Pack',
      description: 'ScentResort branded sticker pack',
      image: '',
      value: 100, // $1
      probability: 0.295, // 29.5%
      type: 'merch',
    },
  ],
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seed() {
  // Validate probabilities sum to 1
  const totalProb = DEFAULT_WHEEL.prizes.reduce((sum, p) => sum + p.probability, 0);
  console.log(`Total probability: ${totalProb.toFixed(4)} (should be 1.0000)`);

  if (Math.abs(totalProb - 1) > 0.001) {
    console.error('ERROR: Probabilities do not sum to 1!');
    process.exit(1);
  }

  // Check if wheel already exists
  const existing = await db.collection('wheels').where('active', '==', true).limit(1).get();
  if (!existing.empty) {
    console.log('Active wheel already exists:', existing.docs[0].id);
    console.log('Delete it first or set active=false if you want to create a new one.');
    process.exit(0);
  }

  const ref = db.collection('wheels').doc();
  await ref.set(DEFAULT_WHEEL);

  console.log('Wheel created successfully!');
  console.log('Document ID:', ref.id);
  console.log('\nPrizes:');
  DEFAULT_WHEEL.prizes.forEach((p) => {
    console.log(`  ${p.name} — $${(p.value / 100).toFixed(2)} value — ${(p.probability * 100).toFixed(1)}% chance`);
  });

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
