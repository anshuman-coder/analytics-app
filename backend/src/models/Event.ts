import { Schema, model, Document } from 'mongoose';

export type EventType = 'page_view' | 'click';

export interface IEvent extends Document {
  session_id: string;
  event_type: EventType;
  page_url: string;
  timestamp: Date;
  x?: number;
  y?: number;
  vw?: number;
  vh?: number;
}

const eventSchema = new Schema<IEvent>(
  {
    session_id: { type: String, required: true, index: true },
    event_type: { type: String, enum: ['page_view', 'click'], required: true },
    page_url: { type: String, required: true },
    timestamp: { type: Date, required: true },
    x: { type: Number },
    y: { type: Number },
    vw: { type: Number },
    vh: { type: Number },
  },
  { timestamps: true }
);

eventSchema.index({ page_url: 1, event_type: 1 });

export const Event = model<IEvent>('Event', eventSchema);
