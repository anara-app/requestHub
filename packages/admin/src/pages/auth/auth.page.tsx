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
import { useNavigate, useSearchParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import logo from "../../assets/logo.png";
import { Typography } from "../../components/Typography";
import { useLingui } from "@lingui/react/macro";
import { authClient } from "../../common/auth";
import { useState } from "react";
import { ROUTES } from "../../router/routes";

const defaultValues = {
  email: "",
  password: "",
};

const validationSchema = z.object({
  email: z.string().min(1, "E-mail некорректен"),
  password: z.string().min(4, "Пароль должен быть не менее 6 символов"),
});

export default function AuthPage() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  const handleLogIn = async (formData: typeof defaultValues) => {
    try {
      setIsPending(true);
      await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });
      await authClient.getSession();

      const redirectedFrom = searchParams.get("redirectedFrom");
      if (redirectedFrom) {
        navigate(redirectedFrom);
      } else {
        navigate(ROUTES.DASHBOARD_HOME);
      }
    } catch (error) {
      if (error instanceof Error) {
        notifications.show({
          title: t`Error`,
          message: error.message,
          color: "red",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Flex h="100vh" w="100%" align="center" justify="center">
      <Container w="100%" size={420} my={40}>
        <Center>
          <img style={{ height: 40 }} src={logo} alt="logo" />
        </Center>
        <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
          <TextInput
            label={t`Логин`}
            error={errors.email?.message}
            {...register("email")}
            mb="sm"
            placeholder={t`Логин`}
            required
          />
          <PasswordInput
            required
            mt="md"
            error={errors.password?.message}
            {...register("password")}
            mb="sm"
            placeholder={t`Пароль`}
            label={t`Пароль`}
            type="password"
          />
          <Button
            type="submit"
            loading={isPending}
            onClick={handleSubmit(handleLogIn)}
            fullWidth
            mt="xl"
          >
            <Typography>{t`Sign In`}</Typography>
          </Button>
        </Paper>
      </Container>
    </Flex>
  );
}
