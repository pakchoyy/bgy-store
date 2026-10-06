let handler = null

export function setGlobalConfirmer(fn) {
  handler = typeof fn === 'function' ? fn : null
}

export async function requestConfirm(message) {
  if (handler) {
    try {
      return await handler(message)
    } catch {
      return false
    }
  }
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return window.confirm(message)
  }
  return false
}
