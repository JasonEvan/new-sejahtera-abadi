"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAlertDialogStore } from "@/hooks/useAlertDialogStore";
import { alertDialogs } from "@/lib/alert-dialogs";
import { Trash2Icon } from "lucide-react";

export default function AlertDialogProvider() {
  const { isOpen, props } = useAlertDialogStore();

  if (!props) return null;

  const Icons = props.icon || Trash2Icon;

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }

    alertDialogs.close();
  };

  const handleConfirm = async () => {
    props.onConfirm();
    alertDialogs.close();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Icons />
          </AlertDialogMedia>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            variant="outline"
            onClick={handleCancel}
            className="cursor-pointer"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            type="button"
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            {props.confirmText || "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
