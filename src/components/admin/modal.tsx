"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl",
            wide ? "max-w-3xl" : "max-w-lg",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <Dialog.Title className="font-display font-semibold text-lg">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-muted mt-1">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
