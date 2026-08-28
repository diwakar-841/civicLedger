import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2, MoreVertical } from "lucide-react";
import { Dropdown } from "../shared/Dropdown";
import { Button } from "../shared/Button";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import type { Election } from "../../hooks/useElections";
import { canDeleteElection } from "../../lib/electionRules";
import { useDeleteElection } from "../../hooks/useAdminElections";
import { DeleteElectionModal } from "./DeleteElectionModal";

interface Props {
  election: Election;
}

/**
 * Primary kebab menu on the election's analytics page header. Deliberately
 * holds ONLY the delete action — kept separate from the day-to-day
 * hide/live/release toggles (see ElectionQuickSettingsMenu on the dashboard
 * card) so a destructive, irreversible action never sits next to routine
 * ones. This lives on the election's OWN page (not the global dashboard
 * list), so deleting is always a deliberate, per-election action.
 *
 * Delete is only available before the election starts (still a draft) —
 * enforced again server-side in election.service.ts, this is just the UI
 * reflection of it. Once voting opens, the election is locked and this
 * button stays disabled permanently, no matter its later status.
 */
export function ElectionDeleteMenu({ election }: Props) {
  const { show } = useToast();
  const navigate = useNavigate();
  const { deleteElection, loading: deleteLoading } = useDeleteElection();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const eligible = canDeleteElection(election);

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteCode("");
    setDeleteError(null);
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      await deleteElection(election.id, deletePassword, deleteCode);
      show("Election deleted", "success");
      navigate("/admin");
    } catch (err) {
      setDeleteError(formatError(err, "Could not delete election — check your password and code"));
    }
  }

  const helperText = "Only available before this election starts. Once voting opens, it can no longer be deleted.";

  return (
    <>
      <Dropdown label="More options" icon={<MoreVertical className="h-4.5 w-4.5" />} align="right">
        {(close) => (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Delete this election
            </p>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Permanently removes this election and its candidates. This cannot be undone.
              {" "}
              {!eligible && helperText}
            </p>
            <Button
              size="sm"
              variant="danger"
              disabled={!eligible}
              onClick={() => {
                close();
                setShowDeleteModal(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </Dropdown>

      {showDeleteModal && (
        <DeleteElectionModal
          electionTitle={election.title}
          password={deletePassword}
          code={deleteCode}
          loading={deleteLoading}
          error={deleteError}
          onPasswordChange={setDeletePassword}
          onCodeChange={setDeleteCode}
          onCancel={closeDeleteModal}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
