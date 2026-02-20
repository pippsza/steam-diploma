import { z } from 'zod'

export const openGameToolSchema = {
  description: 'Open a specific game page. Use this when the user wants to see details about a particular game.',
  inputSchema: z.object({
    game_name: z.string().describe('Name of the game to open'),
    appid: z.number().optional().describe('Steam app ID if known (optional)'),
  }),
}

export type OpenGameParams = z.infer<typeof openGameToolSchema.inputSchema>
