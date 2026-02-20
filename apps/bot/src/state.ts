interface SupportState {
  step: 'type' | 'priority' | 'message'
  type?: string
  priority?: string
}

const supportSessions = new Map<number, SupportState>()

export function getSupportState(userId: number): SupportState | undefined {
  return supportSessions.get(userId)
}

export function setSupportState(userId: number, state: SupportState) {
  supportSessions.set(userId, state)
}

export function clearSupportState(userId: number) {
  supportSessions.delete(userId)
}
