import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = async ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  const fresh = await req.payload.findByID({ collection: 'users', id: req.user.id })
  return fresh?.role === 'admin'
}

/** Boolean-only version for field-level access (FieldAccess doesn't support Where) */
export const isAdminField: FieldAccess = async ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  const fresh = await req.payload.findByID({ collection: 'users', id: req.user.id })
  return fresh?.role === 'admin'
}

export const isAdminOrSelf: Access = async ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  const fresh = await req.payload.findByID({ collection: 'users', id: req.user.id })
  if (fresh?.role === 'admin') return true
  return { id: { equals: req.user.id } }
}
