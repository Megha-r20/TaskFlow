import { db } from './db.js';

export async function getWorkspaceMember(workspaceId, userId) {
  if (!workspaceId || !userId) return null;
  try {
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
    return member;
  } catch (error) {
    return null;
  }
}

export async function requireWorkspaceMember(workspaceId, userId) {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) {
    return null;
  }
  return member;
}

export async function requireWorkspaceAdmin(workspaceId, userId) {
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member || (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
    return null;
  }
  return member;
}

export const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
export const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const VALID_ROLES = ['ADMIN', 'MEMBER'];
