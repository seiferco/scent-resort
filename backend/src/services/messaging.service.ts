import { db } from '../config/firebase';
import { admin } from '../config/firebase';
import { MAX_MESSAGE_LENGTH } from '@scentresort/shared';

export async function getOrCreateConversation(params: {
  listingId: string;
  buyerId: string;
  buyerDisplayName: string;
}): Promise<{ conversationId: string; isNew: boolean }> {
  const { listingId, buyerId, buyerDisplayName } = params;

  // Fetch listing to get seller info
  const listingDoc = await db.collection('listings').doc(listingId).get();
  if (!listingDoc.exists) throw new Error('Listing not found');
  const listing = listingDoc.data()!;

  if (listing.sellerId === buyerId) {
    throw new Error('Cannot message yourself');
  }

  if (listing.status !== 'active') {
    throw new Error('Listing is no longer active');
  }

  // Check if conversation already exists for this buyer + listing
  const existing = await db
    .collection('conversations')
    .where('listingId', '==', listingId)
    .where('buyerId', '==', buyerId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { conversationId: existing.docs[0].id, isNew: false };
  }

  // Create new conversation
  const ref = db.collection('conversations').doc();
  await ref.set({
    listingId,
    listingTitle: listing.title,
    listingImage: listing.images?.[0] || '',
    buyerId,
    sellerId: listing.sellerId,
    participantIds: [buyerId, listing.sellerId],
    lastMessage: '',
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessageSenderId: '',
    buyerUnread: false,
    sellerUnread: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { conversationId: ref.id, isNew: true };
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderDisplayName: string;
  text: string;
  imageUrl?: string;
}): Promise<string> {
  const { conversationId, senderId, senderDisplayName, text, imageUrl } = params;

  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }

  const convoRef = db.collection('conversations').doc(conversationId);
  const convo = await convoRef.get();

  if (!convo.exists) throw new Error('Conversation not found');
  const data = convo.data()!;

  if (!data.participantIds.includes(senderId)) {
    throw new Error('Not a participant in this conversation');
  }

  const messageRef = convoRef.collection('messages').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();

  // Create message
  batch.create(messageRef, {
    senderId,
    senderDisplayName,
    text,
    imageUrl: imageUrl || null,
    createdAt: now,
  });

  // Update conversation metadata
  const isBuyer = senderId === data.buyerId;
  batch.update(convoRef, {
    lastMessage: text.slice(0, 100),
    lastMessageAt: now,
    lastMessageSenderId: senderId,
    // Mark unread for the other participant
    buyerUnread: isBuyer ? false : true,
    sellerUnread: isBuyer ? true : false,
  });

  await batch.commit();
  return messageRef.id;
}

export async function markAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const convoRef = db.collection('conversations').doc(conversationId);
  const convo = await convoRef.get();

  if (!convo.exists) throw new Error('Conversation not found');
  const data = convo.data()!;

  if (!data.participantIds.includes(userId)) {
    throw new Error('Not a participant in this conversation');
  }

  const isBuyer = userId === data.buyerId;
  await convoRef.update({
    [isBuyer ? 'buyerUnread' : 'sellerUnread']: false,
  });
}
