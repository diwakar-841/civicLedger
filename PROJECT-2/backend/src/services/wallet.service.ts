import crypto from "crypto";
import { ethers } from "ethers";
import { eq } from "drizzle-orm";
import { db, users } from "@voting/database";
import { sql } from "drizzle-orm";
import { ConflictError, UnauthorizedError } from "../lib/errors";
import { ensureVoterEligible } from "./blockchain.service";
import { recordAudit } from "../lib/audit";
import { encryptPrivateKey } from "../lib/crypto";
import { env } from "../config/env";

const NONCE_TTL_MS = 5 * 60 * 1000;

function buildNonceMessage(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  return [
    "Blockchain Voting System",
    "",
    "Sign this message to verify you own this wallet. This request will not",
    "trigger a blockchain transaction or cost any gas.",
    "",
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt}`,
  ].join("\n");
}

function isMessageExpired(message: string): boolean {
  const match = message.match(/Issued: (.+)$/m);
  if (!match) return true;
  return Date.now() - new Date(match[1]).getTime() > NONCE_TTL_MS;
}

export async function requestWalletNonce(userId: string) {
  const message = buildNonceMessage();
  await db
    .update(users)
    .set({ walletNonce: message })
    .where(eq(users.id, userId));
  return { message };
}

export async function bindWallet(
  userId: string,
  address: string,
  signature: string,
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.walletAddress) {
    // Re-binding would swap walletAddress while leaving any server-managed
    // encrypted key (and the old on-chain eligibility / hasVoted state)
    // behind, so votes would then be signed by a different address than the
    // one on record.
    throw new ConflictError("A wallet is already linked to your account");
  }
  if (!user?.walletNonce) {
    throw new ConflictError("Request a signing message first");
  }
  if (isMessageExpired(user.walletNonce)) {
    throw new ConflictError("Signing request expired - request a new one");
  }

  let recovered: string;
  try {
    recovered = ethers.verifyMessage(user.walletNonce, signature);
  } catch {
    throw new UnauthorizedError("Invalid signature");
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    throw new UnauthorizedError(
      "Signature does not match the provided wallet address",
    );
  }

  const normalizedAddress = recovered.toLowerCase();
  const existingOwner = await db.query.users.findFirst({
    where: eq(users.walletAddress, normalizedAddress),
  });
  if (existingOwner && existingOwner.id !== userId) {
    throw new ConflictError("This wallet is already linked to another account");
  }

  await db
    .update(users)
    .set({ walletAddress: normalizedAddress, walletNonce: null })
    .where(eq(users.id, userId));

  await ensureVoterEligible(normalizedAddress);
  await recordAudit(userId, "WALLET_BOUND", {
    walletAddress: normalizedAddress,
  });

  return { walletAddress: normalizedAddress };
}

export async function generateServerWallet(
  userId: string,
): Promise<{ walletAddress: string }> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    throw new ConflictError("User not found");
  }
  if (user.walletAddress) {
    throw new ConflictError("A wallet is already linked to your account");
  }

  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address.toLowerCase();
  const encryptedKey = encryptPrivateKey(
    wallet.privateKey,
    env.WALLET_ENCRYPTION_KEY,
  );

  // Conditional update: two concurrent "generate wallet" calls would both
  // pass the check above and the second would silently overwrite the first
  // wallet's encrypted key. Only the call that wins this UPDATE proceeds.
  const claimed = await db.execute(
    sql`UPDATE users SET wallet_address = ${address}, encrypted_private_key = ${encryptedKey}, wallet_nonce = NULL WHERE id = ${userId} AND wallet_address IS NULL RETURNING id`,
  );
  if (!(claimed.rows ?? (claimed as any)).length) {
    throw new ConflictError("A wallet is already linked to your account");
  }

  // Register the new address as eligible on-chain (deployer signs this call)
  await ensureVoterEligible(address);

  await recordAudit(userId, "WALLET_AUTO_GENERATED", {
    walletAddress: address,
  });

  return { walletAddress: address };
}

/**
 * Retrieve the decrypted private key for a user's server-managed wallet.
 * Returns null if the user has no server-managed wallet (e.g. they linked an
 * external wallet via bindWallet and have no encrypted key stored).
 *
 * This is intentionally package-private — only vote.service should call it.
 */
export async function getUserPrivateKey(
  userId: string,
): Promise<string | null> {
  const result = await db.execute(
    sql`SELECT encrypted_private_key FROM users WHERE id = ${userId}`,
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  const enc = row?.encrypted_private_key as string | null | undefined;
  if (!enc) return null;

  const { decryptPrivateKey } = await import("../lib/crypto");
  return decryptPrivateKey(enc, env.WALLET_ENCRYPTION_KEY);
}
