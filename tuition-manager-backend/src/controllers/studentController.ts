import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { AuthRequest } from '../middlewares/authMiddleware';

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