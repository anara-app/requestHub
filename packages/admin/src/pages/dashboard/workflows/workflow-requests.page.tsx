import { Container, Title, Table, Badge, Text, Button, Group, Pagination, Select, TextInput } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import { ROUTES } from "../../../router/routes";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import EmptyPlaceholder from "../../../components/EmptyPlaceholder";
import { Eye } from "lucide-react";

type RequestStatus = "DRAFT" | "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "CANCELLED";

export default function WorkflowRequestsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: response, isLoading } = trpc.admin.workflows.getAllRequests.useQuery({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  if (!response?.requests?.length) {
    return (
      <Container size="xl">
        <Title order={1} mb="lg">
          Workflow Requests
        </Title>
        <EmptyPlaceholder
          title="No workflow requests found"
          subtitle="No workflow requests have been submitted yet."
        />
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

  return (
    <Container size="xl">
      <Title order={1} mb="lg">
        Workflow Requests
      </Title>

      <Group mb="md">
        <TextInput
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter((value as RequestStatus) || "")}
          data={[
            { value: "", label: "All statuses" },
            { value: "DRAFT", label: "Draft" },
            { value: "PENDING", label: "Pending" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
          clearable
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Template</Table.Th>
            <Table.Th>Initiator</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Current Step</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {response.requests.map((request: any) => (
            <Table.Tr key={request.id}>
              <Table.Td>
                <div>
                  <Text fw={500}>{request.title}</Text>
                  {request.description && (
                    <Text size="sm" c="dimmed" truncate>
                      {request.description}
                    </Text>
                  )}
                </div>
              </Table.Td>
              <Table.Td>{request.template.name}</Table.Td>
              <Table.Td>
                {request.initiator.firstName} {request.initiator.lastName}
              </Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(request.status)} variant="light">
                  {request.status}
                </Badge>
              </Table.Td>
              <Table.Td>{request.currentStep + 1}</Table.Td>
              <Table.Td>
                {new Date(request.createdAt).toLocaleDateString()}
              </Table.Td>
              <Table.Td>
                <Button 
                  size="xs" 
                  variant="light"
                  leftSection={<Eye size={14} />}
                  onClick={() => navigate(`${ROUTES.DASHBOARD_WORKFLOW_REQUEST}/${request.id}`)}
                >
                  View Details
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {response.pagination && response.pagination.totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={response.pagination.totalPages}
          />
        </Group>
      )}
    </Container>
  );
} 