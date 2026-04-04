import { heliusRpc, getTokenMetadata } from './helius';
export async function analyzeToken(mintAddress) {
    const risks = [];
    const mintInfo = await heliusRpc({
        method: 'getAccountInfo',
        params: [mintAddress, { encoding: 'jsonParsed' }],
    });
    const parsed = mintInfo?.value?.data?.parsed?.info;
    const mintAuthority = parsed?.mintAuthority || null;
    const freezeAuthority = parsed?.freezeAuthority || null;
    const supply = parsed?.supply ? Number(parsed.supply) : null;
    const decimals = parsed?.decimals ?? null;
    const isMintable = mintAuthority !== null;
    const isFreezable = freezeAuthority !== null;
    if (isMintable)
        risks.push('MINT_AUTHORITY_ACTIVE — token supply can be increased');
    if (isFreezable)
        risks.push('FREEZE_AUTHORITY_ACTIVE — accounts can be frozen');
    let name = null;
    let symbol = null;
    let metadata = null;
    try {
        const metaResult = await getTokenMetadata(mintAddress);
        if (metaResult?.[0]) {
            metadata = metaResult[0];
            name = metaResult[0]?.onChainMetadata?.metadata?.data?.name ||
                metaResult[0]?.offChainMetadata?.metadata?.name || null;
            symbol = metaResult[0]?.onChainMetadata?.metadata?.data?.symbol ||
                metaResult[0]?.offChainMetadata?.metadata?.symbol || null;
        }
    }
    catch {
        risks.push('METADATA_FETCH_FAILED — could not retrieve token metadata');
    }
    let topHolders = [];
    let holderConcentration = 0;
    try {
        const holders = await heliusRpc({
            method: 'getTokenLargestAccounts',
            params: [mintAddress],
        });
        const totalSupply = supply && decimals !== null ? supply / Math.pow(10, decimals) : 0;
        topHolders = (holders?.value || []).slice(0, 10).map((h) => {
            const amount = Number(h.amount) / Math.pow(10, decimals || 0);
            const percentage = totalSupply > 0 ? (amount / totalSupply) * 100 : 0;
            return {
                address: h.address,
                amount,
                percentage: Math.round(percentage * 100) / 100,
            };
        });
        holderConcentration = topHolders.reduce((sum, h) => sum + h.percentage, 0);
        holderConcentration = Math.round(holderConcentration * 100) / 100;
        if (holderConcentration > 80) {
            risks.push(`HIGH_CONCENTRATION — top 10 holders own ${holderConcentration}% of supply`);
        }
        else if (holderConcentration > 50) {
            risks.push(`MODERATE_CONCENTRATION — top 10 holders own ${holderConcentration}% of supply`);
        }
        const bigWhale = topHolders.find(h => h.percentage > 20);
        if (bigWhale) {
            risks.push(`WHALE_ALERT — single holder owns ${bigWhale.percentage}% (${bigWhale.address.slice(0, 8)}...)`);
        }
    }
    catch {
        risks.push('HOLDER_ANALYSIS_FAILED — could not fetch holder data');
    }
    return {
        mint: mintAddress,
        name,
        symbol,
        supply,
        decimals,
        freezeAuthority,
        mintAuthority,
        isFreezable,
        isMintable,
        topHolders,
        holderConcentration,
        lpInfo: null,
        metadata,
        risks,
    };
}
