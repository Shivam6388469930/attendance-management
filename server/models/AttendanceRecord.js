import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  clock_in_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  clock_out_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'absent',
  },
  total_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  is_corrected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'AttendanceRecords',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date'],
    },
  ],
});

export default AttendanceRecord;