/**
 * Server-side message filter to detect off-platform deal attempts.
 * Blocks messages containing phone numbers, emails, social handles,
 * payment app references, URLs, and off-platform phrases.
 */

interface FilterResult {
  blocked: boolean;
  reason: string | null;
}

// Normalize evasion tactics: "v e n m o" → "venmo", "ven.mo" → "venmo"
function normalizeEvasion(text: string): string {
  // Collapse single-char spacing: "v e n m o" → "venmo"
  return text.replace(/\b(\w)\s+(?=\w\b)/g, (_, c) => c)
    // Collapse dots between single chars: "v.e.n.m.o" → "venmo"
    .replace(/\b(\w)\.(?=\w\b)/g, (_, c) => c);
}

// --- Pattern categories ---

const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/;

const EMAIL_REGEX = /\S+@\S+\.\S+/;

const URL_REGEX = /(?:https?:\/\/|www\.)\S+|[\w-]+\.(?:com|co|io|net|org|me|app|xyz|link|ly)\b/i;

// @handle pattern — but exclude common non-social uses
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z]\w{2,}/;

const PAYMENT_KEYWORDS = [
  'venmo',
  'cashapp',
  'cash app',
  'zelle',
  'paypal',
  'pay pal',
  'apple pay',
  'google pay',
  'crypto',
  'bitcoin',
  'btc',
  'ethereum',
  'eth wallet',
  'western union',
  'money order',
];

const SOCIAL_KEYWORDS = [
  'my ig',
  'my insta',
  'my instagram',
  'my snap',
  'my snapchat',
  'my tiktok',
  'my twitter',
  'my facebook',
  'my fb',
  'my telegram',
  'my discord',
  'my whatsapp',
  'add me on',
  'follow me on',
  'find me on',
  'hit me up on',
  'hmu on',
];

const OFFPLATFORM_PHRASES = [
  'text me',
  'call me',
  'dm me',
  'message me on',
  'hit me up',
  'hmu',
  'my number is',
  'my number\'s',
  'my phone',
  'off the app',
  'off the site',
  'off the platform',
  'off platform',
  'offsite',
  'outside the app',
  'outside the site',
  'avoid fees',
  'avoid the fee',
  'skip the fee',
  'save on fees',
  'deal outside',
  'deal off',
  'trade outside',
  'whatsapp',
  'signal app',
  'telegram',
  'imessage',
  'facetime',
];

function matchesKeywords(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    if (text.includes(kw)) return kw;
  }
  return null;
}

export function checkMessageContent(text: string): FilterResult {
  const lower = text.toLowerCase().trim();
  const normalized = normalizeEvasion(lower);

  // Check payment app keywords (on both raw and normalized)
  const paymentMatch = matchesKeywords(normalized, PAYMENT_KEYWORDS);
  if (paymentMatch) {
    return { blocked: true, reason: 'payment app references' };
  }

  // Check off-platform phrases
  const offplatformMatch = matchesKeywords(lower, OFFPLATFORM_PHRASES);
  if (offplatformMatch) {
    return { blocked: true, reason: 'off-platform contact requests' };
  }

  // Check social media keywords
  const socialKwMatch = matchesKeywords(lower, SOCIAL_KEYWORDS);
  if (socialKwMatch) {
    return { blocked: true, reason: 'social media handles' };
  }

  // Check email addresses
  if (EMAIL_REGEX.test(lower)) {
    return { blocked: true, reason: 'email addresses' };
  }

  // Check phone numbers — but avoid false positives on short numbers
  // Strip common non-phone contexts first (prices, sizes like "100ml")
  const textWithoutPrices = lower
    .replace(/\$[\d,.]+/g, '')        // strip prices
    .replace(/\d+\s*ml\b/g, '')       // strip sizes like "100ml"
    .replace(/\d+\s*oz\b/g, '')       // strip "3.4oz"
    .replace(/\d+\s*fl\b/g, '')       // strip "3.4fl"
    .replace(/#\d+/g, '')             // strip order/batch numbers like "#1234"
    .replace(/\d{1,2}\/\d{1,2}/g, '') // strip dates like "5/27"
    .replace(/\d+%/g, '');            // strip percentages
  if (PHONE_REGEX.test(textWithoutPrices)) {
    return { blocked: true, reason: 'phone numbers' };
  }

  // Check URLs
  if (URL_REGEX.test(lower)) {
    return { blocked: true, reason: 'external links' };
  }

  // Check @handles — only if preceded by social context or in isolation
  // Avoid false positives like "bought @ retail" by requiring 3+ char handle
  if (SOCIAL_HANDLE_REGEX.test(lower)) {
    // Only flag if it looks intentional (not "@retail", "@store", etc.)
    const match = lower.match(SOCIAL_HANDLE_REGEX);
    if (match) {
      const commonWords = ['@retail', '@store', '@price', '@cost', '@home', '@work', '@first', '@least', '@most'];
      if (!commonWords.includes(match[0].toLowerCase())) {
        return { blocked: true, reason: 'social media handles' };
      }
    }
  }

  return { blocked: false, reason: null };
}
