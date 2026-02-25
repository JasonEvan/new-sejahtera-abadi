import { Trash2Icon } from "lucide-react";
import { create } from "zustand";

interface AlertDialogProps {
  title: string;
  description: string;
  icon?: typeof Trash2Icon;
  onConfirm: () => void;
}

interface AlertDialogStore {
  isOpen: boolean;
  props: AlertDialogProps | null;
  open: (props: AlertDialogProps) => void;
  close: () => void;
}

export const useAlertDialogStore = create<AlertDialogStore>((set) => ({
  isOpen: false,
  props: null,
  open: (props) => set({ isOpen: true, props }),
  close: () => set({ isOpen: false, props: null }),
}));
