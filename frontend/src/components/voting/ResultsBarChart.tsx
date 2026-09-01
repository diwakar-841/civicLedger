import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function ResultsBarChart({ rows, isFinal = false }) {
  const total = rows.reduce((sum, r) => {return sum + r.votes;}, 0);
  const max = Math.max(1, ...rows.map((r) => {return r.votes;}));
  const leaderId = total > 0 ? rows.reduce((a, b) => {return b.votes > a.votes ? b : a;}).id : null;

  return (
    _jsxDEV("div", {
 className: "flex flex-col gap-4", children:
      rows.map((row) => {
        const pct = total > 0 ? Math.round(row.votes / total * 100) : 0;
        const widthPct = Math.round(row.votes / max * 100);
        const isLeader = row.id === leaderId && row.votes > 0;
        return (
          _jsxDEV("div", {
 children: [
            _jsxDEV("div", {
 className: "mb-1.5 flex items-baseline justify-between", children: [
              _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                _jsxDEV("p", { className: "font-semibold text-navy-900", children: row.label }, void 0, false),
                row.sublabel && _jsxDEV("p", { className: "text-xs text-navy-400", children: row.sublabel }, void 0, false),
                isLeader &&
                _jsxDEV("span", {
 className: "rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700", children:
                  isFinal ? "Winner" : "Leading" 
}, void 0, false
                )] 
}, void 0, true

              ),
              _jsxDEV("p", {
 className: "text-sm font-medium text-navy-500", children: [
                row.votes, " vote", row.votes === 1 ? "" : "s", " · ", pct, "%"] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV("div", {
 className: "h-3 w-full overflow-hidden rounded-full bg-indigo-50", children:
              _jsxDEV("div", {
                className: `h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-700 ease-out ${isLeader ? "shadow-[0_0_12px_rgba(45,212,191,.45)]" : "opacity-70"}`,
                style: { width: `${widthPct}%` } 
}, void 0, false
              ) 
}, void 0, false
            )] 
}, row.id, true
          ));

      }) 
}, void 0, false
    ));

}