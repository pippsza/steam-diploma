import { Filter } from 'bad-words'

const filter = new Filter()

export function censor(text: string): string {
  if (!text) return text
  try {
    return filter.clean(text)
  } catch {
    return text
  }
}

export function hasProfanity(text: string): boolean {
  if (!text) return false
  try {
    return filter.isProfane(text)
  } catch {
    return false
  }
}
