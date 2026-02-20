export interface AIModelConfig {
  id: string
  name: string
  provider: 'openrouter' | 'google'
  modelId: string
  isDefault: boolean
  maxTokens?: number
}

export const defaultModels: AIModelConfig[] = [
  {
    id: 'openrouter-gpt-4o-mini',
    name: 'GPT-4o Mini (OpenRouter)',
    provider: 'openrouter',
    modelId: 'openai/gpt-4o-mini',
    isDefault: true,
    maxTokens: 300,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (fallback)',
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    isDefault: false,
  },
]

export function getDefaultModel(): AIModelConfig {
  return defaultModels.find((m) => m.isDefault) ?? defaultModels[0]
}
