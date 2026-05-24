import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ITeacher extends Document {
  name: string;
  email: string;
  password?: string;
  avatarInitials: string;
  role: string;
  authProviderId?: string;
  instituteName?: string;
  photo?: string;
  pushSubscription?: object;
  resetToken?: string;
  resetTokenExpiry?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  avatarInitials: { type: String, default: 'T' },
  role: { type: String, default: 'Administrator' },
  authProviderId: { type: String },
  instituteName: { type: String, default: '' },
  photo: { type: String, default: '' },
  pushSubscription: { type: Schema.Types.Mixed },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

// Pre-save hook to hash the password before saving it to MongoDB
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to compare entered password
teacherSchema.methods.matchPassword = async function (enteredPassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);