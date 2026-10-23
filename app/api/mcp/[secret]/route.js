import { handleMcp } from '@/lib/mcp/handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Alamat berisi rahasia: dipakai oleh connector yang tidak bisa mengirim header Authorization.
const run = (request, { params }) => handleMcp(request, params.secret)
export { run as GET, run as POST, run as DELETE }
