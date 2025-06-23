import { Container, Title, Grid, Card, Text, Group, Stack, SimpleGrid } from "@mantine/core";
import { Trans } from "@lingui/react/macro";
import PageTitle from "../../../components/PageTitle";
import PermissionVisibility from "../../../components/PermissionVisibility";
import { BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, Activity } from "lucide-react";

export default function AnalyticsPage() {
  // Placeholder data - in real implementation, this would come from tRPC queries
  const metrics = [
    {
      title: "Total Requests",
      value: "1,234",
      icon: FileText,
      color: "blue",
      trend: "+12%",
    },
    {
      title: "Active Users",
      value: "89",
      icon: Users,
      color: "green",
      trend: "+5%",
    },
    {
      title: "Pending Approvals",
      value: "23",
      icon: Clock,
      color: "orange",
      trend: "-8%",
    },
    {
      title: "Approved Requests",
      value: "1,156",
      icon: CheckCircle,
      color: "teal",
      trend: "+15%",
    },
    {
      title: "Rejected Requests",
      value: "55",
      icon: XCircle,
      color: "red",
      trend: "-3%",
    },
    {
      title: "Avg. Processing Time",
      value: "2.3 days",
      icon: Activity,
      color: "violet",
      trend: "-12%",
    },
  ];

  return (
    <PermissionVisibility permissions={["READ_ANALYTICS" as any]}>
      <Container size="xl" py="md">
        <PageTitle>
          <Trans>Analytics</Trans>
        </PageTitle>

        <Stack gap="lg">
          {/* Key Metrics Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <IconComponent size={20} color={`var(--mantine-color-${metric.color}-6)`} />
                      <Text size="sm" c="dimmed" fw={500}>
                        {metric.title}
                      </Text>
                    </Group>
                    <Text size="xs" c={metric.trend.startsWith('+') ? 'teal' : 'red'} fw={500}>
                      {metric.trend}
                    </Text>
                  </Group>
                  <Text size="xl" fw={700}>
                    {metric.value}
                  </Text>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Charts Section */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3}>
                    <Trans>Request Trends</Trans>
                  </Title>
                  <BarChart3 size={20} />
                </Group>
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text c="dimmed">
                    <Trans>Chart visualization will be implemented here</Trans>
                  </Text>
                </div>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3}>
                    <Trans>Status Distribution</Trans>
                  </Title>
                  <TrendingUp size={20} />
                </Group>
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text c="dimmed">
                    <Trans>Pie chart will be implemented here</Trans>
                  </Text>
                </div>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Additional Analytics Cards */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">
                  <Trans>Top Performers</Trans>
                </Title>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    <Trans>Most active users and approval statistics will be displayed here</Trans>
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">
                  <Trans>Template Usage</Trans>
                </Title>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    <Trans>Workflow template popularity and success rates will be shown here</Trans>
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </PermissionVisibility>
  );
} 