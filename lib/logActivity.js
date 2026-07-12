import { prisma } from './db';

/**
 * Logs an action to the ActivityLog table.
 * 
 * @param {Object} p
 * @param {string} p.action - E.g. 'ALLOCATED', 'RETURNED', 'MAINTENANCE_RAISED'
 * @param {string} [p.assetId] - The ID of the asset this relates to
 * @param {string} [p.userId] - The ID of the user who performed the action
 * @param {string} [p.details] - Additional contextual details
 */
export async function logActivity({ action, assetId, userId, details }) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        assetId,
        userId,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
