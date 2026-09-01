import { Response } from "express";
import { env } from "../config/env";

const IS_PROD = env.NODE_ENV === "production";

export function setRefreshCookie(res, rawToken) {
  res.cookie("refreshToken", rawToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    path: "/api/auth"
  });
}