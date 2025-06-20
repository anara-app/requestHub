import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

// Define the roles and their corresponding user data
// Note: "Manager" is not a role - it's inferred from organizational hierarchy
const sampleUsers = [
  {
    role: "ceo",
    email: "ceo@g.com",
    firstName: "John",
    lastName: "Smith",
    password: "password",
    managerRole: "ceo", // CEO manages themselves
  },
  {
    role: "operations_director",
    email: "operations@g.com",
    firstName: "Sarah",
    lastName: "Johnson",
    password: "password",
    managerRole: "ceo", // Reports to CEO
  },
  {
    role: "lawyer",
    email: "lawyer@g.com",
    firstName: "Michael",
    lastName: "Brown",
    password: "password",
    managerRole: "ceo", // Reports to CEO
  },
  {
    role: "finance_manager",
    email: "finance@g.com",
    firstName: "Emily",
    lastName: "Davis",
    password: "password",
    managerRole: "operations_director", // Reports to Operations Director
  },
  {
    role: "accountant",
    email: "accountant@g.com",
    firstName: "David",
    lastName: "Wilson",
    password: "password",
    managerRole: "finance_manager", // Reports to Finance Manager
  },
  {
    role: "hr_specialist",
    email: "hr@g.com",
    firstName: "Lisa",
    lastName: "Garcia",
    password: "password",
    managerRole: "operations_director", // Reports to Operations Director
  },
];

async function createSampleUsers() {
  console.log("Creating sample users for workflow testing...");

  try {
    // Map to store created user IDs by role for efficient lookups
    const userIdsByRole: Record<string, string> = {};

    // First pass: Create all users without manager relationships
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        userIdsByRole[userData.role] = existingUser.id;
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

      // Store the user ID by role for manager relationship setup
      userIdsByRole[userData.role] = user.id;
      console.log(`✅ Created user: ${userData.email} (${role.name}) - ID: ${user.id}`);
    }

    // Second pass: Establish manager relationships using user IDs (optimized!)
    console.log("\n🔗 Establishing manager hierarchy using user IDs...");
    for (const userData of sampleUsers) {
      if (userData.managerRole) {
        const userId = userIdsByRole[userData.role];
        const managerId = userIdsByRole[userData.managerRole];

        if (userId && managerId) {
          await prisma.user.update({
            where: { id: userId },
            data: { managerId } as any,
          });
          console.log(`✅ Set ${userData.email} manager to ${userData.managerRole} (ID: ${managerId})`);
        } else {
          console.log(`⚠️  Could not establish manager relationship for ${userData.email}`);
        }
      }
    }

    console.log("✅ Sample users created successfully with optimized user ID relationships!");
    console.log("\n📋 Login credentials for testing:");
    console.log("Email: [role]@g.com | Password: password");
    console.log("Examples:");
    sampleUsers.forEach(user => {
      const managerInfo = user.managerRole ? ` (reports to ${user.managerRole})` : ' (no manager)';
      console.log(`  - ${user.email} | password${managerInfo}`);
    });

    // Display hierarchy with actual database relationships
    console.log("\n🏢 Organization Hierarchy (using optimized DB relationships):");
    const usersWithManagers = await prisma.user.findMany({
      include: {
        role: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      } as any,
      orderBy: { firstName: 'asc' },
    });

    usersWithManagers.forEach(user => {
      const manager = (user as any).manager;
      const managerInfo = manager 
        ? ` → Manager: ${manager.firstName} ${manager.lastName} (ID: ${manager.id})` 
        : ' → No manager (Top level)';
      console.log(`👤 ${user.firstName} ${user.lastName} (ID: ${user.id})${managerInfo}`);
         });

  } catch (error) {
    console.error("❌ Error creating sample users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleUsers();
