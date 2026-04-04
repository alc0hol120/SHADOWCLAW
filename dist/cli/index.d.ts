#!/usr/bin/env node
declare const API_BASE: string;
declare const COLORS: {
    green: string;
    red: string;
    yellow: string;
    cyan: string;
    dim: string;
    bold: string;
    reset: string;
};
declare function c(color: keyof typeof COLORS, text: string): string;
declare function request(path: string, options?: RequestInit): Promise<any>;
declare function printRisk(analysis: any): void;
declare function tokenCmd(mint: string): Promise<void>;
declare function walletCmd(address: string): Promise<void>;
declare function simulateCmd(tx: string): Promise<void>;
declare function main(): Promise<void>;
