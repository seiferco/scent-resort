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

// Age Restriction
export const MIN_WHEEL_AGE = 18;

// Mystery Wheel
export const WHEEL_SPIN_PRICE = 2500; // $25 in cents
export const FREE_SPIN_COOLDOWN_HOURS = 24;
export const COUPON_EXPIRY_DAYS = 90;
export const FREE_SHIPPING_VALUE = 800; // $8 estimated shipping cost in cents
