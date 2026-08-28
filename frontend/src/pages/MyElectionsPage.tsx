import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, ClipboardList, Vote } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";

/**
 * "My Elections" tab — unlike the general election list (which is for
 * casting a vote), this shows only the elections where the signed-in user
 * is themself a candidate, along with their own candidacy details.
 */
export function MyElectionsPage() {
  const { user } = useAuthContext();
  const { elections, loading, error } = useElections();

  const myElections = elections
    .map((election) => ({ election, candidacy: election.candidates?.find((c) => c.voterUserId === user?.id) }))
    .filter((entry) => !!entry.candidacy);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow text-indigo-600">Candidacy</p>
        <h1 className="mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white">My elections</h1>
        <p className="mb-7 text-sm text-navy-500">Elections where you're running as a candidate, and how your candidacy appears to voters.</p>

        {loading && <Spinner label="Loading your elections" />}
        {!loading && error && <EmptyState title="Something went wrong" description={error} icon={<Vote className="h-6 w-6" />} />}
        {!loading && !error && myElections.length === 0 && (
          <EmptyState
            title="You're not a candidate yet"
            description="Once you accept a nomination request, the election will show up here with your candidate details."
            icon={<ClipboardList className="h-6 w-6" />}
          />
        )}

        {!loading && !error && myElections.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {myElections.map(({ election, candidacy }) => {
              const status = deriveStatus(election);
              return (
                <Link key={election.id} to={`/elections/${election.id}`} className="group">
                  <Card className="flex h-full flex-col gap-4 p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-navy-900 dark:text-white">{election.title || "Untitled election"}</h2>
                      <StatusBadge status={status} />
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-indigo-50/60 p-3 dark:bg-navy-800/60">
                      {candidacy?.photoUrl ? (
                        <img src={candidacy.photoUrl} alt={candidacy.name} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                          {candidacy?.name?.slice(0, 1).toUpperCase() ?? "?"}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy-900 dark:text-white">{candidacy?.name}</p>
                        {candidacy?.party && <p className="truncate text-xs text-navy-500">{candidacy.party}</p>}
                      </div>
                    </div>

                    {election.description && <p className="line-clamp-2 flex-1 text-sm text-navy-500">{election.description}</p>}

                    <div className="flex flex-col gap-2 border-t border-navy-100 pt-4 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
                        {election.startTime && election.endTime
                          ? `${new Date(election.startTime).toLocaleDateString()} – ${new Date(election.endTime).toLocaleDateString()}`
                          : "Not scheduled yet"}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800">
                        View election <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
