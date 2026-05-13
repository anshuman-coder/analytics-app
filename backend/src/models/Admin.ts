import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  password: string;
}

const adminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
});

export const Admin = model<IAdmin>('Admin', adminSchema);
