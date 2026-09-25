import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-slate-300 bg-white checked:bg-slate-900 checked:border-slate-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:checked:bg-slate-50 dark:checked:border-slate-50 dark:focus-visible:ring-slate-300",
        className
      )}
      {...props}
    />
  );
}
