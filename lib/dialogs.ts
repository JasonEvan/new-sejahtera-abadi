import { useDialogStore } from "@/hooks/useDialogStore";

const { open, close } = useDialogStore.getState();

export const dialogs = { open, close };
