import bcrypt from 'bcrypt';
import { Role, User, AttendanceRecord, CorrectionRequest, AttendanceRule } from '../models/index.js';

export async function up() {
  // Roles — findOrCreate makes this safe to run multiple times
  const [employee] = await Role.findOrCreate({ where: { name: 'employee' } });
  const [hr]       = await Role.findOrCreate({ where: { name: 'hr' } });
  const [admin]    = await Role.findOrCreate({ where: { name: 'admin' } });

  const passwordHash = bcrypt.hashSync('Test@1234', 10);

  const [emp] = await User.findOrCreate({
    where: { email: 'emp@test.com' },
    defaults: { name: 'Employee User', password_hash: passwordHash, role_id: employee.id, department: 'Engineering' },
  });
  const [hrUser] = await User.findOrCreate({
    where: { email: 'hr@test.com' },
    defaults: { name: 'HR User', password_hash: passwordHash, role_id: hr.id, department: 'HR' },
  });
  const [adminUser] = await User.findOrCreate({
    where: { email: 'admin@test.com' },
    defaults: { name: 'Admin User', password_hash: passwordHash, role_id: admin.id, department: 'Admin' },
  });

  await AttendanceRule.findOrCreate({
    where: { created_by: adminUser.id },
    defaults: {
      work_start_time: '09:00:00',
      work_end_time: '17:00:00',
      min_hours_per_day: 8,
      late_threshold_minutes: 15,
      created_by: adminUser.id,
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  await AttendanceRecord.findOrCreate({
    where: { user_id: emp.id, date: yesterday },
    defaults: {
      clock_in_time: `${yesterday} 08:55:00`,
      clock_out_time: `${yesterday} 17:10:00`,
      status: 'present',
      total_hours: 8.25,
    },
  });

  const [todayRecord] = await AttendanceRecord.findOrCreate({
    where: { user_id: emp.id, date: today },
    defaults: {
      clock_in_time: `${today} 09:05:00`,
      status: 'present',
    },
  });

  await CorrectionRequest.findOrCreate({
    where: { user_id: emp.id, date: today, request_type: 'missed_out' },
    defaults: {
      attendance_record_id: todayRecord.id,
      corrected_time: `${today} 17:00:00`,
      reason: 'Forgot to clock out',
      status: 'pending',
    },
  });

  console.log('Seeded: roles, users, attendance rule, sample records.');
}

export async function down() {
  await CorrectionRequest.destroy({ truncate: true, cascade: true });
  await AttendanceRecord.destroy({ truncate: true, cascade: true });
  await AttendanceRule.destroy({ truncate: true, cascade: true });
  await User.destroy({ truncate: true, cascade: true });
  await Role.destroy({ truncate: true, cascade: true });
}
