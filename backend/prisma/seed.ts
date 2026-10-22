
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create or find the two demo organizations
  const orgA = await prisma.organization.upsert({
    where: {
      id: "11111111-1111-4111-8111-111111111111",
    },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Qveto Demo Organization A",
    },
  });

  const orgB = await prisma.organization.upsert({
    where: {
      id: "22222222-2222-4222-8222-222222222222",
    },
    update: {},
    create: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Qveto Demo Organization B",
    },
  });

  // 2. Create or find demo users
  const userA = await prisma.user.upsert({
    where: { email: "alice.orga@example.com" },
    update: {},
    create: {
      name: "Alice Demo",
      email: "alice.orga@example.com",
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: "bob.orgb@example.com" },
    update: {},
    create: {
      name: "Bob Demo",
      email: "bob.orgb@example.com",
    },
  });

  // 3. Add users to their respective organizations
  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: orgA.id,
        userId: userA.id,
      },
    },
    update: {},
    create: {
      organizationId: orgA.id,
      userId: userA.id,
      role: "OWNER",
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: orgB.id,
        userId: userB.id,
      },
    },
    update: {},
    create: {
      organizationId: orgB.id,
      userId: userB.id,
      role: "OWNER",
    },
  });

  // 4. Create or find workspaces
  let workspaceA = await prisma.workspace.findFirst({
    where: {
      organizationId: orgA.id,
      name: "Organization A Workspace",
    },
  });

  if (!workspaceA) {
    workspaceA = await prisma.workspace.create({
      data: {
        name: "Organization A Workspace",
        organizationId: orgA.id,
      },
    });
  }

  let workspaceB = await prisma.workspace.findFirst({
    where: {
      organizationId: orgB.id,
      name: "Organization B Workspace",
    },
  });

  if (!workspaceB) {
    workspaceB = await prisma.workspace.create({
      data: {
        name: "Organization B Workspace",
        organizationId: orgB.id,
      },
    });
  }

  // 5. Create or find projects
  let projectA = await prisma.project.findFirst({
    where: {
      organizationId: orgA.id,
      name: "Website Project A",
    },
  });

  if (!projectA) {
    projectA = await prisma.project.create({
      data: {
        name: "Website Project A",
        organizationId: orgA.id,
        workspaceId: workspaceA.id,
      },
    });
  }

  let projectB = await prisma.project.findFirst({
    where: {
      organizationId: orgB.id,
      name: "Website Project B",
    },
  });

  if (!projectB) {
    projectB = await prisma.project.create({
      data: {
        name: "Website Project B",
        organizationId: orgB.id,
        workspaceId: workspaceB.id,
      },
    });
  }

  // 6. Add users to their respective projects
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: projectA.id,
        userId: userA.id,
      },
    },
    update: {},
    create: {
      projectId: projectA.id,
      userId: userA.id,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: projectB.id,
        userId: userB.id,
      },
    },
    update: {},
    create: {
      projectId: projectB.id,
      userId: userB.id,
    },
  });

  // 7. Create tasks only when they do not already exist
  const taskA = await prisma.task.findFirst({
    where: {
      projectId: projectA.id,
      title: "Design homepage",
    },
  });

  if (!taskA) {
    await prisma.task.create({
      data: {
        title: "Design homepage",
        organizationId: orgA.id,
        projectId: projectA.id,
        assigneeId: userA.id,
        status: "TODO",
        priority: "HIGH",
      },
    });
  }

  const taskB = await prisma.task.findFirst({
    where: {
      projectId: projectB.id,
      title: "Build login page",
    },
  });

  if (!taskB) {
    await prisma.task.create({
      data: {
        title: "Build login page",
        organizationId: orgB.id,
        projectId: projectB.id,
        assigneeId: userB.id,
        status: "IN_PROGRESS",
        priority: "MEDIUM",
      },
    });
  }

  console.log("Sample data is ready!");
  console.log("Organization A:", orgA.name);
  console.log("Organization B:", orgB.name);
  console.log("Each organization has its own demo user and project.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
