import { Router, Request, Response } from 'express';
import { Event } from '../models/Event';

const router = Router();

// GET /api/heatmap/pages — distinct page URLs that have click data
// must be defined before /:anything to avoid route shadowing
router.get('/pages', async (_req: Request, res: Response) => {
  try {
    const pages = await Event.distinct('page_url', { event_type: 'click' });
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// GET /api/heatmap?page=<url> — click coordinates for a page
router.get('/', async (req: Request, res: Response) => {
  const page = req.query.page as string | undefined;
  if (!page) {
    return res.status(400).json({ error: 'page query parameter is required' });
  }
  try {
    const clicks = await Event.find(
      { event_type: 'click', page_url: page },
      { x: 1, y: 1, vw: 1, vh: 1, timestamp: 1, _id: 0 }
    ).lean();
    res.json(clicks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

export default router;
