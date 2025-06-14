import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  TextInput,
  Group,
  Button,
  Select,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { confirmModal } from "../../common/modals";
import { MediaFile } from "../../common/database.types";
import PermissionVisibility from "../PermissionVisibility";
import { trpc } from "../../common/trpc";

const schema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  email: z.string().email("Неверный формат email").optional(),
  phoneNumber: z.string().min(1, "Номер телефона обязателен"),
  password: z
    .string()
    .min(6, "Пароль должен быть не менее 6 символов")
    .optional()
    .or(z.literal("")),
  roleId: z.string(),
});

export type UserFormData = z.infer<typeof schema>;

interface UserFormProps {
  initialData?: UserFormData;
  onSave?: (data: UserFormData) => void;
  isLoading?: boolean;
  onDeleteUser?: () => void;
  initialPhoto?: MediaFile;
}

export default function UserForm({
  initialData,
  onSave,
  isLoading,
  onDeleteUser,
}: // initialPhoto,
UserFormProps) {
  // const [photo, setPhoto] = useState<MediaFile | undefined>(initialPhoto);

  const { data: roles, isLoading: isRolesLoading } =
    trpc.admin.roles.getRoles.useQuery();

  const form = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      roleId: undefined,
      ...initialData,
      password: "",
    },
  });

  const handleSubmit = (values: UserFormData) => {
    onSave?.({ ...values });
  };

  const handleDelete = () => {
    confirmModal({
      title: "Удаление пользователя",
      body: "Вы уверены, что хотите удалить пользователя?",
      onConfirm: () => {
        onDeleteUser?.();
      },
    });
  };

  const availableRoles = roles || [];
  const selectedRole = form.watch("roleId")?.toString();

  return (
    <Box>
      {/* <Box mb="md">
        <Center>
          <Flex direction="column" align="center" gap="md">
            <Avatar size="lg" src={photo?.url} />
            <SingleFileUploader
              label="Фото"
              accept="image/*"
              existingDocument={photo}
              onDocumentReady={setPhoto}
              onDocumentRemoved={() => setPhoto(undefined)}
            />
          </Flex>
        </Center>
      </Box> */}
      <TextInput
        label="Имя"
        placeholder="Введите имя"
        error={form.formState.errors.firstName?.message}
        {...form.register("firstName")}
      />
      <TextInput
        label="Фамилия"
        placeholder="Введите фамилию"
        error={form.formState.errors.lastName?.message}
        mt="md"
        {...form.register("lastName")}
      />
      <TextInput
        label="Номер телефона"
        placeholder="Введите номер телефона"
        error={form.formState.errors.phoneNumber?.message}
        mt="md"
        {...form.register("phoneNumber")}
      />
      <TextInput
        label="Email"
        placeholder="Введите email"
        error={form.formState.errors.email?.message}
        mt="md"
        {...form.register("email")}
      />
      <TextInput
        label="Пароль"
        placeholder="Введите пароль"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
        type="password"
        mt="md"
      />
      <Box pos="relative">
        <LoadingOverlay visible={isRolesLoading} />
        <Select
          mt="md"
          label="Роль"
          placeholder="Выберите роль"
          value={selectedRole}
          data={availableRoles?.map((role) => ({
            value: role.id.toString(),
            label: role.name,
          }))}
          onChange={(value) => {
            form.setValue("roleId", value ?? "");
          }}
        />
      </Box>
      <Group justify="flex-end" mt="md">
        {onDeleteUser && (
          <PermissionVisibility permissions={["DELETE_USER"]}>
            <Button variant="outline" color="red" onClick={handleDelete}>
              Удалить
            </Button>
          </PermissionVisibility>
        )}

        <PermissionVisibility permissions={["CREATE_USER", "UPDATE_USER"]}>
          <Button
            loading={isLoading}
            onClick={form.handleSubmit(handleSubmit)}
            type="submit"
          >
            Сохранить
          </Button>
        </PermissionVisibility>
      </Group>
    </Box>
  );
}
