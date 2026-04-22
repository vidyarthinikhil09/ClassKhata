import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getDashboardMetrics, logPayment, getTransactions, deleteTransaction } from '../controllers/transactionController';
import { validate } from '../middlewares/validateResource'; // Add this
import { logPaymentSchema } from '../validations/schemas'; // Add this

const router = Router();

router.use(authMiddleware); 

router.route('/')
  .get(getTransactions)
  // Arm the POST route with validation!
  .post(validate(logPaymentSchema), logPayment);

  router.get('/metrics', getDashboardMetrics);

router.route('/:id')
  .delete(deleteTransaction); // <-- Added this




export default router;