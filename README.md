<p align="center">
  <h1 align="center">SCLAW</h1>
  <p align="center">ShadowClawAI Pre-Execution Engine</p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> ·
    <a href="#cli">CLI</a> ·
    <a href="#api">API</a> ·
    <a href="#architecture">Architecture</a>
  </p>
</p>

---

Pre-execution engine that simulates Solana transactions, analyzes token security on-chain, and produces AI risk reports via CLAW agents — before you sign anything.

All data sourced from **Helius RPC mainnet**. Zero mocks. Zero fakes.

## What It Does

**Transaction Simulation** — Dry-run any Solana transaction via Helius `simulateTransaction`. See program logs, compute units, balance changes, and errors without touching the chain.

**Token Security Analysis** — Real-time on-chain checks: mint authority, freeze authority, holder concentration, whale detection, metadata verification. Every query hits mainnet.

**CLAW Agent Intelligence** — AI-powered risk assessment via LLM (Claude through OpenRouter). Structured reports with risk score 0-100, threat level, specific flags, and detailed analysis. Any LLM can serve as a CLAW agent — swap the model in config.

**Wallet Risk Profiling** — Analyze any Solana address: SOL balance, token holdings, transaction patterns, bot detection, counterparty analysis.

## Quick Start

```bash
git clone https://github.com/alc0hol120/SHADOWCLAW.git
cd SHADOWCLAW
npm install
```

Set your API keys:

```bash
export HELIUS_API_KEY=your-helius-key
export OPENROUTER_API_KEY=your-openrouter-key
```

Get a free Helius key at [helius.dev](https://helius.dev). Get an OpenRouter key at [openrouter.ai](https://openrouter.ai).

Start the server:

```bash
npm run server
```

Verify:

```bash
curl http://localhost:3001/api/health
# {"status":"CLAW Engine Online","version":"1.0.0"}

curl http://localhost:3001/api/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
# Returns USDC analysis + CLAW report
```

## npm

```bash
npm install sclaw-agent
```

## CLI

Requires the server running (`npm run server`).

```bash
npx tsx cli/index.ts token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

npx tsx cli/index.ts wallet <solana-address>

npx tsx cli/index.ts simulate <base64-transaction>

npx tsx cli/index.ts --help
```

Example output:

```
SCLAW — Token Security Analysis
Analyzing EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

  USDC USD Coin
  Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
  Supply: 8,680,309,682.51
  Decimals: 6
  Mintable: YES
  Freezable: YES
  Top 10 concentration: 0%

CLAW Agent Report
  Risk: 15/100 LOW
  USDC is a legitimate stablecoin but has centralized controls
```

## API

All endpoints return JSON. Server runs on port 3001 by default.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status check |
| `POST` | `/api/simulate/transaction` | Simulate a base64-encoded transaction |
| `POST` | `/api/simulate/preview` | Review executed transaction by signature |
| `GET` | `/api/token/:mint` | Full token security analysis + CLAW report |
| `GET` | `/api/token/:mint/history` | Recent token transactions via Helius |
| `GET` | `/api/risk/wallet/:address` | Wallet risk profile + CLAW report |
| `POST` | `/api/risk/analyze` | Free-form CLAW agent analysis |

### Simulate Transaction

```bash
curl -X POST http://localhost:3001/api/simulate/transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction": "<base64-encoded-tx>", "walletAddress": "<optional>"}'
```

Response:

```json
{
  "simulation": {
    "success": true,
    "logs": ["Program 111... invoke [1]", "Program 111... success"],
    "unitsConsumed": 150,
    "error": null
  },
  "preBalance": 0.39,
  "estimatedCostSOL": 0.00075,
  "clawAnalysis": {
    "riskScore": 15,
    "riskLevel": "LOW",
    "summary": "Standard system program transaction",
    "flags": [],
    "details": "..."
  }
}
```

### Token Analysis

```bash
curl http://localhost:3001/api/token/<mint-address>
```

Response includes: mint/freeze authority status, supply, decimals, top 10 holder distribution with whale alerts, and CLAW agent risk report.

### Wallet Risk

```bash
curl http://localhost:3001/api/risk/wallet/<address>
```

Response includes: SOL balance, token accounts, recent transactions with native/token transfers, and CLAW agent analysis of wallet behavior patterns.

## Architecture

```
server/
  index.ts              Express API (port 3001)
  config.ts             Helius + OpenRouter keys (env vars)
  lib/
    helius.ts           Solana mainnet RPC — simulateTransaction,
                        getTokenMetadata, getAsset, getBalance,
                        getTokenAccounts, getTransactionHistory
    claw-agent.ts       AI risk analysis — structured prompts,
                        JSON output parsing, fallback handling
    token-analysis.ts   On-chain security — mint/freeze authority,
                        holder concentration, whale detection
  routes/
    simulate.ts         POST /simulate/transaction, /simulate/preview
    token.ts            GET /token/:mint, /token/:mint/history
    risk.ts             GET /risk/wallet/:address, POST /risk/analyze
cli/
  index.ts              Terminal interface — token, wallet, simulate
```

### How It Works

1. Request comes in (API call, CLI command)
2. Server fetches real-time data from Solana via Helius RPC
3. For transactions: `simulateTransaction` with `replaceRecentBlockhash`
4. For tokens: mint account info, metadata, largest holders
5. For wallets: balance, token accounts, transaction history
6. All collected data is passed to CLAW agent (LLM)
7. CLAW agent returns structured risk report (score, level, flags, details)
8. Response sent back with raw data + AI analysis

### CLAW Agent

CLAW is the AI layer. It receives raw blockchain data and produces structured risk assessments. Under the hood it's an LLM (currently Claude via OpenRouter) with a specialized system prompt for blockchain risk analysis.

Any LLM can be a CLAW agent — swap the model in `server/lib/claw-agent.ts`. The prompt and output format stay the same.

Risk levels: `SAFE` (0-20) · `LOW` (21-40) · `MEDIUM` (41-60) · `HIGH` (61-80) · `CRITICAL` (81-100)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HELIUS_API_KEY` | Helius RPC API key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for CLAW agent | Yes |
| `PORT` | Server port (default: 3001) | No |

## Token Security Checks

| Check | What It Detects |
|-------|----------------|
| Mint Authority | Can new tokens be minted? Supply inflation risk |
| Freeze Authority | Can accounts be frozen? Honeypot risk |
| Holder Concentration | Top 10 wallet % of supply. Rug pull risk |
| Whale Detection | Single wallet >20% flagged |
| Metadata | Name, symbol, off-chain data verified |

## Stack

- **Helius RPC** — Solana mainnet data
- **Claude AI** via OpenRouter — CLAW agent intelligence
- **Express.js** — Backend API
- **TypeScript** — Everything

## License

MIT
