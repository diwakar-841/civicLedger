export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "voter" | "admin";
  /** Permanent, unique VTR-XXXXXXXX ID — unlike the name, this can never collide with anyone else's. */
  voterId: string;
  walletAddress: string | null;
  isVerified: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isTwoFactorEnabled: boolean;
  isBiometricRegistered: boolean;
  phone?: string | null;
  dob?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  experience?: string | null;
  profilePhotoUrl?: string | null;
}

// ── Auth step 1: credentials ──────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  user: User;
}

// Admin 2FA path
export interface TwoFactorChallengeResponse {
  twoFactorRequired: true;
  challengeToken: string;
}

// First-ever login — must complete KYC
export interface KycChallengeResponse {
  kycRequired: true;
  kycToken: string;
}

// Returning user (biometric already registered) — skip KYC
export interface BiometricLoginRequiredResponse {
  biometricLoginRequired: true;
  loginToken: string;
}

// ── Registration flow ─────────────────────────────────────────────────────────

// Step 1: form submitted → email verification link sent
export interface RegistrationInitiatedResponse {
  regToken: string; // short-lived registration session token
}

// Password setup result: phone verification is still required after sign-in.
export interface RegistrationCompleteResponse {
  message: string;
  voterId: string;
}

// ── KYC wizard ────────────────────────────────────────────────────────────────

// Step 1 result: phone + DOB verified, phone OTP sent
export interface KycOtpSentResponse {
  otpSent?: true;
  kycToken: string; // step-2 token
  /** Dev-only: present when no SMS provider is configured, so the code
   * couldn't actually be texted. Never sent in production. */
  devOtp?: string;
}

// Step 2 result: biometric not yet set up
export interface BiometricSetupRequiredResponse {
  biometricSetupRequired: true;
  setupToken: string;
}

// ── Vote auth ─────────────────────────────────────────────────────────────────
export interface VoteTokenResponse {
  voteToken: string;
}

// ── PIN setup ─────────────────────────────────────────────────────────────────
export interface PinSetupResponse {
  message: string;
}

// ── PIN login ─────────────────────────────────────────────────────────────────
export interface PinLoginResponse {
  accessToken: string;
  user: User;
}

// ── 2FA setup ─────────────────────────────────────────────────────────────────
export interface TwoFASetupResponse {
  qrCodeDataUrl: string;
  secret: string;
}

export interface TwoFAEnableResponse {
  recoveryCodes: string[];
}

// ── Sessions ──────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  metadata: Record<string, unknown> | null;
  txHash: string | null;
  ipAddress: string | null;
  createdAt: string; // ISO date string from the API
}

/** Shape returned by GET /admin/audit-log */
export interface AuditLogResponse {
  page: number;
  pageSize: number;
  total: number;
  entries: AuditEntry[];
}

/** Shape returned by GET /admin/audit-log/verify */
export interface AuditVerifyResponse {
  valid: boolean;
  /** Present only when valid is false — the ID of the first broken entry */
  brokenAtId?: string;
}

// ── Results ───────────────────────────────────────────────────────────────────
export interface ElectionResultSummary {
  electionId: string;
  title: string;
  status: string;
  totalVotes: number;
  totalVotesCast: number;
  candidates: Array<{
    id: string;
    name: string;
    votes: number;
    percent: number;
  }>;
}
