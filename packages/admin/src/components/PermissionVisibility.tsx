import { Box } from "@mantine/core";
import { PropsWithChildren } from "react";
import { trpc } from "../common/trpc";
import { Prisma } from "server/src/common/database-types";

interface PermissionVisibilityProps {
  permissions?: Prisma.PermissionOperation[];
}

export default function PermissionVisibility({
  children,
  permissions,
}: PropsWithChildren<PermissionVisibilityProps>) {
  const { data: myPermissions } = trpc.admin.users.getMyPermissions.useQuery();

  const hasPermission = permissions?.some((permission) =>
    myPermissions?.includes(permission)
  );

  if (!hasPermission) {
    return null;
  }

  return <Box>{children}</Box>;
}
