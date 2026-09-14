import { z } from 'zod';

// ID Schema
export const idSchema = z.string().min(1, 'ID is required');

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
});

// Workspace & Project Schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  description: z.string().optional(),
});

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  name: z.string().min(2, 'Project name required'),
  key: z.string().min(2, 'Project key required').max(10),
  description: z.string().optional(),
  color: z.string().optional(),
});

// Task Schema
export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID required'),
  title: z.string().min(1, 'Task title required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

// Docs, Goals, Time Entries Schemas
export const createDocSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  title: z.string().min(1, 'Title required'),
  category: z.string().default('General'),
  content: z.string().min(1, 'Content required'),
});

export const createGoalSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  title: z.string().min(1, 'Title required'),
  quarter: z.string().default('Q3 2026'),
  keyResults: z
    .array(
      z.object({
        title: z.string().min(1),
        current: z.number().default(0),
        target: z.number().default(100),
        unit: z.string().default('%'),
      })
    )
    .optional(),
});

export const createTimeEntrySchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID required'),
  taskTitle: z.string().min(1, 'Task title required'),
  projectName: z.string().default('General Project'),
  durationMinutes: z.number().positive(),
  hourlyRate: z.number().nonnegative().default(75),
  billable: z.boolean().default(true),
  taskId: z.string().nullable().optional(),
});

// Webhook Config Schema
export const webhookConfigSchema = z.object({
  slackUrl: z.string().url().nullable().optional().or(z.literal('')),
  discordUrl: z.string().url().nullable().optional().or(z.literal('')),
});

// Helper validator function
export function validateBody(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const errorMsg = issues.map((e) => e.message).join(', ');
    return { error: errorMsg, data: null };
  }
  return { error: null, data: result.data };
}
