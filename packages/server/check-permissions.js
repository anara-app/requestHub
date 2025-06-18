const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' },
      include: { permissions: true }
    });
    
    console.log('Admin role ID:', adminRole?.id);
    console.log('Admin permissions:', adminRole?.permissions.map(p => p.action));
    
    // Check if workflow permissions exist
    const workflowPermissions = adminRole?.permissions.filter(p => 
      p.action?.includes('WORKFLOW')
    );
    console.log('Workflow permissions:', workflowPermissions?.map(p => p.action));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions(); 