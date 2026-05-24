import { Request, Response } from 'express';
import { Teacher } from '../models/Teacher';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Dynamically set 'secure' based on environment (false for local HTTP, true for live HTTPS)
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const registerTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, avatarInitials, authProviderId } = req.body;
    
    const existing = await Teacher.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }
    
    // Auto-generate initials if they weren't provided from the frontend
    const generatedInitials = avatarInitials || (name ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'T');

    const teacher = new Teacher({ 
      name, 
      email, 
      password, 
      avatarInitials: generatedInitials, 
      authProviderId,
      role: 'Administrator' // Add the default role we added to the schema!
    });
    
    await teacher.save();
    
    // 👇 ADDED: Generate the token!
    const token = jwt.sign({ id: teacher._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // 👇 ADDED: Hand out the secure cookie!
    res.cookie('token', token, COOKIE_OPTIONS);
    
    // Return the created user without the password
    res.status(201).json({ 
      message: 'Registration successful',
      user: { id: teacher._id, name: teacher.name, email: teacher.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
};

export const loginTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Fixed: Changed from comparePassword to matchPassword
    const isMatch = await teacher.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign({ id: teacher._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, COOKIE_OPTIONS);
    
    // Return user data for the frontend dashboard
    res.json({ 
      message: 'Login successful',
      user: { id: teacher._id, name: teacher.name, email: teacher.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
};

export const logoutTeacher = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logout successful' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const teacher = await Teacher.findOne({ email });

    // Always respond with success to prevent email enumeration
    if (!teacher) {
      res.json({ message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    teacher.resetToken = hashedToken;
    teacher.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await teacher.save();

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"ClassKhata" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your ClassKhata password',
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><a href="${resetUrl}">${resetUrl}</a>`
      });
    } else {
      // SMTP not configured — log the link for local dev
      console.log(`[DEV] Password reset link: ${resetUrl}`);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset email', error: err });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const teacher = await Teacher.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!teacher) {
      res.status(400).json({ message: 'Reset link is invalid or has expired' });
      return;
    }

    teacher.password = newPassword;
    teacher.resetToken = undefined;
    teacher.resetTokenExpiry = undefined;
    await teacher.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err });
  }
};