import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Student } from '../models/Student';
import { AuthRequest } from '../middlewares/authMiddleware';

// @desc    Log a new payment and update student ledger
// @route   POST /api/transactions
export const logPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, amount, date, period, type, note } = req.body;
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
      studentName: student.name,
      amount,
      date,
      period,
      type,
      note: note || ''
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
    
    student.lastPaymentDate = new Date(date);
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
      if (student.dueAmount <= 0) {
        student.dueAmount = 0;
        student.status = 'Paid';
      } else if (student.dueAmount < student.monthlyFee) {
        student.status = 'Partial';
      } else {
        student.status = 'Overdue';
      }
      await student.save();
    }

    await transaction.deleteOne();
    res.json({ message: 'Transaction removed and balance reverted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};


// @desc    Charge a late fee (increases dueAmount)
// @route   POST /api/transactions/charge
export const chargeLateFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, amount, date, period, note } = req.body;
    const teacherId = req.user?.id;

    const student = await Student.findOne({ _id: studentId, teacherId });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const transaction = new Transaction({
      studentId,
      teacherId,
      studentName: student.name,
      amount,
      date,
      period,
      type: 'Late Fee',
      note: note || ''
    });
    await transaction.save();

    student.dueAmount += amount;
    student.status = student.dueAmount >= student.monthlyFee ? 'Overdue' : 'Partial';
    await student.save();

    res.status(201).json({ message: 'Late fee charged', transaction, updatedStudent: student });
  } catch (err) {
    res.status(500).json({ message: 'Failed to charge late fee', error: err });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?.id;
    const now = new Date();

    // Last 6 months labels + YYYY-MM prefixes
    const months: { label: string; prefix: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('en-US', { month: 'short' }),
        prefix: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      });
    }

    const [allTransactions, allStudents] = await Promise.all([
      Transaction.find({ teacherId }),
      Student.find({ teacherId })
    ]);

    // Monthly revenue for chart
    const monthlyRevenue = months.map(m => ({
      name: m.label,
      revenue: allTransactions
        .filter(t => t.date && String(t.date).startsWith(m.prefix))
        .reduce((sum, t) => sum + t.amount, 0)
    }));

    const thisMonthRevenue = monthlyRevenue[5]?.revenue ?? 0;
    const lastMonthRevenue = monthlyRevenue[4]?.revenue ?? 0;
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0;

    // Payment type distribution
    const typeMap: Record<string, number> = {};
    allTransactions.forEach(t => {
      const type = t.type || 'Tuition';
      typeMap[type] = (typeMap[type] || 0) + t.amount;
    });
    const paymentTypeDistribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    // Top defaulters
    const topDefaulters = allStudents
      .filter(s => s.dueAmount > 0)
      .sort((a, b) => b.dueAmount - a.dueAmount)
      .slice(0, 5)
      .map(s => ({ name: s.name, dueAmount: s.dueAmount, classGrade: s.classGrade || '' }));

    // Class-wise breakdown (collected this calendar year + pending)
    const thisYear = String(now.getFullYear());
    const classMap: Record<string, { collected: number; pending: number; count: number }> = {};
    allStudents.forEach(s => {
      const cls = s.classGrade || 'Unassigned';
      if (!classMap[cls]) classMap[cls] = { collected: 0, pending: 0, count: 0 };
      classMap[cls].pending += s.dueAmount;
      classMap[cls].count++;
    });
    allTransactions
      .filter(t => t.date && String(t.date).startsWith(thisYear))
      .forEach(t => {
        const student = allStudents.find(s => s._id.toString() === t.studentId.toString());
        const cls = student?.classGrade || 'Unassigned';
        if (classMap[cls]) classMap[cls].collected += t.amount;
      });
    const classWiseBreakdown = Object.entries(classMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.collected - a.collected);

    // Weekly totals (last 7 days)
    const weekData: { name: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weekData.push({
        name: d.toLocaleString('en-US', { weekday: 'short' }),
        revenue: allTransactions
          .filter(t => t.date && String(t.date).startsWith(dayPrefix))
          .reduce((sum, t) => sum + t.amount, 0)
      });
    }

    res.json({
      monthlyRevenue,
      weeklyRevenue: weekData,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueChange,
      paymentTypeDistribution,
      topDefaulters,
      classWiseBreakdown
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics', error: err });
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