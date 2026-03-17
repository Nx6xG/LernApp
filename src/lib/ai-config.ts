'use client';

export type AIProvider = 'anthropic' | 'openai' | 'server';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'lernapp_ai_config';

const defaultModels: Record<AIProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
  server: '',
};

export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') return { provider: 'server', apiKey: '', model: '' };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { provider: 'server', apiKey: '', model: '' };
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasCustomAI(): boolean {
  const config = getAIConfig();
  return config.provider !== 'server' && config.apiKey.length > 0;
}

export function getDefaultModel(provider: AIProvider): string {
  return defaultModels[provider] || '';
}
