/**
 * Browser-side WebAuthn helpers.
 *
 * ── Biometric setup (first login, single registration) ────────────────────────
 *  runBiometricSetup(setupToken)
 *       → registers the platform authenticator (Touch ID / Face ID / fingerprint)
 *         in ONE step and returns { accessToken, user }
 *
 * ── Biometric login (subsequent logins) ───────────────────────────────────────
 *  runLoginBiometric(loginToken)
 *       → authenticates with the registered biometric, returns { accessToken, user }
 *
 * ── Vote auth (each vote) ─────────────────────────────────────────────────────
 *  runVoteAuth()
 *       → short-lived voteToken (no PIN required)
 *
 * ── Admin action step-up ──────────────────────────────────────────────────────
 *  runAdminBiometricAuth()
 *       → reuses the vote challenge/verify flow to prove physical presence;
 *         returns the voteToken (used only as a proof-of-identity signal)
 *
 * FIX SUMMARY
 * ───────────
 * 1. Single-step setup: removed the old runBiometricSetup (finalize=false) +
 *    runBiometricSetupFinalize (finalize=true) pair. They tried to register TWO
 *    separate WebAuthn platform credentials. After the first was added to
 *    excludeCredentials, most phones couldn't produce a second one, so step 2
 *    always failed. One credential is enough — the OS chooses fingerprint vs
 *    face ID transparently.
 *
 * 2. PIN removed from all flows. PIN + biometric adds friction with no
 *    meaningful security gain. The biometric itself proves physical presence.
 *
 * 3. checkWebAuthnSupport() gives a clear, actionable message when the browser
 *    blocks WebAuthn (e.g. plain HTTP over a local IP address). The fix is to
 *    serve the app over HTTPS — see vite.config.ts.
 */
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { apiClient } from "./apiClient";
import type { VoteTokenResponse, User } from "../types/api";

// ── Secure-context guard ───────────────────────────────────────────────────────

/**
 * Call this before any WebAuthn operation. Throws a user-readable error when
 * the browser is blocking the API (most often: plain HTTP over a local IP).
 */
export function checkWebAuthnSupport(): void {
  if (!window.isSecureContext) {
    throw new Error(
      "Biometric authentication requires a secure connection (HTTPS). " +
      "Please access this app via https:// — ask your administrator to enable HTTPS on the dev server."
    );
  }
  if (typeof window.PublicKeyCredential === "undefined") {
    throw new Error(
      "This browser does not support biometric authentication (WebAuthn). " +
      "Please use a recent version of Chrome, Safari, or Firefox."
    );
  }
}

// ── Registration helpers ───────────────────────────────────────────────────────

async function fetchRegistrationOptions(
  setupToken: string
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialCreationOptionsJSON>(
    "/auth/biometric/register-options",
    { setupToken }
  );
  return data;
}

/**
 * Single-step biometric registration.
 *
 * Gets a challenge from the server, triggers the platform authenticator
 * (the OS decides whether to use Touch ID, Face ID, or fingerprint — the
 * app does not need to distinguish), then verifies the response and issues
 * a full session in one round-trip.
 *
 * Returns { accessToken, user } so the caller can log the user in immediately.
 */
export async function runBiometricSetup(
  setupToken: string
): Promise<{ accessToken: string; user: User }> {
  checkWebAuthnSupport();
  const options = await fetchRegistrationOptions(setupToken);
  const credential = await startRegistration({ optionsJSON: options });
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/biometric/register-verify",
    { setupToken, credential }
  );
  return data;
}

// ── Login biometric ────────────────────────────────────────────────────────────

async function fetchLoginChallenge(
  loginToken: string
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
    "/auth/biometric/login-challenge",
    { loginToken }
  );
  return data;
}

/**
 * Authenticate with the registered biometric (fingerprint OR face ID).
 * Used on every login after biometric is set up — replaces the full KYC flow.
 *
 * No PIN required: the biometric itself proves physical presence.
 */
export async function runLoginBiometric(
  loginToken: string
): Promise<{ accessToken: string; user: User }> {
  checkWebAuthnSupport();
  const options = await fetchLoginChallenge(loginToken);
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/biometric/login-verify",
    { loginToken, credential }
  );
  return data;
}

// ── Vote authentication ────────────────────────────────────────────────────────

async function fetchVoteChallenge(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
    "/auth/vote/challenge",
    {}
  );
  return data;
}

/**
 * Authenticate for voting: biometric → short-lived voteToken.
 * No PIN required (same rationale as login).
 */
export async function runVoteAuth(): Promise<string> {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<VoteTokenResponse>("/auth/vote/verify", {
    credential,
  });
  return data.voteToken;
}

// ── Candidate nomination acceptance ──────────────────────────────────────────

export async function runCandidateRequestBiometric(requestId: string): Promise<string> {
  checkWebAuthnSupport();
  const { data: options } = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
    "/auth/candidate-request/challenge",
    { requestId }
  );
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<{ authToken: string }>(
    "/auth/candidate-request/verify",
    { requestId, credential }
  );
  return data.authToken;
}

// ── Admin action step-up (biometric) ─────────────────────────────────────────

/**
 * Prove physical presence before a sensitive admin action (e.g. creating an
 * election). Reuses the existing vote challenge/verify endpoints — no new
 * backend routes required. Returns the voteToken purely as a proof signal;
 * the caller does not use it for voting.
 *
 * Throws a user-readable error if WebAuthn is unavailable or the challenge fails.
 */
export async function runAdminBiometricAuth(): Promise<string> {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<VoteTokenResponse>("/auth/vote/verify", {
    credential,
  });
  return data.voteToken;
}
