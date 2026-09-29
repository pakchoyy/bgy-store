'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Eraser, List, ListNumbers, AlignLeft, AlignCenter, AlignRight, AlignJustified,
  Link as LinkIcon, Photo, BrandYoutube, Maximize, Minimize, Code, MoodSmile, Wand, Palette, ArrowBackUp, ArrowForwardUp, ChevronDown,
} from 'tabler-icons-react'
import { uploadMedia } from '@/lib/upload-media'

const BLOCKS = [
  { tag: 'P', label: 'Teks biasa', className: 'text-sm' },
  { tag: 'H2', label: 'Judul besar', className: 'text-lg font-bold' },
  { tag: 'H3', label: 'Judul kecil', className: 'text-base font-bold' },
  { tag: 'BLOCKQUOTE', label: 'Kutipan', className: 'text-sm italic border-l-4 border-emerald-300 pl-2' },
]
const SIZES = [12, 14, 16, 18, 20, 24, 28, 32]
const COLORS = ['#111827', '#4b5563', '#9ca3af', '#ffffff', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777']
const HIGHLIGHTS = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa']
const EMOJIS = '😀 😁 😂 😊 😍 🥰 😎 🤩 🤔 😅 🙏 👍 👏 🙌 💪 👇 👉 ✅ ❌ ⭐ 🌟 ✨ 🔥 💯 🎉 🎁 📚 📖 📝 ✏️ 📌 📎 📂 📄 🏫 👩‍🏫 👨‍🏫 🧑‍🎓 💡 ⏰ 📅 💰 🛒 ❤️ 💚 ⚡ 🚀 📢'.split(' ')

function youtubeId(url) {
  const match = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,20})/.exec(url || '')
  return match?.[1] || null
}

