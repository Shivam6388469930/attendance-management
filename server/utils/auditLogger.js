import { AuditLog } from '../models/index.js';

export const auditLogger = async (req, actorId, action, targetTable, targetId, oldValue, newValue) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  await AuditLog.create({
    actor_id: actorId,
    action,
    target_table: targetTable,
    target_id: targetId,
    old_value: oldValue,
    new_value: newValue,
    ip_address: ipAddress,
  });
};