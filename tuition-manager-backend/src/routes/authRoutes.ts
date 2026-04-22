
import { Router } from 'express';
import { Teacher } from '../models/Teacher';
import { registerTeacher, loginTeacher, logoutTeacher } from '../controllers/authController';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/logout', logoutTeacher);


router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Find the teacher by the ID in the secure token, but DO NOT send the password back!
    const teacher = await Teacher.findById(req.user?.id).select('-password');
    if (!teacher) {
      res.status(404).json({ message: 'Teacher not found' });
      return;
    }
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Update teacher profile
// Update teacher profile
router.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Auto-generate the new avatar initials if a name is provided!
    if (req.body.name) {
      req.body.avatarInitials = req.body.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }

    // Save to database. The { new: true } is CRITICAL so it sends the updated data back!
    const teacher = await Teacher.findByIdAndUpdate(
      req.user?.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      res.status(404).json({ message: 'Teacher not found' });
      return;
    }
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
