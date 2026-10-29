import { ethers } from "ethers";
import { env } from "../config/env";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

const VOTING_ABI = [
  "function registerVoter(address voter) external",
  "function registerCandidate(string name) external returns (uint256)",
  "function setElectionOpen(bool isOpen) external",
  "function castVote(uint256 candidateId) external",
  "function getResults() external view returns (uint256[])",
  "function isEligible(address) external view returns (bool)",
  "function hasVoted(address) external view returns (bool)",
  "function candidateCount() external view returns (uint256)",
  "event VoteCast(address indexed voter, uint256 indexed candidateId)",
  "event CandidateRegistered(uint256 indexed candidateId, string name)",
];

const RPC_URL = env.RPC_URL;
const CONTRACT_ADDRESS = env.VOTING_CONTRACT_ADDRESS;
const PRIVATE_KEY = env.DEPLOYER_PRIVATE_KEY;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

let sharedProvider: ethers.JsonRpcProvider | undefined;

function getProvider() {
  // Reused across calls instead of constructing a fresh JsonRpcProvider on
  // every invocation — a single vote cast alone can touch this several
  // times (eligibility check, contract read, cast, receipt lookup), and
  // recreating the provider each time throws away its connection/network
  // detection state for no benefit.
  if (!sharedProvider) {
    sharedProvider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return sharedProvider;
}

function getContract(withSigner = false) {
  const provider = getProvider();
  if (withSigner) {
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, wallet);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, provider);
}

/**
 * Every admin transaction (registerVoter, registerCandidate, setElectionOpen)
 * is signed by the same deployer key, and getContract(true) builds a fresh
 * Wallet each time, so two concurrent requests both ask the node for the
 * "pending" nonce and can receive the same value - one of the transactions
 * then fails with "nonce too low" / "replacement transaction underpriced".
 * This serialises deployer transactions so nonces are always sequential.
 */
let deployerQueue: Promise<unknown> = Promise.resolve();

function withDeployerLock<T>(task: () => Promise<T>): Promise<T> {
  const run = deployerQueue.then(task, task);
  // Keep the chain alive regardless of this task's outcome.
  deployerQueue = run.catch(() => undefined);
  return run;
}

export async function fundDeployerIfNeeded(): Promise<void> {
  // Warn about a missing deployment in every environment (this check used to
  // sit at the bottom of the function and was skipped by the early returns).
  if (CONTRACT_ADDRESS === ZERO_ADDRESS) {
    logger.warn(
      "VOTING_CONTRACT_ADDRESS is the zero address — run `node blockchain/compile.js && node blockchain/deploy.js` to deploy the contract, then restart the backend.",
    );
  }

  if (env.NODE_ENV !== "development") return;

  const provider = getProvider();
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const address = wallet.address;

  try {
    const balance = await provider.getBalance(address);
    const threshold = ethers.parseEther("1");

    if (balance >= threshold) {
      logger.info(`Deployer wallet OK: ${ethers.formatEther(balance)} ETH`, {
        address,
      });
      return;
    }

    const target = "0x" + (1000n * 10n ** 18n).toString(16);
    await provider.send("evm_setAccountBalance", [address, target]);

    const after = await provider.getBalance(address);
    logger.info(
      `Deployer wallet funded via evm_setAccountBalance: ${ethers.formatEther(after)} ETH`,
      { address },
    );
  } catch (err) {
    logger.warn(
      "Could not auto-fund deployer wallet (not a Ganache dev node?)",
      {
        address,
        error: String(err),
      },
    );
  }
}

export async function ensureVoterEligible(address: string): Promise<void> {
  const contract = getContract(false);
  try {
    const eligible = await contract.isEligible(address);
    if (eligible) return;
  } catch (err) {
    logger.warn("Could not check voter eligibility — proceeding to register", {
      address,
      error: String(err),
    });
  }

  try {
    await withDeployerLock(async () => {
      // Re-check inside the lock: a concurrent request may have registered
      // this address while we were waiting (registerVoter reverts on repeat).
      try {
        if (await getContract(false).isEligible(address)) return;
      } catch {
        // fall through and attempt registration
      }
      const signed = getContract(true);
      const tx = await signed.registerVoter(address);
      await tx.wait();
      logger.info("Voter registered on-chain", { address });
    });
  } catch (err) {
    logger.error("Failed to register voter on-chain", {
      address,
      error: String(err),
    });
    throw new AppError("Could not register voter on the blockchain", 500);
  }
}

export async function checkHasVoted(
  walletAddress: string,
): Promise<{ hasVoted: boolean }> {
  const contract = getContract(false);
  try {
    const voted: boolean = await contract.hasVoted(walletAddress);
    return { hasVoted: voted };
  } catch (err) {
    logger.warn("Could not check hasVoted on-chain — assuming not voted", {
      address: walletAddress,
      error: String(err),
    });
    return { hasVoted: false };
  }
}

export async function getCandidateCountOnChain(): Promise<number> {
  const contract = getContract(false);
  const count: bigint = await contract.candidateCount();
  return Number(count);
}

