import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { BiometricLoginModal } from "../components/auth/BiometricLoginModal";
import { apiClient } from "../lib/apiClient";
import { useAuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";
import type {
  LoginResponse,
  TwoFactorChallengeResponse,
  KycChallengeResponse,
  BiometricLoginRequiredResponse,
} from "../types/api";

type Step = "credentials" | "2fa";

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["credentials", "2fa"];
  const labels = ["Sign in", "2FA"];
  return (
    <div className="mb-5 flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = steps.indexOf(step) > i;
        const active = step === s;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  active
                    ? "bg-gold-400 text-navy-950 ring-4 ring-gold-400/20"
                    : done
                      ? "bg-green-500 text-white"
                      : "bg-navy-700 text-navy-400"
                }`}
              >
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${active ? "text-gold-400" : done ? "text-green-400" : "text-navy-500"}`}
              >
                {labels[i]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mb-4 h-px w-10 transition-colors duration-300 ${done ? "bg-green-500" : "bg-navy-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("credentials");
  const [challengeToken, setChallengeToken] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  // ── Dispatch result from login / 2fa ─────────────────────────────────────────
  function handleLoginResult(
    data:
      | LoginResponse
      | TwoFactorChallengeResponse
      | KycChallengeResponse
      | BiometricLoginRequiredResponse,
  ) {
    if ("twoFactorRequired" in data) {
      setChallengeToken(data.challengeToken);
      setStep("2fa");
      return;
    }

    if ("biometricLoginRequired" in data) {
      setLoginToken(data.loginToken);
      setShowBioModal(true);
      return;
    }

    if ("kycRequired" in data) {
      sessionStorage.setItem("kycToken", data.kycToken);
      navigate("/kyc");
      return;
    }

    const resp = data as LoginResponse;
    login(resp.user, resp.accessToken);
    navigate(resp.user.role === "admin" ? "/admin" : "/elections");
  }

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post<
        | LoginResponse
        | TwoFactorChallengeResponse
        | KycChallengeResponse
        | BiometricLoginRequiredResponse
      >("/auth/login", { email, password });
      handleLoginResult(data);
    } catch (err) {
      show(formatError(err, "Invalid email or password"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post<
        KycChallengeResponse | BiometricLoginRequiredResponse
      >("/auth/login/2fa", { challengeToken, code: code.trim() });
      handleLoginResult(data as any);
    } catch (err) {
      show(formatError(err, "Invalid verification code"), "error");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  function handleBiometricSuccess(
    user: import("../types/api").User,
    accessToken: string,
  ) {
    setShowBioModal(false);
    login(user, accessToken);
    show(`Welcome back, ${user.fullName.split(" ")[0]}!`, "success");
    navigate(user.role === "admin" ? "/admin" : "/elections");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="w-full max-w-md">
        {}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-col items-center text-center sm:mb-8"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900">
            Sign in to Civic Ledger
          </h1>
          <p className="mt-1.5 text-sm text-navy-500">
            Secure, verifiable, transparent voting
          </p>
        </motion.div>

        {}
        {step === "2fa" && <StepDots step={step} />}

        <AnimatePresence mode="wait">
          {}
          {step === "credentials" && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-1 py-2 sm:px-3 sm:py-4">
                <form
                  onSubmit={handleCredentials}
                  className="flex flex-col gap-4"
                >
                  <TextField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />

                  {}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-navy-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="focus-ring w-full rounded-xl border border-navy-200 bg-white px-3.5 py-3 pr-10 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-navy-400 hover:text-gold-400 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" loading={loading} fullWidth>
                    Continue
                  </Button>
                </form>
              </div>

              {}
              <div className="mt-4 px-2 py-2">
                <p className="text-center text-xs leading-5 text-navy-500">
                  <span className="font-bold text-indigo-700">
                    First sign-in?
                  </span>{" "}
                  You'll verify your phone number and date of birth, then
                  confirm the phone OTP to finish setup.
                </p>
              </div>

              <p className="mt-4 text-center text-sm text-navy-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Register to vote
                </Link>
              </p>
            </motion.div>
          )}

          {}
          {step === "2fa" && (
            <motion.div
              key="2fa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-1 py-2 sm:px-3 sm:py-4">
                <div className="mb-5 text-center">
                  <h2 className="text-base font-semibold text-navy-900">
                    Two-factor authentication
                  </h2>
                  <p className="mt-1 text-sm text-navy-500">
                    {useRecovery
                      ? "Enter one of your saved recovery codes"
                      : "Enter the 6-digit code from your authenticator app"}
                  </p>
                </div>

                <form onSubmit={handle2FA} className="flex flex-col gap-4">
                  <TextField
                    label={
                      useRecovery ? "Recovery code" : "Authentication code"
                    }
                    autoComplete="one-time-code"
                    inputMode={useRecovery ? "text" : "numeric"}
                    maxLength={useRecovery ? 32 : 6}
                    required
                    value={code}
                    onChange={(e) =>
                      setCode(
                        useRecovery
                          ? e.target.value
                          : e.target.value.replace(/\D/g, ""),
                      )
                    }
                    placeholder={useRecovery ? "xxxxxxxxxx-xxxxxxxxxx" : "000000"}
                  />
                  <Button type="submit" loading={loading} fullWidth>
                    Verify and continue
                  </Button>
                </form>

                <div className="mt-5 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecovery((v) => !v);
                      setCode("");
                    }}
                    className="text-xs font-medium text-navy-400 hover:text-gold-400 transition-colors"
                  >
                    {useRecovery
                      ? "Use authenticator app instead"
                      : "Use a recovery code instead"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setCode("");
                      setChallengeToken("");
                    }}
                    className="text-xs text-navy-500 hover:text-navy-400 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
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
          <span>Protected by end-to-end encryption</span>
        </motion.div>
      </div>

      {}
      {showBioModal && (
        <BiometricLoginModal
          loginToken={loginToken}
          onSuccess={handleBiometricSuccess}
          onCancel={() => setShowBioModal(false)}
        />
      )}
    </div>
  );
}
