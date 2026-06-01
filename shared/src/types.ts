// ── User ──

export type UserRole = 'user' | 'admin';

export type StripeAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  dateOfBirth: string | null;
  bio: string;
  location: string;
  preferredPayment: string;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
  stripeAccountId: string | null;
  stripeAccountStatus: StripeAccountStatus;
  stripeOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Listing ──

export type ListingCondition =
  | 'new_sealed'
  | 'new_open_box'
  | 'lightly_used'
  | 'partially_used';

export type ListingStatus =
  | 'pending_review'
  | 'active'
  | 'pending_sale'
  | 'sold'
  | 'under_review'
  | 'rejected'
  | 'removed';

export interface Listing {
  id: string;
  sellerId: string;
  sellerDisplayName: string;
  title: string;
  description: string;
  brand: string;
  fragranceName: string;
  size: string;
  condition: ListingCondition;
  price: number; // cents — asking price (informational)
  currency: string;
  images: string[];
  status: ListingStatus;
  flagCount: number;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Conversation ──

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  sellerId: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: string;
  buyerUnread: boolean;
  sellerUnread: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderDisplayName: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
}

// ── Report ──

export type ReportReason =
  | 'suspected_counterfeit'
  | 'misleading_description'
  | 'prohibited_item'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed_valid' | 'reviewed_dismissed';

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  adminReviewedBy: string | null;
  adminNotes: string | null;
  createdAt: string;
}

// ── Review ──

export interface Review {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerDisplayName: string;
  buyerPhotoURL: string | null;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// ── Offer ──

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

export interface Offer {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  buyerDisplayName: string;
  sellerId: string;
  sellerDisplayName: string;
  amount: number;       // listing price at time of offer (cents)
  currency: string;
  message: string;      // optional buyer message
  status: OfferStatus;
  acceptedAt: string | null;
  declinedAt: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Order ──

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export type DisputeResolution = 'seller_wins' | 'buyer_wins';

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  buyerDisplayName: string;
  sellerId: string;
  sellerDisplayName: string;

  // Money
  amount: number;        // total in cents
  platformFee: number;   // in cents
  sellerPayout: number;  // amount - platformFee in cents
  currency: string;

  // Discounts
  discountAmount: number;           // cents (0 if no coupons)
  appliedCouponIds: string[];

  // Stripe references
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  stripeTransferId: string | null;

  // Status
  status: OrderStatus;

  // Shipping
  trackingNumber: string | null;
  trackingCarrier: string | null;
  shippedAt: string | null;

  // Escrow
  deliveredAt: string | null;
  escrowReleaseAt: string | null;
  completedAt: string | null;

  // Dispute
  disputeReason: string | null;
  disputeDescription: string | null;
  disputeOpenedAt: string | null;
  disputeResolvedAt: string | null;
  disputeResolution: DisputeResolution | null;
  disputeAdminId: string | null;
  disputeAdminNotes: string | null;

  createdAt: string;
  updatedAt: string;
}

// ── Mystery Wheel ──

export interface WheelPrize {
  id: string;
  name: string;
  description: string;
  image: string;
  value: number;           // retail value in cents
  probability: number;     // 0-1 (e.g. 0.005 = 0.5%)
  type: 'fragrance' | 'sample' | 'merch' | 'credit' | 'voucher';
  creditAmount?: number;   // cents, if type === 'credit'
}

export type SpinStatus = 'pending_payment' | 'completed' | 'prize_shipped' | 'prize_credited' | 'fulfilled';

// ── Coupons ──

export type CouponType = 'site_credit' | 'free_shipping';
export type CouponStatus = 'active' | 'used' | 'expired';

export interface UserCoupon {
  id: string;
  userId: string;
  spinId: string;
  type: CouponType;
  description: string;
  amountOff: number;       // cents
  usedOnOrderId: string | null;
  status: CouponStatus;
  expiresAt: string;
  createdAt: string;
}

// ── Prize Fulfillment ──

export type FulfillmentChoice = 'ship' | 'credit';

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Spin {
  id: string;
  userId: string;
  userDisplayName: string;
  wheelId: string;
  prizeId: string;
  prizeName: string;
  prizeImage: string;
  prizeValue: number;
  prizeType: WheelPrize['type'];
  status: SpinStatus;
  isFree: boolean;
  amountPaid: number;      // cents (0 for free spins)
  stripePaymentIntentId: string | null;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  couponId?: string;
  fulfillmentMethod?: FulfillmentChoice;
  shippingAddress?: ShippingAddress;
  printifyOrderId?: string;
  trackingNumber?: string;
  createdAt: string;
}

export interface WheelConfig {
  id: string;
  name: string;
  price: number;           // cents
  prizes: WheelPrize[];
  active: boolean;
  createdAt: string;
}

// ─��� API ──

export interface ApiError {
  error: string;
  message: string;
}
