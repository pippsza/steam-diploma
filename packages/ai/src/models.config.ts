import { defaultModels, getDefaultModel } from './models'
import type { AIModelConfig } from './models'

/**
 * Get the active model config.
 * In production, fetches from Payload Global with fallback to hardcoded defaults.
 * In development, uses hardcoded defaults directly.
 */
export async function getModelConfig(
  fetchFromGlobal?: () => Promise<AIModelConfig[] | null>,
): Promise<AIModelConfig> {
  if (process.env.NODE_ENV === 'production' && fetchFromGlobal) {
    try {
      const models = await fetchFromGlobal()
      if (models && models.length > 0) {
        return models.find((m) => m.isDefault) ?? models[0]
      }
    } catch {
      // Fallback to defaults
    }
  }

  return getDefaultModel()
}

export async function getAllModels(
  fetchFromGlobal?: () => Promise<AIModelConfig[] | null>,
): Promise<AIModelConfig[]> {
  if (process.env.NODE_ENV === 'production' && fetchFromGlobal) {
    try {
      const models = await fetchFromGlobal()
      if (models && models.length > 0) return models
    } catch {
      // Fallback
    }
  }

  return defaultModels
}
