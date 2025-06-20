import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define permissions for each role
const rolePermissions = {
  Admin: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS", 
    "UPDATE_WORKFLOW_REQUEST",
    "DELETE_WORKFLOW_REQUEST",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
    "MANAGE_WORKFLOW_TEMPLATES",
  ],
  Manager: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
  ],
  Ceo: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST", 
    "REJECT_WORKFLOW_REQUEST",
  ],
  Lawyer: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
  ],
  Finance: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
  ],
  Accountant: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
  ],
  Hr: [
    "CREATE_WORKFLOW_REQUEST",
    "READ_WORKFLOW_REQUESTS",
    "APPROVE_WORKFLOW_REQUEST",
    "REJECT_WORKFLOW_REQUEST",
  ],
};

async function assignWorkflowPermissions() {
  console.log("Assigning workflow permissions to roles...");

  try {
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      // Find the role
      const role = await prisma.role.findFirst({
        where: { name: { equals: roleName, mode: "insensitive" } },
        include: { permissions: true },
      });

      if (!role) {
        console.log(`⚠️  Role not found: ${roleName}`);
        continue;
      }

      // Get existing permission actions for this role
      const existingPermissions = role.permissions.map(p => p.action).filter(Boolean);

      // Add missing permissions
      for (const permission of permissions) {
        if (!existingPermissions.includes(permission as any)) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              action: permission as any,
              description: `${permission.replace(/_/g, ' ').toLowerCase()} permission`,
            },
          });
          console.log(`✅ Added ${permission} to ${roleName}`);
        } else {
          console.log(`⚠️  ${roleName} already has ${permission}`);
        }
      }
    }

    console.log("✅ Workflow permissions assigned successfully!");
    
    // Display summary
    console.log("\n📋 Permission Summary:");
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      console.log(`\n${roleName}:`);
      permissions.forEach(permission => {
        console.log(`  - ${permission}`);
      });
    }

  } catch (error) {
    console.error("❌ Error assigning permissions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

assignWorkflowPermissions(); 