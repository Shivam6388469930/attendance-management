import { CorrectionRequest, AttendanceRecord, User } from '../models/index.js';
import { auditLogger } from '../utils/auditLogger.js';

export const createCorrectionRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { attendance_record_id, request_type, date, corrected_time, reason } = req.body;

    const existingRequest = await CorrectionRequest.findOne({
      where: { user_id: userId, date, request_type, status: 'pending' },
    });

    if (existingRequest) {
      return res.status(409).json({ error: 'A pending correction request already exists for this date and type.' });
    }

    const request = await CorrectionRequest.create({
      user_id: userId,
      attendance_record_id,
      request_type,
      date,
      corrected_time,
      reason,
    });

    await auditLogger(req, userId, 'create_correction_request', 'CorrectionRequests', request.id, null, request.toJSON());

    res.json(request);
  } catch (err) {
    console.error('createCorrectionRequest error:', err);
    res.status(500).json({ error: 'Failed to create correction request.' });
  }
};

export const getMyCorrections = async (req, res) => {
  try {
    const { userId } = req.user;
    const requests = await CorrectionRequest.findAll({
      where: { user_id: userId },
      include: [{ model: AttendanceRecord }],
      order: [['createdAt', 'DESC']],
    });

    res.json(requests);
  } catch (err) {
    console.error('getMyCorrections error:', err);
    res.status(500).json({ error: 'Failed to fetch correction requests.' });
  }
};

export const getAllCorrections = async (req, res) => {
  try {
    const requests = await CorrectionRequest.findAll({
      include: [
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'department'] },
        { model: AttendanceRecord },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(requests);
  } catch (err) {
    console.error('getAllCorrections error:', err);
    res.status(500).json({ error: 'Failed to fetch correction requests.' });
  }
};

export const approveCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_remarks } = req.body;
    const { userId } = req.user;

    const request = await CorrectionRequest.findByPk(id, {
      include: [{ model: AttendanceRecord }],
    });

    if (!request) {
      return res.status(404).json({ error: 'Correction request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${request.status}.` });
    }

    const record = request.AttendanceRecord;
    if (!record) {
      return res.status(400).json({ error: 'Associated attendance record not found.' });
    }

    const oldRecord = { ...record.toJSON() };
    const oldRequest = { ...request.toJSON() };

    // Use request.request_type (the stored type), not req.body.request_type
    const fieldToUpdate =
      request.request_type === 'missed_in' || request.request_type === 'wrong_in'
        ? 'clock_in_time'
        : 'clock_out_time';

    await request.update({ status: 'approved', reviewed_by: userId, reviewer_remarks });
    await record.update({
      [fieldToUpdate]: request.corrected_time,
      total_hours: calculateTotalHours(
        fieldToUpdate === 'clock_in_time' ? request.corrected_time : record.clock_in_time,
        fieldToUpdate === 'clock_out_time' ? request.corrected_time : record.clock_out_time
      ),
      is_corrected: true,
    });

    await auditLogger(req, userId, 'approve_correction', 'CorrectionRequests', request.id, oldRequest, request.toJSON());
    await auditLogger(req, userId, 'update_attendance_record', 'AttendanceRecords', record.id, oldRecord, record.toJSON());

    res.json(request);
  } catch (err) {
    console.error('approveCorrection error:', err);
    res.status(500).json({ error: 'Failed to approve correction request.' });
  }
};

export const rejectCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_remarks } = req.body;
    const { userId } = req.user;

    const request = await CorrectionRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: 'Correction request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${request.status}.` });
    }

    const oldRequest = { ...request.toJSON() };
    await request.update({ status: 'rejected', reviewed_by: userId, reviewer_remarks });

    await auditLogger(req, userId, 'reject_correction', 'CorrectionRequests', request.id, oldRequest, request.toJSON());

    res.json(request);
  } catch (err) {
    console.error('rejectCorrection error:', err);
    res.status(500).json({ error: 'Failed to reject correction request.' });
  }
};

function calculateTotalHours(inTime, outTime) {
  if (!inTime || !outTime) return null;
  const diffMs = new Date(outTime) - new Date(inTime);
  return (diffMs / (1000 * 60 * 60)).toFixed(2);
}
