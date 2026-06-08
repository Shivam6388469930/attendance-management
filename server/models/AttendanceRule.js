import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AttendanceRule = sequelize.define('AttendanceRule', {
  work_start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  work_end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  min_hours_per_day: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  late_threshold_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  break_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
  },
  overtime_threshold_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 2,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'AttendanceRules',
});

export default AttendanceRule;