import { z } from 'zod';

// Rule for creating a student
export const createStudentSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Student name is required' }).min(2),
    whatsapp: z.string({ required_error: 'WhatsApp number is required' }).min(10),
    classGrade: z.string({ required_error: 'Class/Grade is required' }),
    monthlyFee: z.number({ required_error: 'Monthly fee is required' }).min(0, 'Fee cannot be negative'),
    dueAmount: z.number().min(0, 'Due amount cannot be negative'),
    startDate: z.string().or(z.date()),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    subjects: z.string().optional(),
  }),
});

// Rule for logging a payment
export const logPaymentSchema = z.object({
  body: z.object({
    studentId: z.string({ required_error: 'Student ID is required' }),
    amount: z.number({ required_error: 'Payment amount is required' }).min(1, 'Amount must be greater than 0'),
    date: z.string().or(z.date()),
    period: z.string({ required_error: 'Billing period is required (e.g., April 2026)' }),
    type: z.enum(['Tuition', 'Late Fee', 'Material']).default('Tuition'),
  }),
});