import { PropsWithChildren } from "react";
import { Alert, Container, Text } from "@mantine/core";
import { AlertCircle } from "lucide-react";
import { trpc } from "../common/trpc";
import { Prisma } from "server/src/common/database-types";
import { Trans } from "@lingui/react/macro";

interface ProtectedRouteProps {
  requiredPermissions?: Prisma.PermissionOperation[];
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions 
}: PropsWithChildren<ProtectedRouteProps>) {
  const { data: myPermissions, isLoading } = trpc.admin.users.getMyPermissions.useQuery();

  // If no permissions are required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <Container size="sm" py="xl">
        <Text ta="center" c="dimmed">
          <Trans>Loading...</Trans>
        </Text>
      </Container>
    );
  }

  // Check if user has at least one of the required permissions
  const hasPermission = requiredPermissions.some((permission) =>
    myPermissions?.includes(permission)
  );

  if (!hasPermission) {
    return (
      <Container size="sm" py="xl">
        <Alert 
          icon={<AlertCircle size="1rem" />} 
          title={<Trans>Access Denied</Trans>}
          color="red"
        >
          <Text>
            <Trans>You don't have permission to access this page. Please contact your administrator if you believe this is an error.</Trans>
          </Text>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
}
