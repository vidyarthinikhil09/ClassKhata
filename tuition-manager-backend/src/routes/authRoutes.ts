
import { Router } from 'express';
import { Teacher } from '../models/Teacher';
import { registerTeacher, loginTeacher, logoutTeacher, forgotPassword, resetPassword } from '../controllers/authController';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { sendPushNotification } from '../utils/pushNotify';

const router = Router();

router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/logout', logoutTeacher);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


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

// Save push subscription
router.post('/push-subscription', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await Teacher.findByIdAndUpdate(req.user?.id, { pushSubscription: req.body });
    res.json({ message: 'Push subscription saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save push subscription' });
  }
});

// Send a test push notification
router.post('/push-test', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const teacher = await Teacher.findById(req.user?.id);
    if (!teacher?.pushSubscription) {
      res.status(400).json({ message: 'No push subscription found' });
      return;
    }
    await sendPushNotification(teacher.pushSubscription, {
      title: 'ClassKhata',
      body: 'Push notifications are working!'
    });
    res.json({ message: 'Test notification sent' });
  } catch (err: any) {
    if (err.expired) {
      await Teacher.findByIdAndUpdate(req.user?.id, { $unset: { pushSubscription: 1 } });
      res.status(410).json({ message: 'Subscription expired, please re-subscribe' });
    } else {
      res.status(500).json({ message: 'Failed to send notification' });
    }
  }
});

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
