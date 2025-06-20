import { Container, Paper, Text, Badge, Group, Stack, Button, Table, LoadingOverlay, Alert, TextInput } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { ROUTES } from "../../../router/routes";
import { Eye, Clock, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import PageTitle from "../../../components/PageTitle";

export default function PendingApprovalsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const { data: requests, isLoading } = trpc.nextClient.workflows.getPendingApprovals.useQuery({
    search: debouncedSearch,
  });
  const { data: currentUser } = trpc.admin.users.getMe.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "yellow";
      case "IN_PROGRESS": return "blue";
      default: return "gray";
    }
  };

  // Server now filters requests, so we can use them directly
  const myPendingRequests = requests || [];

  return (
    <Container size="xl" my="lg">
      <PageTitle>Pending Approvals</PageTitle>

      <Group justify="space-between" mb="lg">
        <div></div>
        <TextInput
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftSection={<Search size={16} />}
          style={{ minWidth: 300 }}
        />
      </Group>

      <Paper shadow="sm" p="lg" withBorder pos="relative">
        <LoadingOverlay visible={isLoading} />
        
        {!currentUser?.role && (
          <Alert color="orange" icon={<AlertCircle size={16} />} mb="md">
            You don't have a role assigned. Please contact an administrator.
          </Alert>
        )}

        {myPendingRequests.length === 0 ? (
          <Stack align="center" py="xl">
            <Clock size={48} color="gray" />
            <Text size="lg" c="dimmed">
              {search ? "No matching requests found" : "No pending approvals"}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {search 
                ? "Try adjusting your search terms or clear the search to see all pending approvals."
                : currentUser?.role 
                  ? `There are no requests waiting for ${currentUser.role.name} approval at this time.`
                  : "You need a role assigned to approve requests."
              }
            </Text>
          </Stack>
        ) : (
          <>
            <Group mb="md">
              <CheckCircle size={20} color="green" />
              <Text fw={500}>
                {myPendingRequests.length} request{myPendingRequests.length !== 1 ? 's' : ''} waiting for your approval
              </Text>
            </Group>

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Submitted By</Table.Th>
                  <Table.Th>Current Step</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Submitted</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {myPendingRequests.map((request: any) => {
                  // Safely parse template steps with fallback
                  let templateSteps = [];
                  let currentStep = null;
                  
                  try {
                    if (request.template?.steps) {
                      templateSteps = JSON.parse(request.template.steps as string);
                      currentStep = templateSteps[request.currentStep];
                    }
                  } catch (error) {
                    console.error('Error parsing template steps:', error);
                  }

                  // Use currentApproval info if available (from new system)
                  const approvalInfo = request.currentApproval;
                  
                  return (
                    <Table.Tr key={request.id}>
                      <Table.Td>
                        <div>
                          <Text fw={500}>{request.title}</Text>
                          {request.description && (
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {request.description}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{request.template?.name || 'Unknown Template'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {request.initiator?.firstName} {request.initiator?.lastName}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            Step {request.currentStep + 1}: {approvalInfo?.actionLabel || currentStep?.label || 'Review Required'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {approvalInfo?.roleBasedAssignee && `Role: ${approvalInfo.roleBasedAssignee}`}
                            {approvalInfo?.dynamicAssignee && `Assignment: ${approvalInfo.dynamicAssignee}`}
                            {!approvalInfo && currentStep?.role && `Requires ${currentStep.role} approval`}
                            {!approvalInfo && !currentStep && 'Pending your approval'}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(request.status)} variant="light">
                          {request.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="sm"
                          variant="filled"
                          color="blue"
                          leftSection={<Eye size={14} />}
                          onClick={() => navigate(`${ROUTES.DASHBOARD_WORKFLOW_REQUEST}/${request.id}`)}
                        >
                          Review
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Paper>
    </Container>
  );
} 