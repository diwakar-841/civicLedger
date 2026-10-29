import { downloadAuthenticatedFile } from "../../lib/download";
import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";
import { useToast } from "../../contexts/ToastContext";
import type {
  AuditEntry,
  AuditLogResponse,
  AuditVerifyResponse,
} from "../../types/api";

const PAGE_SIZE = 20;

export function AuditLogPage() {
  const { show } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [pendingActor, setPendingActor] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResponse | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(
    async (pg: number, actor: string, action: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pg),
          pageSize: String(PAGE_SIZE),
          ...(actor ? { actor } : {}),
          ...(action ? { action } : {}),
        });
        const { data } = await apiClient.get<AuditLogResponse>(
          `/admin/audit-log?${params}`,
        );
        setEntries(data.entries);
        setTotal(data.total);
      } catch (err) {
        show(formatError(err, "Could not load audit log"), "error");
      } finally {
        setLoading(false);
      }
    },
    [show],
  );

  useEffect(() => {
    load(page, actorFilter, actionFilter);
  }, [page, actorFilter, actionFilter, load]);

  function handleSearch() {
    setPage(1);
    setActorFilter(pendingActor);
    setActionFilter(pendingAction);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data } = await apiClient.get<AuditVerifyResponse>(
        "/admin/audit-log/verify",
      );
      setVerifyResult(data);
    } catch (err) {
      show(formatError(err, "Could not verify chain"), "error");
    } finally {
      setVerifying(false);
    }
  }

  function handleExport() {
    setExporting(true);
    downloadAuthenticatedFile("/admin/audit-log/export.csv", "audit-log.csv")
      .catch((err) =>
        show(formatError(err, "Could not export audit log"), "error"),
      )
      .finally(() => setExporting(false));
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-5 w-5 text-gold-500" />
            <h1 className="text-2xl font-bold text-navy-900 dark:text-navy-50">
              Audit Log
            </h1>
          </div>
          <p className="text-navy-500 dark:text-navy-400">
            Tamper-evident chain of all system actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleVerify}
            loading={verifying}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify chain
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExport}
            loading={exporting}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {}
      {verifyResult && (
        <motion.div {...fadeIn} className="mb-6">
          {verifyResult.valid ? (
            <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-5 py-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Chain verified
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {total} entries checked. No tampering detected. The audit
                  chain is intact.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-5 py-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-red-900 dark:text-red-300">
                  Chain integrity violation detected
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  The audit chain has been broken at entry ID:{" "}
                  <code className="font-mono font-bold">
                    {verifyResult.brokenAtId}
                  </code>
                  . This may indicate tampering.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {}
      <Card className="mb-6 p-4 dark:bg-navy-900 dark:border-navy-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField
              label="Filter by actor"
              placeholder="email or user ID"
              value={pendingActor}
              onChange={(e) => setPendingActor(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <TextField
              label="Filter by action"
              placeholder="e.g. VOTE_CAST"
              value={pendingAction}
              onChange={(e) => setPendingAction(e.target.value)}
            />
          </div>
          <Button onClick={handleSearch} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
            Apply
          </Button>
        </div>
      </Card>

      {loading && <Spinner label="Loading audit log" />}

      {!loading && entries.length === 0 && (
        <EmptyState
          title="No entries found"
          description="No audit log entries match your filters."
          icon={<ClipboardList className="h-6 w-6" />}
        />
      )}

      {!loading && entries.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-navy-200 dark:border-navy-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                    Tx Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-navy-100 dark:border-navy-800 last:border-0 ${i % 2 === 0 ? "bg-white dark:bg-navy-900/50" : "bg-navy-50/60 dark:bg-navy-800/30"}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-500 dark:text-navy-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-navy-800 dark:text-navy-200 max-w-[140px] truncate">
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-navy-100 dark:bg-navy-700 px-2 py-0.5 text-xs font-semibold text-navy-700 dark:text-navy-300">
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-500 dark:text-navy-400">
                      {entry.ipAddress ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {entry.txHash ? (
                        <code className="text-xs font-mono text-navy-600 dark:text-navy-300">
                          {entry.txHash.slice(0, 10)}...
                        </code>
                      ) : (
                        <span className="text-xs text-navy-300 dark:text-navy-600">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
              <span>
                Page {page} of {totalPages} ({total} entries)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
