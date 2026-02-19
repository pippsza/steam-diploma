import { z } from 'zod'

export const navigateToolSchema = {
  description: 'Navigate the user to a filtered game list on the home page. Shows game cards behind the chat modal.',
  parameters: z.object({
    genre: z.string().optional().describe('Filter by genre'),
    query: z.string().optional().describe('Search query'),
    isFree: z.boolean().optional().describe('Show only free games'),
    sortBy: z.enum(['popular', 'rating', 'recent', 'price']).optional().describe('Sort order'),
  }),
}

export type NavigateParams = z.infer<typeof navigateToolSchema.parameters>
