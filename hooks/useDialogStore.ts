import { create } from "zustand";

interface DialogProps {
  title: string;
  description: string;
  type: "text" | "form";
  formId?: string;
  mutationKey?: string[];
  children: React.ReactNode;
}

interface DialogStore {
  isOpen: boolean;
  props: DialogProps | null;
  open: (props: DialogProps) => void;
  close: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  isOpen: false,
  props: null,
  open: (props) => set({ isOpen: true, props }),
  close: () => set({ isOpen: false, props: null }),
}));
