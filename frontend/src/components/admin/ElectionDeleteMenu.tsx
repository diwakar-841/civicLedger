import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2, MoreVertical } from "lucide-react";
import { Dropdown } from "../shared/Dropdown";
import { Button } from "../shared/Button";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

import { canDeleteElection } from "../../lib/electionRules";
import { useDeleteElection } from "../../hooks/useAdminElections";
import { DeleteElectionModal } from "./DeleteElectionModal";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function ElectionDeleteMenu({ election }) {
  const { show } = useToast();
  const navigate = useNavigate();
  const { deleteElection, loading: deleteLoading } = useDeleteElection();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState(null);

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
    _jsxDEV(_Fragment, {
 children: [
      _jsxDEV(Dropdown, {
 label: "More options", icon: _jsxDEV(MoreVertical, { className: "h-4.5 w-4.5" }, void 0, false), align: "right", children:
        (close) => {return (
            _jsxDEV("div", {
 className: "flex flex-col gap-2", children: [
              _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-400", children: [
                _jsxDEV(AlertTriangle, { className: "h-4 w-4" }, void 0, false), "Delete this election"] 
}, void 0, true

              ),
              _jsxDEV("p", {
 className: "text-xs text-navy-500 dark:text-navy-400", children: ["Permanently removes this election and its candidates. This cannot be undone.",

                " ",
                !eligible && helperText] 
}, void 0, true
              ),
              _jsxDEV(Button, {
                size: "sm",
                variant: "danger",
                disabled: !eligible,
                onClick: () => {
                  close();
                  setShowDeleteModal(true);
                }, children: [

                _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), "Delete"] 
}, void 0, true

              )] 
}, void 0, true
            ));
        } 
}, void 0, false
      ),

      showDeleteModal &&
      _jsxDEV(DeleteElectionModal, {
        electionTitle: election.title,
        password: deletePassword,
        code: deleteCode,
        loading: deleteLoading,
        error: deleteError,
        onPasswordChange: setDeletePassword,
        onCodeChange: setDeleteCode,
        onCancel: closeDeleteModal,
        onConfirm: handleDelete 
}, void 0, false
      )] 
}, void 0, true

    ));

}