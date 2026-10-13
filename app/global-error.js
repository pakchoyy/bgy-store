'use client'

export default function GlobalError({ reset }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f4f7f6' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 360, textAlign: 'center' }}>
            <h1 style={{ fontSize: 18, margin: 0 }}>Ups, ada kendala</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Coba muat ulang halaman ini.</p>
            <button type="button" onClick={() => reset()} style={{ background: '#10b981', color: '#fff', border: 0, borderRadius: 12, padding: '10px 16px', fontWeight: 600 }}>Coba lagi</button>
          </div>
        </main>
      </body>
    </html>
  )
}
