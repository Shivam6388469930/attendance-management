import { AttendanceRecord, AttendanceRule } from '../models/index.js';
import { auditLogger } from '../utils/auditLogger.js';

export const clockIn = async (req, res) => {
  try {
    const { userId } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const existingRecord = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });

    if (existingRecord && existingRecord.clock_in_time) {
      return res.status(409).json({ error: 'Already clocked in today.' });
    }

    const record = existingRecord
      ? await existingRecord.update({ clock_in_time: new Date(), status: 'present' })
      : await AttendanceRecord.create({
          user_id: userId,
          date: today,
          clock_in_time: new Date(),
          status: 'present',
        });

    await auditLogger(req, userId, 'clock_in', 'AttendanceRecords', record.id, null, record.toJSON());

    res.json(record);
  } catch (err) {
    console.error('clockIn error:', err);
    res.status(500).json({ error: 'Failed to clock in.' });
  }
};

export const clockOut = async (req, res) => {
  try {
    const { userId } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const record = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });

    if (!record || !record.clock_in_time) {
      return res.status(400).json({ error: 'No clock-in record found for today. Please clock in first.' });
    }
    if (record.clock_out_time) {
      return res.status(400).json({ error: 'Already clocked out.' });
    }

    const clockOutTime = new Date();
    if (clockOutTime <= record.clock_in_time) {
      return res.status(400).json({ error: 'Clock-out time must be after clock-in time.' });
    }

    const totalHours = (clockOutTime - record.clock_in_time) / (1000 * 60 * 60);
    await record.update({ clock_out_time: clockOutTime, total_hours: totalHours.toFixed(2) });

    await auditLogger(req, userId, 'clock_out', 'AttendanceRecords', record.id, null, record.toJSON());

    res.json(record);
  } catch (err) {
    console.error('clockOut error:', err);
    res.status(500).json({ error: 'Failed to clock out.' });
  }
};

export const getToday = async (req, res) => {
  try {
    const { userId } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const record = await AttendanceRecord.findOne({
      where: { user_id: userId, date: today },
    });

    // Return null explicitly so the client can distinguish "no record" from an error
    res.json(record || null);
  } catch (err) {
    console.error('getToday error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s record.' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const records = await AttendanceRecord.findAndCountAll({
      where: { user_id: userId },
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // Response shape: { count, rows } - matches what client expects (response.data.rows)
    res.json(records);
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
};
