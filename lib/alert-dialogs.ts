import { useAlertDialogStore } from "@/hooks/useAlertDialogStore";

const { open, close } = useAlertDialogStore.getState();

export const alertDialogs = { open, close };
