import { useState, FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      show("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      show("Password reset successfully. Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      show(
        formatError(
          err,
          "Could not reset password. The link may have expired.",
        ),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-navy-950 sm:h-14 sm:w-14">
              <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Choose a new password
            </h1>
            <p className="mt-1 text-sm text-navy-300">
              Must be at least 10 characters with upper, lower and a number
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button
                type="submit"
                loading={loading}
                fullWidth
                className="mt-1"
              >
                Set new password
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-navy-300">
            <Link
              to="/login"
              className="font-semibold text-gold-400 hover:text-gold-300"
            >
              Back to sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
