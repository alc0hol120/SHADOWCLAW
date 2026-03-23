import { HELIUS_RPC_URL, HELIUS_API_KEY, HELIUS_API_URL } from '../config';

interface HeliusRpcRequest {
  method: string;
  params: unknown[];
}

export async function heliusRpc(request: HeliusRpcRequest): Promise<unknown> {
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: request.method,
      params: request.params,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

export async function simulateTransaction(encodedTx: string): Promise<{
  success: boolean;
  logs: string[];
  unitsConsumed: number;
  error: string | null;
  accounts: unknown[];
}> {
  const result = await heliusRpc({
    method: 'simulateTransaction',
    params: [
      encodedTx,
      {
        encoding: 'base64',
        commitment: 'confirmed',
        replaceRecentBlockhash: true,
        accounts: {
          encoding: 'jsonParsed',
          addresses: [],
        },
      },
    ],
  }) as any;

  return {
    success: result.value.err === null,
    logs: result.value.logs || [],
    unitsConsumed: result.value.unitsConsumed || 0,
    error: result.value.err ? JSON.stringify(result.value.err) : null,
    accounts: result.value.accounts || [],
  };
}

export async function getTokenMetadata(mintAddress: string): Promise<unknown> {
  const res = await fetch(`${HELIUS_API_URL}/token-metadata?api-key=${HELIUS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mintAccounts: [mintAddress],
      includeOffChain: true,
      disableCache: false,
    }),
  });
  return res.json();
}

export async function getAsset(assetId: string): Promise<unknown> {
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAsset',
      params: { id: assetId },
    }),
  });
  const data = await res.json();
  return data.result;
}

export async function getBalance(address: string): Promise<number> {
  const result = await heliusRpc({
    method: 'getBalance',
    params: [address],
  }) as any;
  return result.value;
}

export async function getTokenAccounts(ownerAddress: string): Promise<unknown> {
  const result = await heliusRpc({
    method: 'getTokenAccountsByOwner',
    params: [
      ownerAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' },
    ],
  });
  return result;
}

export async function getTransactionHistory(address: string, limit = 10): Promise<unknown> {
  const res = await fetch(
    `${HELIUS_API_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`
  );
  return res.json();
}

export async function getParsedTransaction(signature: string): Promise<unknown> {
  const result = await heliusRpc({
    method: 'getTransaction',
    params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
  });
  return result;
}
