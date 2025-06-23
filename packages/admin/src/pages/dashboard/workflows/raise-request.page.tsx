import { useLingui } from "@lingui/react/macro";
import { Container, Card, Text, Button, Group } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import EmptyPlaceholder from "../../../components/EmptyPlaceholder";
import LoadingPlaceholder from "../../../components/LoadingPlaceholder";
import PageTitle from "../../../components/PageTitle";
import { ROUTES } from "../../../router/routes";

export default function RaiseRequestPage() {
  const { t } = useLingui();
  const navigate = useNavigate();

  const { data: templates, isLoading } =
    trpc.nextClient.workflows.getTemplates.useQuery();

  const handleTemplateSelect = (template: any) => {
    navigate(`${ROUTES.DASHBOARD_NEW_REQUEST}/${template.id}`);
  };

  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  if (!templates?.length) {
    return (
      <Container size="xl" my="lg">
        <PageTitle>{t`Raise Request`}</PageTitle>
        <EmptyPlaceholder
          title={t`No workflow templates available`}
          subtitle={t`No workflow templates have been created yet. Contact your administrator.`}
        />
      </Container>
    );
  }

  return (
    <Container size="xl" my="lg">
      <PageTitle>{t`Raise Request`}</PageTitle>

      <Text size="sm" c="dimmed" mb="xl">
        {t`Select a workflow template to start a new request. Each request will follow the approval process defined in the template.`}
      </Text>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {templates.map((template: any) => (
          <Card
            key={template.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
          >
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{template.name}</Text>
              <Text size="xs" c="dimmed">
                {JSON.parse(template.steps)?.length || 0} {t`steps`}
              </Text>
            </Group>

            <Text size="sm" c="dimmed" mb="md" style={{ minHeight: "40px" }}>
              {template.description || t`No description available`}
            </Text>

            <Button
              variant="light"
              fullWidth
              onClick={() => handleTemplateSelect(template)}
            >
              {t`Start Request`}
            </Button>
          </Card>
        ))}
      </div>
    </Container>
  );
}