export async function castVoteAsUser(
  userPrivateKey: string,
  onChainCandidateId: number,
): Promise<{ txHash: string; blockNumber: number }> {
  const provider = getProvider();
  const userWallet = new ethers.Wallet(userPrivateKey, provider);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    VOTING_ABI,
    userWallet,
  );

  if (env.NODE_ENV === "development") {
    try {
      const balance = await provider.getBalance(userWallet.address);
      if (balance < ethers.parseEther("0.01")) {
        const target = "0x" + (10n * 10n ** 18n).toString(16);
        await provider.send("evm_setAccountBalance", [
          userWallet.address,
          target,
        ]);
        logger.info("Auto-funded user wallet for dev", {
          address: userWallet.address,
        });
      }
    } catch {}
  }

  try {
    const tx = await (contract as any).castVote(onChainCandidateId);
    const receipt = await tx.wait();
    logger.info("Vote cast on-chain", {
      voter: userWallet.address,
      candidateId: onChainCandidateId,
      txHash: receipt.hash,
    });
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (err: any) {
    const ganacheReason: string | undefined =
      err?.info?.error?.data?.reason ?? err?.info?.error?.message;
    const msg: string =
      ganacheReason ??
      err?.reason ??
      err?.shortMessage ??
      err?.message ??
      String(err);

    logger.error("castVote transaction failed", {
      voter: userWallet.address,
      candidateId: onChainCandidateId,
      code: err?.code,
      reason: err?.reason ?? null,
      shortMessage: err?.shortMessage ?? null,
      ganacheReason: ganacheReason ?? null,
      message: err?.message ?? null,
    });

    if (msg.includes("already voted") || msg.includes("hasVoted")) {
      throw new AppError("This wallet has already voted in this election", 409);
    }
    if (msg.includes("not eligible") || msg.includes("isEligible")) {
      throw new AppError("This wallet is not registered as eligible", 403);
    }
    if (msg.includes("election is not open") || msg.includes("electionOpen")) {
      throw new AppError(
        "Voting has just opened for this election but hasn't fully activated on-chain yet — please wait a few seconds and try again.",
        409,
      );
    }
    if (msg.includes("invalid candidate")) {
      throw new AppError("That candidate is not registered on-chain", 400);
    }
    if (msg.includes("paused")) {
      throw new AppError(
        "Voting is temporarily paused — please try again shortly",
        503,
      );
    }
    if (
      err?.code === "INSUFFICIENT_FUNDS" ||
      msg.toLowerCase().includes("insufficient funds")
    ) {
      throw new AppError(
        "Your voting wallet has no gas funds. In development this should auto-fund — " +
          "check that your local chain supports the funding RPC method used (Ganache's " +
          "evm_setAccountBalance); on other dev nodes (e.g. Anvil/Hardhat) you may need to " +
          "fund the wallet manually.",
        500,
      );
    }
    if (err?.code === "CALL_EXCEPTION" && !ganacheReason && !err?.reason) {
      throw new AppError(
        "The blockchain node didn't return a reason for this failure (missing revert data). " +
          "Check the backend logs for the full error, and confirm RPC_URL in backend/.env points at " +
          "a running, correctly-configured chain with the deployed contract.",
        500,
      );
    }
    throw new AppError("Failed to submit vote to the blockchain", 500);
  }
}

export async function verifyVoteTransaction(
  txHash: string,
  expectedVoter: string,
  expectedOnChainCandidateId: number,
): Promise<{ blockNumber: number }> {
  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt) {
    throw new AppError(
      "Transaction not found. It may still be pending - try again shortly.",
      404,
    );
  }
  if (receipt.status !== 1) {
    throw new AppError("Transaction failed on-chain", 400);
  }
  if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    throw new AppError("Transaction was not sent to the voting contract", 400);
  }

  const iface = new ethers.Interface(VOTING_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name !== "VoteCast") continue;

      const voter = String(parsed.args.voter).toLowerCase();
      const candidateId = Number(parsed.args.candidateId);
      if (
        voter === expectedVoter.toLowerCase() &&
        candidateId === expectedOnChainCandidateId
      ) {
        return { blockNumber: receipt.blockNumber };
      }
    } catch {
      continue;
    }
  }

  throw new AppError(
    "This transaction does not match a vote from your wallet for this candidate",
    400,
  );
}

export function getPublicContractInfo() {
  return { contractAddress: CONTRACT_ADDRESS, rpcUrl: RPC_URL };
}

export function listenForVoteEvents(
  onVote: (
    voter: string,
    candidateId: number,
    txHash: string,
    blockNumber: number,
  ) => void,
) {
  const contract = getContract(false);
  contract.on(
    "VoteCast",
    (
      voter: string,
      candidateId: bigint,
      event: { log: { transactionHash: string; blockNumber: number } },
    ) => {
      onVote(
        voter,
        Number(candidateId),
        event.log.transactionHash,
        event.log.blockNumber,
      );
    },
  );
}

export async function registerCandidateOnChain(name: string): Promise<number> {
  return withDeployerLock(() => registerCandidateOnChainUnlocked(name));
}

async function registerCandidateOnChainUnlocked(name: string): Promise<number> {
  const contract = getContract(true);
  try {
    const tx = await (contract as any).registerCandidate(name);
    const receipt = await tx.wait();

    if (receipt.logs.length === 0) {
      const code = await getProvider().getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        throw new AppError(
          `No contract deployed at VOTING_CONTRACT_ADDRESS (${CONTRACT_ADDRESS}) on this network. ` +
            `The transaction "succeeded" as a no-op because there's no code at that address. ` +
            `Redeploy the contracts and update VOTING_CONTRACT_ADDRESS in backend/.env, then restart the backend.`,
          500,
        );
      }
    }

    const iface = new ethers.Interface(VOTING_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "CandidateRegistered") {
          return Number(parsed.args.candidateId);
        }
      } catch {
        continue;
      }
    }
    throw new AppError("CandidateRegistered event not found in receipt", 500);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      `Failed to register candidate on-chain: ${err?.message ?? err}`,
      500,
    );
  }
}

export async function setElectionOpen(isOpen: boolean): Promise<void> {
  await withDeployerLock(async () => {
    const contract = getContract(true);
    const tx = await (contract as any).setElectionOpen(isOpen);
    await tx.wait();
  });
}

export async function getOnChainResults(): Promise<number[]> {
  const contract = getContract(false);
  const results: bigint[] = await contract.getResults();
  return results.map(Number);
}
