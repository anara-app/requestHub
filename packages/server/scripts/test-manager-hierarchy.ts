import { PrismaClient } from "@prisma/client";
import { WorkflowAssignmentService } from "../src/services/workflow-assignment.service";

const prisma = new PrismaClient();

async function testManagerHierarchy() {
  console.log("🧪 Testing Manager Hierarchy System...\n");

  try {
    // Get a user to test with
    const testUser = await prisma.user.findFirst({
      where: { email: "accountant@g.com" },
      include: {
        manager: true,
        role: true,
      } as any,
    });

    if (!testUser) {
      console.log("❌ Test user (accountant@g.com) not found. Please run create-sample-users first.");
      return;
    }

    console.log(`📋 Testing with user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    console.log(`   Role: ${(testUser as any).role?.name}`);
    console.log(`   Manager: ${(testUser as any).manager ? `${(testUser as any).manager.firstName} ${(testUser as any).manager.lastName}` : 'None'}\n`);

    // Test 1: Get user hierarchy
    console.log("1️⃣ Testing getUserHierarchy...");
    const hierarchy = await WorkflowAssignmentService.getUserHierarchy(testUser.id);
    console.log("   Hierarchy chain:");
    hierarchy.forEach((user, index) => {
      const indent = "   " + "  ".repeat(index);
      console.log(`${indent}${index === 0 ? "👤" : "👔"} ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log();

    // Test 2: Resolve manager for user
    console.log("2️⃣ Testing resolveManagerForUser...");
    const managerId = await WorkflowAssignmentService.resolveManagerForUser(testUser.id);
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { firstName: true, lastName: true, email: true },
      });
      console.log(`   ✅ Manager found: ${manager?.firstName} ${manager?.lastName} (${manager?.email})`);
    } else {
      console.log(`   ⚠️  No manager found for this user`);
    }
    console.log();

    // Test 3: Test workflow role resolution
    console.log("3️⃣ Testing resolveStepAssignee for different roles...");
    const testRoles = ["MANAGER", "INITIATOR_SUPERVISOR", "CEO", "FINANCE"];
    
    for (const role of testRoles) {
      try {
        const assigneeId = await WorkflowAssignmentService.resolveStepAssignee(role as any, testUser.id);
        if (assigneeId) {
          const assignee = await prisma.user.findUnique({
            where: { id: assigneeId },
            select: { firstName: true, lastName: true, email: true, role: { select: { name: true } } },
          });
          console.log(`   ✅ ${role}: ${assignee?.firstName} ${assignee?.lastName} (${assignee?.email}) - ${assignee?.role?.name}`);
        } else {
          console.log(`   ❌ ${role}: No assignee found`);
        }
      } catch (error) {
        console.log(`   ❌ ${role}: Error - ${error}`);
      }
    }
    console.log();

    // Test 4: Validate a sample workflow
    console.log("4️⃣ Testing workflow validation...");
    const sampleWorkflowSteps = [
      { role: "MANAGER", label: "Manager Approval", type: "approval" },
      { role: "FINANCE", label: "Finance Review", type: "approval" },
      { role: "CEO", label: "CEO Approval", type: "approval" },
    ];

    const validation = await WorkflowAssignmentService.validateWorkflowRequest(
      sampleWorkflowSteps,
      testUser.id
    );

    if (validation.isValid) {
      console.log("   ✅ Workflow validation passed!");
    } else {
      console.log("   ❌ Workflow validation failed:");
      validation.errors.forEach(error => console.log(`      - ${error}`));
    }
    console.log();

    // Test 5: Show organization structure
    console.log("5️⃣ Organization Structure:");
    const allUsers = await prisma.user.findMany({
      include: {
        role: true,
        manager: true,
        subordinates: true,
      } as any,
      orderBy: { firstName: "asc" },
    });

    // Find root users (no manager)
    const rootUsers = allUsers.filter(user => !(user as any).manager);
    
    function printUserTree(user: any, indent = "") {
      console.log(`${indent}👤 ${user.firstName} ${user.lastName} (${user.email}) - ${(user as any).role?.name || 'No Role'}`);
      const subordinates = allUsers.filter(u => (u as any).manager?.id === user.id);
      subordinates.forEach((sub, index) => {
        const isLast = index === subordinates.length - 1;
        const newIndent = indent + (isLast ? "   " : "│  ");
        const prefix = isLast ? "└─ " : "├─ ";
        console.log(`${indent}${prefix}👤 ${sub.firstName} ${sub.lastName} (${sub.email}) - ${(sub as any).role?.name || 'No Role'}`);
        
        // Recursively print subordinates
        const subSubordinates = allUsers.filter(u => (u as any).manager?.id === sub.id);
        subSubordinates.forEach((subSub, subIndex) => {
          const subIsLast = subIndex === subSubordinates.length - 1;
          const subNewIndent = newIndent + (subIsLast ? "   " : "│  ");
          const subPrefix = subIsLast ? "└─ " : "├─ ";
          console.log(`${newIndent}${subPrefix}👤 ${subSub.firstName} ${subSub.lastName} (${subSub.email}) - ${(subSub as any).role?.name || 'No Role'}`);
        });
      });
    }

    rootUsers.forEach(rootUser => {
      printUserTree(rootUser);
      console.log();
    });

    console.log("✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Error running tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testManagerHierarchy(); 