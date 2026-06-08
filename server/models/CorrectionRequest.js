import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CorrectionRequest = sequelize.define('CorrectionRequest', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  attendance_record_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  request_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  corrected_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewer_remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'CorrectionRequests',
});

export default CorrectionRequest;