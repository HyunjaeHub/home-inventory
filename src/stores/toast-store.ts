import { create } from 'zustand';

type ToastState = {
  message: string | null;
  show: (message: string) => void;
};

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), 2000);
  },
}));

export const showToast = (message: string) => useToast.getState().show(message);
