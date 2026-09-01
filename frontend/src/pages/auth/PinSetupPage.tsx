import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { apiClient } from "../../lib/apiClient";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

function PinField({
  label,
  hint,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-navy-800">{label}</label>
      <p className="text-xs text-navy-400 -mt-1">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type={show ? "text" : "password"}
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            onChange(v);
          }}
          placeholder="••••••"
          className="flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 tracking-widest font-mono
            [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        />
        <button
          type="button"
          onClick={onToggle}
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label={show ? "Hide PIN" : "Show PIN"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {value.length > 0 && value.length < 6 && (
        <p className="text-xs text-amber-600">
          {6 - value.length} digit{6 - value.length !== 1 ? "s" : ""} remaining
        </p>
      )}
      {value.length === 6 && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" /> 6 digits entered
        </p>
      )}
    </div>
  );
}

export function PinSetupPage() {
  const [loginPin, setLoginPin] = useState("");
  const [votingPin, setVotingPin] = useState("");
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [showVotingPin, setShowVotingPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { user } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  const isValid =
    loginPin.length === 6 && votingPin.length === 6 && loginPin !== votingPin;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await apiClient.post("/auth/pins/setup", { loginPin, votingPin });
      setDone(true);
      show("PINs registered successfully!", "success");
      setTimeout(
        () =>
          navigate(user?.role === "admin" ? "/admin" : "/elections", {
            replace: true,
          }),
        1400,
      );
    } catch (err) {
      show(formatError(err, "Could not save PINs — please try again"), "error");
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
          {}
          <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-navy-950 sm:h-14 sm:w-14">
              {done ? (
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <KeyRound className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </span>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {done ? "All set!" : "Set up your PINs"}
            </h1>
            <p className="mt-1 text-sm text-navy-300">
              {done
                ? "Redirecting you to the voting portal…"
                : "Register two 6-digit PINs — one to sign in, one to cast your vote"}
            </p>
          </div>

          {}
          <div className="mb-6 flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <div className="h-px w-6 bg-green-500" />
            <div
              className={`h-2 w-2 rounded-full transition-colors ${done ? "bg-green-500" : "bg-gold-400"}`}
            />
            <div
              className={`h-px w-6 transition-colors ${done ? "bg-green-500" : "bg-navy-700"}`}
            />
            <div
              className={`h-2 w-2 rounded-full transition-colors ${done ? "bg-green-500" : "bg-navy-700"}`}
            />
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="flex flex-col items-center gap-4 p-8">
                  <ShieldCheck className="h-14 w-14 text-green-500" />
                  <p className="text-center text-sm font-medium text-navy-700">
                    PINs registered successfully!
                  </p>
                  <p className="text-center text-xs text-navy-400">
                    Taking you to the voting portal…
                  </p>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {}
                    <div className="rounded-xl border border-navy-100 bg-navy-50 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 flex-shrink-0">
                          <KeyRound className="h-4 w-4 text-gold-600" />
                        </span>
                        <span className="text-sm font-semibold text-navy-800">
                          Login PIN
                        </span>
                      </div>
                      <PinField
                        label="Enter your login PIN"
                        hint="You'll use this instead of fingerprint when signing in"
                        value={loginPin}
                        onChange={setLoginPin}
                        show={showLoginPin}
                        onToggle={() => setShowLoginPin((v) => !v)}
                      />
                    </div>

                    {}
                    <div className="rounded-xl border border-navy-100 bg-navy-50 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 flex-shrink-0">
                          <ShieldCheck className="h-4 w-4 text-gold-600" />
                        </span>
                        <span className="text-sm font-semibold text-navy-800">
                          Voting PIN
                        </span>
                      </div>
                      <PinField
                        label="Enter your voting PIN"
                        hint="You'll use this instead of fingerprint when casting a vote"
                        value={votingPin}
                        onChange={setVotingPin}
                        show={showVotingPin}
                        onToggle={() => setShowVotingPin((v) => !v)}
                      />
                    </div>

                    {}
                    {loginPin.length === 6 &&
                      votingPin.length === 6 &&
                      loginPin === votingPin && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          Login PIN and Voting PIN must be different.
                        </p>
                      )}

                    <Button
                      type="submit"
                      loading={loading}
                      fullWidth
                      disabled={!isValid}
                      className="mt-1"
                    >
                      Save PINs and continue
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-navy-500"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
            <span>PINs are hashed and never stored in plain text</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
