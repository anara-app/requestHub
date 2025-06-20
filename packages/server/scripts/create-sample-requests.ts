import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createSampleRequests() {
  console.log("Creating sample workflow requests...");

  try {
    // Get users and templates - use operations director as sample initiator
    const initiatorUser = await prisma.user.findFirst({
      where: { role: { name: "Operations_director" } }
    });

    const managerUser = await prisma.user.findFirst({
      where: { role: { name: "Operations_director" } }
    });

    const templates = await prisma.workflowTemplate.findMany({
      take: 3
    });

    if (!initiatorUser || !managerUser || templates.length === 0) {
      throw new Error("Required users or templates not found. Please run other seed scripts first.");
    }

    // Sample requests data
    const sampleRequests = [
      {
        title: "Annual Leave Request - December",
        description: "Requesting 5 days annual leave for holiday vacation in December",
        templateId: templates[0].id,
        initiatorId: initiatorUser.id,
        data: JSON.stringify({
          startDate: "2024-12-23",
          endDate: "2024-12-27",
          reason: "Family holiday vacation",
          leaveDays: 5
        })
      },
      {
        title: "Software License Contract",
        description: "Contract approval for new software development tools",
        templateId: templates[1].id,
        initiatorId: initiatorUser.id,
        data: JSON.stringify({
          vendor: "JetBrains s.r.o.",
          amount: "$2,500",
          duration: "12 months",
          type: "Software License"
        })
      },
      {
        title: "Marketing Campaign Payment",
        description: "Payment request for Q1 digital marketing campaign",
        templateId: templates[2].id,
        initiatorId: initiatorUser.id,
        data: JSON.stringify({
          vendor: "Digital Marketing Agency",
          amount: "$15,000",
          purpose: "Q1 Digital Marketing Campaign",
          invoiceNumber: "INV-2024-001"
        })
      }
    ];

    // Create requests
    for (const requestData of sampleRequests) {
      // Check if request already exists
      const existing = await prisma.workflowRequest.findFirst({
        where: { title: requestData.title }
      });

      if (!existing) {
        // Create the request
        const request = await prisma.workflowRequest.create({
          data: requestData
        });

        // Get template steps to create initial approval
        const template = await prisma.workflowTemplate.findUnique({
          where: { id: requestData.templateId }
        });

        if (template) {
          const steps = JSON.parse(template.steps as string);
          const firstStep = steps[0];

          // Create first approval record
          await prisma.workflowApproval.create({
            data: {
              requestId: request.id,
              step: 0,
              role: firstStep.role === "manager" ? "INITIATOR_SUPERVISOR" : "HR_SPECIALIST",
              actionLabel: firstStep.label,
              status: "PENDING"
            }
          });

          // Create audit trail
          await prisma.workflowAuditTrail.create({
            data: {
              requestId: request.id,
              userId: initiatorUser.id,
              action: "REQUEST_CREATED",
              description: `Request created: ${requestData.title}`
            }
          });
        }

        console.log(`✅ Created workflow request: ${requestData.title}`);
      } else {
        console.log(`⚠️  Workflow request already exists: ${requestData.title}`);
      }
    }

    console.log("✅ Sample workflow requests created successfully!");
    
    // Show summary
    const totalRequests = await prisma.workflowRequest.count();
    const pendingRequests = await prisma.workflowRequest.count({
      where: { status: "PENDING" }
    });
    
    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Workflow Requests: ${totalRequests}`);
    console.log(`   Pending Requests: ${pendingRequests}`);

  } catch (error) {
    console.error("❌ Error creating sample requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleRequests(); 