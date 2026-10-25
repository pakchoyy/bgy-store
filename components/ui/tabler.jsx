// Ikon Tabler (MIT) yang dipakai saja, disalin agar tidak perlu library tabler-icons-react.

function make(children) {
  return function TablerIcon({ size = 24, color = 'currentColor', strokeWidth = 2, ...rest }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest}>
        {children}
      </svg>
    )
  }
}

export const Bold = make(<><path d="M7 5h6a3.5 3.5 0 0 1 0 7h-6z" /><path d="M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7" /></>)
export const Italic = make(<><line x1="11" y1="5" x2="17" y2="5" /><line x1="7" y1="19" x2="13" y2="19" /><line x1="14" y1="5" x2="10" y2="19" /></>)
export const Underline = make(<><path d="M7 5v5a5 5 0 0 0 10 0v-5" /><path d="M5 19h14" /></>)
export const Strikethrough = make(<><line x1="5" y1="12" x2="19" y2="12" /><path d="M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5" /></>)
export const Eraser = make(<><path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" /><path d="M18 13.3l-6.3 -6.3" /></>)
export const List = make(<><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><line x1="5" y1="6" x2="5" y2="6.01" /><line x1="5" y1="12" x2="5" y2="12.01" /><line x1="5" y1="18" x2="5" y2="18.01" /></>)
export const ListNumbers = make(<><path d="M11 6h9" /><path d="M11 12h9" /><path d="M12 18h8" /><path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" /><path d="M6 10v-6l-2 2" /></>)
export const AlignLeft = make(<><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="18" y2="18" /></>)
export const AlignCenter = make(<><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="6" y1="18" x2="18" y2="18" /></>)
export const AlignRight = make(<><line x1="4" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="6" y1="18" x2="20" y2="18" /></>)
export const AlignJustified = make(<><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="16" y2="18" /></>)
export const Link = make(<><path d="M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5" /><path d="M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5" /></>)
export const Photo = make(<><line x1="15" y1="8" x2="15.01" y2="8" /><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 15l4 -4a3 5 0 0 1 3 0l5 5" /><path d="M14 14l1 -1a3 5 0 0 1 3 0l2 2" /></>)
export const BrandYoutube = make(<><rect x="3" y="5" width="18" height="14" rx="4" /><path d="M10 9l5 3l-5 3z" /></>)
export const Maximize = make(<><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></>)
export const Minimize = make(<><path d="M15 19v-2a2 2 0 0 1 2 -2h2" /><path d="M15 5v2a2 2 0 0 0 2 2h2" /><path d="M5 15h2a2 2 0 0 1 2 2v2" /><path d="M5 9h2a2 2 0 0 0 2 -2v-2" /></>)
export const Code = make(<><polyline points="7 8 3 12 7 16" /><polyline points="17 8 21 12 17 16" /><line x1="14" y1="4" x2="10" y2="20" /></>)
export const MoodSmile = make(<><circle cx="12" cy="12" r="9" /><line x1="9" y1="10" x2="9.01" y2="10" /><line x1="15" y1="10" x2="15.01" y2="10" /><path d="M9.5 15a3.5 3.5 0 0 0 5 0" /></>)
export const Wand = make(<><polyline points="6 21 21 6 18 3 3 18 6 21" /><line x1="15" y1="6" x2="18" y2="9" /><path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /><path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /></>)
export const Palette = make(<><path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" /><circle cx="8.5" cy="10.5" r="1" /><circle cx="12.5" cy="7.5" r="1" /><circle cx="16.5" cy="10.5" r="1" /></>)
export const ArrowBackUp = make(<><path d="M9 13l-4 -4l4 -4m-4 4h11a4 4 0 0 1 0 8h-1" /></>)
export const ArrowForwardUp = make(<><path d="M15 13l4 -4l-4 -4m4 4h-11a4 4 0 0 0 0 8h1" /></>)
export const ChevronDown = make(<><polyline points="6 9 12 15 18 9" /></>)
export const Books = make(<><rect x="5" y="4" width="4" height="16" rx="1" /><rect x="9" y="4" width="4" height="16" rx="1" /><path d="M5 8h4" /><path d="M9 16h4" /><path d="M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041z" /><path d="M14 9l4 -1" /><path d="M16 16l3.923 -.98" /></>)
export const Tools = make(<><path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4" /><line x1="14.5" y1="5.5" x2="18.5" y2="9.5" /><polyline points="12 8 7 3 3 7 8 12" /><line x1="7" y1="8" x2="5.5" y2="9.5" /><polyline points="16 12 21 17 17 21 12 16" /><line x1="16" y1="17" x2="14.5" y2="18.5" /></>)
export const Folders = make(<><path d="M9 4h3l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M17 17v2a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h2" /></>)
export const Bulb = make(<><path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" /><path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" /><line x1="9.7" y1="17" x2="14.3" y2="17" /></>)
export const ArrowRight = make(<><line x1="5" y1="12" x2="19" y2="12" /><line x1="13" y1="18" x2="19" y2="12" /><line x1="13" y1="6" x2="19" y2="12" /></>)
export const Download = make(<><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><polyline points="7 11 12 16 17 11" /><line x1="12" y1="4" x2="12" y2="16" /></>)
export const CircleCheck = make(<><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2l4 -4" /></>)
export const CircleX = make(<><circle cx="12" cy="12" r="9" /><path d="M10 10l4 4m0 -4l-4 4" /></>)
export const CreditCard = make(<><rect x="3" y="5" width="18" height="14" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></>)
export const Refresh = make(<><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></>)
export const BrandWhatsapp = make(<><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /><path d="M9 10a0.5 .5 0 0 0 1 0v-1a0.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a0.5 .5 0 0 0 0 -1h-1a0.5 .5 0 0 0 0 1" /></>)
export const ShieldCheck = make(<><path d="M9 12l2 2l4 -4" /><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /></>)
