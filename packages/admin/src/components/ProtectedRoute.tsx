import { PropsWithChildren, useEffect } from "react";
import { useAuthStore } from "../store/useAuth";
import { ROUTES } from "../router/routes";
import { useNavigate } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
// import { ROUTES } from "../router/routes";
// import { Flex, Loader } from "@mantine/core";

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { isAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuth) {
      navigate(ROUTES.AUTH);
    }
  }, [isAuth]);

  // if (!user)
  //   return (
  //     <Flex h="100vh" w="100%" align="center" justify="center">
  //       <Loader />
  //     </Flex>
  //   );

  return children;
}
