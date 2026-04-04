export interface TokenSecurityReport {
    mint: string;
    name: string | null;
    symbol: string | null;
    supply: number | null;
    decimals: number | null;
    freezeAuthority: string | null;
    mintAuthority: string | null;
    isFreezable: boolean;
    isMintable: boolean;
    topHolders: {
        address: string;
        amount: number;
        percentage: number;
    }[];
    holderConcentration: number;
    lpInfo: {
        locked: boolean;
        pool: string | null;
    } | null;
    metadata: unknown;
    risks: string[];
}
export declare function analyzeToken(mintAddress: string): Promise<TokenSecurityReport>;
