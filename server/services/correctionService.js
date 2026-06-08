import { CorrectionRequest, AttendanceRecord } from '../models/index.js';

export const canRequestCorrection = async (userId, date, requestType) => {
  const existingRequest = await CorrectionRequest.findOne({
    where: {
      user_id: userId,
      date,
      request_type: requestType,
      status: 'pending',
    },
  });
  return !existingRequest;
};