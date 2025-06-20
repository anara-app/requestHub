import { db } from "../src/common/prisma";

async function main() {
  // Check if templates already exist
  const existingTemplates = await db.workflowTemplate.count();
  
  if (existingTemplates > 0) {
    console.log("✅ Workflow templates already exist, skipping seed");
    return;
  }

  // Get admin user to use as creator
  const adminUser = await db.user.findFirst({
    where: {
      role: {
        name: "Admin"
      }
    }
  });

  if (!adminUser) {
    throw new Error("Admin user not found. Please run create-admin-user.ts first.");
  }

  // Create workflow templates
  const templates = [
    {
      name: "Leave Request",
      description: "Request for leave or time off",
      steps: JSON.stringify([
        { role: "manager", type: "approval", label: "Manager Approval" },
        { role: "hr", type: "approval", label: "HR Review" },
      ]),
      createdBy: {
        connect: { id: adminUser.id }
      }
    },
    {
      name: "Contract Approval",
      description: "Request for contract review and approval",
      steps: JSON.stringify([
        { role: "lawyer", type: "approval", label: "Legal Review" },
        { role: "finance", type: "approval", label: "Finance Review" },
        { role: "ceo", type: "approval", label: "CEO Approval" },
      ]),
      createdBy: {
        connect: { id: adminUser.id }
      }
    },
    {
      name: "Payment Request",
      description: "Request for payment approval",
      steps: JSON.stringify([
        { role: "manager", type: "approval", label: "Manager Approval" },
        { role: "finance", type: "approval", label: "Finance Review" },
        { role: "accountant", type: "task", label: "Payment Processing" },
      ]),
      createdBy: {
        connect: { id: adminUser.id }
      }
    },
    {
      name: "Fuel Request (GSM)",
      description: "Request for fuel allocation",
      steps: JSON.stringify([
        { role: "manager", type: "approval", label: "Manager Approval" },
        { role: "finance", type: "approval", label: "Finance Approval" },
        { role: "ceo", type: "approval", label: "CEO Signature" },
        { role: "corporate", type: "task", label: "Fuel Issuance" },
      ]),
      createdBy: {
        connect: { id: adminUser.id }
      }
    },
  ];

  for (const template of templates) {
    await db.workflowTemplate.create({
      data: template,
    });
  }

  console.log("✅ Database has been seeded with workflow templates");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await db.$disconnect();
  }); 