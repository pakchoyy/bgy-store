'use client';

import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { CloseButton } from '@/components/ui/close-button';

const DialogContext = createContext();

export function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, ...props }) {
  const { setOpen } = useContext(DialogContext);
  return (
    <button onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export function DialogContent({ className, children, ...props }) {
  const { open, setOpen } = useContext(DialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80">
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg duration-200 dark:border-slate-800 dark:bg-slate-950 rounded-lg">
        <CloseButton onClick={() => setOpen(false)} className="absolute right-4 top-4" />
        <div className={cn(className)} {...props}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4', className)} {...props} />
  );
}
