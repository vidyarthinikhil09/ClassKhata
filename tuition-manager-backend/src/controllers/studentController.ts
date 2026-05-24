import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendPushNotification } from '../utils/pushNotify';

export const createStudent = async (req: any, res: Response) => {
  try {
    const teacherId = req.user.id;
    const student = new Student({ ...req.body, teacherId });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create student', error: err });
  }
};

export const getStudents = async (req: any, res: Response) => {
  try {
    const students = await Student.find({ teacherId: req.user.id });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students', error: err });
  }
};

export const getStudentById = async (req: any, res: Response) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacherId: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student', error: err });
  }
};

export const deleteStudent = async (req: any, res: Response) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, teacherId: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student', error: err });
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user?.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student' });
  }
};

// @desc    Generate monthly fees for all active students
// @route   POST /api/students/generate-fees
export const generateMonthlyFees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.body; // e.g. "2026-05"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ message: 'month must be in YYYY-MM format' });
      return;
    }

    const teacherId = req.user?.id;
    const students = await Student.find({ teacherId });

    let updatedCount = 0;
    for (const student of students) {
      if (student.feeGeneratedMonths.includes(month)) continue;

      student.feeGeneratedMonths.push(month);
      student.dueAmount += student.monthlyFee;
      if (student.dueAmount > 0) {
        student.status = student.dueAmount >= student.monthlyFee ? 'Overdue' : 'Partial';
      }
      await student.save();
      updatedCount++;
    }

    res.json({ message: `Fees generated for ${updatedCount} student(s) for ${month}`, updatedCount });

    // Send push notification to teacher if they have a subscription
    if (updatedCount > 0) {
      try {
        const teacher = await Teacher.findById(teacherId);
        if (teacher?.pushSubscription) {
          await sendPushNotification(teacher.pushSubscription, {
            title: 'Fees Generated',
            body: `Monthly fees generated for ${updatedCount} student(s) for ${month}`
          });
        }
      } catch { /* push notification is non-critical */ }
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate monthly fees', error: err });
  }
};