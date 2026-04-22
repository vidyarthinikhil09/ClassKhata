import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  studentId: Types.ObjectId;
  teacherId: Types.ObjectId;
  studentName: string;
  amount: number;
  date: Date;
  period: string;
  type: 'Tuition' | 'Late Fee' | 'Material';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  studentName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  period: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['Tuition', 'Late Fee', 'Material'],
    default: 'Tuition'
  }
}, { timestamps: true });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
