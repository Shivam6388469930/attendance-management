import Role from './Role.js';
import User from './User.js';
import AttendanceRecord from './AttendanceRecord.js';
import CorrectionRequest from './CorrectionRequest.js';
import AttendanceRule from './AttendanceRule.js';
import AuditLog from './AuditLog.js';

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.hasMany(AttendanceRecord, { foreignKey: 'user_id' });
AttendanceRecord.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// Two separate User associations on CorrectionRequest require aliases
User.hasMany(CorrectionRequest, { foreignKey: 'user_id', as: 'EmployeeRequests' });
CorrectionRequest.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(CorrectionRequest, { foreignKey: 'reviewed_by', as: 'ReviewedRequests' });
CorrectionRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'Reviewer' });

AttendanceRecord.hasMany(CorrectionRequest, { foreignKey: 'attendance_record_id' });
CorrectionRequest.belongsTo(AttendanceRecord, { foreignKey: 'attendance_record_id' });

User.hasMany(AttendanceRule, { foreignKey: 'created_by' });
AttendanceRule.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(AuditLog, { foreignKey: 'actor_id' });
AuditLog.belongsTo(User, { foreignKey: 'actor_id' });

export {
  Role,
  User,
  AttendanceRecord,
  CorrectionRequest,
  AttendanceRule,
  AuditLog,
};
