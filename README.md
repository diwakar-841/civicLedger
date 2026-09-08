# Civic Ledger — Blockchain Voting System

A secure election platform that combines identity-verified voter onboarding, multi-factor authentication, and on-chain vote casting on an Ethereum-compatible blockchain, with an admin console for running elections end-to-end.

## Features

- **Verified voter onboarding** — registration with email/SMS OTP verification and an Aadhaar-format KYC check (12-digit format, Verhoeff checksum, and UIDAI numbering rules). This validates the *format* of an ID number; it is not a substitute for real UIDAI/government identity verification.
- **Strong authentication** — password login backed by TOTP-based two-factor authentication, plus WebAuthn/FIDO2 biometric login (via `@simplewebauthn`).
- **On-chain voting** — each vote is cast as a transaction against a `Voting.sol` smart contract, with a `VoterRegistry.sol` contract enforcing one-vote-per-address eligibility. Voters connect a crypto wallet (via `ethers.js`/MetaMask) to sign their vote.
- **Groups & elections** — organizations ("groups") can be created, have members added, and run their own elections with defined nomination and voting windows.
- **Candidate nomination workflow** — users can submit candidate requests for an election; admins review and approve/reject them.
- **Live, verifiable results** — results are tallied from cached on-chain vote data and rendered with charts; a background indexer keeps the local database in sync with chain events.
- **Admin dashboard** — manage groups, elections, candidates, voters, and view analytics, all gated behind an additional admin 2FA step.
- **Audit log** — a persistent record of sensitive admin and system actions.
- **Notifications** — in-app notifications for election lifecycle events, nominations, and account activity.
- **Scheduled jobs** — automatic election open/close reconciliation with the chain, cleanup of unverified registrations, and periodic blockchain event syncing.

## Architecture

This is a monorepo-style project with four independent workspaces:

```
PROJECT-2/
├── blockchain/   # Solidity contracts + a Hardhat-free compile/deploy pipeline
├── database/     # Shared Postgres schema & Drizzle ORM client (@voting/database)
├── backend/      # Express + TypeScript REST API
└── frontend/     # React + TypeScript SPA
```

