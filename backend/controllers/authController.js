const jwt = require('jsonwebtoken');
const xss = require('xss');
const User = require('../models/User');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const sanitizeEmail = (email) => xss(email.trim().toLowerCase());

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Missing fields' });

    const cleanEmail = sanitizeEmail(email);

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser)
      return res.status(409).json({ message: 'Email already in use' });

    const newUser = await User.create({
      name: xss(name.trim()),
      email: cleanEmail,
      password,
    });

    const token = generateToken(newUser);
    return res.json({ token, user: formatUserResponse(newUser) });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Missing fields' });

    const cleanEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({ token, user: formatUserResponse(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login };
