import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Pagination({ className, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }) {
  return (
    <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />
  );
}

export function PaginationItem({ ...props }) {
  return <li {...props} />;
}

export function PaginationLink({
  isActive,
  disabled,
  className,
  ...props
}) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={cn("h-9 w-9 p-0", className)}
      {...props}
    />
  );
}

export function PaginationPrevious({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Halaman sebelumnya"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Sebelumnya</span>
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="Halaman berikutnya"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>Berikutnya</span>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </PaginationLink>
  );
}
