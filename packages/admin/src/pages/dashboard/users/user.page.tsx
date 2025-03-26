import { Center, Container, Loader } from "@mantine/core";
import PageTitle from "../../../components/PageTitle";
import UserForm, { UserFormData } from "../../../components/Forms/UserForm";
import { trpc } from "../../../common/trpc";
import { useParams, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

export default function UserPage() {
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
      id: Number(id),
    },
    { enabled: isEdit, gcTime: 0 }
  );

  const handleSave = (data: UserFormData) => {
    if (isEdit) {
      updateUser(
        {
          id: Number(id),
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
          message: "Пользователь успешно создан",
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
    });
  };

  const handleDelete = () => {
    deleteUser(
      { id: Number(id) },
      {
        onSuccess: () => {
          notifications.show({
            message: "Пользователь успешно удален",
            color: "green",
          });
          navigate(-1);
        },
      }
    );
  };

  const formData = isEdit ? { ...data } : {};

  return (
    <Container p="md">
      <PageTitle
        title={isEdit ? "Редактировать пользователя" : "Создать пользователя"}
        showBack
      />
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
