import { Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { requestWalletNonce, bindWallet, generateServerWallet } from "../services/wallet.service";

/**
 * POST /wallet/generate
 *
 * Creates a fresh Ethereum wallet server-side, encrypts the private key, and
 * links the wallet address to the authenticated user's account.
 *
 * This is the recommended flow for Android / mobile users who don't have a
 * crypto wallet app. No wallet app, no seed phrase — just tap "Set Up Wallet"
 * and the server handles everything.
 */
export async function generate(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const result = await generateServerWallet(req.user!.userId);
    res.status(201).json({
      ...result,
      message: "Wallet created and linked to your account. You can now cast votes.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /wallet/nonce
 *
 * Step 1 of the manual (external) wallet binding flow.
 * Issues a one-time signing message for users who want to link their own
 * MetaMask / hardware wallet.
 *
 * Most users should use POST /wallet/generate instead.
 */
export async function nonce(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    res.json(await requestWalletNonce(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /wallet/verify
 *
 * Step 2 of the manual wallet binding flow.
 * Verifies the signature returned by the user's external wallet and links it.
 */
export async function verify(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { address, signature } = req.body;
    res.json(await bindWallet(req.user!.userId, address, signature));
  } catch (err) {
    next(err);
  }
}
