'use client';
import { useEffect, useRef, useState } from 'react';
const editors = new Set();
let leaving = false;
const hasChanges = () => [...editors].some(editor => editor.current);
const ask = () => !hasChanges() || window.confirm('Ada perubahan yang belum disimpan ke toko. Tinggalkan halaman ini?');
function leave(action) {
  if (!ask()) return;
  leaving = true;
  try { action(); } finally { setTimeout(() => { leaving = false; }, 1000); }
}
function beforeUnload(event) {
  if (!leaving && hasChanges()) { event.preventDefault(); event.returnValue = ''; }
}
function followLink(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !hasChanges()) return;
  const link = event.target.closest?.('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href, window.location.href);
  if (!['http:','https:'].includes(url.protocol) || (url.pathname === location.pathname && url.search === location.search && url.origin === location.origin)) return;
  event.preventDefault(); event.stopPropagation();
  leave(() => window.location.assign(url.href));
}
export default function useUnsavedChanges(value) {
  const snapshot = JSON.stringify(value);
  const [saved, setSaved] = useState(snapshot);
  const current = useRef(snapshot); current.current = snapshot;
  const dirty = snapshot !== saved;
  const active = useRef(dirty); active.current = dirty;
  useEffect(() => {
    if (!editors.size) { window.addEventListener('beforeunload', beforeUnload); document.addEventListener('click', followLink, true); }
    editors.add(active);
    return () => { editors.delete(active); if (!editors.size) { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', followLink, true); } };
  }, []);
  function markSaved(value) {
    const next = JSON.stringify(value);
    active.current = current.current !== next;
    setSaved(next);
  }
  return {dirty, markSaved, leave};
}
