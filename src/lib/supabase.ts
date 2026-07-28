import { createClient } from '@supabase/supabase-js'
import type { Installer } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getInstallers(): Promise<Installer[]> {
  const { data, error } = await supabase
    .from('installers')
    .select('*')
    .order('verified', { ascending: false })
    .order('years_in_business', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getInstallerById(id: string): Promise<Installer | null> {
  const { data, error } = await supabase
    .from('installers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
