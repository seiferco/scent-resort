// ── User ──

export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  location: string;
  preferredPayment: string;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
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
  | 'active'
  | 'sold'
  | 'under_review'
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

// ── API ──

export interface ApiError {
  error: string;
  message: string;
}
