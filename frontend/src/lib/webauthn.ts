import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { apiClient } from "./apiClient";
import type { VoteTokenResponse, User } from "../types/api";

export function checkWebAuthnSupport(): void {
  if (!window.isSecureContext) {
    throw new Error(
      "Biometric authentication requires a secure connection (HTTPS). " +
        "Please access this app via https:// — ask your administrator to enable HTTPS on the dev server.",
    );
  }
  if (typeof window.PublicKeyCredential === "undefined") {
    throw new Error(
      "This browser does not support biometric authentication (WebAuthn). " +
        "Please use a recent version of Chrome, Safari, or Firefox.",
    );
  }
}

async function fetchRegistrationOptions(
  setupToken: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialCreationOptionsJSON>(
    "/auth/biometric/register-options",
    { setupToken },
  );
  return data;
}

export async function runBiometricSetup(
  setupToken: string,
): Promise<{ accessToken: string; user: User }> {
  checkWebAuthnSupport();
  const options = await fetchRegistrationOptions(setupToken);
  const credential = await startRegistration({ optionsJSON: options });
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/biometric/register-verify",
    { setupToken, credential },
  );
  return data;
}

async function fetchLoginChallenge(
  loginToken: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
    "/auth/biometric/login-challenge",
    { loginToken },
  );
  return data;
}

export async function runLoginBiometric(
  loginToken: string,
): Promise<{ accessToken: string; user: User }> {
  checkWebAuthnSupport();
  const options = await fetchLoginChallenge(loginToken);
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<{ accessToken: string; user: User }>(
    "/auth/biometric/login-verify",
    { loginToken, credential },
  );
  return data;
}

async function fetchVoteChallenge(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { data } = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
    "/auth/vote/challenge",
    {},
  );
  return data;
}

export async function runVoteAuth(): Promise<string> {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<VoteTokenResponse>(
    "/auth/vote/verify",
    {
      credential,
    },
  );
  return data.voteToken;
}

export async function runCandidateRequestBiometric(
  requestId: string,
): Promise<string> {
  checkWebAuthnSupport();
  const { data: options } =
    await apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
      "/auth/candidate-request/challenge",
      { requestId },
    );
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<{ authToken: string }>(
    "/auth/candidate-request/verify",
    { requestId, credential },
  );
  return data.authToken;
}

export async function runAdminBiometricAuth(): Promise<string> {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post<VoteTokenResponse>(
    "/auth/vote/verify",
    {
      credential,
    },
  );
  return data.voteToken;
}
