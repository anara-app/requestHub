import { PrismaClient } from "@prisma/client";
import { WorkflowAssignmentService } from "../src/services/workflow-assignment.service";

const prisma = new PrismaClient();

async function testNewWorkflowSystem() {
  console.log("🧪 Testing New Flexible Workflow Assignment System...\n");

  try {
    // Get a test user (accountant)
    const testUser = await prisma.user.findFirst({
      where: { email: "accountant@g.com" },
      include: {
        manager: true,
        role: true,
      } as any,
    });

    if (!testUser) {
      console.log("❌ Test user (accountant@g.com) not found.");
      return;
    }

    console.log(`📋 Testing with user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    console.log(`   Role: ${(testUser as any).role?.name}`);
    console.log(`   Manager: ${(testUser as any).manager ? `${(testUser as any).manager.firstName} ${(testUser as any).manager.lastName}` : 'None'}\n`);

    // Test 1: Role-based assignment
    console.log("1️⃣ Testing role-based assignments...");
    const roleBasedTests = [
      { roleName: 'Ceo', description: 'CEO' },
      { roleName: 'Finance_manager', description: 'Finance Manager' },
      { roleName: 'Accountant', description: 'Accountant' },
      { roleName: 'NonExistent', description: 'Non-existent role' },
    ];

    for (const test of roleBasedTests) {
      const userId = await WorkflowAssignmentService.resolveRoleBasedAssignee(test.roleName);
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true, email: true },
        });
        console.log(`   ✅ ${test.description}: ${user?.firstName} ${user?.lastName} (${user?.email})`);
      } else {
        console.log(`   ❌ ${test.description}: No user found`);
      }
    }
    console.log();

    // Test 2: Dynamic assignment
    console.log("2️⃣ Testing dynamic assignments...");
    const managerId = await WorkflowAssignmentService.resolveDynamicAssignee('INITIATOR_SUPERVISOR', testUser.id);
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { firstName: true, lastName: true, email: true },
      });
      console.log(`   ✅ INITIATOR_SUPERVISOR: ${manager?.firstName} ${manager?.lastName} (${manager?.email})`);
    } else {
      console.log(`   ❌ INITIATOR_SUPERVISOR: No manager found`);
    }
    console.log();

    // Test 3: Step definition resolution
    console.log("3️⃣ Testing step definition resolution...");
    const stepDefinitions = [
      {
        assigneeType: 'DYNAMIC' as const,
        dynamicAssignee: 'INITIATOR_SUPERVISOR',
        actionLabel: 'Manager Approval',
        type: 'approval',
      },
      {
        assigneeType: 'ROLE_BASED' as const,
        roleBasedAssignee: 'Finance_manager',
        actionLabel: 'Finance Review',
        type: 'approval',
      },
      {
        assigneeType: 'ROLE_BASED' as const,
        roleBasedAssignee: 'Ceo',
        actionLabel: 'CEO Approval',
        type: 'approval',
      },
    ];

    for (const stepDef of stepDefinitions) {
      const assigneeId = await WorkflowAssignmentService.resolveStepAssignee(stepDef, testUser.id);
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { firstName: true, lastName: true, email: true },
        });
        const assigneeType = stepDef.assigneeType === 'DYNAMIC' ? stepDef.dynamicAssignee : stepDef.roleBasedAssignee;
        console.log(`   ✅ ${assigneeType}: ${assignee?.firstName} ${assignee?.lastName} (${assignee?.email})`);
      } else {
        const assigneeType = stepDef.assigneeType === 'DYNAMIC' ? stepDef.dynamicAssignee : stepDef.roleBasedAssignee;
        console.log(`   ❌ ${assigneeType}: No assignee found`);
      }
    }
    console.log();

    // Test 4: Workflow validation
    console.log("4️⃣ Testing workflow validation...");
    const validation = await WorkflowAssignmentService.validateWorkflowRequest(stepDefinitions, testUser.id);
    if (validation.isValid) {
      console.log("   ✅ Workflow validation passed!");
    } else {
      console.log("   ❌ Workflow validation failed:");
      validation.errors.forEach(error => console.log(`      - ${error}`));
    }
    console.log();

    // Test 5: Legacy role conversion
    console.log("5️⃣ Testing legacy role conversion...");
    const legacyRoles = ['INITIATOR_SUPERVISOR', 'CEO', 'FINANCE_MANAGER', 'ACCOUNTING'];
    
    for (const legacyRole of legacyRoles) {
      const stepDef = WorkflowAssignmentService.convertLegacyRoleToStepDefinition(legacyRole, `${legacyRole} Approval`);
      console.log(`   ${legacyRole} → ${stepDef.assigneeType === 'DYNAMIC' ? `DYNAMIC(${stepDef.dynamicAssignee})` : `ROLE_BASED(${stepDef.roleBasedAssignee})`}`);
    }

    console.log("\n✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Error running tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewWorkflowSystem(); 