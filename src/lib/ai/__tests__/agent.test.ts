import { describe, expect, it } from 'vitest';
import { analyzeReportWithAi, loadAiFinanceAgentInstructions } from '../agent';
import { getConfiguredAiProvider } from '@/lib/env/server-env';

describe('AI Finance Agent', () => {
  it('loads the runtime agent file from .agents', async () => {
    const agent = await loadAiFinanceAgentInstructions();
    expect(agent.source).toBe('file');
    expect(agent.content).toContain('AI_FINANCE_AGENT');
    expect(agent.content).toContain('Chưa đủ dữ liệu để kết luận');
  });

  it('selects Gemini when AI_PROVIDER=gemini and GEMINI_API_KEY is configured', () => {
    const oldProvider = process.env.AI_PROVIDER;
    const oldGeminiKey = process.env.GEMINI_API_KEY;
    const oldOpenAiKey = process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.OPENAI_API_KEY;
    expect(getConfiguredAiProvider()).toBe('gemini');
    if (oldProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = oldProvider;
    if (oldGeminiKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldGeminiKey;
    if (oldOpenAiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldOpenAiKey;
  });

  it('falls back to rule-based analysis when no AI provider key is configured', async () => {
    const oldProvider = process.env.AI_PROVIDER;
    const oldOpenAiKey = process.env.OPENAI_API_KEY;
    const oldGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const result = await analyzeReportWithAi();
    expect(result.mode).toBe('rule_based_missing_env');
    expect(result.provider).toBe('missing');
    expect(result.agentSource).toBe('file');
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.conclusion.length).toBeGreaterThan(0);
    if (oldProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = oldProvider;
    if (oldOpenAiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldOpenAiKey;
    if (oldGeminiKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldGeminiKey;
  });
});
