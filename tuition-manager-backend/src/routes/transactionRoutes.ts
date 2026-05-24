import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getDashboardMetrics, getAnalytics, logPayment, getTransactions, deleteTransaction, chargeLateFee } from '../controllers/transactionController';
import { validate } from '../middlewares/validateResource'; // Add this
import { logPaymentSchema } from '../validations/schemas'; // Add this

const router = Router();

router.use(authMiddleware); 

router.route('/')
  .get(getTransactions)
  // Arm the POST route with validation!
  .post(validate(logPaymentSchema), logPayment);

  router.get('/metrics', getDashboardMetrics);
  router.get('/analytics', getAnalytics);

router.post('/charge', chargeLateFee);

router.route('/:id')
  .delete(deleteTransaction);




export default router;