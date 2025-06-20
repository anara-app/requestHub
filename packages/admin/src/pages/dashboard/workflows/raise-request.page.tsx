import { Container, Title, Card, Text, Button, Group, Modal, TextInput, Textarea, Select, Stack } from "@mantine/core";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { trpc } from "../../../common/trpc";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import EmptyPlaceholder from "../../../components/EmptyPlaceholder";

interface RequestFormData {
  templateId: string;
  title: string;
  description: string;
  data: Record<string, any>;
}

export default function RaiseRequestPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const utils = trpc.useUtils();

  const form = useForm<RequestFormData>({
    initialValues: {
      templateId: "",
      title: "",
      description: "",
      data: {},
    },
    validate: {
      title: (value: string) => (value.length < 3 ? "Title must be at least 3 characters" : null),
      description: (value: string) => (value.length < 10 ? "Description must be at least 10 characters" : null),
    },
  });

  const { data: templates, isLoading } = trpc.nextClient.workflows.getTemplates.useQuery();
  const createRequestMutation = trpc.nextClient.workflows.createRequest.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "Request submitted successfully",
        color: "green",
      });
      setModalOpened(false);
      form.reset();
      setSelectedTemplate(null);
      utils.nextClient.workflows.getMyRequests.invalidate();
    },
    onError: (error: any) => {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to submit request",
        color: "red",
      });
    },
  });

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    form.setFieldValue("templateId", template.id);
    setModalOpened(true);
  };

  const handleSubmit = (values: RequestFormData) => {
    createRequestMutation.mutate(values);
  };

  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  if (!templates?.length) {
    return (
      <Container size="xl">
        <Title order={1} mb="lg">
          Raise Request
        </Title>
        <EmptyPlaceholder
          title="No workflow templates available"
          subtitle="No workflow templates have been created yet. Contact your administrator."
        />
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title order={1} mb="lg">
        Raise Request
      </Title>

      <Text size="sm" c="dimmed" mb="xl">
        Select a workflow template to start a new request. Each request will follow the approval process defined in the template.
      </Text>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {templates.map((template: any) => (
          <Card key={template.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{template.name}</Text>
              <Text size="xs" c="dimmed">
                {template.steps?.length || 0} steps
              </Text>
            </Group>

            <Text size="sm" c="dimmed" mb="md" style={{ minHeight: "40px" }}>
              {template.description || "No description available"}
            </Text>

            <Button 
              variant="light" 
              fullWidth 
              onClick={() => handleTemplateSelect(template)}
            >
              Start Request
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          form.reset();
          setSelectedTemplate(null);
        }}
        title={`New ${selectedTemplate?.name} Request`}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Request Title"
              placeholder="Enter a descriptive title for your request"
              required
              {...form.getInputProps("title")}
            />

            <Textarea
              label="Description"
              placeholder="Provide details about your request"
              required
              minRows={3}
              {...form.getInputProps("description")}
            />

            {/* Dynamic fields based on template type */}
            {selectedTemplate?.name?.toLowerCase().includes("fuel") && (
              <>
                <TextInput
                  label="Vehicle Number"
                  placeholder="Enter vehicle number"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      vehicleNumber: e.target.value 
                    })
                  }
                />
                <TextInput
                  label="Fuel Amount (Liters)"
                  placeholder="Enter fuel amount needed"
                  type="number"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      fuelAmount: e.target.value 
                    })
                  }
                />
              </>
            )}

            {selectedTemplate?.name?.toLowerCase().includes("leave") && (
              <>
                <TextInput
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      startDate: e.target.value 
                    })
                  }
                />
                <TextInput
                  label="End Date"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      endDate: e.target.value 
                    })
                  }
                />
                <Select
                  label="Leave Type"
                  placeholder="Select leave type"
                  data={[
                    { value: "annual", label: "Annual Leave" },
                    { value: "sick", label: "Sick Leave" },
                    { value: "personal", label: "Personal Leave" },
                    { value: "emergency", label: "Emergency Leave" },
                  ]}
                  onChange={(value) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      leaveType: value 
                    })
                  }
                />
              </>
            )}

            {selectedTemplate?.name?.toLowerCase().includes("payment") && (
              <>
                <TextInput
                  label="Amount"
                  placeholder="Enter payment amount"
                  type="number"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      amount: e.target.value 
                    })
                  }
                />
                <TextInput
                  label="Vendor/Recipient"
                  placeholder="Enter vendor or recipient name"
                  onChange={(e) => 
                    form.setFieldValue("data", { 
                      ...form.values.data, 
                      vendor: e.target.value 
                    })
                  }
                />
              </>
            )}

            <Group justify="flex-end">
              <Button 
                variant="subtle" 
                onClick={() => {
                  setModalOpened(false);
                  form.reset();
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={createRequestMutation.isPending}
              >
                Submit Request
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
} 