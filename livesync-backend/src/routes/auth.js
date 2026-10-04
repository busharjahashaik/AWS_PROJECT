import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { store } from '../store/index.js';
import { signToken, authenticate, requireRole, ah } from '../middleware/auth.js';
import { toPublicUser } from '../services/mappers.js';
import { logActivity } from '../services/activity.js';

const router = Router();
const ROLES = ['CUSTOMER', 'DELIVERY', 'ADMIN'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tiny in-memory brute-force guard: 10 failed logins / 15 min per ip+email.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const tooMany = (key) => {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < WINDOW);
  attempts.set(key, list);
  return list.length >= 10;
};
const recordFail = (key) => attempts.set(key, [...(attempts.get(key) || []), Date.now()]);

router.post(
  '/register',
  ah(async (req, res) => {
    const { name, email, phone, password, role } = req.body || {};
    if (!name || String(name).trim().length < 2) return res.status(400).json({ message: 'Please enter your full name.' });
    if (!EMAIL_RE.test(String(email || ''))) return res.status(400).json({ message: 'Please enter a valid email address.' });
    if (!password || String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Please choose a valid role.' });
    if (role === 'ADMIN' && !config.allowAdminRegister) {
      return res.status(403).json({ message: 'Admin accounts cannot be self-registered.' });
    }

    const user = {
      userId: `usr-${role.toLowerCase()}-${crypto.randomBytes(3).toString('hex')}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '').trim(),
      role,
      passwordHash: await bcrypt.hash(String(password), 10),
      createdAt: new Date().toISOString(),
    };

    try {
      await store.createUser(user);
    } catch (err) {
      if (err.code === 'EXISTS') return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
      throw err;
    }
    await logActivity({
      actor: { id: user.userId, name: user.name, role: user.role },
      action: 'Registered a new account',
      ip: req.ip,
    });
    res.status(201).json({ user: toPublicUser(user) });
  })
);

router.post(
  '/login',
  ah(async (req, res) => {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const key = `${req.ip}|${String(email).toLowerCase()}`;
    if (tooMany(key)) return res.status(429).json({ message: 'Too many failed attempts. Try again in a few minutes.' });

    const user = await store.getUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      recordFail(key);
      return res.status(401).json({ message: 'No account found with this email address.' });
    }
    if (!(await bcrypt.compare(String(password), user.passwordHash))) {
      recordFail(key);
      return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
    }
    if (role && user.role !== role) {
      return res
        .status(403)
        .json({ message: `This account is registered as ${user.role}, not ${role}. Please select the ${user.role} tab.` });
    }

    attempts.delete(key);
    await logActivity({
      actor: { id: user.userId, name: user.name, role: user.role },
      action: 'Signed in',
      ip: req.ip,
    });
    res.json({ token: signToken(user), user: toPublicUser(user) });
  })
);

router.get(
  '/me',
  authenticate,
  ah(async (req, res) => {
    const user = await store.getUserById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
    res.json({ user: toPublicUser(user) });
  })
);

router.patch(
  '/me/availability',
  authenticate,
  requireRole('DELIVERY'),
  ah(async (req, res) => {
    const { availability } = req.body || {};
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      return res.status(400).json({ message: 'Availability must be AVAILABLE, BUSY, or OFFLINE.' });
    }
    try {
      const user = await store.updateDeliveryAvailability(req.user.id, availability);
      res.json({ availability: user.availability });
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Delivery partner not found.' });
      if (err.code === 'NOT_DELIVERY') return res.status(403).json({ message: 'User is not a delivery partner.' });
      throw err;
    }
  })
);

// Always succeeds so the endpoint cannot be used to discover which emails exist.
router.post('/forgot-password', (req, res) => res.json({ ok: true }));

export default router;
