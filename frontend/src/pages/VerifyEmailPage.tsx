import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { apiClient } from "../lib/apiClient";

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [setPasswordToken, setSetPasswordToken] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    if (!token) {
      setStatus("error");
      return;
    }
    let redirectTimer: number | undefined;
    apiClient
      .get<{ setPasswordToken: string }>(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        setSetPasswordToken(data.setPasswordToken);
        setStatus("success");
        redirectTimer = window.setTimeout(() => {
          navigate(
            `/register/complete?token=${encodeURIComponent(data.setPasswordToken)}`,
            { replace: true },
          );
        }, 900);
      })
      .catch(() => setStatus("error"));
    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [navigate, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-navy-950">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Email Verification
            </h1>
          </div>

          <Card className="p-8 text-center">
            {status === "loading" && <Spinner label="Verifying your email" />}
            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h2 className="text-lg font-semibold text-navy-900">
                  Email verified
                </h2>
                <p className="text-sm text-navy-500">
                  Your Gmail address is confirmed. Redirecting you to create
                  your password…
                </p>
                <Link
                  to={`/register/complete?token=${encodeURIComponent(setPasswordToken)}`}
                  className="mt-2 text-sm font-semibold text-gold-500 hover:text-gold-600"
                >
                  Continue
                </Link>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <XCircle className="h-8 w-8" />
                </span>
                <h2 className="text-lg font-semibold text-navy-900">
                  Verification failed
                </h2>
                <p className="text-sm text-navy-500">
                  This link is invalid or has expired. Pending registrations are
                  removed after 24 hours, after which you can start again.
                </p>
                <Link
                  to="/register"
                  className="mt-2 text-sm font-semibold text-gold-500 hover:text-gold-600"
                >
                  Start registration again
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
