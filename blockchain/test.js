require("dotenv").config();
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:7545";

async function main() {
  const { abi, bytecode } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "artifacts", "Voting.json"), "utf8"),
  );

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const admin = await provider.getSigner(0);
  const voter1 = await provider.getSigner(1);
  const voter2 = await provider.getSigner(2);
  const outsider = await provider.getSigner(3);

  const factory = new ethers.ContractFactory(abi, bytecode, admin);
  const voting = await factory.deploy();
  await voting.waitForDeployment();
  console.log("Test deployment at:", await voting.getAddress());

  await (await voting.registerCandidate("Alice")).wait();
  await (await voting.registerCandidate("Bob")).wait();
  assert.strictEqual(
    Number(await voting.candidateCount()),
    2,
    "expected 2 candidates",
  );
  console.log("PASS: candidates registered");

  await (await voting.registerVoter(await voter1.getAddress())).wait();
  let revertedBeforeOpen = false;
  try {
    await (await voting.connect(voter1).castVote(1)).wait();
  } catch {
    revertedBeforeOpen = true;
  }
  assert.ok(revertedBeforeOpen, "expected revert before election opens");
  console.log("PASS: vote blocked before election opens");

  await (await voting.setElectionOpen(true)).wait();
  await (await voting.registerVoter(await voter2.getAddress())).wait();

  let revertedUnregistered = false;
  try {
    await (await voting.connect(outsider).castVote(1)).wait();
  } catch {
    revertedUnregistered = true;
  }
  assert.ok(revertedUnregistered, "expected revert for unregistered voter");
  console.log("PASS: unregistered voter blocked");

  await (await voting.connect(voter1).castVote(1)).wait();
  await (await voting.connect(voter2).castVote(2)).wait();

  let revertedDoubleVote = false;
  try {
    await (await voting.connect(voter1).castVote(2)).wait();
  } catch {
    revertedDoubleVote = true;
  }
  assert.ok(revertedDoubleVote, "expected revert on double vote");
  console.log("PASS: double vote blocked");

  const results = await voting.getResults();
  assert.strictEqual(Number(results[0]), 1, "Alice should have 1 vote");
  assert.strictEqual(Number(results[1]), 1, "Bob should have 1 vote");
  console.log("PASS: results tallied correctly");

  console.log("\nAll tests passed.");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
