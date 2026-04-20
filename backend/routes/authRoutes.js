import bcrypt from 'bcryptjs';
import { Router } from 'express';
import User from '../models/User.js';
import { validatePortalLogin } from '../middleware/auth.js';

const router = Router();

async function authenticatePortalUser({ role, username, password }) {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '').trim();

  const databaseUser = await User.findOne({ username: normalizedUsername, role, isActive: true }).lean();
  if (!databaseUser) return false;

  return validatePortalLogin(databaseUser.username, databaseUser.password, normalizedUsername, normalizedPassword);
}

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ok = await authenticatePortalUser({ role: 'admin', username, password });
    if (!ok) return res.status(401).json({ message: 'Invalid admin credentials.' });
    return res.json({ role: 'admin', message: 'Admin login successful.' });
  } catch (error) {
    return res.status(500).json({ message: 'Admin login failed.', error: error.message });
  }
});

router.post('/worker/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ok = await authenticatePortalUser({ role: 'worker', username, password });
    if (!ok) return res.status(401).json({ message: 'Invalid social worker credentials.' });
    return res.json({ role: 'worker', message: 'Social worker login successful.' });
  } catch (error) {
    return res.status(500).json({ message: 'Social worker login failed.', error: error.message });
  }
});


router.post('/register', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();
    const role = String(req.body?.role || 'worker').trim().toLowerCase();

    if (!username || username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!['admin', 'worker'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or worker.' });
    }

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return res.status(409).json({ message: 'That username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, password: passwordHash, role, isActive: true });

    return res.status(201).json({
      role,
      username,
      message: `${role === 'admin' ? 'Admin' : 'Social worker'} account created successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create account.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!['admin', 'worker'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be admin or worker.' });
    }

    const ok = await authenticatePortalUser({ role: normalizedRole, username, password });
    if (!ok) {
      return res.status(401).json({ message: `Invalid ${normalizedRole === 'admin' ? 'admin' : 'social worker'} credentials.` });
    }

    return res.json({
      role: normalizedRole,
      message: `${normalizedRole === 'admin' ? 'Admin' : 'Social worker'} login successful.`,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

export default router;
