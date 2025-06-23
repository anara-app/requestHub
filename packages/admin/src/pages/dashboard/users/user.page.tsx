import { useLingui } from "@lingui/react/macro";
import { Center, Container, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "../../../common/trpc";
import UserForm, { UserFormData } from "../../../components/Forms/UserForm";
import PageTitle from "../../../components/PageTitle";

export default function UserPage() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { mutate: deleteUser } = trpc.admin.users.deleteUser.useMutation();
  const { mutate: updateUser, isPending: isUpdatePending } =
    trpc.admin.users.updateUser.useMutation();
  const { mutate: createUser, isPending: isCreatePending } =
    trpc.admin.users.createUser.useMutation();
  const { data, isLoading } = trpc.admin.users.getUserById.useQuery(
    {
      id: id!,
    },
    { enabled: isEdit, gcTime: 0 }
  );

  const handleSave = (data: UserFormData) => {
    if (isEdit) {
      updateUser(
        {
          id: id!,
          //@ts-expect-error types TODO: fix types
          data,
        },
        {
          onSuccess: () => {
            notifications.show({
              message: "Пользователь успешно обновлен",
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

    //@ts-expect-error types TODO: fix types
    createUser(data, {
      onSuccess: () => {
        notifications.show({
          message: t`User successfully created`,
          color: "green",
        });
        navigate(-1);
      },
      onError: (error) => {
        notifications.show({
          title: t`Error`,
          message: error.message,
          color: "red",
        });
      },
    });
  };

  const handleDelete = () => {
    deleteUser(
      { id: id! },
      {
        onSuccess: () => {
          notifications.show({
            message: t`User successfully deleted`,
            color: "green",
          });
          navigate(-1);
        },
      }
    );
  };

  const formData = isEdit ? { ...data } : {};

  return (
    <Container size="xl" my="lg">
      <PageTitle title={isEdit ? t`Edit User` : t`Create User`} showBack />
      {isEdit && isLoading ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <UserForm
          onSave={handleSave}
          initialData={formData as UserFormData}
          isLoading={isEdit ? isUpdatePending : isCreatePending}
          onDeleteUser={isEdit ? handleDelete : undefined}
        />
      )}
    </Container>
  );
}
