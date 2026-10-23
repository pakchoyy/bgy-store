import { handleMcp } from '@/lib/mcp/handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const run = (request) => handleMcp(request, null)
export { run as GET, run as POST, run as DELETE }
