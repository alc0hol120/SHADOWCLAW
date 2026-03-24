import { OPENROUTER_API_KEY, OPENROUTER_URL } from '../config';

const CLAW_SYSTEM_PROMPT = `You are CLAW (ShadowClawAI), a specialized AI agent for blockchain transaction analysis and risk assessment.

Your role:
- Analyze transaction simulation results and identify risks
- Detect potential rug pulls, honeypots, and scam patterns
- Assess smart contract risks based on on-chain data
- Provide clear, actionable risk reports

Rules:
- Be direct and precise. No fluff.
- Always provide a risk score from 0-100 (0 = safe, 100 = extreme danger)
- Categorize risks: SAFE, LOW, MEDIUM, HIGH, CRITICAL
- Flag specific red flags with evidence
- Never give financial advice, only technical risk analysis
- Use real data only, never fabricate information`;

export interface ClawAnalysis {
  riskScore: number;
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  flags: string[];
  details: string;
}

export async function clawAnalyze(context: string): Promise<ClawAnalysis> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://sclaw.ai',
      'X-Title': 'SCLAW - ShadowClawAI',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: CLAW_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following blockchain data and provide a risk assessment. Respond ONLY with valid JSON matching this schema:
{
  "riskScore": number (0-100),
  "riskLevel": "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "one-line summary",
  "flags": ["array of specific red flags"],
  "details": "detailed analysis"
}

Data to analyze:
${context}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
  }

  return {
    riskScore: -1,
    riskLevel: 'MEDIUM',
    summary: 'CLAW agent could not complete analysis',
    flags: ['Analysis incomplete — review manually'],
    details: content,
  };
}
