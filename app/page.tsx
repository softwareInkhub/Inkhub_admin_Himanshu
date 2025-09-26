import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  const hasAuth = cookies().get('auth')?.value === '1'
  if (!hasAuth) redirect('/auth')
  redirect('/dashboard')
}