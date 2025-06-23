import { useState, useMemo } from "react";
import {
  Card,
  Title,
  Group,
  Select,
  Button,
  Stack,
  Text,
  Loader,
  Center,
  Alert,
  Grid,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { BarChart3, Calendar, Filter, AlertCircle } from "lucide-react";
import { trpc } from "../../common/trpc";

interface RequestTrendsChartProps {
  height?: number;
}

type GroupByOption = 'day' | 'week' | 'month';
type DateRangePreset = 'last7days' | 'last30days' | 'last90days';

// These will be converted to use Trans components in the component

export default function RequestTrendsChart({ height = 400 }: RequestTrendsChartProps) {
  const { _ } = useLingui();
  
  // State for filters
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last30days');
  const [groupBy, setGroupBy] = useState<GroupByOption>('day');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Translatable options
  const dateRangeOptions = [
    { value: 'last7days', label: _(msg`Last 7 days`) },
    { value: 'last30days', label: _(msg`Last 30 days`) },
    { value: 'last90days', label: _(msg`Last 90 days`) },
  ];

  const groupByOptions = [
    { value: 'day', label: _(msg`Daily`) },
    { value: 'week', label: _(msg`Weekly`) },
    { value: 'month', label: _(msg`Monthly`) },
  ];

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRangePreset) {
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [dateRangePreset]);

  // Fetch data
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = trpc.admin.analytics.getRequestTrends.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy,
    templateId: selectedTemplate || undefined,
  });

  const { data: templates, isLoading: templatesLoading } = trpc.admin.analytics.getAvailableTemplates.useQuery();

  // Process data for chart
  const chartData = useMemo(() => {
    if (!trendsData?.trends) return [];

    return trendsData.trends.map((item) => {
      // Format date based on groupBy
      let dateLabel = '';
      const date = new Date(item.date);
      
      switch (groupBy) {
        case 'day':
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case 'week':
          dateLabel = `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case 'month':
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        default:
          dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        date: dateLabel,
        'Total': item.total,
        'Approved': item.approved,
        'Rejected': item.rejected,
        'Pending': item.pending,
        'In Progress': item.inProgress,
      };
    });
  }, [trendsData, groupBy]);

  const resetFilters = () => {
    setDateRangePreset('last30days');
    setGroupBy('day');
    setSelectedTemplate(null);
  };

  if (trendsError) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
          <Trans>Failed to load request trends data. Please try again later.</Trans>
        </Alert>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>
          <Trans>Request Trends</Trans>
        </Title>
        <BarChart3 size={20} />
      </Group>

      {/* Filters */}
      <Stack gap="md" mb="lg">
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label={_(msg`Date Range`)}
              placeholder={_(msg`Select range`)}
              value={dateRangePreset}
              onChange={(value) => setDateRangePreset(value as DateRangePreset)}
              data={dateRangeOptions}
              leftSection={<Calendar size={16} />}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label={_(msg`Group By`)}
              placeholder={_(msg`Select grouping`)}
              value={groupBy}
              onChange={(value) => setGroupBy(value as GroupByOption)}
              data={groupByOptions}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label={_(msg`Request Type`)}
              placeholder={_(msg`All types`)}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              data={
                templates?.map(template => ({
                  value: template.id,
                  label: template.name,
                })) || []
              }
              leftSection={<Filter size={16} />}
              clearable
              disabled={templatesLoading}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <div style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
              <Button
                variant="light"
                onClick={resetFilters}
                size="sm"
                fullWidth
              >
                <Trans>Reset Filters</Trans>
              </Button>
            </div>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Summary */}
      {trendsData?.summary && (
        <Group gap="lg" mb="md">
          <Text size="sm" c="dimmed">
            <strong><Trans>Total Requests:</Trans></strong> {trendsData.summary.totalRequests}
          </Text>
          <Text size="sm" c="dimmed">
            <strong><Trans>Period:</Trans></strong> {new Date(trendsData.summary.dateRange.start).toLocaleDateString()} - {new Date(trendsData.summary.dateRange.end).toLocaleDateString()}
          </Text>
          <Text size="sm" c="dimmed">
            <strong><Trans>Data Points:</Trans></strong> {trendsData.trends?.length || 0}
          </Text>
          {trendsData.summary.templateFilter && (
            <Text size="sm" c="dimmed">
              <strong><Trans>Filtered by:</Trans></strong> {templates?.find(t => t.id === trendsData.summary.templateFilter)?.name}
            </Text>
          )}
        </Group>
      )}

      {/* Chart */}
      <div style={{ marginBottom: '20px' }}>
        {trendsLoading ? (
          <Center h={height}>
            <Loader size="lg" />
          </Center>
        ) : chartData.length > 0 ? (
        <Stack gap="sm">
          <LineChart
            h={height - 100}
            data={chartData}
            dataKey="date"
            series={[
              { name: 'Total', color: 'blue.6' },
              { name: 'Approved', color: 'teal.6' },
              { name: 'Rejected', color: 'red.6' },
              { name: 'Pending', color: 'orange.6' },
              { name: 'In Progress', color: 'violet.6' },
            ]}
            curveType="linear"
            connectNulls={false}
            withLegend={false}
          withTooltip
          tooltipProps={{
            content: ({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ margin: '2px 0', color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }
          }}
          withDots={true}
          dotProps={{ r: 3 }}
          strokeWidth={2}
          gridAxis="xy"
          tickLine="xy"
          withXAxis
          withYAxis
          xAxisProps={{
            angle: 0,
            textAnchor: 'middle',
            height: 30,
            fontSize: 11,
            interval: 'preserveStartEnd',
          }}
                      yAxisProps={{
              domain: [0, 'dataMax + 2'],
              allowDecimals: false,
              fontSize: 11,
            }}
          />
          
          {/* Custom Horizontal Legend */}
          <Group justify="center" gap="lg" wrap="wrap">
            {[
              { name: 'Total', color: 'var(--mantine-color-blue-6)' },
              { name: 'Approved', color: 'var(--mantine-color-teal-6)' },
              { name: 'Rejected', color: 'var(--mantine-color-red-6)' },
              { name: 'Pending', color: 'var(--mantine-color-orange-6)' },
              { name: 'In Progress', color: 'var(--mantine-color-violet-6)' },
            ].map((item) => (
              <Group key={item.name} gap="xs">
                <div
                  style={{
                    width: 12,
                    height: 2,
                    backgroundColor: item.color,
                    borderRadius: 1,
                  }}
                />
                <Text size="xs" c="dimmed">
                  {item.name}
                </Text>
              </Group>
            ))}
          </Group>
        </Stack>
        ) : (
          <Center h={height}>
            <Stack align="center" gap="sm">
              <BarChart3 size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed" ta="center">
                <Trans>No data available for the selected period</Trans>
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                <Trans>Try adjusting your filters or date range</Trans>
              </Text>
            </Stack>
          </Center>
        )}
      </div>
    </Card>
  );
} 