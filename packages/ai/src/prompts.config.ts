import { defaultPrompts, getDefaultSystemPrompt } from './prompts'
import type { AIPromptConfig } from './prompts'

export async function getSystemPrompt(
  fetchFromGlobal?: () => Promise<AIPromptConfig[] | null>,
): Promise<string> {
  if (process.env.NODE_ENV === 'production' && fetchFromGlobal) {
    try {
      const prompts = await fetchFromGlobal()
      if (prompts && prompts.length > 0) {
        const systemPrompt = prompts.find((p) => p.type === 'system')
        if (systemPrompt) return systemPrompt.content
      }
    } catch {
      // Fallback
    }
  }

  return getDefaultSystemPrompt()
}

export async function getAllPrompts(
  fetchFromGlobal?: () => Promise<AIPromptConfig[] | null>,
): Promise<AIPromptConfig[]> {
  if (process.env.NODE_ENV === 'production' && fetchFromGlobal) {
    try {
      const prompts = await fetchFromGlobal()
      if (prompts && prompts.length > 0) return prompts
    } catch {
      // Fallback
    }
  }

  return defaultPrompts
}
