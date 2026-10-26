"use client";

import { useDialogStore } from "@/hooks/useDialogStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { dialogs } from "@/lib/dialogs";
import { useIsMutating } from "@tanstack/react-query";

export default function DialogProvider() {
  const { isOpen, props } = useDialogStore();

  const mutationKey = props?.mutationKey || ["__NO_MUTATION_KEY__"];
  const isMutating = useIsMutating({ mutationKey });
  const isSubmitting = isMutating > 0;

  if (!props) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className={
          props.size === "tall"
            ? "h-[85dvh] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <div
          className={`no-scrollbar -mx-4 overflow-y-auto px-4 ${
            props.size === "tall" ? "min-h-0" : "max-h-[50vh]"
          }`}
        >
          {props.children}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={dialogs.close}
            className="cursor-pointer"
            disabled={isSubmitting}
          >
            Close
          </Button>
          {props.type === "form" && (
            <Button
              type="submit"
              form={props.formId}
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              Submit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
