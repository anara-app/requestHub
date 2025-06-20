import { db } from "../common/prisma";
import { WorkflowRole } from "@prisma/client";

export class WorkflowAssignmentService {
  /**
   * Resolves the actual user ID for a workflow step based on the role and initiator
   * @param stepRole - The workflow role from the template
   * @param initiatorId - The ID of the user who initiated the request
   * @returns The user ID who should handle this step, or null if no one found
   */
  static async resolveStepAssignee(
    stepRole: WorkflowRole,
    initiatorId: string
  ): Promise<string | null> {
    // Handle dynamic manager resolution
    if (stepRole === "MANAGER") {
      return await this.resolveManagerForUser(initiatorId);
    }

    // Handle initiator supervisor resolution
    if (stepRole === "INITIATOR_SUPERVISOR") {
      return await this.resolveManagerForUser(initiatorId);
    }

    // For other roles, find users with matching role names
    return await this.resolveUserByRole(stepRole);
  }

  /**
   * Finds the manager for a given user
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
   * Finds a user with a specific role
   * @param role - The workflow role to find
   * @returns A user ID with that role, or null if none found
   */
  static async resolveUserByRole(role: WorkflowRole): Promise<string | null> {
    // Map workflow roles to system role names
    const roleMapping: Partial<Record<WorkflowRole, string[]>> = {
      CEO: ["CEO", "ceo"],
      LEGAL: ["Lawyer", "lawyer", "legal"],
      PROCUREMENT: ["Procurement", "procurement"],
      FINANCE_MANAGER: ["Finance", "finance", "Finance Manager"],
      ACCOUNTING: ["Accountant", "accountant", "accounting"],
      HR_SPECIALIST: ["HR", "hr", "HR Specialist"],
      SYSTEM_AUTOMATION: ["System", "system", "automation"],
      SECURITY_REVIEW: ["Security", "security"],
      SECURITY_GUARD: ["Security Guard", "guard"],
      INDUSTRIAL_SAFETY: ["Safety", "safety", "industrial safety"],
      MANAGER: ["Manager", "manager"],
      FINANCE: ["Finance", "finance"],
      INITIATOR_SUPERVISOR: [], // Handled separately
    };

    const possibleRoleNames = roleMapping[role] || [];
    
    if (possibleRoleNames.length === 0) {
      return null;
    }

    // Find user with matching role
    const user = await db.user.findFirst({
      where: {
        role: {
          name: {
            in: possibleRoleNames,
            mode: "insensitive",
          },
        },
      },
    });

    return user?.id || null;
  }

  /**
   * Validates that a workflow request can be processed
   * Ensures the initiator has required relationships (like a manager)
   * @param templateSteps - The workflow template steps
   * @param initiatorId - The initiator's user ID
   * @returns Validation result with any error messages
   */
  static async validateWorkflowRequest(
    templateSteps: any[],
    initiatorId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if any step requires a manager and if the initiator has one
    const requiresManager = templateSteps.some(
      (step) => step.role === "MANAGER" || step.role === "INITIATOR_SUPERVISOR"
    );

    if (requiresManager) {
      const manager = await this.resolveManagerForUser(initiatorId);
      if (!manager) {
        errors.push("Initiator does not have an assigned manager");
      }
    }

    // Check if all required roles can be resolved
    for (const step of templateSteps) {
      const assignee = await this.resolveStepAssignee(step.role, initiatorId);
      if (!assignee) {
        errors.push(`No user found for role: ${step.role}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
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
} 