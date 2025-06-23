import { Container, Title, Grid, Card, Text, Group, Stack, SimpleGrid, Loader, Center, Alert, Button } from "@mantine/core";
import { Trans } from "@lingui/react/macro";
import PageTitle from "../../../components/PageTitle";
import PermissionVisibility from "../../../components/PermissionVisibility";
import { BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, Activity, AlertCircle, UserCog, Network, Workflow, Plus } from "lucide-react";
import { trpc } from "../../../common/trpc";
import RequestTrendsChart from "../../../components/Analytics/RequestTrendsChart";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../router/routes";

export default function AnalyticsPage() {
  // Fetch real analytics data
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = trpc.admin.analytics.getDashboardMetrics.useQuery();
  const { data: statusDistribution, isLoading: statusLoading } = trpc.admin.analytics.getStatusDistribution.useQuery();
  const { data: topPerformers, isLoading: performersLoading } = trpc.admin.analytics.getTopPerformers.useQuery();
  const { data: templateUsage, isLoading: templateLoading } = trpc.admin.analytics.getTemplateUsage.useQuery();
  const { data: userPermissions } = trpc.admin.users.getMyPermissions.useQuery();

  // Quick access navigation items
  const quickAccessItems = [
    {
      title: <Trans>My Requests</Trans>,
      description: <Trans>View and manage your requests</Trans>,
      icon: FileText,
      route: ROUTES.DASHBOARD_MY_REQUESTS,
      color: "blue",
      permission: "CREATE_WORKFLOW_REQUEST",
    },
    {
      title: <Trans>Pending Approvals</Trans>,
      description: <Trans>Review requests awaiting approval</Trans>,
      icon: Clock,
      route: ROUTES.DASHBOARD_PENDING_APPROVALS,
      color: "orange",
      permission: "APPROVE_WORKFLOW_REQUEST",
    },
    {
      title: <Trans>Workflow Templates</Trans>,
      description: <Trans>Manage workflow templates</Trans>,
      icon: FileText,
      route: ROUTES.DASHBOARD_WORKFLOW_TEMPLATES,
      color: "purple",
      permission: "MANAGE_WORKFLOW_TEMPLATES",
    },
    {
      title: <Trans>All Requests</Trans>,
      description: <Trans>View all system requests</Trans>,
      icon: Workflow,
      route: ROUTES.DASHBOARD_ALL_REQUESTS,
      color: "indigo",
      permission: "MANAGE_WORKFLOW_TEMPLATES",
    },
    {
      title: <Trans>Users</Trans>,
      description: <Trans>Manage system users</Trans>,
      icon: Users,
      route: ROUTES.DASHBOARD_USERS,
      color: "green",
      permission: "READ_USERS",
    },
    {
      title: <Trans>Organization</Trans>,
      description: <Trans>View organization hierarchy</Trans>,
      icon: Network,
      route: ROUTES.DASHBOARD_ORGANIZATION_HIERARCHY,
      color: "teal",
      permission: "READ_USERS",
    },
    {
      title: <Trans>Roles</Trans>,
      description: <Trans>Manage user roles and permissions</Trans>,
      icon: UserCog,
      route: ROUTES.DASHBOARD_ROLES,
      color: "cyan",
      permission: "READ_ROLES",
    },
    {
      title: <Trans>Raise Request</Trans>,
      description: <Trans>Create a new workflow request</Trans>,
      icon: Plus,
      route: ROUTES.DASHBOARD_RAISE_REQUEST,
      color: "lime",
      permission: "CREATE_WORKFLOW_REQUEST",
    },
  ];

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
      title: <Trans>Total Requests</Trans>,
      value: metricsData?.totalRequests?.toLocaleString() || "0",
      icon: FileText,
      color: "blue",
      trend: null as string | null, // We can calculate trends later if needed
    },
    {
      title: <Trans>Active Users</Trans>,
      value: metricsData?.activeUsers?.toLocaleString() || "0",
      icon: Users,
      color: "green",
      trend: null as string | null,
    },
    {
      title: <Trans>Pending Approvals</Trans>,
      value: metricsData?.pendingApprovals?.toLocaleString() || "0",
      icon: Clock,
      color: "orange",
      trend: null as string | null,
    },
    {
      title: <Trans>Approved Requests</Trans>,
      value: metricsData?.approvedRequests?.toLocaleString() || "0",
      icon: CheckCircle,
      color: "teal",
      trend: null as string | null,
    },
    {
      title: <Trans>Rejected Requests</Trans>,
      value: metricsData?.rejectedRequests?.toLocaleString() || "0",
      icon: XCircle,
      color: "red",
      trend: null as string | null,
    },
    {
      title: <Trans>Avg. Processing Time</Trans>,
      value: `${metricsData?.avgProcessingTime || 0}`,
      valueType: "days" as const,
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
                    {metric.valueType === "days" ? (
                      <>
                        {metric.value} {Number(metric.value) === 1 ? <Trans>day</Trans> : <Trans>days</Trans>}
                      </>
                    ) : (
                      metric.value
                    )}
                  </Text>
                </Card>
              );
            })}
          </SimpleGrid>

          {/* Charts Section */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <RequestTrendsChart height={300} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3}>
                    <Trans>Status Distribution</Trans>
                  </Title>
                  <TrendingUp size={20} />
                </Group>
                {statusLoading ? (
                  <Center py="md">
                    <Loader size="sm" />
                  </Center>
                ) : (
                  <Stack gap="md" style={{ height: 300, justifyContent: 'center' }}>
                    {statusDistribution && statusDistribution.length > 0 ? (
                      statusDistribution.map((item) => {
                        const total = statusDistribution.reduce((sum, status) => sum + status.count, 0);
                        const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                        
                        // Map status to display info
                        const getStatusInfo = (status: string) => {
                          switch (status) {
                            case 'PENDING':
                              return { label: <Trans>Pending</Trans>, color: 'orange', icon: Clock };
                            case 'APPROVED':
                              return { label: <Trans>Approved</Trans>, color: 'teal', icon: CheckCircle };
                            case 'REJECTED':
                              return { label: <Trans>Rejected</Trans>, color: 'red', icon: XCircle };
                            case 'IN_PROGRESS':
                              return { label: <Trans>In Progress</Trans>, color: 'blue', icon: Activity };
                            case 'DRAFT':
                              return { label: <Trans>Draft</Trans>, color: 'gray', icon: FileText };
                            case 'CANCELLED':
                              return { label: <Trans>Cancelled</Trans>, color: 'dark', icon: XCircle };
                            default:
                              return { label: <Trans>{status}</Trans>, color: 'gray', icon: FileText };
                          }
                        };

                        const statusInfo = getStatusInfo(item.status);
                        const IconComponent = statusInfo.icon;

                        return (
                          <Group key={item.status} justify="space-between">
                            <Group gap="xs">
                              <IconComponent 
                                size={16} 
                                color={`var(--mantine-color-${statusInfo.color}-6)`} 
                              />
                              <Text size="sm" fw={500}>
                                {statusInfo.label}
                              </Text>
                            </Group>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>
                                {item.count}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ({percentage}%)
                              </Text>
                            </Group>
                          </Group>
                        );
                      })
                    ) : (
                      <Center>
                        <Text size="sm" c="dimmed">
                          <Trans>No request data available yet</Trans>
                        </Text>
                      </Center>
                    )}
                  </Stack>
                )}
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

          {/* Quick Access Navigation */}
          <Card shadow="sm" padding="lg" radius="md" withBorder mt="xl">
            <Title order={3} mb="md">
              <Trans>Quick Access</Trans>
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              <Trans>Navigate quickly to other sections of the dashboard</Trans>
            </Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="md">
              {quickAccessItems
                .filter(item => !item.permission || userPermissions?.includes(item.permission as any))
                .map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.route}
                      component={Link}
                      to={item.route}
                      variant="light"
                      color={item.color}
                      size="md"
                      h="auto"
                      p="md"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        height: 'auto',
                      }}
                    >
                      <Group gap="xs" mb="xs">
                        <IconComponent size={20} />
                        <Text fw={600} size="sm">
                          {item.title}
                        </Text>
                      </Group>
                      <Text size="xs" mx="md" c="dimmed" style={{ whiteSpace: 'normal' }}>
                        {item.description}
                      </Text>
                    </Button>
                  );
                })}
            </SimpleGrid>
          </Card>
        </Stack>
      </Container>
    </PermissionVisibility>
  );
} 