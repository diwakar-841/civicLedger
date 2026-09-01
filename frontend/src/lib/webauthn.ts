import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

import { apiClient } from "./apiClient";

export function checkWebAuthnSupport() {
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

async function fetchRegistrationOptions(
setupToken)
{
  const { data } = await apiClient.post(
    "/auth/biometric/register-options",
    { setupToken }
  );
  return data;
}

export async function runBiometricSetup(
setupToken)
{
  checkWebAuthnSupport();
  const options = await fetchRegistrationOptions(setupToken);
  const credential = await startRegistration({ optionsJSON: options });
  const { data } = await apiClient.post(
    "/auth/biometric/register-verify",
    { setupToken, credential }
  );
  return data;
}

async function fetchLoginChallenge(
loginToken)
{
  const { data } = await apiClient.post(
    "/auth/biometric/login-challenge",
    { loginToken }
  );
  return data;
}

export async function runLoginBiometric(
loginToken)
{
  checkWebAuthnSupport();
  const options = await fetchLoginChallenge(loginToken);
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post(
    "/auth/biometric/login-verify",
    { loginToken, credential }
  );
  return data;
}

async function fetchVoteChallenge() {
  const { data } = await apiClient.post(
    "/auth/vote/challenge",
    {}
  );
  return data;
}

export async function runVoteAuth() {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post("/auth/vote/verify", { credential });
  return data.voteToken;
}

export async function runCandidateRequestBiometric(requestId) {
  checkWebAuthnSupport();
  const { data: options } = await apiClient.post(
    "/auth/candidate-request/challenge",
    { requestId }
  );
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post(
    "/auth/candidate-request/verify",
    { requestId, credential }
  );
  return data.authToken;
}

export async function runAdminBiometricAuth() {
  checkWebAuthnSupport();
  const options = await fetchVoteChallenge();
  const credential = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post("/auth/vote/verify", { credential });
  return data.voteToken;
}