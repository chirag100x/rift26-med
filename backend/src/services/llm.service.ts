import Groq from 'groq-sdk';
import { config } from '../config/env';

export interface ClinicalContext {
    drug: string;
    gene: string;
    phenotype: string;
    variants: string;
    recommendation: string;
    risk_level: string;
    mode: 'patient' | 'expert';
}

const groq = new Groq({
    apiKey: config.GROQ_API_KEY,
});

export class LlmService {
    private readonly MODEL = 'llama-3.3-70b-versatile';
    private readonly TIMEOUT_MS = 8000; // 8 seconds timeout

    /**
     * Generates a clinical pharmacogenomic explanation based on structured context.
     */
    public async generateExplanation(context: ClinicalContext): Promise<string> {
        try {
            const prompt = this.buildPrompt(context);

            const completion = await Promise.race([
                groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content:
                                'You are a clinical pharmacogenomics explanation assistant. You must only explain based on provided structured context. Do not invent dosing. Do not modify recommendations. Do not hallucinate additional variants. Explain biological mechanism, gene impact on metabolism, and why risk classification applies. Be 4–6 sentences.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    model: this.MODEL,
                    temperature: 0.3,
                    max_tokens: 300,
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('LLM Timeout')), this.TIMEOUT_MS)
                ),
            ]);

            // @ts-ignore - Groq types might strict check completion
            // Safe access
            const content = completion.choices[0]?.message?.content;
            return content || 'Explanation temporarily unavailable.';
        } catch (error) {
            console.error('LLM Generation Error:', error);
            return 'Explanation temporarily unavailable due to service disruption.';
        }
    }

    private buildPrompt(context: ClinicalContext): string {
        const baseContext = `
Drug: ${context.drug}
Gene: ${context.gene}
Phenotype: ${context.phenotype}
Variants: ${context.variants}
Risk Level: ${context.risk_level}
Clinical Recommendation: ${context.recommendation}
`;

        if (context.mode === 'expert') {
            return `
${baseContext}

Please provide a highly technical clinical explanation for a clinician/pharmacist.
- CITATIONS: You MUST include specific rsIDs (e.g., rs12345) and star alleles (e.g., *1/*17) if they are known for this gene/variant.
- MECHANISM: Describe the specific enzyme activity impact (e.g., "reduced catalytic activity of CYP2C19").
- PATHWAY: specific metabolic pathway details (e.g., "impaired conversion of prodrug to active metabolite").
- GUIDELINES: Reference standard CPIC or DPWG guidelines where relevant.
- PHARMACOKINETICS: Explain the pharmacokinetic consequences (AUC, clearance, half-life changes).
- TONE: Professional, concise, medical terminology.
`;
        } else {
            return `
${baseContext}

Please provide a very simple, reassuring explanation for a patient who has no medical training.
- ANALOGY: Use a simple analogy if helpful (e.g., "traffic jam", "broken key").
- CLARITY: Do NOT use complex medical jargon like "pharmacokinetics" or "metabolic pathways" without immediately simplifying it.
- FOCUS: Focus purely on "Is this medicine safe for me?" and "Do I need a different dose?".
- TONE: Empathetic, clear, calm.
- STRUCTURE: 
  1. What we found (simple terms).
  2. What it means for this medicine.
  3. Simple next step (e.g. "Discuss with your doctor").
- Do not mention rsIDs or star alleles.
`;
        }
    }
}

export const llmService = new LlmService();
