# blockchain (Termux-compatible, no Hardhat)

Hardhat depends on native N-API binaries (`@nomicfoundation/edr-*`,
`@nomicfoundation/solidity-analyzer-*`) that are only published for a fixed
set of platforms - there is no `android-arm64` build. That's the real cause
of the HH18 error on Termux, not a config problem.

This folder replaces Hardhat with:

- **solc** (solc-js) - a pure JS/WASM build of the Solidity compiler. No
  native binaries, works on any platform Node.js runs on, including Termux.
- **ethers.js** - to deploy and interact with contracts over JSON-RPC.
- **Ganache** - your existing local chain (already running), used as the
  JSON-RPC target instead of `hardhat node`.

## Setup (Termux)

```bash
cd blockchain
npm install
cp .env.example .env
# Make sure Ganache is running and note its RPC URL (default http://127.0.0.1:7545)

node compile.js   # compiles contracts/ -> artifacts/*.json (abi + bytecode)
node deploy.js    # deploys Voting.sol to Ganache -> writes deployed.json
node test.js      # runs the core voting flow against a fresh deployment
```

## After deploying

Copy the address printed by `deploy.js` (also saved in `deployed.json`) into
`backend/.env` as `VOTING_CONTRACT_ADDRESS`, and point `RPC_URL` in
`backend/.env` at the same Ganache RPC URL used here.

## Known limitation: single global candidate list

`Voting.sol` tracks one flat `candidates` mapping and one `electionOpen`
flag for the whole contract - there is no on-chain concept of separate
elections. The backend layers a multi-election model on top in Postgres
(`elections`, `candidates.electionId`), but every candidate across every
election still shares the same global on-chain id space and the same
"is voting open" switch.

In practice this means:

- On-chain candidate ids must stay globally unique across all elections
  (the backend already enforces this by always registering candidates
  on-chain before inserting the DB row).
- Only one election can actually be "open" for on-chain voting at a time
  (`setElectionOpen`), even though the database can hold several
  elections in an `active` date range simultaneously.

Fixing this properly means adding an `electionId` parameter throughout
`Voting.sol` (candidate registration, `castVote`, `getResults`, and the
`isEligible`/`hasVoted` bookkeeping in `VoterRegistry.sol`) and redeploying.
That is a meaningful contract redesign, intentionally out of scope for this
security/UI pass - call it out to whoever owns the contract next.

## Files

- `contracts/` - unchanged Solidity source (Voting.sol, VoterRegistry.sol, interfaces/IVoting.sol)
- `compile.js` - solc-js compiler with local import resolution
- `deploy.js` - deploys the compiled contract via ethers.js
- `test.js` - plain Node test script exercising registration, eligibility, one-vote-per-address, and tallying
- `artifacts/` - generated ABI + bytecode JSON (git-ignored, regenerate with `node compile.js`)
- `deployed.json` - generated after `node deploy.js` (contract address + ABI)
