import type { LanguageModelUsage } from 'ai'
import type { UsageTracker } from './tracker'
import type { TrackingContext } from './types'

/**
 * Створює обгортки над AI SDK функціями з автоматичним трекінгом.
 *
 * Використання:
 *   const ai = createTrackedAI(tracker)
 *   const result = await ai.generateObject(() => generateObject({...}), 'gpt-4o-mini', ctx)
 */
export function createTrackedAI(tracker: UsageTracker) {
  function mapCtx(ctx: TrackingContext) {
    const { user, ...rest } = ctx
    return { ...rest, userInfo: user }
  }

  function extractUsage(usage: LanguageModelUsage) {
    return {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      cachedTokens: usage.inputTokenDetails?.cacheReadTokens ?? 0,
      reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? 0,
    }
  }

  return {
    /**
     * Обгортка над generateObject / generateText.
     * Трекає usage автоматично після отримання результату.
     */
    async generate<T>(
      fn: () => Promise<T & { usage: LanguageModelUsage }>,
      model: string,
      ctx: TrackingContext,
    ): Promise<T & { usage: LanguageModelUsage }> {
      const startTime = new Date()

      try {
        const result = await fn()

        tracker.record({
          ...mapCtx(ctx),
          model,
          ...extractUsage(result.usage),
          latencyMs: Date.now() - startTime.getTime(),
          isStreaming: false,
          status: 'success',
          requestedAt: startTime,
          completedAt: new Date(),
        })

        return result
      } catch (error) {
        tracker.record({
          ...mapCtx(ctx),
          model,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs: Date.now() - startTime.getTime(),
          isStreaming: false,
          status: 'error',
          errorMessage: (error as Error).message,
          requestedAt: startTime,
          completedAt: new Date(),
        })

        throw error
      }
    },

    /**
     * Повертає onFinish callback для streamText.
     * Підключається напряму в параметри streamText.
     *
     * streamText({
     *   ...params,
     *   onFinish: ai.onStreamFinish('openai/gpt-4o-mini', ctx),
     * })
     */
    onStreamFinish(model: string, ctx: TrackingContext) {
      const startTime = new Date()

      return (event: { totalUsage: LanguageModelUsage; text?: string }) => {
        tracker.record({
          ...mapCtx(ctx),
          model,
          ...extractUsage(event.totalUsage),
          latencyMs: Date.now() - startTime.getTime(),
          isStreaming: true,
          status: 'success',
          responseSummary: event.text ? event.text.slice(0, 500) : undefined,
          requestedAt: startTime,
          completedAt: new Date(),
        })
      }
    },
  }
}
