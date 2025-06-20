import { db } from "../common/prisma";

export interface WorkflowStepDefinition {
  assigneeType: 'ROLE_BASED' | 'DYNAMIC';
  roleBasedAssignee?: string;  // Role name like "Ceo", "Finance_manager", etc.
  dynamicAssignee?: string;    // Dynamic type like "INITIATOR_SUPERVISOR"
  actionLabel: string;
  type: string;
}

export class WorkflowAssignmentService {
  /**
   * Resolves the actual user ID for a workflow step based on the assignment type
   * @param stepDefinition - The workflow step definition
   * @param initiatorId - The ID of the user who initiated the request
   * @returns The user ID who should handle this step, or null if no one found
   */
  static async resolveStepAssignee(
    stepDefinition: WorkflowStepDefinition,
    initiatorId: string
  ): Promise<string | null> {
    if (stepDefinition.assigneeType === 'DYNAMIC') {
      return await this.resolveDynamicAssignee(stepDefinition.dynamicAssignee!, initiatorId);
    } else if (stepDefinition.assigneeType === 'ROLE_BASED') {
      return await this.resolveRoleBasedAssignee(stepDefinition.roleBasedAssignee!);
    }
    
    return null;
  }

  /**
   * Resolves dynamic assignments based on relationships
   * @param dynamicType - The type of dynamic assignment (e.g., "INITIATOR_SUPERVISOR")
   * @param initiatorId - The initiator's user ID
   * @returns The resolved user ID or null
   */
  static async resolveDynamicAssignee(
    dynamicType: string,
    initiatorId: string
  ): Promise<string | null> {
    switch (dynamicType) {
      case 'INITIATOR_SUPERVISOR':
        return await this.resolveManagerForUser(initiatorId);
      
      // Add more dynamic types here as needed
      // case 'INITIATOR_DEPARTMENT_HEAD':
      //   return await this.resolveDepartmentHeadForUser(initiatorId);
      
      default:
        console.warn(`Unknown dynamic assignee type: ${dynamicType}`);
        return null;
    }
  }

  /**
   * Resolves role-based assignments by finding users with specific roles
   * @param roleName - The role name to find (e.g., "Ceo", "Finance_manager")
   * @returns A user ID with that role, or null if none found
   */
  static async resolveRoleBasedAssignee(roleName: string): Promise<string | null> {
    const user = await db.user.findFirst({
      where: {
        role: {
          name: {
            equals: roleName,
            mode: "insensitive",
          },
        },
      },
    });

    return user?.id || null;
  }

