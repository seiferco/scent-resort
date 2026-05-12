import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import * as messagingService from '../services/messaging.service';
import { getParam } from '../types';

const router = Router();

// All conversation routes require auth
router.use(requireAuth);

// POST /conversations — Start or get conversation about a listing
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ listingId: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    const result = await messagingService.getOrCreateConversation({
      listingId: parsed.data.listingId,
      buyerId: user.uid,
      buyerDisplayName: user.displayName,
    });

    res.status(result.isNew ? 201 : 200).json(result);
  } catch (err: any) {
    console.error('Create conversation error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// GET /conversations — List user's conversations
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const snapshot = await db
      .collection('conversations')
      .where('participantIds', 'array-contains', user.uid)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();

    const conversations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch conversations' });
  }
});

// GET /conversations/:id — Get conversation detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const doc = await db.collection('conversations').doc(getParam(req, 'id')).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'not_found', message: 'Conversation not found' });
      return;
    }

    const data = doc.data()!;
    if (!data.participantIds.includes(user.uid)) {
      res.status(403).json({ error: 'forbidden', message: 'Not a participant' });
      return;
    }

    res.json({ id: doc.id, ...data });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch conversation' });
  }
});

// GET /conversations/:id/messages — Get messages (paginated)
router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const convoId = getParam(req, 'id');

    // Verify participant
    const convo = await db.collection('conversations').doc(convoId).get();
    if (!convo.exists || !convo.data()!.participantIds.includes(user.uid)) {
      res.status(403).json({ error: 'forbidden', message: 'Not a participant' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const snapshot = await db
      .collection('conversations')
      .doc(convoId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .reverse(); // Return in chronological order

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch messages' });
  }
});

// POST /conversations/:id/messages — Send a message
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      text: z.string().min(1).max(5000),
      imageUrl: z.string().url().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', message: parsed.error.issues });
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    const messageId = await messagingService.sendMessage({
      conversationId: getParam(req, 'id'),
      senderId: user.uid,
      senderDisplayName: user.displayName,
      text: parsed.data.text,
      imageUrl: parsed.data.imageUrl,
    });

    res.status(201).json({ messageId });
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

// POST /conversations/:id/read — Mark as read
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    await messagingService.markAsRead(getParam(req, 'id'), user.uid);
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    console.error('Mark read error:', err);
    res.status(400).json({ error: 'bad_request', message: err.message });
  }
});

export default router;
