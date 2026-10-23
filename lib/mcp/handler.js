import { createHash, timingSafeEqual } from 'crypto'
import { rateLimited, tooMany, clientIp } from '@/lib/rate-limit'

const digest = (value) => createHash('sha256').update(String(value)).digest()
const sameSecret = (a, b) => timingSafeEqual(digest(a), digest(b))

// Deny by default: tanpa MCP_ADMIN_TOKEN (min 32 karakter) endpoint mati.
export function mcpToken() {
  const token = process.env.MCP_ADMIN_TOKEN || ''
  return token.length >= 32 ? token : null
}

function authorized(request, pathSecret) {
  const token = mcpToken()
  if (!token) return false
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (bearer && sameSecret(bearer, token)) return true
  if (pathSecret && sameSecret(pathSecret, token)) return true
  return false
}

export async function handleMcp(request, pathSecret) {
  if (!mcpToken()) return Response.json({ error: 'MCP belum diaktifkan' }, { status: 503 })

  if (!authorized(request, pathSecret)) {
    console.warn('[security] mcp auth gagal', { ip: clientIp(request) })
    // Pembatasan percobaan salah: 10 per 15 menit per IP.
    return rateLimited(request, 'mcp-auth-fail', 10, 15 * 60 * 1000) ? tooMany() : Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (rateLimited(request, 'mcp', 300, 60 * 1000)) return tooMany()

  const [{ WebStandardStreamableHTTPServerTransport }, { createMcpServer }] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'),
    import('@/lib/mcp/server'),
  ])
  // Stateless: server dan transport baru untuk tiap request (cocok untuk serverless).
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  const server = createMcpServer({ ip: clientIp(request) })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } catch (e) {
    console.error('[mcp] error', e)
    return Response.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
