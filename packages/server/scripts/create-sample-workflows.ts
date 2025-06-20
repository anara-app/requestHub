import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleWorkflows = [
  {
    name: "Leave Request",
    description: "Employee leave request approval workflow",
    steps: [
      { role: "INITIATOR_SUPERVISOR", label: "Manager Approval", type: "approval" },
      { role: "HR_SPECIALIST", label: "HR Review", type: "approval" },
    ],
  },
  {
    name: "Contract Approval",
    description: "Contract review and approval process",
    steps: [
      { role: "INITIATOR_SUPERVISOR", label: "Manager Review", type: "approval" },
      { role: "LEGAL", label: "Legal Review", type: "approval" },
      { role: "CEO", label: "CEO Approval", type: "approval" },
    ],
  },
  {
    name: "Payment Request",
    description: "Payment authorization workflow",
    steps: [
      { role: "INITIATOR_SUPERVISOR", label: "Manager Approval", type: "approval" },
      { role: "FINANCE_MANAGER", label: "Finance Review", type: "approval" },
      { role: "ACCOUNTING", label: "Accountant Processing", type: "task" },
    ],
  },
  {
    name: "Procurement Request",
    description: "Purchase order approval process",
    steps: [
      { role: "INITIATOR_SUPERVISOR", label: "Manager Approval", type: "approval" },
      { role: "PROCUREMENT", label: "Procurement Review", type: "approval" },
      { role: "FINANCE_MANAGER", label: "Budget Approval", type: "approval" },
      { role: "CEO", label: "Executive Approval", type: "approval" },
    ],
  },
  {
    name: "Fuel Request (GSM)",
    description: "Vehicle fuel request workflow",
    steps: [
      { role: "INITIATOR_SUPERVISOR", label: "Manager Approval", type: "approval" },
      { role: "FINANCE_MANAGER", label: "Finance Authorization", type: "approval" },
    ],
  },
];

async function createSampleWorkflows() {
  console.log("Creating sample workflow templates...");

  try {
    // Get admin user to use as creator
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: "Admin"
        }
      }
    });

    if (!adminUser) {
      throw new Error("Admin user not found. Please run create-admin-user.ts first.");
    }

    for (const workflow of sampleWorkflows) {
      const existing = await prisma.workflowTemplate.findFirst({
        where: { name: workflow.name },
      });

      if (!existing) {
        await prisma.workflowTemplate.create({
          data: {
            name: workflow.name,
            description: workflow.description,
            steps: JSON.stringify(workflow.steps),
            isActive: true,
            createdBy: {
              connect: { id: adminUser.id }
            },
          },
        });
        console.log(`✅ Created workflow template: ${workflow.name}`);
      } else {
        console.log(`⚠️  Workflow template already exists: ${workflow.name}`);
      }
    }

    console.log("✅ Sample workflow templates created successfully!");
  } catch (error) {
    console.error("❌ Error creating workflow templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleWorkflows(); 