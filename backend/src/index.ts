import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'node:dns/promises';
import bcrypt from 'bcryptjs';

import eventsRouter from './routes/events';
import sessionsRouter from './routes/sessions';
import heatmapRouter from './routes/heatmap';
import authRouter from './routes/auth';
import { requireAuth } from './middleware/authMiddleware';
import { eventLimiter, tokenLimiter, validateSiteToken } from './middleware/siteToken';
import { Admin } from './models/Admin';
import { Site } from './models/Site';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/events', eventLimiter, tokenLimiter, validateSiteToken, eventsRouter);
app.use('/api/sessions', requireAuth, sessionsRouter);
app.use('/api/heatmap', requireAuth, heatmapRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = String(process.env.MONGODB_URI || '');

async function seedAdmin() {
  const exists = await Admin.findOne({ email: 'admin@admin.com' });
  if (!exists) {
    const hash = await bcrypt.hash('admin@1234!', 12);
    await Admin.create({ email: 'admin@admin.com', password: hash });
    console.log('Admin seeded: admin@admin.com');
  }
}

async function seedDemoSite() {
  const token = 'pk_live_demo1234';
  const exists = await Site.findOne({ token });
  if (!exists) {
    await Site.create({
      token,
      name: 'Demo Store',
      allowed_origin: 'http://127.0.0.1:5500',
      active: true,
    });
    console.log(`Demo site seeded — token: ${token}`);
  }
}

dns.setServers(['1.1.1.1']);

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmin();
    await seedDemoSite();
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err: Error) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
