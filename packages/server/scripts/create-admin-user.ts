import { PrismaClient, PermissionOperation } from "@prisma/client";
import * as readline from "readline";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  console.log("Creating admin user...");

  // Find or create admin role with all permissions
  let adminRole = await prisma.role.findFirst({
    where: {
      name: "Admin",
    },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "Admin",
        permissions: {
          createMany: {
            data: Object.values(PermissionOperation).map((permission) => ({
              action: permission,
            })),
          },
        },
      },
    });
    console.log("Admin role created with all permissions");
  } else {
    console.log("Using existing Admin role");
  }

  const email = await askQuestion("Enter email: ");

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error("Error: Email already in use");
    await prisma.$disconnect();
    rl.close();
    return;
  }

  const password = await askQuestion("Enter password: ");
  const firstName = await askQuestion("Enter first name: ");
  const lastName = await askQuestion("Enter last name: ");

  const body = {
    email,
    password,
    name: `${firstName} ${lastName}`,
  };

  try {
    // Use better-auth to create the user
    const response = await auth.api.signUpEmail({
      body,
    });

    const userId = response.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: adminRole.id,
      },
    });

    console.log("Admin user created successfully:", email);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdminUser();
