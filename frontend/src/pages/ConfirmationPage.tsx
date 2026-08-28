import { useLocation, useParams, Link } from "react-router-dom";
import { CheckCircle2, BarChart3, ArrowLeft, Copy, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { useState } from "react";

interface VoteState {
  candidateName?: string;
  txHash?: string;
  electionTitle?: string;
  blockNumber?: number;
  timestamp?: string;
}

export function ConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state as VoteState | null) ?? {};
  const { candidateName, txHash, electionTitle, blockNumber, timestamp } = state;
  const [copied, setCopied] = useState(false);

  function copyTxHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const voteTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();

  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="flex flex-col items-center gap-6 p-8 sm:p-10 dark:bg-navy-900 dark:border-navy-700">
            {/* Success icon */}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.span>

            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-2xl font-bold text-navy-900 dark:text-navy-50"
              >
                Vote recorded
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mt-2 text-navy-500 dark:text-navy-400"
              >
                {candidateName ? (
                  <>Your vote for <span className="font-semibold text-navy-800 dark:text-navy-200">{candidateName}</span> has been verified on-chain.</>
                ) : (
                  "Your vote has been verified on-chain."
                )}{" "}
                It is permanent, tamper-proof, and anonymously counted.
              </motion.p>
            </div>

            {/* Receipt block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full"
            >
              <div className="rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 px-5 py-4">
                <div className="mb-3 flex items-center gap-2 border-b border-navy-200 dark:border-navy-700 pb-3">
                  <Hash className="h-4 w-4 text-gold-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">Vote Receipt</span>
                </div>
                <dl className="flex flex-col gap-2 text-sm">
                  {electionTitle && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-navy-500 dark:text-navy-400">Election</dt>
                      <dd className="font-medium text-navy-800 dark:text-navy-200 text-right">{electionTitle}</dd>
                    </div>
                  )}
                  {candidateName && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-navy-500 dark:text-navy-400">Candidate</dt>
                      <dd className="font-medium text-navy-800 dark:text-navy-200 text-right">{candidateName}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-navy-500 dark:text-navy-400">Recorded at</dt>
                    <dd className="font-medium text-navy-800 dark:text-navy-200 text-right">{voteTime}</dd>
                  </div>
                  {blockNumber !== undefined && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-navy-500 dark:text-navy-400">Block</dt>
                      <dd className="font-mono text-navy-800 dark:text-navy-200">#{blockNumber}</dd>
                    </div>
                  )}
                  {txHash && (
                    <div className="mt-1 border-t border-navy-200 dark:border-navy-700 pt-2">
                      <dt className="mb-1 text-xs text-navy-500 dark:text-navy-400">Transaction hash</dt>
                      <div className="flex items-center gap-2">
                        <dd className="min-w-0 flex-1 truncate rounded bg-white dark:bg-navy-700 px-2.5 py-1.5 font-mono text-xs text-navy-700 dark:text-navy-200">
                          {txHash}
                        </dd>
                        <button
                          type="button"
                          onClick={copyTxHash}
                          className="flex-shrink-0 rounded p-1.5 text-navy-400 hover:bg-white dark:hover:bg-navy-700 hover:text-navy-700 focus-ring"
                          title="Copy transaction hash"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {copied && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Copied to clipboard</p>}
                    </div>
                  )}
                </dl>
              </div>
              <p className="mt-2 text-center text-xs text-navy-400 dark:text-navy-500">
                This transaction is permanently recorded on the blockchain and cannot be altered.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex w-full flex-col gap-3 sm:flex-row"
            >
              <Link to={`/elections/${id}/results`} className="flex-1">
                <Button variant="secondary" fullWidth>
                  <BarChart3 className="h-4 w-4" />
                  View live results
                </Button>
              </Link>
              <Link to="/elections" className="flex-1">
                <Button variant="ghost" fullWidth>
                  <ArrowLeft className="h-4 w-4" />
                  Back to elections
                </Button>
              </Link>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
