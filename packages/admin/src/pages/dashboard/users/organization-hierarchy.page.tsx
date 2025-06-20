import { useState } from "react";
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
  Divider,
  Card,
  ActionIcon,
} from "@mantine/core";
import { 
  Users, 
  Search, 
  User,
  Building,
  Mail,
  Phone,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Crown,
  UserCheck,
} from "lucide-react";
import { trpc } from "../../../common/trpc";
import PageTitle from "../../../components/PageTitle";
import { useDebouncedValue } from "@mantine/hooks";

interface HierarchyNode {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  createdAt: string;
  role: {
    id: string;
    name: string;
  } | null;
  managerId: string | null;
  isSelfManaged: boolean;
  subordinates: HierarchyNode[];
}

interface TreeNodeProps {
  node: HierarchyNode;
  level: number;
  searchTerm: string;
  isLast?: boolean;
  parentPrefix?: string;
}

function TreeNode({ node, level, searchTerm, isLast = false, parentPrefix = "" }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  
  const userDisplayName = `${node.firstName || ''} ${node.lastName || ''}`.trim() || 'Unnamed User';
  const hasSubordinates = node.subordinates && node.subordinates.length > 0;
  
  // Check if this node or any subordinate matches the search
  const matchesSearch = !searchTerm || 
    userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.role?.name.toLowerCase().includes(searchTerm.toLowerCase());
  
  const hasMatchingSubordinate = (nodes: HierarchyNode[]): boolean => {
    return nodes.some(sub => {
      const subName = `${sub.firstName || ''} ${sub.lastName || ''}`.trim();
      return subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             sub.role?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             hasMatchingSubordinate(sub.subordinates || []);
    });
  };
  
  // Hide this node if it doesn't match and has no matching subordinates
  if (searchTerm && !matchesSearch && !hasMatchingSubordinate(node.subordinates || [])) {
    return null;
  }
  
  const currentPrefix = level === 0 ? "" : parentPrefix + (isLast ? "    " : "│   ");
  const connector = level === 0 ? "🏢 " : (isLast ? "└── " : "├── ");
  
  return (
    <Box>
      <Group
        gap="xs"
        style={{
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: 6,
          backgroundColor: matchesSearch && searchTerm ? 'var(--mantine-color-blue-0)' : 'transparent',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      >
        <Text
          size="sm"
          style={{ 
            fontFamily: 'monospace',
            color: 'var(--mantine-color-gray-6)',
            minWidth: level * 20 + 60,
          }}
        >
          {currentPrefix + connector}
        </Text>
        
        {hasSubordinates && (
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </ActionIcon>
        )}
        
        <Avatar size="sm" radius="xl" color={level === 0 ? "gold" : "blue"}>
          {level === 0 ? <Crown size={14} /> : <User size={14} />}
        </Avatar>
        
        <Box style={{ flex: 1 }}>
          <Group gap="xs">
            <Text fw={500} size="sm">
              {userDisplayName}
            </Text>
            {node.role && (
              <Badge variant="light" size="xs" color="blue">
                {node.role.name}
              </Badge>
            )}
            {node.isSelfManaged && (
              <Badge variant="filled" size="xs" color="gold">
                Self-managed
              </Badge>
            )}
            {hasSubordinates && (
              <Badge variant="outline" size="xs" color="gray">
                {node.subordinates.length} subordinate{node.subordinates.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </Group>
          
          <Group gap="xs" mt={2}>
            <Group gap={4}>
              <Mail size={12} />
              <Text size="xs" c="dimmed">
                {node.email}
              </Text>
            </Group>
            
            {node.phoneNumber && (
              <Group gap={4}>
                <Phone size={12} />
                <Text size="xs" c="dimmed">
                  {node.phoneNumber}
                </Text>
              </Group>
            )}
          </Group>
        </Box>
      </Group>
      
      {isExpanded && hasSubordinates && (
        <Box>
          {node.subordinates.map((subordinate, index) => (
            <TreeNode
              key={subordinate.id}
              node={subordinate}
              level={level + 1}
              searchTerm={searchTerm}
              isLast={index === node.subordinates.length - 1}
              parentPrefix={currentPrefix}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function OrganizationHierarchyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  
  const { data, isLoading, error } = trpc.admin.users.getOrganizationHierarchy.useQuery();
  
  if (isLoading) {
    return (
      <Container>
        <PageTitle title="Organization Hierarchy" />
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <PageTitle title="Organization Hierarchy" />
        <Paper p="md" withBorder>
          <Text c="red">Error loading organization hierarchy: {error.message}</Text>
        </Paper>
      </Container>
    );
  }
  
  const hierarchy = data?.hierarchy || [];
  const statistics = data?.statistics || {
    totalUsers: 0,
    managersCount: 0,
    topLevelCount: 0,
    rolesCount: 0,
  };
  
  // Filter hierarchy based on search
  const filteredHierarchy = hierarchy.filter(node => {
    if (!debouncedSearch) return true;
    
    const matchesNode = (n: HierarchyNode): boolean => {
      const name = `${n.firstName || ''} ${n.lastName || ''}`.trim();
      const matches = name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                     n.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                     n.role?.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      if (matches) return true;
      return n.subordinates?.some(sub => matchesNode(sub)) || false;
    };
    
    return matchesNode(node);
  });
  
  return (
    <Container size="xl">
      <PageTitle 
        title="Organization Hierarchy" 
        right={
          <Group>
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<Search size={16} />}
              style={{ minWidth: 250 }}
            />
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
      
      <Paper withBorder p="md">
        <Group mb="md">
          <Building size={20} />
          <Text fw={600} size="lg">Organization Structure</Text>
        </Group>
        
        <Divider mb="md" />
        
        {filteredHierarchy.length === 0 ? (
          <Center py="xl">
            <Stack align="center">
              <Users size={48} color="gray" />
              <Text size="lg" c="dimmed">No users found</Text>
              <Text size="sm" c="dimmed">
                {searchTerm ? "Try adjusting your search terms" : "No users in the system"}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Box style={{ backgroundColor: 'var(--mantine-color-gray-0)', padding: '16px', borderRadius: '8px' }}>
            <Stack gap="xs">
              {filteredHierarchy.map((rootNode) => (
                <TreeNode
                  key={rootNode.id}
                  node={rootNode}
                  level={0}
                  searchTerm={debouncedSearch}
                />
              ))}
            </Stack>
          </Box>
        )}
        
        {searchTerm && (
          <Box mt="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: 4 }}>
            <Text size="sm" c="blue">
              🔍 Searching for "{searchTerm}" - Found {filteredHierarchy.length} matching hierarchy tree{filteredHierarchy.length !== 1 ? 's' : ''}
            </Text>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 