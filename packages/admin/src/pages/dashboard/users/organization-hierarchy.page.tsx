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

// Custom Node Component
function UserNode({ data }: NodeProps) {
  const roleColors: Record<string, string> = {
    'Admin': '#fa5252',
    'Ceo': '#fab005',
    'Manager': '#339af0',
    'Hr': '#51cf66',
    'Finance': '#22b8cf',
    'Lawyer': '#9775fa',
    'Accountant': '#ff8787',
    'Initiator': '#868e96'
  };

  const nodeData = data as HierarchyNode & { subordinateCount: number; level: number };
  const roleName = nodeData.role?.name || 'Unknown';
  const firstName = nodeData.firstName || '';
  const lastName = nodeData.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed User';
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
            {data.isSelfManaged ? (
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
              {data.email}
            </Text>
          </Group>
          
          {data.phoneNumber && (
            <Group gap="xs" align="center">
              <Phone size={14} style={{ color: '#868e96' }} />
              <Text size="sm" c="dimmed">
                {data.phoneNumber}
              </Text>
            </Group>
          )}
        </Stack>

        {/* Status Badges */}
        <Group gap="xs">
          {data.isSelfManaged && (
            <Badge size="xs" variant="filled" color="yellow">
              Self-managed
            </Badge>
          )}
          
          {data.subordinateCount > 0 && (
            <Badge size="xs" variant="outline" color="gray">
              {data.subordinateCount} subordinate{data.subordinateCount !== 1 ? 's' : ''}
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
      },
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
      const firstName = node.data.firstName || '';
      const lastName = node.data.lastName || '';
      const email = node.data.email || '';
      const roleName = node.data.role?.name || '';
      
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
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error loading hierarchy">
        {error.message}
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
              'Manager': '#339af0',
              'Hr': '#51cf66',
              'Finance': '#22b8cf',
              'Lawyer': '#9775fa',
              'Accountant': '#ff8787',
              'Initiator': '#868e96'
            };
            return roleColors[node.data?.role?.name] || '#339af0';
          }}
        />
        
        {/* Layout Controls */}
        <Panel position="top-right">
          <Stack gap="xs">
            <ActionIcon 
              variant="light" 
              onClick={() => onLayout('TB')}
              title="Vertical Layout"
            >
              ↓
            </ActionIcon>
            <ActionIcon 
              variant="light" 
              onClick={() => onLayout('LR')}
              title="Horizontal Layout"
            >
              →
            </ActionIcon>
            <ActionIcon 
              variant="light" 
              onClick={() => fitView()}
              title="Fit View"
            >
              ⌂
            </ActionIcon>
          </Stack>
        </Panel>
      </ReactFlow>
    </Paper>
  );
}

// Main Page Component
export default function OrganizationHierarchyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
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
        title="Organization Hierarchy" 
        right={
          <Group>
            <TextInput
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<Search size={16} />}
              style={{ minWidth: 250 }}
            />
            <ActionIcon 
              variant="light" 
              onClick={() => refetch()}
              loading={isLoading}
            >
              <RotateCcw size={16} />
            </ActionIcon>
          </Group>
        }
      />
      
      {/* Statistics Cards */}
      <Group mb="lg">
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="blue" radius="xl">
              <Users size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Total Users</Text>
              <Text fw={700} size="lg">{statistics.totalUsers}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="green" radius="xl">
              <UserCheck size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Managers</Text>
              <Text fw={700} size="lg">{statistics.managersCount}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="orange" radius="xl">
              <Building size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Top Level</Text>
              <Text fw={700} size="lg">{statistics.topLevelCount}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder p="md" style={{ flex: 1 }}>
          <Group>
            <Avatar color="purple" radius="xl">
              <Briefcase size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">Roles</Text>
              <Text fw={700} size="lg">{statistics.rolesCount}</Text>
            </div>
          </Group>
        </Card>
      </Group>
      
      {/* React Flow Organization Chart */}
      <ReactFlowProvider>
        <OrganizationFlow />
      </ReactFlowProvider>
    </Container>
  );
} 