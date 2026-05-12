import { z } from 'zod'

export const MOODS = [
  'chill',
  'intense',
  'competitive',
  'adventurous',
  'thoughtful',
  'creative',
  'social',
  'nostalgic',
  'scary',
  'sad',
  'happy',
  'bored',
] as const

export const pickByMoodToolSchema = {
  description:
    'Pick games matching the user\'s emotional state or mood. Use when the user expresses how they feel (e.g. "I\'m bored", "want something relaxing", "feeling adventurous", "хочу щось чілове", "настрій погратись у щось страшне"). Returns games displayed as cards on the discover page. Always prefer this over search_games when the user describes a mood rather than a concrete game name or genre.',
  inputSchema: z.object({
    mood: z
      .enum(MOODS)
      .describe(
        'User\'s current mood. Map free-form input to the closest option: relaxed/cozy→chill, action-packed→intense, multiplayer/PvP→competitive, exploration/journey→adventurous, puzzle/strategy→thoughtful, building/sandbox→creative, with-friends→social, retro/old-school→nostalgic, horror→scary, emotional/story-heavy→sad, lighthearted/cute→happy, undecided→bored.',
      ),
    limit: z
      .number()
      .optional()
      .default(8)
      .describe('Max number of games to return'),
  }),
}

export type PickByMoodParams = z.infer<typeof pickByMoodToolSchema.inputSchema>
