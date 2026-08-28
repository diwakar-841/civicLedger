import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import {
  verifyIdentity,
  verifyOtp,
  resendKycOtp as resendOtp,
} from "../services/kyc.service";
import {
  getRegistrationOptions,
  completeRegistration,
  getLoginAuthenticationOptions,
  verifyLoginBiometric,
  getAuthenticationOptions,
  verifyVoteAuth,
  verifyVotePinAuth,
  getCandidateRequestAuthenticationOptions,
  verifyCandidateRequestAuthentication,
} from "../services/webauthn.service";
import { setRefreshCookie } from "../lib/cookies";
import { candidateRequestService } from "../services/candidateRequest.service";

// ─── KYC ─────────────────────────────────────────────────────────────────────

export async function verifyIdentityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { kycToken, phone, dob } = req.body;
    const result = await verifyIdentity(kycToken, phone, dob);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { kycToken, otp } = req.body;
    const result = await verifyOtp(kycToken, otp);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resendOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { kycToken } = req.body;
    const { devOtp } = await resendOtp(kycToken);
    res.json({ message: "A new code has been sent to your phone", devOtp });
  } catch (err) {
    next(err);
  }
}

// ─── Biometric registration ───────────────────────────────────────────────────

export async function biometricRegisterOptionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { setupToken } = req.body;
    const options = await getRegistrationOptions(setupToken);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/biometric/register-verify
 *
 * FIX: now sets the httpOnly refreshToken cookie so token refresh works after
 * biometric registration. Previously completeRegistration discarded the
 * rawToken from createSession.
 */
export async function biometricRegisterVerifyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { setupToken, credential } = req.body;
    const result = await completeRegistration(setupToken, credential);
    setRefreshCookie(res, result.rawToken);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

// ─── Biometric login ──────────────────────────────────────────────────────────

export async function biometricLoginChallengeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { loginToken } = req.body;
    const options = await getLoginAuthenticationOptions(loginToken);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/biometric/login-verify
 *
 * FIX: removed PIN requirement (already in place). Also now sets the httpOnly
 * refreshToken cookie so token refresh works. Previously verifyLoginBiometric
 * discarded the rawToken from createSession, making silent token refresh
 * impossible and causing "Missing authorization token" errors once the
 * 15-minute access token expired.
 */
export async function biometricLoginVerifyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { loginToken, credential } = req.body;
    // `pin` from old clients is silently ignored
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

// ─── Vote authentication — biometric ─────────────────────────────────────────

/** POST /auth/vote/challenge  (requires Bearer session token) */
export async function voteChallengeHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const options = await getAuthenticationOptions(req.user!.userId);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/vote/verify  { credential }  (requires Bearer session token)
 *
 * Biometric vote auth — issues a short-lived voteToken.
 */
export async function voteVerifyHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { credential } = req.body;
    const result = await verifyVoteAuth(req.user!.userId, credential);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/vote/verify-pin  { pin }  (requires Bearer session token)
 *
 * PIN-based vote auth — alternative to biometric for users who prefer PIN.
 * Issues a short-lived voteToken identical to the biometric path.
 */
export async function votePinVerifyHandler(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { pin } = req.body;
    const result = await verifyVotePinAuth(req.user!.userId, pin);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestChallengeHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { requestId } = req.body;
    const options = await getCandidateRequestAuthenticationOptions(req.user!.userId, requestId);
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestVerifyHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { requestId, credential } = req.body;
    const authToken = await verifyCandidateRequestAuthentication(
      req.user!.userId,
      requestId,
      credential
    );
    res.json({ authToken });
  } catch (err) {
    next(err);
  }
}

export async function candidateRequestPinHandler(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { requestId, pin } = req.body;
    const authToken = await candidateRequestService.createAcceptAuthToken(
      req.user!.userId,
      requestId,
      pin
    );
    res.json({ authToken });
  } catch (err) {
    next(err);
  }
}
