import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { runBiometricSetup, checkWebAuthnSupport } from "../../lib/webauthn";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

type Phase = "biometric" | "done";

export function BiometricSetupPage() {
  const [phase, setPhase] = useState<Phase>("biometric");
  const [setupToken, setSetupToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [webAuthnError, setWebAuthnError] = useState("");
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("setupToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setSetupToken(token);

    try {
      checkWebAuthnSupport();
    } catch (err: unknown) {
      setWebAuthnError(err instanceof Error ? err.message : String(err));
    }
  }, [navigate]);

  async function handleRegister() {
    setLoading(true);
    try {
      const result = await runBiometricSetup(setupToken);
      sessionStorage.removeItem("setupToken");

      login(result.user, result.accessToken);
      setPhase("done");
      show("Biometric registered! Now set up your PINs.", "success");
      setTimeout(() => navigate("/pin-setup", { replace: true }), 1000);
    } catch (err) {
      show(formatError(err, "Biometric registration failed — please try again"), "error");
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
              {phase === "done" ? (
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <Fingerprint className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </span>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Set up biometric auth</h1>
            <p className="mt-1 text-sm text-navy-300">
              Register your fingerprint or face ID — either can be used to sign in and vote
            </p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                phase === "biometric" ? "bg-gold-400" : "bg-green-500"
              }`}
            />
            <div className="h-px w-6 bg-navy-700" />
            <div className="h-2 w-2 rounded-full bg-navy-700" />
            <div className="h-px w-6 bg-navy-700" />
            <div className="h-2 w-2 rounded-full bg-navy-700" />
          </div>

          {webAuthnError && phase !== "done" && (
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <div>
                  <p className="mb-2 text-sm font-semibold text-navy-800">
                    Biometric authentication unavailable
                  </p>
                  <p className="text-xs text-navy-500">{webAuthnError}</p>
                </div>
                <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
                  <strong>How to fix:</strong> The app must be served over HTTPS for
                  biometric login to work. Make sure the address bar shows{" "}
                  <strong>https://</strong> and not <strong>http://</strong>. If your
                  browser shows a security warning, tap <em>Advanced → Proceed</em>.
                </div>
              </div>
            </Card>
          )}

          {!webAuthnError && phase === "biometric" && (
            <Card className="p-6 sm:p-8">
              <h2 className="mb-1 text-sm font-semibold text-navy-700">Register your biometric</h2>
              <p className="mb-5 text-xs text-navy-400">
                Tap the button below. Your device will ask for your fingerprint or face ID — use whichever your phone supports.
              </p>
              <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-6">
                <Fingerprint className="h-14 w-14 text-navy-400" />
                <p className="text-center text-sm text-navy-600">
                  Your device will prompt for <strong>fingerprint or face ID</strong> — the app works with whichever your phone uses.
                </p>
              </div>
              <Button fullWidth loading={loading} onClick={handleRegister}>
                {loading ? "Waiting for biometric…" : "Register biometric"}
              </Button>
            </Card>
          )}

          {phase === "done" && (
            <Card className="flex flex-col items-center gap-4 p-8">
              <ShieldCheck className="h-14 w-14 text-green-500" />
              <p className="text-center text-sm font-medium text-navy-700">
                Biometric registered successfully!
              </p>
              <p className="text-center text-xs text-navy-400">Setting up your PINs next…</p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}