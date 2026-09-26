import { redirect } from 'next/navigation'

export default function SiteHealthRedirect() {
  redirect('/admin/settings?tab=sistem')
}
