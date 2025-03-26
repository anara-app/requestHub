import { Center, Container, Loader } from "@mantine/core";
import PageTitle from "../../../components/PageTitle";
import { trpc } from "../../../common/trpc";
import { useParams, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import RoleForm, { RoleFormData } from "../../../components/Forms/RoleForm";
import { Prisma } from "server/src/common/database-types";

export default function RolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { mutate: deleteRole } = trpc.admin.roles.deleteRole.useMutation();

  const { mutate: updateRole, isPending: isUpdatePending } =
    trpc.admin.roles.updateRole.useMutation();

  const { mutate: createRole, isPending: isCreatePending } =
    trpc.admin.roles.createRole.useMutation();

  const { data: role, isLoading } = trpc.admin.roles.getRole.useQuery(
    { id: Number(id) },
    {
      enabled: isEdit,
      gcTime: 0,
    }
  );

  const onSubmit = (values: RoleFormData) => {
    const permissions = values.permissions as Prisma.PermissionOperation[];

    if (isEdit) {
      updateRole(
        {
          id: Number(id),
          name: values.name,
          permissions,
        },
        {
          onSuccess: () => {
            notifications.show({
              message: "Роль успешно обновлена",
              color: "green",
            });
            navigate(-1);
          },
          onError: (error) => {
            notifications.show({
              title: "Ошибка",
              message: error.message,
              color: "red",
            });
          },
        }
      );
      return;
    }

    createRole(
      { name: values.name, permissions },
      {
        onSuccess: () => {
          notifications.show({
            message: "Роль успешно создана",
            color: "green",
          });
          navigate(-1);
        },
        onError: (error) => {
          notifications.show({
            title: "Ошибка",
            message: error.message,
            color: "red",
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;

    deleteRole(
      { id: Number(id) },
      {
        onSuccess: () => {
          notifications.show({
            message: "Роль успешно удалена",
            color: "green",
          });
          navigate(-1);
        },
        onError: (error) => {
          notifications.show({
            title: "Ошибка",
            message: error.message,
            color: "red",
          });
        },
      }
    );
  };

  const initialData = {
    name: role?.name ?? "",
    permissions: (role?.permissions.map((permission) => permission.action) ??
      []) as Prisma.PermissionOperation[],
  };

  return (
    <Container p="md">
      <PageTitle
        title={isEdit ? "Редактировать роль" : "Создать роль"}
        showBack
      />
      {isEdit && isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <RoleForm
          initialData={isEdit ? initialData : undefined}
          onSave={onSubmit}
          isLoading={isEdit ? isUpdatePending : isCreatePending}
          onDelete={isEdit ? handleDelete : undefined}
        />
      )}
    </Container>
  );
}
