import { Response, NextFunction } from "express";
import { AuthedRequest } from "../middlewares/auth.middleware";
import { requestWalletNonce, bindWallet, generateServerWallet } from "../services/wallet.service";

export async function generate(req, res, next) {
  try {
    const result = await generateServerWallet(req.user.userId);
    res.status(201).json({
      ...result,
      message: "Wallet created and linked to your account. You can now cast votes."
    });
  } catch (err) {
    next(err);
  }
}

export async function nonce(req, res, next) {
  try {
    res.json(await requestWalletNonce(req.user.userId));
  } catch (err) {
    next(err);
  }
}

export async function verify(req, res, next) {
  try {
    const { address, signature } = req.body;
    res.json(await bindWallet(req.user.userId, address, signature));
  } catch (err) {
    next(err);
  }
}