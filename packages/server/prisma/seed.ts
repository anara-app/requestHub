import { db } from "../src/common/prisma";

async function main() {
  // Create workflow templates
  const templates = [
    {
      name: "Leave Request",
      description: "Request for leave or time off",
      steps: JSON.stringify([
        { role: "manager", type: "approval", label: "Manager Approval" },
        { role: "hr", type: "approval", label: "HR Review" },
      ]),
    },
    {
      name: "Contract Approval",
      description: "Request for contract review and approval",
      steps: JSON.stringify([
        { role: "lawyer", type: "approval", label: "Legal Review" },
        { role: "finance", type: "approval", label: "Finance Review" },
        { role: "ceo", type: "approval", label: "CEO Approval" },
      ]),
    },
    {
      name: "Payment Request",
      description: "Request for payment approval",
      steps: JSON.stringify([
        { role: "manager", type: "approval", label: "Manager Approval" },
        { role: "finance", type: "approval", label: "Finance Review" },
        { role: "accountant", type: "task", label: "Payment Processing" },
      ]),
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
    },
  ];

  for (const template of templates) {
    await db.workflowTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }

  console.log("✅ Database has been seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  }); 