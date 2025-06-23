import { useState } from "react";
import {
  Container,
  Paper,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Table,
  LoadingOverlay,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import PageTitle from "../../../components/PageTitle";
import { ROUTES } from "../../../router/routes";

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const {
    data: requests,
    isLoading,
    error,
  } = trpc.nextClient.workflows.getMyRequests.useQuery(
    {
      search: debouncedSearch,
    },
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: 3000,
    }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "gray";
      case "PENDING":
        return "yellow";
      case "IN_PROGRESS":
        return "blue";
      case "APPROVED":
        return "green";
      case "REJECTED":
        return "red";
      case "CANCELLED":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "PENDING":
        return "Pending";
      case "IN_PROGRESS":
        return "In Progress";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Container size="xl" my="lg">
      <PageTitle>My Requests</PageTitle>
      <Group justify="space-between" mb="lg">
        <div></div>
        <Group>
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
          />
          <Button
            leftSection={<Plus size={16} />}
            onClick={() => navigate(ROUTES.DASHBOARD_RAISE_REQUEST)}
          >
            New Request
          </Button>
        </Group>
      </Group>

      <Paper shadow="sm" p="lg" withBorder pos="relative">
        <LoadingOverlay visible={isLoading} />

        {error && (
          <Stack align="center" py="xl">
            <Text size="lg" c="red">
              Error loading requests
            </Text>
            <Text size="sm" c="dimmed">
              {error.message}
            </Text>
          </Stack>
        )}

        {!error && (!requests || requests.length === 0) ? (
          <Stack align="center" py="xl">
            <Text size="lg" c="dimmed">
              No requests found
            </Text>
            <Text size="sm" c="dimmed">
              You haven't submitted any workflow requests yet.
            </Text>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => navigate(ROUTES.DASHBOARD_RAISE_REQUEST)}
              mt="md"
            >
              Create Your First Request
            </Button>
          </Stack>
        ) : (
          !error &&
          requests && (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Progress</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((request: any) => {
                  const templateSteps = JSON.parse(
                    request.template.steps as string
                  );
                  const progress = `${request.currentStep + 1}/${templateSteps.length}`;

                  return (
                    <Table.Tr
                      key={request.id}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(
                          `${ROUTES.DASHBOARD_WORKFLOW_REQUEST}/${request.id}`
                        )
                      }
                    >
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
                        <Badge
                          color={getStatusColor(request.status)}
                          variant="light"
                        >
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
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          )
        )}
      </Paper>
    </Container>
  );
}
