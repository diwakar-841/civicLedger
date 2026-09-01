import { useState } from "react";
import { CalendarClock, CheckCircle2, Radio } from "lucide-react";
import { Card } from "../shared/Card";
import { Button } from "../shared/Button";
import { useUpdateResultsSettings } from "../../hooks/useAdminElections";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

interface Props {
  electionId: string;
  liveResultsEnabled: boolean;
  resultsReleaseAt: string | null;
  resultsPublishedAt: string | null;
  onUpdated: () => void | Promise<void>;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ResultsSettingsCard({
  electionId,
  liveResultsEnabled,
  resultsReleaseAt,
  resultsPublishedAt,
  onUpdated,
}: Props) {
  const { updateResultsSettings, loading } = useUpdateResultsSettings();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"live" | "manual">(
    liveResultsEnabled ? "live" : "manual",
  );
  const [releaseInput, setReleaseInput] = useState(
    resultsReleaseAt ? toLocalInput(new Date(resultsReleaseAt)) : "",
  );

  const published = Boolean(resultsPublishedAt);

  async function handleSave() {
    try {
      if (mode === "live") {
        await updateResultsSettings(electionId, { mode: "live" });
      } else {
        const date = releaseInput ? new Date(releaseInput) : null;
        if (!date || Number.isNaN(date.getTime())) {
          show("Choose a valid results release date.", "error");
          return;
        }
        await updateResultsSettings(electionId, {
          mode: "manual",
          resultsReleaseAt: date.toISOString(),
        });
      }
      show("Results settings updated.", "success");
      setEditing(false);
      await onUpdated();
    } catch (err) {
      show(formatError(err, "Failed to update results settings"), "error");
    }
  }

  return (
    <Card className="mt-4 p-4">
      <p className="text-sm font-semibold text-navy-900">Results</p>

      {!editing ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-navy-700">
            {liveResultsEnabled ? (
              <>
                <Radio className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span>
                  Live results {published ? "(visible to voters)" : ""}
                </span>
              </>
            ) : resultsReleaseAt ? (
              <>
                <CalendarClock className="h-4 w-4 flex-shrink-0 text-gold-600" />
                <span>
                  {published ? "Released" : "Releases"}{" "}
                  {new Date(resultsReleaseAt).toLocaleString()}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-navy-400" />
                <span>Not configured</span>
              </>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            {resultsReleaseAt && !liveResultsEnabled
              ? "Extend / change"
              : "Change"}
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("live")}
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
                mode === "live"
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-700"
                  : "border-navy-200 text-navy-600 hover:bg-navy-50"
              }`}
            >
              Live results
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
                mode === "manual"
                  ? "border-gold-400 bg-gold-400/15 text-gold-700"
                  : "border-navy-200 text-navy-600 hover:bg-navy-50"
              }`}
            >
              Manual release date
            </button>
          </div>

          {mode === "manual" && (
            <label className="mt-3 block text-xs font-medium text-navy-500">
              Release results at
              <input
                type="datetime-local"
                value={releaseInput}
                onChange={(e) => setReleaseInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </label>
          )}

          <div className="mt-3 flex gap-2">
            <Button size="sm" loading={loading} onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
