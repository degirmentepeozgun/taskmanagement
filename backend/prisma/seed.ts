import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Test user
  const passwordHash = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: { username: "testuser", passwordHash },
  });

  // Test tasks
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