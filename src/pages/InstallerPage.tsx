import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Badge } from '../components/ui/Badge'
import { getInstallerById } from '../lib/supabase'
import { MOCK_INSTALLERS } from '../lib/mockData'
import type { Installer } from '../lib/types'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 0',
        borderBottom: '1px solid #EDE9E2',
        gap: '16px',
      }}
    >
      <span style={{ fontSize: '14px', color: '#78716C', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#1C1917', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function InstallerPage() {
  const { id } = useParams<{ id: string }>()
  const [installer, setInstaller] = useState<Installer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getInstallerById(id)
      .then(data => {
        setInstaller(data ?? MOCK_INSTALLERS.find(m => m.id === id) ?? null)
      })
      .catch(() => {
        setInstaller(MOCK_INSTALLERS.find(m => m.id === id) ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ height: '24px', background: '#F2EFE9', borderRadius: '4px', width: '40%', marginBottom: '40px' }} />
        <div style={{ height: '320px', background: '#FFFFFF', border: '1px solid #E5DFD5', borderRadius: '16px' }} />
      </div>
    )
  }

  if (!installer) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1C1917', marginBottom: '12px' }}>
          Installer not found
        </h2>
        <Link
          to="/"
          style={{
            color: '#D97706',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          ← Back to directory
        </Link>
      </div>
    )
  }

  const systemSizeRange = `${installer.min_system_size_kw >= 1000
    ? `${installer.min_system_size_kw / 1000} MW`
    : `${installer.min_system_size_kw} kW`} – ${
    installer.max_system_size_kw >= 1000
      ? `${installer.max_system_size_kw / 1000} MW`
      : `${installer.max_system_size_kw} kW`
  }`

  return (
    <div style={{ background: '#F8F6F2', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Dark header band */}
      <div
        style={{
          background: 'linear-gradient(160deg, #1C1917 0%, #292524 100%)',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#78716C',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              marginBottom: '28px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = '#D97706')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = '#78716C')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Installers
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#92400E',
                  flexShrink: 0,
                }}
              >
                {installer.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: 'clamp(1.5rem, 1rem + 2vw, 2rem)', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    {installer.name}
                  </h1>
                  {installer.verified && <Badge variant="verified">Verified</Badge>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', color: '#A8A29E' }}>{installer.city}</span>
                  <span style={{ color: '#44403C' }}>·</span>
                  <Badge variant="province">{installer.province}</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content card floats up */}
      <div style={{ maxWidth: '800px', margin: '-40px auto 0', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* About */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5DFD5',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 1px 4px rgba(28,25,23,0.06)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', marginBottom: '14px' }}>About</h2>
            <p style={{ fontSize: '15px', color: '#44403C', lineHeight: 1.7, margin: 0 }}>
              {installer.blurb}
            </p>
          </div>

          {/* Services */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5DFD5',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 1px 4px rgba(28,25,23,0.06)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', marginBottom: '16px' }}>Services</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {installer.services.map(service => (
                <Badge key={service} variant="service">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Details */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5DFD5',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 1px 4px rgba(28,25,23,0.06)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', marginBottom: '4px' }}>Details</h2>
            <div>
              <DetailRow label="Years in Business" value={`${installer.years_in_business} years`} />
              <DetailRow label="System Size Range" value={systemSizeRange} />
              <DetailRow label="Location" value={`${installer.city}, ${installer.province}`} />
              <DetailRow
                label="Verification Status"
                value={
                  installer.verified ? (
                    <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Verified Installer
                    </span>
                  ) : (
                    <span style={{ color: '#78716C' }}>Not yet verified</span>
                  )
                }
              />
            </div>
          </div>

          {/* Contact */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              border: '1px solid #FDE68A',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#92400E', marginBottom: '16px' }}>
              Get in Touch
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {installer.phone && (
                <a
                  href={`tel:${installer.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#1C1917',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91A16 16 0 0015.1 17.9l1.45-1.45a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {installer.phone}
                </a>
              )}
              {installer.email && (
                <a
                  href={`mailto:${installer.email}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#1C1917',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22,6 12,13 2,6" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {installer.email}
                </a>
              )}
              {installer.website && (
                <a
                  href={installer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '15px',
                    color: '#1C1917',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#D97706" strokeWidth="2" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {installer.website.replace('https://', '')}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
