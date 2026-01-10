import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Root page - redirects based on access status
 * This prevents Next.js from compiling _not-found page
 * 
 * Note: Middleware also handles this redirect, but having a page here
 * ensures Next.js doesn't try to compile _not-found for the root path
 */
export default async function RootPage() {
  const cookieStore = await cookies()
  const accessCookie = cookieStore.get('ks_access')
  const hasAccess = accessCookie && accessCookie.value === '1'
  
  // Redirect based on access status
  // This is a fallback in case middleware doesn't catch it first
  if (hasAccess) {
    redirect('/swap?mode=intent')
  }
  
  redirect('/access')
}

