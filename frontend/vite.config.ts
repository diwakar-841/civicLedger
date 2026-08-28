import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * FIX (v2): removed HTTPS / self-signed cert.
 *
 * WHY self-signed HTTPS does NOT work for WebAuthn:
 * Chrome blocks WebAuthn on any origin with a TLS certificate error —
 * including self-signed certs — with "WebAuthn is not supported on sites
 * with TLS certificate errors". This is a hard browser policy, not configurable.
 *
 * WHY plain HTTP on localhost DOES work for WebAuthn:
 * The W3C spec (and every major browser) treats http://localhost as a
 * "potentially trustworthy origin" — the same security level as HTTPS.
 * window.isSecureContext === true on localhost, so WebAuthn is fully available.
 *
 * HOW TO ACCESS:
 * Since the Vite server and Chrome are on the same Android device (Termux),
 * use http://localhost:5173  ← type this exactly, with http://.
 * Do NOT use the local network IP (http://100.x.x.x:5173) — that is NOT
 * a secure context and WebAuthn will refuse to run.
 *
 * BACKEND NOTE:
 * Keep backend/.env as-is:
 *   WEBAUTHN_ORIGIN=http://localhost:5173
 *   WEBAUTHN_RP_ID=localhost
 * These already match http://localhost.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // also listens on the network IP (harmless — just don't use that URL for biometrics)
    allowedHosts: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
