export interface ClawAnalysis {
    riskScore: number;
    riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    summary: string;
    flags: string[];
    details: string;
}
export declare function clawAnalyze(context: string): Promise<ClawAnalysis>;
