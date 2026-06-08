import { User, Role, AttendanceRule, AuditLog, AttendanceRecord } from '../models/index.js';
import { auditLogger } from '../utils/auditLogger.js';
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, attributes: ['id', 'name'] }],
      attributes: { exclude: ['password_hash'] },
    });
    res.json(users);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id, department, position, phone, employee_id, is_active } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role_id,
      department,
      position,
      phone,
      employee_id,
      is_active: is_active !== undefined ? is_active : true,
    });

    await auditLogger(req, req.user.userId, 'create_user', 'Users', user.id, null, user.toJSON());

    const created = await User.findByPk(user.id, {
      include: [{ model: Role, attributes: ['id', 'name'] }],
      attributes: { exclude: ['password_hash'] },
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    delete updates.email; // Email changes go through a separate verified flow

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const oldUser = { ...user.toJSON() };
    await user.update(updates);

    await auditLogger(req, req.user.userId, 'update_user', 'Users', user.id, oldUser, user.toJSON());

    const updated = await User.findByPk(id, {
      include: [{ model: Role, attributes: ['id', 'name'] }],
      attributes: { exclude: ['password_hash'] },
    });
    res.json(updated);
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await auditLogger(req, req.user.userId, 'delete_user', 'Users', user.id, user.toJSON(), null);
    await user.destroy();

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    const oldUser = { ...user.toJSON() };
    await user.update({ role_id });

    await auditLogger(req, req.user.userId, 'assign_role', 'Users', user.id, oldUser, user.toJSON());

    const updated = await User.findByPk(id, {
      include: [{ model: Role, attributes: ['id', 'name'] }],
      attributes: { exclude: ['password_hash'] },
    });
    res.json(updated);
  } catch (err) {
    console.error('assignRole error:', err);
    res.status(500).json({ error: 'Failed to assign role.' });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name'] });
    res.json(roles);
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
};

export const getRules = async (req, res) => {
  try {
    const rules = await AttendanceRule.findAll({ order: [['createdAt', 'DESC']] });
    res.json(rules);
  } catch (err) {
    console.error('getRules error:', err);
    res.status(500).json({ error: 'Failed to fetch rules.' });
  }
};

export const createRule = async (req, res) => {
  try {
    const {
      work_start_time,
      work_end_time,
      min_hours_per_day,
      late_threshold_minutes,
      break_duration_minutes,
      overtime_threshold_hours,
      is_active,
    } = req.body;

    if (!work_start_time || !work_end_time || !min_hours_per_day || late_threshold_minutes === undefined) {
      return res.status(400).json({ error: 'work_start_time, work_end_time, min_hours_per_day, and late_threshold_minutes are required.' });
    }

    const rule = await AttendanceRule.create({
      work_start_time,
      work_end_time,
      min_hours_per_day,
      late_threshold_minutes,
      break_duration_minutes,
      overtime_threshold_hours,
      is_active: is_active !== undefined ? is_active : true,
      created_by: req.user.userId,
    });

    await auditLogger(req, req.user.userId, 'create_rule', 'AttendanceRules', rule.id, null, rule.toJSON());

    res.status(201).json(rule);
  } catch (err) {
    console.error('createRule error:', err);
    res.status(500).json({ error: 'Failed to create rule.' });
  }
};

export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await AttendanceRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found.' });
    }

    const oldRule = { ...rule.toJSON() };
    await rule.update(updates);

    await auditLogger(req, req.user.userId, 'update_rule', 'AttendanceRules', rule.id, oldRule, rule.toJSON());

    res.json(rule);
  } catch (err) {
    console.error('updateRule error:', err);
    res.status(500).json({ error: 'Failed to update rule.' });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await AttendanceRule.findByPk(id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found.' });
    }

    await auditLogger(req, req.user.userId, 'delete_rule', 'AttendanceRules', rule.id, rule.toJSON(), null);
    await rule.destroy();

    res.json({ message: 'Rule deleted successfully.' });
  } catch (err) {
    console.error('deleteRule error:', err);
    res.status(500).json({ error: 'Failed to delete rule.' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200,
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });
    res.json(logs);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const records = await AttendanceRecord.findAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email', 'department', 'position'] }],
      order: [['date', 'DESC']],
    });
    res.json(records);
  } catch (err) {
    console.error('getAllAttendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance records.' });
  }
};
