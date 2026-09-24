import { createClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'
import { validateUpload } from '@/lib/media-validation'

async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
    return { error: Response.json({ error: 'Hubungkan Supabase untuk mengunggah media.' }, { status: 503 }) }
  }

  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return { error: auth.error }
  return { supabase }
}

export async function POST(request) {
  try {
    const auth = await getAdminClient()
    if (auth.error) return auth.error

    const input = await request.json()
    const { bucket, extension } = validateUpload(input)
    const folder = input.kind === 'cover' ? 'covers' : 'files'
    const path = `${folder}/${crypto.randomUUID()}.${extension}`
    const { data, error } = await auth.supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error) return Response.json({ error: 'Tautan unggah tidak dapat dibuat. Periksa bucket penyimpanan.' }, { status: 500 })

    return Response.json({ bucket, path: data.path, token: data.token }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message || 'Data unggahan tidak valid.' }, { status: 400 })
  }
}

export async function PUT(request) {
  try {
    const auth = await getAdminClient()
    if (auth.error) return auth.error

    const input = await request.json()
    const { bucket } = validateUpload(input)
    const expectedFolder = input.kind === 'cover' ? 'covers' : 'files'
    if (typeof input.path !== 'string' || !input.path.startsWith(`${expectedFolder}/`)) {
      return Response.json({ error: 'Lokasi file tidak valid.' }, { status: 400 })
    }

    const { data: publicData } = auth.supabase.storage.from(bucket).getPublicUrl(input.path)
    const media = {
      name: input.name,
      path: input.path,
      url: publicData.publicUrl,
      size: input.size,
      mime_type: input.type,
    }
    const { error } = await auth.supabase.from('media').insert(media)
    if (error) return Response.json({ error: 'File terunggah, tetapi informasinya gagal disimpan.' }, { status: 500 })

    return Response.json({ media: { ...media, bucket } })
  } catch (error) {
    return Response.json({ error: error.message || 'Data unggahan tidak valid.' }, { status: 400 })
  }
}
