import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { apiClient } from "../../lib/apiClient";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import type { KycOtpSentResponse, LoginResponse } from "../../types/api";

type Step = "identity" | "otp";

function StepDots({ step }: { step: Step }) {
  const steps: Step[] = ["identity", "otp"];
  const labels = ["Phone + DOB", "Verify phone"];
  const activeIndex = steps.indexOf(step);
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((s, index) => {
        const done = activeIndex > index;
        const active = activeIndex === index;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-600/20"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-navy-100 text-navy-400"
                }`}
              >
                {done ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active
                    ? "text-indigo-600"
                    : done
                      ? "text-emerald-600"
                      : "text-navy-400"
                }`}
              >
                {labels[index]}
              </span>
            </div>
            {index === 0 && (
              <div
                className={`mb-4 h-px w-10 ${done ? "bg-emerald-500" : "bg-navy-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function KycWizardPage() {
  const [step, setStep] = useState<Step>("identity");
  const [kycToken, setKycToken] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("kycToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setKycToken(token);
  }, [navigate]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCountdown((current) => current - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function handleIdentity(event: FormEvent) {
    event.preventDefault();
    if (!kycToken) return;
    if (!/^\d{10}$/.test(phone)) {
      show("Please enter your 10-digit phone number", "error");
      return;
    }
    if (!dob) {
      show("Please select your date of birth", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post<KycOtpSentResponse>(
        "/auth/kyc/verify-identity",
        {
          kycToken,
          phone: `+91${phone}`,
          dob,
        },
      );
      setKycToken(data.kycToken);
      sessionStorage.setItem("kycToken", data.kycToken);
      setStep("otp");
      setResendCountdown(60);
      setDevOtp(data.devOtp ?? null);
      show(
        data.devOtp
          ? "Couldn't send a real text — showing the code below for local testing"
          : "A verification code has been sent to your phone",
        data.devOtp ? "info" : "success",
      );
    } catch (error) {
      show(formatError(error, "Identity verification failed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post<LoginResponse>(
        "/auth/kyc/verify-otp",
        { kycToken, otp },
      );
      sessionStorage.removeItem("kycToken");
      login(data.user, data.accessToken);
      show("Your account is fully verified", "success");
      navigate(data.user.role === "admin" ? "/admin" : "/home", {
        replace: true,
      });
    } catch (error) {
      show(formatError(error, "Invalid verification code"), "error");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { data } = await apiClient.post<{
        message: string;
        devOtp?: string;
      }>("/auth/kyc/resend-otp", { kycToken });
      setOtp("");
      setResendCountdown(60);
      setDevOtp(data.devOtp ?? null);
      show(
        data.devOtp
          ? "Couldn't send a real text — showing the code below for local testing"
          : "A new verification code has been sent to your phone",
        data.devOtp ? "info" : "success",
      );
    } catch (error) {
      show(formatError(error, "Could not resend the code"), "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25">
              {step === "otp" ? (
                <Mail className="h-7 w-7" />
              ) : (
                <ShieldCheck className="h-7 w-7" />
              )}
            </span>
            <h1 className="text-2xl font-extrabold text-navy-900">
              {step === "identity"
                ? "Finish your identity check"
                : "Verify your phone"}
            </h1>
            <p className="mt-1.5 max-w-xs text-sm text-navy-500">
              {step === "identity"
                ? "Use the phone number and DOB from your registration."
                : "Enter the 6-digit code sent to your phone."}
            </p>
          </div>

          <StepDots step={step} />

          <AnimatePresence mode="wait">
            {step === "identity" ? (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="p-6 sm:p-8">
                  <form
                    onSubmit={handleIdentity}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-navy-700">
                        <Phone className="h-3.5 w-3.5 text-navy-400" />
                        Phone number
                      </label>
                      <div className="flex gap-2">
                        <span className="flex items-center rounded-lg border border-navy-200 bg-navy-50 px-3 text-sm text-navy-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={10}
                          required
                          value={phone}
                          onChange={(event) =>
                            setPhone(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            )
                          }
                          placeholder="10-digit mobile number"
                          className="focus-ring flex-1 rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300"
                        />
                      </div>
                      <p className="text-xs text-navy-400">
                        This number can only belong to one account.
                      </p>
                    </div>

                    <TextField
                      label="Date of birth"
                      type="date"
                      required
                      value={dob}
                      onChange={(event) => setDob(event.target.value)}
                      hint="Must match the date entered during registration"
                    />

                    <Button
                      type="submit"
                      loading={loading}
                      fullWidth
                      className="mt-2"
                      disabled={!/^\d{10}$/.test(phone) || !dob}
                    >
                      Verify details &amp; send code
                    </Button>
                  </form>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="p-6 sm:p-8">
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold-100 bg-gold-50 p-3.5">
                    <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-500" />
                    <p className="text-xs leading-relaxed text-navy-600">
                      We sent a <strong>6-digit code</strong> to +91 {phone}. It
                      expires in <strong>10 minutes</strong>.
                    </p>
                  </div>
                  {devOtp && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                      <p className="text-xs font-medium text-amber-800">
                        The code couldn't actually be texted to your phone (SMS
                        isn't set up, or the SMS provider rejected the request).
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Your verification code is{" "}
                        <span className="font-mono text-sm font-bold tracking-widest">
                          {devOtp}
                        </span>
                        . This is only shown because real delivery failed (dev
                        mode).
                      </p>
                    </div>
                  )}
                  <form onSubmit={handleOtp} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-navy-700">
                        Phone verification code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit code"
                        className="focus-ring w-full rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-center font-mono text-lg tracking-widest text-navy-900"
                      />
                    </div>
                    <Button
                      type="submit"
                      loading={loading}
                      fullWidth
                      disabled={otp.length !== 6}
                    >
                      Verify phone &amp; finish
                    </Button>
                  </form>
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || resendCountdown > 0}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resending
                        ? "Sending…"
                        : resendCountdown > 0
                          ? `Resend code in ${resendCountdown}s`
                          : "Resend code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("identity");
                        setOtp("");
                        setDevOtp(null);
                      }}
                      className="text-xs text-navy-400 hover:text-navy-600"
                    >
                      ← Change phone number
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
