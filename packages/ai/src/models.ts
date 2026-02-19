export interface AIModelConfig {
  id: string
  name: string
  provider: 'google'
  modelId: string
  isDefault: boolean
}

/**
 * Hardcoded model configs for development.
 * In production, these are overridden by Payload Global values.
 */
export const defaultModels: AIModelConfig[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    modelId: 'gemini-2.5-flash-preview-05-20',
    isDefault: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    modelId: 'gemini-2.0-flash-lite',
    isDefault: false,
  },
]

export function getDefaultModel(): AIModelConfig {
  return defaultModels.find((m) => m.isDefault) ?? defaultModels[0]
}
