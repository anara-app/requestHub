import { Container, Title, Paper, Text, Badge, Group, Stack, Button, Table, LoadingOverlay, Alert } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { ROUTES } from "../../../router/routes";
import { Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function PendingApprovalsPage() {
  const navigate = useNavigate();

  const { data: requests, isLoading } = trpc.nextClient.workflows.getPendingApprovals.useQuery();
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
    <Container size="xl">
      <Title order={1} mb="lg">Pending Approvals</Title>

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
            <Text size="lg" c="dimmed">No pending approvals</Text>
            <Text size="sm" c="dimmed" ta="center">
              {currentUser?.role 
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
                  const templateSteps = JSON.parse(request.template.steps as string);
                  const currentStep = templateSteps[request.currentStep];
                  
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
                        <Text size="sm">{request.template.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {request.initiator.firstName} {request.initiator.lastName}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" fw={500}>
                            Step {request.currentStep + 1}: {currentStep?.label}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Requires {currentStep?.role} approval
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