const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWorkflowPermissions() {
  try {
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' },
    });
    
    if (!adminRole) {
      console.log('Admin role not found');
      return;
    }
    
    const workflowPermissions = [
      'CREATE_WORKFLOW_REQUEST',
      'READ_WORKFLOW_REQUESTS', 
      'UPDATE_WORKFLOW_REQUEST',
      'DELETE_WORKFLOW_REQUEST',
      'APPROVE_WORKFLOW_REQUEST',
      'REJECT_WORKFLOW_REQUEST',
      'MANAGE_WORKFLOW_TEMPLATES'
    ];
    
    // Add each workflow permission to the admin role
    for (const permission of workflowPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          action: permission,
        },
      });
      console.log(`Added permission: ${permission}`);
    }
    
    console.log('✅ All workflow permissions added to Admin role');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWorkflowPermissions(); 