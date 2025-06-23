import { useState, useMemo, useCallback } from 'react';
import {
  Container,
  Paper,
  Text,
  Group,
  Avatar,
  Box,
  Loader,
  Center,
  TextInput,
  Badge,
  Stack,
  Card,
  ActionIcon,
  Alert,
} from '@mantine/core';
import { 
  Users, 
  Search, 
  User,
  Building,
  Mail,
  Phone,
  Briefcase,
  Crown,
  UserCheck,
  ChartBar,
  RotateCcw,
} from 'lucide-react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Background, 
  BackgroundVariant,
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  NodeProps,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from 'dagre';
import { trpc } from '../../../common/trpc';
import PageTitle from '../../../components/PageTitle';
import { useDebouncedValue } from '@mantine/hooks';
import { Trans, useLingui, Plural } from '@lingui/react/macro';

// React Flow styles
import '@xyflow/react/dist/style.css';

interface HierarchyNode {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber?: string | null;
  role?: {
    name: string;
  } | null;
  isSelfManaged: boolean;
  subordinates: HierarchyNode[];
}

interface HierarchyStats {
  totalUsers: number;
  managersCount: number;
  topLevelCount: number;
  rolesCount: number;
}

type UserNodeData = HierarchyNode & {
  subordinateCount: number;
  level: number;
  [key: string]: unknown; // Add index signature to make it compatible with Record<string, unknown>
};

// Custom Node Component
function UserNode({ data }: NodeProps) {
  const { t } = useLingui();
  const roleColors: Record<string, string> = {
    'Admin': '#fa5252',
    'Ceo': '#fab005',
    'Operations_director': '#339af0',
    'Hr_specialist': '#51cf66',
    'Finance_manager': '#22b8cf',
    'Lawyer': '#9775fa',
    'Accountant': '#ff8787'
  };

  const nodeData = data as unknown as UserNodeData;
  const roleName = nodeData.role?.name || t`Unknown`;
  const firstName = nodeData.firstName || '';
  const lastName = nodeData.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || t`Unnamed User`;
  const roleColor = roleColors[roleName] || '#339af0';

  return (
    <Paper
      withBorder
      p="md"
      style={{
        minWidth: 280,
        maxWidth: 320,
        backgroundColor: 'white',
        borderColor: roleColor,
        borderWidth: 2,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
      }}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: roleColor,
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      
      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: roleColor,
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      <Stack gap="sm">
        {/* Header with Avatar and Basic Info */}
        <Group gap="md">
          <Avatar 
            size="lg" 
            radius="xl" 
            style={{ backgroundColor: roleColor }}
          >
            {nodeData.isSelfManaged ? (
              <Crown size={24} color="white" />
            ) : (
              <User size={24} color="white" />
            )}
          </Avatar>
          
          <Box style={{ flex: 1 }}>
            <Text size="lg" fw={600} lineClamp={1}>
              {fullName}
            </Text>
            <Badge 
              size="sm" 
              variant="light" 
              style={{ backgroundColor: `${roleColor}20`, color: roleColor }}
            >
              {roleName}
            </Badge>
          </Box>
        </Group>

        {/* Contact Information */}
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <Mail size={14} style={{ color: '#868e96' }} />
            <Text size="sm" c="dimmed" lineClamp={1}>
              {nodeData.email}
            </Text>
          </Group>
          
          {nodeData.phoneNumber && (
            <Group gap="xs" align="center">
              <Phone size={14} style={{ color: '#868e96' }} />
              <Text size="sm" c="dimmed">
                {nodeData.phoneNumber}
              </Text>
            </Group>
          )}
        </Stack>

        {/* Status Badges */}
        <Group gap="xs">
          {nodeData.isSelfManaged && (
            <Badge size="xs" variant="filled" color="yellow">
              <Trans>Self-managed</Trans>
            </Badge>
          )}
          
          {nodeData.subordinateCount > 0 && (
            <Badge size="xs" variant="outline" color="gray">
              {nodeData.subordinateCount} <Plural
                value={nodeData.subordinateCount}
                one="subordinate"
                other="subordinates"
              />
            </Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

// Node types for React Flow
const nodeTypes = {
  userNode: UserNode,
};

// Function to convert hierarchy data to React Flow nodes and edges
function convertHierarchyToFlow(hierarchy: HierarchyNode[]): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function processNode(node: HierarchyNode, level: number = 0) {
    // Create the node
    nodes.push({
      id: node.id,
      type: 'userNode',
      position: { x: 0, y: 0 }, // Will be set by layout
      data: {
        ...node,
        subordinateCount: node.subordinates.length,
        level,
      } as UserNodeData,
    });

    // Create edges to subordinates
    node.subordinates.forEach((subordinate) => {
              edges.push({
          id: `${node.id}-${subordinate.id}`,
          source: node.id,
          target: subordinate.id,
          type: 'smoothstep',
          style: { 
            strokeWidth: 2, 
            stroke: '#64748b',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
            width: 16,
            height: 16,
          },
        });

      // Recursively process subordinates
      processNode(subordinate, level + 1);
    });
  }

  hierarchy.forEach(rootNode => processNode(rootNode));
  
  return { nodes, edges };
}

// Layout function using Dagre
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 320, height: 180 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 160, // Center the node
        y: nodeWithPosition.y - 90,  // Center the node
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// Main Flow Component
function OrganizationFlow() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const { fitView } = useReactFlow();
  const { t } = useLingui();
  
  const { data, isLoading, error, refetch } = trpc.admin.users.getOrganizationHierarchy.useQuery();
  
  // Convert hierarchy to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!data?.hierarchy) return { nodes: [], edges: [] };
    return convertHierarchyToFlow(data.hierarchy);
  }, [data]);

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (initialNodes.length === 0) return { nodes: [], edges: [] };
    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [initialNodes, initialEdges]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!debouncedSearch.trim()) return layoutedNodes;
    
    return layoutedNodes.filter(node => {
      const data = node.data as unknown as HierarchyNode;
      const firstName = data.firstName || '';
      const lastName = data.lastName || '';
      const email = data.email || '';
      const roleName = data.role?.name || '';
      
      return (
        firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        roleName.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    });
  }, [layoutedNodes, debouncedSearch]);

  // Filter edges to only show connections between visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(node => node.id));
    return layoutedEdges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [layoutedEdges, filteredNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Update nodes and edges when filtered data changes
  useMemo(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  const onLayout = useCallback((direction: string) => {
    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      filteredEdges,
      direction
    );
    
    setNodes([...layouted]);
    setEdges([...layoutedEdges]);
    
    setTimeout(() => fitView(), 50);
  }, [filteredNodes, filteredEdges, setNodes, setEdges, fitView]);

  if (isLoading) {
    return (
      <Center h="400px">
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text><Trans>Loading organization chart...</Trans></Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title={<Trans>Error loading hierarchy</Trans>}>
        <Trans>Failed to load the organization hierarchy. Please try again later.</Trans>
      </Alert>
    );
  }

  return (
    <Paper withBorder style={{ height: '600px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#64748b' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        }}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const roleColors: Record<string, string> = {
              'Admin': '#fa5252',
              'Ceo': '#fab005',
              'Operations_director': '#339af0',
              'Hr_specialist': '#51cf66',
              'Finance_manager': '#22b8cf',
              'Lawyer': '#9775fa',
              'Accountant': '#ff8787'
            };
            const roleName = (node.data as unknown as HierarchyNode).role?.name;
            return roleColors[roleName ?? ''] || '#339af0';
          }}
        />
        
        {/* Search Panel */}
        <Panel position="top-left">
          <TextInput
            placeholder={t`Search by name or role...`}
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ minWidth: 250 }}
          />
        </Panel>
        
        {/* Layout Controls */}
        <Panel position="top-right">
          <Stack gap="xs">
            <ActionIcon 
              variant="light" 
              onClick={() => onLayout('TB')}
              title={t`Vertical Layout`}
            >
              ↓
            </ActionIcon>
            <ActionIcon 
              variant="light" 
              onClick={() => onLayout('LR')}
              title={t`Horizontal Layout`}
            >
              →
            </ActionIcon>
            <ActionIcon 
              variant="light" 
              onClick={() => fitView()}
              title={t`Fit View`}
            >
              ⌂
            </ActionIcon>
          </Stack>
        </Panel>

        {/* No Results Message */}
        {filteredNodes.length === 0 && debouncedSearch.trim() && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}>
            <Paper p="xl" withBorder shadow="md">
              <Stack align="center" gap="sm">
                <Text size="lg" fw={500}><Trans>No Results Found</Trans></Text>
                <Text c="dimmed"><Trans>No users match the current search criteria.</Trans></Text>
              </Stack>
            </Paper>
          </div>
        )}
      </ReactFlow>
    </Paper>
  );
}

