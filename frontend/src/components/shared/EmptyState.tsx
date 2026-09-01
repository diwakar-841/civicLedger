import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-20 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-navy-400">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-navy-800">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-navy-500">{description}</p>
      )}
      {action}
    </div>
  );
}
