import crypto from 'crypto';
import type { WheelPrize } from '@scentresort/shared';

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function calculateRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const message = `${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac('sha256', serverSeed).update(message).digest('hex');
  // Take first 8 hex chars (32 bits) and convert to float 0-1
  const int = parseInt(hmac.slice(0, 8), 16);
  return int / 0xffffffff;
}

export function selectPrize(roll: number, prizes: WheelPrize[]): WheelPrize {
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.probability;
    if (roll < cumulative) return prize;
  }
  // Fallback to last prize (handles floating point edge case)
  return prizes[prizes.length - 1];
}
