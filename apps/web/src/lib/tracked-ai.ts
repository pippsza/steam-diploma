import { createUsageTracker, createTrackedAI } from './usage-tracker'

const tracker = createUsageTracker({
  projectId: 'steam-diploma',
  environment: (process.env.NODE_ENV as 'production' | 'development') ?? 'development',
  buffer: {
    maxSize: 20,
    flushIntervalMs: 10_000,
  },
  project: {
    name: 'Steam Diploma',
    description: 'Steam clone with AI game search',
    url: process.env.NEXT_PUBLIC_APP_URL,
    techStack: 'Next.js 15 + PayloadCMS + Vercel AI SDK',
  },
})

export const ai = createTrackedAI(tracker)
export { tracker }
