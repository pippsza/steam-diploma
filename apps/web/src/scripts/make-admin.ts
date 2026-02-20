import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: pnpm tsx apps/web/src/scripts/make-admin.ts <email>')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (docs.length === 0) {
    console.error(`User with email "${email}" not found`)
    process.exit(1)
  }

  const user = docs[0]
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { role: 'admin' } as never,
  })

  console.log(`User "${user.name ?? email}" (${user.id}) is now admin`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
