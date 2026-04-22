import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  teacherId: Types.ObjectId;
  name: string;
  guardianName: string;
  guardianPhone: string;
  whatsapp: string;
  classGrade: string;
  subjects: string;
  monthlyFee: number;
  startDate: Date;
  endDate: Date;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial' | 'Unpaid';
  dueAmount: number;
  lastPaymentDate: Date | null;
  avatarInitials: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>({
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
  name: { type: String, required: true },
  guardianName: { type: String, default: '' },
  guardianPhone: { type: String, default: '' },
  whatsapp: { type: String, required: true },
  classGrade: { type: String, required: true },
  subjects: { type: String, default: '' },
  monthlyFee: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue', 'Partial', 'Unpaid'],
    default: 'Pending'
  },
  dueAmount: { type: Number, required: true, min: 0 },
  lastPaymentDate: { type: Date, default: null },
  avatarInitials: { type: String }
}, { timestamps: true });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
