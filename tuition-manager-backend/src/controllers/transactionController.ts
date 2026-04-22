import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Student } from '../models/Student';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Log a new payment and update student ledger
// @route   POST /api/transactions
export const logPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, amount, date, period, type } = req.body;
    const teacherId = req.user?.id;

    // 1. Find the student to make sure they exist and belong to this teacher
    const student = await Student.findOne({ _id: studentId, teacherId });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // 2. Create the transaction record
    const transaction = new Transaction({
      studentId,
      teacherId,
      studentName: student.name, // Denormalized for fast rendering
      amount,
      date,
      period,
      type
    });

    await transaction.save();

    // 3. The Ledger Magic: Update the Student's balance and status
    student.dueAmount -= amount;
    
    // Prevent negative balances if they overpay
    if (student.dueAmount <= 0) {
      student.dueAmount = 0;
      student.status = 'Paid';
    } else {
      student.status = 'Partial';
    }
    
    student.lastPaymentDate = date;
    await student.save();

    // 4. Send back the updated student data so the React frontend can update immediately
    res.status(201).json({ 
      message: 'Payment logged successfully', 
      transaction, 
      updatedStudent: student 
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to log payment', error: err });
  }
};

// @desc    Get all transactions for a teacher (useful for the Reports page)
// @route   GET /api/transactions
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.find({ teacherId: req.user?.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// @desc    Delete a transaction & revert balance
// @route   DELETE /api/transactions/:id
export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, teacherId: req.user?.id });
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Revert the student's balance
    const student = await Student.findById(transaction.studentId);
    if (student) {
      student.dueAmount += transaction.amount;
      // Recalculate status based on the reverted balance
      if (student.dueAmount > 0 && student.dueAmount < student.monthlyFee) student.status = 'Partial';
      else if (student.dueAmount >= student.monthlyFee) student.status = 'Pending';
      await student.save();
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed and balance reverted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};


export const getDashboardMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id; 

    // 1. BULLETPROOF DATE QUERY (Works perfectly whether your Mongoose schema is String or Date!)
    const now = new Date();
    // Get YYYY-MM-DD for the 1st of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    // Get YYYY-MM-DD for the 1st of NEXT month
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];

    const thisMonthsTransactions = await Transaction.find({
      teacherId: teacherId,
      date: { $gte: startOfMonth, $lt: startOfNextMonth } // Greater than 1st of this month, Less than 1st of next month
    });

    const collectedThisMonth = thisMonthsTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // 2. QUERY STUDENTS
    // ⚠️ CRITICAL: Ensure you have "import { Student } from '../models/Student';" at the top of this file!
    const allStudents = await Student.find({ teacherId: teacherId });

    const totalStudents = allStudents.length;
    const pendingCollections = allStudents.reduce((sum, student) => sum + (student.dueAmount || 0), 0);
    const activeOverdue = allStudents.filter(student => (student.dueAmount || 0) > 0).length;

    res.json({
      collectedThisMonth,
      totalStudents,
      pendingCollections,
      activeOverdue
    });

  } catch (error) {
    // 👇 THIS WILL PRINT THE EXACT CAUSE OF THE CRASH TO YOUR BACKEND TERMINAL 👇
    console.error("🔥 DASHBOARD CRASH:", error); 
    res.status(500).json({ message: 'Error fetching dashboard metrics', error });
  }
};