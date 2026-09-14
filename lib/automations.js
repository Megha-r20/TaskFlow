import { db } from '@/lib/db';

/**
 * Runs active workspace automation rules triggered when a task's status changes.
 */
export async function runTaskAutomations({ taskId, previousStatus, newStatus, workspaceId, actorId }) {
  if (!taskId || !newStatus || previousStatus === newStatus) return [];

  try {
    // 1. Fetch task details & project workspace ID if not provided
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: true,
      },
    });

    if (!task) return [];
    const wsId = workspaceId || task.project.workspaceId;

    // 2. Query enabled status-change automation rules for this workspace
    const rules = await db.automationRule.findMany({
      where: {
        workspaceId: wsId,
        enabled: true,
        triggerType: 'STATUS_CHANGE',
        triggerValue: newStatus,
      },
    });

    if (rules.length === 0) return [];

    const results = [];

    // 3. Execute matched rules
    for (const rule of rules) {
      if (rule.actionType === 'AUTO_ASSIGN') {
        const targetUserId = rule.actionValue;
        if (!targetUserId) continue;

        // Skip if task is already assigned to target user
        if (task.assigneeId === targetUserId) continue;

        const targetUser = await db.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, name: true },
        });

        if (!targetUser) continue;

        // Update task assignee
        await db.task.update({
          where: { id: taskId },
          data: { assigneeId: targetUserId },
        });

        // Create Activity Log
        const logDetails = `⚡ Automation "${rule.name}" triggered: Auto-assigned task to ${targetUser.name}`;
        await db.activityLog.create({
          data: {
            workspaceId: wsId,
            projectId: task.projectId,
            taskId: task.id,
            userId: actorId || task.creatorId,
            action: 'AUTOMATION_TRIGGERED',
            details: logDetails,
          },
        });

        // Send Notification to newly assigned member
        await db.notification.create({
          data: {
            userId: targetUserId,
            type: 'TASK_ASSIGNED',
            title: '⚡ Task Auto-Assigned',
            message: `Task "${task.title}" was automatically assigned to you via workspace rule "${rule.name}".`,
            linkUrl: `/projects/${task.projectId}?task=${task.id}`,
          },
        });

        results.push({ ruleId: rule.id, name: rule.name, action: 'AUTO_ASSIGN', targetUser: targetUser.name });
      }
    }

    return results;
  } catch (err) {
    console.error('Run task automations error:', err);
    return [];
  }
}
