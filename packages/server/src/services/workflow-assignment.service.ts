import { db } from "../common/prisma";

export interface WorkflowStepDefinition {
  assigneeType: "ROLE_BASED" | "DYNAMIC";
  roleBasedAssignee?: string; // Role name like "Ceo", "Finance_manager", etc.
  dynamicAssignee?: string; // Dynamic type like "INITIATOR_SUPERVISOR"
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
    if (stepDefinition.assigneeType === "DYNAMIC") {
      return await this.resolveDynamicAssignee(
        stepDefinition.dynamicAssignee!,
        initiatorId
      );
    } else if (stepDefinition.assigneeType === "ROLE_BASED") {
      return await this.resolveRoleBasedAssignee(
        stepDefinition.roleBasedAssignee!
      );
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
      case "INITIATOR_SUPERVISOR":
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
  static async resolveRoleBasedAssignee(
    roleName: string
  ): Promise<string | null> {
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
   * Diagnostic method to check what roles exist in the system
   * @returns Array of role names available in the system
   */
  static async getAvailableRoles(): Promise<string[]> {
    const roles = await db.role.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return roles.map((role: { name: string }) => role.name);
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
        if (step.assigneeType === "DYNAMIC") {
          errors.push(
            `Step ${index + 1}: No user found for dynamic assignment "${step.dynamicAssignee}"`
          );
        } else {
          errors.push(
            `Step ${index + 1}: No user found with role "${step.roleBasedAssignee}"`
          );
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

      // BUGFIX: Don't create approval records with null approverId
      if (!assigneeId) {
        const assigneeInfo =
          step.assigneeType === "DYNAMIC"
            ? `${step.assigneeType}(${step.dynamicAssignee})`
            : `${step.assigneeType}(${step.roleBasedAssignee})`;

        throw new Error(
          `Cannot resolve assignee for workflow step ${index + 1}. No user found for ${assigneeInfo}. Please ensure the required role exists and has users assigned.`
        );
      }

      // Create approval with proper schema fields
      const approval = await db.workflowApproval.create({
        data: {
          requestId,
          step: index,
          actionLabel: step.actionLabel,
          approverId: assigneeId, // Resolved user ID - guaranteed to be non-null now
          status: "PENDING",
          assigneeType: step.assigneeType,
          roleBasedAssignee: step.roleBasedAssignee,
          dynamicAssignee: step.dynamicAssignee,
        },
      });

      approvals.push(approval);
    }

    return approvals;
  }

  /**
   * Converts workflow step role to step definition format
   * @param roleName - The role name from database or dynamic assignment type
   * @param actionLabel - The action label for the step
   * @returns WorkflowStepDefinition
   */
  static convertRoleToStepDefinition(
    roleName: string,
    actionLabel: string
  ): WorkflowStepDefinition {
    // Dynamic assignments
    if (roleName === "INITIATOR_SUPERVISOR") {
      return {
        assigneeType: "DYNAMIC",
        dynamicAssignee: "INITIATOR_SUPERVISOR",
        actionLabel,
        type: "approval",
      };
    }

    // All other roles are treated as role-based assignments using the exact role name from database
    return {
      assigneeType: "ROLE_BASED",
      roleBasedAssignee: roleName,
      actionLabel,
      type: "approval",
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
      },
    }));
  }
}
