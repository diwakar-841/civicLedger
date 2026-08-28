type Status = "draft" | "active" | "closed" | "cancelled";

const STYLES: Record<Status, string> = {
  draft: "border border-slate-200 bg-slate-50 text-slate-600",
  active: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border border-slate-200 bg-slate-100 text-slate-600",
  cancelled: "border border-rose-200 bg-rose-50 text-rose-700",
};

const LABELS: Record<Status, string> = {
  draft: "Draft",
  active: "Open for voting",
  closed: "Closed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] ${STYLES[status]}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-emerald-500 animate-pulse" : status === "draft" ? "bg-navy-400" : status === "cancelled" ? "bg-red-400" : "bg-navy-300"}`}
      />
      {LABELS[status]}
    </span>
  );
}
