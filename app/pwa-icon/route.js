import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET(request) {
  const requested = Number(new URL(request.url).searchParams.get('size'))
  const size = [180, 192, 512].includes(requested) ? requested : 192
  const maskable = new URL(request.url).searchParams.get('maskable') === '1'
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #0ea5a0 45%, #123b35 100%)',
          borderRadius: maskable ? 0 : size * 0.22,
          color: '#ffffff',
          fontSize: size * (maskable ? 0.26 : 0.32),
          fontWeight: 800,
          letterSpacing: -size * 0.01,
          fontFamily: 'sans-serif',
        }}
      >
        BGY
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } },
  )
}
