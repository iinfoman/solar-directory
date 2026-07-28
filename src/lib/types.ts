export type Province =
  | 'Western Cape'
  | 'Gauteng'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Free State'
  | 'Northern Cape'

export type SystemSizeCategory = 'small' | 'medium' | 'large' | 'utility'

export interface Installer {
  id: string
  name: string
  city: string
  province: Province
  blurb: string
  services: string[]
  verified: boolean
  years_in_business: number
  min_system_size_kw: number
  max_system_size_kw: number
  phone: string | null
  email: string | null
  website: string | null
  created_at: string
}

export interface InstallerFilters {
  province: Province | ''
  systemSize: SystemSizeCategory | ''
  search: string
}
