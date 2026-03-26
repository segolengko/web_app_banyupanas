'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkSupervisorAccess } from '@/utils/supabase/check-admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=Email dan password wajib diisi.')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?message=Email atau password salah. Silakan coba lagi.')
  }

  await checkSupervisorAccess()

  revalidatePath('/', 'layout')
  redirect('/')
}
