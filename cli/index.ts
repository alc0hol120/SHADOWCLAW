#!/usr/bin/env node

const API_BASE = process.env.SCLAW_API || 'http://localhost:3001/api';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function c(color: keyof typeof COLORS, text: string) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function printRisk(analysis: any) {
  if (!analysis) return;
  const levelColor = analysis.riskLevel === 'SAFE' || analysis.riskLevel === 'LOW' ? 'green'
    : analysis.riskLevel === 'MEDIUM' ? 'yellow' : 'red';

  console.log(`\n${c('bold', 'CLAW Agent Report')}`);
  console.log(`  Risk: ${c(levelColor, `${analysis.riskScore}/100 ${analysis.riskLevel}`)}`);
  console.log(`  ${analysis.summary}`);
  if (analysis.flags?.length) {
    console.log(`\n  ${c('yellow', 'Flags:')}`);
    analysis.flags.forEach((f: string) => console.log(`    ${c('yellow', '▸')} ${f}`));
  }
  if (analysis.details) {
    console.log(`\n  ${c('dim', analysis.details)}`);
  }
}

async function tokenCmd(mint: string) {
  console.log(`\n${c('cyan', 'SCLAW')} ${c('dim', '— Token Security Analysis')}`);
  console.log(`${c('dim', 'Analyzing')} ${mint}\n`);

  const data = await request(`/token/${mint}`);
  const t = data.token;

  console.log(`  ${c('bold', t.symbol || 'Unknown')} ${c('dim', t.name || '')}`);
  console.log(`  Mint: ${c('dim', t.mint)}`);
  console.log(`  Supply: ${t.supply !== null && t.decimals !== null ? (t.supply / Math.pow(10, t.decimals)).toLocaleString() : 'N/A'}`);
  console.log(`  Decimals: ${t.decimals ?? 'N/A'}`);
  console.log(`  Mintable: ${t.isMintable ? c('red', 'YES') : c('green', 'NO')}`);
  console.log(`  Freezable: ${t.isFreezable ? c('red', 'YES') : c('green', 'NO')}`);
  console.log(`  Top 10 concentration: ${t.holderConcentration > 80 ? c('red', t.holderConcentration + '%') : t.holderConcentration > 50 ? c('yellow', t.holderConcentration + '%') : c('green', t.holderConcentration + '%')}`);

  if (t.risks?.length) {
    console.log(`\n  ${c('yellow', 'Risk Flags:')}`);
    t.risks.forEach((r: string) => console.log(`    ${c('yellow', '▸')} ${r}`));
  }

  if (t.topHolders?.length) {
    console.log(`\n  ${c('dim', 'Top Holders:')}`);
    t.topHolders.slice(0, 5).forEach((h: any, i: number) => {
      console.log(`    ${i + 1}. ${h.address.slice(0, 8)}...${h.address.slice(-6)}  ${h.amount.toLocaleString()}  ${h.percentage}%`);
    });
  }

  printRisk(data.clawAnalysis);
}

async function walletCmd(address: string) {
  console.log(`\n${c('cyan', 'SCLAW')} ${c('dim', '— Wallet Risk Analysis')}`);
  console.log(`${c('dim', 'Analyzing')} ${address}\n`);

  const data = await request(`/risk/wallet/${address}`);

  console.log(`  Balance: ${data.balanceSOL} SOL`);
  const txCount = data.recentTransactions?.length || 0;
  console.log(`  Recent transactions: ${txCount}`);

  if (data.recentTransactions?.length) {
    console.log(`\n  ${c('dim', 'Recent Activity:')}`);
    data.recentTransactions.slice(0, 5).forEach((tx: any) => {
      console.log(`    ${c('dim', tx.type || '?')} via ${tx.source || '?'}`);
    });
  }

  printRisk(data.clawAnalysis);
}

async function simulateCmd(tx: string) {
  console.log(`\n${c('cyan', 'SCLAW')} ${c('dim', '— Transaction Simulation')}\n`);

  const data = await request('/simulate/transaction', {
    method: 'POST',
    body: JSON.stringify({ transaction: tx }),
  });

  const sim = data.simulation;
  console.log(`  Result: ${sim.success ? c('green', 'SUCCESS') : c('red', 'FAILED')}`);
  console.log(`  Compute units: ${sim.unitsConsumed}`);
  if (sim.error) console.log(`  Error: ${c('red', sim.error)}`);
  if (data.estimatedCostSOL) console.log(`  Est. cost: ${data.estimatedCostSOL} SOL`);

  if (sim.logs?.length) {
    console.log(`\n  ${c('dim', 'Logs:')}`);
    sim.logs.slice(0, 10).forEach((l: string) => console.log(`    ${c('dim', l)}`));
  }

  printRisk(data.clawAnalysis);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg = args[1];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
${c('cyan', 'SCLAW')} ${c('dim', '— ShadowClawAI Pre-Execution Engine')}

${c('bold', 'Usage:')}
  sclaw token <mint-address>     Analyze token security
  sclaw wallet <address>         Wallet risk profile
  sclaw simulate <base64-tx>     Dry-run a transaction

${c('bold', 'Options:')}
  --api <url>                    Custom API endpoint (default: localhost:3001)

${c('dim', 'All data sourced from Helius RPC mainnet. AI analysis by CLAW agents.')}
`);
    return;
  }

  try {
    switch (cmd) {
      case 'token': await tokenCmd(arg); break;
      case 'wallet': await walletCmd(arg); break;
      case 'simulate': await simulateCmd(arg); break;
      default:
        console.error(`Unknown command: ${cmd}. Run sclaw --help`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n${c('red', 'Error:')} ${err.message}`);
    process.exit(1);
  }

  console.log('');
}

main();
