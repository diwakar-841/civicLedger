/**
 * Deploys the compiled Voting contract to your running Ganache instance
 * using ethers.js directly - no Hardhat runtime involved.
 *
 * Usage: node compile.js && node deploy.js
 *
 * FIX: After a successful deployment this script now also writes the new
 * contract address directly into backend/.env so you never have to copy it
 * manually. It replaces the VOTING_CONTRACT_ADDRESS line in-place (or
 * appends it if the key is missing).
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const ARTIFACTS_DIR = path.join(__dirname, "artifacts");
const BACKEND_ENV = path.join(__dirname, "..", "backend", ".env");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fund the deployer wallet using Ganache's evm_setAccountBalance before
 * deployment so the transaction doesn't revert with INSUFFICIENT_FUNDS.
 * This is a no-op on any network that doesn't support the method.
 *
 * @param {import("ethers").JsonRpcProvider} provider
 * @param {string} address  deployer wallet address (checksummed or lowercase)
 */
async function fundAddressIfNeeded(provider, address) {
  const balance = await provider.getBalance(address);
  const tenEth = ethers.parseEther("10");
  if (balance >= tenEth) return;          // already has plenty of gas money

  // 1000 ETH in hex wei — well above any realistic gas cost
  const target = "0x" + (1000n * 10n ** 18n).toString(16);

  try {
    await provider.send("evm_setAccountBalance", [address, target]);
    const after = await provider.getBalance(address);
    console.log(`Funded deployer: ${ethers.formatEther(after)} ETH (via evm_setAccountBalance)`);
  } catch {
    // Network doesn't support the Ganache-specific RPC — skip silently.
    // On a real network the user must fund the wallet themselves.
    console.warn("Could not auto-fund deployer (not a Ganache dev node?). Make sure the wallet has ETH.");
  }
}

/**
 * Write (or update) a single key=value line in a .env file.
 * If the key already exists its line is replaced in-place; otherwise
 * the new line is appended at the end.
 *
 * @param {string} filePath  absolute path to the .env file
 * @param {string} key       env var name (e.g. "VOTING_CONTRACT_ADDRESS")
 * @param {string} value     new value (unquoted)
 */
function patchEnvFile(filePath, key, value) {
  if (!fs.existsSync(filePath)) {
    // Create a minimal .env with just this key
    fs.writeFileSync(filePath, `${key}=${value}\n`);
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const keyPattern = new RegExp(`^${key}=`);
  let found = false;
  const updated = lines.map((line) => {
    if (keyPattern.test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) updated.push(`${key}=${value}`);

  fs.writeFileSync(filePath, updated.join("\n"));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function getSigner(provider) {
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    return new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  }
  // Ganache exposes pre-funded, unlocked accounts - use the first one.
  return provider.getSigner(0);
}

async function main() {
  const artifactPath = path.join(ARTIFACTS_DIR, "Voting.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Voting.json not found. Run "node compile.js" first.');
  }
  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = await getSigner(provider);
  const deployerAddress = await signer.getAddress();

  console.log("Deploying from:", deployerAddress);
  console.log("RPC:", RPC_URL);

  // FIX: fund deployer before attempting the deployment transaction
  await fundAddressIfNeeded(provider, deployerAddress);

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Voting contract deployed to:", address);

  // Save artifact
  fs.writeFileSync(
    path.join(__dirname, "deployed.json"),
    JSON.stringify({ address, abi }, null, 2)
  );
  console.log("Saved address + ABI to deployed.json");

  // FIX: automatically update backend/.env so the backend picks up the new
  // contract address on next start without any manual copy-paste.
  if (fs.existsSync(BACKEND_ENV)) {
    patchEnvFile(BACKEND_ENV, "VOTING_CONTRACT_ADDRESS", address);
    console.log(`Updated ${BACKEND_ENV} → VOTING_CONTRACT_ADDRESS=${address}`);
  } else {
    console.log(`backend/.env not found — set VOTING_CONTRACT_ADDRESS=${address} manually`);
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
