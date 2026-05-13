import { Router, Request, Response } from 'express';
import { Event, EventType } from '../models/Event';

interface EventPayload {
  site_token: string;
  session_id: string;
  event_type: EventType;
  page_url: string;
  timestamp?: string;
  x?: number;
  y?: number;
  vw?: number;
  vh?: number;
}

const router = Router();

// POST /api/events — receive and store a single event or batch
router.post('/', async (req: Request, res: Response) => {
  try {
    const payload: EventPayload[] = Array.isArray(req.body) ? req.body : [req.body];

    const docs = payload.map((e) => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      ...(e.x != null && { x: e.x }),
      ...(e.y != null && { y: e.y }),
      ...(e.vw != null && { vw: e.vw }),
      ...(e.vh != null && { vh: e.vh }),
    }));

    const clicks = docs.filter((d) => d.event_type === 'click');
    if (clicks.length > 0) {
      clicks.forEach((c) => {
        console.log(
          `[click] session=${c.session_id} x=${c.x} y=${c.y} vw=${(c as any).vw} vh=${(c as any).vh}`
        );
      });
    }

    await Event.insertMany(docs, { ordered: false });
    res.status(201).json({ ok: true, stored: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to store events' });
  }
});

export default router;
