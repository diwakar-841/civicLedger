import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import {
  verifyIdentity,
  verifyOtp,
  resendKycOtp as resendOtp 
} from
"../services/kyc.service";
import {
  getRegistrationOptions,
  completeRegistration,
  getLoginAuthenticationOptions,
  verifyLoginBiometric,
  getAuthenticationOptions,
  verifyVoteAuth,
  verifyVotePinAuth,
  getCandidateRequestAuthenticationOptions,
  verifyCandidateRequestAuthentication 
} from
"../services/webauthn.service";
import { setRefreshCookie } from "../lib/cookies";
import { candidateRequestService } from "../services/candidateRequest.service";

export async function verifyIdentityHandler(req, res, next) {
  try {
    const { kycToken, phone, dob } = req.body;
    const result = await verifyIdentity(kycToken, phone, dob);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpHandler(req, res, next) {
  try {
    const { kycToken, otp } = req.body;
    const result = await verifyOtp(kycToken, otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resendOtpHandler(req, res, next) {
  try {
    const { kycToken } = req.body;
    const { devOtp } = await resendOtp(kycToken);
    res.json({ message: "A new code has been sent to your phone", devOtp });
  } catch (err) {
    next(err);
  }
}

export async function biometricRegisterOptionsHandler(req, res, next) {
  try {
    const { setupToken } = req.body;
    const options = await getRegistrationOptions(setupToken);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function biometricRegisterVerifyHandler(req, res, next) {
  try {
    const { setupToken, credential } = req.body;
    const result = await completeRegistration(setupToken, credential);
    setRefreshCookie(res, result.rawToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function biometricLoginChallengeHandler(req, res, next) {
  try {
    const { loginToken } = req.body;
    const options = await getLoginAuthenticationOptions(loginToken);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function biometricLoginVerifyHandler(req, res, next) {
  try {
    const { loginToken, credential } = req.body;

    const result = await verifyLoginBiometric(
      loginToken,
      credential,
      req.headers["user-agent"],
      req.ip
    );
    setRefreshCookie(res, result.rawToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function voteChallengeHandler(req, res, next) {
  try {
    const options = await getAuthenticationOptions(req.user.userId);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function voteVerifyHandler(req, res, next) {
  try {
    const { credential } = req.body;
    const result = await verifyVoteAuth(req.user.userId, credential);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function votePinVerifyHandler(req, res, next) {
  try {
    const { pin } = req.body;
    const result = await verifyVotePinAuth(req.user.userId, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestChallengeHandler(
req,
res,
next)
{
  try {
    const { requestId } = req.body;
    const options = await getCandidateRequestAuthenticationOptions(req.user.userId, requestId);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestVerifyHandler(
req,
res,
next)
{
  try {
    const { requestId, credential } = req.body;
    const authToken = await verifyCandidateRequestAuthentication(
      req.user.userId,
      requestId,
      credential
    );
    res.json({ authToken });
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestPinHandler(
req,
res,
next)
{
  try {
    const { requestId, pin } = req.body;
    const authToken = await candidateRequestService.createAcceptAuthToken(
      req.user.userId,
      requestId,
      pin
    );
    res.json({ authToken });
  } catch (err) {
    next(err);
  }
}