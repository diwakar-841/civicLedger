import { Link } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Layout } from "../../components/layout/Layout";

export function AdminRequire2FAPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="flex flex-col items-center gap-5 p-10 text-center dark:bg-navy-900 dark:border-navy-700">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-navy-800 dark:text-gold-400">
              <Lock className="h-8 w-8" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-navy-900 dark:text-navy-50">Two-factor authentication required</h1>
              <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
                Admin access requires two-factor authentication to be enabled on your account. This protects the election system from unauthorized changes.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/settings/security">
                <Button variant="secondary">
                  <ShieldCheck className="h-4 w-4" />
                  Enable 2FA in security settings
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
