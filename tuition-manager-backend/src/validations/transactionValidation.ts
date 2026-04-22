import { z } from 'zod';

export const transactionSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
  period: z.string().min(1),
  type: z.enum(['Tuition', 'Late Fee', 'Material']),
});
