import { Container, Paper, Text, Badge, Group, Stack, Button, Textarea, Card, Timeline, Divider, Alert } from "@mantine/core";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { trpc } from "../../../common/trpc";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import AuditTrail from "../../../components/AuditTrail";
import { CheckCircle, XCircle, Clock, MessageCircle, ArrowLeft, User } from "lucide-react";
import PageTitle from "../../../components/PageTitle";
import { Trans, useLingui } from "@lingui/react/macro";

export default function WorkflowRequestPage() {
  const { t } = useLingui();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: request, isLoading, refetch } = trpc.admin.workflows.getRequestById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: userPermissions } = trpc.admin.users.getMyPermissions.useQuery();
  const { data: currentUser } = trpc.admin.users.getMe.useQuery();
  const { data: auditTrail, isLoading: auditTrailLoading, refetch: refetchAuditTrail } = trpc.admin.workflows.getAuditTrail.useQuery(
    { requestId: id! },
    { enabled: !!id }
  );

  const refetchAll = () => {
    refetch();
    refetchAuditTrail();
  };

  const approveRequestMutation = trpc.admin.workflows.approveRequest.useMutation({
    onSuccess: () => {
      notifications.show({
        title: t`Success`,
        message: t`Request approved successfully`,
        color: "green",
      });
      refetchAll();
      setActionType(null);
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: t`Error`,
        message: error.message || t`Failed to approve request`,
        color: "red",
      });
    },
  });

  const rejectRequestMutation = trpc.admin.workflows.rejectRequest.useMutation({
    onSuccess: () => {
      notifications.show({
        title: t`Success`,
        message: t`Request rejected successfully`,
        color: "green",
      });
      refetchAll();
      setActionType(null);
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: t`Error`,
        message: error.message || t`Failed to reject request`,
        color: "red",
      });
    },
  });

  const addCommentMutation = trpc.admin.workflows.addComment.useMutation({
    onSuccess: () => {
      notifications.show({
        title: t`Success`,
        message: t`Comment added successfully`,
        color: "green",
      });
      refetchAll();
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: t`Error`,
        message: error.message || t`Failed to add comment`,
        color: "red",
      });
    },
  });

  const commentForm = useForm({
    initialValues: {
      comment: "",
    },
    validate: {
      comment: (value: string) => (value.length < 1 ? t`Comment is required` : null),
    },
  });

  if (isLoading || !currentUser) {
    return <LoadingPlaceholder />;
  }

  if (!request) {
    return (
      <Container size="xl" my="lg">
        <PageTitle><Trans>Request Not Found</Trans></PageTitle>
        <Text><Trans>The requested workflow request could not be found.</Trans></Text>
        <Button mt="md" onClick={() => navigate(-1)}>
          <Trans>Go Back</Trans>
        </Button>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "gray";
      case "PENDING": return "yellow";
      case "IN_PROGRESS": return "blue";
      case "APPROVED": return "green";
      case "REJECTED": return "red";
      case "CANCELLED": return "gray";
      default: return "gray";
    }
  };

  const canUserApprove = () => {
    if (!request || !userPermissions || !currentUser) return false;
    
    // Check if user has approval permission
    if (!userPermissions.includes("APPROVE_WORKFLOW_REQUEST" as any)) return false;
    
    // Check if request is in a state that allows approval
    if (!["PENDING", "IN_PROGRESS"].includes(request.status)) return false;
    
    // NEW SYSTEM: Check if user is directly assigned to approve this request
    // Look for a pending approval where this user is the assignee (approverId)
    const userAssignedApproval = request.approvals.find(
      (approval: any) => 
        approval.approverId === currentUser.id && 
        approval.status === "PENDING" &&
        approval.step === request.currentStep
    );
    
    // If user is directly assigned to this approval, they can approve
    if (userAssignedApproval) return true;
    
    // Special case: Admin can approve any step (fallback)
    if (currentUser.role?.name?.toLowerCase() === "admin") return true;
    
    return false;
  };

  const handleApproval = (approve: boolean) => {
    const comment = commentForm.values.comment;
    
    if (approve) {
      approveRequestMutation.mutate({
        requestId: request.id,
        comment: comment || undefined,
      });
    } else {
      rejectRequestMutation.mutate({
        requestId: request.id,
        comment: comment || undefined,
      });
    }
  };

  const handleAddComment = (values: { comment: string }) => {
    addCommentMutation.mutate({
      requestId: request.id,
      text: values.comment,
    });
  };

  // Parse template steps safely
  let templateSteps: any[] = [];
  let currentStep: any = null;
  
  try {
    templateSteps = JSON.parse(request.template.steps as any);
    currentStep = templateSteps[request.currentStep];
  } catch (error) {
    console.error("Error parsing template steps:", error);
    templateSteps = [];
  }

  // Helper function to get step display info (handles both old and new formats)
  const getStepDisplayInfo = (step: any, stepIndex?: number) => {
    // New format
    if (step.assigneeType) {
      let assignee: string;
      
      if (step.assigneeType === 'ROLE_BASED') {
        // For role-based, just show the role name
        assignee = step.roleBasedAssignee || 'Unknown role';
      } else {
        // For dynamic assignments, try to show the resolved person's name
        if (typeof stepIndex === 'number') {
          // Find the approval for this step to get the resolved assignee
          const approval = request.approvals.find((a: any) => a.step === stepIndex);
          if (approval?.approver) {
            const fullName = `${approval.approver.firstName || ''} ${approval.approver.lastName || ''}`.trim();
            assignee = fullName || (approval.approver as any).email;
          } else {
            // Show the dynamic assignment type if no resolved person yet
            assignee = step.dynamicAssignee === 'INITIATOR_SUPERVISOR' 
              ? t`Initiator's Supervisor`
              : step.dynamicAssignee || t`Unknown assignment`;
          }
        } else {
          assignee = step.dynamicAssignee === 'INITIATOR_SUPERVISOR' 
            ? t`Initiator's Supervisor`
            : step.dynamicAssignee || t`Unknown assignment`;
        }
      }
      
      const label = step.actionLabel || t`Approval`;
      return { assignee, label };
    }
    
    // Old format (backward compatibility)
    if (step.role && step.label) {
      return { assignee: step.role, label: step.label };
    }
    
    // Fallback
    return { assignee: t`Unknown`, label: t`Approval` };
  };

  return (
    <Container size="xl" my="lg">
      <Group mb="lg">
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
          <Trans>Back to Requests</Trans>
        </Button>
      </Group>

      <PageTitle>
        {request.title}
      </PageTitle>

      <Stack gap="lg">
        {/* Request Overview */}
        <Paper shadow="sm" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}><Trans>Request Details</Trans></Text>
            <Badge color={getStatusColor(request.status)} variant="light" size="lg">
              {request.status}
            </Badge>
          </Group>

          <Stack gap="sm">
            <Group>
              <Text fw={500}><Trans>Template:</Trans></Text>
              <Text>{request.template.name}</Text>
            </Group>
            <Group>
              <Text fw={500}><Trans>Initiated by:</Trans></Text>
              <Text>{request.initiator.firstName} {request.initiator.lastName}</Text>
            </Group>
            <Group>
              <Text fw={500}><Trans>Current Step:</Trans></Text>
              <Text><Trans>{request.currentStep + 1} of {templateSteps.length}</Trans></Text>
              {currentStep && (() => {
                const { assignee, label } = getStepDisplayInfo(currentStep, request.currentStep);
                return <Text c="dimmed">({assignee} - {label})</Text>;
              })()}
            </Group>
            <Group>
              <Text fw={500}><Trans>Created:</Trans></Text>
              <Text>{new Date(request.createdAt).toLocaleString()}</Text>
            </Group>
          </Stack>

          {request.description && (
            <>
              <Divider my="md" />
              <Text fw={500} mb="xs"><Trans>Description:</Trans></Text>
              <Text>{request.description}</Text>
            </>
          )}

          {request.data && Object.keys(request.data as any).length > 0 && (
            <>
              <Divider my="md" />
              <Text fw={500} mb="xs"><Trans>Request Data:</Trans></Text>
              <Paper bg="gray.0" p="sm" radius="sm">
                {Object.entries(request.data as any).map(([key, value]: [string, any]) => (
                  <Group key={key} justify="space-between">
                    <Text size="sm" fw={500} tt="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                    <Text size="sm">{String(value)}</Text>
                  </Group>
                ))}
              </Paper>
            </>
          )}
        </Paper>

        {/* Workflow Progress */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text size="lg" fw={500} mb="md"><Trans>Workflow Progress</Trans></Text>
          
          <Timeline active={request.currentStep} bulletSize={24} lineWidth={2}>
            {templateSteps.map((step: any, index: number) => {
              // Find the most recent approval for this step (in case of duplicates)
              const stepApprovals = request.approvals.filter((a: any) => a.step === index);
              const approval = stepApprovals.length > 0 
                ? stepApprovals.reduce((latest, current) => 
                    new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
                  )
                : null;
              const isActive = index === request.currentStep && request.status !== "APPROVED" && request.status !== "REJECTED";
              const isCompleted = index < request.currentStep || approval?.status === "APPROVED";
              
              // Determine status based on completion and approval
              let stepStatus = 'not-started';
              let bullet = <User size={16} />;
              let color = 'gray';
              
              if (isCompleted) {
                stepStatus = 'completed';
                bullet = <CheckCircle size={16} />;
                color = 'green';
              } else if (approval?.status === "REJECTED") {
                stepStatus = 'rejected';
                bullet = <XCircle size={16} />;
                color = 'red';
              } else if (isActive) {
                stepStatus = 'active';
                bullet = <Clock size={16} />;
                color = 'blue';
              }
              
              const { assignee, label } = getStepDisplayInfo(step, index);
              
              return (
                <Timeline.Item 
                  key={index}
                  bullet={bullet}
                  title={`${assignee} - ${label}`}
                  color={color}
                >
                  <Text size="sm" c="dimmed">
                    {stepStatus === 'completed' && approval?.comment && (
                      <Trans>Approved: {approval.comment}</Trans>
                    )}
                    {stepStatus === 'completed' && !approval?.comment && <Trans>Completed</Trans>}
                    {stepStatus === 'rejected' && approval?.comment && (
                      <Trans>Rejected: {approval.comment}</Trans>
                    )}
                    {stepStatus === 'rejected' && !approval?.comment && <Trans>Rejected</Trans>}
                    {stepStatus === 'active' && <Trans>Pending approval</Trans>}
                    {stepStatus === 'not-started' && <Trans>Not started</Trans>}
                  </Text>
                  {approval?.approver && (
                    <Text size="xs" c="dimmed">
                      <Trans>by {approval.approver.firstName} {approval.approver.lastName}</Trans>
                    </Text>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Paper>

        {/* Action Buttons */}
        {canUserApprove() && (
          <Paper shadow="sm" p="lg" withBorder>
            <Text size="lg" fw={500} mb="md"><Trans>Take Action</Trans></Text>
            
            {!actionType ? (
              <Group>
                <Button 
                  color="green" 
                  leftSection={<CheckCircle size={16} />}
                  onClick={() => setActionType("approve")}
                >
                  <Trans>Approve</Trans>
                </Button>
                <Button 
                  color="red" 
                  leftSection={<XCircle size={16} />}
                  onClick={() => setActionType("reject")}
                >
                  <Trans>Reject</Trans>
                </Button>
              </Group>
            ) : (
              <form onSubmit={commentForm.onSubmit(() => handleApproval(actionType === "approve"))}>
                <Stack gap="md">
                  <Alert color={actionType === "approve" ? "green" : "red"}>
                    <Trans>You are about to {actionType} this request. Please provide a comment explaining your decision.</Trans>
                  </Alert>
                  
                  <Textarea
                    label={t`Comment (Optional)`}
                    placeholder={t`Add a comment about your decision...`}
                    {...commentForm.getInputProps("comment")}
                  />
                  
                  <Group>
                    <Button 
                      type="submit"
                      color={actionType === "approve" ? "green" : "red"}
                      loading={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                    >
                      {actionType === "approve" ? <Trans>Confirm Approval</Trans> : <Trans>Confirm Rejection</Trans>}
                    </Button>
                    <Button variant="subtle" onClick={() => setActionType(null)}>
                      <Trans>Cancel</Trans>
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}
          </Paper>
        )}

        {/* Comments Section */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text size="lg" fw={500} mb="md"><Trans>Comments</Trans></Text>
          
          {/* Add Comment Form */}
          <form onSubmit={commentForm.onSubmit(handleAddComment)}>
            <Stack gap="md">
              <Textarea
                placeholder={t`Add a comment...`}
                {...commentForm.getInputProps("comment")}
              />
              <Group justify="flex-end">
                <Button 
                  type="submit" 
                  leftSection={<MessageCircle size={16} />}
                  loading={addCommentMutation.isPending}
                  disabled={!commentForm.values.comment.trim()}
                >
                  <Trans>Add Comment</Trans>
                </Button>
              </Group>
            </Stack>
          </form>

          <Divider my="md" />

          {/* Comments List */}
          {request.comments && request.comments.length > 0 ? (
            <Stack gap="md">
              {request.comments.map((comment: any) => (
                <Card key={comment.id} withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={500}>
                      {comment.author.firstName} {comment.author.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(comment.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                  <Text size="sm">{comment.text}</Text>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              <Trans>No comments yet</Trans>
            </Text>
          )}
        </Paper>

        {/* Audit Trail */}
        <AuditTrail auditTrail={auditTrail || []} isLoading={auditTrailLoading} />
      </Stack>
    </Container>
  );
} 