The `blockchain` workspace intentionally avoids Hardhat — it uses `solc-js` (a pure JS/WASM Solidity compiler) and `ethers.js` to compile, deploy, and test contracts against any JSON-RPC endpoint (e.g. a local [Ganache](https://trufflesuite.com/ganache/) chain), which also makes it runnable in constrained environments like Termux.

> **Known contract limitation:** `Voting.sol` currently tracks a single global candidate list and one "is voting open" flag for the whole contract — there's no on-chain concept of separate elections. The backend layers a multi-election model on top in Postgres, but on-chain candidate IDs must stay globally unique, and only one election can be open for on-chain voting at a time. Supporting concurrent on-chain elections would require adding an `electionId` parameter throughout the contracts and redeploying.

## Tech Stack

**Blockchain**
- Solidity contracts (`Voting.sol`, `VoterRegistry.sol`, `IVoting.sol`)
- `solc` (solc-js) for compilation, `ethers.js` for deployment/interaction

**Database**
- PostgreSQL
- Drizzle ORM + drizzle-kit, published internally as the `@voting/database` package

**Backend**
- Node.js + Express + TypeScript (`tsx` for dev, compiled with `tsc`)
- Drizzle ORM (via `@voting/database`) over PostgreSQL
- `ethers.js` for reading/writing to the smart contracts
- JWT auth with `bcryptjs` password hashing
- `@simplewebauthn/server` (biometric login) and `otplib` (TOTP 2FA)
- `nodemailer` / `@emailjs/nodejs` (email) and Twilio (SMS OTP)
- `node-cron` for scheduled jobs
- `pino` for logging
- Helmet, `express-rate-limit`, `express-slow-down`, `hpp` for hardening

**Frontend**
- React 18 + TypeScript, built with Vite
- Tailwind CSS + Framer Motion
- `ethers.js` and `@simplewebauthn/browser` for wallet connection and biometric login
- Recharts for results visualizations
- React Router

## Project Structure

```
backend/src/
├── config/           # Environment validation
├── controllers/      # admin, auth, elections, kyc, results, votes, wallet
├── jobs/             # electionScheduler, syncBlockchainEvents, registrationCleanup
├── lib/              # audit, crypto, email, jwt, logger, cookies, sms
├── middlewares/       # auth, validation, rate limiting, error handling
├── routes/           # REST endpoints per domain
└── services/         # business logic (aadhaar, blockchain, kyc, vote, wallet, webauthn, totp ...)

database/schema/       # Drizzle table definitions (users, elections, candidates,
                        # candidateRequests, groups, groupActivity, votesCache,
                        # auditLog, sessions, webauthnCredentials, notifications)

blockchain/
├── contracts/         # Voting.sol, VoterRegistry.sol, interfaces/IVoting.sol
├── compile.js         # solc-js compiler with local import resolution
├── deploy.js          # deploys the compiled contract via ethers.js
└── test.js            # plain Node script exercising the voting flow

frontend/src/
├── components/        # admin/, auth/, voting/, candidates/, layout/, shared/...
├── contexts/          # Auth, Wallet, Theme, Toast
├── hooks/              # elections, votes, results, notifications, admin search ...
├── lib/                # apiClient, webauthn, electionRules, imageUpload
└── pages/              # public, auth, user, and admin/ route pages
```

## Prerequisites

- Node.js 18+
- PostgreSQL database
- A local or remote Ethereum-compatible JSON-RPC endpoint, e.g. [Ganache](https://trufflesuite.com/ganache/), for development
- A funded deployer wallet/private key for deploying and (in dev) auto-funding voter wallets
- (Production) EmailJS account, Twilio account for SMS OTP

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd PROJECT-2
```

### 2. Deploy the smart contracts

```bash
cd blockchain
npm install
cp .env.example .env   # set RPC_URL and your deployer key
node compile.js         # compiles contracts/ -> artifacts/*.json
node deploy.js           # deploys Voting.sol to your chain -> writes deployed.json
node test.js              # optional: sanity-checks the voting flow
```

Copy the deployed contract address into `backend/.env` as `VOTING_CONTRACT_ADDRESS`, and point `backend/.env`'s `RPC_URL` at the same chain.

### 3. Set up the database

```bash
cd ../database
npm install
# set DATABASE_URL in this workspace's .env
npm run push       # pushes the Drizzle schema to Postgres
```

### 4. Backend setup

```bash
cd ../backend
npm install
```

Create `backend/.env` with the variables listed below, then:

```bash
npm run dev      # runs the API with tsx watch + pino-pretty
```

### 5. Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env` with the variables listed below, then:

```bash
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No (default `development`) | `development` \| `test` \| `production` |
| `PORT` | No (default `5000`) | API server port |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | ≥32 chars — sign with `openssl rand -hex 32` |
| `AADHAAR_PEPPER` | Yes | ≥16 chars — secret pepper used when hashing Aadhaar numbers |
| `TOTP_ENCRYPTION_KEY` | Yes | ≥32 chars — encrypts stored TOTP secrets |
| `WALLET_ENCRYPTION_KEY` | Yes | ≥32 chars — encrypts stored wallet keys |
| `RPC_URL` | Yes | JSON-RPC URL of the chain the contracts are deployed to |
| `VOTING_CONTRACT_ADDRESS` | Yes | Deployed `Voting.sol` address (`0x...`) |
| `DEPLOYER_PRIVATE_KEY` | Yes | Private key used to fund/interact with the chain server-side |
| `CORS_ORIGIN` | No (default `http://localhost:5173`) | Allowed frontend origin(s), comma-separated |
| `WEBAUTHN_RP_NAME` | No (default `Civic Ledger`) | Relying party name for WebAuthn |
| `WEBAUTHN_RP_ID` | No (default `localhost`) | Relying party ID (domain) for WebAuthn |
| `WEBAUTHN_ORIGIN` | No (default `http://localhost:5173`) | Expected origin for WebAuthn ceremonies |
| `EMAILJS_SERVICE_ID` | Prod only | EmailJS service ID |
| `EMAILJS_OTP_TEMPLATE_ID` | Prod only | EmailJS template for OTP emails |
| `EMAILJS_LINK_TEMPLATE_ID` | No | EmailJS template for link-based emails (verify/reset) |
| `EMAILJS_PUBLIC_KEY` | Prod only | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | Prod only | EmailJS private key |
| `APP_BASE_URL` | Prod only | Public base URL used to build email links |
| `TWILIO_ACCOUNT_SID` | Prod only | Twilio account SID (SMS OTP) |
| `TWILIO_AUTH_TOKEN` | Prod only | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Prod only | Twilio sending number |
| `SKIP_INDEXER` | No | Set to skip the blockchain indexer/auto-funding on boot (useful for local dev without a funded chain) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_BACKEND_URL` | Base URL of the backend server |
| `VITE_RPC_URL` | JSON-RPC URL of the chain (for client-side reads) |
| `VITE_CONTRACT_ADDRESS` | Deployed `Voting.sol` address |
| `VITE_APP_NAME` | Display name shown in the UI |

### Database (`database/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Drizzle Kit |

### Blockchain (`blockchain/.env`)

| Variable | Description |
|---|---|
| `RPC_URL` | JSON-RPC endpoint to compile/deploy/test against (e.g. Ganache) |
| Deployer key | A private key with funds on that chain, used to deploy contracts |

## Database Scripts

Run from `database/`:

```bash
npm run push          # push schema changes to Postgres
npm run push:force    # force-push (accepts data loss warnings)
npm run studio        # open Drizzle Studio
npm run fix-db         # run fix-push-prompts.sql against DATABASE_URL
```

## Security Notes

- This project handles sensitive personal data (government-ID-format numbers, biometric credential metadata, private keys). Treat all `*_ENCRYPTION_KEY`, `*_PEPPER`, and `DEPLOYER_PRIVATE_KEY` values as production secrets — never commit them.
- Aadhaar validation here is a **format/checksum check only** and does not call any government verification API. Do not represent this as real identity verification in a production deployment without integrating an authorized UIDAI verification service.
- `Voting.sol`'s single global candidate list/open-flag design (see Architecture above) should be addressed before running multiple concurrent live elections in production.

## License
MIT license has been specified for this project.
