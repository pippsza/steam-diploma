import { z } from 'zod'

export const openGameToolSchema = {
  description: 'Open a specific game page. Use this when the user wants to see details about a particular game.',
  parameters: z.object({
    appid: z.number().describe('Steam app ID of the game to open'),
    gameName: z.string().optional().describe('Name of the game (for display in chat)'),
  }),
}

export type OpenGameParams = z.infer<typeof openGameToolSchema.parameters>
