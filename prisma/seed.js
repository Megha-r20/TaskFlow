const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskFlow seed script...');

  // Clean database
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const alex = await prisma.user.create({
    data: {
      email: 'alex@taskflow.dev',
      name: 'Alex Rivera',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'ADMIN',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@taskflow.dev',
      name: 'Sarah Chen',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'MEMBER',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus@taskflow.dev',
      name: 'Marcus Vance',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'MEMBER',
    },
  });

  const elena = await prisma.user.create({
    data: {
      email: 'elena@taskflow.dev',
      name: 'Elena Rostova',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'MEMBER',
    },
  });

  console.log('✅ Created 4 seed users.');

  // Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme NextGen SaaS',
      slug: 'acme-saas',
      description: 'Primary engineering workspace for core SaaS application scaling & features.',
      ownerId: alex.id,
    },
  });

  // Add Memberships
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: alex.id, role: 'OWNER' },
      { workspaceId: workspace.id, userId: sarah.id, role: 'ADMIN' },
      { workspaceId: workspace.id, userId: marcus.id, role: 'MEMBER' },
      { workspaceId: workspace.id, userId: elena.id, role: 'MEMBER' },
    ],
  });

  // Create Workspace Labels
  const labelFrontend = await prisma.label.create({
    data: { workspaceId: workspace.id, name: 'Frontend', color: '#3b82f6' },
  });
  const labelBackend = await prisma.label.create({
    data: { workspaceId: workspace.id, name: 'Backend', color: '#8b5cf6' },
  });
  const labelUI = await prisma.label.create({
    data: { workspaceId: workspace.id, name: 'UI/UX', color: '#ec4899' },
  });
  const labelBug = await prisma.label.create({
    data: { workspaceId: workspace.id, name: 'Bug', color: '#ef4444' },
  });
  const labelSec = await prisma.label.create({
    data: { workspaceId: workspace.id, name: 'Security', color: '#f97316' },
  });

  // Create Projects
  const projectMobile = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Mobile App v2.0 Redesign',
      key: 'MOB',
      description: 'Complete native revamp of iOS & Android clients with unified design token system.',
      status: 'ACTIVE',
      color: '#6366f1',
    },
  });

  const projectPayment = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Payment Gateway Integration',
      key: 'PAY',
      description: 'Stripe Billing v3 migration, localized pricing currencies, and multi-tier subscription engine.',
      status: 'ACTIVE',
      color: '#10b981',
    },
  });

  const projectInfra = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Infrastructure & Security Audit',
      key: 'SEC',
      description: 'Zero-trust network implementation, rate limiting, and automated vulnerability scanning.',
      status: 'PLANNING',
      color: '#f59e0b',
    },
  });

  // Assign members to projects
  await prisma.projectMember.createMany({
    data: [
      { projectId: projectMobile.id, userId: alex.id, role: 'LEAD' },
      { projectId: projectMobile.id, userId: sarah.id, role: 'MEMBER' },
      { projectId: projectMobile.id, userId: elena.id, role: 'MEMBER' },
      { projectId: projectPayment.id, userId: sarah.id, role: 'LEAD' },
      { projectId: projectPayment.id, userId: marcus.id, role: 'MEMBER' },
      { projectId: projectInfra.id, userId: marcus.id, role: 'LEAD' },
      { projectId: projectInfra.id, userId: alex.id, role: 'MEMBER' },
    ],
  });

  // Seed Tasks for Mobile App v2.0
  const t1 = await prisma.task.create({
    data: {
      projectId: projectMobile.id,
      title: 'Design Dark Mode Color Palette Tokens',
      description: 'Establish standard contrast ratios (WCAG AAA) for dark neutral background states.',
      status: 'DONE',
      priority: 'HIGH',
      order: 0,
      creatorId: alex.id,
      assigneeId: elena.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelUI.id }] },
    },
  });

  const t2 = await prisma.task.create({
    data: {
      projectId: projectMobile.id,
      title: 'Implement Touch Gesture Animations in Kanban',
      description: 'Smooth haptic drag preview when re-ordering task cards on mobile viewports.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      order: 1,
      creatorId: alex.id,
      assigneeId: sarah.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelFrontend.id }, { labelId: labelUI.id }] },
    },
  });

  const t3 = await prisma.task.create({
    data: {
      projectId: projectMobile.id,
      title: 'Optimize Image Compression Pipeline',
      description: 'Reduce avatar load latency by generating WebP thumbnails on S3 uploads.',
      status: 'TODO',
      priority: 'LOW',
      order: 2,
      creatorId: sarah.id,
      assigneeId: marcus.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelBackend.id }] },
    },
  });

  // Seed Tasks for Payment Gateway
  const t4 = await prisma.task.create({
    data: {
      projectId: projectPayment.id,
      title: 'Setup Stripe Webhook Event Listeners',
      description: 'Handle customer.subscription.updated and invoice.payment_failed idempotently.',
      status: 'REVIEW',
      priority: 'HIGH',
      order: 0,
      creatorId: sarah.id,
      assigneeId: marcus.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelBackend.id }, { labelId: labelSec.id }] },
    },
  });

  const t5 = await prisma.task.create({
    data: {
      projectId: projectPayment.id,
      title: 'Fix Currency Formatting Bug in Checkout Modal',
      description: 'JPY and KRW non-decimal currencies were showing invalid floating point zeros.',
      status: 'DONE',
      priority: 'URGENT',
      order: 1,
      creatorId: marcus.id,
      assigneeId: alex.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelBug.id }, { labelId: labelFrontend.id }] },
    },
  });

  const t6 = await prisma.task.create({
    data: {
      projectId: projectPayment.id,
      title: 'Build Tiered Subscription Upgrade Modal',
      description: 'Allow workspace owners to seamlessly switch plan tiers with proration feedback.',
      status: 'TODO',
      priority: 'MEDIUM',
      order: 2,
      creatorId: sarah.id,
      assigneeId: sarah.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: { create: [{ labelId: labelFrontend.id }] },
    },
  });

  // Seed Comments
  await prisma.comment.create({
    data: {
      taskId: t4.id,
      userId: sarah.id,
      content: 'Great work @Marcus Vance! The signature verification handling looks rock solid.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: t4.id,
      userId: marcus.id,
      content: 'Thanks @Sarah Chen! Added unit test coverage for signature failures as well.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: t2.id,
      userId: alex.id,
      content: 'Please verify gesture response time under 60fps on low-tier devices.',
    },
  });

  // Seed Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        projectId: projectMobile.id,
        taskId: t2.id,
        userId: sarah.id,
        action: 'UPDATED_STATUS',
        details: 'Moved task "Implement Touch Gesture Animations in Kanban" to In Progress',
      },
      {
        workspaceId: workspace.id,
        projectId: projectPayment.id,
        taskId: t4.id,
        userId: marcus.id,
        action: 'COMMENTED',
        details: 'Commented on "Setup Stripe Webhook Event Listeners"',
      },
      {
        workspaceId: workspace.id,
        projectId: projectMobile.id,
        taskId: t1.id,
        userId: elena.id,
        action: 'COMPLETED_TASK',
        details: 'Completed task "Design Dark Mode Color Palette Tokens"',
      },
    ],
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: 'MENTIONED',
        title: 'Mentioned in Payment Gateway',
        message: 'Sarah Chen mentioned you in task PAY-4 (Setup Stripe Webhook Event Listeners)',
        linkUrl: `/projects/${projectPayment.id}?task=${t4.id}`,
        isRead: false,
      },
      {
        userId: alex.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: 'Marcus Vance assigned you to Fix Currency Formatting Bug',
        linkUrl: `/projects/${projectPayment.id}?task=${t5.id}`,
        isRead: true,
      },
      {
        userId: sarah.id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: 'Alex Rivera assigned you to Implement Touch Gesture Animations',
        linkUrl: `/projects/${projectMobile.id}?task=${t2.id}`,
        isRead: false,
      },
    ],
  });

  console.log('🚀 Seed database execution finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
