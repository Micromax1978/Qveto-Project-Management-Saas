import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create or find Organization A
  let orgA = await prisma.organization.findFirst({
    where: { name: "Qveto Demo Organization A" },
  });

  if (!orgA) {
    orgA = await prisma.organization.create({
      data: { name: "Qveto Demo Organization A" },
    });
  }

  // Create or find Organization B
  let orgB = await prisma.organization.findFirst({
    where: { name: "Qveto Demo Organization B" },
  });

  if (!orgB) {
    orgB = await prisma.organization.create({
      data: { name: "Qveto Demo Organization B" },
    });
  }

  // Create sample users
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

  // Add users to their respective organizations
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

  // Create one workspace for each organization
  const workspaceA = await prisma.workspace.create({
    data: {
      name: "Organization A Workspace",
      organizationId: orgA.id,
    },
  });

  const workspaceB = await prisma.workspace.create({
    data: {
      name: "Organization B Workspace",
      organizationId: orgB.id,
    },
  });

  // Create one project for each organization
  const projectA = await prisma.project.create({
    data: {
      name: "Website Project A",
      organizationId: orgA.id,
      workspaceId: workspaceA.id,
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: "Website Project B",
      organizationId: orgB.id,
      workspaceId: workspaceB.id,
    },
  });

  // Create one task for each project
  await prisma.task.create({
    data: {
      title: "Design homepage",
      organizationId: orgA.id,
      projectId: projectA.id,
      assigneeId: userA.id,
      status: "TODO",
    },
  });

  await prisma.task.create({
    data: {
      title: "Build login page",
      organizationId: orgB.id,
      projectId: projectB.id,
      assigneeId: userB.id,
      status: "IN_PROGRESS",
    },
  });

  console.log("Sample data created successfully!");
  console.log("Organization A:", orgA.name);
  console.log("Organization B:", orgB.name);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });