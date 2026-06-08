import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';
import { auditLogger } from '../utils/auditLogger.js';

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user.id, name: user.name, email: user.email, role: user.Role?.name || user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

const signRefreshToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.Role?.name || user.role,
  department: user.department,
  position: user.position,
  phone: user.phone,
  employee_id: user.employee_id,
  is_active: user.is_active,
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ['name'] }],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);

    await auditLogger(req, user.id, 'login', 'Users', user.id, null, { id: user.id, email: user.email });

    res.json({
      token,
      refreshToken,
      expiresIn: 3600,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

export const logout = async (req, res) => {
  try {
    await auditLogger(req, req.user.userId, 'logout', 'Users', req.user.userId, null, null);
  } catch (_) {
    // Don't fail logout if audit log fails
  }
  res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{ model: Role, attributes: ['name'] }],
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(safeUser(user));
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Role, attributes: ['name'] }],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const newToken = signAccessToken(user);
    res.json({ token: newToken, expiresIn: 3600 });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, department, position, phone } = req.body;

    const user = await User.findByPk(userId, {
      include: [{ model: Role, attributes: ['name'] }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const oldUser = { ...user.toJSON() };
    await user.update({ name, department, position, phone });
    await auditLogger(req, userId, 'update_profile', 'Users', userId, oldUser, user.toJSON());

    res.json(safeUser(user));
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashed });
    await auditLogger(req, userId, 'change_password', 'Users', userId, null, null);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};
