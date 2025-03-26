import { zodResolver } from "@hookform/resolvers/zod";
import { Box, TextInput, Group, Button } from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { confirmModal } from "../../common/modals";
import PermissionSelect from "./PermissionSelector";
import { Prisma } from "server/src/common/database-types";
import PermissionVisibility from "../PermissionVisibility";

const roleSchema = z.object({
  name: z.string().min(1, { message: "Название роли обязательно" }),
  permissions: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  initialData?: RoleFormData;
  onSave: (data: RoleFormData) => void;
  isLoading?: boolean;
  onDelete?: () => void;
}

export default function RoleForm({
  initialData,
  onSave,
  isLoading,
  onDelete,
}: RoleFormProps) {
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
      ...initialData,
    },
  });

  const handleSubmit = (values: RoleFormData) => {
    onSave(values);
  };

  const handleDelete = () => {
    confirmModal({
      title: "Удаление роли",
      body: "Вы уверены, что хотите удалить роль?",
      onConfirm: () => {
        onDelete?.();
      },
    });
  };

  const permissions = form.watch("permissions");

  return (
    <Box>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <TextInput
          label="Название роли"
          placeholder="Введите название роли"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />

        <Box my="md">
          <PermissionSelect
            selectedOperations={permissions as Prisma.PermissionOperation[]}
            setSelectedOperations={(operations) =>
              form.setValue("permissions", operations)
            }
          />
        </Box>

        <Group justify="flex-end" mt="md">
          {onDelete && (
            <PermissionVisibility permissions={["DELETE_ROLE"]}>
              <Button variant="outline" color="red" onClick={handleDelete}>
                Удалить
              </Button>
            </PermissionVisibility>
          )}

          <PermissionVisibility permissions={["CREATE_ROLE", "UPDATE_ROLE"]}>
            <Button loading={isLoading} type="submit">
              {initialData ? "Сохранить" : "Создать"}
            </Button>
          </PermissionVisibility>
        </Group>
      </form>
    </Box>
  );
}
