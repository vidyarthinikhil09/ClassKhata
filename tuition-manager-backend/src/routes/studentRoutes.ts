import { Router } from 'express';
import { getStudents, createStudent, deleteStudent, getStudentById, updateStudent, generateMonthlyFees } from '../controllers/studentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateResource'; // Add this
import { createStudentSchema } from '../validations/schemas'; // Add this

const router = Router();

router.use(authMiddleware); 

router.route('/')
  .get(getStudents)
  // Arm the POST route with validation!
  .post(validate(createStudentSchema), createStudent);

router.post('/generate-fees', generateMonthlyFees);

router.route('/:id')
  .get(getStudentById)
  .delete(deleteStudent)
  .put(updateStudent);

export default router;