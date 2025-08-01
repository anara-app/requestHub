import { Center, Container, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useParams, useNavigate } from "react-router-dom";
import { Prisma } from "server/src/common/database-types";
import { trpc } from "../../../common/trpc";
import RoleForm, { RoleFormData } from "../../../components/Forms/RoleForm";
import PageTitle from "../../../components/PageTitle";

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
    { id: id! },
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
          id: id!,
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
      { id: id! },
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
    <Container size="xl" my="lg">
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
