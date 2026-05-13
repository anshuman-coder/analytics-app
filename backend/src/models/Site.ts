import { Schema, model, Document } from 'mongoose';

export interface ISite extends Document {
  token: string;
  name: string;
  allowed_origin: string;
  active: boolean;
}

const siteSchema = new Schema<ISite>(
  {
    token: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    allowed_origin: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Site = model<ISite>('Site', siteSchema);
