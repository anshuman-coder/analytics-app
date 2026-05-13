import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';

const router = Router();

// GET /api/sessions — list all sessions with total event count
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          event_count: { $sum: 1 },
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        },
      },
      { $sort: { last_seen: -1 } },
      {
        $project: {
          session_id: '$_id',
          _id: 0,
          event_count: 1,
          first_seen: 1,
          last_seen: 1,
          pages_visited: { $size: '$pages_visited' },
        },
      },
    ]);
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:sessionId — all events for a session ordered by timestamp
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const events = await Event.find({ session_id: req.params.sessionId })
      .sort({ timestamp: 1 })
      .lean();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session events' });
  }
});

export default router;
