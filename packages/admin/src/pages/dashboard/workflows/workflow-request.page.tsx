import { Container, Title, Paper, Text, Badge, Group, Stack, Button, Textarea, Card, Timeline, Divider, Alert } from "@mantine/core";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { trpc } from "../../../common/trpc";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import { CheckCircle, XCircle, Clock, MessageCircle, ArrowLeft, User } from "lucide-react";

export default function WorkflowRequestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: request, isLoading, refetch } = trpc.admin.workflows.getRequestById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: userPermissions } = trpc.admin.users.getMyPermissions.useQuery();
  const { data: currentUser } = trpc.admin.users.getMe.useQuery();

  const approveRequestMutation = trpc.admin.workflows.approveRequest.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Request approved successfully",
        color: "green",
      });
      refetch();
      setActionType(null);
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to approve request",
        color: "red",
      });
    },
  });

  const rejectRequestMutation = trpc.admin.workflows.rejectRequest.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Request rejected successfully",
        color: "green",
      });
      refetch();
      setActionType(null);
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to reject request",
        color: "red",
      });
    },
  });

  const addCommentMutation = trpc.admin.workflows.addComment.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Comment added successfully",
        color: "green",
      });
      refetch();
      commentForm.reset();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to add comment",
        color: "red",
      });
    },
  });

  const commentForm = useForm({
    initialValues: {
      comment: "",
    },
    validate: {
      comment: (value: string) => (value.length < 1 ? "Comment is required" : null),
    },
  });

  if (isLoading || !currentUser) {
    return <LoadingPlaceholder />;
  }

  if (!request) {
    return (
      <Container size="xl">
        <Title order={1} mb="lg">
          Request Not Found
        </Title>
        <Text>The requested workflow request could not be found.</Text>
        <Button mt="md" onClick={() => navigate(-1)}>
          Go Back
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
    
    // Parse template steps
    let templateSteps: any[] = [];
    try {
      templateSteps = JSON.parse(request.template.steps as string);
    } catch (error) {
      console.error("Error parsing template steps:", error);
      return false;
    }
    
    // Get current step from template
    const currentStepTemplate = templateSteps[request.currentStep];
    if (!currentStepTemplate) return false;
    
    // Check if there's a pending approval for current step
    const currentStepApproval = request.approvals.find(
      approval => approval.step === request.currentStep && approval.status === "PENDING"
    );
    
    if (!currentStepApproval) return false;
    
    // Check if user's role matches the required role for this step
    const userRoleName = currentUser.role?.name?.toLowerCase();
    const requiredRole = currentStepTemplate.role?.toLowerCase();
    
    // Special case: Admin can approve any step
    if (userRoleName === "admin") return true;
    
    // Check if user's role matches the step requirement
    return userRoleName === requiredRole;
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
    templateSteps = JSON.parse(request.template.steps as string);
    currentStep = templateSteps[request.currentStep];
  } catch (error) {
    console.error("Error parsing template steps:", error);
    templateSteps = [];
  }

  return (
    <Container size="xl">
      <Group mb="lg">
        <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
          Back to Requests
        </Button>
      </Group>

      <Title order={1} mb="lg">
        {request.title}
      </Title>

      <Stack gap="lg">
        {/* Request Overview */}
        <Paper shadow="sm" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={500}>Request Details</Text>
            <Badge color={getStatusColor(request.status)} variant="light" size="lg">
              {request.status}
            </Badge>
          </Group>

          <Stack gap="sm">
            <Group>
              <Text fw={500}>Template:</Text>
              <Text>{request.template.name}</Text>
            </Group>
            <Group>
              <Text fw={500}>Initiated by:</Text>
              <Text>{request.initiator.firstName} {request.initiator.lastName}</Text>
            </Group>
            <Group>
              <Text fw={500}>Current Step:</Text>
              <Text>{request.currentStep + 1} of {templateSteps.length}</Text>
              {currentStep && <Text c="dimmed">({currentStep.role} - {currentStep.label})</Text>}
            </Group>
            <Group>
              <Text fw={500}>Created:</Text>
              <Text>{new Date(request.createdAt).toLocaleString()}</Text>
            </Group>
          </Stack>

          {request.description && (
            <>
              <Divider my="md" />
              <Text fw={500} mb="xs">Description:</Text>
              <Text>{request.description}</Text>
            </>
          )}

          {request.data && Object.keys(request.data).length > 0 && (
            <>
              <Divider my="md" />
              <Text fw={500} mb="xs">Request Data:</Text>
              <Paper bg="gray.0" p="sm" radius="sm">
                {Object.entries(request.data).map(([key, value]: [string, any]) => (
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
          <Text size="lg" fw={500} mb="md">Workflow Progress</Text>
          
          <Timeline active={request.currentStep} bulletSize={24} lineWidth={2}>
            {templateSteps.map((step: any, index: number) => {
              const approval = request.approvals.find((a: any) => a.step === index);
              const isActive = index === request.currentStep;
              const isCompleted = index < request.currentStep;
              
              return (
                <Timeline.Item 
                  key={index}
                  bullet={
                    approval?.status === "APPROVED" ? <CheckCircle size={16} /> :
                    approval?.status === "REJECTED" ? <XCircle size={16} /> :
                    isActive ? <Clock size={16} /> : <User size={16} />
                  }
                  title={`${step.role} - ${step.label}`}
                  color={
                    approval?.status === "APPROVED" ? "green" :
                    approval?.status === "REJECTED" ? "red" :
                    isActive ? "blue" : "gray"
                  }
                >
                  <Text size="sm" c="dimmed">
                    {approval?.status === "APPROVED" && approval.comment && (
                      <>Approved: {approval.comment}</>
                    )}
                    {approval?.status === "REJECTED" && approval.comment && (
                      <>Rejected: {approval.comment}</>
                    )}
                    {approval?.status === "PENDING" && "Pending approval"}
                    {!approval && !isActive && "Not started"}
                    {!approval && isActive && "Awaiting action"}
                  </Text>
                  {approval?.approver && (
                    <Text size="xs" c="dimmed">
                      by {approval.approver.firstName} {approval.approver.lastName}
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
            <Text size="lg" fw={500} mb="md">Take Action</Text>
            
            {!actionType ? (
              <Group>
                <Button 
                  color="green" 
                  leftSection={<CheckCircle size={16} />}
                  onClick={() => setActionType("approve")}
                >
                  Approve
                </Button>
                <Button 
                  color="red" 
                  leftSection={<XCircle size={16} />}
                  onClick={() => setActionType("reject")}
                >
                  Reject
                </Button>
              </Group>
            ) : (
              <form onSubmit={commentForm.onSubmit(() => handleApproval(actionType === "approve"))}>
                <Stack gap="md">
                  <Alert color={actionType === "approve" ? "green" : "red"}>
                    You are about to {actionType} this request. Please provide a comment explaining your decision.
                  </Alert>
                  
                  <Textarea
                    label="Comment (Optional)"
                    placeholder="Add a comment about your decision..."
                    {...commentForm.getInputProps("comment")}
                  />
                  
                  <Group>
                    <Button 
                      type="submit"
                      color={actionType === "approve" ? "green" : "red"}
                      loading={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                    >
                      Confirm {actionType === "approve" ? "Approval" : "Rejection"}
                    </Button>
                    <Button variant="subtle" onClick={() => setActionType(null)}>
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}
          </Paper>
        )}

        {/* Comments Section */}
        <Paper shadow="sm" p="lg" withBorder>
          <Text size="lg" fw={500} mb="md">Comments</Text>
          
          {/* Add Comment Form */}
          <form onSubmit={commentForm.onSubmit(handleAddComment)}>
            <Stack gap="md">
              <Textarea
                placeholder="Add a comment..."
                {...commentForm.getInputProps("comment")}
              />
              <Group justify="flex-end">
                <Button 
                  type="submit" 
                  leftSection={<MessageCircle size={16} />}
                  loading={addCommentMutation.isPending}
                  disabled={!commentForm.values.comment.trim()}
                >
                  Add Comment
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
              No comments yet
            </Text>
          )}
        </Paper>
      </Stack>
    </Container>
  );
} 