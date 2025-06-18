import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleWorkflows = [
  {
    name: "Leave Request",
    description: "Employee leave request approval workflow",
    steps: [
      { role: "manager", label: "Manager Approval", type: "approval" },
      { role: "hr", label: "HR Review", type: "approval" },
    ],
  },
  {
    name: "Contract Approval",
    description: "Contract review and approval process",
    steps: [
      { role: "manager", label: "Manager Review", type: "approval" },
      { role: "lawyer", label: "Legal Review", type: "approval" },
      { role: "ceo", label: "CEO Approval", type: "approval" },
    ],
  },
  {
    name: "Payment Request",
    description: "Payment authorization workflow",
    steps: [
      { role: "manager", label: "Manager Approval", type: "approval" },
      { role: "finance", label: "Finance Review", type: "approval" },
      { role: "accountant", label: "Accountant Processing", type: "task" },
    ],
  },
  {
    name: "Procurement Request",
    description: "Purchase order approval process",
    steps: [
      { role: "manager", label: "Manager Approval", type: "approval" },
      { role: "finance", label: "Budget Approval", type: "approval" },
      { role: "ceo", label: "Executive Approval", type: "approval" },
    ],
  },
  {
    name: "Fuel Request (GSM)",
    description: "Vehicle fuel request workflow",
    steps: [
      { role: "manager", label: "Manager Approval", type: "approval" },
      { role: "finance", label: "Finance Authorization", type: "approval" },
    ],
  },
];

async function createSampleWorkflows() {
  console.log("Creating sample workflow templates...");

  try {
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