  /**
   * Finds the manager for a given user (for dynamic assignments)
   * @param userId - The user ID to find the manager for
   * @returns The manager's user ID, or null if no manager found
   */
  static async resolveManagerForUser(userId: string): Promise<string | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        manager: true,
      } as any,
    });

    return (user as any)?.manager?.id || null;
  }

  /**
   * Validates that a workflow request can be processed
   * Ensures all steps can be resolved to actual users
   * @param stepDefinitions - The workflow step definitions
   * @param initiatorId - The initiator's user ID
   * @returns Validation result with any error messages
   */
  static async validateWorkflowRequest(
    stepDefinitions: WorkflowStepDefinition[],
    initiatorId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const [index, step] of stepDefinitions.entries()) {
      const assignee = await this.resolveStepAssignee(step, initiatorId);
      if (!assignee) {
        if (step.assigneeType === 'DYNAMIC') {
          errors.push(`Step ${index + 1}: No user found for dynamic assignment "${step.dynamicAssignee}"`);
        } else {
          errors.push(`Step ${index + 1}: No user found with role "${step.roleBasedAssignee}"`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates workflow approval records for a request
   * @param requestId - The workflow request ID
   * @param stepDefinitions - The workflow step definitions
   * @param initiatorId - The initiator's user ID
   * @returns Array of created approval records
   */
  static async createWorkflowApprovals(
    requestId: string,
    stepDefinitions: WorkflowStepDefinition[],
    initiatorId: string
  ): Promise<any[]> {
    const approvals = [];

    for (const [index, step] of stepDefinitions.entries()) {
      const assigneeId = await this.resolveStepAssignee(step, initiatorId);
      
      // Temporarily create approvals with minimal data until schema is fully synced
      const approval = await db.workflowApproval.create({
        data: {
          requestId,
          step: index,
          actionLabel: step.actionLabel,
          approverId: assigneeId, // Resolved user ID
          status: "PENDING",
        } as any,
      });

      approvals.push(approval);
    }

    return approvals;
  }

  /**
   * Converts legacy workflow role to new step definition format
   * @param legacyRole - The old WorkflowRole enum value
   * @param actionLabel - The action label for the step
   * @returns WorkflowStepDefinition
   */
  static convertLegacyRoleToStepDefinition(
    legacyRole: string,
    actionLabel: string
  ): WorkflowStepDefinition {
    // Dynamic assignments
    if (legacyRole === 'INITIATOR_SUPERVISOR') {
      return {
        assigneeType: 'DYNAMIC',
        dynamicAssignee: 'INITIATOR_SUPERVISOR',
        actionLabel,
        type: 'approval',
      };
    }

    // Role-based assignments - map to actual system role names
    const roleMapping: Record<string, string> = {
      'CEO': 'Ceo',
      'LEGAL': 'Lawyer',
      'PROCUREMENT': 'Procurement',
      'FINANCE_MANAGER': 'Finance_manager',
      'ACCOUNTING': 'Accountant',
      'HR_SPECIALIST': 'Hr_specialist',
      'SYSTEM_AUTOMATION': 'System',
      'SECURITY_REVIEW': 'Security',
      'SECURITY_GUARD': 'Security Guard',
      'INDUSTRIAL_SAFETY': 'Safety',
    };

    const mappedRole = roleMapping[legacyRole];
    if (mappedRole) {
      return {
        assigneeType: 'ROLE_BASED',
        roleBasedAssignee: mappedRole,
        actionLabel,
        type: 'approval',
      };
    }

    // Fallback - treat as role-based with the role name as-is
    console.warn(`Unknown legacy role: ${legacyRole}, treating as role-based`);
    return {
      assigneeType: 'ROLE_BASED',
      roleBasedAssignee: legacyRole,
      actionLabel,
      type: 'approval',
    };
  }

  /**
   * Gets the hierarchy path for a user (useful for display)
   * @param userId - The user ID
   * @returns Array of users from the given user up to the top of hierarchy
   */
  static async getUserHierarchy(userId: string): Promise<any[]> {
    const hierarchy: any[] = [];
    let currentUserId: string | null = userId;

    while (currentUserId) {
      const user: any = await db.user.findUnique({
        where: { id: currentUserId },
        include: {
          role: true,
          manager: true,
        } as any,
      });

      if (!user) break;

      hierarchy.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role?.name,
      });

      currentUserId = user.manager?.id || null;
    }

    return hierarchy;
  }

  /**
   * Gets pending approvals for a specific user
   * @param userId - The user ID to get approvals for
   * @returns Array of workflow requests with pending approvals for this user
   */
  static async getPendingApprovalsForUser(userId: string): Promise<any[]> {
    const approvals = await db.workflowApproval.findMany({
      where: {
        approverId: userId,
        status: "PENDING",
      },
      include: {
        request: {
          include: {
            initiator: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            template: {
              select: {
                name: true,
                steps: true, // Include steps for frontend
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match frontend expectations
    return approvals.map((approval: any) => ({
      ...approval.request,
      // Add approval-specific info if needed
      currentApproval: {
        id: approval.id,
        step: approval.step,
        actionLabel: approval.actionLabel,
        assigneeType: approval.assigneeType,
        roleBasedAssignee: approval.roleBasedAssignee,
        dynamicAssignee: approval.dynamicAssignee,
      }
    }));
  }
} 