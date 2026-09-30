const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const demoPassword = 'password123';
const demoUsers = [
  {
    email: 'alex@taskflow.dev',
    name: 'Alex Rivera',
    role: 'ADMIN',
    workspaceRole: 'OWNER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    email: 'sarah@taskflow.dev',
    name: 'Sarah Chen',
    role: 'MEMBER',
    workspaceRole: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    email: 'marcus@taskflow.dev',
    name: 'Marcus Vance',
    role: 'MEMBER',
    workspaceRole: 'MEMBER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    email: 'elena@taskflow.dev',
    name: 'Elena Rostova',
    role: 'MEMBER',
    workspaceRole: 'MEMBER',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const users = await Promise.all(
    demoUsers.map((demoUser) =>
      prisma.user.upsert({
        where: { email: demoUser.email },
        update: {
          name: demoUser.name,
          role: demoUser.role,
          avatarUrl: demoUser.avatarUrl,
          passwordHash,
        },
        create: {
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          avatarUrl: demoUser.avatarUrl,
          passwordHash,
        },
      }),
    ),
  );

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'taskflow-demo' },
    update: {},
    create: {
      name: 'TaskFlow Demo Workspace',
      slug: 'taskflow-demo',
      description: 'Workspace for the TaskFlow demo accounts.',
      ownerId: users[0].id,
    },
  });

  await Promise.all(
    users.map((user, index) =>
      prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
        },
        update: { role: demoUsers[index].workspaceRole },
        create: {
          workspaceId: workspace.id,
          userId: user.id,
          role: demoUsers[index].workspaceRole,
        },
      }),
    ),
  );

  console.log('Demo users are ready. Their shared password is password123.');
}

main()
  .catch((error) => {
    console.error('Failed to seed demo users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });