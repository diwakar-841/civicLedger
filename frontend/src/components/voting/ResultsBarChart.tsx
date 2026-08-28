interface Row {
  id: string;
  label: string;
  sublabel?: string;
  votes: number;
}

export function ResultsBarChart({ rows, isFinal = false }: { rows: Row[]; isFinal?: boolean }) {
  const total = rows.reduce((sum, r) => sum + r.votes, 0);
  const max = Math.max(1, ...rows.map((r) => r.votes));
  const leaderId = total > 0 ? rows.reduce((a, b) => (b.votes > a.votes ? b : a)).id : null;

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.votes / total) * 100) : 0;
        const widthPct = Math.round((row.votes / max) * 100);
        const isLeader = row.id === leaderId && row.votes > 0;
        return (
          <div key={row.id}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-navy-900">{row.label}</p>
                {row.sublabel && <p className="text-xs text-navy-400">{row.sublabel}</p>}
                {isLeader && (
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700">
                    {isFinal ? "Winner" : "Leading"}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-navy-500">
                {row.votes} vote{row.votes === 1 ? "" : "s"} &middot; {pct}%
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-50">
              <div
                className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-700 ease-out ${isLeader ? "shadow-[0_0_12px_rgba(45,212,191,.45)]" : "opacity-70"}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
