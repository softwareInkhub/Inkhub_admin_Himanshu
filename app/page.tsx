import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  // Check for actual SSO tokens (id_token or access_token)
  const idToken = cookies().get('id_token')?.value
  const accessToken = cookies().get('access_token')?.value
  
  const hasAuth = !!(idToken || accessToken)
  
  if (!hasAuth) {
    // Redirect to centralized auth with return URL
    const returnUrl = encodeURIComponent('https://admin.brmh.in/dashboard')
    redirect(`https://auth.brmh.in/login?next=${returnUrl}`)
  }
  
  redirect('/dashboard')
}