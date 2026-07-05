import { create } from "zustand";

type CartUiStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useCartUiStore = create<CartUiStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
