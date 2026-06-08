import { AttendanceRecord, AttendanceRule } from '../models/index.js';

export const getAttendanceRules = async () => {
  return await AttendanceRule.findOne();
};

export const calculateTotalHours = (clockInTime, clockOutTime) => {
  if (!clockInTime || !clockOutTime) return null;
  const diffMs = new Date(clockOutTime) - new Date(clockInTime);
  return (diffMs / (1000 * 60 * 60)).toFixed(2);
};