import { create } from "zustand";
import { TokenManager } from "../common/tokens";
import { Prisma } from "server/src/common/database-types";

interface AuthState {
  isAuth: boolean;
  user: Prisma.User | null;
  setUser: (user: Prisma.User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: !!TokenManager.getToken(),
  user: null,
  setUser: (user: Prisma.User) => set({ user, isAuth: true }),
  logout: () => set({ user: null, isAuth: false }),
}));
