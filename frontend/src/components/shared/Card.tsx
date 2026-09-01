import { HTMLAttributes, ReactNode } from "react";

export function Card({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-navy-100/90 bg-white shadow-card transition-all duration-200 dark:border-navy-800 dark:bg-navy-900 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
