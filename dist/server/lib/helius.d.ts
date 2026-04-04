interface HeliusRpcRequest {
    method: string;
    params: unknown[];
}
export declare function heliusRpc(request: HeliusRpcRequest): Promise<unknown>;
export declare function simulateTransaction(encodedTx: string): Promise<{
    success: boolean;
    logs: string[];
    unitsConsumed: number;
    error: string | null;
    accounts: unknown[];
}>;
export declare function getTokenMetadata(mintAddress: string): Promise<unknown>;
export declare function getAsset(assetId: string): Promise<unknown>;
export declare function getBalance(address: string): Promise<number>;
export declare function getTokenAccounts(ownerAddress: string): Promise<unknown>;
export declare function getTransactionHistory(address: string, limit?: number): Promise<unknown>;
export declare function getParsedTransaction(signature: string): Promise<unknown>;
export {};
