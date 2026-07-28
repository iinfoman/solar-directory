import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { SearchBar } from '../components/installers/SearchBar'
import { InstallerCard } from '../components/installers/InstallerCard'
import { getInstallers } from '../lib/supabase'
import { MOCK_INSTALLERS } from '../lib/mockData'
import type { Installer, InstallerFilters, SystemSizeCategory } from '../lib/types'

const SYSTEM_SIZE_RANGES: Record<SystemSizeCategory, [number, number]> = {
  small: [0, 100],
  medium: [100, 500],
  large: [500, 5000],
  utility: [5000, Infinity],
}

function filterInstallers(installers: Installer[], filters: InstallerFilters): Installer[] {
  return installers.filter(installer => {
    if (filters.province && installer.province !== filters.province) return false

    if (filters.systemSize) {
      const [min, max] = SYSTEM_SIZE_RANGES[filters.systemSize]
      const overlaps =
        installer.max_system_size_kw >= min && installer.min_system_size_kw < max
      if (!overlaps) return false
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const haystack = [installer.name, installer.city, installer.province, installer.blurb, ...installer.services]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}

const STATS = [
  { value: '10+', label: 'Vetted Installers' },
  { value: '3', label: 'Major Cities' },
  { value: '9', label: 'Provinces' },
  { value: '100%', label: 'Commercial Focus' },
]

export function HomePage() {
  const [installers, setInstallers] = useState<Installer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<InstallerFilters>({
    province: '',
    systemSize: '',
    search: '',
  })

  useEffect(() => {
    getInstallers()
      .then(data => {
        setInstallers(data.length > 0 ? data : MOCK_INSTALLERS)
      })
      .catch(() => {
        // Fall back to mock data if Supabase isn't connected
        setInstallers(MOCK_INSTALLERS)
        setError(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => filterInstallers(installers, filters), [installers, filters])
  const verifiedCount = filtered.filter(i => i.verified).length

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(160deg, #1C1917 0%, #292524 55%, #3B2A1A 100%)',
          padding: 'clamp(64px, 10vw, 120px) 24px clamp(80px, 12vw, 140px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(217,119,6,0.15)',
                border: '1px solid rgba(217,119,6,0.3)',
                borderRadius: '9999px',
                padding: '6px 14px',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  flexShrink: 0,
                  boxShadow: '0 0 6px rgba(245,158,11,0.8)',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FDE68A', letterSpacing: '0.02em' }}>
                South Africa's Commercial Solar Directory
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 1.5rem + 4vw, 4.5rem)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                margin: '0 0 20px',
                maxWidth: '800px',
              }}
            >
              Find{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                vetted solar
              </span>{' '}
              installers for your business
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 0.85rem + 0.75vw, 1.25rem)',
                color: '#A8A29E',
                maxWidth: '580px',
                lineHeight: 1.65,
                margin: '0 0 48px',
              }}
            >
              Every installer in this directory has been reviewed for commercial and industrial capability. Compare experience, scale, and services — then make contact directly.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}
          >
            {STATS.map(stat => (
              <div key={stat.label}>
                <div
                  style={{
                    fontSize: 'clamp(1.5rem, 1rem + 2vw, 2.25rem)',
                    fontWeight: 700,
                    color: '#F59E0B',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#78716C', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Search + Results */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}
      >
        {/* Search bar floats up from hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: '-32px', marginBottom: '40px' }}
        >
          <SearchBar
            filters={filters}
            onChange={setFilters}
            totalCount={installers.length}
            filteredCount={filtered.length}
          />
        </motion.div>

        {/* Section header */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1C1917', margin: 0 }}>
              {filters.province || filters.systemSize || filters.search
                ? `${filtered.length} installer${filtered.length !== 1 ? 's' : ''} found`
                : 'All Installers'}
            </h2>
            {verifiedCount > 0 && (
              <span style={{ fontSize: '13px', color: '#78716C' }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>{verifiedCount} Verified</span>
                {' '}in results
              </span>
            )}
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              padding: '14px 18px',
              fontSize: '14px',
              color: '#92400E',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5DFD5',
                  borderRadius: '14px',
                  padding: '24px',
                  height: '260px',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#F2EFE9' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '16px', background: '#F2EFE9', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
                    <div style={{ height: '12px', background: '#F2EFE9', borderRadius: '4px', width: '40%' }} />
                  </div>
                </div>
                <div style={{ height: '12px', background: '#F2EFE9', borderRadius: '4px', marginBottom: '8px' }} />
                <div style={{ height: '12px', background: '#F2EFE9', borderRadius: '4px', width: '80%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1C1917', marginBottom: '8px' }}>
              No installers match your filters
            </h3>
            <p style={{ fontSize: '15px', color: '#78716C', marginBottom: '20px' }}>
              Try adjusting your province or system size, or clear all filters.
            </p>
            <button
              onClick={() => setFilters({ province: '', systemSize: '', search: '' })}
              style={{
                padding: '10px 20px',
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map((installer, i) => (
              <InstallerCard key={installer.id} installer={installer} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
