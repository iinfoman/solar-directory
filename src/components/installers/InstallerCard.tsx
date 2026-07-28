import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Badge } from '../ui/Badge'
import type { Installer } from '../../lib/types'

interface InstallerCardProps {
  installer: Installer
  index: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  ['#FEF3C7', '#D97706'],
  ['#ECFDF5', '#059669'],
  ['#EFF6FF', '#2563EB'],
  ['#FDF4FF', '#9333EA'],
  ['#FFF7ED', '#EA580C'],
]

export function InstallerCard({ installer, index }: InstallerCardProps) {
  const [hovered, setHovered] = useState(false)
  const [bg, text] = AVATAR_COLORS[index % AVATAR_COLORS.length]

  const systemSizeLabel =
    installer.max_system_size_kw >= 10000
      ? 'Utility-scale'
      : installer.max_system_size_kw >= 2000
      ? 'Large C&I'
      : installer.max_system_size_kw >= 500
      ? 'Medium C&I'
      : 'Small Commercial'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/installer/${installer.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5DFD5',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
            boxShadow: hovered
              ? '0 8px 32px rgba(28,25,23,0.1), 0 2px 8px rgba(28,25,23,0.06)'
              : '0 1px 4px rgba(28,25,23,0.06)',
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            borderColor: hovered ? '#D97706' : '#E5DFD5',
            height: '100%',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: bg,
                color: text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {getInitials(installer.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1C1917',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {installer.name}
                </h3>
                {installer.verified && <Badge variant="verified">Verified</Badge>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#78716C' }}>
                  {installer.city}
                </span>
                <span style={{ color: '#D6D3D1', fontSize: '13px' }}>·</span>
                <Badge variant="province">{installer.province}</Badge>
              </div>
            </div>
          </div>

          {/* Blurb */}
          <p
            style={{
              fontSize: '14px',
              color: '#57534E',
              lineHeight: 1.65,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {installer.blurb}
          </p>

          {/* Services */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {installer.services.slice(0, 3).map(service => (
              <Badge key={service} variant="service">{service}</Badge>
            ))}
            {installer.services.length > 3 && (
              <Badge variant="service">+{installer.services.length - 3} more</Badge>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '14px',
              borderTop: '1px solid #EDE9E2',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Experience
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>
                  {installer.years_in_business} yrs
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Scale
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>
                  {systemSizeLabel}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: hovered ? '#B45309' : '#D97706',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.15s',
              }}
            >
              View Profile
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