// Main Page Component
export default function OrganizationHierarchyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLingui();
  
  const { data, isLoading, error, refetch } = trpc.admin.users.getOrganizationHierarchy.useQuery();
  
  const statistics = data?.statistics || {
    totalUsers: 0,
    managersCount: 0,
    topLevelCount: 0,
    rolesCount: 0,
  };

  return (
    <Container size="xl">
      <PageTitle 
        title={t`Organization Hierarchy`}
        right={
          <Group>
            <TextInput
              placeholder={t`Search users...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<Search size={16} />}
              style={{ minWidth: 250 }}
            />
            <ActionIcon 
              variant="light" 
              onClick={() => refetch()}
              loading={isLoading}
              title={t`Refresh`}
            >
              <RotateCcw size={16} />
            </ActionIcon>
          </Group>
        }
      />

      {/* Statistics Cards */}
      <Group mt="lg" mb="lg">
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group>
            <ActionIcon variant="light" color="blue" size="xl" radius="md">
              <Users size={24} />
            </ActionIcon>
            <Box>
              <Text size="xs" c="dimmed"><Trans>Total Users</Trans></Text>
              <Text size="xl" fw={700}>{isLoading ? <Loader size="xs" /> : statistics.totalUsers}</Text>
            </Box>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group>
            <ActionIcon variant="light" color="green" size="xl" radius="md">
              <Briefcase size={24} />
            </ActionIcon>
            <Box>
              <Text size="xs" c="dimmed"><Trans>Managers</Trans></Text>
              <Text size="xl" fw={700}>{isLoading ? <Loader size="xs" /> : statistics.managersCount}</Text>
            </Box>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group>
            <ActionIcon variant="light" color="yellow" size="xl" radius="md">
              <Crown size={24} />
            </ActionIcon>
            <Box>
              <Text size="xs" c="dimmed"><Trans>Top-level Nodes</Trans></Text>
              <Text size="xl" fw={700}>{isLoading ? <Loader size="xs" /> : statistics.topLevelCount}</Text>
            </Box>
          </Group>
        </Paper>
        
        <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
          <Group>
            <ActionIcon variant="light" color="violet" size="xl" radius="md">
              <UserCheck size={24} />
            </ActionIcon>
            <Box>
              <Text size="xs" c="dimmed"><Trans>Unique Roles</Trans></Text>
              <Text size="xl" fw={700}>{isLoading ? <Loader size="xs" /> : statistics.rolesCount}</Text>
            </Box>
          </Group>
        </Paper>
      </Group>
      
      {/* React Flow Organization Chart */}
      <ReactFlowProvider>
        <OrganizationFlow />
      </ReactFlowProvider>
    </Container>
  );
} 