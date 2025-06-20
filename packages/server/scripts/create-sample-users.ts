import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

// Define the roles and their corresponding user data
const sampleUsers = [
  {
    role: "manager",
    email: "manager@g.com",
    firstName: "Manager",
    lastName: "Manager",
    password: "password",
  },
  {
    role: "ceo",
    email: "ceo@g.com",
    firstName: "CEO",
    lastName: "CEO",
    password: "password",
  },
  {
    role: "lawyer",
    email: "lawyer@g.com",
    firstName: "Lawyer",
    lastName: "Lawyer",
    password: "password",
  },
  {
    role: "finance",
    email: "finance@g.com",
    firstName: "Finance",
    lastName: "Finance",
    password: "password",
  },
  {
    role: "accountant",
    email: "accountant@g.com",
    firstName: "Accountant",
    lastName: "Accountant",
    password: "password",
  },
  {
    role: "hr",
    email: "hr@g.com",
    firstName: "HR",
    lastName: "HR",
    password: "password",
  },
];

async function createSampleUsers() {
  console.log("Creating sample users for workflow testing...");

  try {
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Find or create the role
      let role = await prisma.role.findFirst({
        where: { name: { equals: userData.role, mode: "insensitive" } },
      });

      if (!role) {
        // Create the role if it doesn't exist
        role = await prisma.role.create({
          data: {
            name: userData.role.charAt(0).toUpperCase() + userData.role.slice(1),
          },
        });
        console.log(`✅ Created role: ${role.name}`);
      }

      // Use better-auth to create the user properly
      // This will handle password hashing correctly for better-auth
      const authUser = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: `${userData.firstName} ${userData.lastName}`,
        },
      });

      if (!authUser) {
        throw new Error(`Failed to create auth user for ${userData.email}`);
      }

      // Update the user with additional fields that better-auth doesn't handle
      const user = await prisma.user.update({
        where: { email: userData.email },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          emailVerified: true,
          roleId: role.id,
        },
      });

      console.log(`✅ Created user: ${userData.email} (${role.name})`);
    }

    console.log("✅ Sample users created successfully!");
    console.log("\n📋 Login credentials for testing:");
    console.log("Email: [role]@g.com | Password: password");
    console.log("Examples:");
    sampleUsers.forEach(user => {
      console.log(`  - ${user.email} | password`);
    });

  } catch (error) {
    console.error("❌ Error creating sample users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleUsers(); 