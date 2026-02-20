import { z } from 'zod'

export const navigateToolSchema = {
  description: 'Navigate the user to the search page with pre-applied filters. Only use this when the user explicitly asks to "go to", "show me the page", or browse the catalog. Do NOT use for recommendations or finding games — use search_games instead.',
  inputSchema: z.object({
    genre: z.string().optional().describe('Filter by genre'),
    query: z.string().optional().describe('Search query'),
    is_free: z.boolean().optional().describe('Show only free games'),
    sort_by: z.enum(['popular', 'rating', 'recent', 'price']).optional().describe('Sort order'),
  }),
}

export type NavigateParams = z.infer<typeof navigateToolSchema.inputSchema>
