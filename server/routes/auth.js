// server/routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { auth, adminOnly } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, branch: user.branch, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  const { id, name, email, branch, role } = req.user;
  res.json({ id, name, email, branch, role });
});

// Create user (admin only)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, branch, role } = req.body;
    if (!name || !email || !password || !branch) return res.status(400).json({ error: 'All fields required' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, branch, role: role || 'MANAGER' }
    });
    res.json({ id: user.id, name: user.name, email: user.email, branch: user.branch, role: user.role });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// List users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, branch: true, role: true, createdAt: true } });
  res.json(users);
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
