import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5DFD5',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(28,25,23,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1C1917',
                  letterSpacing: '-0.02em',
                }}
              >
                SolarDirectory
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#D97706',
                  display: 'block',
                  lineHeight: 1,
                  marginTop: '1px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                South Africa
              </span>
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#78716C',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.target as HTMLElement).style.color = '#1C1917'
              ;(e.target as HTMLElement).style.background = '#F2EFE9'
            }}
            onMouseLeave={e => {
              ;(e.target as HTMLElement).style.color = '#78716C'
              ;(e.target as HTMLElement).style.background = 'transparent'
            }}
          >
            Browse Installers
          </Link>
          <a
            href="mailto:hello@solardirectory.co.za"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#D97706',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.background = '#B45309')}
            onMouseLeave={e => ((e.target as HTMLElement).style.background = '#D97706')}
          >
            List Your Business
          </a>
        </nav>
      </div>
    </header>
  )
}
