import { Container, Title, Paper, Text, Badge, Group, Stack, Button, Table, LoadingOverlay } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { ROUTES } from "../../../router/routes";
import { Eye, Plus } from "lucide-react";

export default function MyRequestsPage() {
  const navigate = useNavigate();

  const { data: requests, isLoading } = trpc.nextClient.workflows.getMyRequests.useQuery();

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT": return "Draft";
      case "PENDING": return "Pending";
      case "IN_PROGRESS": return "In Progress";
      case "APPROVED": return "Approved";
      case "REJECTED": return "Rejected";
      case "CANCELLED": return "Cancelled";
      default: return status;
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>My Requests</Title>
                 <Button 
           leftSection={<Plus size={16} />}
           onClick={() => navigate(ROUTES.DASHBOARD_RAISE_REQUEST)}
         >
           New Request
         </Button>
      </Group>

      <Paper shadow="sm" p="lg" withBorder pos="relative">
        <LoadingOverlay visible={isLoading} />
        
        {!requests || requests.length === 0 ? (
          <Stack align="center" py="xl">
            <Text size="lg" c="dimmed">No requests found</Text>
            <Text size="sm" c="dimmed">You haven't submitted any workflow requests yet.</Text>
                         <Button 
               leftSection={<Plus size={16} />}
               onClick={() => navigate(ROUTES.DASHBOARD_RAISE_REQUEST)}
               mt="md"
             >
               Create Your First Request
             </Button>
          </Stack>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requests.map((request: any) => {
                const templateSteps = JSON.parse(request.template.steps as string);
                const progress = `${request.currentStep + 1}/${templateSteps.length}`;
                
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
                      <Badge color={getStatusColor(request.status)} variant="light">
                        {getStatusLabel(request.status)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        Step {progress}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                                             <Button
                         size="sm"
                         variant="subtle"
                         leftSection={<Eye size={14} />}
                         onClick={() => navigate(`${ROUTES.DASHBOARD_WORKFLOW_REQUEST}/${request.id}`)}
                       >
                         View
                       </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Container>
  );
} 