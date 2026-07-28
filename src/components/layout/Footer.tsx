export function Footer() {
  return (
    <footer
      style={{
        background: '#1C1917',
        color: '#A8A29E',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>SolarDirectory SA</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, maxWidth: '240px' }}>
            The trusted marketplace for vetted commercial &amp; industrial solar installers across South Africa.
          </p>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Directory
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Browse Installers', 'Cape Town', 'Johannesburg', 'Durban'].map(item => (
              <li key={item}>
                <a href="/" style={{ color: '#A8A29E', fontSize: '14px', textDecoration: 'none' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#D97706')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#A8A29E')}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
            For Installers
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['List Your Business', 'Get Verified', 'Pricing'].map(item => (
              <li key={item}>
                <a href="mailto:hello@solardirectory.co.za" style={{ color: '#A8A29E', fontSize: '14px', textDecoration: 'none' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#D97706')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#A8A29E')}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #292524',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <p style={{ fontSize: '13px' }}>
          © 2026 SolarDirectory SA. All rights reserved.
        </p>
        <p style={{ fontSize: '13px' }}>
          Built for the South African clean-tech industry.
        </p>
      </div>
    </footer>
  )
}
