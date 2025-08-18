import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "adminuser" },
    update: {},
    create: { username: "adminuser", passwordHash: adminPasswordHash, role: Role.Admin },
  });

  // Test user
  const userPasswordHash = await bcrypt.hash("test1234", 10);
  const user = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: { username: "testuser", passwordHash: userPasswordHash },
  });

  // Test tasks for testuser
  await prisma.task.createMany({
    data: [
      { title: "First Task", description: "This is your first task", status: "pending", userId: user.id },
      { title: "Second Task", description: "Another test task", status: "completed", userId: user.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