function toEditorHtml(value) {
  const text = value || ''
  if (/<[a-z][\s\S]*>/i.test(text) || !text.includes('\n')) return text
  return text.split(/\n{2,}/).map((part) => `<p>${part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export default function RichTextEditor({ value, onChange, placeholder = 'Tulis di sini...', minHeight = 220 }) {
  const editorRef = useRef(null)
  const rangeRef = useRef(null)
  const fileRef = useRef(null)
  const wrapperRef = useRef(null)
  const [menu, setMenu] = useState(null)
  const [codeView, setCodeView] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [empty, setEmpty] = useState(!value)

  useEffect(() => {
    const el = editorRef.current
    if (!el || codeView) return
    if (document.activeElement !== el && el.innerHTML !== (value || '')) el.innerHTML = toEditorHtml(value)
    setEmpty(!el.textContent.trim() && !el.querySelector('img,iframe'))
  }, [value, codeView])

  useEffect(() => {
    const onSelection = () => {
      const sel = window.getSelection()
      if (sel?.rangeCount && editorRef.current?.contains(sel.anchorNode)) rangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    document.addEventListener('selectionchange', onSelection)
    return () => document.removeEventListener('selectionchange', onSelection)
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = (e) => { if (!wrapperRef.current?.contains(e.target)) setMenu(null) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menu])

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [fullscreen])

  function saveRange() {
    const sel = window.getSelection()
    if (sel?.rangeCount && editorRef.current?.contains(sel.anchorNode)) rangeRef.current = sel.getRangeAt(0).cloneRange()
  }

  function restoreRange() {
    const el = editorRef.current
    el.focus()
    const sel = window.getSelection()
    if (rangeRef.current) {
      sel.removeAllRanges()
      sel.addRange(rangeRef.current)
    } else {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  function emit() {
    const el = editorRef.current
    setEmpty(!el.textContent.trim() && !el.querySelector('img,iframe'))
    onChange(el.innerHTML)
  }

  function exec(command, arg = null) {
    restoreRange()
    document.execCommand('styleWithCSS', false, ['foreColor', 'hiliteColor'].includes(command))
    document.execCommand(command, false, arg)
    saveRange()
    emit()
    setMenu(null)
  }

  function insertHtml(html) {
    restoreRange()
    document.execCommand('insertHTML', false, html)
    saveRange()
    emit()
    setMenu(null)
  }

  function setFontSize(px) {
    restoreRange()
    document.execCommand('styleWithCSS', false, false)
    document.execCommand('fontSize', false, '7')
    editorRef.current.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement('span')
      span.style.fontSize = `${px}px`
      span.innerHTML = font.innerHTML
      font.replaceWith(span)
    })
    saveRange()
    emit()
    setMenu(null)
  }

  function setHighlight(color) {
    restoreRange()
    document.execCommand('styleWithCSS', false, true)
    if (!document.execCommand('hiliteColor', false, color)) document.execCommand('backColor', false, color)
    saveRange()
    emit()
    setMenu(null)
  }

  function addLink() {
    saveRange()
    const url = window.prompt('Alamat link (contoh: https://wa.me/628xxx)')
    if (!url) return
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    const hasSelection = rangeRef.current && !rangeRef.current.collapsed
    if (hasSelection) {
      exec('createLink', href)
      editorRef.current.querySelectorAll(`a[href="${CSS.escape(href)}"]`).forEach((a) => { a.target = '_blank'; a.rel = 'noopener noreferrer' })
      emit()
    } else {
      insertHtml(`<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeAttr(url.trim())}</a>&nbsp;`)
    }
  }

  function addVideo() {
    saveRange()
    const url = window.prompt('Tempel link video YouTube')
    if (!url) return
    const id = youtubeId(url)
    if (!id) { window.alert('Link YouTube tidak dikenali. Contoh: https://youtu.be/abc123'); return }
    insertHtml(`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video" allowfullscreen></iframe><p><br></p>`)
  }

  async function addImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const media = await uploadMedia(file, 'cover')
      insertHtml(`<img src="${escapeAttr(media.url)}" alt="" /><p><br></p>`)
    } catch (err) {
      window.alert(err.message || 'Gambar gagal diunggah.')
    } finally {
      setUploading(false)
    }
  }

  function toggleCode() {
    if (codeView) {
      setCodeView(false)
    } else {
      onChange(editorRef.current.innerHTML)
      setCodeView(true)
    }
    setMenu(null)
  }

  const btn = 'flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-lg px-1.5 text-emerald-900 transition-colors hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-40'
  const keep = { onMouseDown: (e) => e.preventDefault() }
  const popover = 'absolute left-0 top-full z-30 mt-1 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200'

  function Tool({ title, onClick, children, disabled }) {
    return (
      <button type="button" title={title} aria-label={title} disabled={disabled || codeView} className={btn} {...keep} onClick={onClick}>
        {children}
      </button>
    )
  }

  function MenuButton({ id, title, children }) {
    return (
      <button type="button" title={title} aria-label={title} aria-expanded={menu === id} disabled={codeView} className={btn} {...keep} onClick={() => { saveRange(); setMenu(menu === id ? null : id) }}>
        {children}
        <ChevronDown size={12} aria-hidden="true" />
      </button>
    )
  }

  const icon = { size: 18, strokeWidth: 2, 'aria-hidden': true }

  return (
    <div
      ref={wrapperRef}
      className={fullscreen ? 'fixed inset-0 z-[70] flex flex-col bg-white p-3' : 'rounded-xl border border-gray-200 bg-white'}
    >
      <div className={`flex flex-wrap items-center gap-0.5 border-b border-emerald-100 bg-emerald-50/70 p-1.5 ${fullscreen ? 'rounded-xl' : 'rounded-t-xl'}`}>
        <div className="relative">
          <MenuButton id="block" title="Gaya paragraf"><Wand {...icon} /></MenuButton>
          {menu === 'block' && (
            <div className={`${popover} w-44`}>
              {BLOCKS.map((b) => (
                <button key={b.tag} type="button" {...keep} onClick={() => exec('formatBlock', b.tag)} className={`block w-full rounded-lg px-2 py-1.5 text-left hover:bg-emerald-50 ${b.className}`}>{b.label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <MenuButton id="size" title="Ukuran huruf"><span className="text-xs font-bold">Aa</span></MenuButton>
          {menu === 'size' && (
            <div className={`${popover} grid w-40 grid-cols-4 gap-1`}>
              {SIZES.map((s) => (
                <button key={s} type="button" {...keep} onClick={() => setFontSize(s)} className="rounded-lg py-1.5 text-xs font-bold hover:bg-emerald-50">{s}</button>
              ))}
            </div>
          )}
        </div>
        <Tool title="Tebal" onClick={() => exec('bold')}><Bold {...icon} /></Tool>
        <Tool title="Miring" onClick={() => exec('italic')}><Italic {...icon} /></Tool>
        <Tool title="Garis bawah" onClick={() => exec('underline')}><Underline {...icon} /></Tool>
        <Tool title="Coret" onClick={() => exec('strikeThrough')}><Strikethrough {...icon} /></Tool>
        <Tool title="Hapus format" onClick={() => exec('removeFormat')}><Eraser {...icon} /></Tool>
        <div className="relative">
          <MenuButton id="color" title="Warna huruf & stabilo"><Palette {...icon} /></MenuButton>
          {menu === 'color' && (
            <div className={`${popover} w-56`}>
              <p className="px-1 text-[11px] font-bold text-slate-500">Warna huruf</p>
              <div className="mt-1 grid grid-cols-6 gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={`Warna ${c}`} {...keep} onClick={() => exec('foreColor', c)} className="h-7 w-7 rounded-full ring-1 ring-slate-300" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 px-1 text-[11px] font-bold text-slate-500">Stabilo</p>
              <div className="mt-1 grid grid-cols-6 gap-1.5">
                {HIGHLIGHTS.map((c) => (
                  <button key={c} type="button" aria-label={c === 'transparent' ? 'Tanpa stabilo' : `Stabilo ${c}`} {...keep} onClick={() => setHighlight(c)} className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-red-500 ring-1 ring-slate-300" style={{ background: c === 'transparent' ? '#fff' : c }}>{c === 'transparent' ? '✕' : ''}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Tool title="Daftar poin" onClick={() => exec('insertUnorderedList')}><List {...icon} /></Tool>
        <Tool title="Daftar nomor" onClick={() => exec('insertOrderedList')}><ListNumbers {...icon} /></Tool>
        <div className="relative">
          <MenuButton id="align" title="Rata teks"><AlignLeft {...icon} /></MenuButton>
          {menu === 'align' && (
            <div className={`${popover} flex gap-1`}>
              <button type="button" aria-label="Rata kiri" className={btn} {...keep} onClick={() => exec('justifyLeft')}><AlignLeft {...icon} /></button>
              <button type="button" aria-label="Rata tengah" className={btn} {...keep} onClick={() => exec('justifyCenter')}><AlignCenter {...icon} /></button>
              <button type="button" aria-label="Rata kanan" className={btn} {...keep} onClick={() => exec('justifyRight')}><AlignRight {...icon} /></button>
              <button type="button" aria-label="Rata kiri-kanan" className={btn} {...keep} onClick={() => exec('justifyFull')}><AlignJustified {...icon} /></button>
            </div>
          )}
        </div>
        <Tool title="Sisipkan link" onClick={addLink}><LinkIcon {...icon} /></Tool>
        <Tool title="Sisipkan gambar" disabled={uploading} onClick={() => { saveRange(); fileRef.current?.click() }}>
          {uploading ? <span className="text-[10px] font-bold">...</span> : <Photo {...icon} />}
        </Tool>
        <Tool title="Sisipkan video YouTube" onClick={addVideo}><BrandYoutube {...icon} /></Tool>
        <div className="relative">
          <MenuButton id="emoji" title="Emoji"><MoodSmile {...icon} /></MenuButton>
          {menu === 'emoji' && (
            <div className={`${popover} grid w-64 grid-cols-8 gap-0.5`}>
              {EMOJIS.map((em) => (
                <button key={em} type="button" {...keep} onClick={() => exec('insertText', em)} className="rounded-md py-1 text-lg hover:bg-emerald-50">{em}</button>
              ))}
            </div>
          )}
        </div>
        <Tool title="Urungkan" onClick={() => exec('undo')}><ArrowBackUp {...icon} /></Tool>
        <Tool title="Ulangi" onClick={() => exec('redo')}><ArrowForwardUp {...icon} /></Tool>
        <button type="button" title={fullscreen ? 'Kecilkan' : 'Layar penuh'} aria-label={fullscreen ? 'Kecilkan' : 'Layar penuh'} className={btn} {...keep} onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <Minimize {...icon} /> : <Maximize {...icon} />}
        </button>
        <button type="button" title="Kode HTML" aria-label="Kode HTML" aria-pressed={codeView} className={`${btn} ${codeView ? 'bg-emerald-700 text-white hover:bg-emerald-800' : ''}`} {...keep} onClick={toggleCode}>
          <Code {...icon} />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={addImage} />

      {codeView ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className={`w-full resize-y bg-slate-900 p-3 font-mono text-xs text-emerald-100 outline-none ${fullscreen ? 'mt-2 flex-1 rounded-xl' : 'rounded-b-xl'}`}
          style={fullscreen ? undefined : { minHeight }}
        />
      ) : (
        <div className={`relative ${fullscreen ? 'mt-2 flex-1 overflow-y-auto rounded-xl ring-1 ring-slate-200' : ''}`}>
          {empty && <p className="pointer-events-none absolute left-4 top-3 text-sm text-gray-400">{placeholder}</p>}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            onInput={emit}
            className="rich-content min-h-full px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none"
            style={fullscreen ? undefined : { minHeight }}
          />
        </div>
      )}
    </div>
  )
}
