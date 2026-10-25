import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        default: "bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-800",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-600 dark:hover:bg-red-600",
        outline: "border border-slate-200 text-slate-800 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
        ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-10 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, asChild, ...props }) {
  const Comp = asChild ? 'div' : 'button';
  if (asChild) {
    return (
      <div className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
