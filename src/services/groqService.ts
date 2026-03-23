import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const PRIMARY_MODEL = process.env.GROQ_MODEL_PRIMARY!;
const FALLBACK_MODEL = process.env.GROQ_MODEL_FALLBACK!;

const SYSTEM_PROMPT = `You are ORION (Operational Reasoning Intelligence Orchestration Node), Nielless Acharya's personal AI. You are direct, logical, and practical — a systems thinker. No hype, no fluff. Challenge bad assumptions, surface logical flaws. Keep responses concise unless detail is specifically requested.`;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export const groqService = {
  async chat(history: Message[], userMessage: string): Promise<GroqResponse> {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const model = attempt < maxAttempts - 1 ? PRIMARY_MODEL : FALLBACK_MODEL;

      try {
        const response = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        });

        const content = response.choices[0]?.message?.content ?? '';
        const tokensUsed = response.usage?.total_tokens ?? 0;

        return { content, tokensUsed, model };
      } catch (err: any) {
        const isLast = attempt === maxAttempts - 1;

        if (isLast) {
          console.error(`[GroqService] All ${maxAttempts} attempts failed.`, err.message);
          throw err;
        }

        const backoffMs = 1000 * Math.pow(2, attempt);
        console.warn(`[GroqService] Attempt ${attempt + 1} failed on ${model}. Retrying in ${backoffMs}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    throw new Error('Groq service failed after max retries');
  },
};
