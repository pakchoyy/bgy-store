import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",
        className
      )}
      {...props}
    />
  );
}
