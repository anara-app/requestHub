import {
  Button,
  Center,
  Container,
  Flex,
  Paper,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../router/routes";
import { trpc } from "../../common/trpc";
import { notifications } from "@mantine/notifications";
import { useAuthStore } from "../../store/useAuth";
import { TokenManager } from "../../common/tokens";
import { Prisma } from "server/src/common/database-types";
import logo from "../../assets/logo.png";

const defaultValues = {
  email: "",
  password: "",
};

const validationSchema = z.object({
  email: z.string().min(1, "E-mail некорректен"),
  password: z.string().min(4, "Пароль должен быть не менее 6 символов"),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = trpc.admin.auth.login.useMutation();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const handleLogIn = async (formData: typeof defaultValues) => {
    mutate(formData, {
      onSuccess: ({ user, token }) => {
        TokenManager.setToken(token);
        setUser(user as unknown as Prisma.User);
        navigate(ROUTES.DASHBOARD_HOME);
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

  return (
    <Flex h="100vh" w="100%" align="center" justify="center">
      <Container w="100%" size={420} my={40}>
        <Center>
          <img style={{ height: 40 }} src={logo} alt="logo" />
        </Center>
        <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
          <TextInput
            label="Логин"
            error={errors.email?.message}
            {...register("email")}
            mb="sm"
            placeholder="Логин"
            required
          />
          <PasswordInput
            required
            mt="md"
            error={errors.password?.message}
            {...register("password")}
            mb="sm"
            placeholder="Пароль"
            label="Пароль"
            type="password"
          />
          <Button
            type="submit"
            loading={isPending}
            onClick={handleSubmit(handleLogIn)}
            fullWidth
            mt="xl"
          >
            Войти
          </Button>
        </Paper>
      </Container>
    </Flex>
  );
}
