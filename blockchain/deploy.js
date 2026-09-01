require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const ARTIFACTS_DIR = path.join(__dirname, "artifacts");
const BACKEND_ENV = path.join(__dirname, "..", "backend", ".env");

async function fundAddressIfNeeded(provider, address) {
  const balance = await provider.getBalance(address);
  const tenEth = ethers.parseEther("10");
  if (balance >= tenEth) return;

  const target = "0x" + (1000n * 10n ** 18n).toString(16);

  try {
    await provider.send("evm_setAccountBalance", [address, target]);
    const after = await provider.getBalance(address);
    console.log(
      `Funded deployer: ${ethers.formatEther(after)} ETH (via evm_setAccountBalance)`,
    );
  } catch {
    console.warn(
      "Could not auto-fund deployer (not a Ganache dev node?). Make sure the wallet has ETH.",
    );
  }
}

function patchEnvFile(filePath, key, value) {
  if (!fs.existsSync(filePath)) {
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

async function getSigner(provider) {
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    return new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  }

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

  await fundAddressIfNeeded(provider, deployerAddress);

  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Voting contract deployed to:", address);

  fs.writeFileSync(
    path.join(__dirname, "deployed.json"),
    JSON.stringify({ address, abi }, null, 2),
  );
  console.log("Saved address + ABI to deployed.json");

  if (fs.existsSync(BACKEND_ENV)) {
    patchEnvFile(BACKEND_ENV, "VOTING_CONTRACT_ADDRESS", address);
    console.log(`Updated ${BACKEND_ENV} → VOTING_CONTRACT_ADDRESS=${address}`);
  } else {
    console.log(
      `backend/.env not found — set VOTING_CONTRACT_ADDRESS=${address} manually`,
    );
  }
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
