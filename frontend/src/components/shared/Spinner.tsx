import { Loader2 } from "lucide-react";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy-400">
      <div className="relative"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      <p className="text-sm font-medium">{label}...</p>
    </div>
  );
}
