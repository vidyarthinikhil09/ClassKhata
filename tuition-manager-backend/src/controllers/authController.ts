import { Request, Response } from 'express';
import { Teacher } from '../models/Teacher';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Dynamically set 'secure' based on environment (false for local HTTP, true for live HTTPS)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
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