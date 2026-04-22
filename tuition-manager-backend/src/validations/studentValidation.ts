import { z } from 'zod';

export const studentSchema = z.object({
  name: z.string().min(1),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  whatsapp: z.string().min(5),
  classGrade: z.string().min(1),
  subjects: z.string().optional(),
  monthlyFee: z.number().positive(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid startDate',
  }),
  endDate: z.string().optional(),
  dueAmount: z.number().nonnegative(),
  avatarInitials: z.string().optional(),
});
