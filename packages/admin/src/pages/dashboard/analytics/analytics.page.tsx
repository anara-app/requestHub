import { Container, Title, Grid, Card, Text, Group, Stack, SimpleGrid, Loader, Center, Alert } from "@mantine/core";
import { Trans } from "@lingui/react/macro";
import PageTitle from "../../../components/PageTitle";
import PermissionVisibility from "../../../components/PermissionVisibility";
import { BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, Activity, AlertCircle } from "lucide-react";
import { trpc } from "../../../common/trpc";

export default function AnalyticsPage() {
  // Fetch real analytics data
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = trpc.admin.analytics.getDashboardMetrics.useQuery();
  const { data: topPerformers, isLoading: performersLoading } = trpc.admin.analytics.getTopPerformers.useQuery();
  const { data: templateUsage, isLoading: templateLoading } = trpc.admin.analytics.getTemplateUsage.useQuery();

  if (metricsLoading) {
    return (
      <PermissionVisibility permissions={["READ_ANALYTICS" as any]}>
        <Container size="xl" py="md">
          <PageTitle>
            <Trans>Analytics</Trans>
          </PageTitle>
          <Center mt="xl">
            <Loader size="lg" />
          </Center>
        </Container>
      </PermissionVisibility>
    );
  }

  if (metricsError) {
    return (
      <PermissionVisibility permissions={["READ_ANALYTICS" as any]}>
        <Container size="xl" py="md">
          <PageTitle>
            <Trans>Analytics</Trans>
          </PageTitle>
          <Alert icon={<AlertCircle size={16} />} title="Error" color="red" mt="md">
            <Trans>Failed to load analytics data. Please try again later.</Trans>
          </Alert>
        </Container>
      </PermissionVisibility>
    );
  }

  const metrics = [
    {
      title: "Total Requests",
      value: metricsData?.totalRequests?.toLocaleString() || "0",
      icon: FileText,
      color: "blue",
      trend: null as string | null, // We can calculate trends later if needed
    },
    {
      title: "Active Users",
      value: metricsData?.activeUsers?.toLocaleString() || "0",
      icon: Users,
      color: "green",
      trend: null as string | null,
    },
    {
      title: "Pending Approvals",
      value: metricsData?.pendingApprovals?.toLocaleString() || "0",
      icon: Clock,
      color: "orange",
      trend: null as string | null,
    },
    {
      title: "Approved Requests",
      value: metricsData?.approvedRequests?.toLocaleString() || "0",
      icon: CheckCircle,
      color: "teal",
      trend: null as string | null,
    },
    {
      title: "Rejected Requests",
      value: metricsData?.rejectedRequests?.toLocaleString() || "0",
      icon: XCircle,
      color: "red",
      trend: null as string | null,
    },
    {
      title: "Avg. Processing Time",
      value: metricsData?.avgProcessingTime ? `${metricsData.avgProcessingTime} days` : "0 days",
      icon: Activity,
      color: "violet",
      trend: null as string | null,
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
                    {metric.trend && (
                      <Text size="xs" c={metric.trend.startsWith('+') ? 'teal' : 'red'} fw={500}>
                        {metric.trend}
                      </Text>
                    )}
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
                {performersLoading ? (
                  <Center py="md">
                    <Loader size="sm" />
                  </Center>
                ) : (
                  <Stack gap="md">
                    {topPerformers?.topApprovers && topPerformers.topApprovers.length > 0 && (
                      <div>
                        <Text size="sm" fw={500} mb="xs">
                          <Trans>Top Approvers</Trans>
                        </Text>
                        <Stack gap="xs">
                          {topPerformers.topApprovers.slice(0, 3).map((approver) => (
                            <Group key={approver.userId} justify="space-between">
                              <Text size="sm">
                                {approver.user?.firstName} {approver.user?.lastName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {approver.approvalCount} approvals
                              </Text>
                            </Group>
                          ))}
                        </Stack>
                      </div>
                    )}
                    
                    {topPerformers?.topInitiators && topPerformers.topInitiators.length > 0 && (
                      <div>
                        <Text size="sm" fw={500} mb="xs">
                          <Trans>Top Request Creators</Trans>
                        </Text>
                        <Stack gap="xs">
                          {topPerformers.topInitiators.slice(0, 3).map((initiator) => (
                            <Group key={initiator.userId} justify="space-between">
                              <Text size="sm">
                                {initiator.user?.firstName} {initiator.user?.lastName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {initiator.requestCount} requests
                              </Text>
                            </Group>
                          ))}
                        </Stack>
                      </div>
                    )}
                    
                    {(!topPerformers?.topApprovers?.length && !topPerformers?.topInitiators?.length) && (
                      <Text size="sm" c="dimmed">
                        <Trans>No performance data available yet</Trans>
                      </Text>
                    )}
                  </Stack>
                )}
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">
                  <Trans>Template Usage</Trans>
                </Title>
                {templateLoading ? (
                  <Center py="md">
                    <Loader size="sm" />
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {templateUsage && templateUsage.length > 0 ? (
                      templateUsage.slice(0, 5).map((template) => (
                        <Group key={template.templateId} justify="space-between">
                          <div>
                            <Text size="sm" fw={500}>
                              {template.template?.name || 'Unknown Template'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {template.totalRequests} requests • {template.successRate}% success rate
                            </Text>
                          </div>
                        </Group>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">
                        <Trans>No template usage data available yet</Trans>
                      </Text>
                    )}
                  </Stack>
                )}
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </PermissionVisibility>
  );
} 