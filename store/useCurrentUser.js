
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export const useCurrentUser = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
        clearUser: () => set({ user: null })
      }),
      {
        name: "auth-storage",
      }
    )
  )
);
