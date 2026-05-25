// Moderation
export const FLAG_THRESHOLD = 3;

// Listings
export const MAX_LISTING_IMAGES = 5;
export const MIN_LISTING_PRICE = 500; // cents — $5.00 minimum to cover Stripe fees
export const SUPPORTED_CURRENCIES = ['usd'] as const;

// Messages
export const MAX_MESSAGE_LENGTH = 5000;

// Offers
export const OFFER_EXPIRY_DAYS = 7;
export const MAX_OFFER_MESSAGE_LENGTH = 500;

// Payments
export const PLATFORM_FEE_PERCENT = 10;
export const ESCROW_WINDOW_HOURS = 48;
export const AUTO_DELIVERY_DAYS = 7;
export const SELLER_SHIP_DEADLINE_DAYS = 5;
