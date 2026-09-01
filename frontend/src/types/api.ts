export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "voter" | "admin";

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

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface TwoFactorChallengeResponse {
  twoFactorRequired: true;
  challengeToken: string;
}

export interface KycChallengeResponse {
  kycRequired: true;
  kycToken: string;
}

export interface BiometricLoginRequiredResponse {
  biometricLoginRequired: true;
  loginToken: string;
}

export interface RegistrationInitiatedResponse {
  regToken: string;
}

export interface RegistrationCompleteResponse {
  message: string;
  voterId: string;
}

export interface KycOtpSentResponse {
  otpSent?: true;
  kycToken: string;

  devOtp?: string;
}

export interface BiometricSetupRequiredResponse {
  biometricSetupRequired: true;
  setupToken: string;
}

export interface VoteTokenResponse {
  voteToken: string;
}

export interface PinSetupResponse {
  message: string;
}

export interface PinLoginResponse {
  accessToken: string;
  user: User;
}

export interface TwoFASetupResponse {
  qrCodeDataUrl: string;
  secret: string;
}

export interface TwoFAEnableResponse {
  recoveryCodes: string[];
}

export interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  metadata: Record<string, unknown> | null;
  txHash: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  page: number;
  pageSize: number;
  total: number;
  entries: AuditEntry[];
}

export interface AuditVerifyResponse {
  valid: boolean;

  brokenAtId?: string;
}

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
